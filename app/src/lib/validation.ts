import { Project, Tool, AuthScheme } from '../types';

export interface ValidationIssue {
  severity: 'error' | 'warning';
  message: string;
  context?: string; // e.g., "Tool: MyTool"
}

export function validateProject(project: Project): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Check 1: No APIs
  if (project.apis.length === 0) {
    issues.push({
      severity: 'warning',
      message: 'No APIs defined in project.'
    });
  }

  // Check 2: Tools Validation
  project.tools.forEach(tool => {
    if (!tool.enabled) {
      issues.push({
        severity: 'warning',
        message: `Tool "${tool.name}" is disabled and will not be exported.`,
        context: `Tool: ${tool.name}`
      });
    }

    if (!tool.description) {
      issues.push({
        severity: 'warning',
        message: `Tool "${tool.name}" has no description. LLMs may struggle to use it.`,
        context: `Tool: ${tool.name}`
      });
    }

    // Check for empty schemas (basic check)
    if (tool.requestSchema && Object.keys(tool.requestSchema).length === 0) {
      issues.push({
        severity: 'warning',
        message: `Tool "${tool.name}" has an empty request schema.`,
        context: `Tool: ${tool.name}`
      });
    }

    // Check auth
    const api = project.apis.find(a => a.id === tool.apiId);
    if (api && api.defaultAuthId) {
        const auth = project.authSchemes.find(a => a.id === api.defaultAuthId);
        if (!auth) {
            issues.push({
                severity: 'error',
                message: `Tool "${tool.name}" references a missing auth scheme.`,
                context: `Tool: ${tool.name}`
            });
        }
    }
  });

  // Check 3: Auth Validation
  project.authSchemes.forEach(auth => {
      if (auth.type === 'oauth2') {
          if (!auth.config.clientId) {
               issues.push({
                  severity: 'error',
                  message: `OAuth scheme "${auth.name}" missing Client ID.`,
                  context: `Auth: ${auth.name}`
              });
          }
          if (!auth.config.authUrl || !auth.config.tokenUrl) {
               issues.push({
                  severity: 'error',
                  message: `OAuth scheme "${auth.name}" missing endpoints.`,
                  context: `Auth: ${auth.name}`
              });
          }
      }
  });

  return issues;
}

export function validateSchema(schema: any): string | null {
    if (!schema) return null;
    
    // Basic structural checks for JSON Schema
    if (typeof schema !== 'object') return "Schema must be an object";
    
    if (schema.type && !['string', 'number', 'integer', 'boolean', 'object', 'array', 'null'].includes(schema.type)) {
        return `Invalid type "${schema.type}" in schema`;
    }

    return null; // Valid
}
