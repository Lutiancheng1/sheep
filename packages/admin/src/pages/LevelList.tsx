import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Card, Tag, message, Modal } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import {
  getLevels,
  Level,
  togglePublish,
  batchPublish,
  deleteLevel,
  batchDeleteLevels,
} from '../services/api';

const LevelList: React.FC = () => {
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
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
      fetchLevels();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleBatchPublish = async (status: 'published' | 'draft') => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择关卡');
      return;
    }

    try {
      await batchPublish(selectedRowKeys as string[], status);
      message.success(
        `已${status === 'published' ? '发布' : '下架'} ${selectedRowKeys.length} 个关卡`,
      );
      setSelectedRowKeys([]);
      fetchLevels();
    } catch (error) {
      message.error('批量操作失败');
    }
  };

  const handleDelete = async (levelId: string) => {
    Modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除关卡 ${levelId} 吗?此操作不可撤销!`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteLevel(levelId);
          message.success('删除成功');
          fetchLevels();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择关卡');
      return;
    }

    Modal.confirm({
      title: '确认批量删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除选中的 ${selectedRowKeys.length} 个关卡吗?此操作不可撤销!`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await batchDeleteLevels(selectedRowKeys as string[]);
          message.success(`已删除 ${selectedRowKeys.length} 个关卡`);
          setSelectedRowKeys([]);
          fetchLevels();
        } catch (error) {
          message.error('批量删除失败');
        }
      },
    });
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
          <Button danger size="small" onClick={() => handleDelete(record.levelId)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  return (
    <Card
      title="关卡管理"
      extra={
        <Button type="primary" onClick={() => navigate('/levels/new')}>
          新建关卡
        </Button>
      }
    >
      {selectedRowKeys.length > 0 && (
        <Space style={{ marginBottom: 16 }}>
          <Button onClick={() => handleBatchPublish('published')}>批量发布</Button>
          <Button onClick={() => handleBatchPublish('draft')}>批量下架</Button>
          <Button danger onClick={handleBatchDelete}>
            批量删除
          </Button>
          <span style={{ marginLeft: 8 }}>已选择 {selectedRowKeys.length} 项</span>
        </Space>
      )}

      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={levels}
        rowKey="levelId"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );
};

export default LevelList;
