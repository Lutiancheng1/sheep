import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import LevelList from './pages/LevelList';
import LevelEditor from './pages/LevelEditor';
import UserList from './pages/UserList';
import UserLogs from './pages/UserLogs';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/levels" replace />} />
          <Route path="levels" element={<LevelList />} />
          <Route path="levels/new" element={<LevelEditor />} />
          <Route path="levels/:id" element={<LevelEditor />} />
          <Route path="users" element={<UserList />} />
          <Route path="logs" element={<UserLogs />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
