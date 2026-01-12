import { useEffect } from 'react';
import { useProjectStore } from '../store/projectStore';
import { getCircularReplacer } from '../lib/project-service';

const AUTOSAVE_KEY = 'mcp_project_autosave';

export function useAutosave() {
  const project = useProjectStore(state => state.project);
  
  useEffect(() => {
    if (project) {
      const timer = setTimeout(() => {
        // Web app autosave: save to localStorage instead of disk
        // to avoid spamming the user with download prompts.
        console.log('Autosaving to localStorage');
        try {
          localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(project, getCircularReplacer()));
        } catch (err) {
          console.error('Autosave failed:', err);
        }
      }, 2000); // 2 seconds debounce
      
      return () => clearTimeout(timer);
    }
  }, [project]);
}
