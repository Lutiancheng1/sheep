import axios from 'axios';

const API_URL = 'http://localhost:3001';

export const api = axios.create({
    baseURL: API_URL,
});

export interface Level {
    id: string;
    levelId: string;
    difficulty: number;
    data: {
        tiles: any[];
        gridSize: { cols: number; rows: number };
    };
}

export const getLevels = async (): Promise<Level[]> => {
    const response = await api.get('/levels');
    return response.data;
};

export const getLevel = async (id: string): Promise<Level> => {
    const response = await api.get(`/levels/${id}`);
    return response.data;
};

export const createLevel = async (levelData: { levelId: string; difficulty: number; data: any }) => {
    const response = await api.post('/levels', levelData);
    return response.data;
};

