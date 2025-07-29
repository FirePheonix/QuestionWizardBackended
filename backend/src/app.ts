import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger';
import 'dotenv/config';

// Import routes
import questionTypesRoutes from './routes/questionTypes';
import sourceRoutes from './routes/source';
import generationRoutes from './routes/generation';
import balanceRoutes from './routes/balance';
import webhookRoutes from './routes/webhooks';

const app: Express = express();

// --- Middleware ---
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(morgan('dev'));

// Rate Limiting
const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100,
	standardHeaders: true,
	legacyHeaders: false, 
});

const generationLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 10, 
    message: 'Too many generation requests from this IP, please try again after 10 minutes.',
    standardHeaders: true,
	legacyHeaders: false, 
});

// --- Routes ---

// A simple health-check route
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Server is healthy and running!' });
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Clerk Webhook route - MUST come before express.json()
app.use('/api/webhooks', webhookRoutes);

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Versioned API Routes
const apiV1Router = express.Router();
apiV1Router.use('/api/', apiLimiter);

apiV1Router.use('/ai-generation/question-types', questionTypesRoutes);
apiV1Router.use('/ai-generation/source', sourceRoutes);
apiV1Router.use('/ai-generation/balance', balanceRoutes);
apiV1Router.use('/ai-generation', generationLimiter, generationRoutes);

app.use('/api/v1', apiV1Router);

// --- Error Handling ---
interface AppError extends Error {
    statusCode?: number;
}

app.use((err: AppError, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        message: err.message || 'An unexpected error occurred on the server.',
        stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
    });
});

export default app;
