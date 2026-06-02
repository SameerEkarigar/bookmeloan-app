type AppEnv = 'development' | 'staging' | 'production';

type RuntimeEnv = {
  NODE_ENV?: string;
  BOOKME_APP_ENV?: string;
  BOOKME_API_BASE_URL?: string;
};

const parseEnv = (value?: string): AppEnv => {
  const normalized = (value || '').trim().toLowerCase();
  if (normalized === 'production') return 'production';
  if (normalized === 'staging') return 'staging';
  return 'development';
};

const readRuntimeEnv = (): RuntimeEnv => {
  const globalEnv = (globalThis as any)?.BOOKME_ENV || {};
  const processEnv = (globalThis as any)?.process?.env || {};
  return {
    BOOKME_APP_ENV:
      globalEnv.BOOKME_APP_ENV ||
      processEnv.BOOKME_APP_ENV ||
      processEnv.NODE_ENV,
    BOOKME_API_BASE_URL:
      globalEnv.BOOKME_API_BASE_URL || processEnv.BOOKME_API_BASE_URL,
    NODE_ENV: processEnv.NODE_ENV,
  };
};

const runtimeEnv = readRuntimeEnv();

const defaultEnv: AppEnv =
  typeof __DEV__ !== 'undefined' && __DEV__ ? 'development' : 'production';

export const APP_ENV: AppEnv = runtimeEnv.BOOKME_APP_ENV
  ? parseEnv(runtimeEnv.BOOKME_APP_ENV)
  : defaultEnv;

const API_BASE_URLS: Record<AppEnv, string> = {
  staging: 'https://api.bookmeloan.com/api/',
  //  development: 'http://localhost:5010/api',
  development: 'https://bookmeloan.com/api/',
  production: 'https://api.bookmeloan.com/api/',
};

export const API_BASE_URL =
  runtimeEnv.BOOKME_API_BASE_URL?.trim() || API_BASE_URLS[APP_ENV];
