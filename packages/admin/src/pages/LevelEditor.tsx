import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Form, Slider, Row, Col, message, Radio, Space } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { createLevel, getLevel } from '../services/api';

const TILE_SIZE = 40; // 编辑器缩放 (游戏尺寸 80 的 0.5 倍)
const GAME_TILE_SIZE = 80;
// 游戏画布大约是 750x1334 (移动端) 或类似尺寸。
// 为编辑器定义一个足够大的画布。
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 1000;

const TILE_TYPES = [
    'carrot', 'wheat', 'wood', 'grass', 'stone', 'coin', 'shovel',
    'corn', 'milk', 'egg', 'wool', 'apple', 'pumpkin', 'flower'
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
    // const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (id && id !== 'new') {
            fetchLevel(id);
        } else {
            form.setFieldsValue({
                levelId: 'level-new',
                difficulty: 1
            });
        }
    }, [id]);

    const fetchLevel = async (levelId: string) => {
        // setLoading(true);
        try {
            const level = await getLevel(levelId);
            form.setFieldsValue({
                levelId: level.levelId,
                difficulty: level.difficulty
            });
            setTiles(level.data.tiles || []);
        } catch (error) {
            message.error('加载关卡失败');
        } finally {
            // setLoading(false);
        }
    };

    const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // Convert Click (Editor Canvas Coords) -> Game Coords
        // Editor Scale = 0.5
        // Editor Center (400, 500) corresponds to Game Center (375, 480)
        // But wait, the previous logic was simpler. Let's stick to relative offsets.
        // Let's assume the canvas simply displays the tiles.
        // We need to snap to a grid.

        // Grid Snap in Editor Coords
        // const col = Math.floor(clickX / TILE_SIZE);
        // const row = Math.floor(clickY / TILE_SIZE);

        // Convert to Game Coords
        // Game X = (EditorX - EditorCenterX) * 2 + GameCenterX
        // Let's try to align with the game's coordinate system more directly.
        // Game uses absolute coordinates.
        // Let's say we just map 1:1 with scale.
        // Game X = clickX * 2
        // Game Y = clickY * 2
        // But we need to handle the "center" alignment if the game does that.
        // Actually, the game code uses `centerX` and `centerY` to generate tiles.
        // If we want to edit existing levels, we should respect their coordinates.

        // Let's use the click position to find a "slot"
        // We can just save the exact coordinates, snapped to half-tile (40 in game, 20 in editor)

        const gameX = (clickX / TILE_SIZE) * GAME_TILE_SIZE;
        const gameY = (clickY / TILE_SIZE) * GAME_TILE_SIZE;

        // Snap to nearest 40 (half tile)
        const snappedX = Math.round(gameX / 40) * 40;
        const snappedY = Math.round(gameY / 40) * 40;

        // Check overlap
        const existingIndex = tiles.findIndex(t =>
            Math.abs(t.x - snappedX) < 20 &&
            Math.abs(t.y - snappedY) < 20 &&
            t.layer === currentLayer
        );

        if (existingIndex >= 0) {
            const newTiles = [...tiles];
            newTiles.splice(existingIndex, 1);
            setTiles(newTiles);
        } else {
            const newTile: Tile = {
                id: `editor-${Date.now()}`,
                type: selectedType,
                x: snappedX,
                y: snappedY,
                layer: currentLayer
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
                data: {
                    tiles: tiles,
                    gridSize: { cols: 8, rows: 10 } // 动态?
                }
            };

            await createLevel(levelData);
            message.success('关卡保存成功');
            navigate('/levels');
        } catch (error) {
            message.error('保存失败');
        }
    };

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

                    <div style={{ marginTop: 20 }}>
                        <h4>图层控制 (Layer)</h4>
                        <Radio.Group value={currentLayer} onChange={e => setCurrentLayer(e.target.value)} buttonStyle="solid">
                            <Space wrap>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(l => (
                                    <Radio.Button key={l} value={l}>{l}</Radio.Button>
                                ))}
                            </Space>
                        </Radio.Group>
                    </div>

                    <div style={{ marginTop: 20 }}>
                        <h4>素材库</h4>
                        <Space wrap>
                            {TILE_TYPES.map(type => (
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
                                        overflow: 'hidden'
                                    }}
                                >
                                    <img src={`/icons/${type}.png`} alt={type} style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
                                </div>
                            ))}
                        </Space>
                    </div>

                    <Button type="primary" block style={{ marginTop: 20 }} onClick={handleSave}>
                        保存关卡
                    </Button>
                </Card>
            </Col>

            <Col span={18} style={{ height: '100%' }}>
                <Card
                    title={`编辑器画布 (当前图层: ${currentLayer})`}
                    bodyStyle={{ padding: 0, height: '100%', overflow: 'auto', background: '#333' }}
                    style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                >
                    <div style={{ padding: 20, minWidth: CANVAS_WIDTH + 40, minHeight: CANVAS_HEIGHT + 40, display: 'flex', justifyContent: 'center' }}>
                        <div
                            style={{
                                width: CANVAS_WIDTH,
                                height: CANVAS_HEIGHT,
                                background: '#fff',
                                position: 'relative',
                                boxShadow: '0 0 20px rgba(0,0,0,0.5)'
                            }}
                            onClick={handleCanvasClick}
                        >
                            {/* 网格线 */}
                            {Array.from({ length: CANVAS_WIDTH / TILE_SIZE }).map((_, i) => (
                                <div key={`v-${i}`} style={{ position: 'absolute', left: i * TILE_SIZE, top: 0, bottom: 0, width: 1, background: '#f0f0f0' }} />
                            ))}
                            {Array.from({ length: CANVAS_HEIGHT / TILE_SIZE }).map((_, i) => (
                                <div key={`h-${i}`} style={{ position: 'absolute', top: i * TILE_SIZE, left: 0, right: 0, height: 1, background: '#f0f0f0' }} />
                            ))}

                            {/* 中心标记 */}
                            <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, background: 'red', opacity: 0.3 }} />
                            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 2, background: 'red', opacity: 0.3 }} />

                            {/* 渲染方块 */}
                            {tiles.map(tile => {
                                // 映射游戏坐标到编辑器坐标
                                // 我们现在使用直接缩放的方法。
                                // 编辑器 X = 游戏 X * 0.5
                                // 编辑器 Y = 游戏 Y * 0.5
                                const left = tile.x * 0.5;
                                const top = tile.y * 0.5;

                                const isCurrentLayer = tile.layer === currentLayer;

                                if (tile.layer > currentLayer) return null; // 隐藏上层图层

                                return (
                                    <div
                                        key={tile.id}
                                        style={{
                                            position: 'absolute',
                                            left,
                                            top,
                                            width: TILE_SIZE,
                                            height: TILE_SIZE,
                                            background: isCurrentLayer ? '#fff' : 'rgba(255,255,255,0.5)',
                                            border: isCurrentLayer ? '2px solid #1890ff' : '1px dashed #999',
                                            borderRadius: 4,
                                            opacity: isCurrentLayer ? 1 : 0.6,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            pointerEvents: 'none',
                                            zIndex: tile.layer,
                                            boxShadow: isCurrentLayer ? '0 2px 4px rgba(0,0,0,0.2)' : 'none'
                                        }}
                                    >
                                        <img
                                            src={`/icons/${tile.type}.png`}
                                            alt={tile.type}
                                            style={{
                                                width: '80%',
                                                height: '80%',
                                                objectFit: 'contain',
                                                filter: isCurrentLayer ? 'none' : 'grayscale(100%)'
                                            }}
                                        />
                                        <span style={{
                                            position: 'absolute',
                                            bottom: 0,
                                            right: 0,
                                            fontSize: 10,
                                            background: 'rgba(0,0,0,0.5)',
                                            color: '#fff',
                                            padding: '0 2px',
                                            borderRadius: 2
                                        }}>
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
