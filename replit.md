# Ad Variants Studio

## Overview

Ad Variants Studio is an internal MVP web application for generating multiple ad variants from master templates. The system enables marketing teams to create, manage, and automatically generate ad variants with AI-powered text and image generation. It provides a complete workflow from client onboarding through template creation to variant generation and export.

The application follows a hierarchical data model: Users manage Clients, which contain Projects, which house Assets (templates), which generate Variants. The system includes role-based access control, SVG-based template authoring with token binding, and integration with Google's Gemini AI for automated content generation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
**Technology Stack**: React 18 with TypeScript, using Vite as the build tool and bundler. The UI is built with Tailwind CSS and shadcn/ui components for consistent design patterns.

**Routing**: Uses wouter for client-side routing with protected routes that require authentication. The application follows a single-page application (SPA) pattern with role-based access control.

**State Management**: React Query (TanStack Query) handles server state management, caching, and synchronization. Local component state uses React hooks for UI interactions and form handling.

**Component Structure**: Follows atomic design principles with reusable UI components in `/components/ui`, layout components in `/components/layout`, and page-specific components in `/components/dashboard` and `/components/modals`.

### Backend Architecture
**Runtime Environment**: Node.js with Express.js server framework, using TypeScript for type safety. The server uses ES modules and includes development-specific tooling via Vite integration.

**API Design**: RESTful API with session-based authentication. Routes are organized by resource type (clients, projects, assets, variants) with CRUD operations following REST conventions.

**Authentication & Authorization**: Session-based authentication with bcrypt password hashing. Role-based access control (RBAC) with ADMIN and USER roles, implementing ownership-based permissions for resource access.

**Data Access Layer**: Abstracted storage interface with Drizzle ORM for type-safe database operations. The storage layer implements ownership filtering and permission checks at the data access level.

### Data Storage Solutions
**Primary Database**: PostgreSQL with Drizzle ORM for schema management and migrations. The database schema follows a hierarchical structure: Users → Clients → Projects → Assets → Variants.

**Schema Design**: UUID primary keys for all entities, foreign key relationships with cascade constraints, and JSON columns for flexible data storage (bindings, style hints, template fonts).

**File Storage**: Google Cloud Storage (GCS) for rendered PNG images with signed URL generation for secure access. SVG templates are stored as text in the database.

### Authentication and Authorization
**Authentication Method**: Session-based authentication using express-session with secure cookie configuration. Passwords are hashed using bcrypt with salt rounds.

**Authorization Model**: Two-tier role system (ADMIN/USER) with resource-level ownership. Users can only access resources they created unless they have ADMIN privileges.

**Session Management**: Server-side session storage with configurable expiration and security settings. Sessions include user identity and role information for authorization decisions.

### External Dependencies
**AI Services**: Google Gemini AI integration via @google/genai SDK for text and image generation. Text generation follows structured JSON schemas, while image generation supports background creation with style consistency.

**Database**: Neon Database (PostgreSQL) as the primary data store with connection pooling via @neondatabase/serverless.

**File Storage**: Google Cloud Storage for rendered image assets with signed URL authentication for secure access.

**UI Components**: Radix UI primitives for accessible, unstyled components with Tailwind CSS for styling. Lucide React for consistent iconography.

**Development Tools**: TypeScript for type safety, Vite for fast development builds, and various development utilities for error handling and debugging.

**Authentication**: bcrypt for password hashing and express-session for session management with configurable storage backends.