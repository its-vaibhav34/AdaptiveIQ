import { create } from 'zustand';

export type Player = {
  id: string;
  username: string;
  avatar: string;
  score: number;
  isReady: boolean;
  isHost: boolean;
  lastAnswerCorrect?: boolean;
  rank?: number;
};

export type Question = {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  timeLimit: number;
};

export type Quiz = {
  id: string;
  title: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questions: Question[];
};

export type GameStatus = 'idle' | 'lobby' | 'starting' | 'question' | 'leaderboard' | 'finished';

interface GameState {
  // User State
  me: Player | null;
  setMe: (player: Player) => void;

  // Room State
  roomCode: string | null;
  players: Player[];
  status: GameStatus;
  currentQuiz: Quiz | null;
  currentQuestionIndex: number;
  timer: number;
  
  // Actions
  setRoomCode: (code: string | null) => void;
  setPlayers: (players: Player[]) => void;
  setStatus: (status: GameStatus) => void;
  setCurrentQuiz: (quiz: Quiz | null) => void;
  setCurrentQuestionIndex: (index: number) => void;
  setTimer: (time: number) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  updatePlayerReady: (playerId: string, isReady: boolean) => void;
  updatePlayerScore: (playerId: string, score: number, correct: boolean) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  me: null,
  setMe: (player) => set({ me: player }),

  roomCode: null,
  players: [],
  status: 'idle',
  currentQuiz: null,
  currentQuestionIndex: 0,
  timer: 0,

  setRoomCode: (code) => set({ roomCode: code }),
  setPlayers: (players) => set({ players }),
  setStatus: (status) => set({ status }),
  setCurrentQuiz: (quiz) => set({ currentQuiz: quiz }),
  setCurrentQuestionIndex: (index) => set({ currentQuestionIndex: index }),
  setTimer: (time) => set({ timer: time }),
  
  addPlayer: (player) => set((state) => ({ players: [...state.players, player] })),
  removePlayer: (playerId) => set((state) => ({ 
    players: state.players.filter(p => p.id !== playerId) 
  })),
  updatePlayerReady: (playerId, isReady) => set((state) => ({
    players: state.players.map(p => p.id === playerId ? { ...p, isReady } : p)
  })),
  updatePlayerScore: (playerId, score, correct) => set((state) => ({
    players: state.players.map(p => p.id === playerId ? { ...p, score: p.score + score, lastAnswerCorrect: correct } : p)
  })),
  resetGame: () => set({
    roomCode: null,
    players: [],
    status: 'idle',
    currentQuiz: null,
    currentQuestionIndex: 0,
    timer: 0
  }),
}));
