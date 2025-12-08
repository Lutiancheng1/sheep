import Phaser from 'phaser';
import EventBus from './EventBus';

interface Tile {
  id: string;
  type: string;
  x: number;
  y: number;
  layer: number;
}

// PreviewScene - 简化版的 GameScene,用于预览和编辑 (支持点击添加/删除方块)
export default class PreviewScene extends Phaser.Scene {
  private tiles: Tile[] = [];
  private tileSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private readonly TILE_SIZE = 80;
  private currentLayer: number = 1; // 当前选中的图层
  private selectedType: string = 'carrot'; // 当前选中的素材类型
  private showOnlyCurrentLayer: boolean = false; // 是否仅显示当前图层
  private isAssetsReady = false; // 资源加载完成标志

  constructor() {
    super({ key: 'PreviewScene' });
  }

  preload() {
    // 监听加载完成事件
    this.load.on('complete', () => {
      console.log('PreviewScene: Assets loaded successfully');
      this.isAssetsReady = true;
    });

    // 预加载所有农场图标
    const types = [
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

    types.forEach((type) => {
      this.load.image(type, `/icons/${type}.png`);
    });
  }

  create() {
    // 等待资源加载完成再初始化场景
    if (!this.isAssetsReady) {
      console.log('PreviewScene: Waiting for assets to load...');
      this.load.once('complete', () => {
        this.initScene();
      });
      this.load.start(); // 触发加载
    } else {
      this.initScene();
    }
  }

  private initScene() {
    console.log('PreviewScene: Initializing scene');

    // 设置背景色 (与前端 GameScene 一致)
    this.cameras.main.setBackgroundColor(0xc1f0c1);

    // 左键点击 - 添加方块
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.button === 0) {
        // 左键
        this.handleCanvasClick(pointer.worldX, pointer.worldY);
      } else if (pointer.button === 2) {
        // 右键 - 删除方块
        this.handleDeleteClick(pointer.worldX, pointer.worldY);
      }
    });

    // 禁用右键菜单
    this.input.mouse?.disableContextMenu();

    // 监听 tiles 数据更新
    EventBus.on('tiles-updated', (newTiles: Tile[]) => {
      // 使用 nextTick 确保场景完全准备好
      this.time.delayedCall(10, () => {
        this.tiles = newTiles;
        this.renderTiles();
      });
    });

    // 监听当前图层变化
    EventBus.on('layer-changed', (layer: number) => {
      this.currentLayer = layer;
      this.updateLayersVisibility();
    });

    // 监听选中素材类型变化
    EventBus.on('selected-type-changed', (type: string) => {
      this.selectedType = type;
    });

    // 监听图层可见性模式变化
    EventBus.on('visibility-mode-changed', (showOnly: boolean) => {
      this.showOnlyCurrentLayer = showOnly;
      this.updateLayersVisibility();
    });

    // 通知 React 场景已准备好
    EventBus.emit('scene-ready');
  }

  private handleCanvasClick(x: number, y: number) {
    // 左键仅用于添加方块
    const newTile: Tile = {
      id: `tile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: this.selectedType,
      x: Math.round(x / 10) * 10, // 对齐到10px网格
      y: Math.round(y / 10) * 10,
      layer: this.currentLayer,
    };

    console.log('Adding tile:', newTile);
    this.tiles.push(newTile);
    EventBus.emit('tiles-changed', this.tiles);
    this.renderTiles();
  }

  private handleDeleteClick(x: number, y: number) {
    // 右键仅用于删除方块
    const clickedTile = this.findTileAt(x, y);

    if (clickedTile) {
      console.log('Deleting tile:', clickedTile.id);
      this.tiles = this.tiles.filter((t) => t.id !== clickedTile.id);
      EventBus.emit('tiles-changed', this.tiles);
      this.renderTiles();
    }
  }

  private findTileAt(x: number, y: number): Tile | null {
    // 仅查找当前图层的方块(避免穿透)
    const currentLayerTiles = this.tiles.filter((t) => t.layer === this.currentLayer);

    for (const tile of currentLayerTiles) {
      const dx = Math.abs(tile.x - x);
      const dy = Math.abs(tile.y - y);
      const halfSize = this.TILE_SIZE / 2;

      if (dx <= halfSize && dy <= halfSize) {
        return tile;
      }
    }

    return null;
  }

  private renderTiles() {
    // 确保场景已完全初始化
    if (!this.add || !this.textures || !this.scene || !this.scene.isActive()) {
      console.warn('PreviewScene: Scene not ready, skipping render');
      return;
    }

    try {
      // 清除所有现有方块
      this.tileSprites.forEach((sprite) => {
        if (sprite && !sprite.scene) {
          // 跳过已销毁的精灵
          return;
        }
        sprite.destroy();
      });
      this.tileSprites.clear();

      // 按图层排序(从低到高)
      const sortedTiles = [...this.tiles].sort((a, b) => a.layer - b.layer);

      console.log(`PreviewScene: Rendering ${sortedTiles.length} tiles`);

      // 渲染所有方块
      sortedTiles.forEach((tile) => {
        this.createTileSprite(tile);
      });
    } catch (error) {
      console.error('PreviewScene: Error rendering tiles:', error);
    }
  }

  private createTileSprite(tile: Tile) {
    // 严格的场景初始化检查
    if (!this || !this.add || !this.textures || !this.scene) {
      console.error('PreviewScene: Scene not initialized (this.add/textures/scene null)');
      return;
    }

    if (!this.scene.isActive()) {
      console.error('PreviewScene: Scene not active');
      return;
    }

    try {
      const container = this.add.container(tile.x, tile.y);

      // 背景
      const bg = this.add.rectangle(0, 0, this.TILE_SIZE, this.TILE_SIZE, 0xfffaf0);
      bg.setStrokeStyle(4, 0x2d5016);
      container.add(bg);

      // 图标 - 添加纹理存在性检查
      if (this.textures.exists(tile.type)) {
        const icon = this.add.image(0, 0, tile.type);
        icon.setDisplaySize(this.TILE_SIZE * 0.625, this.TILE_SIZE * 0.625); // 50/80 = 0.625
        container.add(icon);
      } else {
        console.warn(`PreviewScene: Texture "${tile.type}" not found`);
        // 显示占位符文字
        const placeholder = this.add.text(0, 0, '?', {
          fontSize: '32px',
          color: '#2d5016',
        });
        placeholder.setOrigin(0.5);
        container.add(placeholder);
      }

      // 设置深度
      container.setDepth(tile.layer * 100); // 与前端一致的深度计算

      // 根据可见性模式设置显示状态
      if (this.showOnlyCurrentLayer) {
        container.setVisible(tile.layer === this.currentLayer);
      } else {
        container.setVisible(true);
        // 非选中图层更透明(0.1)
        const alpha = tile.layer === this.currentLayer ? 1.0 : 0.1;
        container.setAlpha(alpha);
      }

      // 存储到 Map,用于后续更新透明度
      this.tileSprites.set(tile.id, container);
    } catch (error) {
      console.error(`PreviewScene: Error creating tile sprite for ${tile.id}:`, error);
    }
  }

  private updateLayersVisibility() {
    // 更新所有方块的可见性和透明度
    this.tiles.forEach((tile) => {
      const sprite = this.tileSprites.get(tile.id);
      if (sprite) {
        if (this.showOnlyCurrentLayer) {
          // 仅显示当前图层模式
          sprite.setVisible(tile.layer === this.currentLayer);
          // 确保可见的方块完全不透明
          if (tile.layer === this.currentLayer) {
            sprite.setAlpha(1.0);
          }
        } else {
          // 显示所有图层模式
          sprite.setVisible(true);
          const alpha = tile.layer === this.currentLayer ? 1.0 : 0.1;
          sprite.setAlpha(alpha);
        }
      }
    });
  }

  shutdown() {
    EventBus.off('tiles-updated');
    EventBus.off('layer-changed');
    EventBus.off('selected-type-changed');
    EventBus.off('visibility-mode-changed');
  }
}
