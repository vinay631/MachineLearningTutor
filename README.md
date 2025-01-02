# ML Learning Platform

A web-based Machine Learning education platform that enables interactive learning through hands-on coding exercises and in-browser Python execution. The platform covers foundational and advanced ML topics including Neural Networks, CNNs, and Natural Language Processing.

## Features

- 📚 Structured learning modules with progressive difficulty
- 💻 Interactive Python code execution in the browser using Pyodide
- ✅ Automated test cases and guided hints
- 📊 Progress tracking and performance metrics
- 🔐 User authentication and session management
- 📱 Responsive design for all devices

## Prerequisites

Before you begin, ensure you have installed:

- Node.js (v18 or later)
- PostgreSQL (v14 or later)
- npm (usually comes with Node.js)

## Installation

1. Clone the repository:
```bash
git clone [your-repository-url]
cd ml-learning-platform
```

2. Install dependencies:
```bash
npm install
```

## Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE ml_learning;
```

2. Set up your environment variables by creating a `.env` file in the root directory:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/ml_learning
PGUSER=your_username
PGPASSWORD=your_password
PGHOST=localhost
PGPORT=5432
PGDATABASE=ml_learning
```

3. Push the database schema:
```bash
npm run db:push
```

## Running the Application

1. Start the development server:
```bash
npm run dev
```

2. Open your browser and navigate to:
```
http://localhost:5000
```

## Project Structure

```
├── client/                  # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions
│   │   └── pages/         # Page components
├── db/                     # Database configuration
│   ├── schema.ts          # Drizzle ORM schema
│   └── index.ts           # Database connection
├── server/                 # Backend Express server
│   ├── auth.ts            # Authentication logic
│   ├── routes.ts          # API routes
│   └── index.ts           # Server entry point
```

## Available Scripts

- `npm run dev`: Starts both frontend and backend in development mode
- `npm run build`: Builds the application for production
- `npm run db:push`: Updates the database schema
- `npm run check`: Runs TypeScript type checking

## Features Overview

### Authentication
- User registration and login
- Session management
- Secure password hashing

### Learning Modules
- Progressive difficulty levels
- Interactive coding exercises
- Multiple-choice questions
- Real-time code execution
- Automated test cases

### Progress Tracking
- Score tracking per lesson
- Progress visualization
- Learning streaks
- Experience points (XP)

### Code Editor
- Syntax highlighting
- Error detection
- Code execution in browser
- Test case validation

## Tech Stack

- Frontend: React.js with TypeScript
- Backend: Node.js/Express
- Database: PostgreSQL with Drizzle ORM
- UI: Tailwind CSS with shadcn/ui
- Code Execution: Pyodide
- Authentication: Passport.js
- State Management: TanStack Query
- Routing: Wouter

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
