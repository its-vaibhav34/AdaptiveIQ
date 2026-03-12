import { Router } from 'express';
import healthRouter from './health.routes.js';
import quizRouter from './quiz.routes.js';
import sessionRouter from './session.routes.js';

const router = Router();

router.use('/health', healthRouter);
router.use('/quizzes', quizRouter);
router.use('/sessions', sessionRouter);

export default router;
