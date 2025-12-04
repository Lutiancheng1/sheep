import Phaser from 'phaser';
import EventBus from './EventBus';

interface Tile {
  id: string;
  type: string;
  x: number;
  y: number;
  layer: number;
}

// PreviewScene - 简化版的 GameScene，仅用于预览
export default class PreviewScene extends Phaser.Scene {
  private tiles: Tile[] = [];
  private tileSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private slots: Phaser.GameObjects.Container[] = [];
  private readonly TILE_SIZE = 80;
  private readonly SLOT_SIZE = 60;
  private readonly MAX_SLOTS = 7;

  constructor() {
    super({ key: 'PreviewScene' });
  }

  preload() {
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
    // 设置背景色
    this.cameras.main.setBackgroundColor('#c9e4ca');

    // 初始化槽位
    this.createSlots();

    // 监听 tiles 数据更新
    EventBus.on('tiles-updated', (newTiles: Tile[]) => {
      this.tiles = newTiles;
      this.renderTiles();
    });

    // 通知 React 场景已准备好
    EventBus.emit('scene-ready');
  }

  private createSlots() {
    const slotY = 600;
    const startX = 187.5 - ((this.MAX_SLOTS - 1) * (this.SLOT_SIZE + 10)) / 2;

    for (let i = 0; i < this.MAX_SLOTS; i++) {
      const slotX = startX + i * (this.SLOT_SIZE + 10);

      // 创建槽位背景
      const slotBg = this.add.rectangle(slotX, slotY, this.SLOT_SIZE, this.SLOT_SIZE, 0x8b6f47);
      slotBg.setStrokeStyle(3, 0x5d4a2f);

      const slotContainer = this.add.container(slotX, slotY);
      this.slots.push(slotContainer);
    }
  }

  private renderTiles() {
    // 清除所有现有方块
    this.tileSprites.forEach((sprite) => sprite.destroy());
    this.tileSprites.clear();

    // 按图层排序（从低到高）
    const sortedTiles = [...this.tiles].sort((a, b) => a.layer - b.layer);

    // 渲染所有方块
    sortedTiles.forEach((tile) => {
      this.createTileSprite(tile);
    });
  }

  private createTileSprite(tile: Tile) {
    const container = this.add.container(tile.x, tile.y);

    // 背景
    const bg = this.add.rectangle(0, 0, this.TILE_SIZE, this.TILE_SIZE, 0xfffaf0);
    bg.setStrokeStyle(4, 0x2d5016);
    container.add(bg);

    // 图标
    if (this.textures.exists(tile.type)) {
      const icon = this.add.image(0, 0, tile.type);
      icon.setDisplaySize(50, 50);
      container.add(icon);
    }

    // 阴影效果
    container.setDepth(tile.layer);

    // 添加交互
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerdown', () => this.handleTileClick(tile));

    this.tileSprites.set(tile.id, container);
  }

  private handleTileClick(tile: Tile) {
    // 检查是否被遮挡
    if (this.isBlocked(tile)) {
      return;
    }

    // 将方块移入槽位（简化版逻辑）
    const emptySlotIndex = this.slots.findIndex((slot) => slot.list.length === 0);
    if (emptySlotIndex === -1) {
      return; // 槽位已满
    }

    // 从场上移除
    const sprite = this.tileSprites.get(tile.id);
    if (sprite) {
      sprite.destroy();
      this.tileSprites.delete(tile.id);
    }

    // 移除 tile 数据
    const tileIndex = this.tiles.findIndex((t) => t.id === tile.id);
    if (tileIndex !== -1) {
      this.tiles.splice(tileIndex, 1);
    }

    // 添加到槽位
    const slotX = this.slots[emptySlotIndex].x;
    const slotY = this.slots[emptySlotIndex].y;

    const slotTile = this.add.container(slotX, slotY);
    const slotBg = this.add.rectangle(0, 0, this.SLOT_SIZE - 10, this.SLOT_SIZE - 10, 0xfffaf0);
    slotBg.setStrokeStyle(2, 0x2d5016);
    const slotIcon = this.add.image(0, 0, tile.type);
    slotIcon.setDisplaySize(40, 40);
    slotTile.add([slotBg, slotIcon]);

    this.slots[emptySlotIndex].add(slotTile);

    // 检查三消
    this.checkMatch();

    // 通知 React 更新
    EventBus.emit('tiles-changed', this.tiles);
  }

  private isBlocked(tile: Tile): boolean {
    for (const other of this.tiles) {
      if (other.id === tile.id) continue;

      // 检查是否在上层并重叠
      if (other.layer > tile.layer) {
        const dx = Math.abs(other.x - tile.x);
        const dy = Math.abs(other.y - tile.y);
        if (dx < this.TILE_SIZE && dy < this.TILE_SIZE) {
          return true;
        }
      }
    }
    return false;
  }

  private checkMatch() {
    // 统计槽位中的方块类型

    this.slots.forEach((slot) => {
      if (slot.list.length > 0) {
        // 这里简化处理，实际应该从 slotTile 中提取 type
        // 由于我们没有存储 type，这里只做演示
      }
    });

    // 简化版：如果任意 3 个槽位有内容就清空（演示用）
    const filledSlots = this.slots.filter((slot) => slot.list.length > 0);
    if (filledSlots.length >= 3) {
      // 清空前3个槽位
      for (let i = 0; i < 3 && i < filledSlots.length; i++) {
        filledSlots[i].removeAll(true);
      }
    }
  }

  shutdown() {
    EventBus.off('tiles-updated');
  }
}
