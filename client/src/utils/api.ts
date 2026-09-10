/**
 * Robust API Client with intelligent daemon detection,
 * automatic fallback between Vite proxy and direct port 3001,
 * and safe error parsing.
 */

const getBaseUrls = () => {
  const isDev = window.location.port !== '3001' && window.location.port !== '';
  const primaryApi = '/api';
  const fallbackApi = 'http://localhost:3001/api';

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const primaryWs = `${protocol}//${window.location.host}/ws`;
  const fallbackWs = 'ws://localhost:3001/ws';

  return { primaryApi, fallbackApi, primaryWs, fallbackWs, isDev };
};

export async function apiRequest<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const { primaryApi, fallbackApi, isDev } = getBaseUrls();
  const url = `${primaryApi}${path}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    let res = await fetch(url, { ...options, headers });

    // If 404/502/504 on dev proxy, try direct backend port 3001
    if (isDev && (res.status === 502 || res.status === 504 || res.status === 404)) {
      try {
        const fallbackRes = await fetch(`${fallbackApi}${path}`, { ...options, headers });
        if (fallbackRes.ok || fallbackRes.status < 500) {
          res = fallbackRes;
        }
      } catch (e) {
        // use original res
      }
    }

    const text = await res.text();
    let data: any;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      if (!res.ok) {
        throw new Error(text || `Server returned HTTP ${res.status}`);
      }
      return text as unknown as T;
    }

    if (!res.ok) {
      throw new Error(data.error || data.message || `Request failed with status ${res.status}`);
    }

    return data as T;
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      // Try direct fallback on fetch failure
      if (isDev) {
        try {
          const fallbackRes = await fetch(`${fallbackApi}${path}`, { ...options, headers });
          const text = await fallbackRes.text();
          const data = text ? JSON.parse(text) : {};
          if (fallbackRes.ok) return data as T;
          throw new Error(data.error || `HTTP ${fallbackRes.status}`);
        } catch (e: any) {
          throw new Error('Matter daemon is offline. Run "npm run dev" to start the server.');
        }
      }
      throw new Error('Cannot connect to Matter daemon. Ensure the backend is running.');
    }
    throw err;
  }
}

export function getWebSocketUrls(): { primary: string; fallback: string } {
  const { primaryWs, fallbackWs } = getBaseUrls();
  return { primary: primaryWs, fallback: fallbackWs };
}
