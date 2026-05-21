export function getBackendOrigin(): string {
  try {
    // Allow local override via localStorage (key: "BACKEND_URL" or "backend_url")
    if (typeof window !== 'undefined' && window.localStorage) {
      const override = window.localStorage.getItem('BACKEND_URL') || window.localStorage.getItem('backend_url');
      if (override) return override.replace(/\/$/, '');
    }

    if (typeof window === 'undefined') {
      // default for non-browser environments
      return 'https://adaptiveiq.onrender.com';
    }

    const host = window.location.hostname;

    // If running locally, point to local backend
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.startsWith('192.') ||
      host === ''
    ) {
      return 'http://localhost:5001';
    }

    // Otherwise use deployed backend
    return 'https://adaptiveiq.onrender.com';
  } catch (err) {
    return 'https://adaptiveiq.onrender.com';
  }
}

export function getApiBase(): string {
  return `${getBackendOrigin().replace(/\/$/, '')}/api`;
}
