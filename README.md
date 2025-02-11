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
    └── schema.ts         # Database schema and types