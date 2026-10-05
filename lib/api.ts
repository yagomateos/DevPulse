import {
  projects,
  pullRequests,
  deployments,
  incidents,
  teamMembers,
  currentUser,
  dashboardMetrics,
  deploymentChartData,
  performanceChartData,
  activityFeed,
} from './mock-data';
import type {
  Project,
  PullRequest,
  Deployment,
  Incident,
  User,
  DashboardMetrics,
  DeploymentChartDataPoint,
  PerformanceChartDataPoint,
  ActivityFeedItem,
  AIPRAnalysis,
  AIDeploymentAnalysis,
  AIIncidentAnalysis,
} from '@/types';

function delay<T>(value: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function notFound(message: string): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(message)), 300)
  );
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<User> {
    if (email === 'demo@example.com' && password === 'demo123') {
      return delay(currentUser, 600);
    }
    return notFound('Invalid credentials. Use demo@example.com / demo123');
  },

  async getCurrentUser(): Promise<User> {
    return delay(currentUser, 100);
  },

  // Dashboard
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    return delay(dashboardMetrics);
  },

  async getDeploymentChart(): Promise<DeploymentChartDataPoint[]> {
    return delay(deploymentChartData);
  },

  async getPerformanceChart(): Promise<PerformanceChartDataPoint[]> {
    return delay(performanceChartData);
  },

  async getActivityFeed(): Promise<ActivityFeedItem[]> {
    return delay(activityFeed);
  },

  // Projects
  async getProjects(): Promise<Project[]> {
    return delay(projects);
  },

  async getProject(id: string): Promise<Project> {
    const project = projects.find((p) => p.id === id);
    if (!project) return notFound('Project not found');
    return delay(project);
  },

  // Pull Requests
  async getPullRequests(projectId?: string): Promise<PullRequest[]> {
    const prs = projectId
      ? pullRequests.filter((pr) => pr.projectId === projectId)
      : pullRequests;
    return delay(prs);
  },

  async getPullRequest(id: string): Promise<PullRequest> {
    const pr = pullRequests.find((p) => p.id === id);
    if (!pr) return notFound('Pull request not found');
    return delay(pr);
  },

  // Deployments
  async getDeployments(projectId?: string): Promise<Deployment[]> {
    const deps = projectId
      ? deployments.filter((d) => d.projectId === projectId)
      : deployments;
    return delay(deps);
  },

  async getDeployment(id: string): Promise<Deployment> {
    const dep = deployments.find((d) => d.id === id);
    if (!dep) return notFound('Deployment not found');
    return delay(dep);
  },

  // Incidents
  async getIncidents(projectId?: string): Promise<Incident[]> {
    const incs = projectId
      ? incidents.filter((i) => i.projectId === projectId)
      : incidents;
    return delay(incs);
  },

  async getIncident(id: string): Promise<Incident> {
    const inc = incidents.find((i) => i.id === id);
    if (!inc) return notFound('Incident not found');
    return delay(inc);
  },

  // Team
  async getTeamMembers(): Promise<User[]> {
    return delay(teamMembers);
  },

  // AI Analysis
  async analyzePR(prId: string): Promise<AIPRAnalysis> {
    const pr = pullRequests.find((p) => p.id === prId);
    if (!pr) return notFound('Pull request not found');

    const analyses: Record<string, AIPRAnalysis> = {
      'pr-1': {
        riskScore: 34,
        riskLevel: 'low',
        summary:
          'This PR introduces real-time collaboration indicators with WebSocket connections. The implementation is well-structured with proper reconnection logic and fallback to polling. The main areas of concern are around connection lifecycle management and potential memory leaks if components unmount without cleanup.',
        findings: [
          {
            id: 'f1',
            category: 'Performance',
            severity: 'low',
            title: 'WebSocket reconnection could benefit from exponential backoff',
            description:
              'The current reconnection strategy uses a fixed 3-second delay. An exponential backoff with jitter would be more resilient under adverse network conditions.',
            file: 'src/hooks/useCollaboration.ts',
            line: 42,
            suggestion:
              'Consider using a backoff strategy starting at 1s, doubling up to 30s max, with random jitter.',
          },
          {
            id: 'f2',
            category: 'Maintainability',
            severity: 'low',
            title: 'Presence state could be typed more strictly',
            description:
              'The presence state uses a loosely typed Record. A dedicated Presence interface would improve type safety and developer experience.',
            file: 'src/types/collaboration.ts',
            line: 15,
          },
          {
            id: 'f3',
            category: 'Testing',
            severity: 'medium',
            title: 'Missing test for concurrent disconnect scenario',
            description:
              'The reconnection logic is not tested for the case where multiple components disconnect simultaneously. This could lead to race conditions in the connection manager.',
            file: 'src/hooks/useCollaboration.test.ts',
          },
        ],
        recommendations: [
          {
            id: 'r1',
            priority: 'medium',
            action: 'Add exponential backoff to WebSocket reconnection',
            reason: 'Improves resilience under poor network conditions',
          },
          {
            id: 'r2',
            priority: 'low',
            action: 'Add integration test for concurrent disconnects',
            reason: 'Prevents race conditions in connection management',
          },
          {
            id: 'r3',
            priority: 'high',
            action: 'Ensure WebSocket cleanup on component unmount',
            reason: 'Prevents memory leaks in long-running sessions',
          },
        ],
        confidence: 0.89,
      },
      'pr-2': {
        riskScore: 58,
        riskLevel: 'medium',
        summary:
          'This refactoring extracts deployment status logic into a shared hook. While the abstraction is well-motivated, there are 2 failing tests and the SSE fallback path is not fully covered by tests.',
        findings: [
          {
            id: 'f1',
            category: 'Testing',
            severity: 'high',
            title: '2 tests failing in CI',
            description:
              'The SSE fallback tests are failing due to missing mock setup for EventSource. The tests expect a global EventSource which is not available in the test environment.',
            file: 'src/hooks/useDeploymentStatus.test.ts',
            line: 78,
          },
          {
            id: 'f2',
            category: 'Type Safety',
            severity: 'medium',
            title: 'SSE event type is not properly typed',
            description:
              'The SSE message handler accepts any string as event type. A union type of known events would prevent typos.',
            file: 'src/hooks/useDeploymentStatus.ts',
            line: 56,
          },
          {
            id: 'f3',
            category: 'Maintainability',
            severity: 'low',
            title: 'Polling interval should be configurable',
            description: 'The 5-second polling interval is hardcoded. Making it configurable would improve reusability.',
            file: 'src/hooks/useDeploymentStatus.ts',
            line: 23,
          },
        ],
        recommendations: [
          {
            id: 'r1',
            priority: 'high',
            action: 'Fix failing SSE fallback tests',
            reason: 'Tests must pass before merge',
          },
          {
            id: 'r2',
            priority: 'medium',
            action: 'Add proper typing for SSE events',
            reason: 'Prevents runtime errors from unhandled event types',
          },
          {
            id: 'r3',
            priority: 'low',
            action: 'Make polling interval configurable',
            reason: 'Improves hook reusability across different use cases',
          },
        ],
        confidence: 0.85,
      },
      'pr-3': {
        riskScore: 82,
        riskLevel: 'high',
        summary:
          'This PR fixes a critical security issue in the rate limiting middleware. While the fix is correct, it introduces a mutex that could become a bottleneck under high load. The security fix should be deployed urgently, but the mutex implementation should be reviewed for performance implications.',
        findings: [
          {
            id: 'f1',
            category: 'Security',
            severity: 'critical',
            title: 'Mutex could cause denial of service under high concurrency',
            description:
              'The mutex around auth verification blocks all concurrent requests. Under high load, this could cause request queueing and timeouts, effectively creating a self-inflicted DoS.',
            file: 'src/middleware/rateLimiter.ts',
            line: 34,
            suggestion:
              'Consider using a read-write lock or fine-grained locking per client ID instead of a global mutex.',
          },
          {
            id: 'f2',
            category: 'Performance',
            severity: 'high',
            title: 'Lock contention on high-throughput paths',
            description:
              'The auth check is on the hot path for every request. A global mutex here will serialize all authenticated requests.',
            file: 'src/middleware/rateLimiter.ts',
            line: 40,
          },
          {
            id: 'f3',
            category: 'Testing',
            severity: 'medium',
            title: 'No load testing for the mutex path',
            description: 'The unit tests verify correctness but not behavior under concurrent load.',
          },
        ],
        recommendations: [
          {
            id: 'r1',
            priority: 'high',
            action: 'Replace global mutex with per-client locking',
            reason: 'Prevents performance degradation under high load',
          },
          {
            id: 'r2',
            priority: 'high',
            action: 'Deploy security fix urgently',
            reason: 'Authentication bypass is a critical vulnerability',
          },
          {
            id: 'r3',
            priority: 'medium',
            action: 'Add concurrent load tests',
            reason: 'Validates the fix does not introduce new bottlenecks',
          },
        ],
        confidence: 0.92,
      },
    };

    const analysis = analyses[prId] || {
      riskScore: pr.riskScore,
      riskLevel: pr.riskLevel,
      summary:
        'This PR has been analyzed. The changes appear reasonable with no critical issues detected. Standard review practices apply.',
      findings: [
        {
          id: 'f1',
          category: 'Maintainability',
          severity: 'low',
          title: 'General code quality review recommended',
          description: 'No specific issues detected, but a human review is always recommended.',
        },
      ],
      recommendations: [
        {
          id: 'r1',
          priority: 'low',
          action: 'Proceed with standard review process',
          reason: 'No blocking issues detected by AI analysis',
        },
      ],
      confidence: 0.75,
    };

    return delay(analysis, 1500);
  },

  async analyzeDeployment(
    deploymentId: string
  ): Promise<AIDeploymentAnalysis> {
    const dep = deployments.find((d) => d.id === deploymentId);
    if (!dep) return notFound('Deployment not found');

    if (dep.status === 'failed') {
      return delay(
        {
          risk: 'high',
          possibleCause:
            'Database migration timeout caused by insufficient connection pool size during schema updates. The migration requires a table lock that exceeded the 30-second connection timeout.',
          evidence: [
            'Migration 004_add_index failed with connection timeout after 30000ms',
            'Connection pool was at 95% capacity during migration',
            'P95 latency on database queries increased to 890ms prior to timeout',
            'No maintenance window was set, deployment ran during peak traffic',
          ],
          affectedAreas: [
            'Authentication service - all auth endpoints',
            'Rate limiting middleware - intermittent bypass',
            'User session management - session creation failures',
          ],
          recommendedActions: [
            'Increase database connection pool size to 50 for migration windows',
            'Deploy migrations in a separate step before application deployment',
            'Schedule deployments outside of peak traffic hours (10am-4pm UTC)',
            'Add migration timeout monitoring with alerting at 20 seconds',
          ],
          confidence: 0.88,
        },
        1500
      );
    }

    return delay(
      {
        risk: 'low',
        possibleCause:
          'Deployment completed successfully. No anomalies detected in the deployment pipeline or post-deployment metrics.',
        evidence: [
          'All 142 tests passed',
          'Build completed in 68 seconds, within normal range',
          'Health checks passed for all endpoints',
          'Post-deployment metrics show improved response times',
        ],
        affectedAreas: [],
        recommendedActions: [
          'Monitor error rates for the next 30 minutes',
          'Verify WebSocket connections are stable',
        ],
        confidence: 0.94,
      },
      1500
    );
  },

  async investigateIncident(
    incidentId: string
  ): Promise<AIIncidentAnalysis> {
    const inc = incidents.find((i) => i.id === incidentId);
    if (!inc) return notFound('Incident not found');

    if (inc.id === 'inc-1' || inc.id === 'inc-2') {
      return delay(
        {
          summary:
            'The incident was triggered by a production deployment that introduced a database migration requiring a table lock. The lock exceeded the connection timeout, causing auth requests to fail and connection pool exhaustion cascaded to dependent services.',
          likelyCause:
            'Database migration timeout during production deployment caused connection pool exhaustion, which cascaded to authentication and rate limiting services.',
          evidence: [
            'Deployment #2 (b8e2c41) deployed at 07:15 — error spike at 07:17',
            'Migration 004_add_index failed with connection timeout',
            'Connection pool reached 95% capacity during migration',
            'P95 latency on /api/auth increased from 142ms to 890ms',
            'Error rate correlated exactly with deployment timestamp',
          ],
          affectedServices: [
            'auth-service — authentication timeouts',
            'rate-limiter — intermittent bypass under load',
            'session-manager — session creation failures',
            'api-gateway — 502 errors from upstream timeouts',
          ],
          recommendations: [
            'Roll back deployment to previous version (already in progress)',
            'Increase connection pool size to 50 for future migrations',
            'Deploy migrations separately before application code',
            'Add circuit breaker pattern for database-dependent services',
            'Schedule production deployments outside peak hours',
          ],
          confidence: 0.91,
        },
        1500
      );
    }

    return delay(
      {
        summary:
          'The incident appears to be related to the recent feature deployment. The issue is currently under investigation with mitigation steps being evaluated.',
        likelyCause:
          'Preliminary analysis suggests the issue is related to the latest deployment. Further investigation is needed to determine the exact root cause.',
        evidence: [
          'Issue started shortly after the most recent deployment',
          'Affected users are concentrated in specific network environments',
          'Error patterns suggest a client-side connectivity issue',
        ],
        affectedServices: ['websocket-gateway', 'realtime-collaboration'],
        recommendations: [
          'Add fallback to polling for restricted network environments',
          'Implement feature flag to disable real-time features for affected users',
          'Add network detection logic to choose transport method',
        ],
        confidence: 0.78,
      },
      1500
    );
  },

  // AI Assistant - returns a stream simulation
  async *streamAIResponse(
    query: string,
    context?: string
  ): AsyncGenerator<string> {
    const responses: Record<string, string> = {
      default: `Based on the current project state, here's what I found:\n\nThe most recent deployment to **Atlas Web Platform** completed successfully at 08:30 UTC. However, there's an active incident on **Orion API Gateway** — authentication timeouts affecting approximately 1,240 users.\n\nThe incident appears to be caused by a database migration timeout during the latest production deployment. The engineering team has identified the root cause and is currently investigating mitigation strategies.\n\n**Key observations:**\n- 7 open pull requests across all projects\n- 2 pull requests are rated as high or critical risk\n- Deployment success rate is at 87.5% (down 2.5% from last week)\n- Engineering health score is 82/100\n\nI'd recommend prioritizing the authentication timeout incident and reviewing PR #312 which addresses the security fix.`,
    };

    let response = responses.default;

    if (query.toLowerCase().includes('deployment') && query.toLowerCase().includes('incident')) {
      response = `The **Orion API Gateway** deployment #2 (commit b8e2c41) at 07:15 UTC caused the authentication timeout incident.\n\n**What happened:**\nThe deployment included a database migration (004_add_index) that required a table lock. The lock exceeded the 30-second connection timeout, causing the migration to fail. This led to connection pool exhaustion, which cascaded to authentication failures.\n\n**Timeline:**\n- 07:15 — Deployment started\n- 07:17 — Error rate spiked from 0.8% to 3.2%\n- 07:18 — P95 latency increased to 890ms\n- 07:20 — Incident auto-created by monitoring\n- 07:25 — Sarah Kim assigned as incident commander\n\n**Recommended action:** Roll back the deployment and re-deploy the migration with an increased connection timeout.`;
    } else if (query.toLowerCase().includes('risky') || query.toLowerCase().includes('risk')) {
      response = `Here are the current high-risk pull requests:\n\n1. **PR #312** — Fix authentication bypass in rate limiting middleware\n   - Risk: **High** (score: 82)\n   - Security fix, but introduces a mutex that could cause performance issues\n\n2. **PR #311** — Migrate from Redis pub/sub to Kafka\n   - Risk: **Critical** (score: 91)\n   - Large infrastructure change with 12 failing tests, still in draft\n\n3. **PR #846** — Refactor deployment status polling\n   - Risk: **Medium** (score: 58)\n   - 2 failing tests in the SSE fallback path\n\nI'd recommend reviewing PR #312 first — it addresses a security vulnerability and should be merged urgently after addressing the performance concern.`;
    } else if (query.toLowerCase().includes('week') || query.toLowerCase().includes('changed')) {
      response = `Here's a summary of what changed this week:\n\n**Deployments:** 12 total (10 successful, 2 failed)\n- Success rate: 83.3% (down from 90% last week)\n- 2 failed deployments on Orion API Gateway\n\n**Pull Requests:**\n- 7 currently open\n- 3 merged this week\n- 2 new high-risk PRs opened\n\n**Incidents:**\n- 3 active incidents (1 high severity, 1 critical)\n- 2 resolved this week\n- Error rate increased from 0.8% to 1.2%\n\n**Engineering Health:**\n- Overall score: 82/100 (down 3 points)\n- Main contributor to decline: Orion API Gateway failures\n\nThe decline in health score is primarily driven by the Orion API Gateway issues. Resolving the active incidents should restore the score to the 85+ range.`;
    } else if (query.toLowerCase().includes('unhealthy') || query.toLowerCase().includes('health')) {
      response = `**Orion API Gateway** is the most unhealthy project with a health score of 64/100.\n\n**Contributing factors:**\n- 2 active incidents (1 critical, 1 high severity)\n- 1 failed production deployment this week\n- Error rate at 3.2% (vs. 0.8% platform average)\n- Connection pool exhaustion affecting 3,400 users\n\n**Other project health scores:**\n- Atlas Web Platform: 87/100 (1 active incident)\n- Pulse Mobile App: 78/100 (no incidents)\n- Nimbus Design System: 95/100 (healthiest project)\n\nThe Orion API Gateway issues are primarily related to database migration timeouts. Addressing the connection pool configuration should improve the health score significantly.`;
    } else if (query.toLowerCase().includes('failure') || query.toLowerCase().includes('failed')) {
      response = `Recent deployment failures:\n\n1. **Orion API Gateway** — Production deployment #2\n   - Status: **Failed**\n   - Time: 07:15 UTC today\n   - Cause: Database migration timeout (connection pool exhaustion)\n   - Author: Sarah Kim\n   - Impact: 1,240 users affected, auth timeouts\n\n2. **Atlas Web Platform** — Preview deployment #7\n   - Status: **Cancelled**\n   - Time: 10:00 UTC on Oct 3\n   - Cause: Cancelled by user (Jordan Lee)\n   - No user impact\n\nThe production failure on Orion API Gateway is the most concerning. I recommend investigating the database connection pool configuration and separating migrations from application deployments.`;
    }

    const words = response.split(' ');
    for (let i = 0; i < words.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 30));
      yield words[i] + (i < words.length - 1 ? ' ' : '');
    }
  },
};
