# Project Setup

### All necessary Prompts i used:
    https://claude.ai/share/404766b4-ad4f-403e-8b6f-53491bbab672
    
    To run this project, follow these steps:
    
    1. Extract the zip file.
    2. Run `npm install` to install dependencies.
    3. Setting up .env files:

# I'll help you set up Clerk webhooks using ngrok. Let me first explore the repository structure to understand the current setup and then provide you with step-by-step instructions.

Read file: backend/package.json
Read file: backend/src/server.ts
Read file: backend/src/app.ts
Read file: backend/src/routes/webhooks.ts
Read file: backend/src/utils/prisma.ts
Read file: backend/prisma/schema.prisma
Now let me check if there's a .env file or any environment configuration:

Ran tool
Ran tool
Based on my analysis of the repository, I can see that you have a Node.js/Express backend with Clerk webhook integration already set up. However, there are some missing dependencies and configuration issues. Let me provide you with a comprehensive step-by-step guide to set up Clerk webhooks using ngrok.

## Step-by-Step Guide to Set Up Clerk Webhooks with ngrok

### Step 1: Install Missing Dependencies

First, you need to install the missing Clerk SDK dependency:

```bash
cd backend && npm install @clerk/clerk-sdk-node
```
```bash
cd backend
```
```bash
npm install @clerk/clerk-sdk-node
```
Great! Now let me fix the Prisma utility file and then provide you with the complete setup guide:

```bash
npm install @prisma/client
```
Now let me create a comprehensive setup guide for you:

## Complete Step-by-Step Guide to Set Up Clerk Webhooks with ngrok

### Step 1: Environment Configuration

Create a `.env` file in your backend directory:

## Complete Step-by-Step Guide to Set Up Clerk Webhooks with ngrok

### Step 1: Environment Configuration

Create a `.env` file in your `backend` directory with the following content:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/your_database_name"

# Clerk Configuration
CLERK_WEBHOOK_SECRET="your_clerk_webhook_secret_here"
CLERK_SECRET_KEY="your_clerk_secret_key_here"

# Server Configuration
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# OpenAI (if you're using it)
OPENAI_API_KEY="your_openai_api_key_here"
```
Create a `.env` file in your `frontend` directory with the following content:

```env

# Clerk Publishable Key (https://dashboard.clerk.com/apps/**YOUR_APP_ID**/api-keys)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# The URL of your backend server for API proxying
VITE_API_BASE_URL=http://localhost:3001

```

### Step 2: Set Up Database

1. **Install Prisma CLI globally** (if not already installed):
   ```bash
   npm install -g prisma
   ```

2. **Generate Prisma client**:
   ```bash
   cd backend
   npx prisma generate
   ```

3. **Set up your database** (PostgreSQL):
   - Install PostgreSQL if you haven't already
   - Create a database
   - Update the `DATABASE_URL` in your `.env` file

4. **Run database migrations**:
   ```bash
   npx prisma migrate dev --name init
   ```

### Step 3: Install ngrok

1. **Download ngrok** from [https://ngrok.com/download](https://ngrok.com/download)

2. **Sign up for a free account** and get your authtoken

3. **Authenticate ngrok**:
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

### Step 4: Start Your Backend Server

1. **Install dependencies** (already done):
   ```bash
   cd backend
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

Your server should now be running on `http://localhost:3001`

### Step 5: Expose Your Server with ngrok

1. **Start ngrok** to expose your local server:
   ```bash
   ngrok http 3001
   ```

2. **Copy the HTTPS URL** that ngrok provides (e.g., `https://abc123.ngrok.io`)

### Step 6: Configure Clerk Webhook

1. **Go to your Clerk Dashboard** at [https://dashboard.clerk.com](https://dashboard.clerk.com)

2. **Navigate to Webhooks**:
   - Go to your application
   - Click on "Webhooks" in the sidebar
   - Click "Add endpoint"

3. **Configure the webhook**:
   - **Endpoint URL**: `https://your-ngrok-url.ngrok.io/api/webhooks`
   - **Events to send**: Select the events you want to receive:
     - `user.created`
     - `user.updated` 
     - `user.deleted`
   - **Version**: Select the latest version

4. **Copy the webhook secret**:
   - After creating the webhook, Clerk will show you a webhook secret
   - Copy this secret and update your `.env` file:
     ```env
     CLERK_WEBHOOK_SECRET="whsec_your_webhook_secret_here"
     ```

### Step 7: Test the Webhook

1. **Create a test user** in your Clerk dashboard or sign up through your application

2. **Check your server logs** to see if the webhook is being received:
   ```
   Received webhook event: user.created
   Webhook user.created processed.
   ```

3. **Verify in your database** that the user was created with the initial balance of 10,000,000 credits

### Step 8: Production Considerations

For production, you'll need to:

1. **Use a proper domain** instead of ngrok
2. **Set up SSL certificates**
3. **Configure your production database**
4. **Update environment variables** for production

### Troubleshooting

**Common Issues:**

1. **"Cannot find module '@clerk/clerk-sdk-node'"**:
   - Run `npm install @clerk/clerk-sdk-node` in the backend directory

2. **"Cannot find module '@prisma/client'"**:
   - Run `npx prisma generate` to generate the Prisma client

3. **Webhook verification fails**:
   - Make sure your `CLERK_WEBHOOK_SECRET` is correct
   - Check that the webhook URL is accessible from the internet

4. **Database connection issues**:
   - Verify your `DATABASE_URL` is correct
   - Make sure PostgreSQL is running
   - Run `npx prisma migrate dev` to set up the database

5. **ngrok URL changes**:
   - ngrok URLs change each time you restart ngrok (on free plan)
   - Update your Clerk webhook URL when this happens
   - Consider upgrading to ngrok Pro for static URLs

### Current Webhook Implementation

Your webhook controller (`backend/src/controllers/webhookController.ts`) handles these events:

- **`user.created`**: Creates a new user with 10,000,000 initial credits
- **`user.updated`**: Updates user email
- **`user.deleted`**: Removes user from database

The webhook is properly configured to:
- Verify signatures using the Svix library
- Handle raw body data for signature verification
- Process events asynchronously
- Return appropriate HTTP status codes

This setup will allow Clerk to automatically sync user data with your application's database whenever users sign up, update their profiles, or delete their accounts.

    
    This project was generated through Alpha. For more information, visit [dualite.dev](https://dualite.dev).
