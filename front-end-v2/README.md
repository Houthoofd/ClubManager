# ClubManager Frontend V2 🚀

Modern React application built with **Feature-Sliced Design (FSD)** architecture.

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development](#development)
- [Architecture](#architecture)
- [Features](#features)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## 🎯 Overview

ClubManager Frontend V2 is a complete rewrite of the original frontend application, implementing modern best practices and a clean architecture using Feature-Sliced Design (FSD).

### Key Improvements

✅ **Clean Architecture** - Feature-Sliced Design (FSD)  
✅ **Type Safety** - Strict TypeScript configuration  
✅ **Error Handling** - Result pattern with `@clubmanager/types`  
✅ **No Hardcoded Secrets** - Secure environment variable management  
✅ **Modern Tooling** - Vite, React 18, React Query 5  
✅ **Developer Experience** - Fast HMR, DevTools, ESLint  
✅ **Code Quality** - Prettier, strict linting rules  
✅ **Testing Ready** - Vitest + Testing Library setup  

---

## 🛠 Tech Stack

### Core
- **React 18** - UI library
- **TypeScript 5.8** - Type safety
- **Vite 6** - Build tool and dev server

### State & Data Fetching
- **TanStack Query v5** - Server state management
- **React Router v7** - Client-side routing

### UI Components
- **PatternFly 6** - Enterprise UI component library
- **PatternFly React Icons** - Icon library

### Data & Validation
- **Zod** - Schema validation
- **@clubmanager/types** - Shared types package

### Utilities
- **js-cookie** - Cookie management
- **recharts** - Data visualization

### Development
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Vitest** - Unit testing
- **Testing Library** - React component testing

---

## 📁 Project Structure

```
front-end-v2/
├── public/                  # Static assets
├── src/
│   ├── app/                # Application layer (initialization, providers, routing)
│   │   ├── providers/     # React context providers
│   │   ├── router/        # Route configuration
│   │   └── styles/        # Global styles
│   │
│   ├── pages/             # Page components (full screens)
│   │   ├── auth/          # Authentication pages
│   │   ├── dashboard/     # Dashboard pages
│   │   └── courses/       # Course pages
│   │
│   ├── widgets/           # Composite UI blocks
│   │   └── (to be added)
│   │
│   ├── features/          # Business features (user-facing functionality)
│   │   ├── auth/          # ✅ Authentication feature (complete)
│   │   │   ├── api/       # API calls
│   │   │   ├── model/     # Business logic & types
│   │   │   └── ui/        # UI components
│   │   └── (more to add)
│   │
│   ├── entities/          # Business entities (domain models)
│   │   └── (to be added)
│   │
│   └── shared/            # Shared infrastructure
│       ├── api/           # HTTP client with Result pattern
│       ├── config/        # Environment configuration
│       ├── lib/           # Utilities
│       └── ui/            # Reusable UI components
│
├── .env.example           # Environment variables template
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### FSD Layer Import Rules

```
app     → pages, widgets, features, entities, shared
pages   → widgets, features, entities, shared
widgets → features, entities, shared
features → entities, shared
entities → shared
shared  → (nothing - no imports from upper layers)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 20.0.0
- **npm** >= 10.0.0

### Installation

```bash
# 1. Navigate to the project directory
cd front-end-v2

# 2. Install dependencies
npm install

# 3. Copy environment variables template
cp .env.example .env.local

# 4. Configure your environment variables
# Edit .env.local with your actual values
```

### Environment Variables

See `.env.example` for all required and optional environment variables.

**Required:**
- `VITE_API_BASE_URL` - Backend API URL
- `VITE_STRIPE_PUBLIC_KEY` - Stripe public key

**Important:** Never commit `.env.local` to git!

---

## 💻 Development

### Available Scripts

```bash
# Start development server (with hot reload)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Type check
npm run type-check

# Format code with Prettier
npm run format

# Check formatting
npm run format:check

# Run tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Analyze bundle size
npm run analyze
```

### Development Server

```bash
npm run dev
```

The application will be available at: http://localhost:5173

### Hot Module Replacement (HMR)

Vite provides instant HMR - your changes will be reflected immediately without losing application state.

---

## 🏗 Architecture

### Feature-Sliced Design (FSD)

This project follows [Feature-Sliced Design](https://feature-sliced.design/) - a modern architectural methodology for frontend applications.

#### Core Principles

1. **Explicit business logic** - Features represent user-facing functionality
2. **Controlled coupling** - Strict import rules between layers
3. **Isolation** - Each feature is self-contained
4. **Incremental adoption** - Can migrate feature by feature

#### Layers (from top to bottom)

| Layer | Purpose | Can Import From |
|-------|---------|-----------------|
| `app` | Application initialization & providers | All layers |
| `pages` | Page compositions | widgets, features, entities, shared |
| `widgets` | Large composite UI blocks | features, entities, shared |
| `features` | Business features | entities, shared |
| `entities` | Business entities | shared |
| `shared` | Infrastructure & UI kit | None |

### HTTP Client with Result Pattern

All API calls use the **Result pattern** from `@clubmanager/types`:

```typescript
import { apiClient } from '@shared/api/client';

const result = await apiClient.get<User>('/users/me');

if (result.isOk()) {
  const user = result.value;
  console.log(user);
} else {
  const error = result.error;
  console.error(error.message);
}
```

Benefits:
- ✅ Type-safe error handling
- ✅ No try-catch boilerplate
- ✅ Explicit error types
- ✅ Better IDE support

---

## ✨ Features

### ✅ Implemented

- **Authentication** (complete feature)
  - Login / Logout
  - Registration
  - Forgot Password
  - Reset Password
  - Token management
  - Protected routes
  - Role-based access control

### 🔄 In Progress

- Dashboard
- Course management

### 📋 Planned

- Member management
- Session scheduling
- Payment integration
- Notifications
- Profile management
- Reports & analytics

---

## 🧪 Testing

### Test Structure

```
src/
└── features/
    └── auth/
        ├── api/
        │   └── authApi.test.ts
        ├── model/
        │   └── useAuth.test.ts
        └── ui/
            └── LoginForm.test.tsx
```

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

### Writing Tests

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('renders login form', () => {
    render(<LoginForm onSubmit={vi.fn()} />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });
});
```

---

## 📦 Deployment

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

### Environment-Specific Builds

```bash
# Production build
npm run build -- --mode production

# Staging build
npm run build -- --mode staging
```

### Docker Deployment

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 🤝 Contributing

### Code Style

- Follow FSD architecture principles
- Use TypeScript strict mode
- Write meaningful commit messages
- Add JSDoc comments for public APIs
- Keep components small and focused

### Git Workflow

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/your-feature-name
```

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

---

## 📚 Resources

### Documentation

- [Feature-Sliced Design](https://feature-sliced.design/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [TanStack Query](https://tanstack.com/query/latest)
- [PatternFly React](https://www.patternfly.org/v4/)

### Related Packages

- [@clubmanager/types](../packages/types) - Shared types and utilities

---

## 📄 License

MIT License - see LICENSE file for details

---

## 👥 Team

ClubManager Development Team

---

## 🐛 Bug Reports

Found a bug? Please open an issue on GitHub with:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)

---

## 💡 Feature Requests

Have an idea? Open a feature request issue with:
- Use case description
- Proposed solution
- Alternative solutions considered

---

**Built with ❤️ using Feature-Sliced Design**