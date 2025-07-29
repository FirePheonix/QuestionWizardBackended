import pdf from 'pdf-parse';

/**
 * Extracts text content from a PDF file buffer.
 * @param buffer The buffer of the PDF file.
 * @returns A promise that resolves to the extracted text.
 */
export const extractTextFromPdf = async (buffer: Buffer): Promise<string> => {
  try {
    const data = await pdf(buffer);
    return data.text;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse the PDF file. It might be corrupted or protected.');
  }
};
