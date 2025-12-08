import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import PreviewScene from '../game/PreviewScene';
import EventBus from '../game/EventBus';

interface Tile {
  id: string;
  type: string;
  x: number;
  y: number;
  layer: number;
}

interface PhaserPreviewProps {
  tiles: Tile[];
  currentLayer?: number; // 当前选中的图层
  selectedType?: string; // 当前选中的素材类型
  showOnlyCurrentLayer?: boolean; // 是否仅显示当前图层
  onTilesChange?: (tiles: Tile[]) => void;
}

const PhaserPreview: React.FC<PhaserPreviewProps> = ({
  tiles,
  currentLayer = 1,
  selectedType = 'carrot',
  showOnlyCurrentLayer = false,
  onTilesChange,
}) => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tilesRef = useRef<Tile[]>(tiles); // 使用 ref 保存最新的 tiles
  const sceneReadyRef = useRef(false); // 标记场景是否已准备好

  // 同步 tiles 到 ref
  useEffect(() => {
    tilesRef.current = tiles;

    // 如果场景已准备好,立即同步数据
    if (sceneReadyRef.current) {
      EventBus.emit('tiles-updated', tiles);
    }
  }, [tiles]);

  // 监听 currentLayer 变化
  useEffect(() => {
    if (sceneReadyRef.current) {
      EventBus.emit('layer-changed', currentLayer);
    }
  }, [currentLayer]);

  // 监听 selectedType 变化
  useEffect(() => {
    if (sceneReadyRef.current) {
      EventBus.emit('selected-type-changed', selectedType);
    }
  }, [selectedType]);

  // 监听 showOnlyCurrentLayer 变化
  useEffect(() => {
    if (sceneReadyRef.current) {
      EventBus.emit('visibility-mode-changed', showOnlyCurrentLayer);
    }
  }, [showOnlyCurrentLayer]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Phaser 配置 - 使用与前端完全一致的画布尺寸
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: 750, // 与前端 GameScene 一致
      height: 1334, // 与前端 GameScene 一致
      scene: PreviewScene,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      backgroundColor: 0xc1f0c1, // 与前端 GameScene 一致
      physics: {
        default: 'arcade',
        arcade: {
          debug: false,
        },
      },
    };

    // 创建游戏实例
    gameRef.current = new Phaser.Game(config);

    // 监听场景准备好的事件
    EventBus.once('scene-ready', () => {
      sceneReadyRef.current = true;
      // 使用 ref 中的最新数据
      console.log('Phaser scene ready, syncing tiles:', tilesRef.current.length);
      EventBus.emit('tiles-updated', tilesRef.current);
    });

    // 监听 tiles 变化事件
    EventBus.on('tiles-changed', (newTiles: Tile[]) => {
      if (onTilesChange) {
        onTilesChange(newTiles);
      }
    });

    // 清理
    return () => {
      sceneReadyRef.current = false;
      EventBus.off('tiles-changed');
      EventBus.off('scene-ready');
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [onTilesChange]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f0f0f0',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    />
  );
};

export default PhaserPreview;
