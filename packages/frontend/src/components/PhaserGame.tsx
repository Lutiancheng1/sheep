// Phaser游戏组件
'use client'

import { useEffect, useRef, useState } from 'react'
import * as Phaser from 'phaser'
import StartScene from './scenes/StartScene'
import LevelSelectScene from './scenes/LevelSelectScene'
import GameScene from './scenes/GameScene'
import Leaderboard from './Leaderboard'

export default function PhaserGame() {
  const gameRef = useRef<HTMLDivElement>(null)
  const phaserGameInstanceRef = useRef<Phaser.Game | null>(null)
  
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [leaderboardLevelId, setLeaderboardLevelId] = useState<string | undefined>(undefined)

  useEffect(() => {
    const handleOpenLeaderboard = (e: CustomEvent<{ levelId?: string }>) => {
      setLeaderboardLevelId(e.detail?.levelId)
      setShowLeaderboard(true)
    }

    window.addEventListener('OPEN_LEADERBOARD' as any, handleOpenLeaderboard as any)

    if (!gameRef.current) return

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: gameRef.current,
      width: 750,
      height: 1334,
      backgroundColor: '#C1F0C1',
      scene: [StartScene, LevelSelectScene, GameScene],
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0, x: 0 },
          debug: false
        }
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      }
    }

    phaserGameInstanceRef.current = new Phaser.Game(config)

    return () => {
      window.removeEventListener('OPEN_LEADERBOARD' as any, handleOpenLeaderboard as any)
      phaserGameInstanceRef.current?.destroy(true)
      phaserGameInstanceRef.current = null
    }
  }, [])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={gameRef} style={{ width: '100%', height: '100%' }} />
      <Leaderboard 
        isOpen={showLeaderboard} 
        onClose={() => setShowLeaderboard(false)} 
        levelId={leaderboardLevelId}
      />
    </div>
  )
}
