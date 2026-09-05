export const ROOT_PATH = '$';

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

/** Builds the JSONPath of a child: `$.name`, `$['odd key']`, `$.items[2]`. */
export function childPath(parent: string, key: string | number): string {
  if (typeof key === 'number') {
    return `${parent}[${key}]`;
  }
  if (IDENTIFIER.test(key)) {
    return `${parent}.${key}`;
  }
  const escaped = key.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  return `${parent}['${escaped}']`;
}
