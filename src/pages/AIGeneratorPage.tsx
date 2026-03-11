import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { BrainCircuit, Sparkles, Wand2, ArrowLeft, Loader2 } from 'lucide-react';
import { Button, Input, Card } from '../components/UI';
import { generateQuiz } from '../services/geminiService';
import { useGameStore } from '../store/useGameStore';
import { cn } from '../utils/constants';
import socket from '../services/socket';
import { AVATARS } from '../utils/constants';

export const AIGeneratorPage = () => {
  const navigate = useNavigate();
  const { setCurrentQuiz, setRoomCode, setMe } = useGameStore();
  
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState('Medium');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!topic) return;
    setIsLoading(true);
    try {
      const quiz = await generateQuiz(topic, count, difficulty);
      setCurrentQuiz(quiz);
      
      // Auto-host a game with this quiz
      const code = Math.random().toString(36).substr(2, 6).toUpperCase();
      const hostPlayer = {
        id: Math.random().toString(36).substr(2, 9),
        username: 'Host_AI',
        avatar: AVATARS[0],
        score: 0,
        isReady: true,
        isHost: true,
      };

      setMe(hostPlayer);
      setRoomCode(code);
      
      socket.emit('join_room', { roomCode: code, player: hostPlayer });
      socket.emit('set_quiz', { roomCode: code, quiz });
      
      navigate(`/lobby/${code}`);
    } catch (error) {
      console.error('Failed to generate quiz:', error);
      alert('AI generation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6">
      <div className="max-w-3xl mx-auto pt-12">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white/40 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Home</span>
        </button>

        <div className="flex items-center gap-4 mb-12">
          <div className="w-16 h-16 bg-indigo-500/20 rounded-3xl flex items-center justify-center">
            <BrainCircuit size={32} className="text-indigo-400" />
          </div>
          <div>
            <h2 className="text-4xl font-black italic uppercase tracking-tighter">AI Quiz Generator</h2>
            <p className="text-white/40">Powered by Groq AI</p>
          </div>
        </div>

        <Card className="p-10 space-y-8">
          <div>
            <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-3">What's the topic?</label>
            <Input
              placeholder="e.g. Quantum Physics, 90s Hip Hop, Marvel Movies..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="text-xl font-bold py-4"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Number of Questions</label>
              <Input
                type="number"
                min="1"
                max="50"
                placeholder="Enter number of questions"
                value={count}
                onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 5))}
                className="text-xl font-bold py-4"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Difficulty Level</label>
              <div className="flex gap-2">
                {['Easy', 'Medium', 'Hard'].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={cn(
                      "flex-1 py-3 rounded-xl font-bold border transition-all",
                      difficulty === d ? "bg-indigo-500 border-indigo-500 text-white" : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button
            size="xl"
            className="w-full"
            onClick={handleGenerate}
            disabled={isLoading || !topic}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" />
                Generating Magic...
              </>
            ) : (
              <>
                <Wand2 />
                Generate Quiz
              </>
            )}
          </Button>

          <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 flex gap-4 items-start">
            <Sparkles className="text-indigo-400 flex-shrink-0 mt-1" size={20} />
            <p className="text-sm text-indigo-300/80 leading-relaxed">
              Our AI will research the topic and create unique, challenging questions with adaptive difficulty. This might take a few seconds.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
