import { useState } from 'react';
import { useProjectStore } from '../store/projectStore';
import { AuthScheme, AuthType, AuthConfig } from '../types';
import { Drawer } from './Drawer';
import { saveSecret, loadSecret } from '../lib/secret-service';
import { v4 as uuidv4 } from 'uuid';
import { Tooltip } from './common/Tooltip';
import { EmptyState } from './common/EmptyState';
import { Shield } from 'lucide-react';

export const AuthManager = () => {
  const { project, addAuthScheme, updateAuthScheme, deleteAuthScheme } = useProjectStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingAuth, setEditingAuth] = useState<AuthScheme | null>(null);
  
  // Local state for the form
  const [name, setName] = useState('');
  const [type, setType] = useState<AuthType>('apiKey');
  const [config, setConfig] = useState<AuthConfig>({});
  const [secretValue, setSecretValue] = useState('');

  const handleCreate = () => {
    setEditingAuth(null);
    setName('New Auth Scheme');
    setType('apiKey');
    setConfig({});
    setSecretValue('');
    setIsDrawerOpen(true);
  };

  const handleEdit = async (auth: AuthScheme) => {
    setEditingAuth(auth);
    setName(auth.name);
    setType(auth.type);
    setConfig(auth.config);
    
    if (auth.config.secretId) {
      const secret = await loadSecret(auth.config.secretId);
      setSecretValue(secret || '');
    } else {
      setSecretValue('');
    }
    
    setIsDrawerOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this auth scheme?')) {
      deleteAuthScheme(id);
    }
  };

  const handleSave = async () => {
    let secretId = editingAuth?.config.secretId;

    if (secretValue) {
      if (!secretId) {
        secretId = uuidv4();
      }
      await saveSecret(secretId, secretValue);
    }

    const newConfig = { ...config, secretId };

    if (editingAuth) {
      updateAuthScheme(editingAuth.id, {
        name,
        type,
        config: newConfig
      });
    } else {
      addAuthScheme({
        name,
        type,
        config: newConfig
      });
    }
    setIsDrawerOpen(false);
  };

  if (!project) return <div>No project loaded</div>;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Auth Schemes</h2>
        <button onClick={handleCreate}>+ New Auth Scheme</button>
      </div>

      <div className="auth-list">
        {project.authSchemes.length === 0 ? (
           <EmptyState 
             icon={<Shield />}
             title="No Auth Schemes"
             description="Define authentication schemes to secure your API calls."
           />
        ) : (
          project.authSchemes.map(auth => (
            <div key={auth.id} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px', borderRadius: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{auth.name}</strong> <span style={{ color: '#666', fontSize: '0.9em' }}>({auth.type})</span>
                </div>
                <div>
                  <button onClick={() => handleEdit(auth)} style={{ marginRight: '5px' }}>Edit</button>
                  <button onClick={() => handleDelete(auth.id)} style={{ color: 'red' }}>Delete</button>
                </div>
              </div>
              {auth.type === 'apiKey' && (
                <div style={{ fontSize: '0.9em', marginTop: '5px' }}>
                  Header: {auth.config.headerName || 'Authorization'}
                </div>
              )}
              {auth.type === 'oauth2' && (
                <div style={{ fontSize: '0.9em', marginTop: '5px' }}>
                  Client ID: {auth.config.clientId}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingAuth ? "Edit Auth Scheme" : "New Auth Scheme"}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label>Name</label>
            <input 
              value={name} 
              onChange={e => setName(e.target.value)} 
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label>Type</label>
            <select 
              value={type} 
              onChange={e => setType(e.target.value as AuthType)}
              style={{ width: '100%' }}
            >
              <option value="apiKey">API Key</option>
              <option value="bearer">Bearer Token</option>
              <option value="basic">Basic Auth</option>
              <option value="oauth2">OAuth 2.0</option>
            </select>
          </div>

          {type === 'apiKey' && (
            <div>
              <label>Header Name</label>
              <input 
                value={config.headerName || ''} 
                onChange={e => setConfig({ ...config, headerName: e.target.value })}
                placeholder="X-API-Key"
                style={{ width: '100%' }}
              />
            </div>
          )}

          {type === 'oauth2' && (
            <>
              <div>
                <label>Client ID</label>
                <input 
                  value={config.clientId || ''} 
                  onChange={e => setConfig({ ...config, clientId: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label>Auth URL</label>
                <input 
                  value={config.authUrl || ''} 
                  onChange={e => setConfig({ ...config, authUrl: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label>Token URL</label>
                <input 
                  value={config.tokenUrl || ''} 
                  onChange={e => setConfig({ ...config, tokenUrl: e.target.value })}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label>Flow Type</label>
                <select 
                  value={config.oauthFlow || 'manual'} 
                  onChange={e => setConfig({ ...config, oauthFlow: e.target.value as 'manual' | 'interactive' })}
                  style={{ width: '100%' }}
                >
                  <option value="manual">Manual (Paste Tokens)</option>
                  <option value="interactive">Interactive (Local Callback)</option>
                </select>
              </div>

              {config.oauthFlow === 'interactive' && (
                  <div>
                    <label>Callback Port</label>
                    <input 
                      type="number"
                      value={config.callbackPort || 3000} 
                      onChange={e => setConfig({ ...config, callbackPort: parseInt(e.target.value) || 3000 })}
                      style={{ width: '100%' }}
                    />
                    <div style={{ fontSize: '0.8em', color: '#666', marginTop: '5px' }}>
                      Set your OAuth App's Redirect URI to: <br/>
                      <code style={{ background: '#eee', padding: '2px 4px', borderRadius: '3px' }}>
                        http://localhost:{config.callbackPort || 3000}/callback
                      </code>
                    </div>
                  </div>
              )}

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  Scopes (comma separated)
                  <Tooltip text="Space or comma separated list of OAuth scopes to request" />
                </label>
                <input 
                  value={config.scopes?.join(', ') || ''} 
                  onChange={e => setConfig({ ...config, scopes: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
                  style={{ width: '100%' }}
                />
              </div>
            </>
          )}

          <div style={{ marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
            <h4>Secrets</h4>
            <p style={{ fontSize: '0.8em', color: '#666' }}>
              Stored securely in your system keychain. Not exported in project file.
            </p>
            
            {type === 'apiKey' && (
              <div>
                <label>API Key Value</label>
                <input 
                  type="password"
                  value={secretValue} 
                  onChange={e => setSecretValue(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            )}
            
            {type === 'bearer' && (
              <div>
                <label>Bearer Token</label>
                <input 
                  type="password"
                  value={secretValue} 
                  onChange={e => setSecretValue(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            )}

            {type === 'basic' && (
              <div>
                 {/* Basic auth usually combines user:pass. For simplicity, we'll store the whole header value or just the password if username is part of config? 
                     Standard Basic Auth is `Authorization: Basic base64(user:pass)`.
                     Let's store the `user:pass` string as the secret for now, or just the password. 
                     Typically we need both. Let's assume secretValue holds "username:password" for now or update UI to have two fields and join them.
                 */}
                 <label>Username:Password</label>
                 <input 
                  type="password"
                  value={secretValue} 
                  onChange={e => setSecretValue(e.target.value)}
                  placeholder="username:password"
                  style={{ width: '100%' }}
                />
              </div>
            )}

            {type === 'oauth2' && (
              <div>
                <label>Client Secret</label>
                <input 
                  type="password"
                  value={secretValue} 
                  onChange={e => setSecretValue(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button onClick={handleSave}>Save</button>
            <button onClick={() => setIsDrawerOpen(false)}>Cancel</button>
          </div>
        </div>
      </Drawer>
    </div>
  );
};
