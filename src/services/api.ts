import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.bookme.loan',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  config.headers = config.headers ?? {};
  config.headers['Content-Type'] = 'application/json';
  config.headers['Accept'] = 'application/json';
  return config;
});

export default api;
