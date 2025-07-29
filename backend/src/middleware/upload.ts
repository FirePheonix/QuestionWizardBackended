import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * A file filter to allow only specific image mimetypes.
 */
const imageFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, and GIF images are allowed.'));
  }
};

/**
 * A file filter to allow only PDF mimetypes.
 */
const pdfFileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
  ) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF files are allowed.'));
    }
  };

// Use memory storage to handle files as buffers, which is simple and efficient
// for processing without writing to disk.
const storage = multer.memoryStorage();

// Multer instance for image uploads
export const uploadImage = multer({
  storage: storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
}).single('image');

// Multer instance for PDF uploads
export const uploadPdf = multer({
    storage: storage,
    fileFilter: pdfFileFilter,
    limits: { fileSize: MAX_FILE_SIZE },
}).single('pdf');
