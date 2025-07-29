import { GenerationSession, GenerationStage, GeneratedQuestion } from '../types';
import { GenerationStatus } from '../types/enums';
import { broadcast } from '../utils/websockets';
import { getSession, updateSession } from '../controllers/generationController';
import { generateQuestionsFromOpenAI } from './openaiService';
import prisma from '../utils/prisma';

const MOCK_STAGES: Omit<GenerationStage, 'status'>[] = [
    { id: 'analyze', name: 'Analyzing source content' },
    { id: 'guidelines', name: 'Constructing AI prompt' },
    { id: 'creating', name: 'Generating questions with AI' },
    { id: 'formatting', name: 'Parsing AI response' },
    { id: 'validating', name: 'Validating output' },
];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const startGenerationProcess = async (sessionId: string, cost: number) => {
    let session = getSession(sessionId);
    if (!session) {
        console.error(`Session not found for ID: ${sessionId}`);
        return;
    }

    const user = await prisma.user.findUnique({ where: { clerkId: session.userId }});
    if (!user) {
        console.error(`User with Clerk ID ${session.userId} not found.`);
        return;
    }

    try {
        // --- Simulation of generation stages ---
        session.status = GenerationStatus.Processing;
        session.stages = MOCK_STAGES.map((s, i) => ({ ...s, status: i === 0 ? 'current' : 'pending' }));
        session.progress = 10;
        session.eta = 30;
        updateSession(sessionId, session);
        broadcast({ type: 'statusUpdate', payload: session });
        await sleep(1000);

        session.stages[0].status = 'completed';
        session.stages[1].status = 'current';
        session.progress = 25;
        updateSession(sessionId, session);
        broadcast({ type: 'statusUpdate', payload: session });
        await sleep(1000);

        session.stages[1].status = 'completed';
        session.stages[2].status = 'current';
        session.progress = 50;
        updateSession(sessionId, session);
        broadcast({ type: 'statusUpdate', payload: session });

        const generatedQuestions = await generateQuestionsFromOpenAI(session.requestData);
        
        session.stages[2].status = 'completed';
        session.stages[3].status = 'current';
        session.progress = 80;
        session.eta = 5;
        updateSession(sessionId, session);
        broadcast({ type: 'statusUpdate', payload: session });
        await sleep(1000);

        session.stages[3].status = 'completed';
        session.stages[4].status = 'current';
        session.progress = 95;
        updateSession(sessionId, session);
        broadcast({ type: 'statusUpdate', payload: session });
        await sleep(500);

        // --- Final "completed" state ---
        session.status = GenerationStatus.Completed;
        session.progress = 100;
        session.eta = 0;
        session.stages = MOCK_STAGES.map(s => ({ ...s, status: 'completed' }));
        session.result = generatedQuestions;

        // Save to history
        await prisma.generationHistory.create({
            data: {
                userId: user.id,
                status: GenerationStatus.Completed,
                sourceType: session.requestData.sourceType,
                questionCount: generatedQuestions.length,
                cost: cost,
                outcome: `${generatedQuestions.length} questions generated successfully.`
            }
        });

        updateSession(sessionId, session);
        broadcast({ type: 'statusUpdate', payload: session });

    } catch (error: any) {
        console.error(`Error in generation process for session ${sessionId}:`, error);
        let errorSession = getSession(sessionId);
        if (errorSession) {
            errorSession.status = GenerationStatus.Failed;
            errorSession.error = error.message || 'An unexpected error occurred during generation.';
            
            // Save failure to history
            await prisma.generationHistory.create({
                data: {
                    userId: user.id,
                    status: GenerationStatus.Failed,
                    sourceType: errorSession.requestData.sourceType,
                    questionCount: 0,
                    cost: cost,
                    outcome: errorSession.error,
                }
            });

            // Refund credits on failure
            await prisma.user.update({
                where: { id: user.id },
                data: { balance: { increment: cost } }
            });

            updateSession(sessionId, errorSession);
            broadcast({ type: 'error', payload: errorSession });
        }
    }
};
