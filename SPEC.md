# MCP Builder Desktop (MVP Spec)

A desktop, dashboard-style tool for visually creating **MCP servers from REST APIs**, exporting a ready-to-run MCP implementation compatible with Claude.  
Built as a **Tauri desktop app**, optimized for fast scanning, editing, and iteration — not step-by-step wizards.

---

## 1. Goal

Create a **single-page visual editor** that allows users to:

- Import **multiple REST APIs**
- Generate and manage MCP tools from:
  - OpenAPI specs
  - Example JSON payloads
- Visually inspect and edit:
  - APIs
  - Tools
  - Schemas
  - Auth and guardrails
- Export a **fully compliant MCP server**
- Paste a generated config snippet directly into **Claude**

---

## 2. Non-goals (MVP)

- No in-app testing or chat UI
- No hosted deployment
- No non-REST connectors
- No marketplace or sharing

---

## 3. UX Model — One-Page Dashboard

### Layout

**Left Sidebar**
- Project selector
- APIs
- Tools
- Auth & Policies
- Export

**Main Canvas (always visible sections)**

### 3.1 Project Overview
- Project name
- Description
- MCP runtime target (Node.js + TypeScript for MVP)
- Summary chips:
  - APIs count
  - Tools count
  - Auth types used

---

### 3.2 APIs Panel (multi-API)
Card per API:
- Name
- Base URL(s)
- Auth type(s)
- Import source (OpenAPI / JSON)
- Endpoint count

Click → opens API Detail Drawer

---

### 3.3 Tools Panel
Table view:
- Tool name
- HTTP method
- Path
- API
- Auth
- Enabled toggle
- Guardrail flags

Search + filter by API / method / auth

Click → opens Tool Detail Drawer

---

### 3.4 Auth & Policies Panel
- Auth schemes per API
- OAuth configuration
- Global and per-tool guardrails

---

### 3.5 Export Panel
- Export MCP Server
- Copy Claude config snippet
- Generate `.env.example`

---

## 4. REST API Imports

### 4.1 OpenAPI Import (Primary)

**Input**
- OpenAPI v3 URL or local file

**Parsed**
- Title / name
- Base URLs
- Paths and operations
- Security schemes
- Request schemas
- Response schemas (200 JSON preferred)

**Tool Generation**
- 1 tool per operation
- Tool name:
  - `operationId` preferred
  - Fallback: `{method}_{path}`
- Request schema:
  - requestBody OR merged parameters
- Response schema:
  - Best-effort JSON schema or `unknown`

**MVP Constraints**
- JSON only
- Ignore XML / multipart
- Ignore callbacks / webhooks

---

### 4.2 JSON Example Import (No OpenAPI)

**Input**
- API name
- Base URL
- HTTP method
- Path template (e.g. `/issues/{id}`)
- Example request JSON
- Example response JSON (optional)

**Generated**
- Tool definition
- Inferred request schema
- Inferred response schema

**Schema Inference Rules**
- Primitive type detection
- Objects → recursive inference
- Arrays → infer from first non-null element
- Required fields inferred from presence
- Editable post-import

---

## 5. Tool Configuration

### 5.1 Tool Fields (MVP)

- id
- apiId
- name
- description
- method
- path
- baseUrlOverride (optional)
- authSchemeId
- headers (key/value, templated)
- query parameters
- path parameters
- requestSchema
- responseSchema
- enabled
- guardrails:
  - confirmationRequired
  - readOnly

---

### 5.2 Tool Detail Drawer Tabs

**Basics**
- Name
- Description
- Enabled
- Guardrails

**Request**
- JSON schema editor
- Example payload editor

**Response**
- JSON schema editor
- Example payload editor

**HTTP**
- Method
- Path
- Base URL
- Headers
- Params

**Auth**
- Select auth scheme
- Override auth (optional)

---

## 6. Authentication Support (MVP)

Auth is **per API**, selectable per tool.

### 6.1 Supported Auth Types

#### API Key
- Header or query param
- Example:
  - `x-api-key: {{API_KEY}}`

#### Bearer Token
- `Authorization: Bearer {{TOKEN}}`

#### Basic Auth
- Username + password

---

### 6.2 OAuth 2.0 (Included in MVP)

OAuth is supported as a **configurable but external-flow model**.

#### Supported Grant Types
- Authorization Code (primary)
- Client Credentials (optional)

#### OAuth Configuration Fields
- client_id
- client_secret (stored in OS keychain)
- authorization_url
- token_url
- scopes
- audience (optional)
- refresh_token_support (boolean)

#### Runtime Model
- OAuth token acquisition **not handled in UI**
- MCP server expects:
  - Access token via env var OR
  - Pre-generated token file
- Token refresh logic included in exported server (optional toggle)

#### Tool Behavior
- OAuth applied per API
- Tools inherit OAuth unless overridden
- Tokens injected automatically into Authorization header

---

## 7. Guardrails (Metadata + Runtime Hints)

Per-tool and/or global:

- `readOnly`
- `confirmationRequired`
- `rateLimitHint` (metadata only)
- `allowedBaseUrls`

These are:
- Emitted into MCP tool metadata
- Optionally enforced in runtime middleware

---

## 8. Export Format (Claude-ready)

### 8.1 Exported Folder Structure

mcp-server/
├── package.json
├── tsconfig.json
├── src/
│ ├── server.ts
│ ├── tools/
│ │ └── *.tool.ts
│ ├── http/
│ │ └── client.ts
│ └── auth/
│ ├── apiKey.ts
│ ├── bearer.ts
│ └── oauth.ts
├── .env.example
├── mcp-project.json
└── README.md

---

### 8.2 MCP Server Characteristics

- Node.js + TypeScript
- One command to run
- Tools registered dynamically from config
- Auth injected via middleware
- Schema validation optional but recommended

---

### 8.3 Claude Config Snippet (Generated)

- Command
- Arguments
- Required environment variables
- Ready to paste into Claude Desktop MCP config

---

## 9. Desktop Architecture (Tauri)

### 9.1 Frontend
- React (or Svelte)
- Local state store
- JSON Schema editor component
- Drawer-based editing UX

### 9.2 Backend (Rust)
- File system access
- Zip export
- OpenAPI parsing (or delegated to frontend)
- OS keychain integration for secrets

---

## 10. Project Storage

Single project file:
my-project.mcpb.json

Contains:
- APIs
- Tools
- Schemas
- Auth metadata (no secrets)
- UI state

Secrets stored via OS keychain only.

---

## 11. Core Data Models

### Project
- id
- name
- description
- runtime
- apis[]
- tools[]
- authSchemes[]

### API
- id
- name
- baseUrls[]
- importSource
- openapiRaw (optional)

### Tool
- id
- apiId
- name
- method
- path
- schemas
- guardrails
- enabled

### AuthScheme
- id
- apiId
- type (apiKey | bearer | basic | oauth)
- config
- secretRefId

---

## 12. MVP Build Phases

### Phase 1
- Project creation
- OpenAPI import
- Tool generation
- Export MCP server

### Phase 2
- JSON example import
- Schema inference

### Phase 3
- Multiple APIs
- OAuth support
- Per-tool auth overrides

### Phase 4
- Guardrails
- UX polish
- Validation and error handling

---

## 13. Definition of Done (MVP)

- Import multiple REST APIs
- Generate tools from OpenAPI and JSON examples
- Visually manage tools in one dashboard
- Configure API Key, Bearer, and OAuth auth
- Export a runnable MCP server
- Paste config directly into Claude
- Secrets never stored in project files

---

**This MVP intentionally treats MCP as a product surface, not a code exercise.**