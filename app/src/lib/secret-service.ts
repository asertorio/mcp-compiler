// This service abstracts secret storage. 
// In the future, this will call Tauri's keychain plugin.
// For now, it will use localStorage with a prefix, but this is NOT secure for production.

const SECRET_PREFIX = 'mcp_secret_';

export const saveSecret = async (key: string, value: string): Promise<void> => {
  // TODO: Replace with Tauri keychain call
  // await invoke('save_secret', { key, value });
  localStorage.setItem(SECRET_PREFIX + key, value);
};

export const loadSecret = async (key: string): Promise<string | null> => {
  // TODO: Replace with Tauri keychain call
  // return await invoke('load_secret', { key });
  return localStorage.getItem(SECRET_PREFIX + key);
};

export const deleteSecret = async (key: string): Promise<void> => {
  // TODO: Replace with Tauri keychain call
  // await invoke('delete_secret', { key });
  localStorage.removeItem(SECRET_PREFIX + key);
};
