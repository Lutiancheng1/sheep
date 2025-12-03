import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Form, Slider, Row, Col, message, Radio, Space, Tag } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { createLevel, getLevel, togglePublish } from '../services/api';

const TILE_SIZE = 40; // 编辑器中每个方块的尺寸
const GAME_TILE_SIZE = 80; // 游戏中实际方块尺寸
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 1000;

// 手机预览框尺寸 (iPhone SE: 375x667, 缩放50%)
const DEVICE_WIDTH = 375;
const DEVICE_HEIGHT = 667;
const DEVICE_SCALE = 0.5;

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

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // 转换为游戏坐标
    const gameX = (clickX / TILE_SIZE) * GAME_TILE_SIZE;
    const gameY = (clickY / TILE_SIZE) * GAME_TILE_SIZE;

    // 吸附到40px网格（游戏中的半个tile）
    const snappedX = Math.round(gameX / 40) * 40;
    const snappedY = Math.round(gameY / 40) * 40;

    // 检查是否已存在同位置同层的方块
    const existingIndex = tiles.findIndex(
      (t) =>
        Math.abs(t.x - snappedX) < 20 && Math.abs(t.y - snappedY) < 20 && t.layer === currentLayer,
    );

    if (existingIndex >= 0) {
      // 删除已存在的方块
      const newTiles = [...tiles];
      newTiles.splice(existingIndex, 1);
      setTiles(newTiles);
    } else {
      // 添加新方块
      const newTile: Tile = {
        id: `editor-${Date.now()}`,
        type: selectedType,
        x: snappedX,
        y: snappedY,
        layer: currentLayer,
      };
      setTiles([...tiles, newTile]);
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

  // 计算手机预览框在画布中的位置（居中）
  const deviceX = (CANVAS_WIDTH - DEVICE_WIDTH * DEVICE_SCALE) / 2;
  const deviceY = (CANVAS_HEIGHT - DEVICE_HEIGHT * DEVICE_SCALE) / 2;

  // 统计各图层的方块数量
  const layerStats = tiles.reduce((acc: Record<number, number>, tile) => {
    acc[tile.layer] = (acc[tile.layer] || 0) + 1;
    return acc;
  }, {});

  return (
    <Row gutter={24} style={{ height: 'calc(100vh - 100px)' }}>
      <Col span={6} style={{ height: '100%', overflowY: 'auto' }}>
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

          <Space direction="vertical" style={{ width: '100%', marginTop: 20 }}>
            <Button type="primary" block onClick={handleSave}>
              保存关卡
            </Button>
            <Button block onClick={handleTogglePublish} disabled={!id || id === 'new'}>
              {status === 'published' ? '下架关卡' : '发布关卡'}
            </Button>
          </Space>
        </Card>
      </Col>

      <Col span={18} style={{ height: '100%' }}>
        <Card
          title={`编辑器画布 (当前图层: ${currentLayer}) - 总方块数: ${tiles.length}`}
          bodyStyle={{ padding: 0, height: '100%', overflow: 'auto', background: '#2c2c2c' }}
          style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        >
          <div
            style={{
              padding: 20,
              minWidth: CANVAS_WIDTH + 40,
              minHeight: CANVAS_HEIGHT + 40,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: CANVAS_WIDTH,
                height: CANVAS_HEIGHT,
                background: '#1a1a1a',
                position: 'relative',
                boxShadow: '0 0 30px rgba(0,0,0,0.8)',
              }}
              onClick={handleCanvasClick}
            >
              {/* 主网格线 (40px = 半个tile) */}
              {Array.from({ length: CANVAS_WIDTH / TILE_SIZE + 1 }).map((_, i) => (
                <div
                  key={`v-${i}`}
                  style={{
                    position: 'absolute',
                    left: i * TILE_SIZE,
                    top: 0,
                    bottom: 0,
                    width: 1,
                    background: '#333',
                  }}
                />
              ))}
              {Array.from({ length: CANVAS_HEIGHT / TILE_SIZE + 1 }).map((_, i) => (
                <div
                  key={`h-${i}`}
                  style={{
                    position: 'absolute',
                    top: i * TILE_SIZE,
                    left: 0,
                    right: 0,
                    height: 1,
                    background: '#333',
                  }}
                />
              ))}

              {/* 辅助网格线 (80px = 完整tile，加粗) */}
              {Array.from({ length: CANVAS_WIDTH / (TILE_SIZE * 2) + 1 }).map((_, i) => (
                <div
                  key={`vb-${i}`}
                  style={{
                    position: 'absolute',
                    left: i * TILE_SIZE * 2,
                    top: 0,
                    bottom: 0,
                    width: 2,
                    background: '#555',
                  }}
                />
              ))}
              {Array.from({ length: CANVAS_HEIGHT / (TILE_SIZE * 2) + 1 }).map((_, i) => (
                <div
                  key={`hb-${i}`}
                  style={{
                    position: 'absolute',
                    top: i * TILE_SIZE * 2,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: '#555',
                  }}
                />
              ))}

              {/* 手机预览框 */}
              <div
                style={{
                  position: 'absolute',
                  left: deviceX,
                  top: deviceY,
                  width: DEVICE_WIDTH * DEVICE_SCALE,
                  height: DEVICE_HEIGHT * DEVICE_SCALE,
                  border: '3px solid #00ff00',
                  borderRadius: 8,
                  pointerEvents: 'none',
                  zIndex: 1000,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: -25,
                    left: 0,
                    color: '#00ff00',
                    fontSize: 12,
                    fontWeight: 'bold',
                    background: '#1a1a1a',
                    padding: '2px 8px',
                    borderRadius: 4,
                  }}
                >
                  iPhone SE (375x667)
                </div>
              </div>

              {/* 渲染方块 */}
              {tiles.map((tile) => {
                const left = tile.x * 0.5;
                const top = tile.y * 0.5;
                const isCurrentLayer = tile.layer === currentLayer;

                // 只显示当前层及以下的方块
                if (tile.layer > currentLayer) return null;

                return (
                  <div
                    key={tile.id}
                    style={{
                      position: 'absolute',
                      left,
                      top,
                      width: TILE_SIZE,
                      height: TILE_SIZE,
                      background: isCurrentLayer ? '#fff' : 'rgba(255,255,255,0.4)',
                      border: isCurrentLayer ? '2px solid #1890ff' : '1px dashed #666',
                      borderRadius: 4,
                      opacity: isCurrentLayer ? 1 : 0.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none',
                      zIndex: tile.layer,
                      boxShadow: isCurrentLayer ? '0 2px 4px rgba(0,0,0,0.3)' : 'none',
                    }}
                  >
                    <img
                      src={`/icons/${tile.type}.png`}
                      alt={tile.type}
                      style={{
                        width: '80%',
                        height: '80%',
                        objectFit: 'contain',
                        filter: isCurrentLayer ? 'none' : 'grayscale(80%)',
                      }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        fontSize: 10,
                        background: 'rgba(0,0,0,0.7)',
                        color: '#fff',
                        padding: '0 3px',
                        borderRadius: 2,
                      }}
                    >
                      {tile.layer}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </Col>
    </Row>
  );
};

export default LevelEditor;
