import { useProjectStore } from '../store/projectStore';
import { MessageSquare } from 'lucide-react';

export function PromptsManager() {
  const { project, updatePrompt } = useProjectStore();

  if (!project) return <div>No project loaded</div>;

  const prompt = project.prompt;

  const handleInitialize = () => {
    updatePrompt({
      name: 'default_prompt',
      description: 'Default system prompt',
      content: 'You are a helpful assistant.'
    });
  };

  return (
    <div className="prompts-manager">
      <div className="header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Prompt</h2>
      </div>

      {!prompt ? (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '60px 20px', 
          color: '#888',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '8px',
          border: '1px dashed #444'
        }}>
          <div style={{ marginBottom: '16px', opacity: 0.5, color: '#ccc' }}>
            <MessageSquare size={48} />
          </div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#eee' }}>No prompt defined</h3>
          <p style={{ margin: '0 0 24px 0', fontSize: '0.95rem', maxWidth: '400px', textAlign: 'center', lineHeight: '1.5' }}>
            Define a prompt that will be included in your MCP server.
          </p>
          <button
            onClick={handleInitialize}
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
            <MessageSquare size={16} />
            Create Prompt
          </button>
        </div>
      ) : (
        <div style={{ background: '#252526', borderRadius: '8px', border: '1px solid #333', padding: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontWeight: 500 }}>Name</label>
              <input 
                type="text" 
                value={prompt.name} 
                onChange={(e) => updatePrompt({ name: e.target.value })}
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  background: '#1e1e1e', 
                  border: '1px solid #333', 
                  color: '#fff', 
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '0.95rem'
                }}
                placeholder="prompt_name"
              />
              <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '5px' }}>
                The identifier for this prompt (e.g., "default_prompt", "system_prompt")
              </p>
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontWeight: 500 }}>Description</label>
              <textarea 
                value={prompt.description || ''} 
                onChange={(e) => updatePrompt({ description: e.target.value })}
                rows={2}
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  background: '#1e1e1e', 
                  border: '1px solid #333', 
                  color: '#fff', 
                  borderRadius: '4px',
                  fontSize: '0.95rem',
                  resize: 'vertical'
                }}
                placeholder="Describe what this prompt does"
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontWeight: 500 }}>Content</label>
              <div className="info-box" style={{ 
                padding: '10px', 
                background: 'rgba(97, 175, 254, 0.1)', 
                border: '1px solid rgba(97, 175, 254, 0.3)', 
                borderRadius: '4px', 
                fontSize: '0.85rem', 
                color: '#61affe',
                marginBottom: '10px'
              }}>
                This text will be included as a prompt in your MCP server.
              </div>
              <textarea 
                value={prompt.content} 
                onChange={(e) => updatePrompt({ content: e.target.value })}
                rows={20}
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  background: '#1e1e1e', 
                  border: '1px solid #333', 
                  color: '#fff', 
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  lineHeight: '1.6',
                  resize: 'vertical'
                }}
                placeholder="Enter your prompt text here..."
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
