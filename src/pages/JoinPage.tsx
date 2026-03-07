import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Hash } from 'lucide-react';
import { Button, Input, Card } from '../components/UI';
import { AvatarPicker } from '../components/AvatarPicker';
import { useGameStore } from '../store/useGameStore';
import { AVATARS } from '../utils/constants';

export const JoinPage = () => {
  const navigate = useNavigate();
  const { setMe, setRoomCode, addPlayer } = useGameStore();
  
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [code, setCode] = useState('');

  const handleJoin = () => {
    if (!username || !code) return;
    
    const newPlayer = {
      id: Math.random().toString(36).substr(2, 9),
      username,
      avatar,
      score: 0,
      isReady: false,
      isHost: false,
    };
    
    setMe(newPlayer);
    setRoomCode(code);
    addPlayer(newPlayer);
    
    navigate(`/lobby/${code}`);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-2xl"
      >
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white/40 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Home</span>
        </button>

        <Card className="p-10">
          <h2 className="text-4xl font-black italic mb-8 uppercase tracking-tighter">Join the Battle</h2>
          
          <div className="space-y-8">
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Choose Your Identity</label>
              <Input
                placeholder="Enter Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="text-xl font-bold py-4"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Select Avatar</label>
              <AvatarPicker selected={avatar} onSelect={setAvatar} />
            </div>

            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Room Code</label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={20} />
                <Input
                  placeholder="000 000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="pl-12 text-2xl font-black tracking-[0.5em]"
                  maxLength={6}
                />
              </div>
            </div>

            <Button
              size="xl"
              className="w-full"
              disabled={!username || !code}
              onClick={handleJoin}
            >
              <Play fill="currentColor" />
              Enter Arena
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
