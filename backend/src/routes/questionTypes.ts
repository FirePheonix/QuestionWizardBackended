import { Router } from 'express';
import { body } from 'express-validator';
import { getQuestionTypes, validateSelection } from '../controllers/questionTypesController';
import { authMiddleware } from '../middleware/auth';
import { QuestionType } from '../types/enums';

const router = Router();

// Validation rules for the selection
const validateSelectionRules = [
  body('selections').isArray({ min: 1 }).withMessage('Selections must be a non-empty array.'),
  body('selections.*.type').isIn(Object.values(QuestionType)).withMessage('Invalid question type provided.'),
  body('selections.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer.'),
];

/**
 * @route   GET /api/ai-generation/question-types
 * @desc    Fetch all available question types
 * @access  Private
 */
router.get('/', authMiddleware, getQuestionTypes);

/**
 * @route   POST /api/ai-generation/question-types/validate-selection
 * @desc    Validate a selection of questions against user's balance
 * @access  Private
 */
router.post('/validate-selection', authMiddleware, validateSelectionRules, validateSelection);

export default router;
