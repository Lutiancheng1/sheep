import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Progress } from 'antd';
import { CloseCircleFilled, PlayCircleFilled, CheckCircleFilled } from '@ant-design/icons';

interface AdPlayerProps {
  visible: boolean;
  videoUrl: string;
  durationSeconds: number;
  onComplete: () => void;
  onCancel: () => void;
}

export const AdPlayer: React.FC<AdPlayerProps> = ({
  visible,
  videoUrl,
  durationSeconds,
  onComplete,
  onCancel,
}) => {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [canSkip, setCanSkip] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (visible) {
      setTimeLeft(durationSeconds);
      setCanSkip(false);
      setShowConfirm(false);
      setIsVideoReady(false);

      // Disable game input to prevent click-through
      window.dispatchEvent(new CustomEvent('DISABLE_INPUT'));

      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch((e) => console.error('Auto-play failed:', e));
      }
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (videoRef.current) {
        videoRef.current.pause();
      }

      // Re-enable game input when ad player is closed
      window.dispatchEvent(new CustomEvent('ENABLE_INPUT'));
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible, durationSeconds]);

  // 当视频开始播放时启动倒计时
  useEffect(() => {
    if (visible && isVideoReady && !timerRef.current) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setCanSkip(true);
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [visible, isVideoReady]);

  const handleVideoPlaying = () => {
    setIsVideoReady(true);
  };

  const handleVideoEnded = () => {
    // If timer hasn't finished, replay the video
    if (timeLeft > 0) {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch((e) => console.error('Replay failed:', e));
      }
    } else {
      setCanSkip(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleClose = () => {
    if (canSkip) {
      onComplete();
    } else {
      // 暂停视频和倒计时
      videoRef.current?.pause();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setShowConfirm(true);
    }
  };

  const handleConfirmClose = () => {
    setShowConfirm(false);
    onCancel();
  };

  const handleCancelClose = () => {
    setShowConfirm(false);
    // 恢复视频播放
    videoRef.current?.play();
    // 恢复倒计时
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanSkip(true);
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center animate-fadeIn"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
    >
      {/* Video Container */}
      <div className="relative w-full h-full max-w-md mx-auto bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain"
          onEnded={handleVideoEnded}
          onPlaying={handleVideoPlaying}
          playsInline
          controls={false}
        />

        {/* Top Bar Gradient Overlay */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />

        {/* Close Button (Top Right) */}
        {!showConfirm && (
          <div className="absolute top-6 right-6 z-20">
            <button
              onClick={handleClose}
              className="group flex items-center justify-center w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 transition-all active:scale-95"
            >
              <CloseCircleFilled className="text-white/90 text-2xl group-hover:text-white" />
            </button>
          </div>
        )}

        {/* Timer / Status (Top Left) */}
        {!showConfirm && (
          <div className="absolute top-6 left-6 z-20">
            {canSkip ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/90 backdrop-blur-md border border-green-400/30 shadow-lg animate-bounce-subtle">
                <CheckCircleFilled className="text-white" />
                <span className="text-white font-bold text-sm">奖励已就绪</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span className="text-white/90 font-medium text-sm tabular-nums">
                  广告剩余 {timeLeft}s
                </span>
              </div>
            )}
          </div>
        )}

        {/* Confirmation Overlay */}
        {showConfirm && (
          <div
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
          >
            <div
              className="bg-white/10 border border-white/20 rounded-2xl p-6 w-80 text-center shadow-2xl backdrop-blur-md"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
            >
              <h3 className="text-white text-xl font-bold mb-2">放弃复活？</h3>
              <p className="text-white/70 mb-6 text-sm">
                观看完整广告才能获得复活机会，确定要关闭吗？
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleCancelClose}
                  className="w-full py-3 rounded-full bg-green-500 text-white font-bold text-base active:scale-95 transition-transform"
                >
                  继续观看
                </button>
                <button
                  onClick={handleConfirmClose}
                  className="w-full py-3 rounded-full bg-white/10 text-white/60 font-medium text-sm active:scale-95 transition-transform"
                >
                  放弃奖励
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Action Area (Only when complete) */}
        {canSkip && !showConfirm && (
          <div className="absolute bottom-12 left-0 w-full px-8 z-20 animate-slideUp">
            <Button
              type="primary"
              size="large"
              block
              shape="round"
              onClick={onComplete}
              className="h-14 text-lg font-bold bg-gradient-to-r from-green-400 to-emerald-600 border-none shadow-xl hover:scale-105 transition-transform"
              icon={<PlayCircleFilled />}
            >
              立即复活
            </Button>
          </div>
        )}

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10">
          <div
            className="h-full bg-green-500 transition-all duration-1000 ease-linear"
            style={{ width: `${((durationSeconds - timeLeft) / durationSeconds) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};
