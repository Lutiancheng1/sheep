import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Card, Tag, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { getLevels, Level, togglePublish } from '../services/api';

const LevelList: React.FC = () => {
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLevels();
  }, []);

  const fetchLevels = async () => {
    setLoading(true);
    try {
      const data = await getLevels(true); // 管理后台查看所有关卡（包括草稿）
      // 如果可能，按 levelId 数字排序
      const sorted = data.sort((a, b) => {
        const numA = parseInt(a.levelId.replace('level-', '')) || 0;
        const numB = parseInt(b.levelId.replace('level-', '')) || 0;
        return numA - numB;
      });
      setLevels(sorted);
    } catch (error) {
      console.error('Failed to fetch levels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (levelId: string) => {
    try {
      await togglePublish(levelId);
      message.success('发布状态已更新');
      fetchLevels(); // 重新加载列表
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns = [
    {
      title: '关卡 ID',
      dataIndex: 'levelId',
      key: 'levelId',
      render: (text: string) => (
        <Button type="link" onClick={() => navigate(`/levels/${text}`)}>
          {text}
        </Button>
      ),
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      render: (diff: number) => {
        let color = 'green';
        if (diff > 5) color = 'blue';
        if (diff > 10) color = 'orange';
        if (diff > 15) color = 'red';
        return <Tag color={color}>难度 {diff}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const isPublished = status === 'published';
        return (
          <Tag color={isPublished ? 'green' : 'orange'}>{isPublished ? '已发布' : '草稿'}</Tag>
        );
      },
    },
    {
      title: '方块数量',
      dataIndex: ['data', 'tiles'],
      key: 'tilesCount',
      render: (tiles: any[]) => tiles?.length || 0,
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Level) => (
        <Space size="middle">
          <Button type="primary" size="small" onClick={() => navigate(`/levels/${record.levelId}`)}>
            编辑
          </Button>
          <Button size="small" onClick={() => handleTogglePublish(record.levelId)}>
            {record.status === 'published' ? '下架' : '发布'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="关卡管理"
      extra={
        <Button type="primary" onClick={() => navigate('/levels/new')}>
          新建关卡
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={levels}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );
};

export default LevelList;
