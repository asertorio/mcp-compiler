// This service abstracts secret storage for the web application.
// Currently uses localStorage with a prefix for development.
// WARNING: This is NOT secure for production use.
// For production, integrate with a secure secret management service.

const SECRET_PREFIX = 'mcp_secret_';

export const saveSecret = async (key: string, value: string): Promise<void> => {
  localStorage.setItem(SECRET_PREFIX + key, value);
};

export const loadSecret = async (key: string): Promise<string | null> => {
  return localStorage.getItem(SECRET_PREFIX + key);
};

export const deleteSecret = async (key: string): Promise<void> => {
  localStorage.removeItem(SECRET_PREFIX + key);
};
