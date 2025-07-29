import { Request, Response } from 'express';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/clerk-sdk-node';
import prisma from '../utils/prisma';

export const handleWebhook = async (req: Request, res: Response) => {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
    if (!WEBHOOK_SECRET) {
        throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env');
    }

    const headers = req.headers;
    const svix_id = headers['svix-id'] as string;
    const svix_timestamp = headers['svix-timestamp'] as string;
    const svix_signature = headers['svix-signature'] as string;

    if (!svix_id || !svix_timestamp || !svix_signature) {
        return res.status(400).json({ error: 'Error occurred -- no svix headers' });
    }

    const payload = req.body;
    const body = JSON.stringify(payload);
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: WebhookEvent;
    try {
        evt = wh.verify(body, {
            'svix-id': svix_id,
            'svix-timestamp': svix_timestamp,
            'svix-signature': svix_signature,
        }) as WebhookEvent;
    } catch (err) {
        console.error('Error verifying webhook:', err);
        return res.status(400).json({ 'Error': err });
    }

    const eventType = evt.type;
    console.log(`Received webhook event: ${eventType}`);

    try {
        switch (eventType) {
            case 'user.created':
                await prisma.user.create({
                    data: {
                        clerkId: evt.data.id,
                        email: evt.data.email_addresses[0].email_address,
                        balance: 10000000, // Give 10 million credits on sign-up
                    },
                });
                break;

            case 'user.updated':
                await prisma.user.update({
                    where: { clerkId: evt.data.id },
                    data: {
                        email: evt.data.email_addresses[0].email_address,
                    },
                });
                break;

            case 'user.deleted':
                await prisma.user.delete({
                    where: { clerkId: evt.data.id },
                });
                break;
        }
        res.status(200).json({ success: true, message: `Webhook ${eventType} processed.` });
    } catch (error) {
        console.error(`Error processing webhook ${eventType}:`, error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
