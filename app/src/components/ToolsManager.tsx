import React, { useState } from 'react';
import { useProjectStore } from '../store/projectStore';
import { Tool, HttpMethod, API } from '../types';
import { Drawer } from './Drawer';
import { SchemaEditor } from './SchemaEditor';
import { Search, Filter, Edit2, Trash2, Check, X as XIcon, Settings, Lock, FileText, Globe } from 'lucide-react';
import { Tooltip } from './common/Tooltip';
import { SearchInput } from './common/SearchInput';
import { EmptyState } from './common/EmptyState';

export function ToolsManager() {
  const { project, updateTool, deleteTool } = useProjectStore();
  const [search, setSearch] = useState('');
  const [filterApi, setFilterApi] = useState<string>('all');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  
  // Drawer State
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'basics' | 'request' | 'response' | 'http' | 'auth'>('basics');

  if (!project) return <div>No project loaded</div>;

  const tools = project.tools;
  const apis = project.apis;

  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(search.toLowerCase()) || 
                          tool.path.toLowerCase().includes(search.toLowerCase());
    const matchesApi = filterApi === 'all' || tool.apiId === filterApi;
    const matchesMethod = filterMethod === 'all' || tool.method === filterMethod;
    return matchesSearch && matchesApi && matchesMethod;
  });

  const handleEdit = (toolId: string) => {
    setSelectedToolId(toolId);
    setActiveTab('basics');
    setIsDrawerOpen(true);
  };

  const selectedTool = tools.find(t => t.id === selectedToolId);

  // Method Badge Helper
  const getMethodColor = (method: HttpMethod) => {
    switch (method) {
      case 'GET': return '#61affe';
      case 'POST': return '#49cc90';
      case 'PUT': return '#fca130';
      case 'DELETE': return '#f93e3e';
      case 'PATCH': return '#50e3c2';
      default: return '#888';
    }
  };

  return (
    <div className="tools-manager">
      <div className="header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Tools</h2>
        <div className="filters" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {tools.length > 0 && (
             <SearchInput 
               value={search} 
               onChange={setSearch} 
               placeholder="Search tools..." 
             />
          )}
          
          <select 
            value={filterApi} 
            onChange={(e) => setFilterApi(e.target.value)}
            style={{ padding: '8px', background: '#252526', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
          >
            <option value="all">All APIs</option>
            {apis.map(api => (
              <option key={api.id} value={api.id}>{api.name}</option>
            ))}
          </select>

          <select 
            value={filterMethod} 
            onChange={(e) => setFilterMethod(e.target.value)}
            style={{ padding: '8px', background: '#252526', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
          >
            <option value="all">All Methods</option>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="PATCH">PATCH</option>
          </select>
        </div>
      </div>

      <div className="tools-table-container" style={{ background: '#252526', borderRadius: '8px', border: '1px solid #333', overflow: 'hidden' }}>
        {tools.length === 0 ? (
           <EmptyState 
             icon={<Settings />}
             title="No tools generated yet"
             description="Import an API or define one manually to generate tools."
           />
        ) : filteredTools.length === 0 ? (
            <div style={{ padding: '20px' }}>
                <EmptyState 
                    icon={<Filter />}
                    title="No tools match your filters"
                    description="Try adjusting your search or filters."
                />
            </div>
        ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: '#1e1e1e', borderBottom: '1px solid #333', textAlign: 'left' }}>
              <th style={{ padding: '12px 16px', color: '#888', fontWeight: 500 }}>Enabled</th>
              <th style={{ padding: '12px 16px', color: '#888', fontWeight: 500 }}>Name</th>
              <th style={{ padding: '12px 16px', color: '#888', fontWeight: 500 }}>Method</th>
              <th style={{ padding: '12px 16px', color: '#888', fontWeight: 500 }}>Path</th>
              <th style={{ padding: '12px 16px', color: '#888', fontWeight: 500 }}>API</th>
              <th style={{ padding: '12px 16px', color: '#888', fontWeight: 500 }}>Auth</th>
              <th style={{ padding: '12px 16px', color: '#888', fontWeight: 500 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTools.map(tool => {
              const api = apis.find(a => a.id === tool.apiId);
              return (
                <tr key={tool.id} style={{ borderBottom: '1px solid #333' }}>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <input 
                      type="checkbox" 
                      checked={tool.enabled} 
                      onChange={(e) => updateTool(tool.id, { enabled: e.target.checked })}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 500 }}>{tool.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#888', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tool.description || 'No description'}</div>
                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                        {tool.guardrails.readOnly && (
                            <span title="Read Only" style={{ fontSize: '0.7rem', padding: '1px 4px', borderRadius: '3px', background: 'rgba(73, 204, 144, 0.2)', color: '#49cc90', border: '1px solid #49cc90' }}>
                                ReadOnly
                            </span>
                        )}
                        {tool.guardrails.confirmationRequired && (
                            <span title="Confirmation Required" style={{ fontSize: '0.7rem', padding: '1px 4px', borderRadius: '3px', background: 'rgba(249, 62, 62, 0.2)', color: '#f93e3e', border: '1px solid #f93e3e' }}>
                                Confirm
                            </span>
                        )}
                        {tool.guardrails.rateLimitHint && (
                            <span title={`Rate Limit: ${tool.guardrails.rateLimitHint} rpm`} style={{ fontSize: '0.7rem', padding: '1px 4px', borderRadius: '3px', background: 'rgba(252, 161, 48, 0.2)', color: '#fca130', border: '1px solid #fca130' }}>
                                {tool.guardrails.rateLimitHint} rpm
                            </span>
                        )}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ 
                      color: getMethodColor(tool.method), 
                      fontWeight: 700, 
                      fontSize: '0.8rem',
                      border: `1px solid ${getMethodColor(tool.method)}`,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: `${getMethodColor(tool.method)}15`
                    }}>
                      {tool.method}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#ccc' }}>
                    {tool.path}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#aaa' }}>
                    {api?.name || 'Unknown API'}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#aaa', fontSize: '0.8rem' }}>
                    {tool.authId ? 'Override' : 'Inherited'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => handleEdit(tool.id)}
                        style={{ background: 'transparent', border: 'none', color: '#61affe', cursor: 'pointer', padding: '4px' }}
                        title="Edit Tool"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => deleteTool(tool.id)}
                        style={{ background: 'transparent', border: 'none', color: '#f93e3e', cursor: 'pointer', padding: '4px' }}
                        title="Delete Tool"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        )}
      </div>

      <Drawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)}
        title={selectedTool ? `Edit Tool: ${selectedTool.name}` : 'Edit Tool'}
        width="600px"
      >
        {selectedTool && (
          <div className="tool-editor" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="tabs" style={{ display: 'flex', borderBottom: '1px solid #333', marginBottom: '20px' }}>
              <button 
                className={`tab-btn ${activeTab === 'basics' ? 'active' : ''}`}
                onClick={() => setActiveTab('basics')}
                style={{ padding: '10px 15px', background: 'transparent', border: 'none', borderBottom: activeTab === 'basics' ? '2px solid #007acc' : '2px solid transparent', color: activeTab === 'basics' ? '#fff' : '#888', cursor: 'pointer' }}
              >
                Basics
              </button>
              <button 
                className={`tab-btn ${activeTab === 'http' ? 'active' : ''}`}
                onClick={() => setActiveTab('http')}
                style={{ padding: '10px 15px', background: 'transparent', border: 'none', borderBottom: activeTab === 'http' ? '2px solid #007acc' : '2px solid transparent', color: activeTab === 'http' ? '#fff' : '#888', cursor: 'pointer' }}
              >
                HTTP
              </button>
              <button 
                className={`tab-btn ${activeTab === 'request' ? 'active' : ''}`}
                onClick={() => setActiveTab('request')}
                style={{ padding: '10px 15px', background: 'transparent', border: 'none', borderBottom: activeTab === 'request' ? '2px solid #007acc' : '2px solid transparent', color: activeTab === 'request' ? '#fff' : '#888', cursor: 'pointer' }}
              >
                Request
              </button>
              <button 
                className={`tab-btn ${activeTab === 'response' ? 'active' : ''}`}
                onClick={() => setActiveTab('response')}
                style={{ padding: '10px 15px', background: 'transparent', border: 'none', borderBottom: activeTab === 'response' ? '2px solid #007acc' : '2px solid transparent', color: activeTab === 'response' ? '#fff' : '#888', cursor: 'pointer' }}
              >
                Response
              </button>
              <button 
                className={`tab-btn ${activeTab === 'auth' ? 'active' : ''}`}
                onClick={() => setActiveTab('auth')}
                style={{ padding: '10px 15px', background: 'transparent', border: 'none', borderBottom: activeTab === 'auth' ? '2px solid #007acc' : '2px solid transparent', color: activeTab === 'auth' ? '#fff' : '#888', cursor: 'pointer' }}
              >
                Auth
              </button>
            </div>

            <div className="tab-content" style={{ flex: 1, overflowY: 'auto', paddingBottom: '20px' }}>
              
              {activeTab === 'basics' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>Name</label>
                    <input 
                      type="text" 
                      value={selectedTool.name} 
                      onChange={(e) => updateTool(selectedTool.id, { name: e.target.value })}
                      style={{ width: '100%', padding: '8px', background: '#252526', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>Description</label>
                    <textarea 
                      value={selectedTool.description} 
                      onChange={(e) => updateTool(selectedTool.id, { description: e.target.value })}
                      rows={3}
                      style={{ width: '100%', padding: '8px', background: '#252526', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>Guardrails</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#252526', padding: '10px', borderRadius: '4px' }}>
                       <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                         <input 
                           type="checkbox" 
                           checked={selectedTool.guardrails.readOnly}
                           onChange={(e) => updateTool(selectedTool.id, { guardrails: { ...selectedTool.guardrails, readOnly: e.target.checked } })}
                         />
                         <span>Read Only (No side effects)</span>
                       </label>
                       <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                         <input 
                           type="checkbox" 
                           checked={selectedTool.guardrails.confirmationRequired}
                           onChange={(e) => updateTool(selectedTool.id, { guardrails: { ...selectedTool.guardrails, confirmationRequired: e.target.checked } })}
                         />
                         <span>User Confirmation Required</span>
                       </label>
                       <div style={{ marginTop: '5px' }}>
                           <label style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px', fontSize: '0.85rem', color: '#aaa' }}>
                             Rate Limit Hint (requests/min)
                             <Tooltip text="Suggested maximum calls per minute for this tool" />
                           </label>
                           <input 
                             type="number"  
                             min="0"
                             placeholder="No limit"
                             value={selectedTool.guardrails.rateLimitHint || ''}
                             onChange={(e) => {
                                 const val = e.target.value ? parseInt(e.target.value) : undefined;
                                 updateTool(selectedTool.id, { guardrails: { ...selectedTool.guardrails, rateLimitHint: val } });
                             }}
                             style={{ width: '100%', padding: '6px', background: '#1e1e1e', border: '1px solid #444', color: '#fff', borderRadius: '4px' }}
                           />
                       </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'http' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>HTTP Method</label>
                    <select 
                      value={selectedTool.method} 
                      onChange={(e) => updateTool(selectedTool.id, { method: e.target.value as HttpMethod })}
                      style={{ width: '100%', padding: '8px', background: '#252526', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
                    >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                        <option value="PATCH">PATCH</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>Path</label>
                    <input 
                      type="text" 
                      value={selectedTool.path} 
                      onChange={(e) => updateTool(selectedTool.id, { path: e.target.value })}
                      style={{ width: '100%', padding: '8px', background: '#252526', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>API Association</label>
                    <select 
                      value={selectedTool.apiId} 
                      onChange={(e) => updateTool(selectedTool.id, { apiId: e.target.value })}
                      style={{ width: '100%', padding: '8px', background: '#252526', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
                    >
                        {apis.map(api => (
                            <option key={api.id} value={api.id}>{api.name}</option>
                        ))}
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'request' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div className="info-box" style={{ padding: '10px', background: 'rgba(97, 175, 254, 0.1)', border: '1px solid rgba(97, 175, 254, 0.3)', borderRadius: '4px', fontSize: '0.9rem', color: '#61affe' }}>
                        This schema defines the input parameters for the MCP tool. It matches the JSON Schema format.
                    </div>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>Request Schema (JSON)</label>
                        <SchemaEditor 
                            key={`${selectedTool.id}-req`}
                            value={selectedTool.requestSchema || {}}
                            onChange={(val) => updateTool(selectedTool.id, { requestSchema: val })}
                        />
                         <p style={{fontSize: '0.8rem', color: '#666', marginTop: '5px'}}>
                            Edit strictly valid JSON Schema.
                        </p>
                    </div>
                </div>
              )}

              {activeTab === 'response' && (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>Response Schema (JSON)</label>
                        <SchemaEditor 
                            key={`${selectedTool.id}-res`}
                            value={selectedTool.responseSchema || {}}
                            onChange={(val) => updateTool(selectedTool.id, { responseSchema: val })}
                        />
                    </div>
                </div>
              )}

              {activeTab === 'auth' && (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>Authentication Scheme</label>
                        <select 
                            value={selectedTool.authId || ''} 
                            onChange={(e) => updateTool(selectedTool.id, { authId: e.target.value || undefined })}
                            style={{ width: '100%', padding: '8px', background: '#252526', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
                        >
                            <option value="">Inherit from API ({apis.find(a => a.id === selectedTool.apiId)?.name || 'Unknown'})</option>
                            {project.authSchemes.map(auth => (
                                <option key={auth.id} value={auth.id}>{auth.name} ({auth.type})</option>
                            ))}
                        </select>
                        <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '8px' }}>
                            Select 'Inherit' to use the authentication configured on the parent API.
                        </p>
                    </div>
                </div>
              )}

            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
