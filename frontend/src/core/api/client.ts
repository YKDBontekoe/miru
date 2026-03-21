import axios, { AxiosError } from 'axios';
import { supabase } from '../services/supabase';
import { Platform } from 'react-native';
import { useAppStore } from '../../store/useAppStore';

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
  config.baseURL = storeUrl.endsWith('/') ? storeUrl : `${storeUrl}/`;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
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
  const healthUrl = `${baseUrl.replace(/\/api\/v1\/?$/, '')}/health`;

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
) {
  try {
    const storeUrl = useAppStore.getState().baseUrl || LOCAL_BACKEND_URL;
    const fullUrl = `${storeUrl.endsWith('/') ? storeUrl : `${storeUrl}/`}${endpoint}`;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
      signal,
    });

    if (!response.body) throw new Error('No response body');

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let done = false;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        onChunk(decoder.decode(value, { stream: true }));
      }
    }
  } catch (error) {
    console.error('Stream chat error:', error);
    throw error;
  }
}
