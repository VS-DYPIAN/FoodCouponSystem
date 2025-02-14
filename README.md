
# Food Coupon Management System

A comprehensive food coupon management system designed to streamline transactions between employees and vendors with advanced role-based access control.

## Features

- 🔐 Role-based Authentication (Admin/Employee/Vendor)
- 💳 Wallet Management System
- 💸 Real-time Transaction Tracking
- 📊 Role-specific Dashboards
- 🔔 Real-time Notifications
- 💱 Flexible Payment Mechanisms

## Tech Stack

### Frontend
- React with
 TypeScript
- TanStack Query for API data fetching
- Shadcn UI components
- Tailwind CSS for styling
- WebSocket for real-time notifications

### Backend
- Express.js with TypeScript
- PostgreSQL database with Drizzle ORM
- Passport.js for authentication
- WebSocket server for real-time features

## Prerequisites

- Node.js (v20 or later)
- PostgreSQL database
- npm or yarn package manager

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
DATABASE_URL=postgresql://user:password@host:port/dbname
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/food-coupon-system.git
cd food-coupon-system
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
Create a `.env` file in the root directory with the following variables:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/food_coupon_db
```
Replace `user`, `password`, and `food_coupon_db` with your PostgreSQL credentials.

4. **Create and setup PostgreSQL database:**
```bash
# Create database
psql -U postgres
CREATE DATABASE food_coupon_db;
\q

# Push the database schema
npm run db:push
```

5. **Start the development server:**
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Available Scripts

- `npm run dev`: Start the development server
- `npm run build`: Build the application for production
- `npm start`: Run the production server
- `npm run check`: Type-check the TypeScript code
- `npm run db:push`: Push database schema changes

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utility functions and configurations
│   │   └── pages/        # Page components
├── server/                # Backend Express application
│   ├── routes.ts         # API routes
│   ├── auth.ts           # Authentication logic
│   ├── websocket.ts      # WebSocket server
│   └── storage.ts        # Database operations
└── shared/               # Shared TypeScript types and schemas
<<<<<<< HEAD
    └── schema.ts         # Database schema and types
```

## Available Scripts

- `npm run dev`: Start the development server
- `npm run build`: Build the application for production
- `npm start`: Run the production server
- `npm run check`: Type-check the TypeScript code
- `npm run db:push`: Push database schema changes

## License

MIT License
>>>>>>> bc84de0 (Agent step too complex - Build the initial prototype)
=======
    └── schema.ts         # Database schema and types
>>>>>>> 2d05de4 (Agent query: Can you test the forgot password functionality by clicking 'Forgot Password?' on the login page and verify if the form appears correctly?)

