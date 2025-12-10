import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Input,
  Form,
  Row,
  Col,
  message,
  Radio,
  Space,
  Tag,
  Switch,
  InputNumber,
} from 'antd';
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
  const [showOnlyCurrentLayer, setShowOnlyCurrentLayer] = useState(false);
  const [status, setStatus] = useState<string>('draft');

  useEffect(() => {
    if (id && id !== 'new') {
      fetchLevel(id);
    } else {
      form.setFieldsValue({
        levelName: '', // 新建时默认为空，可自行填写关卡名称
        displayOrder: 1,
      });
    }
  }, [id]);

  const fetchLevel = async (id: string) => {
    try {
      const level = await getLevel(id);
      form.setFieldsValue({
        levelName: level.levelName,
        displayOrder: level.sortOrder || 1,
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
        levelName: values.levelName,
        sortOrder: values.displayOrder,
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
      if (!id || id === 'new') {
        message.error('请先保存关卡');
        return;
      }
      // 先保存
      await handleSave();
      // 再切换发布状态
      await togglePublish(id);
      message.success(`已${status === 'published' ? '下架' : '发布'}`);
      fetchLevel(id);
    } catch (error) {
      message.error('操作失败');
    }
  };

  // 统计各图层的方块数量
  const layerStats = tiles.reduce((acc: Record<number, number>, tile) => {
    acc[tile.layer] = (acc[tile.layer] || 0) + 1;
    return acc;
  }, {});

  // 动态生成图层列表
  const usedLayers = [...new Set(tiles.map((t) => t.layer))].sort((a, b) => a - b);
  const maxLayer = usedLayers.length > 0 ? Math.max(...usedLayers) : 0;
  const availableLayers = usedLayers.length > 0 ? [...usedLayers, maxLayer + 1] : [1, 2, 3];

  return (
    <Row gutter={24} style={{ height: 'calc(100vh - 150px)' }}>
      {/* 左侧控制面板 - 40% */}
      <Col span={10} style={{ height: '100%', overflowY: 'auto' }}>
        <Card title="关卡设置">
          <Form form={form} layout="vertical">
            <Form.Item name="levelName" label="关卡名称" tooltip="可选，如'第一关'、'新手教程'等">
              <Input placeholder="输入关卡名称（可选）" />
            </Form.Item>
            <Form.Item
              name="displayOrder"
              label="关卡序号"
              tooltip="用于控制关卡在列表中的显示顺序，数字越小越靠前"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} max={999} placeholder="输入关卡序号" style={{ width: '100%' }} />
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
                {availableLayers.map((l) => (
                  <Radio.Button key={l} value={l}>
                    图层 {l} {layerStats[l] ? `(${layerStats[l]}个)` : ''}
                  </Radio.Button>
                ))}
              </Space>
            </Radio.Group>

            <div style={{ marginTop: 12 }}>
              <Switch
                checked={showOnlyCurrentLayer}
                onChange={setShowOnlyCurrentLayer}
                checkedChildren="仅显示当前层"
                unCheckedChildren="显示所有层"
              />
              <span style={{ marginLeft: 12, fontSize: 12, color: '#666' }}>
                {showOnlyCurrentLayer ? '其他图层已隐藏' : '非选中图层半透明显示'}
              </span>
            </div>
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
            <h4>操作说明</h4>
            <p style={{ fontSize: 12, color: '#666' }}>
              • <strong>左键点击</strong>预览空白处添加方块
              <br />• <strong>右键点击</strong>已有方块将其删除
              <br />
              • 方块将添加到当前选中的图层
              <br />• 当前图层: {currentLayer} | 总方块数: {tiles.length}
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
          title={`实时预览 (当前图层: ${currentLayer})`}
          bodyStyle={{
            padding: 20,
            height: 'calc(100% - 57px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          style={{ height: '100%' }}
        >
          <PhaserPreview
            tiles={tiles}
            currentLayer={currentLayer}
            selectedType={selectedType}
            showOnlyCurrentLayer={showOnlyCurrentLayer}
            onTilesChange={setTiles}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default LevelEditor;
