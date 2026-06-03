import Constants from 'expo-constants';

const getApiBaseUrl = () => {
  // Always use the online VPS for both development and production
  return 'http://16.171.134.40:8080/api';
};

const getWsUrl = () => {
  return 'ws://16.171.134.40:8080/ws';
};

export default {
  API_BASE_URL: getApiBaseUrl(),
  WS_URL: getWsUrl(),
  EXPO_PROJECT_ID: Constants.expoConfig?.extra?.eas?.projectId,
};
