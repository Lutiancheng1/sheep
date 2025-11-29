import * as Phaser from 'phaser'
import { api } from '../../lib/api'

export default class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelSelectScene' })
  }

  create() {
    // 背景色
    this.cameras.main.setBackgroundColor(0xC1F0C1)

    // 顶部背景遮罩
    const headerBg = this.add.graphics();
    headerBg.fillStyle(0xC1F0C1, 0.95);
    headerBg.fillRect(0, 0, 750, 140);
    headerBg.setDepth(1);

    // 标题
    this.add.text(375, 80, '选择关卡', {
      fontSize: '48px',
      color: '#2E8B57',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(1);

    // 返回按钮 (左上角)
    const backBtn = this.add.text(70, 80, '🏠', {
      fontSize: '40px'
    }).setOrigin(0.5).setDepth(1)
      .setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => {
      this.scene.start('StartScene');
    });

    // 排行榜按钮 (右上角)
    const rankBtn = this.add.text(680, 80, '🏆', {
      fontSize: '40px'
    }).setOrigin(0.5).setDepth(1)
      .setInteractive({ useHandCursor: true });

    rankBtn.on('pointerdown', () => {
      window.dispatchEvent(new CustomEvent('OPEN_LEADERBOARD'));
    });

    // 关卡列表容器
    const listContainer = this.add.container(0, 0);

    // 获取关卡列表
    api.getLevels().then(response => {
      const levels = Array.isArray(response) ? response : []

      // 按关卡ID数字排序
      levels.sort((a: any, b: any) => {
        const idA = parseInt(a.levelId.split('-')[1] || '0')
        const idB = parseInt(b.levelId.split('-')[1] || '0')
        return idA - idB
      })

      const startY = 260
      const colCount = 3
      const gapX = 220
      const gapY = 140
      const startX = 375 - gapX // Center is 375. Left is 375-220=155. Right is 375+220=595.

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
        const displayName = `${index + 1}`

        const col = index % colCount
        const row = Math.floor(index / colCount)

        const x = startX + (col * gapX)
        const y = startY + (row * gapY)

        this.createLevelButton(x, y, displayName, level.levelId, isUnlocked, listContainer)
      })

      // 滚动逻辑 (支持鼠标滚轮和触摸拖拽 + 惯性)
      let isDragging = false
      let dragStartY = 0
      let startContainerY = 0
      let lastY = 0
      let velocity = 0
      let lastTime = 0

      const totalRows = Math.ceil(levels.length / colCount)
      const lastItemBottom = startY + (totalRows - 1) * gapY + 60 // 60 is half height + margin
      // Screen height 1334. If content is shorter, minScroll is 0.
      const minScroll = Math.min(0, 1334 - lastItemBottom - 100)

      // 1. 鼠标滚轮支持
      this.input.on('wheel', (pointer: any, gameObjects: any, deltaX: number, deltaY: number, deltaZ: number) => {
        listContainer.y -= deltaY * 0.5
        if (listContainer.y < minScroll) listContainer.y = minScroll
        if (listContainer.y > 0) listContainer.y = 0
        velocity = 0 // Stop inertia on wheel
      })

      // 2. 触摸拖拽支持
      this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        isDragging = true
        dragStartY = pointer.y
        startContainerY = listContainer.y
        lastY = pointer.y
        lastTime = pointer.time
        velocity = 0
      })

      this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
        if (!isDragging) return

        const deltaY = pointer.y - dragStartY
        listContainer.y = startContainerY + deltaY

        // 计算瞬时速度
        const dt = pointer.time - lastTime
        if (dt > 0) {
          velocity = (pointer.y - lastY) / dt
        }
        lastY = pointer.y
        lastTime = pointer.time

        // 弹性阻尼
        if (listContainer.y > 0) {
          listContainer.y = listContainer.y * 0.5
        } else if (listContainer.y < minScroll) {
          const over = minScroll - listContainer.y
          listContainer.y = minScroll - over * 0.5
        }
      })

      const stopDrag = () => {
        isDragging = false
      }

      this.input.on('pointerup', stopDrag)
      this.input.on('pointerupoutside', stopDrag)

      // 3. 惯性滚动更新循环
      this.events.on('update', (time: number, delta: number) => {
        if (isDragging) return

        if (Math.abs(velocity) > 0.1) {
          listContainer.y += velocity * delta
          velocity *= 0.95 // 摩擦力

          // 边界检查
          if (listContainer.y > 0) {
            listContainer.y = listContainer.y * 0.8 // 回弹阻尼
            if (listContainer.y < 1) {
              listContainer.y = 0
              velocity = 0
            }
          } else if (listContainer.y < minScroll) {
            const over = minScroll - listContainer.y
            listContainer.y = minScroll - over * 0.8
            if (Math.abs(over) < 1) {
              listContainer.y = minScroll
              velocity = 0
            }
          }
        } else {
          // 停止时确保在边界内
          if (listContainer.y > 0) {
            listContainer.y = Phaser.Math.Linear(listContainer.y, 0, 0.1)
          } else if (listContainer.y < minScroll) {
            listContainer.y = Phaser.Math.Linear(listContainer.y, minScroll, 0.1)
          }
        }
      })
    }).catch(err => {
      console.error('Failed to fetch levels', err)
      this.add.text(375, 400, '加载关卡失败', { color: '#ff0000', fontSize: '32px' }).setOrigin(0.5)
    })
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
    // Rectangular buttons for grid
    bg.fillRoundedRect(-90, -50, 180, 100, 16)
    bg.strokeRoundedRect(-90, -50, 180, 100, 16)

    const label = this.add.text(0, 0, isUnlocked ? text : '🔒', {
      fontSize: '40px',
      color: isUnlocked ? '#8B4513' : '#888888',
      fontStyle: 'bold'
    })
    label.setOrigin(0.5)

    container.add([bg, label])
    container.setSize(180, 100)

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