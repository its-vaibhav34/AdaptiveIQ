import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Home, BarChart3 } from 'lucide-react';
import { Button, Card } from '../components/UI';
import { useGameStore } from '../store/useGameStore';

export const ResultsPage = () => {
  const navigate = useNavigate();
  const { players, resetGame } = useGameStore();
  
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const top3 = sortedPlayers.slice(0, 3);
  const rest = sortedPlayers.slice(3);

  useEffect(() => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#ec4899', '#10b981', '#f59e0b']
    });
  }, []);

  const handlePlayAgain = () => {
    resetGame();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 overflow-x-hidden">
      <div className="max-w-5xl mx-auto pt-12 pb-24">
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-20"
        >
          <h2 className="text-7xl md:text-8xl font-black italic uppercase tracking-tighter mb-4">Champions</h2>
          <p className="text-white/40 text-xl font-bold tracking-widest uppercase">The battle has ended</p>
        </motion.div>

        {/* Podium */}
        <div className="flex items-end justify-center gap-4 mb-24 h-80">
          {/* 2nd Place */}
          {top3[1] && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: '60%', opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="flex-1 flex flex-col items-center"
            >
              <img src={top3[1].avatar} className="w-16 h-16 rounded-2xl mb-4 border-4 border-slate-300 shadow-xl" referrerPolicy="no-referrer" />
              <div className="w-full bg-slate-300/20 border-t-4 border-slate-300 rounded-t-3xl p-4 flex flex-col items-center justify-center flex-1">
                <span className="text-2xl font-black text-slate-300 mb-1">2nd</span>
                <span className="font-bold truncate w-full text-center">{top3[1].username}</span>
                <span className="text-xs font-black text-slate-300/60 uppercase">{top3[1].score} pts</span>
              </div>
            </motion.div>
          )}

          {/* 1st Place */}
          {top3[0] && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: '85%', opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="flex-1 flex flex-col items-center z-10"
            >
              <div className="relative mb-4">
                <Trophy className="absolute -top-10 left-1/2 -translate-x-1/2 text-yellow-500 w-12 h-12 animate-bounce" />
                <img src={top3[0].avatar} className="w-24 h-24 rounded-3xl border-4 border-yellow-500 shadow-2xl shadow-yellow-500/20" referrerPolicy="no-referrer" />
              </div>
              <div className="w-full bg-yellow-500/20 border-t-4 border-yellow-500 rounded-t-3xl p-6 flex flex-col items-center justify-center flex-1">
                <span className="text-4xl font-black text-yellow-500 mb-1">1st</span>
                <span className="text-xl font-black truncate w-full text-center">{top3[0].username}</span>
                <span className="text-sm font-black text-yellow-500/60 uppercase">{top3[0].score} pts</span>
              </div>
            </motion.div>
          )}

          {/* 3rd Place */}
          {top3[2] && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: '45%', opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="flex-1 flex flex-col items-center"
            >
              <img src={top3[2].avatar} className="w-16 h-16 rounded-2xl mb-4 border-4 border-amber-600 shadow-xl" referrerPolicy="no-referrer" />
              <div className="w-full bg-amber-600/20 border-t-4 border-amber-600 rounded-t-3xl p-4 flex flex-col items-center justify-center flex-1">
                <span className="text-2xl font-black text-amber-600 mb-1">3rd</span>
                <span className="font-bold truncate w-full text-center">{top3[2].username}</span>
                <span className="text-xs font-black text-amber-600/60 uppercase">{top3[2].score} pts</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Rest of Players */}
        {rest.length > 0 && (
          <Card className="mb-12">
            <div className="space-y-2">
              {rest.map((player, i) => (
                <div key={player.id} className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl transition-colors">
                  <span className="w-8 text-white/20 font-black italic">{i + 4}</span>
                  <img src={player.avatar} className="w-10 h-10 rounded-xl" referrerPolicy="no-referrer" />
                  <span className="flex-1 font-bold">{player.username}</span>
                  <span className="font-black text-indigo-400">{player.score}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" onClick={handlePlayAgain}>
            <RotateCcw size={20} />
            Play Again
          </Button>
          <Button variant="secondary" size="lg" onClick={() => navigate('/analytics')}>
            <BarChart3 size={20} />
            View Analytics
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate('/')}>
            <Home size={20} />
            Home
          </Button>
        </div>

      </div>
    </div>
  );
};
