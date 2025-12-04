import axios from 'axios';

// 从环境变量读取 API baseURL,开发环境默认使用 localhost:4001
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';
const API_KEY = import.meta.env.VITE_API_KEY;
const TOKEN_KEY = 'admin_token';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

// 请求拦截器: 自动添加 API Key (如果配置了)
api.interceptors.request.use((config) => {
  if (API_KEY) {
    config.headers['X-API-Key'] = API_KEY;
  }

  // 自动添加 Admin Token (如果已登录)
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// 响应拦截器: 统一错误处理
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // 未授权/Token过期
          // 避免在登录页重复跳转
          if (!window.location.pathname.includes('/login')) {
            localStorage.removeItem(TOKEN_KEY);
            window.location.href = '/login';
            // 使用 window.alert 或 console.error，因为 message 组件可能无法在此处正常工作(取决于调用上下文)
            // 但 antd message 是静态方法，通常可以工作
          }
          break;
        case 403:
          // 无权访问
          console.error('无权访问:', data.message);
          break;
        case 500:
          // 服务器错误
          console.error('服务器错误:', data.message);
          break;
        default:
          console.error('API请求失败:', data.message || error.message);
      }
    } else if (error.request) {
      // 网络错误
      console.error('网络连接失败');
    }

    return Promise.reject(error);
  },
);

export interface Level {
  id: string;
  levelId: string;
  difficulty: number;
  status?: string; // 'draft' | 'published'
  data: {
    tiles: any[];
    gridSize: { cols: number; rows: number };
  };
}

export const getLevels = async (includeAll = false): Promise<Level[]> => {
  const response = await api.get('/levels', {
    params: { includeAll: includeAll ? 'true' : 'false' },
  });
  return response.data;
};

export const getLevel = async (id: string): Promise<Level> => {
  const response = await api.get(`/levels/${id}`);
  return response.data;
};

export const getUsers = async () => {
  const response = await api.get('/users');
  return response.data;
};

export const createLevel = async (levelData: {
  levelId: string;
  difficulty: number;
  data: any;
  status?: string;
}) => {
  const response = await api.post('/levels', levelData);
  return response.data;
};

export const togglePublish = async (levelId: string) => {
  const response = await api.patch(`/levels/${levelId}/toggle-publish`);
  return response.data;
};

export const getLogs = async (params?: {
  userId?: string;
  action?: string;
  limit?: number;
  offset?: number;
}) => {
  const response = await api.get('/logs', { params });
  return response.data;
};

// 管理员认证相关

export const adminLogin = async (username: string, password: string) => {
  const response = await fetch(`${API_BASE_URL}/admin/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    throw new Error('登录失败');
  }

  const data = await response.json();
  // 保存 token 到 localStorage
  localStorage.setItem(TOKEN_KEY, data.access_token);
  return data;
};

export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

// 游客清理相关
export const getCleanupPreview = async () => {
  const response = await api.get('/users/cleanup/preview');
  return response.data;
};

export const executeCleanup = async () => {
  const response = await api.post('/users/cleanup');
  return response.data;
};

// 删除用户
export const deleteUser = async (id: string) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};

// 批量发布/下架关卡
export const batchPublish = async (levelIds: string[], status: 'published' | 'draft') => {
  const response = await api.patch('/levels/batch/publish', { levelIds, status });
  return response.data;
};

// 删除关卡
export const deleteLevel = async (levelId: string) => {
  const response = await api.delete(`/levels/${levelId}`);
  return response.data;
};

// 批量删除关卡
export const batchDeleteLevels = async (levelIds: string[]) => {
  const response = await api.delete('/levels/batch/delete', { data: { levelIds } });
  return response.data;
};
