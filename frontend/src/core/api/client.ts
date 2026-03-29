import axios, { AxiosError } from 'axios';
import { supabase } from '../services/supabase';
import { Platform } from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import { normalizeApiBaseUrl, toHealthBaseUrl } from '../utils/backendUrl';
import i18next from 'i18next';

const LOCAL_BACKEND_URL = Platform.select({
  android: 'http://10.0.2.2:8000',
  ios: 'http://localhost:8000',
  default: 'http://localhost:8000',
});

// We'll update the axios baseURL dynamically via an interceptor or by directly accessing the store.
// Since we want the most recent value, we'll use an interceptor.

export const apiClient = axios.create({
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
  },
});

apiClient.interceptors.request.use(async (config) => {
  const storeUrl = useAppStore.getState().baseUrl || LOCAL_BACKEND_URL;
  const normalizedApiBaseUrl = normalizeApiBaseUrl(storeUrl);
  config.baseURL = normalizedApiBaseUrl.endsWith('/')
    ? normalizedApiBaseUrl
    : `${normalizedApiBaseUrl}/`;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }

  if (i18next.language) {
    config.headers['Accept-Language'] = i18next.language;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      console.error('Session expired. Please sign in again.');
    }
    return Promise.reject(error);
  }
);

export async function waitForBackend(maxAttempts = 30, initialDelay = 1000): Promise<void> {
  const baseUrl = useAppStore.getState().baseUrl || LOCAL_BACKEND_URL;
  const healthUrl = `${toHealthBaseUrl(baseUrl)}/health`;

  let currentDelay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(healthUrl, { method: 'GET' });
      if (response.status === 200) {
        console.log(`Backend is awake after ${attempt} attempts`);
        return;
      }
    } catch {
      console.log(`Backend not awake yet (attempt ${attempt}/${maxAttempts})`);
    }

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, currentDelay));
      currentDelay = Math.min(currentDelay * 1.5, 5000);
    }
  }
  throw new Error(`Failed to reach backend after ${maxAttempts} attempts`);
}

export async function streamChat(
  endpoint: string,
  data: unknown,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const storeUrl = useAppStore.getState().baseUrl || LOCAL_BACKEND_URL;
  const normalizedApiBaseUrl = normalizeApiBaseUrl(storeUrl);
  const baseWithSlash = normalizedApiBaseUrl.endsWith('/')
    ? normalizedApiBaseUrl
    : `${normalizedApiBaseUrl}/`;
  const fullUrl = `${baseWithSlash}${endpoint}`;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', fullUrl);
    xhr.setRequestHeader('Content-Type', 'application/json');
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    if (i18next.language) xhr.setRequestHeader('Accept-Language', i18next.language);

    let processedLength = 0;

    xhr.onprogress = () => {
      const newText = xhr.responseText.slice(processedLength);
      processedLength = xhr.responseText.length;
      if (newText) onChunk(newText);
    };

    xhr.onload = () => {
      // Flush any remaining text not caught by onprogress
      const remaining = xhr.responseText.slice(processedLength);
      if (remaining) onChunk(remaining);

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`HTTP ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error'));

    if (signal) {
      signal.addEventListener('abort', () => {
        xhr.abort();
        reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
      });
    }

    xhr.send(JSON.stringify(data));
  });
}
