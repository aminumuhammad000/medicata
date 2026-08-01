import Constants from 'expo-constants';

const getApiBaseUrl = () => {
  // Always use the online Medicata API server for both development and production
  return 'https://api.medicata.ng/api';
};

const getWsUrl = () => {
  return 'wss://api.medicata.ng/ws';
};

export default {
  API_BASE_URL: getApiBaseUrl(),
  WS_URL: getWsUrl(),
  EXPO_PROJECT_ID: Constants.expoConfig?.extra?.eas?.projectId,
};
