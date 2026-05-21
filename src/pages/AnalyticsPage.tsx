import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { ArrowLeft, BarChart3 as BarChartIcon, TrendingUp, Target, Clock, Award } from 'lucide-react';
import { Button, Card } from '../components/UI';
import { useGameStore } from '../store/useGameStore';

export const AnalyticsPage = () => {
  const navigate = useNavigate();
  const { players, currentQuiz, currentQuestionIndex } = useGameStore();

  const contestants = players.filter((player) => !player.isHost);
  const questions = currentQuiz?.questions || [];
  const attempts = contestants.flatMap((player) => player.answers || []);

  const accuracyData = questions.slice(0, 6).map((question, index) => {
    const questionAttempts = attempts.filter((answer) => answer.questionIndex === index);
    const correct = questionAttempts.filter((answer) => answer.isCorrect).length;

    return {
      name: `Q${index + 1}`,
      accuracy: questionAttempts.length > 0 ? Math.round((correct / questionAttempts.length) * 100) : 0,
    };
  });

  const responseTimeData = questions.slice(0, 6).map((question, index) => {
    const questionAttempts = attempts.filter((answer) => answer.questionIndex === index);
    const totalTime = questionAttempts.reduce((sum, answer) => sum + (answer.timeSpent || 0), 0);

    return {
      name: `Q${index + 1}`,
      time: questionAttempts.length > 0 ? Number((totalTime / questionAttempts.length).toFixed(1)) : 0,
    };
  });

  const correctCount = attempts.filter((answer) => answer.isCorrect).length;
  const wrongCount = Math.max(attempts.length - correctCount, 0);
  const unansweredCount = Math.max((questions.length * Math.max(contestants.length, 1)) - attempts.length, 0);
  const engagementData = [
    { name: 'Correct', value: correctCount || 1 },
    { name: 'Wrong', value: wrongCount || 1 },
    { name: 'Unanswered', value: unansweredCount || 1 },
  ];

  const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b'];
  const avgAccuracy = attempts.length > 0 ? Math.round((correctCount / attempts.length) * 100) : 0;
  const avgSpeed = attempts.length > 0 ? Number((attempts.reduce((sum, answer) => sum + (answer.timeSpent || 0), 0) / attempts.length).toFixed(1)) : 0;
  const topScore = Math.max(...contestants.map((player) => player.score), 0);
  const currentQuestionAnswered = contestants.filter((player) => player.answers?.some((answer) => answer.questionIndex === currentQuestionIndex)).length;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6">
      <div className="max-w-7xl mx-auto pt-12 pb-24">
        <button
          onClick={() => navigate('/results')}
          className="flex items-center gap-2 text-white/40 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Results</span>
        </button>

        <div className="flex items-center gap-4 mb-12">
          <div className="w-16 h-16 bg-indigo-500/20 rounded-3xl flex items-center justify-center">
            <TrendingUp size={32} className="text-indigo-400" />
          </div>
          <div>
            <h2 className="text-4xl font-black italic uppercase tracking-tighter">Performance Analytics</h2>
            <p className="text-white/40">Live quiz performance updates as students answer</p>
          </div>
        </div>

        <div className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Live Round</div>
            <div className="text-xl font-black">{currentQuiz?.title || 'No active quiz'}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Question Progress</div>
            <div className="text-xl font-black text-indigo-400">Q{currentQuestionIndex + 1}/{questions.length || 0}</div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Avg Accuracy', value: `${avgAccuracy}%`, icon: Target, color: 'text-emerald-400' },
            { label: 'Avg Speed', value: `${avgSpeed}s`, icon: Clock, color: 'text-indigo-400' },
            { label: 'Total Players', value: contestants.length, icon: Award, color: 'text-pink-400' },
            { label: 'Top Score', value: topScore, icon: TrendingUp, color: 'text-yellow-400' },
          ].map((stat, i) => (
            <Card key={i} className="p-6 flex items-center gap-4">
              <div className={`p-3 rounded-2xl bg-white/5 ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <div>
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{stat.label}</div>
                <div className="text-2xl font-black">{stat.value}</div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Accuracy Chart */}
          <Card className="p-8">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
              <Target size={20} className="text-emerald-400" />
              Question Accuracy (%)
            </h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={accuracyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                    itemStyle={{ color: '#6366f1' }}
                  />
                  <Bar dataKey="accuracy" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Response Time Chart */}
          <Card className="p-8">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
              <Clock size={20} className="text-indigo-400" />
              Avg Response Time (s)
            </h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={responseTimeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                    itemStyle={{ color: '#ec4899' }}
                  />
                  <Line type="monotone" dataKey="time" stroke="#ec4899" strokeWidth={4} dot={{ r: 6, fill: '#ec4899' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Category Distribution */}
          <Card className="p-8">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
              <BarChartIcon size={20} className="text-pink-400" />
              Response Breakdown
            </h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={engagementData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {engagementData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Player Performance List */}
          <Card className="p-8">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
              <Award size={20} className="text-yellow-400" />
              Player Breakdown
            </h3>
            <div className="space-y-4">
              {contestants.map((p, i) => {
                const userAttempts = attempts.filter((answer) => players.find((player) => player.id === p.id)?.answers?.includes(answer as any));
                const userCorrect = (p.correctAnswers || 0);
                const userAccuracy = (p.totalAttempted || 0) > 0 ? Math.round((userCorrect / (p.totalAttempted || 1)) * 100) : 0;

                return (
                <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <img src={p.avatar} className="w-8 h-8 rounded-lg" referrerPolicy="no-referrer" />
                    <span className="font-bold">{p.username}</span>
                  </div>
                  <div className="flex gap-8">
                    <div className="text-right">
                      <div className="text-[10px] text-white/40 uppercase font-bold">Accuracy</div>
                      <div className="text-emerald-400 font-bold">{userAccuracy}%</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-white/40 uppercase font-bold">Score</div>
                      <div className="text-indigo-400 font-bold">{p.score}</div>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Current Question Answered</div>
            <div className="text-2xl font-black text-indigo-400">{currentQuestionAnswered}/{contestants.length}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Questions Tracked</div>
            <div className="text-2xl font-black text-emerald-400">{accuracyData.length}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Attempts</div>
            <div className="text-2xl font-black text-pink-400">{attempts.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
