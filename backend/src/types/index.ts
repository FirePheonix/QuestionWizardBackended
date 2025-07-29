import { Request } from 'express';
import { User } from '@prisma/client';
import { RequireAuthProp } from '@clerk/clerk-sdk-node';
import { QuestionType, GenerationStatus, Difficulty } from './enums';

/**
 * Extends the Express Request interface to include the authenticated user.
 */
export interface AuthenticatedRequest extends RequireAuthProp<Request> {
  user?: User; // Attach Prisma user object to request
}

// --- API Request/Response Interfaces ---

export interface ApiQuestionType {
  id: string;
  name: string;
  type: QuestionType;
  description: string;
  cost: number;
  icon: string;
  json_schema: object;
}

export interface ValidateSelectionRequest {
  selections: {
    type: QuestionType;
    quantity: number;
  }[];
}

export interface ValidateSelectionResponse {
  isValid: true;
  totalCost: number;
  remainingBalance: number;
  breakdown: {
    name: string;
    quantity: number;
    cost: number;
    subtotal: number;
  }[];
}

export interface ValidateSelectionErrorResponse {
  isValid: false;
  message: string;
  totalCost: number;
  userBalance: number;
}

export interface FileUploadResponse {
    message: string;
    fileId: string;
    fileName: string;
    size?: number;
    mimetype?: string;
    characterCount?: number;
    preview?: string;
}

// --- Data Structures for Generated Questions ---

export interface QuestionOption {
    id: string;
    text: string;
    isCorrect: boolean;
    match?: string;
}
  
export interface GeneratedQuestion {
    id: string;
    type: QuestionType;
    questionText: string;
    options: QuestionOption[];
    points: number;
    difficulty: Difficulty;
    qualityScore: number;
    explanation?: string;
}

// --- Generation Session & Status Interfaces ---
export interface GenerationStage {
  id: string;
  name: string;
  status: 'completed' | 'current' | 'pending';
}

export interface AIEvaluationGuidelines {
    targetAudience: 'Beginner' | 'Intermediate' | 'Expert';
    language: string;
    tone: 'Formal' | 'Informal' | 'Humorous' | 'Neutral';
}

export interface StartGenerationRequest {
    questionTypes: { id: QuestionType; quantity: number }[];
    sourceType: 'text' | 'image' | 'pdf';
    sourceText?: string;
    sourceFileId?: string;
    guidelines: AIEvaluationGuidelines;
}

export interface GenerationSession {
  id: string;
  userId: string; // This is the Clerk ID
  status: GenerationStatus;
  progress: number;
  eta: number;
  stages: GenerationStage[];
  requestData: StartGenerationRequest; 
  result?: GeneratedQuestion[];
  error?: string;
  createdAt: number;
}

export interface StartGenerationResponse {
  sessionId: string;
  initialStatus: GenerationSession;
}

export interface WebSocketMessage {
  type: 'statusUpdate' | 'error';
  payload: GenerationSession;
}

// --- Balance and History Interfaces ---
export interface UsageMeter {
    type: 'text' | 'image' | 'pdf';
    used: number;
    limit: number;
}
  
export interface BalanceInfoResponse {
    currentCredits: number;
    totalCreditsInPeriod: number;
    periodStartDate: string;
    periodEndDate: string;
    usageMeters: UsageMeter[];
}

export interface GenerationHistoryItem {
    id: string;
    date: string;
    status: GenerationStatus;
    sourceType: 'text' | 'image' | 'pdf';
    questionCount: number;
    cost: number;
    outcome: string;
}

export interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
}

export interface HistoryResponse {
    history: GenerationHistoryItem[];
    pagination: PaginationInfo;
}
