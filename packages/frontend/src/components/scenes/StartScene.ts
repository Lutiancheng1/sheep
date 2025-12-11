import * as Phaser from 'phaser';
import { api } from '../../lib/api';

export default class StartScene extends Phaser.Scene {
  private loadingTitle?: Phaser.GameObjects.Text;
  private loadingText?: Phaser.GameObjects.Text;
  private progressBar?: Phaser.GameObjects.Graphics;
  private progressBarBg?: Phaser.GameObjects.Graphics;
  private isLoadingComplete = false;

  constructor() {
    super({ key: 'StartScene' });
  }

  preload() {
    // 创建加载UI
    this.createLoadingUI();

    // 监听加载进度
    this.load.on('progress', (value: number) => {
      this.updateProgress(value);
    });

    // 加载完成
    this.load.on('complete', () => {
      this.isLoadingComplete = true;
      this.onLoadComplete();
    });

    // 加载所有游戏图标 (14个)
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

    // 加载SVG图标 (3个)
    this.load.svg('settings', '/icons/settings.svg', { scale: 0.2 });
    this.load.svg('sound-on', '/icons/sound-on.svg', { scale: 0.5 });
    this.load.svg('sound-off', '/icons/sound-off.svg', { scale: 0.5 });

    // 加载背景音乐
    this.load.audio('bgm', '/assets/bgm.mp3');
  }

  createLoadingUI() {
    // 设置背景色
    this.cameras.main.setBackgroundColor(0xc1f0c1);

    // 标题
    this.loadingTitle = this.add.text(375, 300, '羊了个羊', {
      fontSize: '60px',
      color: '#2E8B57',
      fontStyle: 'bold',
      stroke: '#FFFFFF',
      strokeThickness: 6,
    });
    this.loadingTitle.setOrigin(0.5);

    // 加载文本
    this.loadingText = this.add.text(375, 500, '加载中... 0%', {
      fontSize: '24px',
      color: '#2E8B57',
      fontStyle: 'bold',
    });
    this.loadingText.setOrigin(0.5);

    // 进度条背景
    this.progressBarBg = this.add.graphics();
    this.progressBarBg.fillStyle(0x8b4513, 1);
    this.progressBarBg.fillRoundedRect(175, 550, 400, 30, 15);
    this.progressBarBg.lineStyle(4, 0x2e8b57, 1);
    this.progressBarBg.strokeRoundedRect(175, 550, 400, 30, 15);

    // 进度条
    this.progressBar = this.add.graphics();
  }

  updateProgress(value: number) {
    if (!this.progressBar || !this.loadingText) return;

    // 更新进度条
    this.progressBar.clear();
    this.progressBar.fillStyle(0x2e8b57, 1);
    this.progressBar.fillRoundedRect(177, 552, 396 * value, 26, 13);

    // 更新百分比文本
    const percentage = Math.floor(value * 100);
    this.loadingText.setText(`加载中... ${percentage}%`);
  }

  onLoadComplete() {
    if (!this.loadingText || !this.progressBar || !this.progressBarBg || !this.loadingTitle) return;

    // 显示100%
    this.loadingText.setText('加载完成! 100%');

    // 延迟后淡出loading UI
    this.time.delayedCall(500, () => {
      this.tweens.add({
        targets: [this.loadingTitle, this.loadingText, this.progressBar, this.progressBarBg],
        alpha: 0,
        duration: 500,
        onComplete: () => {
          this.loadingTitle?.destroy();
          this.loadingText?.destroy();
          this.progressBar?.destroy();
          this.progressBarBg?.destroy();
          this.showMainMenu();
        },
      });
    });
  }

  create() {
    // 不在这里调用showMainMenu，等待onLoadComplete处理
    // create()会在preload完成后自动调用，但我们已经在onLoadComplete中处理了
  }

  showMainMenu() {
    // 防止重复调用
    if (this.children.list.some((child) => child.name === 'main_menu_title')) {
      return;
    }
    // 自动游客登录
    if (!api.token) {
      api
        .guestLogin()
        .then((data) => {
          console.log('Guest login success:', data);
        })
        .catch((err) => {
          console.error('Guest login failed:', err);
        });
    }

    // 背景色
    this.cameras.main.setBackgroundColor(0xc1f0c1);

    // 标题
    const title = this.add.text(375, 400, '羊了个羊', {
      fontSize: '80px',
      color: '#2E8B57',
      fontStyle: 'bold',
      stroke: '#FFFFFF',
      strokeThickness: 8,
    });
    title.setOrigin(0.5);
    title.name = 'main_menu_title'; // 添加标记防止重复创建

    // 开始按钮
    const btn = this.add.container(375, 800);
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x2e8b57, 1);
    btnBg.fillRoundedRect(-150, -40, 300, 80, 20);

    // 按钮阴影
    const btnShadow = this.add.graphics();
    btnShadow.fillStyle(0x1b5e3a, 1);
    btnShadow.fillRoundedRect(-150, -30, 300, 80, 20);
    btnShadow.setDepth(-1);

    const btnTxt = this.add
      .text(0, 0, '开始游戏', {
        fontSize: '40px',
        color: '#ffffff',
        fontStyle: 'bold',
        padding: { top: 10, bottom: 10, left: 0, right: 0 },
      })
      .setOrigin(0.5);

    btn.add([btnShadow, btnBg, btnTxt]);
    btn.setSize(300, 80);
    btn.setInteractive({ useHandCursor: true });

    // 按钮交互动画
    btn.on('pointerdown', () => {
      this.tweens.add({
        targets: btn,
        scale: 0.95,
        duration: 100,
        yoyo: true,
        onComplete: () => {
          this.scene.start('LevelSelectScene');
        },
      });
    });

    btn.on('pointerover', () => {
      this.tweens.add({
        targets: btn,
        scale: 1.05,
        duration: 200,
      });
    });

    btn.on('pointerout', () => {
      this.tweens.add({
        targets: btn,
        scale: 1,
        duration: 200,
      });
    });

    // 排行榜按钮
    const rankBtn = this.add.container(375, 920);
    const rankBtnBg = this.add.graphics();
    rankBtnBg.fillStyle(0xffd700, 1); // Gold color
    rankBtnBg.fillRoundedRect(-100, -30, 200, 60, 15);

    const rankBtnShadow = this.add.graphics();
    rankBtnShadow.fillStyle(0xb8860b, 1); // Dark Goldenrod
    rankBtnShadow.fillRoundedRect(-100, -22, 200, 60, 15);
    rankBtnShadow.setDepth(-1);

    const rankBtnTxt = this.add
      .text(0, 0, '🏆 排行榜', {
        fontSize: '32px',
        color: '#ffffff',
        fontStyle: 'bold',
        padding: { top: 10, bottom: 10, left: 10, right: 10 },
      })
      .setOrigin(0.5);

    rankBtn.add([rankBtnShadow, rankBtnBg, rankBtnTxt]);
    rankBtn.setSize(200, 60);
    rankBtn.setInteractive({ useHandCursor: true });

    rankBtn.on('pointerdown', () => {
      this.tweens.add({
        targets: rankBtn,
        scale: 0.95,
        duration: 100,
        yoyo: true,
        onComplete: () => {
          window.dispatchEvent(new CustomEvent('OPEN_LEADERBOARD'));
        },
      });
    });

    // 设置按钮 (右上角)
    const settingsBtn = this.add.container(680, 75);
    const settingsBg = this.add.graphics();
    settingsBg.fillStyle(0x0099ff, 1); // 蓝色背景
    settingsBg.fillRoundedRect(-30, -30, 60, 60, 10);
    settingsBg.lineStyle(4, 0x000000, 1);
    settingsBg.strokeRoundedRect(-30, -30, 60, 60, 10);

    // 使用SVG齿轮图标
    const settingsIcon = this.add.image(0, 0, 'settings').setDisplaySize(40, 40).setOrigin(0.5);
    settingsBtn.add([settingsBg, settingsIcon]);

    settingsBtn.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(-30, -30, 60, 60),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    });

    settingsBtn.on('pointerdown', () => {
      this.tweens.add({
        targets: settingsBtn,
        scale: 0.9,
        duration: 100,
        yoyo: true,
        onComplete: () => {
          window.dispatchEvent(new CustomEvent('OPEN_SETTINGS'));
        },
      });
    });

    // 简单的浮动动画
    this.tweens.add({
      targets: title,
      y: 380,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}
