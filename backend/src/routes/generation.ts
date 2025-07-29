import { Router } from 'express';
import { body } from 'express-validator';
import { authMiddleware } from '../middleware/auth';
import { startGeneration, getGenerationStatus, getGenerationResult } from '../controllers/generationController';

const router = Router();

// Validation for the start generation request
const startGenerationRules = [
    body('questionTypes').isArray({ min: 1 }).withMessage('Must select at least one question type.'),
    body('sourceType').isIn(['text', 'image', 'pdf']).withMessage('Invalid source type.'),
    body('guidelines').isObject().withMessage('Guidelines must be an object.'),
    body('guidelines.targetAudience').isIn(['Beginner', 'Intermediate', 'Expert']),
    body('guidelines.language').isString().notEmpty(),
    body('guidelines.tone').isIn(['Formal', 'Informal', 'Humorous', 'Neutral']),
];

/**
 * @route   POST /api/v1/ai-generation/start
 * @desc    Start a new AI generation session
 * @access  Private
 */
router.post('/start', authMiddleware, startGenerationRules, startGeneration);

/**
 * @route   GET /api/v1/ai-generation/status/:sessionId
 * @desc    Get the status of a specific generation session
 * @access  Private
 */
router.get('/status/:sessionId', authMiddleware, getGenerationStatus);

/**
 * @route   GET /api/v1/ai-generation/result/:sessionId
 * @desc    Get the final result of a completed generation session
 * @access  Private
 */
router.get('/result/:sessionId', authMiddleware, getGenerationResult);

export default router;
