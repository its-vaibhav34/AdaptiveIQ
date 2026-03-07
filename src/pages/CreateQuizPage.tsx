import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, ArrowLeft, HelpCircle } from 'lucide-react';
import { Button, Input, Card } from '../components/UI';
import { useGameStore, Question } from '../store/useGameStore';

export const CreateQuizPage = () => {
  const navigate = useNavigate();
  const { setCurrentQuiz, setRoomCode, setStatus } = useGameStore();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [questions, setQuestions] = useState<Partial<Question>[]>([
    { text: '', options: ['', '', '', ''], correctAnswer: 0, timeLimit: 15 }
  ]);

  const addQuestion = () => {
    setQuestions([...questions, { text: '', options: ['', '', '', ''], correctAnswer: 0, timeLimit: 15 }]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const newQuestions = [...questions];
    (newQuestions[index] as any)[field] = value;
    setQuestions(newQuestions);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options![oIndex] = value;
    setQuestions(newQuestions);
  };

  const handleSave = () => {
    if (!title || questions.some(q => !q.text || q.options?.some(o => !o))) {
      alert('Please fill in all fields');
      return;
    }

    const quiz = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      category,
      difficulty,
      questions: questions as Question[]
    };

    setCurrentQuiz(quiz);
    const code = Math.random().toString(36).substr(2, 6).toUpperCase();
    setRoomCode(code);
    setStatus('lobby');
    navigate(`/lobby/${code}`);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6">
      <div className="max-w-4xl mx-auto pt-12 pb-24">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white/40 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Home</span>
        </button>

        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-4xl font-black italic uppercase tracking-tighter">Create Quiz</h2>
            <p className="text-white/40">Build your custom battle arena</p>
          </div>
          <Button size="lg" onClick={handleSave}>
            <Save size={20} />
            Save & Host
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Quiz Title</label>
            <Input
              placeholder="Enter a catchy title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-bold py-4"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>

        <div className="space-y-8">
          <AnimatePresence>
            {questions.map((q, qIndex) => (
              <motion.div
                key={qIndex}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
              >
                <Card className="p-8 relative">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold">
                        {qIndex + 1}
                      </div>
                      <h4 className="font-bold text-white/60 uppercase tracking-widest text-sm">Question</h4>
                    </div>
                    <button
                      onClick={() => removeQuestion(qIndex)}
                      className="text-white/20 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>

                  <Input
                    placeholder="What's the question?"
                    value={q.text}
                    onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                    className="mb-6 text-lg font-bold"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {q.options?.map((opt, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-3">
                        <button
                          onClick={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                            q.correctAnswer === oIndex
                              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                              : 'bg-white/5 text-white/20 hover:bg-white/10'
                          }`}
                        >
                          {q.correctAnswer === oIndex ? <Save size={16} /> : <HelpCircle size={16} />}
                        </button>
                        <Input
                          placeholder={`Option ${oIndex + 1}`}
                          value={opt}
                          onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          <Button
            variant="outline"
            className="w-full py-8 border-dashed border-2 hover:border-indigo-500/50 hover:bg-indigo-500/5"
            onClick={addQuestion}
          >
            <Plus />
            Add Another Question
          </Button>
        </div>
      </div>
    </div>
  );
};
