// Auth utilities
const SESSION_TOKEN_KEY = 'ethox_session_token';

export const authAPI = {
  async login(password: string): Promise<{ token: string } | null> {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem(SESSION_TOKEN_KEY, data.token);
        return data;
      }
      return null;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  },

  logout() {
    localStorage.removeItem(SESSION_TOKEN_KEY);
    window.location.reload();
  },

  getToken(): string | null {
    return localStorage.getItem(SESSION_TOKEN_KEY);
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};

// Interceptor for API calls to add auth token
export function getAuthHeaders(): HeadersInit {
  const token = authAPI.getToken();
  return token ? { 'X-Session-Token': token } : {};
}
