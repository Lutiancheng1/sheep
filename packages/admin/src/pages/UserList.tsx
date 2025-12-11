import React, { useEffect, useState } from 'react';
import {
  Table,
  Card,
  Tag,
  message,
  Button,
  Modal,
  Space,
  Descriptions,
  Popconfirm,
  Form,
  InputNumber,
} from 'antd';
import { DeleteOutlined, ExclamationCircleOutlined, EditOutlined } from '@ant-design/icons';
import {
  getUsers,
  getCleanupPreview,
  executeCleanup,
  deleteUser,
  updateUserItems,
} from '../services/api';

interface User {
  id: string;
  username: string;
  isGuest: boolean;
  createdAt: string;
  maxScore: number;
  currentLevel: number;
  totalPlaytimeSeconds: number;
  dailyReviveUsage: number;
  itemInventory: {
    remove: number;
    undo: number;
    shuffle: number;
  };
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
  const [pageSize, setPageSize] = useState(10);

  // Edit Items State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm] = Form.useForm();
  const [savingItems, setSavingItems] = useState(false);

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
          message.success(
            `成功清理 ${result.deletedCount} 个无用游客账户,释放空间: ${result.freedSpace}`,
          );
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

  // 打开编辑道具弹窗
  const handleEditItems = (user: User) => {
    setEditingUser(user);
    editForm.setFieldsValue({
      remove: user.itemInventory?.remove || 0,
      undo: user.itemInventory?.undo || 0,
      shuffle: user.itemInventory?.shuffle || 0,
      revive: user.dailyReviveUsage || 0,
    });
    setEditModalVisible(true);
  };

  // 保存道具修改
  const handleSaveItems = async () => {
    if (!editingUser) return;
    try {
      setSavingItems(true);
      const values = await editForm.validateFields();
      await updateUserItems(editingUser.id, values);
      message.success('用户道具使用情况已更新');
      setEditModalVisible(false);
      fetchUsers(); // 刷新列表
    } catch (error) {
      message.error('更新失败');
      console.error(error);
    } finally {
      setSavingItems(false);
    }
  };

  const columns = [
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
        <Tag color={isGuest ? 'orange' : 'green'}>{isGuest ? '游客' : '注册用户'}</Tag>
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
      sorter: (a: User, b: User) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: User) => (
        <Space>
          <Button
            type="primary"
            ghost
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditItems(record)}
          >
            道具
          </Button>
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
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card
        title="用户管理"
        extra={
          <Space>
            <span style={{ color: '#999' }}>总数: {users.length}</span>
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
            pageSize: pageSize,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            pageSizeOptions: ['10', '20', '50'],
            onChange: (_page, size) => setPageSize(size),
          }}
          scroll={{ x: 800, y: 'calc(100vh - 450px)' }}
          sticky
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
            <Descriptions column={1} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="将被清理的账户数量">
                <strong style={{ fontSize: '16px', color: '#ff4d4f' }}>
                  {cleanupPreview.count} 个
                </strong>
              </Descriptions.Item>
              <Descriptions.Item label="预计释放空间">
                {cleanupPreview.estimatedSpaceFreed}
              </Descriptions.Item>
            </Descriptions>

            {cleanupPreview.count === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                暂无符合清理条件的游客账户
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 12 }}>
                  <ExclamationCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />
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
                  <ExclamationCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                  <strong>重要提示:</strong>{' '}
                  此操作将永久删除这些账户及其所有关联数据,包括游戏进度和日志,
                  <strong>无法恢复</strong>!
                </div>

                <div style={{ maxHeight: '300px', overflow: 'auto' }}>
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

      {/* 编辑道具弹窗 */}
      <Modal
        title={`编辑用户道具 - ${editingUser?.username}`}
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={handleSaveItems}
        confirmLoading={savingItems}
      >
        <div style={{ marginBottom: 16, color: '#666' }}>
          <ExclamationCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />
          <strong>注意:</strong>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li>
              <strong>道具 (移出/撤销/洗牌):</strong> 修改的是用户的<strong>剩余库存</strong>。
            </li>
            <li>
              <strong>复活:</strong> 修改的是用户<strong>今日已使用</strong>的次数。
            </li>
          </ul>
        </div>
        <Form form={editForm} layout="vertical">
          <Form.Item name="remove" label="移出道具 (剩余库存)">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="undo" label="撤销道具 (剩余库存)">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="shuffle" label="洗牌道具 (剩余库存)">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="revive" label="复活 (今日已用次数)">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default UserList;
