// @ts-check
/**
 * A small JSON Schema checker for our content files. It supports only the
 * keywords our schemas in content/schemas/ use, so it stays readable.
 * Used both in the browser (a bad role file is skipped with a warning) and in CI.
 */

/**
 * @param {any} schema
 * @param {unknown} value
 * @param {string} [path]
 * @returns {string[]} problems; empty when valid
 */
export function validate(schema, value, path = '$') {
  /** @type {string[]} */
  const errors = [];
  const types = schema.type ? [].concat(schema.type) : [];
  if (types.length && !types.some((t) => typeMatches(t, value))) {
    errors.push(`${path}: expected ${types.join(' or ')}`);
    return errors;
  }
  if (schema.enum && !schema.enum.includes(value)) errors.push(`${path}: must be one of ${schema.enum.join(', ')}`);
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) errors.push(`${path}: too short`);
    if (schema.maxLength !== undefined && value.length > schema.maxLength) errors.push(`${path}: too long (max ${schema.maxLength})`);
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) errors.push(`${path}: does not match ${schema.pattern}`);
  }
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) errors.push(`${path}: below ${schema.minimum}`);
    if (schema.maximum !== undefined && value > schema.maximum) errors.push(`${path}: above ${schema.maximum}`);
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) errors.push(`${path}: needs at least ${schema.minItems} items`);
    if (schema.maxItems !== undefined && value.length > schema.maxItems) errors.push(`${path}: at most ${schema.maxItems} items`);
    if (schema.items) value.forEach((item, i) => errors.push(...validate(schema.items, item, `${path}[${i}]`)));
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const obj = /** @type {Record<string, unknown>} */ (value);
    for (const key of schema.required || []) if (!(key in obj)) errors.push(`${path}: missing "${key}"`);
    for (const [key, sub] of Object.entries(schema.properties || {})) if (key in obj) errors.push(...validate(sub, obj[key], `${path}.${key}`));
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(obj)) if (!(schema.properties || {})[key]) errors.push(`${path}: unexpected "${key}"`);
    }
  }
  return errors;
}

/** @param {string} type @param {unknown} value */
function typeMatches(type, value) {
  switch (type) {
    case 'string': return typeof value === 'string';
    case 'number': return typeof value === 'number' && Number.isFinite(value);
    case 'integer': return Number.isInteger(value);
    case 'boolean': return typeof value === 'boolean';
    case 'array': return Array.isArray(value);
    case 'object': return !!value && typeof value === 'object' && !Array.isArray(value);
    case 'null': return value === null;
    default: return false;
  }
}
