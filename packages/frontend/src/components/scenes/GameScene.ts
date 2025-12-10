// 游戏主场景 - 农场主题版
import * as Phaser from 'phaser';
import { api } from '../../lib/api';
import { Analytics } from '../../lib/analytics';

interface TilePosition {
  x: number;
  y: number;
  z: number;
}

interface TileData {
  id: string;
  type: string;
  position: TilePosition;
  sprite?: Phaser.GameObjects.Container;
  isClickable: boolean;
}

export default class GameScene extends Phaser.Scene {
  private tiles: Map<string, TileData> = new Map();
  private slots: TileData[] = [];
  private maxSlots = 7;
  private slotY = 1100;
  private scoreText?: Phaser.GameObjects.Text;
  private infoText?: Phaser.GameObjects.Text; // 关卡信息文本(日期+关卡号)
  private score = 0;
  private tileSize = 80;
  private itemCounts = { remove: 0, undo: 0, shuffle: 0 };
  private isMuted = false; // BGM静音状态
  private soundButton?: Phaser.GameObjects.Container; // 声音按钮容器

  // 农场主题配色
  private colors = {
    bg: 0xc1f0c1, // 浅绿色背景
    tileBg: 0xfdf5e6, // 米白色方块背景
    tileBorder: 0x2e8b57, // 深绿色边框
    tileBorderBlocked: 0x8fbc8f, // 被遮挡时的边框颜色
    slotBg: 0x8b4513, // 木质槽位背景
    slotBorder: 0xdeb887, // 槽位边框
  };

  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    // 加载图标素材
    this.load.image('carrot', '/icons/carrot.png');
    this.load.image('wheat', '/icons/wheat.png');
    this.load.image('wood', '/icons/wood.png');
    this.load.image('grass', '/icons/grass.png');
    this.load.image('stone', '/icons/stone.png');
    this.load.image('coin', '/icons/coin.png');
    this.load.image('shovel', '/icons/shovel.png');
    this.load.image('corn', '/icons/corn.png');
    this.load.image('milk', '/icons/milk.png');
    this.load.image('egg', '/icons/egg.png');
    this.load.image('wool', '/icons/wool.png');
    this.load.image('apple', '/icons/apple.png');
    this.load.image('pumpkin', '/icons/pumpkin.png');
    this.load.image('flower', '/icons/flower.png');

    // 加载设置图标(SVG格式)
    this.load.svg('settings', '/icons/settings.svg', { scale: 0.2 }); // 提高分辨率避免模糊

    // 加载声音图标(SVG格式)
    this.load.svg('sound-on', '/icons/sound-on.svg', { scale: 0.5 }); // 提高分辨率
    this.load.svg('sound-off', '/icons/sound-off.svg', { scale: 0.5 });

    // 加载背景音乐
    this.load.audio('bgm', '/assets/bgm.mp3');
  }

  private currentLevelUuid: string = ''; // UUID
  private currentLevelNumber: number = 1; // 当前关卡在排序后的序号

  init(data: { id: string }) {
    this.currentLevelUuid = data.id || '';

    // 异步获取所有关卡并计算当前关卡序号
    // 优化: 使用 excludeData=true 只获取列表元数据,避免下载所有关卡的完整 tile 数据
    api
      .getLevels(true) // excludeData=true
      .then((response) => {
        const levels = Array.isArray(response) ? response : [];

        // 按sortOrder排序
        levels.sort((a: any, b: any) => {
          const sortA = typeof a.sortOrder === 'number' ? a.sortOrder : 9999;
          const sortB = typeof b.sortOrder === 'number' ? b.sortOrder : 9999;
          return sortA - sortB;
        });

        // 找到当前关卡的位置
        const currentIndex = levels.findIndex((l: any) => l.id === this.currentLevelUuid);
        this.currentLevelNumber = currentIndex !== -1 ? currentIndex + 1 : 1;

        // 更新显示(如果infoText已经创建)
        if (this.infoText) {
          const dateStr = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
          this.infoText.setText(`${dateStr}  第${this.currentLevelNumber}关`);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch levels for number display:', err);
        this.currentLevelNumber = 1; // 失败时默认为1
      });

    this.events.on('shutdown', () => {
      Analytics.endSession();
      window.removeEventListener('DISABLE_INPUT', this.disableInput);
      window.removeEventListener('ENABLE_INPUT', this.enableInput);
    });

    // 监听输入控制事件
    window.addEventListener('DISABLE_INPUT', this.disableInput);
    window.addEventListener('ENABLE_INPUT', this.enableInput);
  }

  private disableInput = () => {
    this.input.enabled = false;
  };

  private enableInput = () => {
    this.input.enabled = true;
  };

  private isPaused = false;

  create() {
    // 0. 自动续签 Token (Sliding Expiration)
    api.refreshToken().catch((err) => console.warn('Token refresh failed:', err));

    // 1. 从localStorage读取静音状态
    const savedMuteState = localStorage.getItem('bgm_muted');
    this.isMuted = savedMuteState === 'true';

    // 2. 播放背景音乐(如果未静音)
    if (!this.isMuted) {
      if (!this.sound.get('bgm')) {
        this.sound.play('bgm', { loop: true, volume: 0.5 });
      } else if (!this.sound.get('bgm').isPlaying) {
        this.sound.get('bgm').play({ loop: true, volume: 0.5 });
      }
    }

    // 0. 重置游戏状态
    this.tiles.clear();
    this.slots = [];
    this.score = 0;
    this.isPaused = false;

    // 1. 设置背景色
    this.cameras.main.setBackgroundColor(this.colors.bg);

    // 优化：预先生成方块背景纹理 (极大提升渲染性能)
    // 修复：确保纹理居中，避免错位
    // 修复：High-DPI (Retina) 支持 - 生成高分辨率纹理
    if (!this.textures.exists('tile-base')) {
      const dpr = window.devicePixelRatio || 1;
      const padding = 16;
      const textureSize = this.tileSize + padding;
      const margin = padding / 2;

      // 缩放绘图参数
      const sTileSize = this.tileSize * dpr;
      const sMargin = margin * dpr;
      const sRadius = 12 * dpr;
      const sLineWidth = 4 * dpr;
      const sTextureSize = textureSize * dpr;
      const sShadowOffset = 6 * dpr;

      const graphics = this.make.graphics({ x: 0, y: 0 }, false);

      // 阴影
      graphics.fillStyle(0x000000, 0.2);
      graphics.fillRoundedRect(
        sMargin + sShadowOffset,
        sMargin + sShadowOffset,
        sTileSize,
        sTileSize,
        sRadius,
      );

      // 背景
      graphics.fillStyle(this.colors.tileBg, 1);
      graphics.fillRoundedRect(sMargin, sMargin, sTileSize, sTileSize, sRadius);

      // 边框 (默认状态)
      graphics.lineStyle(sLineWidth, this.colors.tileBorder, 1);
      graphics.strokeRoundedRect(sMargin, sMargin, sTileSize, sTileSize, sRadius);

      graphics.generateTexture('tile-base', sTextureSize, sTextureSize);

      // 生成被遮挡的纹理
      graphics.clear();
      // 阴影
      graphics.fillStyle(0x000000, 0.2);
      graphics.fillRoundedRect(
        sMargin + sShadowOffset,
        sMargin + sShadowOffset,
        sTileSize,
        sTileSize,
        sRadius,
      );

      // 背景 (变暗)
      graphics.fillStyle(0x000000, 0.3);
      graphics.fillRoundedRect(sMargin, sMargin, sTileSize, sTileSize, sRadius);

      // 边框
      graphics.lineStyle(sLineWidth, this.colors.tileBorderBlocked, 1);
      graphics.strokeRoundedRect(sMargin, sMargin, sTileSize, sTileSize, sRadius);

      graphics.generateTexture('tile-blocked', sTextureSize, sTextureSize);

      graphics.destroy();
    }

    this.createTopUI();
    this.drawSlotArea();

    // 获取道具状态
    api
      .getItemStatus()
      .then((data) => {
        if (data && data.usage && data.limits) {
          this.itemCounts = {
            remove: (data.limits.remove || 2) - (data.usage.remove || 0),
            undo: (data.limits.undo || 2) - (data.usage.undo || 0),
            shuffle: (data.limits.shuffle || 2) - (data.usage.shuffle || 0),
          };
          this.createPropButtons();
        } else {
          // 使用默认值
          this.itemCounts = { remove: 2, undo: 2, shuffle: 2 };
          this.createPropButtons();
        }
      })
      .catch((err) => {
        console.error('Failed to fetch item status:', err);
        // 使用默认值而不是 0
        this.itemCounts = { remove: 2, undo: 2, shuffle: 2 };
        this.createPropButtons();
      });

    this.loadLevel(this.currentLevelUuid);
  }

  createTopUI() {
    // 设置按钮 (左上角)
    const settingsBtn = this.add.container(60, 100);
    const settingsBg = this.add.graphics();
    settingsBg.fillStyle(0x0099ff, 1); // 蓝色背景
    settingsBg.fillRoundedRect(-30, -30, 60, 60, 10);
    settingsBg.lineStyle(4, 0x000000, 1);
    settingsBg.strokeRoundedRect(-30, -30, 60, 60, 10);

    // 使用SVG齿轮图标
    const gear = this.add.image(0, 0, 'settings').setDisplaySize(40, 40).setOrigin(0.5);
    settingsBtn.add([settingsBg, gear]);

    // Fix: Use config object for setInteractive
    settingsBtn.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(-30, -30, 60, 60),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    });
    settingsBtn.on('pointerup', () => this.pauseGame());

    // 声音按钮 (设置按钮下方)
    this.createSoundButton();

    const infoContainer = this.add.container(375, 100);
    const infoBg = this.add.graphics();
    infoBg.fillStyle(0x000000, 1);
    // Widen the background to fit date + level
    infoBg.fillRoundedRect(-140, -25, 280, 50, 25);

    const dateStr = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
    this.infoText = this.add
      .text(0, 0, `${dateStr}  第${this.currentLevelNumber}关`, {
        fontSize: '24px',
        color: '#FFFFFF',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    infoContainer.add([infoBg, this.infoText]);

    // 分数 (右上角) - 简化显示
    this.scoreText = this.add
      .text(690, 80, `${this.score}`, {
        fontSize: '32px',
        color: '#2E8B57',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0.5);
  }

  createSoundButton() {
    // 声音按钮位于设置按钮正下方 (x:60, y:180)
    this.soundButton = this.add.container(60, 180);

    const bg = this.add.graphics();
    bg.fillStyle(0x0099ff, 1); // 蓝色背景(与设置按钮一致)
    bg.fillRoundedRect(-30, -30, 60, 60, 10);
    bg.lineStyle(4, 0x000000, 1);
    bg.strokeRoundedRect(-30, -30, 60, 60, 10);

    // 声音图标(使用SVG,根据当前状态显示)
    const iconTexture = this.isMuted ? 'sound-off' : 'sound-on';
    const icon = this.add
      .image(0, 0, iconTexture)
      .setDisplaySize(40, 40) // SVG图标大小
      .setOrigin(0.5);

    this.soundButton.add([bg, icon]);
    this.soundButton.setData('icon', icon); // 保存图标引用以便后续更新

    // 设置交互
    this.soundButton.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(-30, -30, 60, 60),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    });

    this.soundButton.on('pointerup', () => this.toggleSound());
  }

  toggleSound() {
    this.isMuted = !this.isMuted;

    // 保存到localStorage
    localStorage.setItem('bgm_muted', String(this.isMuted));

    // 更新图标(使用图片纹理)
    const icon = this.soundButton?.getData('icon') as Phaser.GameObjects.Image;
    if (icon) {
      const newTexture = this.isMuted ? 'sound-off' : 'sound-on';
      icon.setTexture(newTexture);
    }

    // 控制BGM播放
    const bgm = this.sound.get('bgm');
    if (bgm) {
      if (this.isMuted) {
        bgm.pause();
      } else {
        bgm.resume();
      }
    }
  }

  drawSlotArea() {
    // 槽位背景 - 木质纹理效果 (更接近原版)
    const slotBg = this.add.graphics();

    // 深褐色底板
    slotBg.fillStyle(0x8b4513, 1);
    slotBg.fillRoundedRect(20, this.slotY - 60, 710, 120, 10);

    // 浅色边框
    slotBg.lineStyle(6, 0xdeb887, 1);
    slotBg.strokeRoundedRect(20, this.slotY - 60, 710, 120, 10);

    // 装饰钉子
    slotBg.fillStyle(0x5c3317, 1);
    slotBg.fillCircle(40, this.slotY - 40, 5);
    slotBg.fillCircle(710, this.slotY - 40, 5);
    slotBg.fillCircle(40, this.slotY + 40, 5);
    slotBg.fillCircle(710, this.slotY + 40, 5);

    slotBg.setDepth(50);

    // 左右装饰栅栏 (更细致)
    this.drawFence(10, this.slotY - 110);
    this.drawFence(680, this.slotY - 110);
  }

  drawFence(x: number, y: number) {
    const fence = this.add.graphics();
    fence.fillStyle(0xdeb887, 1); // 浅木色
    fence.lineStyle(2, 0x8b4513, 1); // 深色描边

    // 竖桩
    fence.fillRoundedRect(x, y, 15, 100, 5);
    fence.strokeRoundedRect(x, y, 15, 100, 5);

    fence.fillRoundedRect(x + 40, y, 15, 100, 5);
    fence.strokeRoundedRect(x + 40, y, 15, 100, 5);

    // 横档
    fence.fillRoundedRect(x - 5, y + 25, 65, 12, 4);
    fence.strokeRoundedRect(x - 5, y + 25, 65, 12, 4);

    fence.fillRoundedRect(x - 5, y + 65, 65, 12, 4);
    fence.strokeRoundedRect(x - 5, y + 65, 65, 12, 4);

    fence.setDepth(49);
  }

  createPropButtons() {
    const startY = this.slotY + 120;
    const gap = 180;
    const startX = 375 - gap;

    // 移出道具
    this.createPropButton(startX, startY, '移出', '📤', () => this.usePropRemove());

    // 撤回道具
    this.createPropButton(375, startY, '撤回', '↩️', () => this.usePropUndo());

    // 洗牌道具
    this.createPropButton(375 + gap, startY, '洗牌', '🔀', () => this.usePropShuffle());
  }

  createPropButton(x: number, y: number, text: string, icon: string, callback: () => void) {
    const btn = this.add.container(x, y);

    // 蓝色背景
    const bg = this.add.graphics();
    bg.fillStyle(0x0099ff, 1);
    bg.fillRoundedRect(-60, -40, 120, 80, 16);
    bg.lineStyle(4, 0x000000, 1);
    bg.strokeRoundedRect(-60, -40, 120, 80, 16);

    // 图标
    const iconText = this.add.text(0, -10, icon, { fontSize: '40px' }).setOrigin(0.5);

    // 文字
    const label = this.add
      .text(0, 25, text, {
        fontSize: '20px',
        color: '#FFFFFF',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // 加号角标 -> 改为剩余次数
    const badge = this.add.graphics();
    badge.fillStyle(0x000000, 1);
    badge.fillCircle(50, -30, 15);

    // 获取对应类型的剩余次数
    let count = 0;
    if (text === '移出') count = this.itemCounts.remove;
    if (text === '撤回') count = this.itemCounts.undo;
    if (text === '洗牌') count = this.itemCounts.shuffle;

    const countText = this.add
      .text(50, -30, `${count}`, { fontSize: '20px', color: '#FFF' })
      .setOrigin(0.5);
    // 保存引用以便更新
    btn.setData('countText', countText);

    btn.add([bg, iconText, label, badge, countText]);
    btn.setSize(120, 80);
    // Fix: Use config object for setInteractive
    bg.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(-60, -40, 120, 80),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    });

    bg.on('pointerdown', () => {
      this.tweens.add({
        targets: btn,
        scale: 0.9,
        duration: 100,
        yoyo: true,
        onComplete: callback,
      });
    });
  }

  // 道具逻辑占位
  private holdingTiles: TileData[] = [];

  async usePropRemove() {
    if (this.itemCounts.remove <= 0) {
      this.cameras.main.shake(200, 0.005);
      // TODO: Show ad prompt
      return;
    }

    // 移出道具逻辑
    if (this.slots.length === 0) return;
    if (this.holdingTiles.length >= 3) {
      this.cameras.main.shake(200, 0.005);
      return; // 暂存区已满
    }

    try {
      const result = await api.useItem('remove');
      if (result && result.success) {
        this.itemCounts.remove = result.remaining;
        this.updatePropButtonText('移出', this.itemCounts.remove);
      } else {
        this.cameras.main.shake(200, 0.005);
        return;
      }
    } catch (e) {
      console.error('Failed to use item:', e);
      return;
    }

    // 从槽位移动最多3个方块到暂存区
    const count = Math.min(3, this.slots.length);
    const tilesToRemove = this.slots.splice(0, count); // 从槽位前端移除

    tilesToRemove.forEach((tile, index) => {
      this.holdingTiles.push(tile);

      // 计算暂存区位置 (居中显示在槽位上方)
      // 槽位Y坐标是 1100. 暂存区可以在 940.
      const holdX = 285 + (this.holdingTiles.length - 1) * 90;
      const holdY = this.slotY - 160;

      this.tweens.add({
        targets: tile.sprite,
        x: holdX,
        y: holdY,
        scale: 0.9,
        duration: 300,
        ease: 'Back.easeOut',
        onComplete: () => {
          // 重新绑定点击事件以移回槽位
          tile.sprite?.off('pointerdown');
          tile.sprite?.on('pointerdown', () => {
            if (!this.isPaused) this.handleHoldingTileClick(tile);
          });
        },
      });
    });

    this.rearrangeSlots();
  }

  handleHoldingTileClick(tile: TileData) {
    if (this.slots.length >= this.maxSlots) {
      this.cameras.main.shake(200, 0.01);
      return;
    }

    // 从暂存区移除
    const index = this.holdingTiles.findIndex((t) => t.id === tile.id);
    if (index > -1) {
      this.holdingTiles.splice(index, 1);
    }

    // 添加到槽位
    this.slots.push(tile);

    // 动画移动到槽位
    const slotX = 80 + (this.slots.length - 1) * 90;
    this.tweens.add({
      targets: tile.sprite,
      x: slotX,
      y: this.slotY,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.checkMatch();
      },
    });

    // 重新排列剩余暂存区方块
    this.rearrangeHoldingTiles();
  }

  rearrangeHoldingTiles() {
    this.holdingTiles.forEach((tile, index) => {
      const holdX = 285 + index * 90;
      const holdY = this.slotY - 160;

      this.tweens.add({
        targets: tile.sprite,
        x: holdX,
        y: holdY,
        duration: 250,
        ease: 'Back.easeOut',
      });
    });
  }

  async usePropUndo() {
    if (this.itemCounts.undo <= 0) {
      this.cameras.main.shake(200, 0.005);
      return;
    }

    // 检查是否有可撤回的方块（必须在API调用前检查）
    if (this.slots.length === 0) {
      this.cameras.main.shake(200, 0.005);
      return;
    }

    try {
      const result = await api.useItem('undo');
      if (result && result.success) {
        this.itemCounts.undo = result.remaining;
        this.updatePropButtonText('撤回', this.itemCounts.undo);
      } else {
        this.cameras.main.shake(200, 0.005);
        return;
      }
    } catch (e) {
      console.error('Failed to use item:', e);
      return;
    }

    // 获取槽位中最后一个方块
    const tile = this.slots.pop();
    if (!tile || !tile.sprite) return;

    // 移回棋盘 (随机位置在中心区域或原位?)
    // 为了简单起见，我们将其移动到中心区域的一个随机位置，并设置较高的 Z 轴
    const x = 375 + Phaser.Math.Between(-100, 100);
    const y = 400 + Phaser.Math.Between(-100, 100);

    // 找到最高的 Z 轴索引以确保它在最上层
    let maxZ = 0;
    this.tiles.forEach((t) => (maxZ = Math.max(maxZ, t.position.z)));
    tile.position = { x, y, z: maxZ + 1 };

    // 放回方块 Map
    this.tiles.set(tile.id, tile);

    // 动画移回
    this.tweens.add({
      targets: tile.sprite,
      x: x,
      y: y,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        tile.sprite?.setDepth(tile.position.z * 100);
        this.updateTileClickability();
      },
    });

    // 重新排列剩余槽位
    this.rearrangeSlots();
  }

  async usePropShuffle() {
    if (this.itemCounts.shuffle <= 0) {
      this.cameras.main.shake(200, 0.005);
      return;
    }

    if (this.tiles.size === 0) return;

    try {
      const result = await api.useItem('shuffle');
      if (result && result.success) {
        this.itemCounts.shuffle = result.remaining;
        this.updatePropButtonText('洗牌', this.itemCounts.shuffle);
      } else {
        this.cameras.main.shake(200, 0.005);
        return;
      }
    } catch (e) {
      console.error('Failed to use item:', e);
      return;
    }

    // 1. 收集场上所有类型的方块
    const types: string[] = [];
    this.tiles.forEach((tile) => types.push(tile.type));

    // 2. 打乱类型
    for (let i = types.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [types[i], types[j]] = [types[j], types[i]];
    }

    // 3. 重新分配类型给方块
    let i = 0;
    this.tiles.forEach((tile) => {
      tile.type = types[i++];
      // 更新精灵纹理
      const icon = tile.sprite?.getData('icon') as Phaser.GameObjects.Image;
      if (icon) {
        icon.setTexture(tile.type);
        icon.setDisplaySize(this.tileSize * 0.7, this.tileSize * 0.7);
      }
    });

    // 视觉反馈
    this.cameras.main.shake(200, 0.005);
  }

  pauseGame() {
    if (this.isPaused) return;
    this.isPaused = true;
    this.tweens.pauseAll();
    this.createPausePopup();
  }

  resumeGame() {
    this.isPaused = false;
    this.tweens.resumeAll();
  }

  createPausePopup() {
    const overlay = this.add.rectangle(375, 667, 750, 1334, 0x000000, 0.7);
    overlay.setDepth(3000);
    overlay.setInteractive();

    const panel = this.add.graphics();
    panel.fillStyle(0xfff5e6, 1);
    panel.fillRoundedRect(125, 380, 500, 550, 20);
    panel.lineStyle(8, 0x8b4513, 1);
    panel.strokeRoundedRect(125, 380, 500, 550, 20);
    panel.setDepth(3001);

    const title = this.add
      .text(375, 460, '游戏暂停', {
        fontSize: '56px',
        color: '#8B4513',
        fontStyle: 'bold',
        padding: { top: 10 },
      })
      .setOrigin(0.5)
      .setDepth(3002);

    const btnStart = 580;
    const btnGap = 110;

    this.createMenuButton(375, btnStart, '继续游戏', 0x2e8b57, () => {
      overlay.destroy();
      panel.destroy();
      title.destroy();
      this.children.list.filter((c) => c.name === 'pause_btn').forEach((c) => c.destroy());
      this.resumeGame();
    });

    this.createMenuButton(375, btnStart + btnGap, '重新开始', 0xe67e22, () => {
      this.scene.restart({ id: this.currentLevelUuid });
    });

    this.createMenuButton(375, btnStart + btnGap * 2, '退出关卡', 0xc0392b, () => {
      this.scene.start('LevelSelectScene');
    });
  }

  createMenuButton(x: number, y: number, text: string, color: number, callback: () => void) {
    const btn = this.add.container(x, y);
    btn.name = 'pause_btn';

    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-120, -35, 240, 70, 16);

    const label = this.add
      .text(0, 2, text, {
        fontSize: '28px',
        color: '#ffffff',
        fontStyle: 'bold',
        padding: { top: 4, bottom: 4 },
      })
      .setOrigin(0.5);

    btn.add([bg, label]);
    btn.setSize(240, 70);
    btn.setDepth(3002);

    // Fix: Use config object for setInteractive
    bg.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(-120, -35, 240, 70),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    });
    bg.on('pointerdown', callback);

    return btn;
  }

  async loadLevel(levelUuid: string) {
    try {
      // 使用后端 API 替代本地 JSON
      const levelData = await api.getLevel(levelUuid);
      if (levelData && levelData.data) {
        this.createLevelFromConfig(levelData.data);
      } else {
        console.error('Invalid level data received:', levelData);
      }
    } catch (error) {
      console.error('Failed to load level:', error);
    }
  }

  createLevelFromConfig(config: any) {
    const { tiles, gridSize } = config;

    // 如果缺少 gridSize，则使用默认 startX (仅用于基于网格的后备方案)
    let startX = 375;
    if (gridSize && gridSize.cols) {
      startX = 375 - (gridSize.cols * (this.tileSize + 8)) / 2 + (this.tileSize + 8) / 2;
    }

    const startY = 300;
    const tilesToCreate: TileData[] = [];

    tiles.forEach((tileConfig: any, index: number) => {
      let offsetX = 0;
      let offsetY = 0;

      if (tileConfig.layer % 2 !== 0) {
        offsetX = this.tileSize / 2;
        offsetY = this.tileSize / 2;
      }

      let x, y;

      if (typeof tileConfig.x === 'number' && typeof tileConfig.y === 'number') {
        x = tileConfig.x;
        y = tileConfig.y;
      } else {
        const xOffset = startX + tileConfig.col * (this.tileSize + 8) + offsetX;
        const yOffset = startY + tileConfig.row * (this.tileSize + 8) + offsetY;
        x = xOffset;
        y = yOffset;
      }

      const tileData: TileData = {
        id: `tile-${index}`,
        type: tileConfig.type,
        position: { x, y, z: tileConfig.layer },
        isClickable: false,
      };

      this.tiles.set(tileData.id, tileData);
      tilesToCreate.push(tileData);
    });

    // 分帧创建方块，避免瞬间卡顿 (Time-Slicing)
    let currentIndex = 0;
    const batchSize = 15; // 每帧创建的数量

    const creationTimer = this.time.addEvent({
      delay: 1,
      loop: true,
      callback: () => {
        const end = Math.min(currentIndex + batchSize, tilesToCreate.length);
        for (let i = currentIndex; i < end; i++) {
          this.createTile(tilesToCreate[i]);
        }
        currentIndex += batchSize;

        if (currentIndex >= tilesToCreate.length) {
          creationTimer.remove();

          // 所有方块创建完毕后，更新状态并播放入场动画
          this.updateTileClickability();
          this.animateTilesEntry();

          // 通知 React 组件游戏已准备完成，可以隐藏 loading 骨架屏
          window.dispatchEvent(new CustomEvent('GAME_READY'));

          // Analytics
          Analytics.startSession();
          Analytics.logEvent('LEVEL_START', { levelUuid: this.currentLevelUuid });
        }
      },
    });
  }

  createTile(tileData: TileData) {
    const { position, type } = tileData;

    // 初始位置在屏幕上方，用于下落淡入动画
    const startY = -100;
    const container = this.add.container(position.x, startY);
    container.setAlpha(0); // 初始透明

    // 使用预渲染的纹理替代 Graphics (性能优化)
    // 默认先用被遮挡的纹理，稍后在动画结束或 redrawTile 时更新
    const bg = this.add.image(0, 0, 'tile-blocked');
    bg.setOrigin(0.5);
    bg.setDisplaySize(this.tileSize + 16, this.tileSize + 16);

    const icon = this.add.image(0, 0, type);
    icon.setDisplaySize(this.tileSize * 0.7, this.tileSize * 0.7);
    icon.setTint(0x888888); // 默认暗色

    container.add([bg, icon]);
    container.setDepth(position.z * 100);
    container.setData('tileId', tileData.id);
    container.setData('bg', bg);
    container.setData('icon', icon);

    container.setSize(this.tileSize, this.tileSize);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerdown', () => {
      // 防止点击槽位中的方块
      if (this.slots.includes(tileData)) return;

      if (!this.isPaused) {
        this.handleTileClick(tileData.id);
      }
    });

    container.on('pointerover', () => {
      // 防止悬浮高亮槽位中的方块
      if (this.slots.includes(tileData)) return;

      if (tileData.isClickable && !this.isPaused) {
        container.setScale(1.05);
      }
    });

    container.on('pointerout', () => {
      container.setScale(1);
    });

    tileData.sprite = container;
  }

  animateTilesEntry() {
    const sprites = Array.from(this.tiles.values())
      .map((t) => t.sprite)
      .filter((s) => s !== undefined) as Phaser.GameObjects.Container[];

    if (sprites.length === 0) return;

    this.tweens.add({
      targets: sprites,
      y: (target: Phaser.GameObjects.Container) => {
        const tileId = target.getData('tileId');
        const tile = this.tiles.get(tileId);
        return tile ? tile.position.y : target.y;
      },
      alpha: 1, // 淡入效果
      duration: 800, // 稍慢一点，更有质感
      ease: 'Bounce.easeOut', // 弹跳效果，模拟落地
      delay: (target: Phaser.GameObjects.Container) => {
        const tileId = target.getData('tileId');
        const tile = this.tiles.get(tileId);
        if (!tile) return 0;
        // 根据层级和索引计算延迟，产生波浪感
        return tile.position.z * 50 + (parseInt(tile.id.split('-')[1]) % 20) * 20;
      },
    });
  }

  redrawTile(tileData: TileData) {
    const container = tileData.sprite;
    if (!container) return;

    const bg = container.getData('bg') as Phaser.GameObjects.Image;
    const icon = container.getData('icon') as Phaser.GameObjects.Image;

    // 防御性检查：确保 bg 和 icon 存在
    if (!bg || !icon) return;

    if (tileData.isClickable) {
      bg.setTexture('tile-base');
      icon.setTint(0xffffff);
    } else {
      bg.setTexture('tile-blocked');
      icon.setTint(0x888888);
    }
  }

  updateTileClickability() {
    this.tiles.forEach((tile) => {
      tile.isClickable = !this.isTileBlocked(tile);
      this.redrawTile(tile);
    });
  }

  isTileBlocked(tile: TileData): boolean {
    for (const [, otherTile] of this.tiles) {
      if (otherTile.id === tile.id) continue;
      if (otherTile.position.z <= tile.position.z) continue;

      const dx = Math.abs(tile.position.x - otherTile.position.x);
      const dy = Math.abs(tile.position.y - otherTile.position.y);

      if (dx < this.tileSize && dy < this.tileSize) {
        return true;
      }
    }
    return false;
  }

  handleTileClick(tileId: string) {
    const tileData = this.tiles.get(tileId);
    if (!tileData || !tileData.sprite) return;

    if (!tileData.isClickable) {
      this.tweens.add({
        targets: tileData.sprite,
        x: tileData.position.x - 5,
        yoyo: true,
        repeat: 3,
        duration: 50,
        ease: 'Sine.easeInOut',
      });
      return;
    }

    if (this.slots.length >= this.maxSlots) {
      this.cameras.main.shake(200, 0.01);
      return;
    }

    this.tiles.delete(tileId);
    this.slots.push(tileData);

    const slotX = 80 + (this.slots.length - 1) * 90;
    this.tweens.add({
      targets: tileData.sprite,
      x: slotX,
      y: this.slotY,
      scale: 0.9,
      duration: 350,
      ease: 'Back.easeOut',
      onComplete: () => {
        tileData.sprite?.setDepth(1000);
        this.checkMatch();
      },
    });

    this.time.delayedCall(50, () => {
      this.updateTileClickability();
    });
  }

  checkMatch() {
    const typeCount: { [key: string]: TileData[] } = {};

    this.slots.forEach((tile) => {
      if (!typeCount[tile.type]) {
        typeCount[tile.type] = [];
      }
      typeCount[tile.type].push(tile);
    });

    for (const type in typeCount) {
      if (typeCount[type].length >= 3) {
        this.removeMatched(typeCount[type].slice(0, 3));
        return;
      }
    }

    if (this.slots.length >= this.maxSlots) {
      this.gameOver();
    }
  }

  removeMatched(matched: TileData[]) {
    this.score += 30;
    this.scoreText?.setText(`${this.score}`);

    matched.forEach((tile) => {
      if (tile.sprite) {
        const particles = this.add.particles(tile.sprite.x, tile.sprite.y, 'coin', {
          speed: { min: 100, max: 200 },
          scale: { start: 0.1, end: 0 },
          lifespan: 800,
          quantity: 5,
          emitting: false,
        });
        particles.setDepth(2000);

        particles.explode(5);
        this.time.delayedCall(800, () => particles.destroy());
      }
    });

    matched.forEach((tile) => {
      if (!tile.sprite) return;

      this.tweens.add({
        targets: tile.sprite,
        alpha: 0,
        scale: 0,
        duration: 300,
        onComplete: () => {
          tile.sprite?.destroy();
        },
      });

      const index = this.slots.findIndex((t) => t.id === tile.id);
      if (index > -1) {
        this.slots.splice(index, 1);
      }
    });

    this.time.delayedCall(350, () => {
      this.rearrangeSlots();
    });

    if (this.tiles.size === 0) {
      this.time.delayedCall(600, () => {
        this.victory();
      });
    }
  }

  rearrangeSlots() {
    this.slots.forEach((tile, index) => {
      if (!tile.sprite) return;
      const slotX = 80 + index * 90;

      this.tweens.add({
        targets: tile.sprite,
        x: slotX,
        duration: 250,
        ease: 'Back.easeOut',
      });
    });
  }

  gameOver() {
    Analytics.logEvent('LEVEL_FAIL', { levelUuid: this.currentLevelUuid, score: this.score });
    this.createPopup('💔 游戏失败', '#FF6B6B', '重新开始');
  }
  async victory() {
    let nextLevelUuid: string | null = null;
    try {
      // 获取所有已发布的关卡并按sortOrder排序
      const response = await api.getLevels();
      const allLevels = Array.isArray(response) ? response : [];

      // 按sortOrder排序
      allLevels.sort((a: any, b: any) => {
        const sortA = typeof a.sortOrder === 'number' ? a.sortOrder : 9999;
        const sortB = typeof b.sortOrder === 'number' ? b.sortOrder : 9999;
        return sortA - sortB;
      });

      // 找到下一关
      const currentIndex = allLevels.findIndex((l: any) => l.id === this.currentLevelUuid);

      if (currentIndex !== -1 && currentIndex + 1 < allLevels.length) {
        nextLevelUuid = allLevels[currentIndex + 1].id;
      }

      // 提交进度
      await api.submitProgress(this.currentLevelUuid, 'completed', this.score);
      Analytics.logEvent('LEVEL_COMPLETE', { levelUuid: this.currentLevelUuid, score: this.score });

      // Show success modal
      console.log('Progress saved to API');

      // 解锁逻辑已移到LevelSelectScene,通过API自动计算
    } catch (e) {
      console.error('Failed to save progress', e);
    }

    this.createPopup('🎉 恭喜过关', '#2E8B57', '再玩一次', nextLevelUuid);
  }

  updatePropButtonText(text: string, count: number) {
    const containers = this.children.list.filter(
      (c) => c.type === 'Container',
    ) as Phaser.GameObjects.Container[];
    containers.forEach((c) => {
      const hasText = c.list.some(
        (child) =>
          child instanceof Phaser.GameObjects.Text &&
          (child as Phaser.GameObjects.Text).text === text,
      );
      if (hasText) {
        const countText = c.getData('countText') as Phaser.GameObjects.Text;
        if (countText) {
          countText.setText(`${count}`);
        }
      }
    });
  }

  createPopup(title: string, color: string, btnText: string, nextLevelUuid?: string | null) {
    const overlay = this.add.rectangle(375, 667, 750, 1334, 0x000000, 0.7);
    overlay.setDepth(2000);
    overlay.setInteractive();

    const panel = this.add.graphics();
    panel.fillStyle(0xfff5e6, 1);
    panel.fillRoundedRect(125, 400, 500, 500, 20);
    panel.lineStyle(8, 0x8b4513, 1);
    panel.strokeRoundedRect(125, 400, 500, 500, 20);
    panel.setDepth(2001);

    this.add
      .text(375, 480, title, {
        fontSize: '56px',
        color: color,
        fontStyle: 'bold',
        padding: { top: 10 },
      })
      .setOrigin(0.5)
      .setDepth(2002);

    this.add
      .text(375, 580, `最终分数: ${this.score}`, {
        fontSize: '36px',
        color: '#8B4513',
      })
      .setOrigin(0.5)
      .setDepth(2002);

    const btnY = 700;

    if (nextLevelUuid) {
      this.createMenuButton(375, btnY, '下一关', 0x2e8b57, () => {
        this.scene.restart({ id: nextLevelUuid });
      });
    } else {
      this.createMenuButton(375, btnY, btnText, 0xe67e22, () => {
        this.scene.restart({ id: this.currentLevelUuid });
      });
    }

    this.createMenuButton(375, btnY + 110, '返回主菜单', 0x8b4513, () => {
      this.scene.start('LevelSelectScene');
    });
  }
}
