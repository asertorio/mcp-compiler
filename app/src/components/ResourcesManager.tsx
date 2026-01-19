import { useState } from 'react';
import { useProjectStore } from '../store/projectStore';
import { Resource } from '../types';
import { Drawer } from './Drawer';
import { Database, Edit2, Trash2, Plus } from 'lucide-react';
import { EmptyState } from './common/EmptyState';

export function ResourcesManager() {
  const { project, addResource, updateResource, deleteResource } = useProjectStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);

  if (!project) return <div>No project loaded</div>;

  const resources = project.resources;
  const selectedResource = resources.find(r => r.id === selectedResourceId);

  const handleAdd = () => {
    const newResource: Omit<Resource, 'id'> = {
      name: 'New Resource',
      uri: 'resource://new-resource',
      description: '',
      mimeType: 'text/markdown',
      content: '# New Resource\n\nAdd your content here...'
    };
    addResource(newResource);
  };

  const handleEdit = (resourceId: string) => {
    setSelectedResourceId(resourceId);
    setIsDrawerOpen(true);
  };

  const handleDelete = (resourceId: string) => {
    if (confirm('Are you sure you want to delete this resource?')) {
      deleteResource(resourceId);
    }
  };

  const handleNameChange = (name: string) => {
    if (selectedResource) {
      // Auto-generate URI from name
      const uri = `resource://${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
      updateResource(selectedResource.id, { name, uri });
    }
  };

  return (
    <div className="resources-manager">
      <div className="header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Resources</h2>
        <button
          onClick={handleAdd}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: '#007acc',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          <Plus size={16} />
          Add Resource
        </button>
      </div>

      <div className="resources-table-container" style={{ background: '#252526', borderRadius: '8px', border: '1px solid #333', overflow: 'hidden' }}>
        {resources.length === 0 ? (
          <EmptyState 
            icon={<Database />}
            title="No resources defined"
            description="Resources expose data sources like documentation, files, or structured data to MCP clients."
            action={
              <button
                onClick={handleAdd}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  background: '#007acc',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} />
                Add Your First Resource
              </button>
            }
          />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#1e1e1e', borderBottom: '1px solid #333', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', color: '#888', fontWeight: 500 }}>Name</th>
                <th style={{ padding: '12px 16px', color: '#888', fontWeight: 500 }}>URI</th>
                <th style={{ padding: '12px 16px', color: '#888', fontWeight: 500 }}>MIME Type</th>
                <th style={{ padding: '12px 16px', color: '#888', fontWeight: 500 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {resources.map(resource => (
                <tr key={resource.id} style={{ borderBottom: '1px solid #333' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 500 }}>{resource.name}</div>
                    {resource.description && (
                      <div style={{ fontSize: '0.8rem', color: '#888', maxWidth: '300px' }}>
                        {resource.description}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#ccc', fontSize: '0.85rem' }}>
                    {resource.uri}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#aaa', fontSize: '0.85rem' }}>
                    {resource.mimeType}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => handleEdit(resource.id)}
                        style={{ background: 'transparent', border: 'none', color: '#61affe', cursor: 'pointer', padding: '4px' }}
                        title="Edit Resource"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(resource.id)}
                        style={{ background: 'transparent', border: 'none', color: '#f93e3e', cursor: 'pointer', padding: '4px' }}
                        title="Delete Resource"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Drawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)}
        title={selectedResource ? `Edit Resource: ${selectedResource.name}` : 'Edit Resource'}
        width="600px"
      >
        {selectedResource && (
          <div className="resource-editor" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>Name</label>
              <input 
                type="text" 
                value={selectedResource.name} 
                onChange={(e) => handleNameChange(e.target.value)}
                style={{ width: '100%', padding: '8px', background: '#252526', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>URI</label>
              <input 
                type="text" 
                value={selectedResource.uri} 
                onChange={(e) => updateResource(selectedResource.id, { uri: e.target.value })}
                style={{ width: '100%', padding: '8px', background: '#252526', border: '1px solid #333', color: '#fff', borderRadius: '4px', fontFamily: 'monospace' }}
              />
              <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '5px' }}>
                The unique identifier for this resource (e.g., "resource://readme", "docs://api-guide")
              </p>
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>Description</label>
              <textarea 
                value={selectedResource.description || ''} 
                onChange={(e) => updateResource(selectedResource.id, { description: e.target.value })}
                rows={2}
                style={{ width: '100%', padding: '8px', background: '#252526', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
                placeholder="Optional description of this resource"
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>MIME Type</label>
              <select 
                value={selectedResource.mimeType} 
                onChange={(e) => updateResource(selectedResource.id, { mimeType: e.target.value })}
                style={{ width: '100%', padding: '8px', background: '#252526', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
              >
                <option value="text/markdown">text/markdown</option>
                <option value="text/plain">text/plain</option>
                <option value="application/json">application/json</option>
                <option value="text/html">text/html</option>
                <option value="application/xml">application/xml</option>
              </select>
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>Content</label>
              <textarea 
                value={selectedResource.content} 
                onChange={(e) => updateResource(selectedResource.id, { content: e.target.value })}
                rows={15}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  background: '#1e1e1e', 
                  border: '1px solid #333', 
                  color: '#fff', 
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  lineHeight: '1.5'
                }}
                placeholder="Enter your content here..."
              />
              <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '5px' }}>
                This content will be exposed as a resource to MCP clients like Claude.
              </p>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
