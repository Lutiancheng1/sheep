// Phaser游戏组件
'use client'

import { useEffect, useRef, useState } from 'react'
import * as Phaser from 'phaser'
import StartScene from './scenes/StartScene'
import LevelSelectScene from './scenes/LevelSelectScene'
import GameScene from './scenes/GameScene'
import Leaderboard from './Leaderboard'
import SettingsModal from './SettingsModal'

export default function PhaserGame() {
  const gameRef = useRef<HTMLDivElement>(null)
  const phaserGameInstanceRef = useRef<Phaser.Game | null>(null)

  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [leaderboardLevelId, setLeaderboardLevelId] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const handleOpenLeaderboard = (e: Event) => {
      const customEvent = e as CustomEvent<{ levelId?: string }>
      setLeaderboardLevelId(customEvent.detail?.levelId)
      setShowLeaderboard(true)
    }

    const handleOpenSettings = () => {
      setShowSettings(true)
    }

    window.addEventListener('OPEN_LEADERBOARD', handleOpenLeaderboard as EventListener)
    window.addEventListener('OPEN_SETTINGS', handleOpenSettings)

    if (!gameRef.current) return

    const config: Phaser.Types.Core.GameConfig & { resolution?: number } = {
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
      },
      resolution: window.devicePixelRatio,
      render: {
        pixelArt: false,
        antialias: true,
        roundPixels: true
      }
    }

    phaserGameInstanceRef.current = new Phaser.Game(config)

    // 游戏初始化完成后隐藏 loading
    setTimeout(() => {
      setIsLoading(false)
    }, 800)

    return () => {
      console.log('PhaserGame: useEffect cleanup')
      window.removeEventListener('OPEN_LEADERBOARD', handleOpenLeaderboard as EventListener)
      window.removeEventListener('OPEN_SETTINGS', handleOpenSettings)
      if (phaserGameInstanceRef.current) {
        phaserGameInstanceRef.current.destroy(true)
        phaserGameInstanceRef.current = null
      }
    }
  }, [])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Loading Skeleton */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: '#C1F0C1',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          transition: 'opacity 0.5s ease-out',
          opacity: isLoading ? 1 : 0
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px', fontWeight: 'bold', color: '#2E8B57' }}>
            🐑 羊了个羊
          </div>
          <div style={{
            width: '50px',
            height: '50px',
            border: '5px solid #2E8B57',
            borderTop: '5px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
      )}
      
      {/* Game Canvas */}
      <div 
        ref={gameRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          opacity: isLoading ? 0 : 1, // Fade out loading, fade in game
          transition: 'opacity 0.5s ease-in-out'
        }} 
      />
      
      <Leaderboard
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        levelId={leaderboardLevelId}
      />
      
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
