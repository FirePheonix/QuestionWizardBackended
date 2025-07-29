import prisma from '../utils/prisma';
import { BalanceInfoResponse, HistoryResponse, PaginationInfo, UsageMeter, GenerationHistoryItem } from "../types";
import { GenerationStatus } from '../types/enums';

/**
 * Fetches the user's current balance and usage statistics from the database.
 */
export const fetchBalanceAndUsage = async (userId: string): Promise<BalanceInfoResponse> => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    const now = new Date();
    const periodStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // This is still mocked as we don't have detailed usage tracking per type yet.
    // To implement this, you'd query the GenerationHistory table and aggregate by sourceType.
    const usageMeters: UsageMeter[] = [
        { type: 'text', used: 45, limit: 50 },
        { type: 'image', used: 12, limit: 20 },
        { type: 'pdf', used: 3, limit: 10 },
    ];

    return {
        currentCredits: user.balance,
        totalCreditsInPeriod: 10000000, // This could be a value from the user's subscription plan
        periodStartDate: periodStartDate.toISOString(),
        periodEndDate: periodEndDate.toISOString(),
        usageMeters,
    };
};

/**
 * Fetches a paginated history of generation sessions from the database.
 */
export const fetchGenerationHistory = async (userId: string, page: number, limit: number): Promise<HistoryResponse> => {
    const totalItems = await prisma.generationHistory.count({ where: { userId } });
    const totalPages = Math.ceil(totalItems / limit);
    
    const dbHistory = await prisma.generationHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
    });

    const history: GenerationHistoryItem[] = dbHistory.map(h => ({
        id: h.id,
        date: h.createdAt.toISOString(),
        status: h.status as GenerationStatus,
        sourceType: h.sourceType as 'text' | 'pdf' | 'image',
        questionCount: h.questionCount,
        cost: h.cost,
        outcome: h.outcome,
    }));

    const pagination: PaginationInfo = {
        currentPage: page,
        totalPages,
        pageSize: limit,
        totalItems,
    };

    return { history, pagination };
};

/**
 * Resets monthly usage limits for a user (Admin-only).
 * This is a placeholder as usage meters are currently mocked.
 */
export const resetMonthlyUsage = async (userId: string): Promise<{ success: boolean; message: string }> => {
    console.log(`Admin action: Resetting monthly usage for user ${userId}.`);
    // In a real app, this would update database records related to usage counters.
    return {
        success: true,
        message: `Monthly usage for user ${userId} has been successfully reset.`,
    };
};
