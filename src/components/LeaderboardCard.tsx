import { motion } from 'motion/react';
import { Player } from '../store/useGameStore';
import { cn } from '../utils/constants';

export const LeaderboardCard = ({ player, rank }: { player: Player; rank: number }) => {
  const isTop3 = rank <= 3;
  
  return (
    <motion.div
      layout
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={cn(
        'flex items-center gap-4 p-4 rounded-2xl border transition-all',
        isTop3 ? 'bg-indigo-500/20 border-indigo-500/50' : 'bg-white/5 border-white/10'
      )}
    >
      <div className={cn(
        'w-8 h-8 flex items-center justify-center rounded-full font-black text-sm',
        rank === 1 ? 'bg-yellow-500 text-black' :
        rank === 2 ? 'bg-slate-300 text-black' :
        rank === 3 ? 'bg-amber-600 text-white' : 'bg-white/10 text-white/60'
      )}>
        {rank}
      </div>
      
      <img src={player.avatar} alt={player.username} className="w-10 h-10 rounded-xl" referrerPolicy="no-referrer" />
      
      <div className="flex-1">
        <div className="font-bold text-white">{player.username}</div>
        <div className="text-xs text-white/40">Rank #{rank}</div>
      </div>
      
      <div className="text-right">
        <motion.div
          key={player.score}
          initial={{ scale: 1.2, color: '#fff' }}
          animate={{ scale: 1, color: '#fff' }}
          className="text-xl font-black text-indigo-400"
        >
          {player.score}
        </motion.div>
        <div className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Points</div>
      </div>
    </motion.div>
  );
};
