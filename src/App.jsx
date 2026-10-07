import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import PetProfile from './pages/PetProfile';
import DailyLog from './pages/DailyLog';
import HealthLog from './pages/HealthLog';
import PhotoGallery from './pages/PhotoGallery';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#FBF9F5] text-[#222]">
        {/* 공통 상단 네비게이션 */}
        <Navbar />

        {/* 페이지별 라우팅 */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<PetProfile />} />
          <Route path="/daily" element={<DailyLog />} />
          <Route path="/health" element={<HealthLog />} />
          <Route path="/photo" element={<PhotoGallery />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;