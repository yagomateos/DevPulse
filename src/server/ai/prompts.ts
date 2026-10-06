import type { Deployment, Incident, PullRequest } from '@/types/domain';

/** Compact, token-efficient textual context for the LLM. */

export function describePullRequest(pr: PullRequest) {
  const diff = pr.files
    .map((f) => {
      const body = f.hunks
        .map((h) => `${h.header}\n${h.lines.map((l) => `${l.kind === 'add' ? '+' : l.kind === 'remove' ? '-' : ' '}${l.newNumber ?? ''}\t${l.content}`).join('\n')}`)
        .join('\n');
      return `--- ${f.path} (${f.status}, +${f.additions}/-${f.deletions})\n${body}`;
    })
    .join('\n\n');
  return [
    `PR #${pr.number}: ${pr.title}`,
    `Author: ${pr.author} · ${pr.branch} → ${pr.baseBranch} · labels: ${pr.labels.join(', ') || 'none'}`,
    `Description:\n${pr.description}`,
    `Tests: ${pr.tests.passed} passed, ${pr.tests.failed} failed, ${pr.tests.skipped} skipped`,
    `Checks:\n${pr.checks.map((c) => `- ${c.name}: ${c.status} (${c.summary})`).join('\n')}`,
    `Commits:\n${pr.commits.map((c) => `- ${c.sha} ${c.message}`).join('\n')}`,
    `Review comments:\n${pr.comments.map((c) => `- [${c.kind}] ${c.author}${c.path ? ` on ${c.path}:${c.line}` : ''}: ${c.body}`).join('\n') || 'none'}`,
    `Diff:\n${diff}`,
  ].join('\n\n');
}

export function describeDeployment(d: Deployment, pr: PullRequest | null) {
  const { before, after } = d.performance;
  return [
    `Deployment #${d.number} (${d.environment}) — status ${d.status}`,
    `Commit ${d.commitSha}: ${d.commitMessage} by ${d.author} on ${d.branch}`,
    `Stages: ${d.stages.map((s) => `${s.name}=${s.status}`).join(', ')}`,
    `Tests: ${d.tests.passed} passed, ${d.tests.failed} failed`,
    `Changed files: ${d.changedFiles.map((f) => f.path).join(', ') || 'unknown'}`,
    `Metrics before: p95 ${before.p95LatencyMs}ms, error ${before.errorRate}%, ${before.throughputRps} rps, cpu ${before.cpuPercent}%`,
    after ? `Metrics after: p95 ${after.p95LatencyMs}ms, error ${after.errorRate}%, ${after.throughputRps} rps, cpu ${after.cpuPercent}%` : 'Metrics after: not available yet',
    `Logs:\n${d.logs.map((l) => `${l.timestamp} ${l.level.toUpperCase()} [${l.source}] ${l.message}`).join('\n')}`,
    pr ? `Source PR #${pr.number}: ${pr.title}` : '',
  ].join('\n');
}

export function describeIncident(i: Incident, d: Deployment | null, pr: PullRequest | null) {
  return [
    `${i.reference} ${i.severity.toUpperCase()} — ${i.title} (status ${i.status})`,
    `Service: ${i.service} · affected users: ${i.affectedUsers} · opened ${i.createdAt}`,
    `Description: ${i.description}`,
    `Timeline:\n${i.timeline.map((e) => `- ${e.occurredAt} [${e.type}] ${e.title}: ${e.description}${e.href ? ` (${e.href})` : ''}`).join('\n')}`,
    d ? `Related deployment:\n${describeDeployment(d, pr)}\nLink: /projects/${d.projectId}/deployments/${d.number}` : 'No related deployment recorded.',
  ].join('\n\n');
}
