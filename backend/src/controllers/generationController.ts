import { Response } from 'express';
import { validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedRequest, GenerationSession, StartGenerationRequest, StartGenerationResponse } from '../types';
import { GenerationStatus } from '../types/enums';
import { startGenerationProcess } from '../services/aiService';
import prisma from '../utils/prisma';

// In-memory store for sessions. In production, use Redis or a database.
const sessions = new Map<string, GenerationSession>();

export const getSession = (sessionId: string): GenerationSession | undefined => {
    return sessions.get(sessionId);
};

export const updateSession = (sessionId: string, data: Partial<GenerationSession>) => {
    const session = sessions.get(sessionId);
    if (session) {
        sessions.set(sessionId, { ...session, ...data });
    }
};

/**
 * @desc    Start a new AI generation session
 * @route   POST /api/v1/ai-generation/start
 * @access  Private
 */
export const startGeneration = async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const user = req.user!;
    const requestData = req.body as StartGenerationRequest;

    const estimatedCost = requestData.questionTypes.reduce((sum, type) => sum + (type.quantity * 3), 0);
    if (user.balance < estimatedCost) {
        return res.status(402).json({ message: 'Insufficient credits to start generation.' });
    }
    
    // Deduct balance from the database
    await prisma.user.update({
        where: { id: user.id },
        data: { balance: { decrement: estimatedCost } },
    });

    const sessionId = uuidv4();
    const initialSession: GenerationSession = {
        id: sessionId,
        userId: user.clerkId, // Use Clerk ID for session tracking
        status: GenerationStatus.Pending,
        progress: 0,
        eta: 60,
        stages: [
            { id: 'analyze', name: 'Analyzing source content', status: 'pending' },
            { id: 'guidelines', name: 'Constructing AI prompt', status: 'pending' },
            { id: 'creating', name: 'Generating questions with AI', status: 'pending' },
            { id: 'formatting', name: 'Parsing AI response', status: 'pending' },
            { id: 'validating', name: 'Validating output', status: 'pending' },
        ],
        requestData,
        createdAt: Date.now(),
    };

    sessions.set(sessionId, initialSession);

    startGenerationProcess(sessionId, estimatedCost);

    const response: StartGenerationResponse = {
        sessionId,
        initialStatus: initialSession,
    };

    res.status(202).json(response);
};

/**
 * @desc    Get the status of a generation session
 * @route   GET /api/v1/ai-generation/status/:sessionId
 * @access  Private
 */
export const getGenerationStatus = (req: AuthenticatedRequest, res: Response) => {
    const { sessionId } = req.params;
    const session = sessions.get(sessionId);

    if (!session) {
        return res.status(404).json({ message: 'Session not found.' });
    }

    if (session.userId !== req.auth!.userId) {
        return res.status(403).json({ message: 'You are not authorized to view this session.' });
    }

    res.status(200).json(session);
};

/**
 * @desc    Get the final result of a completed generation session
 * @route   GET /api/v1/ai-generation/result/:sessionId
 * @access  Private
 */
export const getGenerationResult = (req: AuthenticatedRequest, res: Response) => {
    const { sessionId } = req.params;
    const session = sessions.get(sessionId);

    if (!session) {
        return res.status(404).json({ message: 'Session not found.' });
    }

    if (session.userId !== req.auth!.userId) {
        return res.status(403).json({ message: 'You are not authorized to view this session.' });
    }

    if (session.status !== GenerationStatus.Completed) {
        return res.status(400).json({ message: 'Generation is not yet complete.' });
    }

    if (!session.result) {
        return res.status(404).json({ message: 'No results found for this session.' });
    }

    res.status(200).json(session.result);
};
