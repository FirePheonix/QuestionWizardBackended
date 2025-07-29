import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { adminAuthMiddleware } from '../middleware/adminAuth';
import { getBalanceInfo, getGenerationHistory, resetUsage } from '../controllers/balanceController';

const router = Router();

/**
 * @route   GET /api/ai-generation/balance
 * @desc    Get current balance and usage stats
 * @access  Private
 */
router.get('/', authMiddleware, getBalanceInfo);

/**
 * @route   GET /api/ai-generation/balance/history
 * @desc    Get paginated generation history
 * @access  Private
 */
router.get('/history', authMiddleware, getGenerationHistory);

/**
 * @route   POST /api/ai-generation/balance/reset
 * @desc    Reset monthly usage limits for a user
 * @access  Admin
 */
router.post('/reset', authMiddleware, adminAuthMiddleware, resetUsage);

export default router;
