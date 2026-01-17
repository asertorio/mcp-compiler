# MCP Builder

A web-based visual tool for creating **MCP (Model Context Protocol) servers** from REST APIs. Build, configure, and export production-ready MCP servers that integrate with Claude and other AI assistants.

## Features

- 🔌 **Multi-API Support** - Import and manage multiple REST APIs in a single project
- 📝 **Flexible Import** - Import from OpenAPI/Swagger specs or create from JSON examples
- 🛠️ **Visual Tool Management** - Dashboard-style interface for managing MCP tools
- 🔐 **Authentication Support** - API Key, Bearer Token, Basic Auth, and OAuth 2.0
- 🎯 **Schema Editor** - Visual JSON schema editing with inference from examples
- 📦 **One-Click Export** - Generate complete, ready-to-run MCP server projects
- 🤖 **Claude-Ready** - Auto-generate configuration snippets for Claude Desktop

## Quick Start

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

## Project Structure

```
app/
├── src/
│   ├── components/       # React components
│   │   ├── ApiManager.tsx       # API import and management
│   │   ├── ToolsManager.tsx     # Tools table and editing
│   │   ├── AuthManager.tsx      # Authentication configuration
│   │   ├── ExportManager.tsx    # Export functionality
│   │   ├── SchemaEditor.tsx     # JSON schema editor
│   │   └── common/              # Shared components
│   ├── lib/              # Core services
│   │   ├── openapi-import.ts    # OpenAPI parsing
│   │   ├── json-schema-inference.ts  # Schema inference from JSON
│   │   ├── export-service.ts    # MCP server generation
│   │   ├── project-service.ts   # Project persistence
│   │   └── secret-service.ts    # Secret storage abstraction
│   ├── store/            # State management (Zustand)
│   ├── types/            # TypeScript type definitions
│   └── main.tsx          # Application entry point
├── public/               # Static assets
└── package.json
```

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Zustand** - State management
- **Lucide React** - Icons
- **Swagger Parser** - OpenAPI spec parsing
- **JSZip** - Export packaging

## Usage

1. **Create a Project** - Start with a new MCP server project
2. **Import APIs** - Add REST APIs via OpenAPI spec URL/file or JSON examples
3. **Configure Tools** - Edit tool parameters, schemas, and authentication
4. **Set Up Auth** - Configure API keys, tokens, or OAuth flows
5. **Export** - Generate a complete MCP server project
6. **Deploy** - Copy the Claude config snippet and run your MCP server

## Development Notes

### Secret Storage

The application uses localStorage for secret storage in development. This is **NOT secure for production**. For a production deployment, integrate a secure secret management solution.

### Browser Compatibility

Modern browsers with ES2020+ support are required. Tested on:
- Chrome/Edge 90+
- Firefox 90+
- Safari 14+

## License

See repository license file for details.
