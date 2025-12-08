import * as Phaser from 'phaser';
import { api } from '../../lib/api';

export default class StartScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StartScene' });
  }

  create() {
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
    const settingsBtn = this.add
      .text(680, 75, '⚙️', {
        fontSize: '48px',
        padding: { top: 10, bottom: 10, left: 10, right: 10 },
      })
      .setOrigin(0.5);
    settingsBtn.setInteractive({ useHandCursor: true });

    settingsBtn.on('pointerdown', () => {
      this.tweens.add({
        targets: settingsBtn,
        scale: 0.8,
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
