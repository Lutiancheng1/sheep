import React, { useEffect, useState } from 'react';
import { Table, Card, Tag, message } from 'antd';
import { getUsers } from '../services/api';

interface User {
  id: string;
  username: string;
  isGuest: boolean;
  createdAt: string;
  maxScore: number;
  currentLevel: number;
  totalPlaytimeSeconds: number;
}

const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      message.error('获取用户列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const columns = [
    {
      title: '用户 ID',
      dataIndex: 'id',
      key: 'id',
      width: 300,
      render: (text: string) => <span style={{ fontFamily: 'monospace' }}>{text}</span>,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '用户类型',
      dataIndex: 'isGuest',
      key: 'isGuest',
      render: (isGuest: boolean) => (
        <Tag color={isGuest ? 'orange' : 'green'}>
          {isGuest ? '游客' : '注册用户'}
        </Tag>
      ),
    },
    {
      title: '最高分',
      dataIndex: 'maxScore',
      key: 'maxScore',
      sorter: (a: User, b: User) => a.maxScore - b.maxScore,
    },
    {
      title: '当前关卡',
      dataIndex: 'currentLevel',
      key: 'currentLevel',
      sorter: (a: User, b: User) => a.currentLevel - b.currentLevel,
    },
    {
      title: '总游玩时长',
      dataIndex: 'totalPlaytimeSeconds',
      key: 'totalPlaytimeSeconds',
      render: (seconds: number) => {
        if (!seconds) return '0m';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
      },
      sorter: (a: User, b: User) => (a.totalPlaytimeSeconds || 0) - (b.totalPlaytimeSeconds || 0),
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
      sorter: (a: User, b: User) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
  ];

  return (
    <Card title="用户管理" extra={<span style={{ color: '#999' }}>总数: {users.length}</span>}>
      <Table
        dataSource={users}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );
};

export default UserList;
