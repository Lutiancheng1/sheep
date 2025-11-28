import * as Phaser from 'phaser'
import { api } from '../../lib/api'

export default class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelSelectScene' })
  }

  create() {
    // 背景色
    this.cameras.main.setBackgroundColor(0xC1F0C1)

    // 标题
    this.add.text(375, 80, '选择关卡', {
      fontSize: '48px',
      color: '#2E8B57',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    // 排行榜按钮 (右上角)
    const rankBtn = this.add.text(680, 80, '🏆', {
      fontSize: '40px'
    }).setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    
    rankBtn.on('pointerdown', () => {
      window.dispatchEvent(new CustomEvent('OPEN_LEADERBOARD'))
    })

    // 关卡列表容器
    const listContainer = this.add.container(0, 0)
    
    // 获取关卡列表
    api.getLevels().then(response => {
      const levels = response.data || []
      const startY = 200
      const gapY = 100
      
      // 读取解锁关卡
      let unlockedLevels = ['level-1']
      try {
        const stored = localStorage.getItem('unlockedLevels')
        if (stored) {
          unlockedLevels = JSON.parse(stored)
        }
      } catch (e) {
        console.error('Failed to load progress', e)
      }

      levels.forEach((level: any, index: number) => {
        const isUnlocked = unlockedLevels.includes(level.levelId)
        // 使用 levelId 作为显示名称的一部分，或者如果有 name 字段则使用 name
        const displayName = `第 ${index + 1} 关`
        this.createLevelButton(375, startY + index * gapY, displayName, level.levelId, isUnlocked, listContainer)
      })
      
      // 简单的滚动支持 (如果关卡太多)
      this.input.on('wheel', (pointer: any, gameObjects: any, deltaX: number, deltaY: number, deltaZ: number) => {
        listContainer.y -= deltaY * 0.5
        // 限制滚动范围
        const minScroll = -(levels.length * gapY - 800)
        if (listContainer.y < minScroll) listContainer.y = minScroll
        if (listContainer.y > 0) listContainer.y = 0
      })
    }).catch(err => {
      console.error('Failed to fetch levels', err)
      this.add.text(375, 400, '加载关卡失败', { color: '#ff0000', fontSize: '32px' }).setOrigin(0.5)
    })

    // 返回按钮
    const backBtn = this.add.text(375, 1000, '返回主菜单', {
      fontSize: '32px',
      color: '#2E8B57',
      fontStyle: 'bold',
      padding: { top: 10, bottom: 10 }
    })
    backBtn.setOrigin(0.5)
    backBtn.setInteractive({ useHandCursor: true })
    backBtn.on('pointerdown', () => this.scene.start('StartScene'))
  }

  createLevelButton(x: number, y: number, text: string, levelId: string, isUnlocked: boolean, parent: Phaser.GameObjects.Container) {
    const container = this.add.container(x, y)
    parent.add(container)

    const bg = this.add.graphics()
    if (isUnlocked) {
      bg.fillStyle(0xFFF5E6, 1)
      bg.lineStyle(4, 0x8B4513, 1)
    } else {
      bg.fillStyle(0xCCCCCC, 1) // 灰色背景表示锁定
      bg.lineStyle(4, 0x888888, 1)
    }
    bg.fillRoundedRect(-120, -40, 240, 80, 16)
    bg.strokeRoundedRect(-120, -40, 240, 80, 16)

    const label = this.add.text(0, 0, isUnlocked ? text : '???', {
      fontSize: '32px',
      color: isUnlocked ? '#8B4513' : '#888888',
      fontStyle: 'bold'
    })
    label.setOrigin(0.5)

    container.add([bg, label])
    container.setSize(240, 80)

    if (isUnlocked) {
      container.setInteractive({ useHandCursor: true })

      container.on('pointerdown', () => {
        this.scene.start('GameScene', { levelId })
      })

      container.on('pointerover', () => {
        this.tweens.add({
          targets: container,
          scale: 1.05,
          duration: 100
        })
      })

      container.on('pointerout', () => {
        this.tweens.add({
          targets: container,
          scale: 1,
          duration: 100
        })
      })
    }
  }
}
