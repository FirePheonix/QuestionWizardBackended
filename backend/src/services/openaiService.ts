import OpenAI from 'openai';
import { StartGenerationRequest, GeneratedQuestion } from '../types';
import { v4 as uuidv4 } from 'uuid';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

const generateSystemPrompt = (): string => {
    return `You are an expert AI assistant that generates high-quality quiz and poll questions. Your task is to create questions based on the user's provided source content and guidelines.

You MUST adhere to the following rules:
1.  Your entire response MUST be a single, valid JSON object.
2.  The root of this JSON object MUST have a single key named "questions".
3.  The value of the "questions" key MUST be an array of "GeneratedQuestion" objects.
4.  Each "GeneratedQuestion" object MUST have the following properties: "id", "type", "questionText", "options", "points", "difficulty", "qualityScore", and "explanation".
5.  The "id" must be a unique UUID string for each question. You must generate this UUID yourself.
6.  The "type" must be one of the following strings: "radio", "checkbox", "true_false", "ranking", "rating", "fill_blank", "short_text", "matching", "essay".
7.  "questionText" is the main text of the question.
8.  "options" is an array of "QuestionOption" objects.
9.  Each "QuestionOption" object MUST have "id" (a unique UUID you generate), "text", and "isCorrect" (boolean). For "matching" questions, it should also include a "match" property with the corresponding option text.
10. "points" is an integer number of points for the question.
11. "difficulty" must be one of "Easy", "Medium", or "Hard".
12. "qualityScore" is your confidence in the quality of the question, an integer from 0 to 100.
13. "explanation" is a brief rationale for the correct answer.

Do not include any text, markdown, or explanations outside of the main JSON object.
`;
};

const generateUserPrompt = (request: StartGenerationRequest): string => {
    let sourceInfo = '';
    if (request.sourceType === 'text' && request.sourceText) {
        sourceInfo = `Source Content (Text):\n---\n${request.sourceText}\n---`;
    } else {
        sourceInfo = `Source Content: The user has provided a ${request.sourceType} file. Please generate questions based on the general topic implied by the request.`;
    }

    const questionRequests = request.questionTypes
        .map(qt => `- ${qt.quantity} question(s) of type "${qt.id}"`)
        .join('\n');

    return `Please generate questions based on the following requirements:

## Generation Guidelines
- Target Audience: ${request.guidelines.targetAudience}
- Language: ${request.guidelines.language}
- Tone: ${request.guidelines.tone}

## Source Information
${sourceInfo}

## Requested Questions
${questionRequests}

Remember to follow all rules from the system prompt and provide your response as a single, valid JSON object with a "questions" key.
`;
};

export const generateQuestionsFromOpenAI = async (request: StartGenerationRequest): Promise<GeneratedQuestion[]> => {
    if (!OPENAI_API_KEY) {
        throw new Error('OpenAI API key is not configured.');
    }
    
    try {
        const systemPrompt = generateSystemPrompt();
        const userPrompt = generateUserPrompt(request);

        const response = await openai.chat.completions.create({
            model: 'gpt-4-turbo',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
        });

        const content = response.choices[0].message.content;
        if (!content) {
            throw new Error('OpenAI returned an empty response.');
        }

        const result = JSON.parse(content);

        const questionsArray = result.questions;

        if (!Array.isArray(questionsArray)) {
            console.error("OpenAI response did not contain a 'questions' array:", content);
            throw new Error("The AI's response was not in the expected format. It did not contain a 'questions' array.");
        }

        // Add UUIDs if the model forgets to, ensuring data integrity
        return questionsArray.map((q: any) => ({
            ...q,
            id: q.id || uuidv4(),
            options: q.options.map((opt: any) => ({
                ...opt,
                id: opt.id || uuidv4(),
            })),
        })) as GeneratedQuestion[];

    } catch (error) {
        console.error('Error calling OpenAI API:', error);
        if (error instanceof OpenAI.APIError) {
            throw new Error(`OpenAI API Error: ${error.status} ${error.name} - ${error.message}`);
        }
        throw new Error('Failed to generate questions using OpenAI.');
    }
};
