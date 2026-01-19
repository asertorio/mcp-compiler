# MCP Builder

A web-based visual tool for creating **MCP (Model Context Protocol) servers** from REST APIs. Build, configure, and export MCP servers that integrate with Claude and other AI assistants.

## 🎯 Features

- 🔌 **Multi-API Support** - Import and manage multiple REST APIs in a single project
- 📝 **Flexible Import** - Import from OpenAPI/Swagger specs or create from JSON examples
- 🛠️ **Visual Tool Management** - Dashboard-style interface for managing MCP tools
- 🔐 **Authentication Support** - API Key, Bearer Token, Basic Auth, and OAuth 2.0 (with PKCE)
- 🎯 **Schema Editor** - Visual JSON schema editing with inference from examples
- 📚 **Resources Manager** - Create and manage static MCP resources (documentation, markdown content)
- 💬 **Prompt Configuration** - Define custom system prompts for your MCP server
- 📦 **One-Click Export** - Generate complete, ready-to-run MCP server projects
- 🤖 **Claude-Ready** - Auto-generate configuration snippets for Claude Desktop

## 🚀 Quick Start

### Installation

```bash
cd app
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the next available port).

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory, ready to be served by any static file server.

### Preview Production Build

```bash
npm run preview
```

## 📖 Usage

1. **Create a Project** - Start with a new MCP server project or load an existing one
2. **Import APIs** - Add REST APIs via OpenAPI spec URL/file or JSON examples
3. **Configure Tools** - Edit tool parameters, schemas, guardrails, and authentication
4. **Set Up Auth** - Configure API keys, tokens, Basic Auth, or OAuth 2.0 flows (including PKCE)
5. **Add Resources** - Create static documentation or markdown resources to expose via MCP
6. **Configure Prompt** - Optionally define a system prompt for your MCP server
7. **Export** - Generate a complete MCP server project with all configurations
8. **Deploy** - Copy the Claude config snippet and run your MCP server

## 🏗️ Project Structure

```
mcp-compiler/
├── app/                  # Main web application (React + TypeScript)
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── ApiManager.tsx         # API import and management
│   │   │   ├── ToolsManager.tsx       # Tools table and editing
│   │   │   ├── AuthManager.tsx        # Authentication configuration
│   │   │   ├── ResourcesManager.tsx   # MCP resources management
│   │   │   ├── PromptsManager.tsx     # Prompt configuration
│   │   │   ├── ExportManager.tsx      # Export functionality
│   │   │   ├── SchemaEditor.tsx       # JSON schema editor
│   │   │   ├── SchemaFieldsEditor.tsx # Schema fields visual editor
│   │   │   ├── Sidebar.tsx            # Navigation sidebar
│   │   │   ├── Drawer.tsx             # Drawer component for detail views
│   │   │   └── common/                # Shared components
│   │   │       ├── EmptyState.tsx     # Empty state component
│   │   │       ├── SearchInput.tsx    # Search input component
│   │   │       └── Tooltip.tsx        # Tooltip component
│   │   ├── lib/              # Core services
│   │   │   ├── openapi-import.ts      # OpenAPI parsing
│   │   │   ├── json-schema-inference.ts  # Schema inference from JSON
│   │   │   ├── export-service.ts      # MCP server generation
│   │   │   ├── project-service.ts     # Project persistence (file I/O)
│   │   │   ├── secret-service.ts      # Secret storage abstraction
│   │   │   └── validation.ts          # Validation utilities
│   │   ├── hooks/            # Custom React hooks
│   │   │   └── useAutosave.ts         # Auto-save functionality
│   │   ├── store/            # State management (Zustand)
│   │   │   └── projectStore.ts        # Global project state
│   │   ├── types/            # TypeScript type definitions
│   │   │   └── index.ts               # Core type definitions
│   │   └── main.tsx          # Application entry point
│   ├── public/               # Static assets
│   └── package.json
├── examples/            # Example projects and test cases
├── SPEC.md             # Project specification
└── PLAN.md             # Development roadmap
```

## 🛠️ Tech Stack

- **React 19** - UI framework with hooks
- **TypeScript** - Type safety and modern JavaScript features
- **Vite** - Build tool and dev server with HMR
- **Zustand** - Lightweight state management
- **Lucide React** - Modern icon library
- **Swagger Parser** - OpenAPI/Swagger spec parsing
- **JSZip** - Export packaging and compression
- **js-yaml** - YAML parsing support

## 📋 MCP Capabilities

The generated MCP servers support all three core MCP primitives:

### Tools
REST API endpoints exposed as Claude-compatible tools with:
- Request/response schemas
- Path and query parameters
- Custom headers
- Guardrails (read-only, confirmation required, rate limits)
- Per-tool or per-API authentication

### Resources
Static content exposed via MCP resources:
- Markdown documentation
- Configuration data
- Reference materials
- Custom URIs (e.g., `docs://readme`, `resource://config`)

### Prompts
System prompts that shape Claude's behavior:
- Reusable prompt templates
- Context-specific instructions
- Custom prompt definitions

## 💻 Development Notes

### Project Persistence

The application supports local file-based project storage:
- Projects are saved as `.mcpb.json` files
- Auto-save functionality keeps your work in localStorage
- Full project import/export via file system
- No cloud storage required

### Secret Storage

The application uses localStorage for secret storage in development. This is **NOT secure for production**. For a production deployment, integrate a secure secret management solution.

### OAuth 2.0 Support

Advanced OAuth 2.0 configuration includes:
- Authorization Code and Client Credentials flows
- PKCE (Proof Key for Code Exchange) support
- Flexible token request formats (JSON/form-encoded)
- Custom authentication parameters
- Token refresh support

### Browser Compatibility

Modern browsers with ES2020+ support are required. Tested on:
- Chrome/Edge 90+
- Firefox 90+
- Safari 14+

## 📝 License

See repository license file for details.

## 🤝 Contributing

This project follows secure coding practices for both Node.js and Python. See the workspace rules for security guidelines that must be followed for all contributions.

---

**Built for the Model Context Protocol (MCP)** - enabling AI assistants to interact with external systems through a standardized interface.
