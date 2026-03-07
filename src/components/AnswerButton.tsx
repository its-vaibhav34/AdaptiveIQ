import { motion } from 'motion/react';
import { cn } from '../utils/constants';

interface AnswerButtonProps {
  text: string;
  index: number;
  onClick: () => void;
  disabled?: boolean;
  isSelected?: boolean;
  isCorrect?: boolean;
  isWrong?: boolean;
}

export const AnswerButton = ({
  text,
  index,
  onClick,
  disabled,
  isSelected,
  isCorrect,
  isWrong,
}: AnswerButtonProps) => {
  const colors = [
    'bg-rose-500 hover:bg-rose-400 shadow-rose-500/20',
    'bg-blue-500 hover:bg-blue-400 shadow-blue-500/20',
    'bg-amber-500 hover:bg-amber-400 shadow-amber-500/20',
    'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20',
  ];

  const shapes = [
    <div key="0" className="w-6 h-6 bg-white rotate-45" />,
    <div key="1" className="w-6 h-6 bg-white rounded-full" />,
    <div key="2" className="w-6 h-6 bg-white" />,
    <div key="3" className="w-6 h-6 bg-white rounded-sm rotate-12" />,
  ];

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative flex items-center gap-6 p-6 rounded-3xl text-left transition-all duration-300 shadow-xl min-h-[100px]',
        colors[index % 4],
        isSelected && 'ring-4 ring-white ring-offset-4 ring-offset-black scale-105 z-10',
        isCorrect && 'ring-4 ring-emerald-400 ring-offset-4 ring-offset-black bg-emerald-500',
        isWrong && 'opacity-40 grayscale-[0.5]',
        disabled && !isSelected && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div className="flex-shrink-0 opacity-40">{shapes[index % 4]}</div>
      <span className="text-xl font-bold text-white leading-tight">{text}</span>
      
      {isCorrect && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-3 -right-3 bg-white text-emerald-600 p-2 rounded-full shadow-xl"
        >
          <CheckIcon />
        </motion.div>
      )}
    </motion.button>
  );
};

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
