import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import LevelList from './pages/LevelList';
import LevelEditor from './pages/LevelEditor';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/levels" replace />} />
          <Route path="levels" element={<LevelList />} />
          <Route path="levels/new" element={<LevelEditor />} />
          <Route path="levels/:id" element={<LevelEditor />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
