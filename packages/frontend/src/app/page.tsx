import dynamic from 'next/dynamic'

const PhaserGame = dynamic(() => import('@/components/PhaserGame'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-white text-2xl">加载游戏中...</p>
    </div>
  ),
})

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-900 to-purple-900">
      <div className="w-full max-w-md">
        <PhaserGame />
      </div>
    </main>
  )
}
