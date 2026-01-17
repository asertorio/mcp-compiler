import { useState, useMemo } from 'react';
import { useProjectStore } from '../store/projectStore';
import { generateMCPProjectZip } from '../lib/export-service';
import { validateProject, ValidationIssue } from '../lib/validation';
import { Download, Copy, Check, AlertTriangle, XCircle } from 'lucide-react';

export function ExportManager() {
  const { project } = useProjectStore();
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const validationIssues = useMemo(() => {
    if (!project) return [];
    return validateProject(project);
  }, [project]);

  const hasErrors = validationIssues.some(i => i.severity === 'error');

  if (!project) return <div>No project loaded</div>;

  const handleExport = async () => {
    if (hasErrors) {
        alert("Please fix validation errors before exporting.");
        return;
    }
    setIsExporting(true);
    try {
      const blob = await generateMCPProjectZip(project);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name.toLowerCase().replace(/\s+/g, '-')}-mcp-server.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. See console for details.');
    } finally {
      setIsExporting(false);
    }
  };

  const getClaudeConfig = () => {
    const projectName = project.name.toLowerCase().replace(/\s+/g, '-');
    const config = {
      mcpServers: {
        [projectName]: {
          command: "node",
          args: ["/absolute/path/to/exported-server/dist/index.js"]
        }
      }
    };
    return JSON.stringify(config, null, 2);
  };

  const handleCopyConfig = () => {
    navigator.clipboard.writeText(getClaudeConfig());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Export MCP Server</h2>
      
      {validationIssues.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            {hasErrors ? <XCircle className="text-red-500" /> : <AlertTriangle className="text-yellow-500" />}
            Validation Issues
          </h3>
          <div className="space-y-3">
            {validationIssues.map((issue, i) => (
              <div key={i} className={`p-3 rounded border ${issue.severity === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-yellow-50 border-yellow-200 text-yellow-700'}`}>
                {issue.context && <div className="font-semibold text-sm mb-1">{issue.context}</div>}
                <div>{issue.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Download Server Code</h3>
        <p className="mb-4 text-gray-600">
          Generate a complete Node.js MCP server project. This includes:
        </p>
        <ul className="list-disc list-inside mb-6 text-gray-600 ml-4">
          <li>Complete TypeScript source code</li>
          <li>Package configuration (package.json)</li>
          <li>Tool definitions and handlers</li>
          <li>Authentication scaffolding</li>
          <li>Documentation</li>
        </ul>
        
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          <Download size={20} />
          {isExporting ? 'Generating Zip...' : 'Download Project Zip'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Setup Instructions</h3>
        
        <div className="space-y-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <h4 className="font-semibold text-blue-900 mb-2">1. Extract the Downloaded Zip</h4>
            <p className="text-blue-800 text-sm">Unzip the downloaded file to a permanent location on your computer.</p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded p-4">
            <h4 className="font-semibold text-green-900 mb-2">2. Configure Environment Variables</h4>
            <p className="text-green-800 text-sm mb-2">
              Copy <code className="bg-white px-1 rounded">.env.example</code> to <code className="bg-white px-1 rounded">.env</code> and fill in your credentials:
            </p>
            <pre className="bg-white p-2 rounded text-xs text-green-900 overflow-x-auto">
              cp .env.example .env{'\n'}# Then edit .env with your actual API keys/tokens
            </pre>
            <p className="text-green-800 text-sm mt-2">
              <strong>Important:</strong> Never commit the .env file to version control!
            </p>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded p-4">
            <h4 className="font-semibold text-purple-900 mb-2">3. Install Dependencies & Build</h4>
            <pre className="bg-white p-2 rounded text-xs text-purple-900 overflow-x-auto">
              npm install{'\n'}npm run build
            </pre>
          </div>
        </div>
        
        <h4 className="font-semibold mb-2">4. Add to Claude Desktop Config</h4>
        <p className="mb-4 text-gray-600 text-sm">
          Add this to your <code className="bg-gray-100 px-1 rounded">claude_desktop_config.json</code>. 
          Replace the path with the absolute path to your extracted server.
        </p>
        
        <div className="relative">
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
            {getClaudeConfig()}
          </pre>
          <button
            onClick={handleCopyConfig}
            className="absolute top-2 right-2 p-2 bg-white rounded shadow hover:bg-gray-50"
            title="Copy to clipboard"
          >
            {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
          </button>
        </div>
        
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded p-3">
          <p className="text-yellow-800 text-sm">
            <strong>Note:</strong> Do NOT include environment variables in the Claude config. 
            Credentials are loaded from the .env file automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
