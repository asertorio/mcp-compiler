export interface JsonSchema {
  type?: string;
  items?: JsonSchema;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  [key: string]: any;
}

export function inferSchema(data: any): JsonSchema {
  if (data === null) {
    return { type: 'null' }; // Or handle as nullable, but for now specific type
  }

  if (Array.isArray(data)) {
    const schema: JsonSchema = { type: 'array' };
    if (data.length > 0) {
      // Infer from the first non-null element, or merge them?
      // Plan says "Infer arrays from first non-null element"
      const firstNonNull = data.find(item => item !== null);
      if (firstNonNull !== undefined) {
        schema.items = inferSchema(firstNonNull);
      }
    }
    return schema;
  }

  if (typeof data === 'object') {
    const properties: Record<string, JsonSchema> = {};
    const required: string[] = [];

    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        properties[key] = inferSchema(data[key]);
        required.push(key);
      }
    }

    return {
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined
    };
  }

  if (typeof data === 'string') {
    return { type: 'string' };
  }

  if (typeof data === 'number') {
    return { type: 'number' };
  }

  if (typeof data === 'boolean') {
    return { type: 'boolean' };
  }

  return { type: 'string' }; // Fallback
}
