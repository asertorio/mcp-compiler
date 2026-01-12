export type AuthType = 'apiKey' | 'bearer' | 'basic' | 'oauth2' | 'none';

export interface AuthConfig {
  // API Key
  headerName?: string;
  
  // OAuth
  clientId?: string;
  authUrl?: string;
  tokenUrl?: string;
  scopes?: string[];
  oauthFlow?: 'manual' | 'interactive';
  callbackPort?: number;
  
  // OAuth Advanced Options - for provider flexibility
  responseType?: string;                         // 'code' | 'token' | 'id_token' | 'code id_token' etc
  grantType?: string;                            // 'authorization_code' | 'client_credentials' | custom
  tokenRequestFormat?: 'json' | 'form';          // How to send token exchange request
  tokenAuthMethod?: 'body' | 'header';           // Send client credentials in body vs Basic auth header
  additionalAuthParams?: Record<string, string>; // Extra auth URL params (audience, resource, nonce, etc)
  additionalTokenParams?: Record<string, string>;// Extra token exchange params
  usePkce?: boolean;                             // Use PKCE flow (required by some providers)
  
  // Secret ID reference (for Keychain lookup)
  secretId?: string;
}

export interface AuthScheme {
  id: string;
  name: string;
  type: AuthType;
  config: AuthConfig;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface ToolGuardrails {
  readOnly: boolean;
  confirmationRequired: boolean;
  rateLimitHint?: number;
}

export interface Tool {
  id: string;
  apiId: string;
  name: string;
  description: string;
  enabled: boolean;
  
  method: HttpMethod;
  path: string;
  
  requestSchema: any; // JSON Schema
  responseSchema?: any; // JSON Schema
  
  headers?: Record<string, string>;
  authId?: string; // Override API auth
  
  guardrails: ToolGuardrails;
}

export interface API {
  id: string;
  name: string;
  baseUrl: string;
  description?: string;
  defaultAuthId?: string;
}

export interface Project {
  id: string;
  name: string;
  version: string;
  
  apis: API[];
  tools: Tool[];
  authSchemes: AuthScheme[];
  
  createdAt: string;
  updatedAt: string;
}
