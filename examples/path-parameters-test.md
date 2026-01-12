# Path Parameters Test Example

This document provides test cases to verify that path parameters are correctly handled.

## Test Case 1: OpenAPI with Only Path Parameters

### OpenAPI Spec (Simplified)
```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Project API",
    "version": "1.0.0"
  },
  "servers": [
    {
      "url": "https://api.example.com"
    }
  ],
  "paths": {
    "/projects/{projectId}": {
      "get": {
        "operationId": "getProject",
        "summary": "Get a project by ID",
        "parameters": [
          {
            "name": "projectId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "The project ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Success"
          }
        }
      }
    }
  }
}
```

### Expected Tool Schema
```json
{
  "name": "getProject",
  "description": "Get a project by ID",
  "inputSchema": {
    "type": "object",
    "properties": {
      "projectId": {
        "type": "string",
        "description": "The project ID"
      }
    },
    "required": ["projectId"]
  }
}
```

### Expected Behavior
When Claude calls: `getProject({ "projectId": "abc123" })`
The URL should become: `https://api.example.com/projects/abc123`

---

## Test Case 2: OpenAPI with Path Parameters AND Request Body

### OpenAPI Spec (Simplified)
```json
{
  "paths": {
    "/projects/{projectId}/issues/{issueId}": {
      "put": {
        "operationId": "updateIssue",
        "summary": "Update an issue",
        "parameters": [
          {
            "name": "projectId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "issueId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "title": {
                    "type": "string"
                  },
                  "status": {
                    "type": "string",
                    "enum": ["open", "closed"]
                  }
                },
                "required": ["title"]
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Success"
          }
        }
      }
    }
  }
}
```

### Expected Tool Schema
```json
{
  "name": "updateIssue",
  "description": "Update an issue",
  "inputSchema": {
    "type": "object",
    "properties": {
      "projectId": {
        "type": "string"
      },
      "issueId": {
        "type": "string"
      },
      "title": {
        "type": "string"
      },
      "status": {
        "type": "string",
        "enum": ["open", "closed"]
      }
    },
    "required": ["projectId", "issueId", "title"]
  }
}
```

### Expected Behavior
When Claude calls:
```javascript
updateIssue({
  "projectId": "proj-123",
  "issueId": "issue-456",
  "title": "Updated Title",
  "status": "closed"
})
```

The generated code should:
1. Extract `projectId` and `issueId` from args
2. Build URL: `https://api.example.com/projects/proj-123/issues/issue-456`
3. Send body: `{ "title": "Updated Title", "status": "closed" }`

---

## Test Case 3: JSON Example Import with Path Parameters

### JSON Example Import Input

**API Name:** Project Management API  
**Base URL:** `https://api.example.com`  
**Method:** GET  
**Path:** `/users/{userId}/projects/{projectId}`  
**Request JSON:** *(leave empty for GET)*  
**Response JSON:**
```json
{
  "id": "proj-123",
  "name": "My Project",
  "ownerId": "user-456"
}
```

### Expected Tool Schema
```json
{
  "name": "get_users_userId_projects_projectId",
  "description": "Imported via JSON example",
  "inputSchema": {
    "type": "object",
    "properties": {
      "userId": {
        "type": "string",
        "description": "Path parameter: userId"
      },
      "projectId": {
        "type": "string",
        "description": "Path parameter: projectId"
      }
    },
    "required": ["userId", "projectId"]
  }
}
```

### Expected Behavior
When Claude calls: `get_users_userId_projects_projectId({ "userId": "user-789", "projectId": "proj-321" })`
The URL should become: `https://api.example.com/users/user-789/projects/proj-321`

---

## Test Case 4: JSON Example with Path Params AND Body

### JSON Example Import Input

**API Name:** Project Management API  
**Base URL:** `https://api.example.com`  
**Method:** POST  
**Path:** `/projects/{projectId}/comments`  
**Request JSON:**
```json
{
  "text": "This is a comment",
  "author": "john@example.com"
}
```

### Expected Tool Schema
```json
{
  "inputSchema": {
    "type": "object",
    "properties": {
      "projectId": {
        "type": "string",
        "description": "Path parameter: projectId"
      },
      "text": {
        "type": "string"
      },
      "author": {
        "type": "string"
      }
    },
    "required": ["projectId", "text", "author"]
  }
}
```

### Expected Behavior
When Claude calls:
```javascript
post_projects_projectId_comments({
  "projectId": "proj-123",
  "text": "Great work!",
  "author": "jane@example.com"
})
```

The generated code should:
1. Extract `projectId` from args
2. Build URL: `https://api.example.com/projects/proj-123/comments`
3. Send body: `{ "text": "Great work!", "author": "jane@example.com" }`

---

## How to Test

1. **Import the OpenAPI specs** above using the "Import from URL" or "Import from File" feature
2. **Check the Tools view** - verify that the tools show all parameters (both path and body)
3. **Edit a tool** - open the tool details and check the Request tab to see the full schema
4. **Export the MCP server** and examine the generated `src/index.ts` file
5. **Look for the URL construction code** - verify it has the path parameter replacement logic
6. **Test with Claude** - export, install, and have Claude call the tools

## Verification Checklist

- [ ] Path parameters appear in tool's `inputSchema`
- [ ] Path parameters are marked as required
- [ ] Request body parameters (if any) are also included
- [ ] Generated code replaces `{param}` with values in the URL
- [ ] Generated code URL-encodes the path parameters
- [ ] Generated code removes path params from requestArgs before sending body
- [ ] Claude can successfully call tools with path parameters
