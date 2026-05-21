import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useParams } from 'react-router-dom';
import { Trophy, Zap, CheckCircle2, XCircle, Shield, Users, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useGameStore } from '../store/useGameStore';
import { AnswerButton } from '../components/AnswerButton';
import { QuizTimer } from '../components/QuizTimer';
import { LeaderboardCard } from '../components/LeaderboardCard';
import { Button, Card } from '../components/UI';
import { cn } from '../utils/constants';
import socket from '../services/socket';

export const GamePage = () => {
  const navigate = useNavigate();
  const { code } = useParams();
  const { currentQuiz, currentQuestionIndex, status, players, me } = useGameStore();

  const isHost = Boolean(me?.isHost);
  const contestants = players.filter((player) => !player.isHost);

  const [timeLeft, setTimeLeft] = useState(15);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showInlineReveal, setShowInlineReveal] = useState(false);

  const currentQuestion = currentQuiz?.questions[currentQuestionIndex];
  const answeredCount = contestants.filter((player) => player.answers?.some((answer) => answer.questionIndex === currentQuestionIndex)).length;

  const liveAccuracy = contestants.length > 0
    ? Math.round((contestants.reduce((sum, player) => sum + (player.correctAnswers || 0), 0) / Math.max(contestants.reduce((sum, player) => sum + (player.totalAttempted || 0), 0), 1)) * 100)
    : 0;

  const liveAverageSpeed = contestants.reduce((sum, player) => {
    const currentAnswer = [...(player.answers || [])].reverse().find((answer) => answer.questionIndex === currentQuestionIndex);
    return sum + (currentAnswer?.timeSpent || 0);
  }, 0);

  const liveAverageSpeedValue = answeredCount > 0 ? Number((liveAverageSpeed / answeredCount).toFixed(1)) : 0;

  const accuracyData = (currentQuiz?.questions || []).slice(0, 6).map((question, index) => {
    const attempts = contestants.flatMap((player) => player.answers || []).filter((answer) => answer.questionIndex === index);
    const correct = attempts.filter((answer) => answer.isCorrect).length;
    return {
      name: `Q${index + 1}`,
      accuracy: attempts.length > 0 ? Math.round((correct / attempts.length) * 100) : 0,
    };
  });

  const responseTimeData = (currentQuiz?.questions || []).slice(0, 6).map((question, index) => {
    const attempts = contestants.flatMap((player) => player.answers || []).filter((answer) => answer.questionIndex === index);
    const totalTime = attempts.reduce((sum, answer) => sum + (answer.timeSpent || 0), 0);
    return {
      name: `Q${index + 1}`,
      time: attempts.length > 0 ? Number((totalTime / attempts.length).toFixed(1)) : 0,
    };
  });

  const topPlayers = [...contestants].sort((a, b) => b.score - a.score).slice(0, 5);

  useEffect(() => {
    if (status === 'finished') {
      navigate('/results');
    }
  }, [status, navigate]);

  useEffect(() => {
    if (status === 'leaderboard') {
      const my = players.find((p) => p.id === me?.id);
      console.debug('GamePage: revealing answers', { status, myLastAnswerCorrect: my?.lastAnswerCorrect, meId: me?.id });
      setIsCorrect(my?.lastAnswerCorrect ?? false);
      setShowFeedback(true);
    }
  }, [status, players, me]);

  useEffect(() => {
    if (status === 'leaderboard' && !isHost) {
      setShowInlineReveal(true);
      const timer = setTimeout(() => setShowInlineReveal(false), 1700);
      return () => clearTimeout(timer);
    }

    if (status !== 'leaderboard') {
      setShowInlineReveal(false);
    }
  }, [status, isHost, currentQuestionIndex]);

  useEffect(() => {
    if (status === 'question') {
      setTimeLeft(currentQuestion?.timeLimit || 15);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setIsCorrect(null);
    }
  }, [currentQuestionIndex, status]);

  const submitAnswerToServer = useCallback((index: number) => {
    if (isHost) return;

    const timeSpent = (currentQuestion?.timeLimit || 15) - timeLeft;
    const correct = index === currentQuestion?.correctAnswer;
    const score = correct ? 1000 + (timeLeft * 50) : 0;

    socket.emit('submit_answer', {
      roomCode: code,
      playerId: me?.id,
      selectedAnswer: index,
      correctAnswer: currentQuestion?.correctAnswer,
      isCorrect: correct,
      timeSpent,
      score,
    });
  }, [currentQuestion, timeLeft, code, me, isHost]);

  const handleAnswerSubmit = useCallback((index: number) => {
    if (showFeedback || isHost || selectedAnswer !== null) return;
    setSelectedAnswer(index);
    submitAnswerToServer(index);
  }, [showFeedback, isHost, selectedAnswer, submitAnswerToServer]);

  useEffect(() => {
    if (status === 'question' && timeLeft > 0 && !showFeedback) {
      const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }

    if (status === 'question' && timeLeft === 0 && !showFeedback) {
      if (isHost) {
        socket.emit('show_leaderboard', { roomCode: code });
      } else {
        if (selectedAnswer === null) setSelectedAnswer(-1);
        submitAnswerToServer(-1);
      }
    }
  }, [status, timeLeft, showFeedback, isHost, code, selectedAnswer, submitAnswerToServer]);

  const nextQuestion = () => {
    socket.emit('next_question', { roomCode: code });
  };

  const sortedPlayers = [...contestants].sort((a, b) => b.score - a.score);

  if (status === 'starting') {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <h2 className="text-8xl font-black italic mb-4 animate-bounce">GET READY!</h2>
          <p className="text-indigo-400 text-xl font-bold tracking-widest uppercase">Battle starting in 3...</p>
        </motion.div>
      </div>
    );
  }

  const shouldKeepStudentOnQuestion = status === 'leaderboard' && !isHost && showInlineReveal;

  if (status === 'leaderboard' && (isHost || !shouldKeepStudentOnQuestion)) {
    return (
      <div className="min-h-screen bg-[#050505] p-6 flex flex-col items-center">
        <div className="w-full max-w-3xl">
          <div className="flex items-center justify-between mb-12 gap-4 flex-wrap">
            <div>
              <h2 className="text-4xl font-black italic uppercase tracking-tighter">Leaderboard</h2>
              <p className="text-white/40">
                {isHost ? 'Advance to the next round when you are ready.' : 'Waiting for the host to continue.'}
              </p>
            </div>
            <div className="px-4 py-2 bg-white/5 rounded-full text-xs font-bold text-white/40">
              QUESTION {currentQuestionIndex + 1} OF {currentQuiz?.questions?.length ?? 0}
            </div>
          </div>

          <div className="space-y-4 mb-12">
            {sortedPlayers.map((player, i) => (
              <LeaderboardCard key={player.id} player={player} rank={i + 1} />
            ))}
          </div>

          {isHost ? (
            <Button size="lg" className="w-full" onClick={nextQuestion}>
              {currentQuestionIndex + 1 < (currentQuiz?.questions?.length ?? 0) ? 'Next Question' : 'Show Final Results'}
              <Zap size={20} fill="currentColor" />
            </Button>
          ) : (
            <div className="text-center text-white/40 text-sm font-bold uppercase tracking-widest py-4">
              Waiting for host to continue
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isHost) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col">
        <div className="p-6 flex items-center justify-between bg-white/5 border-b border-white/10">
          <div className="flex items-center gap-6">
            <div className="bg-indigo-500 px-4 py-2 rounded-xl font-black italic flex items-center gap-2">
              <Shield size={16} />
              HOST
            </div>
            <div className="hidden md:block">
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Current Quiz</div>
              <div className="font-bold">{currentQuiz?.title}</div>
            </div>
          </div>

          <div className="absolute left-1/2 -translate-x-1/2">
            <QuizTimer current={timeLeft} total={currentQuestion?.timeLimit || 15} />
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Monitor Mode</div>
              <div className="text-xl font-black text-indigo-400">{contestants.length} Players</div>
            </div>
            <Activity className="text-yellow-500" />
          </div>
        </div>

        <main className="flex-1 p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-8 flex flex-col justify-between min-h-[420px]">
            <div>
              <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
                <div className="px-4 py-2 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-black uppercase tracking-widest">
                  Question {currentQuestionIndex + 1}
                </div>
                <div className="text-white/40 text-sm font-bold uppercase tracking-widest">
                  {currentQuestion?.timeLimit || 15}s timer
                </div>
              </div>
              <h2 className="text-3xl md:text-5xl font-black mb-10 leading-tight">
                {currentQuestion?.text}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQuestion?.options.map((option, i) => (
                  <div key={i} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left text-white/80 font-bold">
                    <span className="mr-3 text-indigo-400">{String.fromCharCode(65 + i)}.</span>
                    {option}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={() => { setShowFeedback(true); socket.emit('show_leaderboard', { roomCode: code }); }} disabled={showFeedback}>
                End Round
              </Button>
              <Button variant="outline" onClick={nextQuestion}>
                Skip to Next
              </Button>
            </div>
          </Card>

          <Card className="p-8 space-y-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter">Live Leaderboard</h3>
                <p className="text-white/40 text-sm">Scores update in real time as students answer.</p>
              </div>
              <Users className="text-indigo-400" />
            </div>
            <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
              {sortedPlayers.map((player, index) => (
                <LeaderboardCard key={player.id} player={player} rank={index + 1} />
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Answered</div>
                <div className="mt-2 text-2xl font-black text-indigo-400">{answeredCount}/{contestants.length}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Accuracy</div>
                <div className="mt-2 text-2xl font-black text-emerald-400">{liveAccuracy}%</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Avg Speed</div>
                <div className="mt-2 text-2xl font-black text-pink-400">{liveAverageSpeedValue}s</div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <h4 className="mb-3 text-sm font-bold uppercase tracking-widest text-white/40">Question Accuracy</h4>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={accuracyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                      <XAxis dataKey="name" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff10', borderRadius: '12px' }} />
                      <Bar dataKey="accuracy" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <h4 className="mb-3 text-sm font-bold uppercase tracking-widest text-white/40">Response Speed</h4>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={responseTimeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                      <XAxis dataKey="name" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff10', borderRadius: '12px' }} />
                      <Line type="monotone" dataKey="time" stroke="#ec4899" strokeWidth={4} dot={{ r: 4, fill: '#ec4899' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-bold uppercase tracking-widest text-white/40">Top Performers</h4>
              <div className="space-y-3">
                {topPlayers.map((player, index) => (
                  <div key={player.id} className="flex items-center justify-between rounded-2xl bg-white/5 p-4">
                    <div className="flex items-center gap-3">
                      <span className="w-8 text-white/40 font-black">#{index + 1}</span>
                      <img src={player.avatar} className="h-9 w-9 rounded-xl" referrerPolicy="no-referrer" />
                      <div>
                        <div className="font-bold">{player.username}</div>
                        <div className="text-xs text-white/40">{player.correctAnswers || 0} correct</div>
                      </div>
                    </div>
                    <div className="text-indigo-400 font-black">{player.score}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </main>

        <div className="h-2 bg-white/5 w-full">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((currentQuestionIndex + 1) / (currentQuiz?.questions?.length || 1)) * 100}%` }}
            className="h-full bg-indigo-500"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col">
      <div className="sticky top-0 z-20 border-b border-white/10 bg-[#050505]/95 backdrop-blur-xl">
        <div className="mx-auto grid max-w-5xl grid-cols-3 items-center gap-3 px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-1">
            <div className="inline-flex w-fit rounded-xl bg-indigo-500 px-3 py-1.5 text-sm font-black italic">Q{currentQuestionIndex + 1}</div>
            <div className="hidden sm:block text-[10px] font-bold uppercase tracking-widest text-white/40">Current Quiz</div>
            <div className="hidden sm:block truncate font-bold">{currentQuiz?.title}</div>
          </div>

          <div className="flex justify-center">
            <div className="sm:block hidden">
              <QuizTimer current={timeLeft} total={currentQuestion?.timeLimit || 15} />
            </div>
            <div className="sm:hidden rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Time</div>
              <div className="text-xl font-black text-indigo-400">{timeLeft}s</div>
            </div>
          </div>

          <div className="flex justify-end">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="text-right">
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Score</div>
                <div className="text-lg font-black text-indigo-400">{me?.score || 0}</div>
              </div>
              <Trophy className="text-yellow-500" />
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-5xl flex-1 items-center px-4 py-6 sm:px-6 sm:py-10">
        <AnimatePresence mode="wait">
          <motion.div key="question" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="w-full">
            <Card className="mb-6 p-5 sm:p-8">
              <div className="mb-4 flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-widest text-white/40">
                <span>Answer on your device</span>
                <span>{currentQuestionIndex + 1}/{currentQuiz?.questions?.length || 0}</span>
              </div>
              <h2 className="text-2xl font-black leading-tight sm:text-4xl md:text-5xl">{currentQuestion?.text}</h2>

              {shouldKeepStudentOnQuestion && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    x: isCorrect ? [0, -4, 4, 0] : [0, -10, 10, -6, 6, 0],
                  }}
                  transition={{ duration: 0.5 }}
                  className="mt-5"
                >
                  <div className={cn(
                    'inline-flex items-center rounded-full px-4 py-2 text-sm font-black uppercase tracking-widest',
                    isCorrect ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40' : 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                  )}>
                    {isCorrect ? 'Correct' : 'Wrong'}
                  </div>
                </motion.div>
              )}
            </Card>

            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              {currentQuestion?.options.map((option, i) => {
                const inlineRevealActive = shouldKeepStudentOnQuestion;
                const correctIndex = currentQuestion?.correctAnswer;
                const isCorrectOption = inlineRevealActive && typeof correctIndex === 'number' && i === correctIndex;
                const isSelectedWrong = inlineRevealActive && selectedAnswer !== null && selectedAnswer >= 0 && i === selectedAnswer && i !== correctIndex;
                const shouldDim = inlineRevealActive && !isCorrectOption && !isSelectedWrong;

                return (
                  <motion.div
                    key={i}
                    animate={
                      isCorrectOption
                        ? { y: [0, -8, -4], scale: [1, 1.04, 1.02], opacity: 1 }
                        : isSelectedWrong
                          ? { y: [0, 5, 3], scale: [1, 0.93, 0.95], opacity: [1, 0.72, 0.8] }
                          : shouldDim
                            ? { scale: 0.95, opacity: 0.35 }
                            : { scale: 1, opacity: 1, y: 0 }
                    }
                    transition={{ duration: 0.45 }}
                  >
                    <AnswerButton
                      text={option}
                      index={i}
                      onClick={() => handleAnswerSubmit(i)}
                      disabled={selectedAnswer !== null || inlineRevealActive}
                      isSelected={selectedAnswer === i}
                      isCorrect={isCorrectOption}
                      isWrong={shouldDim}
                      className={cn(
                        'min-h-[92px] sm:min-h-[104px] transition-all duration-300',
                        isCorrectOption && 'ring-4 ring-emerald-300 shadow-[0_0_34px_rgba(52,211,153,0.5)]',
                        isSelectedWrong && 'ring-4 ring-rose-400 shadow-inner brightness-75'
                      )}
                    />
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      <div className="h-2 w-full bg-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${((currentQuestionIndex + 1) / (currentQuiz?.questions?.length || 1)) * 100}%` }}
          className="h-full bg-indigo-500"
        />
      </div>
    </div>
  );
};
