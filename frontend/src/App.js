// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import RidersList from './pages/RidersList';
import SwapHistory from './pages/SwapHistory';
import Analytics from './pages/Analytics';
import Marketing from './pages/Marketing';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <main className="main-content">
          <Routes>
            {/* <Route path="/" element={<Navigate to="/dashboard" replace />} /> */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/riders" element={<RidersList />} />
            <Route path="/swaps" element={<SwapHistory />} />
            <Route path="/marketing" element={<Marketing />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;