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
- React with TypeScript
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

2. Install dependencies:
```bash
npm install
```

3. Push the database schema:
```bash
npm run db:push
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

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
