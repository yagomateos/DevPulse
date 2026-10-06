import { describe, expect, it } from 'vitest';
import { prAnalysisSchema } from '@/schemas/ai';
import { toStrictJsonSchema } from './json-schema';

type Node = { [key: string]: unknown };

function walk(node: unknown, visit: (n: Node) => void) {
  if (Array.isArray(node)) node.forEach((n) => walk(n, visit));
  else if (node && typeof node === 'object') {
    visit(node as Node);
    Object.values(node).forEach((v) => walk(v, visit));
  }
}

describe('toStrictJsonSchema', () => {
  const schema = toStrictJsonSchema(prAnalysisSchema);

  it('closes every object and marks all properties required (OpenAI strict mode)', () => {
    let objects = 0;
    walk(schema, (n) => {
      if (n.type === 'object' && n.properties) {
        objects++;
        expect(n.additionalProperties).toBe(false);
        expect(n.required).toEqual(Object.keys(n.properties as object));
      }
    });
    expect(objects).toBeGreaterThanOrEqual(3); // analysis, finding, recommendation
  });

  it('expresses optional fields as nullable and drops provider-incompatible keywords', () => {
    const json = JSON.stringify(schema);
    expect(json).not.toMatch(/"minimum"|"maximum"|"\$schema"/);
    const finding = ((schema.properties as Node).findings as Node).items as Node;
    expect(JSON.stringify((finding.properties as Node).file)).toContain('null');
  });
});
