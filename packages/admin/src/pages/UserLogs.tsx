import React, { useEffect, useState } from 'react';
import { Table, Card, Tag, Input, Button, Space } from 'antd';
import { getLogs } from '../services/api';
import dayjs from 'dayjs';

const UserLogs: React.FC = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState('');
    const [action, setAction] = useState('');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = await getLogs({ 
                userId: userId || undefined, 
                action: action || undefined,
                limit: 50 
            });
            setLogs(data.items);
        } catch (error) {
            console.error('Failed to fetch logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const columns = [
        {
            title: '时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
        },
        {
            title: '用户',
            dataIndex: ['user', 'username'],
            key: 'username',
            render: (text: string, record: any) => text || record.userId,
        },
        {
            title: '行为',
            dataIndex: 'action',
            key: 'action',
            render: (text: string) => {
                let color = 'blue';
                if (text === 'LOGIN') color = 'green';
                if (text === 'LEVEL_COMPLETE') color = 'gold';
                if (text === 'ITEM_USE') color = 'purple';
                if (text === 'HEARTBEAT') color = 'default';
                return <Tag color={color}>{text}</Tag>;
            },
        },
        {
            title: '详情',
            dataIndex: 'details',
            key: 'details',
            render: (details: any) => (
                <pre style={{ margin: 0, fontSize: '12px' }}>
                    {JSON.stringify(details, null, 2)}
                </pre>
            ),
        },
    ];

    return (
        <Card title="用户日志审计" extra={<Button onClick={fetchLogs}>刷新</Button>}>
            <Space style={{ marginBottom: 16 }}>
                <Input 
                    placeholder="用户ID" 
                    value={userId} 
                    onChange={e => setUserId(e.target.value)} 
                    style={{ width: 200 }}
                />
                <Input 
                    placeholder="行为类型 (如 LOGIN)" 
                    value={action} 
                    onChange={e => setAction(e.target.value)} 
                    style={{ width: 200 }}
                />
                <Button type="primary" onClick={fetchLogs}>查询</Button>
            </Space>
            <Table 
                dataSource={logs} 
                columns={columns} 
                rowKey="id" 
                loading={loading}
                pagination={{ pageSize: 20 }}
            />
        </Card>
    );
};

export default UserLogs;
