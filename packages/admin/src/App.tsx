import React from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import LevelList from './pages/LevelList';
import LevelEditor from './pages/LevelEditor';
import UserList from './pages/UserList';
import UserLogs from './pages/UserLogs';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <Routes>
          {/* 登录页面 - 不需要认证 */}
          <Route path="/login" element={<Login />} />

          {/* 管理后台 - 需要认证 */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/levels" replace />} />
            <Route path="levels" element={<LevelList />} />
            <Route path="levels/new" element={<LevelEditor />} />
            <Route path="levels/:id" element={<LevelEditor />} />
            <Route path="users" element={<UserList />} />
            <Route path="logs" element={<UserLogs />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;
