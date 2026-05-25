declare global {
  interface Window {
    __APP_CONFIG__?: {
      apiBaseUrl?: string;
    };
  }
}

const localHosts = new Set(['localhost', '127.0.0.1']);
const runtimeApiBaseUrl = window.__APP_CONFIG__?.apiBaseUrl?.trim();

export const apiBaseUrl = localHosts.has(window.location.hostname)
  ? 'http://localhost:3000/api'
  : runtimeApiBaseUrl || '/api';
