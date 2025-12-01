import { api } from './api';

class AnalyticsService {
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private sessionId: string | null = null;

  async logEvent(action: string, details?: any) {
    try {
      await api.request('/logs/event', {
        method: 'POST',
        body: JSON.stringify({ action, details }),
      });
    } catch (error) {
      console.error('Failed to log event:', error);
    }
  }

  startSession() {
    if (this.heartbeatInterval) return;
    
    this.sessionId = Date.now().toString();
    this.logEvent('SESSION_START', { sessionId: this.sessionId });

    // Send heartbeat every 60 seconds
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 60000);
  }

  endSession() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.sessionId) {
      this.logEvent('SESSION_END', { sessionId: this.sessionId });
      this.sessionId = null;
    }
  }

  private async sendHeartbeat() {
    try {
      await api.request('/logs/event', {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'HEARTBEAT', 
          details: { duration: 60, sessionId: this.sessionId } 
        }),
      });
    } catch (error) {
      // Silent fail for heartbeat
    }
  }
}

export const Analytics = new AnalyticsService();
