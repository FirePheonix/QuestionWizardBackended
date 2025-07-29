import { Router } from 'express';
import express from 'express';
import { handleWebhook } from '../controllers/webhookController';

const router = Router();

// Use express.raw() to get the raw body for signature verification
router.post('/', express.raw({ type: 'application/json' }), handleWebhook);

export default router;
