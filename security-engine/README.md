# VulnPilot Security Engine — MVP

A restricted, evidence-based security analysis service intended to become the scanning engine behind DevPulse's future Security Center.

## Included

- `GET /health`: health check.
- `POST /v1/web-check`: DNS resolution, TLS handshake and certificate expiry/validation checks, plus one unauthenticated HTTPS `HEAD /` request for response headers.
- `POST /v1/repo-check`: heuristic source-text analysis for private-key markers, likely hardcoded secrets, `shell=True`, disabled TLS verification, `eval`, and dynamic HTML insertion.
- API key authentication, exact-host allowlisting, explicit authorization confirmation, DNS/IP validation, pinned-IP connections and redacted secret evidence.
- Repository content is scanned as text. No source code, package managers or build steps are executed.

## Limitations

This is an MVP, not a replacement for Semgrep, Gitleaks, OSV-Scanner or a professional penetration test. Repository checks are heuristic and can produce false positives and false negatives. Web checks are deliberately non-destructive: no subdomain enumeration, port scanning, crawling, redirect following or exploitation. Results are not persisted by this service; DevPulse integration should store them through its existing repository/data layer.

## Run locally

```bash
cd security-engine
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export ENGINE_API_KEY="$(python -c 'import secrets; print(secrets.token_urlsafe(32))')"
export ALLOWED_TARGETS="example.com,www.example.com"
uvicorn app.main:app --reload --port 8080
```

On Windows PowerShell, use `$env:ENGINE_API_KEY = "..."` and `$env:ALLOWED_TARGETS = "example.com"`.

## Docker

Build from this directory:

```bash
docker build -t vulnpilot-security-engine .
docker run --rm -p 127.0.0.1:8080:8080 \
  -e ENGINE_API_KEY="YOUR_LONG_RANDOM_KEY" \
  -e ALLOWED_TARGETS="example.com" \
  vulnpilot-security-engine
```

Keep the service on localhost or a private Docker network. Do not expose it directly to the public Internet. The container runs as a non-root user.

## API examples

```bash
curl http://127.0.0.1:8080/health

curl -X POST http://127.0.0.1:8080/v1/web-check \
  -H 'Content-Type: application/json' \
  -H 'X-Engine-Key: YOUR_LOCAL_KEY' \
  -d '{"host":"example.com","authorized":true}'

curl -X POST http://127.0.0.1:8080/v1/repo-check \
  -H 'Content-Type: application/json' \
  -H 'X-Engine-Key: YOUR_LOCAL_KEY' \
  -d '{"files":[{"path":"src/example.ts","content":"eval(input);"}]}'
```

The web endpoint rejects hosts not explicitly listed in `ALLOWED_TARGETS`, requests without `authorized: true`, and DNS results containing non-global IP addresses.

## Security notes

- Test only assets you own or are explicitly authorized to assess.
- Use a long random `ENGINE_API_KEY`; never commit real secrets.
- Keep the service private; only the authenticated DevPulse server should reach it.
- Add rate limits and persistent job tracking before multi-user or public deployment.
- Do not submit production secrets, credentials or personal data as repository content.
