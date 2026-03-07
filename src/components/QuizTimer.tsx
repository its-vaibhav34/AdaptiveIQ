import { motion } from 'motion/react';

export const QuizTimer = ({ current, total }: { current: number; total: number }) => {
  const percentage = (current / total) * 100;
  
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90">
        <circle
          cx="48"
          cy="48"
          r="40"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="8"
        />
        <motion.circle
          cx="48"
          cy="48"
          r="40"
          fill="none"
          stroke={current < 5 ? '#ef4444' : '#6366f1'}
          strokeWidth="8"
          strokeDasharray="251.2"
          initial={{ strokeDashoffset: 0 }}
          animate={{ strokeDashoffset: 251.2 - (251.2 * percentage) / 100 }}
          transition={{ duration: 1, ease: 'linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-black text-white">{current}</span>
      </div>
    </div>
  );
};
