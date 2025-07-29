import { Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthenticatedRequest, ApiQuestionType, ValidateSelectionRequest, ValidateSelectionResponse, ValidateSelectionErrorResponse } from '../types';
import { QuestionType } from '../types/enums';

// Mock data that would typically come from a database (e.g., Prisma query)
const MOCK_QUESTION_TYPES: ApiQuestionType[] = [
    {
        id: 'qt-001', name: 'Single Choice', type: QuestionType.SingleChoice,
        description: 'A question with multiple options where only one is correct.',
        cost: 3, icon: 'Circle', json_schema: {}
    },
    {
        id: 'qt-002', name: 'Multiple Choice', type: QuestionType.MultipleChoice,
        description: 'A question with multiple options where several can be correct.',
        cost: 4, icon: 'CheckSquare', json_schema: {}
    },
    {
        id: 'qt-003', name: 'True/False', type: QuestionType.TrueFalse,
        description: 'A statement that is either true or false.',
        cost: 2, icon: 'ToggleLeft', json_schema: {}
    },
    {
        id: 'qt-004', name: 'Ranking', type: QuestionType.Ranking,
        description: 'A question asking to order items.',
        cost: 5, icon: 'BarChart3', json_schema: {}
    },
    {
        id: 'qt-005', name: 'Rating', type: QuestionType.Rating,
        description: 'A question asking to rate something on a scale.',
        cost: 2, icon: 'Star', json_schema: {}
    },
    {
        id: 'qt-006', name: 'Fill in the Blank', type: QuestionType.FillInTheBlank,
        description: 'A sentence with a missing word to be filled in.',
        cost: 3, icon: 'Edit3', json_schema: {}
    },
    {
        id: 'qt-007', name: 'Short Text', type: QuestionType.ShortText,
        description: 'A question requiring a brief written answer.',
        cost: 4, icon: 'Type', json_schema: {}
    },
    {
        id: 'qt-008', name: 'Matching', type: QuestionType.Matching,
        description: 'Match items from two lists.',
        cost: 6, icon: 'GitMerge', json_schema: {}
    },
    {
        id: 'qt-009', name: 'Essay', type: QuestionType.Essay,
        description: 'A question requiring a long-form written answer.',
        cost: 8, icon: 'FileText', json_schema: {}
    }
];

/**
 * @desc    Get all available question types
 * @route   GET /api/v1/ai-generation/question-types
 * @access  Private
 */
export const getQuestionTypes = async (req: AuthenticatedRequest, res: Response<ApiQuestionType[]>) => {
    res.status(200).json(MOCK_QUESTION_TYPES);
};

/**
 * @desc    Validate user's question selection and calculate cost
 * @route   POST /api/v1/ai-generation/validate-selection
 * @access  Private
 */
export const validateSelection = async (req: AuthenticatedRequest, res: Response<ValidateSelectionResponse | ValidateSelectionErrorResponse>) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() } as any);
    }

    const { selections } = req.body as ValidateSelectionRequest;
    const userBalance = req.user!.balance;

    let totalCost = 0;
    const breakdown = selections.map(selection => {
        const questionTypeInfo = MOCK_QUESTION_TYPES.find(qt => qt.type === selection.type);
        const cost = questionTypeInfo ? questionTypeInfo.cost : 0;
        const subtotal = selection.quantity * cost;
        totalCost += subtotal;
        return {
            name: questionTypeInfo?.name || 'Unknown',
            quantity: selection.quantity,
            cost: cost,
            subtotal: subtotal,
        };
    });

    if (totalCost > userBalance) {
        return res.status(400).json({
            isValid: false,
            message: 'Insufficient credits for this selection.',
            totalCost,
            userBalance,
        });
    }

    res.status(200).json({
        isValid: true,
        totalCost,
        remainingBalance: userBalance - totalCost,
        breakdown,
    });
};
