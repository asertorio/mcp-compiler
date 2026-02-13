import { useState, useRef } from 'react';
import { useProjectStore } from '../store/projectStore';
import { importOpenApi } from '../lib/openapi-import';
import { inferSchema } from '../lib/json-schema-inference';
import { v4 as uuidv4 } from 'uuid';
import { Globe, Plus, Trash2, FileJson, Link as LinkIcon, AlertCircle, Code } from 'lucide-react';
import { SearchInput } from './common/SearchInput';
import { EmptyState } from './common/EmptyState';

export function ApiManager() {
  const { project, deleteApi, importApiData, updateApi } = useProjectStore();
  const [isImporting, setIsImporting] = useState(false);
  const [importType, setImportType] = useState<'url' | 'file' | 'json'>('url');
  const [search, setSearch] = useState('');
  
  // OpenAPI State
  const [urlInput, setUrlInput] = useState('');
  const [fileInput, setFileInput] = useState<File | null>(null);
  
  // JSON Import State
  const [apiName, setApiName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'>('GET');
  const [path, setPath] = useState('');
  const [requestJson, setRequestJson] = useState('{\n  \n}');
  const [responseJson, setResponseJson] = useState('{\n  \n}');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async () => {
    setError(null);
    setIsLoading(true);
    
    try {
      if (importType === 'json') {
        // Validation
        if (!apiName) throw new Error('API Name is required');
        if (!baseUrl) throw new Error('Base URL is required');
        if (!path) throw new Error('Path is required');
        
        let reqSchema = null;
        try {
           if (requestJson.trim()) {
               const parsedReq = JSON.parse(requestJson);
               reqSchema = inferSchema(parsedReq);
           }
        } catch (e) {
            throw new Error('Invalid Request JSON');
        }

        // Extract path parameters from the path template (e.g., /projects/{projectId}/issues/{issueId})
        const pathParams = (path.match(/\{([^}]+)\}/g) || []).map(p => p.slice(1, -1));
        
        // If we have path parameters, add them to the schema
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
          
          // Merge path params with request body schema
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
          } else {
            reqSchema = {
              type: 'object',
              properties: pathParamProperties,
              required: pathParamRequired
            };
          }
        }

        let resSchema = null;
        try {
            if (responseJson.trim()) {
                const parsedRes = JSON.parse(responseJson);
                resSchema = inferSchema(parsedRes);
            }
        } catch (e) {
            throw new Error('Invalid Response JSON');
        }

        const apiId = uuidv4();
        const api = {
            id: apiId,
            name: apiName,
            baseUrl: baseUrl,
            authType: 'none', // Default, can be changed later
            spec: null // Not from OpenAPI
        };

        const tool = {
            id: uuidv4(),
            apiId: apiId,
            name: `${method.toLowerCase()}_${path.replace(/[^a-zA-Z0-9]/g, '_').replace(/^_+|_+$/g, '')}`,
            description: `Imported via JSON example`,
            method: method,
            path: path,
            requestSchema: reqSchema || { type: 'object', properties: {} }, 
            responseSchema: resSchema || { type: 'object', properties: {} },
            enabled: true,
            guardrails: { readOnly: false, confirmationRequired: false }
        };

        // Note: 'parameters' in Tool usually refers to the MCP tool parameters which map to the API request. 
        // For REST, arguments often map to query params or JSON body. 
        // The inferSchema returns a schema that we can use as the "input" schema for the tool.
        // We'll treat the inferred schema as the tool's input schema.
        
        importApiData(api, [tool], []);
        
        // Reset
        setApiName('');
        setBaseUrl('');
        setPath('');
        setRequestJson('{\n  \n}');
        setResponseJson('{\n  \n}');

      } else {
        // OpenAPI Import
        let source: string | File;
        if (importType === 'url') {
          if (!urlInput) throw new Error('Please enter a URL');
          source = urlInput;
        } else {
          if (!fileInput) throw new Error('Please select a file');
          source = fileInput;
        }

        const { api, tools, authSchemes } = await importOpenApi(source);
        importApiData(api, tools, authSchemes);
        setUrlInput('');
        setFileInput(null);
      }
      
      setIsImporting(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import API');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileInput(e.target.files[0]);
    }
  };

  if (!project) return <div>No project loaded</div>;

  const filteredApis = project.apis.filter(api => 
    api.name.toLowerCase().includes(search.toLowerCase()) || 
    api.baseUrl.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="api-manager">
      <div className="header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>APIs</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          {project.apis.length > 0 && (
            <SearchInput 
              value={search} 
              onChange={setSearch} 
              placeholder="Search APIs..." 
            />
          )}
          <button className="primary-btn" onClick={() => setIsImporting(!isImporting)}>
            <Plus size={16} style={{ marginRight: '8px' }} />
            Import API
          </button>
        </div>
      </div>

      {isImporting && (
        <div className="import-card" style={{ 
          background: '#1a1a1a', 
          padding: '20px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          border: '1px solid #333'
        }}>
          <h3>Import API Definition</h3>
          
          <div className="tabs" style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <button 
              className={importType === 'url' ? 'active' : ''} 
              onClick={() => setImportType('url')}
              style={{ flex: 1, padding: '8px', background: importType === 'url' ? '#333' : 'transparent', border: '1px solid #333', cursor: 'pointer', color: '#fff' }}
            >
              <LinkIcon size={14} style={{ marginRight: '5px' }} /> URL
            </button>
            <button 
              className={importType === 'file' ? 'active' : ''} 
              onClick={() => setImportType('file')}
              style={{ flex: 1, padding: '8px', background: importType === 'file' ? '#333' : 'transparent', border: '1px solid #333', cursor: 'pointer', color: '#fff' }}
            >
              <FileJson size={14} style={{ marginRight: '5px' }} /> File
            </button>
            <button 
              className={importType === 'json' ? 'active' : ''} 
              onClick={() => setImportType('json')}
              style={{ flex: 1, padding: '8px', background: importType === 'json' ? '#333' : 'transparent', border: '1px solid #333', cursor: 'pointer', color: '#fff' }}
            >
              <Code size={14} style={{ marginRight: '5px' }} /> JSON Example
            </button>
          </div>

          <div className="input-group" style={{ marginBottom: '15px' }}>
            {importType === 'url' && (
              <input 
                type="text" 
                placeholder="https://api.example.com/openapi.json" 
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                style={{ width: '100%', padding: '8px', background: '#222', border: '1px solid #444', color: '#fff' }}
              />
            )}
            
            {importType === 'file' && (
              <div 
                className="file-drop" 
                onClick={() => fileInputRef.current?.click()}
                style={{ 
                  border: '2px dashed #444', 
                  padding: '20px', 
                  textAlign: 'center', 
                  cursor: 'pointer',
                  background: '#222'
                }}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  style={{ display: 'none' }} 
                  accept=".json,.yaml,.yml"
                />
                <p>{fileInput ? fileInput.name : 'Click to select OpenAPI file (JSON/YAML)'}</p>
              </div>
            )}

            {importType === 'json' && (
                <div className="json-import-form" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input 
                        type="text" 
                        placeholder="API Name (e.g. My Service)" 
                        value={apiName}
                        onChange={(e) => setApiName(e.target.value)}
                        style={{ padding: '8px', background: '#222', border: '1px solid #444', color: '#fff' }}
                    />
                    <input 
                        type="text" 
                        placeholder="Base URL (e.g. https://api.myservice.com/v1)" 
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                        style={{ padding: '8px', background: '#222', border: '1px solid #444', color: '#fff' }}
                    />
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <select 
                            value={method}
                            onChange={(e) => setMethod(e.target.value as any)}
                            style={{ padding: '8px', background: '#222', border: '1px solid #444', color: '#fff', width: '100px' }}
                        >
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="DELETE">DELETE</option>
                            <option value="PATCH">PATCH</option>
                        </select>
                        <input 
                            type="text" 
                            placeholder="Path (e.g. /users)" 
                            value={path}
                            onChange={(e) => setPath(e.target.value)}
                            style={{ flex: 1, padding: '8px', background: '#222', border: '1px solid #444', color: '#fff' }}
                        />
                    </div>
                    
                    <div>
                        <label style={{display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#ccc'}}>Request Example (JSON)</label>
                        <textarea
                            value={requestJson}
                            onChange={(e) => setRequestJson(e.target.value)}
                            rows={5}
                            style={{ width: '100%', padding: '8px', background: '#222', border: '1px solid #444', color: '#fff', fontFamily: 'monospace' }}
                        />
                    </div>
                     <div>
                        <label style={{display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#ccc'}}>Response Example (JSON)</label>
                        <textarea
                            value={responseJson}
                            onChange={(e) => setResponseJson(e.target.value)}
                            rows={5}
                            style={{ width: '100%', padding: '8px', background: '#222', border: '1px solid #444', color: '#fff', fontFamily: 'monospace' }}
                        />
                    </div>
                </div>
            )}
          </div>

          {error && (
            <div className="error-message" style={{ color: '#ff6b6b', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button onClick={() => setIsImporting(false)} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleImport} disabled={isLoading} style={{ padding: '8px 16px', background: '#007acc', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer' }}>
              {isLoading ? 'Importing...' : 'Import'}
            </button>
          </div>
        </div>
      )}

      <div className="api-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {project.apis.length === 0 ? (
          <div style={{ gridColumn: '1 / -1' }}>
            <EmptyState 
              icon={<Globe />}
              title="No APIs imported yet"
              description="Import an OpenAPI definition or use a JSON example to start building your MCP tools."
            />
          </div>
        ) : filteredApis.length === 0 ? (
          <div style={{ gridColumn: '1 / -1' }}>
            <EmptyState 
              icon={<Globe />}
              title="No APIs match your search"
              description="Try changing your search terms."
            />
          </div>
        ) : (
          filteredApis.map(api => (
            <div key={api.id} className="api-card" style={{ 
              background: '#252526', 
              padding: '20px', 
              borderRadius: '8px', 
              border: '1px solid #333',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{api.name}</h3>
                <button 
                  onClick={() => deleteApi(api.id)}
                  style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', padding: '4px' }}
                  title="Remove API"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div style={{ fontSize: '0.9rem', color: '#888', marginBottom: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {api.baseUrl}
              </div>

              <div style={{ marginBottom: '15px' }}>
                <select 
                  value={api.defaultAuthId || ''} 
                  onChange={(e) => updateApi(api.id, { defaultAuthId: e.target.value || undefined })}
                  style={{ width: '100%', padding: '6px', background: '#333', border: '1px solid #444', color: '#fff', borderRadius: '4px', fontSize: '0.85rem' }}
                >
                  <option value="">No Auth (None)</option>
                  {project.authSchemes.map(auth => (
                    <option key={auth.id} value={auth.id}>{auth.name} ({auth.type})</option>
                  ))}
                </select>
              </div>

              <div className="stats" style={{ display: 'flex', gap: '15px', fontSize: '0.85rem', color: '#aaa', borderTop: '1px solid #333', paddingTop: '12px' }}>
                <div>
                  <strong style={{ color: '#fff' }}>{project.tools.filter(t => t.apiId === api.id).length}</strong> Endpoints
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
