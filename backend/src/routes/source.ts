import { Router } from 'express';
import { body } from 'express-validator';
import { authMiddleware } from '../middleware/auth';
import { uploadImage, uploadPdf } from '../middleware/upload';
import { uploadImageHandler, uploadPdfHandler, validatePromptHandler } from '../controllers/sourceController';

const router = Router();

// Validation rules for the text prompt
const validatePromptRules = [
  body('prompt')
    .isString()
    .withMessage('Prompt must be a string.')
    .notEmpty()
    .withMessage('Prompt cannot be empty.')
    .isLength({ min: 20, max: 5000 })
    .withMessage('Prompt must be between 20 and 5000 characters.'),
];

/**
 * @route   POST /api/ai-generation/source/upload-image
 * @desc    Upload an image file for processing
 * @access  Private
 */
router.post('/upload-image', authMiddleware, uploadImage, uploadImageHandler);

/**
 * @route   POST /api/ai-generation/source/upload-pdf
 * @desc    Upload a PDF file for text extraction
 * @access  Private
 */
router.post('/upload-pdf', authMiddleware, uploadPdf, uploadPdfHandler);

/**
 * @route   POST /api/ai-generation/source/validate-prompt
 * @desc    Validate a text prompt
 * @access  Private
 */
router.post('/validate-prompt', authMiddleware, validatePromptRules, validatePromptHandler);


export default router;
