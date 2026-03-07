import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  PlusCircle, 
  BrainCircuit, 
  Trophy, 
  Zap, 
  ArrowLeft, 
  Sparkles, 
  Cpu, 
  Gamepad2, 
  Sword, 
  Target, 
  Shield, 
  Activity,
  ChevronRight,
  UserPlus,
  Flame,
  Star
} from 'lucide-react';
import { Button, Input, Card } from '../components/UI';
import { ParticleBackground } from '../components/ParticleBackground';
import { AVATARS, cn } from '../utils/constants';
import { useGameStore } from '../store/useGameStore';

// --- Sub-components ---

const LiveActivity = () => {
  const [activities, setActivities] = useState([
    { id: 1, text: "Player Neon_Ninja joined Room 4721", icon: UserPlus, color: "text-indigo-400" },
    { id: 2, text: "Quiz started in Science Arena", icon: Gamepad2, color: "text-emerald-400" },
    { id: 3, text: "Player Alex_Pro reached Rank #1", icon: Trophy, color: "text-yellow-400" },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const names = ["Zoe", "Max", "Luna", "Cipher", "Vortex", "Nova"];
      const rooms = ["1024", "8899", "4422", "7711"];
      const arenas = ["History", "Tech", "Space", "Music"];
      
      const newActivity = {
        id: Date.now(),
        text: Math.random() > 0.5 
          ? `Player ${names[Math.floor(Math.random() * names.length)]} joined Room ${rooms[Math.floor(Math.random() * rooms.length)]}`
          : `New battle started in ${arenas[Math.floor(Math.random() * arenas.length)]} Arena`,
        icon: Math.random() > 0.5 ? UserPlus : Sword,
        color: Math.random() > 0.5 ? "text-indigo-400" : "text-pink-400"
      };

      setActivities(prev => [newActivity, ...prev.slice(0, 4)]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed left-6 bottom-6 z-30 space-y-3 hidden lg:block w-72">
      <AnimatePresence initial={false}>
        {activities.map((activity) => (
          <motion.div
            key={activity.id}
            initial={{ x: -100, opacity: 0, scale: 0.8 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: -100, opacity: 0, scale: 0.8 }}
            className="bg-black/40 backdrop-blur-md border border-white/10 p-3 rounded-xl flex items-center gap-3 shadow-2xl"
          >
            <div className={cn("p-2 rounded-lg bg-white/5", activity.color)}>
              <activity.icon size={16} />
            </div>
            <span className="text-[11px] font-bold text-white/70 tracking-tight">{activity.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

const FloatingAvatar = ({ delay, x, y, username, score, rank, avatar }: any) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ 
      opacity: 1,
      y: [y, y - 30, y],
      x: [x, x + 20, x]
    }}
    transition={{ 
      duration: 6 + Math.random() * 4, 
      repeat: Infinity, 
      ease: "easeInOut",
      delay 
    }}
    className="absolute z-10 hidden md:block"
    style={{ left: x, top: y }}
  >
    <div className="group relative flex flex-col items-center">
      <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg text-center min-w-[100px] pointer-events-none">
        <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{username}</div>
        <div className="text-[9px] text-white/40 font-bold">{score} PTS • RANK #{rank}</div>
      </div>
      <div className="p-1.5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl group-hover:border-indigo-500/50 transition-colors">
        <img src={avatar} alt="Avatar" className="w-12 h-12 rounded-xl" referrerPolicy="no-referrer" />
        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-indigo-600 rounded-full border-2 border-black flex items-center justify-center text-[8px] font-black">
          {rank}
        </div>
      </div>
    </div>
  </motion.div>
);

const FeatureCard = ({ icon: Icon, title, desc, delay }: any) => (
  <motion.div
    initial={{ y: 50, opacity: 0 }}
    whileInView={{ y: 0, opacity: 1 }}
    viewport={{ once: true }}
    transition={{ delay }}
    whileHover={{ y: -10, scale: 1.02 }}
    className="group relative p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] overflow-hidden"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className="relative z-10">
      <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(99,102,241,0.2)]">
        <Icon className="text-indigo-400" size={28} />
      </div>
      <h3 className="text-xl font-black italic uppercase tracking-tight mb-3">{title}</h3>
      <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
    </div>
  </motion.div>
);

const GameModeCard = ({ icon: Icon, title, desc, color }: any) => (
  <motion.div
    whileHover={{ scale: 1.05, rotateY: 5 }}
    className={cn(
      "p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md cursor-pointer group transition-all",
      `hover:border-${color}-500/50`
    )}
  >
    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all group-hover:shadow-[0_0_15px_rgba(var(--color-rgb),0.5)]", `bg-${color}-500/20 text-${color}-400`)}>
      <Icon size={24} />
    </div>
    <h4 className="font-black italic uppercase tracking-widest text-sm mb-2">{title}</h4>
    <p className="text-[11px] text-white/40 font-bold leading-tight">{desc}</p>
  </motion.div>
);

// --- Main Page ---

export const LandingPage = () => {
  const navigate = useNavigate();
  const [showHostOptions, setShowHostOptions] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [username, setUsername] = useState('');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const floatingAvatars = useMemo(() => [
    { username: "Neon_Ninja", score: 4500, rank: 1, avatar: AVATARS[0], x: "10%", y: "20%" },
    { username: "Cipher_X", score: 3200, rank: 4, avatar: AVATARS[5], x: "85%", y: "15%" },
    { username: "Vortex_99", score: 2800, rank: 7, avatar: AVATARS[8], x: "15%", y: "70%" },
    { username: "Luna_Star", score: 4100, rank: 2, avatar: AVATARS[12], x: "80%", y: "65%" },
    { username: "Max_Power", score: 3900, rank: 3, avatar: AVATARS[15], x: "50%", y: "10%" },
  ], []);

  return (
    <div className="min-h-screen bg-[#020205] text-white overflow-x-hidden relative selection:bg-indigo-500/30">
      <ParticleBackground />
      <LiveActivity />

      {/* Cursor Glow */}
      <div 
        className="fixed pointer-events-none z-50 w-[400px] h-[400px] rounded-full bg-indigo-600/10 blur-[100px] -translate-x-1/2 -translate-y-1/2 transition-transform duration-100"
        style={{ left: mousePos.x, top: mousePos.y }}
      />

      {/* Floating Avatars */}
      {floatingAvatars.map((av, i) => (
        <FloatingAvatar key={i} {...av} delay={i * 0.5} />
      ))}

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20">
        {/* Animated Grid */}
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
          style={{ 
            backgroundImage: `linear-gradient(to right, #4f46e5 1px, transparent 1px), linear-gradient(to bottom, #4f46e5 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
            transform: `perspective(1000px) rotateX(60deg) translateY(${mousePos.y * 0.02}px)`
          }} 
        />

        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 text-center mb-16"
        >
          <motion.div 
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-black uppercase tracking-[0.3em] mb-8 shadow-[0_0_30px_rgba(99,102,241,0.3)]"
          >
            <Activity size={14} className="animate-pulse" />
            <span>Real-Time Multiplayer Quiz Battles</span>
          </motion.div>
          
          <h1 className="text-8xl md:text-[12rem] font-black tracking-tighter mb-4 leading-none select-none italic">
            <span className="bg-gradient-to-b from-white via-white to-indigo-500/50 bg-clip-text text-transparent">Adaptive</span>
            <motion.span 
              animate={{ opacity: [1, 0.8, 1], scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-indigo-500 drop-shadow-[0_0_40px_rgba(99,102,241,0.6)]"
            >
              IQ
            </motion.span>
          </h1>
          
          <p className="text-lg md:text-2xl text-white/40 max-w-2xl mx-auto font-medium tracking-tight">
            Enter the arena. Outsmart the competition. <br />
            <span className="text-white/80">The ultimate AI-powered battleground.</span>
          </p>
        </motion.div>

        {/* Join Panel / Game Terminal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="relative z-20 w-full max-w-xl"
        >
          <Card className="p-1 !bg-white/5 backdrop-blur-3xl border-white/10 rounded-[40px] shadow-2xl overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-transparent to-pink-600/10 opacity-50" />
            <div className="relative p-8 md:p-12">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <Gamepad2 size={20} className="text-white" />
                  </div>
                  <span className="text-sm font-black italic uppercase tracking-widest">Battle Terminal</span>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse delay-75" />
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse delay-150" />
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="relative group/avatar cursor-pointer" onClick={() => navigate('/join')}>
                    <div className="w-24 h-24 rounded-[2rem] bg-indigo-500/10 border-2 border-dashed border-indigo-500/30 flex items-center justify-center overflow-hidden group-hover/avatar:border-indigo-500 transition-colors">
                      <img src={AVATARS[0]} className="w-20 h-20 rounded-2xl" alt="Preview" referrerPolicy="no-referrer" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-indigo-600 p-1.5 rounded-lg shadow-lg">
                      <PlusCircle size={14} />
                    </div>
                  </div>
                  <div className="flex-1 w-full space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Username</label>
                      <Input 
                        placeholder="PLAYER_NAME" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="!bg-black/40 !border-white/5 !rounded-2xl font-black italic text-indigo-400 placeholder:text-white/10"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Room Code</label>
                      <Input 
                        placeholder="000000" 
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                        className="!bg-black/40 !border-white/5 !rounded-2xl font-black tracking-[0.5em] text-center placeholder:text-white/10"
                        maxLength={6}
                      />
                    </div>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {!showHostOptions ? (
                    <motion.div
                      key="main-btns"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex flex-col gap-3"
                    >
                      <Button 
                        size="xl" 
                        onClick={() => navigate('/join')}
                        className="w-full !rounded-2xl bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_30px_rgba(79,70,229,0.4)] group"
                      >
                        <Sword size={20} className="group-hover:rotate-12 transition-transform" />
                        Join Battle
                      </Button>
                      <Button 
                        size="xl" 
                        variant="ghost"
                        onClick={() => setShowHostOptions(true)}
                        className="w-full !rounded-2xl border border-white/5 hover:bg-white/5"
                      >
                        Host Game
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="host-btns"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <Button 
                          variant="outline" 
                          className="!rounded-2xl h-24 flex-col gap-2 border-white/10 hover:bg-white/5"
                          onClick={() => navigate('/create')}
                        >
                          <PlusCircle size={24} className="text-indigo-400" />
                          <span className="text-xs font-black uppercase italic">Manual</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          className="!rounded-2xl h-24 flex-col gap-2 border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10"
                          onClick={() => navigate('/ai-generate')}
                        >
                          <BrainCircuit size={24} className="text-indigo-400" />
                          <span className="text-xs font-black uppercase italic">AI Generate</span>
                        </Button>
                      </div>
                      <button 
                        onClick={() => setShowHostOptions(false)}
                        className="w-full flex items-center justify-center gap-2 text-white/30 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
                      >
                        <ArrowLeft size={12} />
                        Back to Terminal
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </Card>
        </motion.div>
      </section>

      {/* Game Modes Section */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col items-center mb-20 text-center">
          <h2 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter mb-4">Select Your Mode</h2>
          <div className="w-24 h-1 bg-indigo-500 rounded-full mb-6" />
          <p className="text-white/40 font-medium max-w-xl">Choose how you want to dominate. From classic trivia to AI-driven adaptive challenges.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GameModeCard 
            icon={Zap} 
            title="Classic Quiz" 
            desc="The traditional battle. Fast-paced questions, instant leaderboard updates." 
            color="indigo"
          />
          <GameModeCard 
            icon={Sword} 
            title="Battle Mode" 
            desc="1v1 or team-based combat. Use power-ups to disrupt your opponents." 
            color="pink"
          />
          <GameModeCard 
            icon={BrainCircuit} 
            title="AI Adaptive" 
            desc="The quiz evolves with you. Questions get harder as you perform better." 
            color="emerald"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <FeatureCard 
            icon={Shield} 
            title="Adaptive Difficulty" 
            desc="Our neural engine analyzes your performance in real-time to keep the challenge perfectly balanced." 
            delay={0.1}
          />
          <FeatureCard 
            icon={BrainCircuit} 
            title="AI Quiz Generator" 
            desc="Generate infinite quizzes on any topic instantly using the power of Gemini AI." 
            delay={0.2}
          />
          <FeatureCard 
            icon={Users} 
            title="Multiplayer Battles" 
            desc="Compete with up to 100 players in a single room with zero latency and real-time ranking." 
            delay={0.3}
          />
        </div>
      </section>

      {/* Live Leaderboard Preview */}
      <section className="py-32 px-6 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[40px] p-12 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
          
          <div className="flex items-center justify-center gap-3 mb-12">
            <Trophy className="text-yellow-500" size={32} />
            <h2 className="text-4xl font-black italic uppercase tracking-tighter">Hall of Fame</h2>
          </div>

          <div className="space-y-4">
            {[
              { name: 'Aryan_IQ', score: 9500, avatar: AVATARS[0], trend: 'up' },
              { name: 'Riya_Master', score: 9100, avatar: AVATARS[1], trend: 'up' },
              { name: 'Kabir_X', score: 8900, avatar: AVATARS[2], trend: 'down' },
            ].map((p, i) => (
              <motion.div
                key={i}
                initial={{ x: -20, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-4 p-5 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all"
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-black text-black",
                  i === 0 ? "bg-yellow-500" : i === 1 ? "bg-slate-300" : "bg-amber-600"
                )}>
                  {i + 1}
                </div>
                <img src={p.avatar} className="w-12 h-12 rounded-xl" referrerPolicy="no-referrer" />
                <div className="flex-1 text-left">
                  <div className="font-black italic uppercase tracking-widest text-sm">{p.name}</div>
                  <div className="text-[10px] text-white/40 font-bold">LEGENDARY STATUS</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-indigo-400">{p.score}</div>
                  <div className="text-[9px] text-emerald-400 font-black uppercase flex items-center justify-end gap-1">
                    <Flame size={10} />
                    On Fire
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <Button variant="ghost" className="mt-12 text-white/40 hover:text-white">
            View Global Rankings
            <ChevronRight size={16} />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-white/5 text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="text-xl font-black italic uppercase tracking-tighter">AdaptiveIQ</span>
        </div>
        <p className="text-white/20 text-xs font-bold uppercase tracking-[0.5em] mb-8">The Future of Competitive Learning</p>
        <div className="flex justify-center gap-8 text-white/40 text-[10px] font-black uppercase tracking-widest">
          <a href="#" className="hover:text-indigo-400 transition-colors">Privacy</a>
          <a href="#" className="hover:text-indigo-400 transition-colors">Terms</a>
          <a href="#" className="hover:text-indigo-400 transition-colors">Support</a>
          <a href="#" className="hover:text-indigo-400 transition-colors">Discord</a>
        </div>
      </footer>
    </div>
  );
};


