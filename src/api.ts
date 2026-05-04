import { API_BASE_URL } from './config/env';
import { Platform, ToastAndroid } from 'react-native';
import { clearStorage, getStorage } from './utils/storage';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

export const BASE_URL = API_BASE_URL;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

interface AppRequestConfig extends AxiosRequestConfig {
  toastMessage?: string;
  showErrorToast?: boolean;
  showSuccessToast?: boolean;
}

const toast = (message: string) => {
  if (Platform.OS !== 'android') return;
  ToastAndroid.showWithGravity(
    message,
    ToastAndroid.SHORT,
    ToastAndroid.BOTTOM,
  );
};

api.interceptors.request.use(
  async config => {
    const token = await getStorage('token');
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error),
);

const request = async <T>(
  config: AppRequestConfig,
): Promise<AxiosResponse<T>> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    config.timeout ?? 10000,
  );
  const targetUrl = config.url
    ? config.url.startsWith('http')
      ? config.url
      : `${api.defaults.baseURL?.replace(/\/$/, '')}/${config.url.replace(
          /^\//,
          '',
        )}`
    : api.defaults.baseURL;

  console.log('[API DEBUG] =>', config.method, targetUrl);

  try {
    if (config.data instanceof FormData) {
      config.headers = {
        ...config.headers,
        'Content-Type': 'multipart/form-data',
      };
    }

    const response = await api.request<T>({
      ...config,
      url: targetUrl,
      signal: controller.signal,
    });

    if (config.showSuccessToast || config.toastMessage) {
      const message = config.toastMessage ?? (response.data as any)?.message;
      if (message) toast(message);
    }

    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.log('[API ERROR]', config.method, targetUrl, error?.message, error?.code, JSON.stringify(error?.response?.data || 'NO RESPONSE'));
    const serverMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      'Something went wrong';
    const errorCode = error?.response?.data?.code;
    if (errorCode === 401 && serverMessage === 'Token has expired') {
      await clearStorage();
    }
    if (config.showErrorToast !== false && serverMessage) {
      toast(serverMessage);
    }
    throw error?.response?.data || error;
  }
};

export const Fetch = async <T>(
  url: string,
  params?: Record<string, unknown>,
  timeout?: number,
  showErrorToast?: boolean,
): Promise<T> => {
  const response = await request<T>({
    method: 'GET',
    url,
    params,
    timeout,
    showErrorToast,
  });
  return response.data;
};

export const Post = async <T>(
  url: string,
  data: Record<string, unknown> | FormData,
  timeout?: number,
  toastMessage?: string,
  showErrorToast?: boolean,
): Promise<T> => {
  const response = await request<T>({
    method: 'POST',
    url,
    data,
    timeout,
    toastMessage,
    showErrorToast,
  });
  return response.data;
};

const requestWithToastOverride = <T>(config: AppRequestConfig) =>
  request<T>({ ...config, showSuccessToast: true });

export const Put = async <T>(
  url: string,
  data: Record<string, unknown> | FormData,
  timeout?: number,
  showErrorToast?: boolean,
): Promise<T | any> => {
  const response = await requestWithToastOverride({
    method: 'PUT',
    url,
    data,
    timeout,
    showErrorToast,
  });
  return response.data;
};

export const Patch = async <T>(
  url: string,
  data: Record<string, unknown> | FormData,
  timeout?: number,
  showErrorToast?: boolean,
): Promise<T | any> => {
  const response = await requestWithToastOverride({
    method: 'PATCH',
    url,
    data,
    timeout,
    showErrorToast,
  });
  return response.data;
};

export const Delete = async <
  T,
  D extends Record<string, unknown> | undefined = Record<string, unknown>,
>(
  url: string,
  data?: D,
  params?: Record<string, unknown>,
  timeout?: number,
  showErrorToast?: boolean,
): Promise<T> => {
  const response = await request<T>({
    method: 'DELETE',
    url,
    data,
    params,
    timeout,
    showErrorToast,
  });
  return response.data;
};
