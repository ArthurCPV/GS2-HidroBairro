import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'hidrobairro.access-token.v1';

export const authStorage = {
  getToken: () => SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
  setToken: (token: string) => SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token),
  removeToken: () => SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
};
