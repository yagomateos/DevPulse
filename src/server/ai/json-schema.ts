import * as z from 'zod';

type JsonSchema = { [key: string]: unknown };

/**
 * Keywords some OpenAI-compatible providers reject in strict mode. They are
 * dropped from the request schema only — the server still enforces them by
 * validating the model output with the original Zod schema.
 */
const UNSUPPORTED_KEYWORDS = new Set(['$schema', 'minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', 'minLength', 'maxLength', 'pattern', 'format', 'minItems', 'maxItems', 'default']);

/**
 * Converts a Zod schema into the JSON Schema dialect required by OpenAI
 * "strict" structured outputs: every object is closed and lists all of its
 * properties as required (optionality is expressed with `nullable`).
 */
export function toStrictJsonSchema(schema: z.ZodType): JsonSchema {
  const json = z.toJSONSchema(schema, { target: 'draft-7', unrepresentable: 'any' }) as JsonSchema;
  const visit = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(visit);
    if (!node || typeof node !== 'object') return node;
    const out: JsonSchema = {};
    for (const [key, value] of Object.entries(node)) {
      if (UNSUPPORTED_KEYWORDS.has(key)) continue;
      out[key] = visit(value);
    }
    if (out.type === 'object' && out.properties && typeof out.properties === 'object') {
      out.additionalProperties = false;
      out.required = Object.keys(out.properties);
    }
    return out;
  };
  return visit(json) as JsonSchema;
}
