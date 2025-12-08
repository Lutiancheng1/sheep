import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'bind' | 'switch'>('profile');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentUser, setCurrentUser] = useState<{ username: string; isGuest: boolean } | null>(
    null,
  );

  useEffect(() => {
    if (isOpen) {
      window.dispatchEvent(new Event('DISABLE_INPUT'));
      // Decode token to get user info (simple decoding for display)
      const token = api.token;
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setCurrentUser({
            username: payload.username,
            isGuest: payload.username.startsWith('guest_'),
          });
        } catch (e) {
          console.error('Failed to decode token', e);
        }
      }
      setActiveTab('profile');
      setError('');
      setSuccess('');
      setUsername('');
      setPassword('');
    } else {
      window.dispatchEvent(new Event('ENABLE_INPUT'));
    }
    return () => {
      window.dispatchEvent(new Event('ENABLE_INPUT'));
    };
  }, [isOpen]);

  const handleBind = async () => {
    try {
      setError('');
      setSuccess('');

      // 前端验证
      if (!username || username.trim().length === 0) {
        setError('请输入用户名');
        return;
      }

      if (!password || password.length < 6) {
        setError('密码长度至少6位');
        return;
      }

      await api.bindAccount(username, password);
      setSuccess('账户绑定成功！');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setError('绑定失败: ' + (err.message || '未知错误'));
    }
  };

  const handleLogin = async () => {
    try {
      setError('');
      setSuccess('');

      // 前端验证
      if (!username || username.trim().length === 0) {
        setError('请输入用户名');
        return;
      }

      if (!password || password.length < 6) {
        setError('密码长度至少6位');
        return;
      }

      await api.login(username, password);
      setSuccess('登录成功！');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setError('登录失败: ' + (err.message || '用户名或密码错误'));
      // 不再刷新页面
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
      }}
      onClick={(e) => {
        // 点击背景遮罩时关闭模态框
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      <div
        style={{
          width: '90%',
          maxWidth: '400px',
          backgroundColor: '#fff',
          borderRadius: '20px',
          padding: '20px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => {
          // 阻止点击事件向上冒泡到背景层
          e.stopPropagation();
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '24px', color: '#333' }}>设置</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>

        <div style={{ display: 'flex', marginBottom: '20px', borderBottom: '1px solid #eee' }}>
          <button
            onClick={() => setActiveTab('profile')}
            style={{
              flex: 1,
              padding: '10px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'profile' ? '2px solid #2E8B57' : 'none',
              color: activeTab === 'profile' ? '#2E8B57' : '#666',
              fontWeight: 'bold',
            }}
          >
            个人信息
          </button>
          {currentUser?.isGuest && (
            <button
              onClick={() => setActiveTab('bind')}
              style={{
                flex: 1,
                padding: '10px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'bind' ? '2px solid #2E8B57' : 'none',
                color: activeTab === 'bind' ? '#2E8B57' : '#666',
                fontWeight: 'bold',
              }}
            >
              绑定账户
            </button>
          )}
          <button
            onClick={() => setActiveTab('switch')}
            style={{
              flex: 1,
              padding: '10px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'switch' ? '2px solid #2E8B57' : 'none',
              color: activeTab === 'switch' ? '#2E8B57' : '#666',
              fontWeight: 'bold',
            }}
          >
            切换账户
          </button>
        </div>

        {activeTab === 'profile' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '60px', marginBottom: '10px' }}>👤</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
              {currentUser?.username}
            </div>
            <div style={{ color: '#666', marginTop: '5px' }}>
              {currentUser?.isGuest ? '游客账户 (建议绑定)' : '正式账户'}
            </div>
          </div>
        )}

        {(activeTab === 'bind' || activeTab === 'switch') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input
              type="text"
              placeholder="用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '16px',
              }}
            />
            <input
              type="password"
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '16px',
              }}
            />
            {error && <div style={{ color: 'red', fontSize: '14px' }}>{error}</div>}
            {success && <div style={{ color: 'green', fontSize: '14px' }}>{success}</div>}

            <button
              type="button"
              onClick={activeTab === 'bind' ? handleBind : handleLogin}
              style={{
                padding: '12px',
                backgroundColor: '#2E8B57',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginTop: '10px',
              }}
            >
              {activeTab === 'bind' ? '确认绑定' : '登录'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
