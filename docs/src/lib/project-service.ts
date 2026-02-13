import { Project } from '../types';

// Helper to handle circular references during JSON serialization
export const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key: string, value: any) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return "[Circular]";
      }
      seen.add(value);
    }
    return value;
  };
};

export async function saveProjectToDisk(project: Project, filePath?: string): Promise<string | null> {
  const blob = new Blob([JSON.stringify(project, getCircularReplacer(), 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  // Use provided filename or generate one from project name
  a.download = filePath || `${project.name.toLowerCase().replace(/\s+/g, '-')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  // In web context, we can't get the actual path on disk, so we return the filename
  return a.download;
}

export async function loadProjectFromDisk(): Promise<{ project: Project; path: string } | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      
      try {
        const text = await file.text();
        const project = JSON.parse(text) as Project;
        
        // Ensure backwards compatibility - add missing fields from new version
        project.resources = project.resources || [];
        
        // Migrate old prompts array to single prompt
        if ('prompts' in project && Array.isArray((project as any).prompts)) {
          const oldPrompts = (project as any).prompts;
          if (oldPrompts.length > 0) {
            // Take the first prompt and convert it
            project.prompt = {
              name: oldPrompts[0].name,
              description: oldPrompts[0].description,
              content: oldPrompts[0].content
            };
          }
          delete (project as any).prompts;
        }
        
        // TODO: Add schema validation here
        resolve({ project, path: file.name });
      } catch (e) {
        console.error('Failed to parse project file', e);
        resolve(null);
      }
    };
    input.click();
  });
}
