# PlanD - School Absence Management System

A professional school absence management SaaS application built with Next.js, NextAuth, and TypeScript.

## Features

- 🔐 **Secure Authentication** - NextAuth with credentials provider
- 🎨 **Modern UI** - Clean, professional design with Tailwind CSS
- 🛡️ **Protected Routes** - Middleware-based route protection
- 📱 **Responsive Design** - Works on all devices
- 🔄 **Session Management** - JWT-based sessions
- 🏫 **School Management** - Multi-tenant architecture ready

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```bash
# NextAuth Configuration
NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production
NEXTAUTH_URL=http://localhost:3000

# Database (for future use)
# DATABASE_URL="postgresql://username:password@localhost:5432/pland"
```

### 3. Run Development Server

```bash
npm run dev
```

### 4. Access the Application

- **Home Page**: http://localhost:3000
- **Login Page**: http://localhost:3000/login
- **Dashboard**: http://localhost:3000/dashboard (requires authentication)

## Test Credentials

For testing purposes, use these hardcoded credentials:

- **Email**: admin@school.com
- **Password**: password123

## Project Structure

```
src/
├── app/
│   ├── api/auth/[...nextauth]/route.ts  # NextAuth API routes
│   ├── auth.ts                          # NextAuth configuration
│   ├── dashboard/page.tsx               # Protected dashboard
│   ├── login/page.tsx                   # Login page
│   ├── layout.tsx                       # Root layout with auth provider
│   └── page.tsx                         # Landing page
├── middleware.ts                        # Route protection middleware
└── types/
    └── next-auth.d.ts                   # TypeScript declarations
```

## Authentication Flow

1. **Unauthenticated users** are redirected to `/login`
2. **Login form** validates credentials against hardcoded test user
3. **Successful login** redirects to `/dashboard`
4. **Protected routes** are guarded by middleware
5. **Session management** handled by NextAuth with JWT strategy

## Database Schema (Future Implementation)

The application is designed to work with the following database schema:

### Users Table
- `id` - Unique identifier
- `email` - User email (unique)
- `password` - Hashed password
- `name` - User's full name
- `role` - User role (admin, teacher, etc.)
- `schoolId` - Foreign key to Schools table

### Schools Table
- `id` - Unique identifier
- `name` - School name
- `location` - School location
- `type` - School type (public, private, charter)
- `settings` - JSON field for school-specific settings

## Production Deployment

### Environment Variables

For production, ensure you have:

```bash
NEXTAUTH_SECRET=your-production-secret-key
NEXTAUTH_URL=https://your-domain.com
DATABASE_URL=your-production-database-url
```

### Security Considerations

1. **Change the default secret** in production
2. **Use HTTPS** in production
3. **Implement proper password hashing** when connecting to database
4. **Add rate limiting** for login attempts
5. **Enable CSRF protection**

## Development

### Adding New Protected Routes

1. Add the route to the middleware matcher in `src/middleware.ts`
2. Create the page component
3. Use `useSession()` hook to access user data

### Customizing Authentication

1. Modify `src/app/auth.ts` for authentication logic
2. Update `src/types/next-auth.d.ts` for TypeScript types
3. Customize login page in `src/app/login/page.tsx`

## Technologies Used

- **Next.js 15** - React framework
- **NextAuth.js** - Authentication library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Prisma** - Database ORM (ready for future use)
- **bcryptjs** - Password hashing

## License

This project is licensed under the MIT License.
