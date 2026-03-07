import { motion } from 'motion/react';
import { Check, Crown } from 'lucide-react';
import { Player } from '../store/useGameStore';
import { cn } from '../utils/constants';

export const PlayerCard = ({ player }: { player: Player }) => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        'relative flex flex-col items-center p-4 rounded-3xl border transition-all',
        player.isReady ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/10'
      )}
    >
      <div className="relative mb-3">
        <img src={player.avatar} alt={player.username} className="w-16 h-16 rounded-2xl" referrerPolicy="no-referrer" />
        {player.isHost && (
          <div className="absolute -top-2 -right-2 bg-yellow-500 p-1 rounded-full shadow-lg">
            <Crown size={12} className="text-black" />
          </div>
        )}
        {player.isReady && (
          <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-1 rounded-full shadow-lg">
            <Check size={12} className="text-white" />
          </div>
        )}
      </div>
      <span className="font-bold text-white truncate w-full text-center">{player.username}</span>
      <span className="text-xs text-white/40">{player.isReady ? 'READY' : 'WAITING'}</span>
    </motion.div>
  );
};
