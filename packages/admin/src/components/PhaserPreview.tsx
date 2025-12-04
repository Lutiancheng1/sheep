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
  onTilesChange?: (tiles: Tile[]) => void;
}

const PhaserPreview: React.FC<PhaserPreviewProps> = ({ tiles, onTilesChange }) => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tilesRef = useRef<Tile[]>(tiles); // 使用 ref 保存最新的 tiles
  const sceneReadyRef = useRef(false); // 标记场景是否已准备好

  // 同步 tiles 到 ref
  useEffect(() => {
    tilesRef.current = tiles;

    // 如果场景已准备好，立即同步数据
    if (sceneReadyRef.current) {
      EventBus.emit('tiles-updated', tiles);
    }
  }, [tiles]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Phaser 配置
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: 375,
      height: 667,
      scene: PreviewScene,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      backgroundColor: '#c9e4ca',
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
