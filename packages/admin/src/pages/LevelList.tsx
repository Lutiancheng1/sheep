import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Card, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import { getLevels, Level } from '../services/api';

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
            const data = await getLevels();
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

    const columns = [
        {
            title: '关卡 ID',
            dataIndex: 'levelId',
            key: 'levelId',
            render: (text: string) => <Button type="link" onClick={() => navigate(`/levels/${text}`)}>{text}</Button>,
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
                </Space>
            ),
        },
    ];

    return (
        <Card
            title="关卡管理"
            extra={<Button type="primary" onClick={() => navigate('/levels/new')}>新建关卡</Button>}
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
