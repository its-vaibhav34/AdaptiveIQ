import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { LandingPage } from './pages/LandingPage';
import { JoinPage } from './pages/JoinPage';
import { LobbyPage } from './pages/LobbyPage';
import { GamePage } from './pages/GamePage';
import { ResultsPage } from './pages/ResultsPage';
import { CreateQuizPage } from './pages/CreateQuizPage';
import { AIGeneratorPage } from './pages/AIGeneratorPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { useGameStore } from './store/useGameStore';
import { AVATARS } from './utils/constants';

const AnimatedRoutes = () => {
  const location = useLocation();
  const { addPlayer, players, roomCode } = useGameStore();

  // Mock Socket Simulation: Add random players when in lobby
  useEffect(() => {
    if (roomCode && players.length === 1) {
      const mockPlayers = [
        { id: '2', username: 'Neon_Ninja', avatar: AVATARS[1], score: 0, isReady: true, isHost: false },
        { id: '3', username: 'Quiz_Wizard', avatar: AVATARS[2], score: 0, isReady: true, isHost: false },
        { id: '4', username: 'Pixel_Pioneer', avatar: AVATARS[3], score: 0, isReady: false, isHost: false },
      ];
      
      mockPlayers.forEach((p, i) => {
        setTimeout(() => {
          addPlayer(p);
        }, (i + 1) * 2000);
      });
    }
  }, [roomCode, players.length, addPlayer]);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/lobby/:code" element={<LobbyPage />} />
        <Route path="/game/:code" element={<GamePage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/create" element={<CreateQuizPage />} />
        <Route path="/ai-generate" element={<AIGeneratorPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
      </Routes>
    </AnimatePresence>
  );
};

export default function App() {
  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
}
