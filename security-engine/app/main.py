from __future__ import annotations

import hmac
import ipaddress
import os
import re
import socket
import ssl
from datetime import datetime, timezone
from typing import Literal

from cryptography import x509
from cryptography.hazmat.backends import default_backend
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field, field_validator

app = FastAPI(
    title="VulnPilot Security Engine",
    version="0.1.0",
    description="Restricted, evidence-based security checks for explicitly allowlisted assets.",
)

MAX_FILES = 100
MAX_FILE_BYTES = 100_000
MAX_TOTAL_BYTES = 1_000_000
CONNECT_TIMEOUT_SECONDS = 4
MAX_HTTP_HEADER_BYTES = 16_384


def normalize_host(value: str) -> str:
    value = value.strip().rstrip(".").lower()
    if value.startswith("https://"):
        value = value[8:]
    elif value.startswith("http://"):
        value = value[7:]
    value = value.split("/", 1)[0].split(":", 1)[0]
    try:
        host = value.encode("idna").decode("ascii")
    except UnicodeError as exc:
        raise ValueError("Invalid hostname") from exc
    pattern = r"(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?"
    if not host or not re.fullmatch(pattern, host):
        raise ValueError("Provide a valid hostname without a path or port")
    return host


def allowed_targets() -> set[str]:
    result: set[str] = set()
    for item in os.getenv("ALLOWED_TARGETS", "").split(","):
        if item.strip():
            try:
                result.add(normalize_host(item))
            except ValueError:
                continue
    return result


def require_api_key(x_engine_key: str | None = Header(default=None)) -> None:
    expected = os.getenv("ENGINE_API_KEY", "")
    if not expected:
        raise HTTPException(status_code=503, detail="Security engine is not configured: ENGINE_API_KEY is missing")
    if not x_engine_key or not hmac.compare_digest(x_engine_key, expected):
        raise HTTPException(status_code=401, detail="Invalid engine API key")


class WebCheckRequest(BaseModel):
    host: str = Field(min_length=3, max_length=253)
    authorized: bool

    @field_validator("host")
    @classmethod
    def valid_host(cls, value: str) -> str:
        try:
            return normalize_host(value)
        except ValueError as exc:
            raise ValueError(str(exc)) from exc


class RepoFile(BaseModel):
    path: str = Field(min_length=1, max_length=300)
    content: str = Field(max_length=MAX_FILE_BYTES)

    @field_validator("path")
    @classmethod
    def safe_relative_path(cls, value: str) -> str:
        path = value.replace("\\", "/")
        if path.startswith("/") or re.match(r"^[a-zA-Z]:", path) or any(part in {"..", ""} for part in path.split("/")):
            raise ValueError("File paths must be relative and cannot traverse directories")
        return path


class RepoCheckRequest(BaseModel):
    files: list[RepoFile] = Field(min_length=1, max_length=MAX_FILES)


class Finding(BaseModel):
    id: str
    title: str
    severity: Literal["critical", "high", "medium", "low", "informational"]
    confidence: Literal["high", "medium", "low"]
    category: str
    description: str
    evidence: str | None = None
    recommendation: str
    file: str | None = None
    line: int | None = None


class WebCheckResult(BaseModel):
    target: str
    checked_at: str
    resolved_addresses: list[str]
    findings: list[Finding]
    notes: list[str]


class RepoCheckResult(BaseModel):
    files_checked: int
    bytes_checked: int
    checked_at: str
    findings: list[Finding]
    notes: list[str]


@app.get("/", include_in_schema=False)
def index() -> FileResponse:
    return FileResponse(os.path.join(os.path.dirname(__file__), "index.html"))


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "vulnpilot-security-engine", "version": "0.1.0"}


def resolve_public_addresses(host: str) -> list[str]:
    try:
        answers = socket.getaddrinfo(host, 443, type=socket.SOCK_STREAM)
    except socket.gaierror as exc:
        raise HTTPException(status_code=422, detail="The target hostname could not be resolved") from exc
    addresses = sorted({answer[4][0].split("%", 1)[0] for answer in answers})
    if not addresses:
        raise HTTPException(status_code=422, detail="The target hostname has no A/AAAA addresses")
    # Reject the entire hostname if any answer is not globally routable. Connections
    # below use a validated IP, avoiding a second DNS lookup during connect.
    for address in addresses:
        try:
            parsed = ipaddress.ip_address(address)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail="DNS returned an invalid address") from exc
        if not parsed.is_global:
            raise HTTPException(status_code=403, detail="Private, loopback, link-local and reserved IP addresses are blocked")
    return addresses


def connect_tls(host: str, ip: str, verify: bool) -> tuple[ssl.SSLSocket, dict]:
    raw = socket.create_connection((ip, 443), timeout=CONNECT_TIMEOUT_SECONDS)
    raw.settimeout(CONNECT_TIMEOUT_SECONDS)
    context = ssl.create_default_context() if verify else ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    if not verify:
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
    wrapped = context.wrap_socket(raw, server_hostname=host)
    if verify:
        certificate = wrapped.getpeercert()
    else:
        der = wrapped.getpeercert(binary_form=True)
        parsed = x509.load_der_x509_certificate(der, default_backend())
        certificate = {"notAfter": parsed.not_valid_after_utc.strftime("%b %d %H:%M:%S %Y GMT")}
    return wrapped, certificate


def cert_expiry(cert: dict) -> datetime | None:
    value = cert.get("notAfter")
    if not value:
        return None
    try:
        return datetime.strptime(value, "%b %d %H:%M:%S %Y %Z").replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def get_headers_over_pinned_tls(host: str, ip: str) -> tuple[int | None, dict[str, str]]:
    sock: ssl.SSLSocket | None = None
    try:
        # Sends no credentials and follows no redirects. IP is pinned to a validated
        # DNS answer; hostname remains the TLS SNI and HTTP Host.
        sock, _ = connect_tls(host, ip, verify=False)
        request = f"HEAD / HTTP/1.1\r\nHost: {host}\r\nUser-Agent: VulnPilotSecurityEngine/0.1\r\nConnection: close\r\n\r\n"
        sock.sendall(request.encode("ascii"))
        response = bytearray()
        while len(response) < MAX_HTTP_HEADER_BYTES:
            chunk = sock.recv(min(2048, MAX_HTTP_HEADER_BYTES - len(response)))
            if not chunk:
                break
            response.extend(chunk)
            if b"\r\n\r\n" in response:
                break
        raw_headers = bytes(response).split(b"\r\n\r\n", 1)[0].decode("iso-8859-1", errors="replace")
        lines = raw_headers.split("\r\n")
        match = re.match(r"HTTP/\d(?:\.\d)?\s+(\d{3})", lines[0]) if lines else None
        headers: dict[str, str] = {}
        for line in lines[1:]:
            if ":" in line:
                key, value = line.split(":", 1)
                headers[key.strip().lower()] = value.strip()
        return (int(match.group(1)) if match else None), headers
    except (OSError, ssl.SSLError, TimeoutError):
        return None, {}
    finally:
        if sock is not None:
            sock.close()


@app.post("/v1/web-check", response_model=WebCheckResult, dependencies=[Depends(require_api_key)])
def web_check(body: WebCheckRequest) -> WebCheckResult:
    if not body.authorized:
        raise HTTPException(status_code=403, detail="Explicit authorization confirmation is required")
    host = body.host
    if host not in allowed_targets():
        raise HTTPException(status_code=403, detail="Target is not in ALLOWED_TARGETS; exact host allowlisting is required")

    addresses = resolve_public_addresses(host)
    findings: list[Finding] = []
    notes = [
        "Passive, non-destructive check. Only one unauthenticated HEAD request is sent over HTTPS.",
        "Redirects are not followed. Results describe observed configuration, not proof of exploitability.",
    ]
    ip = addresses[0]
    cert_info: dict = {}
    try:
        sock, cert_info = connect_tls(host, ip, verify=False)
        tls_version = sock.version() or "unknown"
        sock.close()
        findings.append(Finding(
            id="tls-handshake", title="TLS endpoint reachable", severity="informational", confidence="high",
            category="tls", description=f"A TLS handshake succeeded using {tls_version}.",
            evidence=f"IP: {ip}; TLS: {tls_version}",
            recommendation="Keep TLS configuration updated and disable obsolete protocol versions.",
        ))
    except (OSError, ssl.SSLError, TimeoutError) as exc:
        findings.append(Finding(
            id="tls-connect-failed", title="TLS connection failed", severity="medium", confidence="high",
            category="tls", description="The HTTPS endpoint did not complete a TLS handshake.",
            evidence=type(exc).__name__,
            recommendation="Check the HTTPS listener, certificate configuration and network availability.",
        ))

    if cert_info:
        expiry = cert_expiry(cert_info)
        if expiry:
            days_left = (expiry - datetime.now(timezone.utc)).days
            if days_left < 0:
                findings.append(Finding(
                    id="tls-cert-expired", title="TLS certificate expired", severity="high", confidence="high",
                    category="tls", description="The presented certificate is past its notAfter date.",
                    evidence=f"Expired at {expiry.isoformat()}",
                    recommendation="Renew and deploy a valid certificate, then verify the full chain.",
                ))
            elif days_left <= 14:
                findings.append(Finding(
                    id="tls-cert-expiring", title="TLS certificate expires soon", severity="medium", confidence="high",
                    category="tls", description=f"The certificate expires in {days_left} day(s).",
                    evidence=f"Expires at {expiry.isoformat()}",
                    recommendation="Renew the certificate before expiry and verify automated renewal.",
                ))
        try:
            verified, _ = connect_tls(host, ip, verify=True)
            verified.close()
        except ssl.SSLCertVerificationError as exc:
            findings.append(Finding(
                id="tls-cert-invalid", title="TLS certificate validation failed", severity="high", confidence="high",
                category="tls", description="The certificate chain or hostname validation failed using the system trust store.",
                evidence=str(exc.verify_message)[:300],
                recommendation="Deploy a valid certificate for this hostname and include the required intermediate certificates.",
            ))
        except (OSError, ssl.SSLError, TimeoutError):
            findings.append(Finding(
                id="tls-cert-validation-unavailable", title="TLS certificate validation could not complete",
                severity="low", confidence="medium", category="tls",
                description="A second handshake could not verify the certificate.",
                recommendation="Repeat the check and inspect certificate-chain configuration if the problem persists.",
            ))

    status, headers = get_headers_over_pinned_tls(host, ip)
    if status is not None:
        findings.append(Finding(
            id="http-head", title="HTTPS endpoint responded", severity="informational", confidence="high",
            category="http", description=f"The server returned HTTP {status} to a single HEAD request.",
            evidence=f"HTTP status: {status}",
            recommendation="Review the response alongside the application's expected public behavior.",
        ))
        header_checks = [
            ("strict-transport-security", "HSTS header absent", "low", "Enable Strict-Transport-Security after confirming all relevant subdomains support HTTPS."),
            ("x-content-type-options", "X-Content-Type-Options header absent", "low", "Consider setting X-Content-Type-Options: nosniff."),
            ("content-security-policy", "Content-Security-Policy header absent", "informational", "Review whether a Content-Security-Policy is appropriate for this application."),
            ("referrer-policy", "Referrer-Policy header absent", "informational", "Set a Referrer-Policy consistent with the application's privacy requirements."),
        ]
        for header, title, severity, recommendation in header_checks:
            if header not in headers:
                findings.append(Finding(
                    id=f"header-{header}", title=title, severity=severity, confidence="high",
                    category="http-headers", description=f"The response did not include the {header} header.",
                    evidence=f"HTTP {status}; header absent", recommendation=recommendation,
                ))
    else:
        notes.append("The HTTP response could not be read within the timeout.")

    return WebCheckResult(
        target=host, checked_at=datetime.now(timezone.utc).isoformat(),
        resolved_addresses=addresses, findings=findings, notes=notes,
    )


RULES: list[tuple[str, re.Pattern[str], str, str, str, str]] = [
    ("private-key", re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----"), "high", "Secrets",
     "A private-key marker was found in source content.", "Remove the key, rotate it, and move secrets to a dedicated secret store."),
    ("hardcoded-secret", re.compile(r"""(?i)\b(?:api[_-]?key|client[_-]?secret|access[_-]?token|password|passwd)\b\s*[:=]\s*(['"])([^'"\r\n]{8,})\1"""), "high", "Secrets",
     "A string assigned to a secret-like variable may contain a hardcoded credential.", "Rotate the credential if real, remove it from source control and load it from a secret manager."),
    ("shell-true", re.compile(r"(?i)subprocess\.(?:run|Popen|call|check_output)\s*\([^\n]{0,300}shell\s*=\s*True"), "high", "Command execution",
     "A subprocess call uses shell=True; risk depends on whether input can be influenced by a user.", "Prefer argument arrays with shell=False and validate any untrusted input."),
    ("tls-verify-disabled", re.compile(r"(?i)(?:verify\s*=\s*False|rejectUnauthorized\s*:\s*false)"), "medium", "TLS",
     "TLS certificate verification appears to be disabled.", "Restore certificate verification and configure the correct CA chain."),
    ("dynamic-eval", re.compile(r"\beval\s*\("), "medium", "Code execution",
     "Dynamic eval usage can execute code derived from strings.", "Avoid eval; use explicit parsing or a constrained interpreter where needed."),
    ("dangerously-set-html", re.compile(r"dangerouslySetInnerHTML\s*=|\.innerHTML\s*="), "medium", "Injection",
     "HTML is assigned dynamically; verify that untrusted content is sanitized.", "Prefer text rendering or use a vetted sanitizer with a strict allowlist."),
]


def redact_evidence(line: str, rule_id: str) -> str:
    if rule_id == "hardcoded-secret":
        return re.sub(
            r"""(?i)(\b(?:api[_-]?key|client[_-]?secret|access[_-]?token|password|passwd)\b\s*[:=]\s*['"])[^'"]+(['"])""",
            r"\1[REDACTED]\2", line,
        )[:240]
    if rule_id == "private-key":
        return "[PRIVATE KEY MATERIAL REDACTED]"
    return line.strip()[:240]


@app.post("/v1/repo-check", response_model=RepoCheckResult, dependencies=[Depends(require_api_key)])
def repo_check(body: RepoCheckRequest) -> RepoCheckResult:
    total_bytes = sum(len(item.content.encode("utf-8")) for item in body.files)
    if total_bytes > MAX_TOTAL_BYTES:
        raise HTTPException(status_code=413, detail=f"Total submitted content exceeds {MAX_TOTAL_BYTES} bytes")
    findings: list[Finding] = []
    seen: set[tuple[str, str, int]] = set()
    for item in body.files:
        if len(item.content.encode("utf-8")) > MAX_FILE_BYTES:
            raise HTTPException(status_code=413, detail=f"File exceeds the {MAX_FILE_BYTES}-byte limit: {item.path}")
        for line_number, line in enumerate(item.content.splitlines(), start=1):
            for rule_id, pattern, severity, category, description, recommendation in RULES:
                if pattern.search(line):
                    key = (item.path, rule_id, line_number)
                    if key in seen:
                        continue
                    seen.add(key)
                    findings.append(Finding(
                        id=f"{rule_id}:{item.path}:{line_number}",
                        title=rule_id.replace("-", " ").title(),
                        severity=severity, confidence="medium", category=category,
                        description=description, evidence=redact_evidence(line, rule_id),
                        recommendation=recommendation, file=item.path, line=line_number,
                    ))
    return RepoCheckResult(
        files_checked=len(body.files), bytes_checked=total_bytes,
        checked_at=datetime.now(timezone.utc).isoformat(), findings=findings,
        notes=[
            "Heuristic MVP: findings require human review and may be false positives.",
            "Submitted files are scanned as text; no scripts, package managers, build steps or repository code are executed.",
            "Secret-like evidence is redacted in responses. Do not submit production secrets or personal data.",
        ],
    )
