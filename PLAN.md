# MCP Builder — Build Checklist for AI Coding Agent

This checklist is ordered so an AI coding agent can **incrementally build a working MVP**, with clear stopping points and validation criteria.  
Target: **Web application** that visually builds and exports REST-based MCP servers.

---

## 0. Global Constraints (Read First)

- Application: **Web-based (React + Vite)**
- Frontend: **React + TypeScript**
- MCP runtime target: **Node.js + TypeScript**
- Scope: REST APIs only
- No in-app testing or chat UI
- Output must be **Claude-ready MCP server**

---

## 1. Project Bootstrapping

### 1.1 Repository Setup
- [x] Create monorepo or single repo with:
  - [x] `/app` (Web frontend with Vite + React)
  - [x] `/export-templates` (MCP server template)
- [x] Initialize Vite project with React
- [x] Configure hot reload for frontend
- [x] Add basic app shell layout

**Done when**
- App launches in browser
- Static UI renders without errors

---

## 2. Core UI Layout (One-Page Dashboard)

### 2.1 Shell Layout
- [x] Left sidebar (fixed width)
- [x] Main canvas (scrollable)
- [x] Drawer/modal system for detail editing

### 2.2 Sidebar Sections
- [x] Project
- [x] APIs
- [x] Tools
- [x] Auth & Policies
- [x] Export

**Done when**
- All sections are visible
- Drawer opens/closes correctly

---

## 3. Project State Model

### 3.1 Define Core Types
- [x] Project
- [x] API
- [x] Tool
- [x] AuthScheme

### 3.2 State Management
- [x] Implement global store (Zustand/Redux)
- [x] Load/save project to local file
- [x] Autosave on change

**Done when**
- Project state survives app restart
- No secrets stored in project file

---

## 4. API Import — OpenAPI

### 4.1 OpenAPI Intake
- [ ] Support import from:
  - URL
  - Local file
- [ ] Parse OpenAPI v3 JSON
- [ ] Extract:
  - API name
  - Base URLs
  - Paths & operations
  - Security schemes
  - Request/response schemas

### 4.2 Tool Generation
- [ ] Create one tool per operation
- [ ] Name via `operationId` fallback to `method_path`
- [ ] Generate request schema
- [ ] Generate response schema (best-effort)

### 4.3 API Card UI
- [ ] Display imported API as a card
- [ ] Show endpoint count and auth types

**Done when**
- Importing an OpenAPI spec creates visible tools

---

## 5. API Import — JSON Example

### 5.1 JSON Intake
- [x] Manual entry:
  - [x] API name
  - [x] Base URL
  - [x] Method
  - [x] Path
  - [x] Request JSON
  - [x] Response JSON (optional)

### 5.2 Schema Inference
- [x] Infer primitive types
- [x] Infer objects recursively
- [x] Infer arrays from first non-null element
- [x] Mark required fields

### 5.3 Tool Creation
- [x] Create tool from inferred schema
- [x] Allow manual edits post-import

**Done when**
- [x] JSON example produces a usable MCP tool

---

## 6. Tools Table & Drill-In Editing

### 6.1 Tools Table
- [x] Table with:
  - Name
  - Method
  - Path
  - API
  - Auth
  - Enabled toggle
- [x] Filter by API / method

### 6.2 Tool Detail Drawer
Tabs:
- [x] Basics (name, description, enabled, guardrails)
- [x] Request (schema + example editor)
- [x] Response (schema + example editor)
- [x] HTTP (method, path, headers, params)
- [x] Auth (select scheme)

**Done when**
- [x] Editing a tool updates project state live

---

## 7. Authentication System

### 7.1 Auth Scheme Models
- [x] API Key
- [x] Bearer Token
- [x] Basic Auth
- [x] OAuth 2.0

### 7.2 OAuth Support
- [x] Fields:
  - client_id
  - client_secret (keychain only)
  - auth URL
  - token URL
  - scopes
- [x] Assign OAuth per API
- [x] Inherit OAuth per tool

### 7.3 Secret Storage
- [x] Implement secret storage abstraction (localStorage for web)
- [x] Reference secrets by ID only

**Done when**
- [x] Secrets never appear in project JSON

---

## 8. Guardrails & Policies

### 8.1 Guardrail Flags
- [x] readOnly
- [x] confirmationRequired
- [x] rateLimitHint (metadata only)

### 8.2 UI Integration
- [x] Editable per tool
- [x] Visible in tools table

**Done when**
- [x] Guardrails persist and export correctly

---

## 9. MCP Export Engine
   
   ### 9.1 Export Template
   - [x] Node.js + TypeScript MCP server scaffold
   - [x] Tool registration system
   - [x] HTTP client abstraction
   - [x] Auth middleware (API key, bearer, OAuth)
   
   ### 9.2 Export Process
   - [x] Generate:
     - `/src/server.ts`
     - Tool handlers
     - Auth modules
     - `.env.example`
     - `mcp-project.json`
   - [x] Zip or folder output
   
   ### 9.3 Claude Config Snippet
   - [x] Generate command + args
   - [x] List required env vars
   - [x] Copy-to-clipboard support
   
   **Done when**
   - [x] Exported MCP server runs with one command

---

## 10. OAuth Runtime Support (Exported Server)

- [x] Token injection into Authorization header
- [x] Optional refresh token logic
- [x] Fail fast on missing tokens

**Done when**
- [x] OAuth-protected APIs are callable by MCP

---

## 11. Validation & Error Handling
   
   - [x] OpenAPI parsing errors surfaced in UI
   - [x] Schema validation warnings
   - [x] Export-time checks:
     - Missing auth
     - Disabled tools
     - Empty schemas

---

## 12. Polishing & UX
   
   - [x] Fast search
   - [x] Keyboard navigation
   - [x] Clear empty states
   - [x] Inline help/tooltips
   
   ---
   
   ## 13. Final Acceptance Criteria (MVP)

- [ ] Multiple REST APIs per project
- [ ] OpenAPI + JSON example imports
- [ ] Visual tool management dashboard
- [ ] API Key, Bearer, Basic, OAuth auth
- [ ] OS-level secret storage
- [ ] Exportable MCP server
- [ ] Claude-ready config snippet
- [ ] No secrets in project files

---

## 14. Stretch (Optional)

- OAuth token fetch helper
- Tool grouping by tag
- Schema diffing on re-import
- MCP server hot-reload template

---

**Instruction to AI Agent:**  
Build strictly in checklist order.  
Do not expand scope unless explicitly instructed.  
Prefer working software over abstractions.