import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import * as balanceService from '../services/balanceService';

/**
 * @desc    Get current balance and usage stats
 * @route   GET /api/v1/ai-generation/balance
 * @access  Private
 */
export const getBalanceInfo = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = req.user!;
        const balanceInfo = await balanceService.fetchBalanceAndUsage(user.id);
        res.status(200).json(balanceInfo);
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to fetch balance information.', error: error.message });
    }
};

/**
 * @desc    Get paginated generation history
 * @route   GET /api/v1/ai-generation/balance/history
 * @access  Private
 */
export const getGenerationHistory = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = req.user!;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const historyData = await balanceService.fetchGenerationHistory(user.id, page, limit);
        res.status(200).json(historyData);
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to fetch generation history.', error: error.message });
    }
};

/**
 * @desc    Reset monthly usage limits (Admin only)
 * @route   POST /api/v1/ai-generation/balance/reset
 * @access  Admin
 */
export const resetUsage = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required to reset usage.' });
        }
        const result = await balanceService.resetMonthlyUsage(userId);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to reset usage.', error: error.message });
    }
};
