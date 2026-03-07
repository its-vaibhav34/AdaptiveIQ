import { motion } from 'motion/react';
import { AVATARS, cn } from '../utils/constants';

interface AvatarPickerProps {
  selected: string;
  onSelect: (avatar: string) => void;
}

export const AvatarPicker = ({ selected, onSelect }: AvatarPickerProps) => {
  return (
    <div className="grid grid-cols-5 gap-3 max-h-64 overflow-y-auto p-2 scrollbar-hide">
      {AVATARS.map((avatar, i) => (
        <motion.button
          key={i}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onSelect(avatar)}
          className={cn(
            'relative rounded-2xl p-1 border-2 transition-all',
            selected === avatar ? 'border-indigo-500 bg-indigo-500/20' : 'border-transparent bg-white/5 hover:bg-white/10'
          )}
        >
          <img src={avatar} alt="Avatar" className="w-full h-full rounded-xl" referrerPolicy="no-referrer" />
          {selected === avatar && (
            <motion.div
              layoutId="selected-avatar"
              className="absolute inset-0 border-2 border-indigo-500 rounded-2xl"
            />
          )}
        </motion.button>
      ))}
    </div>
  );
};
