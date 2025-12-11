import React, { useEffect, useState } from 'react';
import { Table, Card, Tag, Space, Button, Select, Radio, Switch } from 'antd';
import { getLogs, getUsers } from '../services/api';
import dayjs from 'dayjs';

// Action 中文映射
const getActionText = (action: string): string => {
  const actionMap: Record<string, string> = {
    LOGIN: '登录',
    LEVEL_START: '开始关卡',
    LEVEL_COMPLETE: '通关成功',
    LEVEL_FAIL: '闯关失败',
    HEARTBEAT: '心跳记录',
    SESSION_START: '开始会话',
    SESSION_END: '结束会话',
    ITEM_USE: '使用道具',
  };
  return actionMap[action] || action;
};

// Action 颜色配置
const getActionColor = (action: string): string => {
  const colorMap: Record<string, string> = {
    LOGIN: 'green',
    LEVEL_START: 'blue',
    LEVEL_COMPLETE: 'gold',
    LEVEL_FAIL: 'red',
    HEARTBEAT: 'default',
    SESSION_START: 'cyan',
    SESSION_END: 'cyan',
    ITEM_USE: 'purple',
  };
  return colorMap[action] || 'blue';
};

const UserLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('');
  const [action, setAction] = useState('');
  const [userType, setUserType] = useState<'all' | 'guest' | 'normal'>('all');
  const [pageSize, setPageSize] = useState(10);

  // 自动刷新状态
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(10); // 默认10秒

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchLogs = async () => {
    // 如果是自动刷新，不显示loading状态，避免闪烁
    if (!autoRefresh) {
      setLoading(true);
    }
    try {
      const data = await getLogs({
        userId: userId || undefined,
        action: action || undefined,
        limit: 100,
      });

      // 根据用户类型筛选
      let filteredLogs = data.items;
      if (userType === 'guest') {
        filteredLogs = filteredLogs.filter((log: any) => log.user?.isGuest === true);
      } else if (userType === 'normal') {
        filteredLogs = filteredLogs.filter((log: any) => log.user?.isGuest === false);
      }

      setLogs(filteredLogs);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      if (!autoRefresh) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchLogs();
  }, []);

  // 自动刷新逻辑
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (autoRefresh) {
      timer = setInterval(() => {
        fetchLogs();
      }, refreshInterval * 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [autoRefresh, refreshInterval, userId, action, userType]); // 依赖项包含筛选条件，确保刷新时使用当前筛选

  const columns = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '用户',
      dataIndex: ['user', 'username'],
      key: 'username',
      width: 250,
      render: (text: string, record: any) => {
        const isGuest = record.user?.isGuest;
        return (
          <Space>
            <Tag color={isGuest ? 'default' : 'blue'}>{isGuest ? '游客' : '正式'}</Tag>
            <span>{text || record.userId}</span>
          </Space>
        );
      },
    },
    {
      title: '行为',
      dataIndex: 'action',
      key: 'action',
      width: 120,
      render: (text: string) => {
        const color = getActionColor(text);
        const actionText = getActionText(text);
        return <Tag color={color}>{actionText}</Tag>;
      },
    },
    {
      title: '详情',
      dataIndex: 'details',
      key: 'details',
      render: (details: any) => (
        <pre style={{ margin: 0, fontSize: '12px' }}>{JSON.stringify(details, null, 2)}</pre>
      ),
    },
  ];

  // Action 类型选项
  const actionOptions = [
    { label: '全部', value: '' },
    { label: '登录', value: 'LOGIN' },
    { label: '开始关卡', value: 'LEVEL_START' },
    { label: '通关成功', value: 'LEVEL_COMPLETE' },
    { label: '闯关失败', value: 'LEVEL_FAIL' },
    { label: '使用道具', value: 'ITEM_USE' },
    { label: '心跳记录', value: 'HEARTBEAT' },
  ];

  return (
    <Card
      title="用户日志审计"
      extra={
        <Space>
          <Space>
            <span style={{ fontSize: '12px', color: '#999' }}>自动刷新:</span>
            <Switch checked={autoRefresh} onChange={setAutoRefresh} />

            {autoRefresh && (
              <Select
                value={refreshInterval}
                onChange={setRefreshInterval}
                style={{ width: 80 }}
                size="small"
                options={[
                  { label: '5秒', value: 5 },
                  { label: '10秒', value: 10 },
                  { label: '30秒', value: 30 },
                ]}
              />
            )}
          </Space>
          <Button onClick={fetchLogs} type="link">
            刷新
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* 筛选区域 */}
        <Card size="small" title="筛选条件">
          <Space wrap>
            <Select
              showSearch
              allowClear
              style={{ width: 250 }}
              placeholder="选择用户"
              value={userId || undefined}
              onChange={(value) => setUserId(value || '')}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={users.map((user) => ({
                label: `${user.username} ${user.isGuest ? '(游客)' : ''}`,
                value: user.id,
              }))}
            />
            <Select
              allowClear
              style={{ width: 150 }}
              placeholder="行为类型"
              value={action || undefined}
              onChange={(value) => setAction(value || '')}
              options={actionOptions}
            />
            <Radio.Group
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              buttonStyle="solid"
            >
              <Radio.Button value="all">全部用户</Radio.Button>
              <Radio.Button value="guest">仅游客</Radio.Button>
              <Radio.Button value="normal">仅正式用户</Radio.Button>
            </Radio.Group>
            <Button type="primary" onClick={fetchLogs}>
              查询
            </Button>
            <Button
              onClick={() => {
                setUserId('');
                setAction('');
                setUserType('all');
              }}
            >
              重置
            </Button>
          </Space>
        </Card>

        {/* 统计信息 */}
        <div style={{ color: '#666' }}>共 {logs.length} 条日志记录</div>

        {/* 日志表格 */}
        <Table
          dataSource={logs}
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
          scroll={{ x: 1000, y: 'calc(100vh - 550px)' }}
          sticky
        />
      </Space>
    </Card>
  );
};

export default UserLogs;
