# Path Parameters Fix - Documentation

## Problem Statement

Claude was unable to use tools that had URI path parameters (e.g., `/projects/{projectId}/issues/{issueId}`) because the parameters weren't being properly exposed in the MCP tool's input schema.

### User's Report
> "the parameters in the uri for example /projects/{projectId}/issues/{issueId} do not appear to be able to be set by claude. do they need to be added to the config file automatically when there is a uri parameter?"
>
> Claude was saying: "I understand - the parameters need to be passed in the header. Unfortunately, the issues API tool available to me doesn't have explicit parameters for the project ID and issue ID in its schema, so I'm unable to configure the request headers directly."

## Root Cause

There were two issues:

1. **OpenAPI Import** - Path parameters were being extracted but NOT merged with request body schemas. If an operation had both a request body AND path parameters, only the body was included in the tool's `inputSchema`.

2. **JSON Example Import** - Path parameters in the path template were completely ignored - they weren't being extracted or added to the tool's schema at all.

## Solution

### 1. Fixed OpenAPI Import (`app/src/lib/openapi-import.ts`)

**Before:** The code had an if-else structure:
- IF there's a request body → use only the body schema
- ELSE IF there are parameters → use only parameters

**After:** Now it properly merges both:
1. First, extract all path and query parameters
2. Then, if there's a request body, merge the parameters with the body schema
3. This ensures Claude sees ALL required inputs in the tool's `inputSchema`

```typescript
// Extract path and query parameters first
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

// Then merge with request body if present
if (operation.requestBody?.content?.['application/json']?.schema) {
  const bodySchema = operation.requestBody.content['application/json'].schema;
  
  if (Object.keys(paramProperties).length > 0) {
    // Merge both schemas
    requestSchema = {
      type: 'object',
      properties: {
        ...paramProperties,
        ...bodyProperties
      },
      required: [...paramRequired, ...bodyRequired]
    };
  } else {
    // No params, just body
    requestSchema = bodySchema;
  }
}
```

### 2. Fixed JSON Example Import (`app/src/components/ApiManager.tsx`)

**Changes:**
1. Extract path parameters from the path template using regex
2. Add them to the schema with type `string` and mark as required
3. Merge with any request body schema from the JSON example
4. Fixed field name from `parameters` to `requestSchema` (was using wrong property name)

```typescript
// Extract path parameters from template
const pathParams = (path.match(/\{([^}]+)\}/g) || []).map(p => p.slice(1, -1));

if (pathParams.length > 0) {
  const pathParamProperties: any = {};
  const pathParamRequired: string[] = [];
  
  pathParams.forEach(param => {
    pathParamProperties[param] = {
      type: 'string',
      description: `Path parameter: ${param}`
    };
    pathParamRequired.push(param);
  });
  
  // Merge with request body schema if present
  if (reqSchema) {
    reqSchema = {
      type: 'object',
      properties: {
        ...pathParamProperties,
        ...(reqSchema.properties || {})
      },
      required: [
        ...pathParamRequired,
        ...(reqSchema.required || [])
      ]
    };
  }
}
```

### 3. Enhanced Export Code (`app/src/lib/export-service.ts`)

**Improvements:**
1. Changed from `args as any` to `{ ...(args as any) }` to avoid mutating the original args object
2. Added URL encoding for path parameters using `encodeURIComponent()`
3. Added safety check for undefined path parameters

```typescript
// Replace path parameters in URL and remove from requestArgs
if (pathParams.length > 0) {
  pathParams.forEach(param => {
    urlCode += `\n      if (requestArgs['${param}'] !== undefined) {
        url = url.replace('{${param}}', encodeURIComponent(String(requestArgs['${param}'])));
        delete requestArgs['${param}'];
      }`;
  });
}
```

## How It Works End-to-End

### Example: `/projects/{projectId}/issues/{issueId}`

1. **Import Phase** (OpenAPI or JSON Example):
   - Path template is stored in `tool.path`: `/projects/{projectId}/issues/{issueId}`
   - Parameters extracted: `['projectId', 'issueId']`
   - Tool's `requestSchema` includes:
     ```json
     {
       "type": "object",
       "properties": {
         "projectId": { "type": "string", "description": "Path parameter: projectId" },
         "issueId": { "type": "string", "description": "Path parameter: issueId" },
         ...other body parameters
       },
       "required": ["projectId", "issueId", ...other required fields]
     }
     ```

2. **Export Phase** (MCP Server Generation):
   - The generated MCP server's tool definition includes the full `inputSchema` with all parameters
   - Claude can now see that `projectId` and `issueId` are required inputs

3. **Runtime Phase** (When Claude calls the tool):
   - Claude provides: `{ "projectId": "123", "issueId": "456", ...other data }`
   - Generated code extracts path params from args:
     ```typescript
     const requestArgs = { ...(args as any) };
     
     // For projectId
     url = url.replace('{projectId}', encodeURIComponent(String(requestArgs['projectId'])));
     delete requestArgs['projectId'];
     
     // For issueId
     url = url.replace('{issueId}', encodeURIComponent(String(requestArgs['issueId'])));
     delete requestArgs['issueId'];
     ```
   - URL becomes: `https://api.example.com/projects/123/issues/456`
   - Remaining `requestArgs` are sent as body/query params

## Benefits

1. **Claude can now see and provide path parameters** - They're explicitly listed in the tool schema
2. **Works with both OpenAPI and JSON Example imports** - Consistent behavior
3. **Properly handles mixed scenarios** - Tools with both path params AND request bodies work correctly
4. **URL-safe** - Path parameters are properly encoded
5. **Type-safe** - Parameters are converted to strings before URL encoding

## Testing Recommendations

1. Test OpenAPI import with endpoints that have:
   - Only path parameters
   - Only request body
   - Both path parameters AND request body
   - Multiple path parameters in one path

2. Test JSON Example import with:
   - Path templates like `/users/{userId}`
   - Nested paths like `/projects/{projectId}/issues/{issueId}`
   - Paths with special characters that need encoding

3. Export and run the generated MCP server to verify:
   - Claude can call the tools
   - Path parameters are correctly substituted in URLs
   - Body/query parameters are still sent correctly

## Files Modified

1. `app/src/lib/openapi-import.ts` - Fixed parameter extraction and merging
2. `app/src/components/ApiManager.tsx` - Fixed JSON example import and field name
3. `app/src/lib/export-service.ts` - Enhanced URL construction with encoding and safety checks
