import { create } from 'zustand';
import { Project, API, Tool, AuthScheme, Resource } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface ProjectState {
  project: Project | null;
  currentFilePath: string | null;
  
  // Actions
  createProject: (name: string) => void;
  loadProject: (project: Project, filePath?: string) => void;
  setFilePath: (path: string) => void;
  updateProjectMetadata: (name: string, version: string) => void;
  
  // API Actions
  addApi: (api: Omit<API, 'id'>) => void;
  importApiData: (api: API, tools: Tool[], authSchemes?: AuthScheme[]) => void;
  updateApi: (id: string, updates: Partial<API>) => void;
  deleteApi: (id: string) => void;
  
  // Tool Actions
  addTool: (tool: Omit<Tool, 'id' | 'guardrails' | 'enabled'>) => void;
  updateTool: (id: string, updates: Partial<Tool>) => void;
  deleteTool: (id: string) => void;
  
  // Auth Actions
  addAuthScheme: (auth: Omit<AuthScheme, 'id'>) => void;
  updateAuthScheme: (id: string, updates: Partial<AuthScheme>) => void;
  deleteAuthScheme: (id: string) => void;
  
  // Resource Actions
  addResource: (resource: Omit<Resource, 'id'>) => void;
  updateResource: (id: string, updates: Partial<Resource>) => void;
  deleteResource: (id: string) => void;
  
  // Prompt Actions
  updatePrompt: (updates: Partial<Project['prompt']>) => void;
}

const createEmptyProject = (name: string): Project => ({
  id: uuidv4(),
  name,
  version: '1.0.0',
  apis: [],
  tools: [],
  authSchemes: [],
  resources: [],
  prompt: undefined,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const useProjectStore = create<ProjectState>((set) => ({
  project: null,
  currentFilePath: null,

  createProject: (name) => set({ project: createEmptyProject(name), currentFilePath: null }),
  
  loadProject: (project, filePath) => set({ project, currentFilePath: filePath || null }),

  setFilePath: (path) => set({ currentFilePath: path }),
  
  updateProjectMetadata: (name, version) => 
    set((state) => state.project ? ({
      project: { ...state.project, name, version, updatedAt: new Date().toISOString() }
    }) : {}),

  addApi: (api) => 
    set((state) => state.project ? ({
      project: {
        ...state.project,
        apis: [...state.project.apis, { ...api, id: uuidv4() }],
        updatedAt: new Date().toISOString()
      }
    }) : {}),

  importApiData: (api, tools, authSchemes = []) =>
    set((state) => state.project ? ({
      project: {
        ...state.project,
        apis: [...state.project.apis, api],
        tools: [...state.project.tools, ...tools],
        authSchemes: [...state.project.authSchemes, ...authSchemes],
        updatedAt: new Date().toISOString()
      }
    }) : {}),

  updateApi: (id, updates) =>
    set((state) => state.project ? ({
      project: {
        ...state.project,
        apis: state.project.apis.map(api => api.id === id ? { ...api, ...updates } : api),
        updatedAt: new Date().toISOString()
      }
    }) : {}),

  deleteApi: (id) =>
    set((state) => state.project ? ({
      project: {
        ...state.project,
        apis: state.project.apis.filter(api => api.id !== id),
        // Cascade delete tools associated with this API
        tools: state.project.tools.filter(tool => tool.apiId !== id),
        updatedAt: new Date().toISOString()
      }
    }) : {}),

  addTool: (tool) =>
    set((state) => state.project ? ({
      project: {
        ...state.project,
        tools: [...state.project.tools, {
          ...tool,
          id: uuidv4(),
          enabled: true,
          guardrails: { readOnly: false, confirmationRequired: false }
        }],
        updatedAt: new Date().toISOString()
      }
    }) : {}),

  updateTool: (id, updates) =>
    set((state) => state.project ? ({
      project: {
        ...state.project,
        tools: state.project.tools.map(tool => tool.id === id ? { ...tool, ...updates } : tool),
        updatedAt: new Date().toISOString()
      }
    }) : {}),

  deleteTool: (id) =>
    set((state) => state.project ? ({
      project: {
        ...state.project,
        tools: state.project.tools.filter(tool => tool.id !== id),
        updatedAt: new Date().toISOString()
      }
    }) : {}),

  addAuthScheme: (auth) =>
    set((state) => state.project ? ({
      project: {
        ...state.project,
        authSchemes: [...state.project.authSchemes, { ...auth, id: uuidv4() }],
        updatedAt: new Date().toISOString()
      }
    }) : {}),

  updateAuthScheme: (id, updates) =>
    set((state) => state.project ? ({
      project: {
        ...state.project,
        authSchemes: state.project.authSchemes.map(auth => auth.id === id ? { ...auth, ...updates } : auth),
        updatedAt: new Date().toISOString()
      }
    }) : {}),

  deleteAuthScheme: (id) =>
    set((state) => state.project ? ({
      project: {
        ...state.project,
        authSchemes: state.project.authSchemes.filter(auth => auth.id !== id),
        // Optional: clear authId from APIs/Tools that used this scheme?
        // For now, leaving it might be safer to avoid accidental data loss, or we can warn in UI.
        updatedAt: new Date().toISOString()
      }
    }) : {}),

  addResource: (resource) =>
    set((state) => state.project ? ({
      project: {
        ...state.project,
        resources: [...state.project.resources, { ...resource, id: uuidv4() }],
        updatedAt: new Date().toISOString()
      }
    }) : {}),

  updateResource: (id, updates) =>
    set((state) => state.project ? ({
      project: {
        ...state.project,
        resources: state.project.resources.map(resource => resource.id === id ? { ...resource, ...updates } : resource),
        updatedAt: new Date().toISOString()
      }
    }) : {}),

  deleteResource: (id) =>
    set((state) => state.project ? ({
      project: {
        ...state.project,
        resources: state.project.resources.filter(resource => resource.id !== id),
        updatedAt: new Date().toISOString()
      }
    }) : {}),

  updatePrompt: (updates) =>
    set((state) => state.project ? ({
      project: {
        ...state.project,
        prompt: state.project.prompt ? { ...state.project.prompt, ...updates } : updates as Project['prompt'],
        updatedAt: new Date().toISOString()
      }
    }) : {}),
}));

