import SwaggerParser from '@apidevtools/swagger-parser';
import { v4 as uuidv4 } from 'uuid';
import { API, Tool, HttpMethod, AuthScheme, AuthType } from '../types';
import yaml from 'js-yaml';

export interface ImportResult {
  api: API;
  tools: Tool[];
  authSchemes: AuthScheme[];
}

export async function importOpenApi(source: string | File): Promise<ImportResult> {
  let spec: any;

  try {
    if (source instanceof File) {
      const text = await source.text();
      try {
        spec = JSON.parse(text);
      } catch {
        spec = yaml.load(text);
      }
    } else {
      // It's a URL or string path
      spec = source;
    }

    // Dereference the spec to resolve $refs
    const apiDoc = await SwaggerParser.dereference(spec as any) as any;

    const apiId = uuidv4();
    const baseUrl = apiDoc.servers?.[0]?.url || '';

    const api: API = {
      id: apiId,
      name: apiDoc.info?.title || 'Imported API',
      description: apiDoc.info?.description,
      baseUrl: baseUrl,
    };

    const authSchemes: AuthScheme[] = [];
    if (apiDoc.components?.securitySchemes) {
      Object.entries(apiDoc.components.securitySchemes).forEach(([key, scheme]: [string, any]) => {
        let type: AuthType = 'none';
        let config: any = {};

        if (scheme.type === 'apiKey') {
           type = 'apiKey';
           config = { headerName: scheme.name };
        } else if (scheme.type === 'http' && scheme.scheme === 'bearer') {
           type = 'bearer';
        } else if (scheme.type === 'http' && scheme.scheme === 'basic') {
           type = 'basic';
        } else if (scheme.type === 'oauth2') {
           type = 'oauth2';
           // Simplified OAuth extraction
           config = {
             scopes: [] // extraction logic would go here
           };
        }

        if (type !== 'none') {
          authSchemes.push({
            id: uuidv4(),
            name: key,
            type,
            config
          });
        }
      });
    }

    const tools: Tool[] = [];

    if (apiDoc.paths) {
      Object.entries(apiDoc.paths).forEach(([path, pathItem]: [string, any]) => {
        const methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
        
        methods.forEach(method => {
          const operation = pathItem[method.toLowerCase()];
          if (operation) {
            const toolId = uuidv4();
            const operationId = operation.operationId || `${method.toLowerCase()}_${path.replace(/\//g, '_').replace(/[{}]/g, '')}`;
            
            // Extract request schema (simplified)
            let requestSchema: any = {};
            
            // First, extract path and query parameters
            const paramProperties: any = {};
            const paramRequired: string[] = [];
            
            if (operation.parameters) {
              operation.parameters.forEach((param: any) => {
                if (param.in === 'query' || param.in === 'path') {
                  paramProperties[param.name] = param.schema || { type: 'string' };
                  paramProperties[param.name].description = param.description;
                  if (param.required) {
                    paramRequired.push(param.name);
                  }
                }
              });
            }
            
            // Then, check if there's a request body
            if (operation.requestBody?.content?.['application/json']?.schema) {
              const bodySchema = operation.requestBody.content['application/json'].schema;
              
              // If we have path/query params, merge them with the body schema
              if (Object.keys(paramProperties).length > 0) {
                // Merge body schema properties with param properties
                const bodyProperties = bodySchema.properties || {};
                const bodyRequired = bodySchema.required || [];
                
                requestSchema = {
                  type: 'object',
                  properties: {
                    ...paramProperties,
                    ...bodyProperties
                  },
                  required: [...paramRequired, ...bodyRequired]
                };
              } else {
                // No params, just use body schema
                requestSchema = bodySchema;
              }
            } else if (Object.keys(paramProperties).length > 0) {
              // No body, only params
              requestSchema = {
                type: 'object',
                properties: paramProperties,
                required: paramRequired.length > 0 ? paramRequired : undefined
              };
            }

            // Extract response schema (success 2xx)
            let responseSchema: any = undefined;
            const successCode = Object.keys(operation.responses || {}).find(code => code.startsWith('2'));
            if (successCode) {
              responseSchema = operation.responses[successCode]?.content?.['application/json']?.schema;
            }

            const tool: Tool = {
              id: toolId,
              apiId: apiId,
              name: operationId,
              description: operation.summary || operation.description || '',
              enabled: true,
              method: method,
              path: path,
              requestSchema: requestSchema,
              responseSchema: responseSchema,
              guardrails: {
                readOnly: method === 'GET',
                confirmationRequired: method !== 'GET',
              }
            };

            tools.push(tool);
          }
        });
      });
    }

    return { api, tools, authSchemes };

  } catch (error) {
    console.error("OpenAPI Import Error:", error);
    throw new Error(`Failed to import OpenAPI: ${error instanceof Error ? error.message : String(error)}`);
  }
}
