import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Card, Tag, message, Modal } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ExclamationCircleOutlined, HolderOutlined } from '@ant-design/icons';
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  getLevels,
  Level,
  togglePublish,
  batchPublish,
  deleteLevel,
  batchDeleteLevels,
  updateLevel,
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
      const data = await getLevels(true); // 管理后台查看所有关卡(包括草稿)
      // 按sortOrder排序
      const sorted = data.sort((a, b) => {
        const sortA = typeof a.sortOrder === 'number' ? a.sortOrder : 9999;
        const sortB = typeof b.sortOrder === 'number' ? b.sortOrder : 9999;
        return sortA - sortB;
      });
      setLevels(sorted);
    } catch (error) {
      console.error('Failed to fetch levels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (id: string) => {
    try {
      await togglePublish(id);
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

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除关卡 ${id} 吗?此操作不可撤销!`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteLevel(id);
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

  // 拖拽传感器配置
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  // 拖拽结束处理
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = levels.findIndex((l) => l.id === active.id);
    const newIndex = levels.findIndex((l) => l.id === over.id);

    const newLevels = arrayMove(levels, oldIndex, newIndex);
    setLevels(newLevels);

    try {
      await Promise.all(
        newLevels.map((level, index) => updateLevel(level.id, { sortOrder: index + 1 })),
      );
      message.success('排序已保存');
    } catch (error) {
      message.error('保存排序失败');
      fetchLevels();
    }
  };

  // 可拖拽行组件
  interface DraggableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
    'data-row-key': string;
  }

  const DraggableRow: React.FC<DraggableRowProps> = ({ children, ...props }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: props['data-row-key'],
    });

    const style: React.CSSProperties = {
      ...props.style,
      transform: CSS.Transform.toString(transform),
      transition,
      cursor: 'move',
      ...(isDragging ? { position: 'relative', zIndex: 9999 } : {}),
    };

    return (
      <tr {...props} ref={setNodeRef} style={style} {...attributes} {...listeners}>
        {children}
      </tr>
    );
  };

  const columns = [
    {
      title: '拖动排序',
      key: 'drag',
      width: 100,
      align: 'center' as const,
      render: () => <HolderOutlined style={{ cursor: 'move', fontSize: 16, color: '#999' }} />,
    },
    {
      title: '关卡名称',
      dataIndex: 'levelName',
      key: 'levelName',
      render: (text: string | null, record: Level) => (
        <Button type="link" onClick={() => navigate(`/levels/${record.id}`)}>
          {text || `关卡-${record.id.slice(0, 6)}`}
        </Button>
      ),
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
          <Button type="primary" size="small" onClick={() => navigate(`/levels/${record.id}`)}>
            编辑
          </Button>
          <Button size="small" onClick={() => handleTogglePublish(record.id)}>
            {record.status === 'published' ? '下架' : '发布'}
          </Button>
          <Button danger size="small" onClick={() => handleDelete(record.id)}>
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

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={levels.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          <Table
            rowSelection={rowSelection}
            dataSource={levels}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 20 }}
            components={{
              body: {
                row: DraggableRow,
              },
            }}
          />
        </SortableContext>
      </DndContext>
    </Card>
  );
};

export default LevelList;
