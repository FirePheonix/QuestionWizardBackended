import { Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthenticatedRequest } from '../types';
import { extractTextFromPdf } from '../utils/fileProcessing';
import { v4 as uuidv4 } from 'uuid';

/**
 * @desc    Handle image file upload
 * @route   POST /api/ai-generation/source/upload-image
 * @access  Private
 */
export const uploadImageHandler = (req: AuthenticatedRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image file uploaded.' });
  }

  // In a real app, you would upload req.file.buffer to a cloud storage
  // service (like AWS S3 or Supabase Storage) and store the URL.
  // For now, we'll just simulate success.
  const fileId = `img-${uuidv4()}`;

  res.status(201).json({
    message: 'Image uploaded successfully.',
    fileId: fileId,
    fileName: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
  });
};

/**
 * @desc    Handle PDF file upload and extract text
 * @route   POST /api/ai-generation/source/upload-pdf
 * @access  Private
 */
export const uploadPdfHandler = async (req: AuthenticatedRequest, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No PDF file uploaded.' });
    }
  
    try {
      const textContent = await extractTextFromPdf(req.file.buffer);
      const fileId = `pdf-${uuidv4()}`;
  
      // Return a preview of the extracted text
      const preview = textContent.substring(0, 500);
  
      res.status(201).json({
        message: 'PDF processed successfully.',
        fileId: fileId,
        fileName: req.file.originalname,
        characterCount: textContent.length,
        preview: `${preview}${textContent.length > 500 ? '...' : ''}`,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to process PDF.' });
    }
  };

/**
 * @desc    Validate a text prompt
 * @route   POST /api/ai-generation/source/validate-prompt
 * @access  Private
 */
export const validatePromptHandler = (req: AuthenticatedRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // If validation passes
  res.status(200).json({
    isValid: true,
    message: 'Prompt is valid.',
  });
};
