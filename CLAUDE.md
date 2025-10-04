# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **gym-buddy fitness dashboard** project built using the **DashTail** admin dashboard template. The project serves as a comprehensive platform for fitness enthusiasts to track their workouts, nutrition, and progress.

## Project Structure

This is a monorepo with two main directories:

- **`app/`** - **Main gym-buddy application** (active development directory)
  - Currently minimal with basic dashboard setup
  - This is where we implement all gym-buddy specific features
  - Uses DashTail template as foundation

- **`example/`** - **Complete DashTail template reference** (read-only reference)
  - Full-featured admin dashboard with 200+ components
  - Comprehensive examples of all available UI patterns
  - **Always reference this directory when implementing new features**
  - Contains 1400+ source files showcasing every component and pattern

Both directories are complete Next.js applications with their own `package.json` files.

## Development Commands

Navigate to either `app/` or `example/` directory first, then run:

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

The development server runs on http://localhost:3000.

**IMPORTANT**: Before starting the development server, ALWAYS check if it's already running to avoid conflicts. Use tools like `BashOutput` to check existing background processes or look for port usage before running `npm run dev` or `pnpm run dev`.

## Architecture Overview

### User Roles & Authentication

The application uses a simplified role-based access control system:

**User Roles:**
- `USER` - Standard fitness enthusiast (default role for all new users)
- `GYM_ADMIN` - Gym administrator with management capabilities
- `SUPER_ADMIN` - System administrator with full access

**Authentication Flow:**
1. Users sign up via credentials (email/password) or OAuth (Google/GitHub)
2. All new users are assigned the `USER` role by default
3. After signup, users must complete the onboarding process:
   - Basic info (phone number, terms acceptance)
   - Profile data (gender, date of birth, height)
   - Training info (level, activity level, years of training)
   - Body composition (weight, body fat percentage)
4. Only after completing onboarding can users access the dashboard

**Key Models:**
- `User` ([lib/models/User.ts](lib/models/User.ts)) - User authentication and basic info
- `UserStaticProfile` - Static fitness profile data (gender, height, etc.)
- `BodyComposition` - Trackable body metrics over time

**Permission System:**
- Located in [lib/permissions.ts](lib/permissions.ts)
- Role hierarchy: USER (1) < GYM_ADMIN (2) < SUPER_ADMIN (3)
- Users can only access and modify their own data
- Admins have elevated permissions for user management

### Core Technologies
- **Next.js 14** with App Router (`app/` directory structure)
- **TypeScript** for type safety
- **Tailwind CSS** for styling with custom configuration
- **Zustand** for state management (themes, sidebar, layout)
- **Radix UI** components for accessible primitives
- **React Hook Form** with Zod validation
- **Tanstack Query** for data fetching
- **NextAuth.js** for authentication

### Key UI Libraries
- **Framer Motion** for animations
- **Lucide React** for icons
- **Recharts**, **ApexCharts**, **Chart.js** for data visualization
- **FullCalendar** for calendar functionality
- **React DnD** for drag and drop

### State Management
The application uses Zustand with persistence for:
- **Theme Store** (`useThemeStore`): Theme, radius, layout, navbar/footer types, RTL
- **Sidebar Store** (`useSidebar`): Collapsed state, sidebar type, mobile menu, background

### Layout System
- **Multi-layout support**: vertical, horizontal, semi-box
- **Sidebar types**: module, classic, popover
- **Navbar types**: sticky, floating, static
- **Theme system**: Custom CSS variables with radius control
- **RTL support**: Built-in right-to-left language support

### Provider Hierarchy
```
AuthProvider
  └── TanstackProvider
      └── Providers (Theme + Toasters)
          └── DirectionProvider
              └── App Content
```

### Configuration Files
- `config/site.ts` - Global site configuration (theme, layout defaults)
- `config/menus.ts` - Navigation menu structure for main nav and sidebar
- `store/index.ts` - Zustand stores for theme and sidebar state
- `lib/utils.ts` - Utility functions including `cn()` for class merging

### Component Organization
- `components/ui/` - Reusable UI components (shadcn/ui style)
- `components/partials/` - Layout partials (header, sidebar, footer)
- `components/auth/` - Authentication related components
- `components/svg/` - Custom SVG icons
- `app/(dashboard)/` - Dashboard pages with shared layout

### Styling Approach
- **Tailwind CSS** with custom theme configuration
- **CSS custom properties** for dynamic theming
- **SCSS globals** for base styles
- **Component-scoped styling** using Tailwind classes
- **Dark mode support** via `next-themes`

### Development Notes
- Uses TypeScript strict mode
- ESLint configured with Next.js rules
- Hot reload enabled for development
- Component composition over inheritance pattern
- Extensive use of Radix UI for accessibility

## Gym-Buddy Development Guidelines

### When Implementing New Features

1. **Always reference the example directory first**
   - Look for similar UI patterns in `example/app/[lang]/(dashboard)/`
   - Copy component structure and styling patterns
   - Adapt the example code for gym-buddy specific needs

2. **Feature Reference Mapping**
   - **Dashboard Analytics** → `example/app/[lang]/(dashboard)/(home)/dashboard/`
   - **User Profiles** → `example/app/[lang]/(dashboard)/user-profile/`
   - **Forms (User assessments, workout logging)** → `example/app/[lang]/(dashboard)/(forms)/`
   - **Charts (Progress tracking, stats)** → `example/app/[lang]/(dashboard)/(chart)/`
   - **Calendar (Workout scheduling)** → `example/app/[lang]/(dashboard)/(apps)/calendar/`
   - **Data Tables (Workout history, nutrition logs)** → `example/app/[lang]/(dashboard)/(tables)/`
   - **Task Management (Workout plans, fitness goals)** → `example/app/[lang]/(dashboard)/(apps)/task/`
   - **Authentication** → `example/app/[lang]/auth/`

3. **Key Components for Fitness Features**
   - **Progress Tracking**: Use progress bars from `example/components/ui/progress.tsx`
   - **Workout Charts**: ApexCharts, Recharts examples in `(chart)` directories
   - **Data Tables**: Table components with search/filter from `(tables)` directories
   - **Workout Scheduling**: FullCalendar integration from `(apps)/calendar`
   - **Goal Tracking**: Rating components from `(forms)/rating`
   - **Statistics Cards**: Dashboard cards from `(home)/dashboard/components/`

### DashTail Template Features Available

**Fitness-Relevant Components (200+ total):**
- **18 Chart types** (ApexCharts, Recharts, Chart.js, Unovis) for tracking fitness metrics
- **54+ UI components** including forms, tables, progress indicators
- **Calendar integration** with FullCalendar for workout scheduling
- **User profile system** with activity tracking and settings
- **Data visualization** for progress tracking, statistics, analytics
- **Task management** system for workout plans and goals
- **Authentication system** with NextAuth.js (credentials + OAuth)
- **Multiple dashboard layouts** (analytics, ecommerce, project)
- **Advanced form components** with validation for user assessments
- **Rating systems** for workout difficulty and satisfaction
- **Timeline components** for workout history and progress tracking

### Theme Configuration
- **Recommended themes for fitness**: Green (health/growth), Blue (trust), Orange (energy)
- **Layout options**: Vertical sidebar (recommended for fitness dashboards)
- **Dark/Light mode** support for user preference

### File Organization for Gym-Buddy
```
app/
├── app/(dashboard)/
│   ├── workouts/          # Workout plans & tracking
│   ├── nutrition/         # Nutrition tracking & meal plans
│   ├── progress/          # Progress tracking & body composition
│   ├── analytics/         # Fitness analytics & reports
│   └── settings/          # App configuration
├── components/
│   ├── fitness/           # Gym-buddy specific components
│   └── ui/               # Reusable UI components (from DashTail)
├── lib/
│   ├── models/           # MongoDB models (User, UserStaticProfile, BodyComposition)
│   ├── auth.ts           # NextAuth configuration
│   └── permissions.ts    # Role-based access control
└── config/
    └── menus.ts          # Navigation structure for gym features
```

### Best Practices
- Study `example/` directory extensively before building new features
- Maintain consistency with DashTail's design patterns
- Copy and adapt rather than rebuild from scratch
- Use the comprehensive component library for rapid development
- Follow the internationalization pattern if multi-language support is needed

## Code Quality & Development Guide

### Code Standards

#### Common Guidelines

- **Use your tool**: If issues are difficult to resolve, use available tools to resolve or search online for best solutions.
- **Update CLAUDE.md**: Update CLAUDE.md if needed, once project has big architecture changes or changes has conflict with current CLAUDE.md content.
- **Check path before command**: Run `pwd` to check current path before command gets run.
- **Pnpm first**: Run `pnpm` instead of `npm`.
- **Fix all issues immediately**: After each modification, always run linting and fix ALL TypeScript type issues using `pnpm run lint` in the appropriate directory. Fix all issues regardless of level (error/warning) and whether they are related to current modifications or not.

#### TypeScript Guidelines
- **Strict mode**: Enable `strict: true` in tsconfig.json
- **Type safety**: Always use explicit types for function parameters and return values
- **No `any`**: Avoid `any` type; use `unknown` or proper type definitions
- **No type assertions abuse**: Strictly prohibit `as unknown as` or `as any as` syntax. If type/lint issues are difficult to resolve, search online for proper solutions
- **Interface over type**: Prefer interfaces for object shapes, types for unions/intersections
- **Naming conventions**:
  - PascalCase for classes, interfaces, types, enums
  - camelCase for variables, functions, methods
  - UPPER_SNAKE_CASE for constants
  - kebab-case for file names

#### Code Organization
- **Single responsibility**: Each function/class should have one clear purpose
- **Small functions**: Keep functions under 50 lines when possible
- **Clear naming**: Use descriptive names that explain intent
- **No magic numbers**: Use named constants for all numeric values
- **Consistent imports**: Group imports (3rd party, internal, relative) with spacing

#### Error Handling
- **Fail fast**: Validate inputs early and throw descriptive errors
- **Proper error types**: Use specific error classes, not generic Error
- **Context in errors**: Include relevant context for debugging
- **No silent failures**: Never catch and ignore errors without logging

### Development Workflow

#### Before Starting Work
1. **Understand requirements**: Read existing code patterns in the area
2. **Check dependencies**: Verify required packages are already in use
3. **Plan approach**: Break complex tasks into smaller, testable pieces
4. **Write tests first**: Start with test cases when possible (TDD)

#### During Development
1. **Incremental commits**: Commit working code frequently with clear messages
2. **Run quality checks**: Use `pnpm run lint` and `pnpm run format` regularly
3. **Fix all lint/type issues**: After ANY code modification, check and fix ALL linting and TypeScript issues - regardless of severity level or relevance to current changes
4. **Test as you go**: Run relevant tests after each significant change
5. **Self-review**: Review your own changes before committing

#### Code Review Guidelines
- **Focus on logic**: Check for correctness, edge cases, performance
- **Consistency**: Ensure new code follows existing patterns
- **Security**: Look for potential vulnerabilities or data leaks
- **Readability**: Code should be self-documenting with minimal comments

### Performance Guidelines

#### Backend Performance
- **Database queries**: Use proper indexing and avoid N+1 queries
- **Caching**: Implement caching for frequently accessed data
- **Pagination**: Always paginate large data sets
- **Async operations**: Use async/await properly, avoid blocking operations
- **Memory management**: Be mindful of memory leaks in long-running processes

#### Frontend Performance
- **Bundle size**: Monitor and optimize bundle size regularly
- **Lazy loading**: Use dynamic imports for route-based code splitting
- **Image optimization**: Use Next.js Image component with proper sizing
- **Memoization**: Use React.memo, useMemo, useCallback appropriately
- **Core Web Vitals**: Monitor LCP, FID, CLS metrics

### Security Best Practices

#### Backend Security
- **Input validation**: Validate all incoming data with class-validator
- **Authentication**: Always verify JWT tokens on protected routes
- **Authorization**: Check user permissions before sensitive operations
- **Environment variables**: Never commit secrets; use proper env management
- **SQL injection**: Use parameterized queries (Mongoose handles this)
- **Rate limiting**: Implement rate limiting for APIs

#### Frontend Security
- **XSS prevention**: Sanitize user inputs and use CSP headers
- **CSRF protection**: Use proper CSRF tokens for state-changing operations
- **Secure storage**: Never store sensitive data in localStorage
- **Content Security Policy**: Configure CSP headers appropriately
- **Dependency scanning**: Regularly audit and update dependencies

### Monitoring & Debugging

#### Logging
- **Structured logging**: Use consistent log formats with proper levels
- **Context**: Include request IDs and user context in logs
- **No sensitive data**: Never log passwords, tokens, or PII
- **Performance logs**: Log slow operations and database queries

#### Error Tracking
- **Error boundaries**: Implement proper error boundaries in React
- **Global error handling**: Catch and log unhandled errors appropriately
- **User-friendly errors**: Show helpful error messages to users
- **Error context**: Include stack traces and relevant debugging information
  