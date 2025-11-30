const API_BASE_URL = typeof window !== 'undefined'
  ? `http://${window.location.hostname}:3001`
  : 'http://localhost:3001';

export const api = {
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  },

  async request(endpoint: string, options: RequestInit = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      ...options.headers,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('API Request Failed:', error);
      // If unauthorized or bad request (likely invalid user), clear token and reload
      if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Bad Request'))) {
        localStorage.removeItem('token');
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }
      throw error;
    }
  },

  async guestLogin() {
    const data = await this.request('/auth/guest', { method: 'POST' });
    if (data.access_token) {
      this.setToken(data.access_token);
    }
    return data;
  },

  async refreshToken() {
    try {
      if (!this.token) return null;
      const data = await this.request('/auth/refresh', { method: 'POST' });
      if (data.access_token) {
        this.setToken(data.access_token);
        console.log('Token refreshed successfully');
      }
      return data;
    } catch (e) {
      console.warn('Failed to refresh token', e);
      return null;
    }
  },

  async getLevels() {
    return this.request('/levels');
  },

  async getLevel(id: string) {
    return this.request(`/levels/${id}`);
  },

  async submitProgress(levelId: string, status: string, score: number) {
    return this.request('/progress/submit', {
      method: 'POST',
      body: JSON.stringify({ levelId, status, score }),
    });
  },

  async getProgressHistory() {
    return this.request('/progress/history');
  },

  async getGlobalLeaderboard(limit = 10) {
    return this.request(`/leaderboard/global?limit=${limit}`);
  },

  async getLevelLeaderboard(levelId: string, limit = 10) {
    return this.request(`/leaderboard/level/${levelId}?limit=${limit}`);
  },

  async getItemStatus() {
    return this.request('/items/status');
  },

  async useItem(type: 'remove' | 'undo' | 'shuffle') {
    return this.request('/items/use', {
      method: 'POST',
      body: JSON.stringify({ type }),
    });
  }
};

export const getGlobalLeaderboard = (limit?: number) => api.getGlobalLeaderboard(limit);
export const getLevelLeaderboard = (levelId: string, limit?: number) => api.getLevelLeaderboard(levelId, limit);
