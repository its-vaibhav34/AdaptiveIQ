import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Zap, Timer, CheckCircle2, XCircle } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { AnswerButton } from '../components/AnswerButton';
import { QuizTimer } from '../components/QuizTimer';
import { LeaderboardCard } from '../components/LeaderboardCard';
import { Button } from '../components/UI';
import { cn } from '../utils/constants';

export const GamePage = () => {
  const navigate = useNavigate();
  const { 
    currentQuiz, 
    currentQuestionIndex, 
    setCurrentQuestionIndex, 
    status, 
    setStatus,
    players,
    updatePlayerScore,
    me
  } = useGameStore();

  const [timeLeft, setTimeLeft] = useState(15);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const currentQuestion = currentQuiz?.questions[currentQuestionIndex];

  useEffect(() => {
    if (status === 'starting') {
      const timer = setTimeout(() => setStatus('question'), 3000);
      return () => clearTimeout(timer);
    }
  }, [status, setStatus]);

  useEffect(() => {
    if (status === 'question' && timeLeft > 0 && !showFeedback) {
      const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && !showFeedback) {
      handleAnswerSubmit(-1); // Time out
    }
  }, [status, timeLeft, showFeedback]);

  const handleAnswerSubmit = (index: number) => {
    if (showFeedback) return;
    
    setSelectedAnswer(index);
    const correct = index === currentQuestion?.correctAnswer;
    setIsCorrect(correct);
    setShowFeedback(true);

    if (correct && me) {
      // Simple score calc: base 1000 + speed bonus
      const score = 1000 + (timeLeft * 50);
      updatePlayerScore(me.id, score, true);
    } else if (me) {
      updatePlayerScore(me.id, 0, false);
    }

    // After 3 seconds, show leaderboard
    setTimeout(() => {
      setStatus('leaderboard');
    }, 3000);
  };

  const nextQuestion = () => {
    if (!currentQuiz) return;
    
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setTimeLeft(15);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setStatus('question');
    } else {
      setStatus('finished');
      navigate('/results');
    }
  };

  if (status === 'starting') {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <h2 className="text-8xl font-black italic mb-4 animate-bounce">GET READY!</h2>
          <p className="text-indigo-400 text-xl font-bold tracking-widest uppercase">Battle starting in 3...</p>
        </motion.div>
      </div>
    );
  }

  if (status === 'leaderboard') {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    
    return (
      <div className="min-h-screen bg-[#050505] p-6 flex flex-col items-center">
        <div className="w-full max-w-2xl">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-4xl font-black italic uppercase tracking-tighter">Leaderboard</h2>
            <div className="px-4 py-2 bg-white/5 rounded-full text-xs font-bold text-white/40">
              QUESTION {currentQuestionIndex + 1} OF {currentQuiz?.questions.length}
            </div>
          </div>

          <div className="space-y-4 mb-12">
            {sortedPlayers.map((player, i) => (
              <LeaderboardCard key={player.id} player={player} rank={i + 1} />
            ))}
          </div>

          <Button size="lg" className="w-full" onClick={nextQuestion}>
            Next Question
            <Zap size={20} fill="currentColor" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col">
      {/* Top Bar */}
      <div className="p-6 flex items-center justify-between bg-white/5 border-b border-white/10">
        <div className="flex items-center gap-6">
          <div className="bg-indigo-500 px-4 py-2 rounded-xl font-black italic">
            Q{currentQuestionIndex + 1}
          </div>
          <div className="hidden md:block">
            <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Current Quiz</div>
            <div className="font-bold">{currentQuiz?.title}</div>
          </div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2">
          <QuizTimer current={timeLeft} total={15} />
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Your Score</div>
            <div className="text-xl font-black text-indigo-400">{me?.score || 0}</div>
          </div>
          <Trophy className="text-yellow-500" />
        </div>
      </div>

      {/* Question Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-5xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {!showFeedback ? (
            <motion.div
              key="question"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="w-full text-center"
            >
              <h2 className="text-3xl md:text-5xl font-black mb-16 leading-tight">
                {currentQuestion?.text}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {currentQuestion?.options.map((option, i) => (
                  <AnswerButton
                    key={i}
                    text={option}
                    index={i}
                    onClick={() => handleAnswerSubmit(i)}
                    disabled={selectedAnswer !== null}
                    isSelected={selectedAnswer === i}
                  />
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="feedback"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center"
            >
              <div className={cn(
                "w-32 h-32 rounded-full flex items-center justify-center mb-8 shadow-2xl",
                isCorrect ? "bg-emerald-500 shadow-emerald-500/50" : "bg-rose-500 shadow-rose-500/50"
              )}>
                {isCorrect ? <CheckCircle2 size={64} /> : <XCircle size={64} />}
              </div>
              <h3 className={cn(
                "text-6xl font-black italic uppercase mb-4",
                isCorrect ? "text-emerald-400" : "text-rose-400"
              )}>
                {isCorrect ? "CORRECT!" : "WRONG!"}
              </h3>
              <p className="text-white/60 text-xl font-bold">
                {isCorrect ? `+${1000 + (timeLeft * 50)} Points` : "Better luck next time!"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Progress Bar */}
      <div className="h-2 bg-white/5 w-full">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${((currentQuestionIndex + 1) / (currentQuiz?.questions.length || 1)) * 100}%` }}
          className="h-full bg-indigo-500"
        />
      </div>
    </div>
  );
};
