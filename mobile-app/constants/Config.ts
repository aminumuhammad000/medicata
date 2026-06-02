import Constants from 'expo-constants';

const getApiBaseUrl = () => {
  // Check if we are running in an EAS build or local dev
  const isProduction = !__DEV__;
  
  if (isProduction) {
    // Production API (e.g. your VPS IP or Domain)
    return 'http://16.171.134.40:8080/api';
  }
  
  // For local development on physical device with Expo Go, use the debugger host
  const debuggerHost = Constants.expoConfig?.hostUri;
  const address = debuggerHost?.split(':')[0];
  
  if (address) {
    return `http://${address}:8080/api`;
  }
  
  // Fallback for emulator/web
  return 'http://16.171.134.40:8080/api';
};

const getWsUrl = () => {
    const baseUrl = getApiBaseUrl();
    return baseUrl.replace('http', 'ws').replace('/api', '/ws');
};

export default {
  API_BASE_URL: getApiBaseUrl(),
  WS_URL: getWsUrl(),
  EXPO_PROJECT_ID: Constants.expoConfig?.extra?.eas?.projectId,
};
