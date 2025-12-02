import React, {useEffect, useState} from 'react';
import {Table, Card, Tag, message, Button, Modal, Space, Descriptions, Popconfirm} from 'antd';
import {DeleteOutlined, ExclamationCircleOutlined} from '@ant-design/icons';
import {getUsers, getCleanupPreview, executeCleanup, deleteUser} from '../services/api';

interface User {
  id: string;
  username: string;
  isGuest: boolean;
  createdAt: string;
  maxScore: number;
  currentLevel: number;
  totalPlaytimeSeconds: number;
}

interface CleanupPreview {
  users: Array<{
    id: string;
    username: string;
    createdAt: string;
    totalPlaytimeSeconds: number;
  }>;
  count: number;
  estimatedSpaceFreed: string;
}

const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [cleanupModalVisible, setCleanupModalVisible] = useState(false);
  const [cleanupPreview, setCleanupPreview] = useState<CleanupPreview | null>(null);
  const [cleaningup, setCleaningup] = useState(false);

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

  // 预览清理
  const handleShowCleanupPreview = async () => {
    try {
      const preview = await getCleanupPreview();
      setCleanupPreview(preview);
      setCleanupModalVisible(true);
    } catch (error) {
      message.error('获取清理预览失败');
      console.error(error);
    }
  };

  // 执行清理
  const handleExecuteCleanup = async () => {
    Modal.confirm({
      title: '确认清理',
      icon: <ExclamationCircleOutlined />,
      content: '此操作将永久删除这些账户及其所有相关数据,无法恢复。确定要继续吗?',
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        setCleaningup(true);
        try {
          const result = await executeCleanup();
          message.success(`成功清理 ${result.deletedCount} 个无用游客账户,释放空间: ${result.freedSpace}`);
          setCleanupModalVisible(false);
          setCleanupPreview(null);
          // 刷新列表
          fetchUsers();
        } catch (error) {
          message.error('清理失败');
          console.error(error);
        } finally {
          setCleaningup(false);
        }
      },
    });
  };

  // 删除单个用户
  const handleDeleteUser = async (userId: string, username: string) => {
    try {
      await deleteUser(userId);
      message.success(`用户 "${username}" 已删除`);
      fetchUsers(); // 刷新列表
    } catch (error) {
      message.error('删除用户失败');
      console.error(error);
    }
  };

  const columns = [
    {
      title: '用户 ID',
      dataIndex: 'id',
      key: 'id',
      width: 300,
      render: (text: string) => <span style={{fontFamily: 'monospace'}}>{text}</span>,
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
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: User) => (
        <Popconfirm
          title="确认删除"
          description={`确定要删除用户 "${record.username}" 吗?此操作不可恢复。`}
          onConfirm={() => handleDeleteUser(record.id, record.username)}
          okText="确认删除"
          cancelText="取消"
          okType="danger"
        >
          <Button type="link" danger size="small">
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <>
      <Card
        title="用户管理"
        extra={
          <Space>
            <span style={{color: '#999'}}>总数: {users.length}</span>
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              onClick={handleShowCleanupPreview}
            >
              清理无用游客账户
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={users}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          scroll={{x: 800}}
        />
      </Card>

      {/* 清理预览对话框 */}
      <Modal
        title="清理无用游客账户 - 预览"
        open={cleanupModalVisible}
        onCancel={() => setCleanupModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setCleanupModalVisible(false)}>
            取消
          </Button>,
          <Button
            key="confirm"
            type="primary"
            danger
            loading={cleaningup}
            onClick={handleExecuteCleanup}
            disabled={!cleanupPreview || cleanupPreview.count === 0}
          >
            确认清理
          </Button>,
        ]}
        width={800}
      >
        {cleanupPreview && (
          <div>
            <Descriptions column={1} bordered style={{marginBottom: 16}}>
              <Descriptions.Item label="将被清理的账户数量">
                <strong style={{fontSize: '16px', color: '#ff4d4f'}}>
                  {cleanupPreview.count} 个
                </strong>
              </Descriptions.Item>
              <Descriptions.Item label="预计释放空间">
                {cleanupPreview.estimatedSpaceFreed}
              </Descriptions.Item>
            </Descriptions>

            {cleanupPreview.count === 0 ? (
              <div style={{textAlign: 'center', padding: '40px 0', color: '#999'}}>
                暂无符合清理条件的游客账户
              </div>
            ) : (
              <>
                <div style={{marginBottom: 12}}>
                  <ExclamationCircleOutlined style={{color: '#faad14', marginRight: 8}} />
                  <strong>清理条件:</strong> 注册超过7天、从未游戏(游玩时长为0)的游客账户
                </div>

                <div
                  style={{
                    background: '#fff1f0',
                    border: '1px solid #ffa39e',
                    borderRadius: '4px',
                    padding: '12px',
                    marginBottom: 16,
                  }}
                >
                  <ExclamationCircleOutlined style={{color: '#ff4d4f', marginRight: 8}} />
                  <strong>重要提示:</strong> 此操作将永久删除这些账户及其所有关联数据,包括游戏进度和日志,<strong>无法恢复</strong>!
                </div>

                <div style={{maxHeight: '300px', overflow: 'auto'}}>
                  <Table
                    dataSource={cleanupPreview.users}
                    columns={[
                      {
                        title: '用户名',
                        dataIndex: 'username',
                        key: 'username',
                      },
                      {
                        title: '注册时间',
                        dataIndex: 'createdAt',
                        key: 'createdAt',
                        render: (date: string) => new Date(date).toLocaleString(),
                      },
                      {
                        title: '游玩时长',
                        dataIndex: 'totalPlaytimeSeconds',
                        key: 'totalPlaytimeSeconds',
                        render: () => '0秒',
                      },
                    ]}
                    rowKey="id"
                    pagination={false}
                    size="small"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default UserList;
