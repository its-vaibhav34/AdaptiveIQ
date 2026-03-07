import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Buddy',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Cookie',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Daisy',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Ginger',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jasper',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Misty',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Oscar',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Peanut',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Pumpkin',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Shadow',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Simba',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Toby',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Max',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Bella',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucy',
];

export const MOCK_QUIZ = {
  id: '1',
  title: 'Space & Universe',
  category: 'Science',
  difficulty: 'Medium',
  questions: [
    {
      id: 'q1',
      text: 'Which planet is known as the Red Planet?',
      options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
      correctAnswer: 1,
      timeLimit: 15,
    },
    {
      id: 'q2',
      text: 'What is the largest moon of Saturn?',
      options: ['Titan', 'Europa', 'Ganymede', 'Callisto'],
      correctAnswer: 0,
      timeLimit: 15,
    },
    {
      id: 'q3',
      text: 'Who was the first human to travel into space?',
      options: ['Neil Armstrong', 'Buzz Aldrin', 'Yuri Gagarin', 'John Glenn'],
      correctAnswer: 2,
      timeLimit: 15,
    },
  ],
};
