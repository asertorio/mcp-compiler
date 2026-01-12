# Path Parameters Flow Diagram

## Overview

This diagram shows how path parameters flow through the MCP Compiler system from import to runtime.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          IMPORT PHASE                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────┐                        ┌──────────────────┐           │
│  │  OpenAPI Spec    │                        │  JSON Example    │           │
│  │  or JSON Example │                        │  Path Template   │           │
│  └────────┬─────────┘                        └────────┬─────────┘           │
│           │                                            │                     │
│           │  Path: /projects/{projectId}/issues/{issueId}                  │
│           │  Parameters: projectId, issueId                                 │
│           │  Body: { title, status }                                        │
│           │                                            │                     │
│           ▼                                            ▼                     │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │         openapi-import.ts  OR  ApiManager.tsx                   │       │
│  │                                                                  │       │
│  │  1. Extract path params: ['projectId', 'issueId']              │       │
│  │  2. Extract body schema: { title, status }                     │       │
│  │  3. Merge into single schema:                                   │       │
│  │     {                                                            │       │
│  │       properties: {                                              │       │
│  │         projectId: { type: 'string' },                          │       │
│  │         issueId: { type: 'string' },                            │       │
│  │         title: { type: 'string' },                              │       │
│  │         status: { type: 'string' }                              │       │
│  │       },                                                         │       │
│  │       required: ['projectId', 'issueId', 'title']               │       │
│  │     }                                                            │       │
│  └─────────────────────────┬────────────────────────────────────────┘       │
│                            │                                                │
│                            ▼                                                │
│                   ┌─────────────────┐                                      │
│                   │  Tool Object     │                                      │
│                   │  - path: ...     │                                      │
│                   │  - requestSchema │                                      │
│                   └────────┬─────────┘                                      │
│                            │                                                │
└────────────────────────────┼────────────────────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────────────────┐
│                          EXPORT PHASE                                        │
├────────────────────────────┼────────────────────────────────────────────────┤
│                            ▼                                                │
│                   ┌─────────────────┐                                      │
│                   │ export-service.ts│                                      │
│                   │                  │                                      │
│                   │ Generate MCP     │                                      │
│                   │ Server Code      │                                      │
│                   └────────┬─────────┘                                      │
│                            │                                                │
│                            ▼                                                │
│           ┌────────────────────────────────────┐                           │
│           │  Generated src/index.ts            │                           │
│           │                                     │                           │
│           │  Tool Definition:                   │                           │
│           │  {                                  │                           │
│           │    name: "updateIssue",             │                           │
│           │    inputSchema: {                   │                           │
│           │      properties: {                  │                           │
│           │        projectId: {...},            │                           │
│           │        issueId: {...},              │                           │
│           │        title: {...},                │                           │
│           │        status: {...}                │                           │
│           │      }                              │                           │
│           │    }                                │                           │
│           │  }                                  │                           │
│           │                                     │                           │
│           │  Tool Handler:                      │                           │
│           │  case "updateIssue": {              │                           │
│           │    const requestArgs = {...args};   │                           │
│           │    let url = "base/projects/{...}"; │                           │
│           │    url = url.replace('{projectId}', │                           │
│           │      encodeURI(requestArgs.projectId)); │                       │
│           │    delete requestArgs.projectId;    │                           │
│           │    url = url.replace('{issueId}',   │                           │
│           │      encodeURI(requestArgs.issueId));│                          │
│           │    delete requestArgs.issueId;      │                           │
│           │    // requestArgs now only has      │                           │
│           │    // { title, status }             │                           │
│           │    axios.put(url, requestArgs);     │                           │
│           │  }                                  │                           │
│           └────────┬───────────────────────────┘                           │
│                    │                                                        │
└────────────────────┼────────────────────────────────────────────────────────┘
                     │
┌────────────────────┼────────────────────────────────────────────────────────┐
│                  RUNTIME PHASE (Claude Desktop)                              │
├────────────────────┼────────────────────────────────────────────────────────┤
│                    ▼                                                        │
│         ┌──────────────────────┐                                           │
│         │  Claude Desktop      │                                           │
│         │  loads MCP Server    │                                           │
│         └──────────┬───────────┘                                           │
│                    │                                                        │
│                    │ Lists tools and sees:                                 │
│                    │ "updateIssue" with params:                            │
│                    │   - projectId (required)                              │
│                    │   - issueId (required)                                │
│                    │   - title (required)                                  │
│                    │   - status (optional)                                 │
│                    │                                                        │
│                    ▼                                                        │
│         ┌──────────────────────┐                                           │
│         │  User asks Claude:   │                                           │
│         │  "Update issue 456   │                                           │
│         │   in project 123     │                                           │
│         │   to mark it closed" │                                           │
│         └──────────┬───────────┘                                           │
│                    │                                                        │
│                    ▼                                                        │
│         ┌──────────────────────┐                                           │
│         │  Claude calls tool:  │                                           │
│         │  updateIssue({       │                                           │
│         │    projectId: "123", │                                           │
│         │    issueId: "456",   │                                           │
│         │    title: "...",     │                                           │
│         │    status: "closed"  │                                           │
│         │  })                  │                                           │
│         └──────────┬───────────┘                                           │
│                    │                                                        │
│                    ▼                                                        │
│         ┌──────────────────────┐                                           │
│         │  MCP Server Handler  │                                           │
│         │                      │                                           │
│         │  1. Extract params   │                                           │
│         │  2. Build URL:       │                                           │
│         │     /projects/123/   │                                           │
│         │     issues/456       │                                           │
│         │  3. Send body:       │                                           │
│         │     { title, status }│                                           │
│         └──────────┬───────────┘                                           │
│                    │                                                        │
│                    ▼                                                        │
│         ┌──────────────────────┐                                           │
│         │  API Request:        │                                           │
│         │  PUT /projects/123/  │                                           │
│         │      issues/456      │                                           │
│         │  Body: {...}         │                                           │
│         └──────────────────────┘                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Key Points

1. **Path parameters are discovered early** - During import from OpenAPI spec or JSON example path template
2. **Merged with body schema** - Creating a single unified input schema that Claude sees
3. **Properly separated at runtime** - Path params go in URL, body params go in request body
4. **URL-safe encoding** - Path parameters are encoded to handle special characters
5. **Type conversion** - All path params converted to strings before URL substitution

## Before vs After

### Before (Broken)
```
Path: /projects/{projectId}/issues/{issueId}
Body: { title, status }

Tool Schema Claude Sees:
{
  properties: {
    title: {...},
    status: {...}
  }
}
// ❌ projectId and issueId missing!
```

### After (Fixed)
```
Path: /projects/{projectId}/issues/{issueId}
Body: { title, status }

Tool Schema Claude Sees:
{
  properties: {
    projectId: {...},    // ✅ Now included
    issueId: {...},      // ✅ Now included
    title: {...},
    status: {...}
  },
  required: ['projectId', 'issueId', 'title']
}
```
