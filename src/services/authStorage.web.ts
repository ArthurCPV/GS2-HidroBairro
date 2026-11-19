const ACCESS_TOKEN_KEY = 'hidrobairro.access-token.v1';
const LEGACY_ACCESS_TOKEN_KEY = 'hidrobairro/access-token/v1';

function getSessionStorage() {
  if (typeof window === 'undefined') {
    throw new Error('O armazenamento da sessão não está disponível.');
  }
  return window.sessionStorage;
}

export const authStorage = {
  async getToken() {
    const storage = getSessionStorage();
    const token = storage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      return token;
    }

    const legacyToken = storage.getItem(LEGACY_ACCESS_TOKEN_KEY);
    if (legacyToken) {
      storage.setItem(ACCESS_TOKEN_KEY, legacyToken);
      storage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
    }
    return legacyToken;
  },
  async setToken(token: string) {
    getSessionStorage().setItem(ACCESS_TOKEN_KEY, token);
  },
  async removeToken() {
    getSessionStorage().removeItem(ACCESS_TOKEN_KEY);
  },
};
