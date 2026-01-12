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
          args: ["/path/to/exported-server/dist/index.js"],
          env: {
            "API_KEY": "your-api-key"
          }
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
        <h3 className="text-lg font-semibold mb-4">Claude Desktop Configuration</h3>
        <p className="mb-4 text-gray-600">
          Add this configuration to your Claude Desktop config file to use your new server.
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
      </div>
    </div>
  );
}
