import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useParams, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { Share2, Play, Settings, LogOut, Info, Users, QrCode, Copy, Pencil } from 'lucide-react';
import { Button, Card } from '../components/UI';
import { PlayerCard } from '../components/PlayerCard';
import { useGameStore } from '../store/useGameStore';
import socket from '../services/socket';

export const LobbyPage = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { players, me, setCurrentQuiz, currentQuiz, status } = useGameStore();
  const [qrDataUrl, setQrDataUrl] = useState('');
  const contestants = players.filter((player) => !player.isHost);

  const inviteLink = `${window.location.origin}/join?code=${code ?? ''}`;

  // NOTE: Removed automatic MOCK_QUIZ fallback to avoid overwriting
  // real quizzes (e.g. AI-generated or saved quizzes). The host
  // should explicitly set or edit a quiz via the Create/AIGenerator flow.

  useEffect(() => {
    if (status === 'starting' || status === 'question') {
      navigate(`/game/${code}`);
    }
  }, [status, navigate, code]);

  useEffect(() => {
    if (!code) return;

    QRCode.toDataURL(inviteLink, {
      width: 320,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#ffffff',
        light: '#00000000',
      },
    })
      .then(setQrDataUrl)
      .catch((error) => console.warn('Could not generate QR code:', error));
  }, [code, inviteLink]);

  const handleStart = () => {
    if (!me?.isHost) return;
    socket.emit('start_game', { roomCode: code });
  };

  const handleCopyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
    } catch (error) {
      console.warn('Could not copy invite link:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Left Sidebar: Quiz Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 text-indigo-400 mb-4">
              <Info size={18} />
              <span className="text-xs font-bold uppercase tracking-widest">Quiz Details</span>
            </div>
            <h3 className="text-2xl font-black mb-2">{currentQuiz?.title}</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Category</span>
                <span className="font-bold">{currentQuiz?.category}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Difficulty</span>
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-bold text-[10px] uppercase">
                  {currentQuiz?.difficulty}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Questions</span>
                <span className="font-bold">{currentQuiz?.questions?.length ?? 0}</span>
              </div>
            </div>
          </Card>

          {me?.isHost && (
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/create')}>
              <Pencil size={18} />
              Edit Quiz
            </Button>
          )}

          <Button variant="outline" className="w-full justify-start">
            <Settings size={18} />
            Game Settings
          </Button>
          <Button variant="ghost" className="w-full justify-start text-rose-500 hover:bg-rose-500/10" onClick={() => navigate('/')}>
            <LogOut size={18} />
            Leave Room
          </Button>
        </div>

        {/* Main Area: Players Grid */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-4xl font-black italic uppercase tracking-tighter">Game Lobby</h2>
              <p className="text-white/40">{me?.isHost ? 'Share the QR code and start when everyone is ready.' : 'Waiting for the host to begin the game.'}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-3 flex items-center gap-4">
              <div className="text-right">
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Room Code</div>
                <div className="text-2xl font-black tracking-widest text-indigo-400">{code}</div>
              </div>
              <button className="p-2 hover:bg-white/10 rounded-xl transition-colors" onClick={handleCopyInvite}>
                <Share2 size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {contestants.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
            {[...Array(Math.max(0, 8 - contestants.length))].map((_, i) => (
              <div key={i} className="aspect-square rounded-3xl border-2 border-dashed border-white/5 flex items-center justify-center">
                <Users className="text-white/5" size={32} />
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar: Actions */}
        <div className="lg:col-span-1 space-y-6 sticky top-6 self-start">
          <Card className="p-6 text-center">
            <div className="flex items-center gap-2 text-indigo-400 mb-4 justify-center">
              <QrCode size={18} />
              <span className="text-xs font-bold uppercase tracking-widest">Scan to Join</span>
            </div>
            <div className="mx-auto w-56 h-56 rounded-3xl bg-black/40 border border-white/10 flex items-center justify-center p-4 mb-4 overflow-hidden">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt={`Join room ${code}`} className="w-full h-full object-contain" />
              ) : (
                <div className="text-white/30 text-sm font-bold">Generating QR...</div>
              )}
            </div>
            <div className="text-xs text-white/40 mb-3 break-all">{inviteLink}</div>
            <Button variant="outline" className="w-full" onClick={handleCopyInvite}>
              <Copy size={16} />
              Copy Invite Link
            </Button>
          </Card>

          <Card className="p-8 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mb-6">
              <Users size={32} className="text-indigo-400" />
            </div>
            <h4 className="text-3xl font-black mb-2">{contestants.length}</h4>
            <p className="text-white/40 text-sm mb-8">Players Joined</p>

            <Button
              size="lg"
              className="w-full mb-4"
              onClick={handleStart}
              disabled={contestants.length === 0 || !me?.isHost}
            >
              <Play fill="currentColor" />
              Start Battle
            </Button>
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
              {me?.isHost ? 'Only host can start' : 'Waiting for host to start'}
            </p>
          </Card>
        </div>

      </div>
    </div>
  );
};
