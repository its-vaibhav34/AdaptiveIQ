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
  const { players, currentQuiz } = useGameStore();

  const accuracyData = [
    { name: 'Q1', accuracy: 85 },
    { name: 'Q2', accuracy: 62 },
    { name: 'Q3', accuracy: 94 },
    { name: 'Q4', accuracy: 45 },
    { name: 'Q5', accuracy: 78 },
  ];

  const responseTimeData = [
    { name: 'Q1', time: 4.2 },
    { name: 'Q2', time: 8.5 },
    { name: 'Q3', time: 3.1 },
    { name: 'Q4', time: 12.4 },
    { name: 'Q5', time: 5.8 },
  ];

  const categoryData = [
    { name: 'Science', value: 400 },
    { name: 'History', value: 300 },
    { name: 'Pop Culture', value: 300 },
    { name: 'Geography', value: 200 },
  ];

  const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b'];

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
            <p className="text-white/40">Deep dive into the battle data</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Avg Accuracy', value: '74%', icon: Target, color: 'text-emerald-400' },
            { label: 'Avg Speed', value: '6.4s', icon: Clock, color: 'text-indigo-400' },
            { label: 'Total Players', value: players.length, icon: Award, color: 'text-pink-400' },
            { label: 'Top Score', value: Math.max(...players.map(p => p.score), 0), icon: TrendingUp, color: 'text-yellow-400' },
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
              Topic Mastery
            </h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
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
              {players.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <img src={p.avatar} className="w-8 h-8 rounded-lg" referrerPolicy="no-referrer" />
                    <span className="font-bold">{p.username}</span>
                  </div>
                  <div className="flex gap-8">
                    <div className="text-right">
                      <div className="text-[10px] text-white/40 uppercase font-bold">Accuracy</div>
                      <div className="text-emerald-400 font-bold">82%</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-white/40 uppercase font-bold">Score</div>
                      <div className="text-indigo-400 font-bold">{p.score}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
