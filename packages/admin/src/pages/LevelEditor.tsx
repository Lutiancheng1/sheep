import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Form, Slider, Row, Col, message, Radio, Space, Tag } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { createLevel, getLevel, togglePublish } from '../services/api';
import PhaserPreview from '../components/PhaserPreview';

const TILE_TYPES = [
  'carrot',
  'wheat',
  'wood',
  'grass',
  'stone',
  'coin',
  'shovel',
  'corn',
  'milk',
  'egg',
  'wool',
  'apple',
  'pumpkin',
  'flower',
];

interface Tile {
  id: string;
  type: string;
  x: number;
  y: number;
  layer: number;
}

const LevelEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [tiles, setTiles] = useState<Tile[]>([]);
  const [currentLayer, setCurrentLayer] = useState(1);
  const [selectedType, setSelectedType] = useState('carrot');
  const [status, setStatus] = useState<string>('draft');

  useEffect(() => {
    if (id && id !== 'new') {
      fetchLevel(id);
    } else {
      form.setFieldsValue({
        levelId: 'level-new',
        difficulty: 1,
      });
    }
  }, [id]);

  const fetchLevel = async (levelId: string) => {
    try {
      const level = await getLevel(levelId);
      form.setFieldsValue({
        levelId: level.levelId,
        difficulty: level.difficulty,
      });
      setTiles(level.data.tiles || []);
      setStatus(level.status || 'draft');
    } catch (error) {
      message.error('加载关卡失败');
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const levelData = {
        levelId: values.levelId,
        difficulty: values.difficulty,
        status: status,
        data: {
          tiles: tiles,
          gridSize: { cols: 8, rows: 10 },
        },
      };

      await createLevel(levelData);
      message.success('关卡保存成功');
      navigate('/levels');
    } catch (error) {
      message.error('保存失败');
    }
  };

  const handleTogglePublish = async () => {
    try {
      const values = await form.validateFields();
      // 先保存
      await handleSave();
      // 再切换发布状态
      await togglePublish(values.levelId);
      message.success(`已${status === 'published' ? '下架' : '发布'}`);
      fetchLevel(values.levelId);
    } catch (error) {
      message.error('操作失败');
    }
  };

  // 统计各图层的方块数量
  const layerStats = tiles.reduce((acc: Record<number, number>, tile) => {
    acc[tile.layer] = (acc[tile.layer] || 0) + 1;
    return acc;
  }, {});

  return (
    <Row gutter={24} style={{ height: 'calc(100vh - 150px)' }}>
      {/* 左侧控制面板 - 40% */}
      <Col span={10} style={{ height: '100%', overflowY: 'auto' }}>
        <Card title="关卡设置">
          <Form form={form} layout="vertical">
            <Form.Item name="levelId" label="关卡 ID" rules={[{ required: true }]}>
              <Input disabled={!!id && id !== 'new'} />
            </Form.Item>
            <Form.Item name="difficulty" label="难度">
              <Slider min={1} max={20} />
            </Form.Item>
          </Form>

          <div style={{ marginBottom: 20 }}>
            <Tag color={status === 'published' ? 'green' : 'orange'}>
              {status === 'published' ? '已发布' : '草稿'}
            </Tag>
          </div>

          <div style={{ marginTop: 20 }}>
            <h4>图层控制 (Layer)</h4>
            <Radio.Group
              value={currentLayer}
              onChange={(e) => setCurrentLayer(e.target.value)}
              buttonStyle="solid"
            >
              <Space wrap>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((l) => (
                  <Radio.Button key={l} value={l}>
                    {l} {layerStats[l] ? `(${layerStats[l]})` : ''}
                  </Radio.Button>
                ))}
              </Space>
            </Radio.Group>
          </div>

          <div style={{ marginTop: 20 }}>
            <h4>素材库</h4>
            <Space wrap>
              {TILE_TYPES.map((type) => (
                <div
                  key={type}
                  onClick={() => setSelectedType(type)}
                  style={{
                    width: 50,
                    height: 50,
                    border: selectedType === type ? '3px solid #1890ff' : '1px solid #ddd',
                    borderRadius: 8,
                    background: '#f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={`/icons/${type}.png`}
                    alt={type}
                    style={{ width: '80%', height: '80%', objectFit: 'contain' }}
                  />
                </div>
              ))}
            </Space>
          </div>

          <div style={{ marginTop: 20 }}>
            <h4>点击操作说明</h4>
            <p style={{ fontSize: 12, color: '#666' }}>
              • 在右侧预览中点击方块可移入槽位
              <br />
              • 实时查看三消效果
              <br />• 当前图层: {currentLayer} | 方块总数: {tiles.length}
            </p>
          </div>

          <Space direction="vertical" style={{ width: '100%', marginTop: 20 }}>
            <Button type="primary" block onClick={handleSave}>
              保存关卡
            </Button>
            <Button block onClick={handleTogglePublish} disabled={!id || id === 'new'}>
              {status === 'published' ? '下架关卡' : '发布关卡'}
            </Button>
            <Button block onClick={() => navigate('/levels')}>
              返回列表
            </Button>
          </Space>
        </Card>
      </Col>

      {/* 右侧 Phaser 预览 - 60% */}
      <Col span={14} style={{ height: '100%' }}>
        <Card
          title="实时预览 (可点击方块测试三消)"
          bodyStyle={{
            padding: 20,
            height: 'calc(100% - 57px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          style={{ height: '100%' }}
        >
          <PhaserPreview tiles={tiles} onTilesChange={setTiles} />
        </Card>
      </Col>
    </Row>
  );
};

export default LevelEditor;
