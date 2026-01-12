import { useState } from "react";
import "./App.css";
import { ApiManager } from "./components/ApiManager";
import { ToolsManager } from "./components/ToolsManager";
import { Drawer } from "./components/Drawer";
import { AuthManager } from "./components/AuthManager";
import { Sidebar } from "./components/Sidebar";
import { useProjectStore } from "./store/projectStore";
import { useAutosave } from "./hooks/useAutosave";
import { ExportManager } from "./components/ExportManager";
import { saveProjectToDisk, loadProjectFromDisk } from "./lib/project-service";

function App() {
  const [activeSection, setActiveSection] = useState("project");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const { project, createProject, loadProject, setFilePath, updateProjectMetadata } = useProjectStore();
  
  useAutosave();

  const handleLoad = async () => {
    try {
      const result = await loadProjectFromDisk();
      if (result) {
        loadProject(result.project, result.path);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to load project');
    }
  };

  const handleSaveAs = async () => {
    if (!project) return;
    try {
      const path = await saveProjectToDisk(project);
      if (path) {
        setFilePath(path);
      }
    } catch (error) {
       console.error(error);
       alert(`Failed to save project: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case "project":
        return (
          <div>
            <h2>Project Settings{project ? `: ${project.name}` : ''}</h2>
            {project ? (
              <div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Name:</label>
                  <input 
                    type="text" 
                    value={project.name} 
                    onChange={(e) => updateProjectMetadata(e.target.value, project.version)}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#333', color: 'white', width: '100%', maxWidth: '400px' }}
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Version:</label>
                  <input 
                    type="text" 
                    value={project.version} 
                    onChange={(e) => updateProjectMetadata(project.name, e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#333', color: 'white', width: '100%', maxWidth: '200px' }}
                  />
                </div>
                <p><strong>ID:</strong> {project.id}</p>
                <p><strong>APIs:</strong> {project.apis.length}</p>
                <p><strong>Tools:</strong> {project.tools.length}</p>
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button onClick={handleSaveAs}>Save As...</button>
                  <button onClick={() => createProject('New Project')}>New Project</button>
                  <button onClick={handleLoad}>Load Project</button>
                </div>
              </div>
            ) : (
              <div>
                <p>No project loaded.</p>
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button onClick={() => createProject('My MCP Project')}>Create New Project</button>
                  <button onClick={handleLoad}>Load Existing Project</button>
                </div>
              </div>
            )}
          </div>
        );
      case "apis":
        return <ApiManager />;
      case "tools":
        return <ToolsManager />;
      case "auth":
        return <AuthManager />;
      case "export":
        return <ExportManager />;
      default:
        return <div><h2>Welcome</h2></div>;
    }
  };

  return (
    <div className="app-container">
      <Sidebar activeSection={activeSection} onNavigate={setActiveSection} />
      <main className="main-content">
        {renderContent()}
      </main>

      <Drawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)}
        title="Detail Editor"
      >
        <div style={{ padding: '1rem' }}>
          <h4>Editor Content</h4>
          <p>This is where the detailed editing forms will go.</p>
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button onClick={() => setIsDrawerOpen(false)}>Save</button>
            <button onClick={() => setIsDrawerOpen(false)}>Cancel</button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}

export default App;
