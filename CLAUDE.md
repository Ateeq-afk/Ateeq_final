# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

DesiCargo is a multi-tenant SaaS logistics management system built with:
- **Frontend**: React 18.3 + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js with two implementations (mock server and Supabase-backed)
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **UI Components**: Radix UI primitives + shadcn/ui

## Essential Commands

### Development
```bash
# Frontend development server
npm run dev

# Mock backend server (for local development)
npm run start:server

# Backend development with auto-reload (using tsx)
cd backend && npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Run tests
npm run test

# Seed Supabase database
npm run seed:supabase
```

## Architecture

### Multi-Tenant Hierarchy
```
Organization (org_id)
    └── Branch (branch_id)
            └── User (user_id)
```

All data is scoped by branch/organization. Users can only access data within their branch scope, except superadmins who have unrestricted access.

### Key Architectural Patterns

1. **Service Layer Pattern**
   - All API calls go through `/src/services/`
   - Services return typed responses using TypeScript interfaces
   - Error handling at service level with proper error messages

2. **State Management**
   - Global state: React Context (Auth, Theme, BranchSelection)
   - Server state: TanStack Query with caching
   - Form state: React Hook Form with Zod validation

3. **Component Organization**
   - Feature-based folders under `/src/components/`
   - Shared UI components in `/src/components/ui/`
   - Page components in `/src/pages/`

4. **Authentication Flow**
   - Supabase Auth handles authentication
   - JWT tokens stored in AuthContext
   - Role-based access: superadmin, admin, operator
   - Branch-scoped data access enforced

### Core Domain Models

1. **Booking Lifecycle**
   - Created → Loaded (OGPL) → In Transit → Delivered (POD)
   - Each booking has articles (items being shipped)
   - Tracking via logistics_events table

2. **OGPL (Outward General Parcel List)**
   - Groups bookings for loading onto vehicles
   - Tracks driver, vehicle, and route information
   - Status: draft → finalized → completed

3. **Warehouse Management**
   - Inward/outward article tracking
   - Inventory management by branch
   - Transfer between warehouses

## Development Guidelines

### When Adding New Features

1. **Create Service Layer First**
   ```typescript
   // In /src/services/[feature].ts
   export const [feature]Service = {
     getAll: async (params) => { /* ... */ },
     create: async (data) => { /* ... */ },
     // etc.
   }
   ```

2. **Use Proper Type Definitions**
   ```typescript
   // In /src/types/[feature].ts
   export interface [Feature] {
     // Define all properties with proper types
   }
   ```

3. **Follow Component Pattern**
   ```typescript
   // Use shadcn/ui components
   import { Card, CardContent } from "@/components/ui/card"
   // Use TanStack Query for data fetching
   import { useQuery, useMutation } from "@tanstack/react-query"
   ```

4. **Handle Loading States**
   - Always use skeleton loaders from `/src/components/ui/skeleton`
   - Show proper error states with toast notifications

### API Integration

- Frontend development proxy configured to `http://localhost:3000` (mock server)
- Production backend runs on `http://localhost:4000`
- Mock server runs on `http://localhost:3000`
- All API endpoints require JWT token in Authorization header
- Response format: `{ success: boolean, data?: any, error?: string }`

### Major API Routes

The backend provides comprehensive APIs for:
- **Auth**: `/api/auth/*` - Authentication, registration, organization management
- **Bookings**: `/api/bookings/*` - Complete booking lifecycle management
- **Articles**: `/api/articles/*` - Article tracking and warehouse management  
- **Fleet**: `/api/vehicles/*`, `/api/drivers/*` - Vehicle and driver management
- **Financial**: `/api/billing/*`, `/api/payments/*`, `/api/rates/*` - Billing, payments, credit management
- **Loading**: `/api/loading/*` - OGPL creation and management
- **Chat**: `/api/chat/*` - Real-time messaging system
- **POD**: `/api/pod/*` - Proof of delivery management

### Database Considerations

- All tables have RLS policies in Supabase
- Use `branch_id` for data scoping
- Audit trails via `logistics_events` table
- Soft deletes preferred (use `is_deleted` flag)

## Common Patterns

### Data Fetching
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['resource', params],
  queryFn: () => resourceService.getAll(params)
})
```

### Form Handling
```typescript
const form = useForm<FormData>({
  resolver: zodResolver(formSchema),
  defaultValues: { /* ... */ }
})
```

### Branch-Scoped Queries
Always include branch context:
```typescript
const { selectedBranch } = useBranchSelection()
const data = await service.getAll({ branch_id: selectedBranch?.id })
```

## Testing

- Frontend tests in `/tests/` directory (Node.js .cjs files)
- Backend tests in `/backend/tests/` directory (Jest with TypeScript)
- Run frontend tests: `npm run test` (from root)
- Run backend tests: `cd backend && npm test`
- Backend tests include unit, integration, and e2e tests
- Tests cover OGPL, warehouse, bookings, billing, and more

## Environment Variables

### Frontend (.env)
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### Backend (.env)
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
PORT=4000
```

### Database Migrations

- Migration files are in `/backend/migrations/` 
- Use sequential numbering (000_, 001_, etc.) for new migrations
- Always test migrations before committing
- Include RLS policies for multi-tenant data isolation

## Additional Features

The codebase includes several advanced features not detailed above:

1. **Mobile-Optimized Components**
   - Mobile-specific wrappers and responsive layouts
   - Touch-optimized UI elements
   - Mobile navigation patterns

2. **Apple Design System**
   - AppleBookingWizard for streamlined booking creation
   - AppleExecutiveDashboard for high-level insights
   - Native iOS-inspired UI components

3. **Enterprise Features**
   - Multi-branch management
   - Advanced reporting and analytics
   - Bulk operations support

4. **Billing & Financial Systems**
   - Credit limit management per customer
   - Rate management with distance-based calculations  
   - Payment processing with multiple modes
   - Invoice generation and outstanding tracking

5. **Fleet & Driver Management**
   - Vehicle registration and tracking
   - Driver assignment and performance monitoring
   - Route optimization and fuel tracking

6. **Chat System**
   - Real-time messaging with Supabase Realtime
   - File attachments via Supabase Storage
   - Branch-scoped conversations

## Working Practices

- I want you to work on both front end and backend - run the migrations for all tasks that I give you
- Always check for existing implementations before creating new features
- Use the established patterns for API routes, services, and components

## Database Migrations

We have an automated migration system. When you need to make database changes:

1. **Use the migration helpers**:
   ```javascript
   import helpers from './migration-helpers.js';
   
   // Create tables
   await helpers.createTable('table_name', columns, options);
   
   // Add columns
   await helpers.addColumn('table_name', columnDef);
   
   // Execute custom SQL
   await helpers.executeMigration('migration_name', sql);
   ```

2. **Or use the MigrationRunner directly**:
   ```javascript
   import { MigrationRunner } from './migration-handler.js';
   const runner = new MigrationRunner();
   await runner.executeMigration(sql, 'descriptive_name');
   ```

3. **All migrations are automatically**:
   - Executed against Supabase
   - Saved to `/backend/migrations/` with timestamps
   - Validated for safety (no DROP DATABASE, etc.)

See `/backend/MIGRATION_INSTRUCTIONS_FOR_CLAUDE.md` for detailed examples.