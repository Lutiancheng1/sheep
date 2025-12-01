import React, { useEffect, useState } from 'react';
import { getGlobalLeaderboard, getLevelLeaderboard } from '../lib/api';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  score: number;
}

interface LeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
  levelId?: string; // If provided, show level leaderboard, else global
}

const Leaderboard = ({ isOpen, onClose, levelId }: LeaderboardProps) => {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'global' | 'level'>('global');

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen, activeTab, levelId]);

  // Auto-switch to level tab if levelId is provided when opening
  useEffect(() => {
    if (isOpen && levelId) {
      setActiveTab('level');
    } else if (isOpen && !levelId) {
      setActiveTab('global');
    }
  }, [isOpen, levelId]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      let result;
      if (activeTab === 'global') {
        result = await getGlobalLeaderboard();
      } else if (levelId) {
        result = await getLevelLeaderboard(levelId);
      }
      setData(result || []);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm"
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
    >
      <div className="bg-[#f0f9f0] w-full max-w-md rounded-3xl border-4 border-[#2d5a27] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="bg-[#2d5a27] p-4 flex justify-between items-center">
          <h2 className="text-white text-xl font-bold tracking-wider">
            🏆 排行榜
          </h2>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white text-2xl font-bold leading-none"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-2 gap-2 bg-[#e2f0e2]">
          <button
            onClick={() => setActiveTab('global')}
            className={`flex-1 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'global'
                ? 'bg-[#4caf50] text-white shadow-md'
                : 'bg-white text-[#2d5a27] hover:bg-gray-50'
            }`}
          >
            🌍 全局排行
          </button>
          {levelId && (
            <button
              onClick={() => setActiveTab('level')}
              className={`flex-1 py-2 rounded-xl font-bold transition-all ${
                activeTab === 'level'
                  ? 'bg-[#4caf50] text-white shadow-md'
                  : 'bg-white text-[#2d5a27] hover:bg-gray-50'
              }`}
            >
              🎯 当前关卡
            </button>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[300px]">
          {loading ? (
            <div className="flex justify-center items-center h-full text-[#2d5a27]">
              加载中...
            </div>
          ) : data.length === 0 ? (
            <div className="flex justify-center items-center h-full text-gray-400">
              暂无数据
            </div>
          ) : (
            data.map((entry) => (
              <div
                key={entry.userId}
                className={`flex items-center p-3 rounded-xl border-2 ${
                  entry.rank <= 3
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-white border-[#e2f0e2]'
                }`}
              >
                <div
                  className={`w-8 h-8 flex items-center justify-center rounded-full font-bold mr-3 ${
                    entry.rank === 1
                      ? 'bg-yellow-400 text-white'
                      : entry.rank === 2
                      ? 'bg-gray-300 text-white'
                      : entry.rank === 3
                      ? 'bg-orange-300 text-white'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {entry.rank}
                </div>
                <div className="flex-1 font-bold text-gray-700 truncate">
                  {entry.username}
                </div>
                <div className="font-mono font-bold text-[#2d5a27]">
                  {entry.score}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
