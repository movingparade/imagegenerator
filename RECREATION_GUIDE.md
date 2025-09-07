# Ad Variants Studio - Complete Recreation Guide

## Overview

This comprehensive guide provides step-by-step instructions to recreate the **Ad Variants Studio** - a full-stack web application for generating multiple ad variants from master templates using AI-powered automation.

### Key Features
- **Hierarchical Workflow**: Clients → Projects → Assets → Variants
- **Role-Based Access Control**: ADMIN and USER roles with ownership permissions  
- **AI-Powered Template Generation**: Automatic SVG template creation from master assets using Google Gemini
- **File Upload & Object Storage**: Support for master asset uploads with cloud storage
- **Real-time Collaboration**: Session-based authentication and real-time updates
- **Professional UI**: Modern design with shadcn/ui components and Tailwind CSS

## Architecture Overview

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript  
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: Google Gemini for text/image generation
- **Storage**: Google Cloud Storage for file uploads
- **UI Framework**: Tailwind CSS + shadcn/ui + Radix UI
- **State Management**: TanStack Query for server state
- **Routing**: Wouter for client-side routing
- **Authentication**: Session-based with bcrypt password hashing

### Data Model
```
Users
├── Clients (owned by users)
    ├── Projects (contain project briefs and content knowledge)
        ├── Assets (SVG templates with bindings and fonts)
            ├── Variants (generated with different content)
```

## Project Setup

### 1. Initialize Project Structure

```bash
mkdir ad-variants-studio
cd ad-variants-studio

# Initialize package.json
npm init -y
npm install --save-dev typescript tsx esbuild vite @vitejs/plugin-react
npm install --save-dev @types/node @types/express @types/react @types/react-dom
```

### 2. Install Core Dependencies

```bash
# Backend Framework
npm install express express-session bcrypt passport passport-local
npm install @types/express @types/express-session @types/bcrypt @types/passport @types/passport-local

# Database & ORM
npm install drizzle-orm drizzle-kit @neondatabase/serverless drizzle-zod zod zod-validation-error
npm install @types/connect-pg-simple connect-pg-simple

# AI Integration  
npm install @google/genai

# Object Storage
npm install @google-cloud/storage

# Frontend Framework
npm install react react-dom wouter @tanstack/react-query

# UI Components
npm install @radix-ui/react-accordion @radix-ui/react-alert-dialog @radix-ui/react-aspect-ratio
npm install @radix-ui/react-avatar @radix-ui/react-checkbox @radix-ui/react-collapsible
npm install @radix-ui/react-context-menu @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @radix-ui/react-hover-card @radix-ui/react-label @radix-ui/react-menubar
npm install @radix-ui/react-navigation-menu @radix-ui/react-popover @radix-ui/react-progress
npm install @radix-ui/react-radio-group @radix-ui/react-scroll-area @radix-ui/react-select
npm install @radix-ui/react-separator @radix-ui/react-slider @radix-ui/react-slot
npm install @radix-ui/react-switch @radix-ui/react-tabs @radix-ui/react-toast
npm install @radix-ui/react-toggle @radix-ui/react-tooltip

# Styling & Utilities
npm install tailwindcss tailwindcss-animate postcss autoprefixer
npm install class-variance-authority clsx tailwind-merge lucide-react react-icons
npm install @tailwindcss/typography @tailwindcss/vite

# Form Handling
npm install react-hook-form @hookform/resolvers

# File Upload
npm install @uppy/core @uppy/dashboard @uppy/react @uppy/aws-s3

# Additional Utilities
npm install date-fns framer-motion input-otp next-themes vaul embla-carousel-react
npm install recharts react-day-picker react-resizable-panels cmdk memorystore ws
npm install @types/ws bufferutil tw-animate-css
```

### 3. Project Structure Setup

```
ad-variants-studio/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # shadcn/ui components
│   │   │   ├── layout/          # Layout components (sidebar, header)
│   │   │   ├── dashboard/       # Dashboard-specific components
│   │   │   ├── modals/          # Modal components
│   │   │   └── ObjectUploader.tsx
│   │   ├── hooks/               # Custom hooks
│   │   ├── lib/                 # Utilities and configuration
│   │   ├── pages/               # Page components
│   │   ├── types/               # TypeScript type definitions
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   └── index.html
├── server/
│   ├── auth.ts                  # Authentication logic
│   ├── db.ts                    # Database connection
│   ├── gemini.ts                # AI integration
│   ├── index.ts                 # Server entry point
│   ├── objectStorage.ts         # File storage logic
│   ├── routes.ts                # API routes
│   ├── storage.ts               # Data access layer
│   └── vite.ts                  # Vite middleware
├── shared/
│   └── schema.ts                # Shared type definitions
├── attached_assets/             # Static assets
├── scripts/
│   └── seed.ts                  # Database seeding
└── Configuration files
```

## Database Schema Implementation

### 1. Create `shared/schema.ts`

```typescript
import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, pgEnum, json, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const roleEnum = pgEnum("role", ["ADMIN", "USER"]);
export const variantSourceEnum = pgEnum("variant_source", ["USER", "AUTO"]);
export const variantStatusEnum = pgEnum("variant_status", ["DRAFT", "READY", "ERROR"]);

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  password: text("password").notNull(),
  role: roleEnum("role").notNull().default("USER"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Clients table
export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  createdByUserId: uuid("created_by_user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Projects table
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").notNull().references(() => clients.id),
  name: text("name").notNull(),
  description: text("description"),
  brief: text("brief"), // Project brief/requirements
  contentKnowledge: json("content_knowledge").default(sql`'{}'`), // Knowledge base content
  archived: timestamp("archived").default(sql`null`),
  createdByUserId: uuid("created_by_user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Assets table
export const assets = pgTable("assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull().references(() => projects.id),
  name: text("name").notNull(),
  masterAssetUrl: text("master_asset_url"), // URL to uploaded master asset file
  masterAssetType: text("master_asset_type"), // File type (image, video, etc.)
  templateSvg: text("template_svg").notNull(),
  templateFonts: json("template_fonts").notNull(), // {family,url,weight,style}[]
  defaultBindings: json("default_bindings").notNull(), // {headline,subheadline,cta,image}
  styleHints: json("style_hints").notNull(), // {palette,brand,notes}
  createdByUserId: uuid("created_by_user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Variants table
export const variants = pgTable("variants", {
  id: uuid("id").primaryKey().defaultRandom(),
  assetId: uuid("asset_id").notNull().references(() => assets.id),
  source: variantSourceEnum("source").notNull().default("USER"),
  bindings: json("bindings").notNull(), // {headline,subheadline,cta,imageUrl}
  renderSvg: text("render_svg").notNull(),
  renderPngUrl: text("render_png_url"),
  status: variantStatusEnum("status").notNull().default("DRAFT"),
  errorMessage: text("error_message"),
  createdByUserId: uuid("created_by_user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  clients: many(clients),
  projects: many(projects),
  assets: many(assets),
  variants: many(variants),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [clients.createdByUserId],
    references: [users.id],
  }),
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  client: one(clients, {
    fields: [projects.clientId],
    references: [clients.id],
  }),
  createdByUser: one(users, {
    fields: [projects.createdByUserId],
    references: [users.id],
  }),
  assets: many(assets),
}));

export const assetsRelations = relations(assets, ({ one, many }) => ({
  project: one(projects, {
    fields: [assets.projectId],
    references: [projects.id],
  }),
  createdByUser: one(users, {
    fields: [assets.createdByUserId],
    references: [users.id],
  }),
  variants: many(variants),
}));

export const variantsRelations = relations(variants, ({ one }) => ({
  asset: one(assets, {
    fields: [variants.assetId],
    references: [assets.id],
  }),
  createdByUser: one(users, {
    fields: [variants.createdByUserId],
    references: [users.id],
  }),
}));

// Insert schemas with validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdByUserId: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdByUserId: true,
});

export const insertAssetSchema = createInsertSchema(assets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdByUserId: true,
});

export const insertVariantSchema = createInsertSchema(variants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdByUserId: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Asset = typeof assets.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type Variant = typeof variants.$inferSelect;
export type InsertVariant = z.infer<typeof insertVariantSchema>;

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = insertUserSchema.extend({
  password: z.string().min(6),
});

export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;
```

### 2. Database Configuration

Create `server/db.ts`:
```typescript
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });
```

Create `drizzle.config.ts`:
```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./shared/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

## Backend Implementation

### 1. Authentication System (`server/auth.ts`)

```typescript
import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { loginSchema, registerSchema, type User } from "@shared/schema";
import { z } from "zod";

export interface AuthenticatedRequest extends Request {
  user: User;
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await storage.getUserByEmail(email);
    
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({
        ok: false,
        error: { code: "UNAUTHORIZED", message: "Invalid credentials" }
      });
    }

    req.session.userId = user.id;
    const { password: _, ...userWithoutPassword } = user;
    res.json({ ok: true, data: { user: userWithoutPassword } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        ok: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid input" }
      });
    }
    res.status(500).json({
      ok: false,
      error: { code: "INTERNAL_ERROR", message: "Internal server error" }
    });
  }
}

export async function register(req: Request, res: Response) {
  try {
    const userData = registerSchema.parse(req.body);
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const user = await storage.createUser({
      ...userData,
      password: hashedPassword,
    });
    
    req.session.userId = user.id;
    const { password: _, ...userWithoutPassword } = user;
    res.json({ ok: true, data: { user: userWithoutPassword } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        ok: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid input" }
      });
    }
    res.status(500).json({
      ok: false,
      error: { code: "INTERNAL_ERROR", message: "Internal server error" }
    });
  }
}

export async function logout(req: Request, res: Response) {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        ok: false,
        error: { code: "INTERNAL_ERROR", message: "Could not log out" }
      });
    }
    res.json({ ok: true, data: { message: "Logged out successfully" } });
  });
}

export async function getMe(req: Request, res: Response) {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        ok: false,
        error: { code: "UNAUTHORIZED", message: "Not authenticated" }
      });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({
        ok: false,
        error: { code: "UNAUTHORIZED", message: "User not found" }
      });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({ ok: true, data: { user: userWithoutPassword } });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: { code: "INTERNAL_ERROR", message: "Internal server error" }
    });
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        ok: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" }
      });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({
        ok: false,
        error: { code: "UNAUTHORIZED", message: "User not found" }
      });
    }

    (req as AuthenticatedRequest).user = user;
    next();
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: { code: "INTERNAL_ERROR", message: "Internal server error" }
    });
  }
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as AuthenticatedRequest).user;
  if (user.role !== "ADMIN") {
    return res.status(403).json({
      ok: false,
      error: { code: "FORBIDDEN", message: "Admin access required" }
    });
  }
  next();
}
```

### 2. Data Access Layer (`server/storage.ts`)

```typescript
import { db } from "./db";
import { 
  users, clients, projects, assets, variants,
  type User, type InsertUser, type Client, type InsertClient,
  type Project, type InsertProject, type Asset, type InsertAsset,
  type Variant, type InsertVariant
} from "@shared/schema";
import { eq, desc, and, count, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Clients
  getClients(userId: string, isAdmin: boolean): Promise<Client[]>;
  getClient(id: string, userId: string, isAdmin: boolean): Promise<Client | undefined>;
  createClient(client: InsertClient, userId: string): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>, userId: string, isAdmin: boolean): Promise<Client | undefined>;
  deleteClient(id: string, userId: string, isAdmin: boolean): Promise<boolean>;

  // Projects
  getProjects(userId: string, isAdmin: boolean): Promise<Project[]>;
  getProject(id: string, userId: string, isAdmin: boolean): Promise<Project | undefined>;
  createProject(project: InsertProject, userId: string): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>, userId: string, isAdmin: boolean): Promise<Project | undefined>;
  deleteProject(id: string, userId: string, isAdmin: boolean): Promise<boolean>;

  // Assets
  getAssets(userId: string, isAdmin: boolean): Promise<Asset[]>;
  getAsset(id: string, userId: string, isAdmin: boolean): Promise<Asset | undefined>;
  createAsset(asset: InsertAsset, userId: string): Promise<Asset>;
  updateAsset(id: string, asset: Partial<InsertAsset>, userId: string, isAdmin: boolean): Promise<Asset | undefined>;
  deleteAsset(id: string, userId: string, isAdmin: boolean): Promise<boolean>;

  // Variants
  getVariants(userId: string, isAdmin: boolean): Promise<Variant[]>;
  getVariant(id: string, userId: string, isAdmin: boolean): Promise<Variant | undefined>;
  createVariant(variant: InsertVariant, userId: string): Promise<Variant>;
  updateVariant(id: string, variant: Partial<InsertVariant>, userId: string, isAdmin: boolean): Promise<Variant | undefined>;
  deleteVariant(id: string, userId: string, isAdmin: boolean): Promise<boolean>;

  // Dashboard stats
  getDashboardStats(userId: string, isAdmin: boolean): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Client methods
  async getClients(userId: string, isAdmin: boolean): Promise<Client[]> {
    const query = db
      .select({
        id: clients.id,
        name: clients.name,
        description: clients.description,
        createdByUserId: clients.createdByUserId,
        createdAt: clients.createdAt,
        updatedAt: clients.updatedAt,
      })
      .from(clients)
      .orderBy(desc(clients.createdAt));

    if (!isAdmin) {
      query.where(eq(clients.createdByUserId, userId));
    }

    return await query;
  }

  async getClient(id: string, userId: string, isAdmin: boolean): Promise<Client | undefined> {
    const query = db
      .select()
      .from(clients)
      .where(eq(clients.id, id));

    if (!isAdmin) {
      query.where(and(eq(clients.id, id), eq(clients.createdByUserId, userId)));
    }

    const [client] = await query;
    return client || undefined;
  }

  async createClient(client: InsertClient, userId: string): Promise<Client> {
    const [newClient] = await db
      .insert(clients)
      .values({ ...client, createdByUserId: userId })
      .returning();
    return newClient;
  }

  async updateClient(id: string, client: Partial<InsertClient>, userId: string, isAdmin: boolean): Promise<Client | undefined> {
    const whereClause = isAdmin 
      ? eq(clients.id, id)
      : and(eq(clients.id, id), eq(clients.createdByUserId, userId));

    const [updated] = await db
      .update(clients)
      .set({ ...client, updatedAt: new Date() })
      .where(whereClause)
      .returning();
    return updated || undefined;
  }

  async deleteClient(id: string, userId: string, isAdmin: boolean): Promise<boolean> {
    const whereClause = isAdmin 
      ? eq(clients.id, id)
      : and(eq(clients.id, id), eq(clients.createdByUserId, userId));

    const result = await db.delete(clients).where(whereClause);
    return result.rowCount > 0;
  }

  // Project methods (similar pattern)
  async getProjects(userId: string, isAdmin: boolean): Promise<Project[]> {
    let query = db
      .select({
        id: projects.id,
        clientId: projects.clientId,
        name: projects.name,
        description: projects.description,
        brief: projects.brief,
        contentKnowledge: projects.contentKnowledge,
        archived: projects.archived,
        createdByUserId: projects.createdByUserId,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        client: {
          id: clients.id,
          name: clients.name,
          description: clients.description,
          createdByUserId: clients.createdByUserId,
          createdAt: clients.createdAt,
          updatedAt: clients.updatedAt,
        }
      })
      .from(projects)
      .leftJoin(clients, eq(projects.clientId, clients.id))
      .orderBy(desc(projects.createdAt));

    if (!isAdmin) {
      query = query.where(eq(projects.createdByUserId, userId));
    }

    return await query;
  }

  // ... Additional methods for projects, assets, variants
  // Follow the same ownership-based filtering pattern

  async getDashboardStats(userId: string, isAdmin: boolean) {
    const clientsCount = await db
      .select({ count: count() })
      .from(clients)
      .where(isAdmin ? undefined : eq(clients.createdByUserId, userId));

    const projectsCount = await db
      .select({ count: count() })
      .from(projects)
      .where(isAdmin ? undefined : eq(projects.createdByUserId, userId));

    const assetsCount = await db
      .select({ count: count() })
      .from(assets)
      .where(isAdmin ? undefined : eq(assets.createdByUserId, userId));

    const variantsCount = await db
      .select({ count: count() })
      .from(variants)
      .where(isAdmin ? undefined : eq(variants.createdByUserId, userId));

    return {
      totalClients: clientsCount[0].count.toString(),
      totalProjects: projectsCount[0].count.toString(),
      totalAssets: assetsCount[0].count.toString(),
      totalVariants: variantsCount[0].count.toString(),
    };
  }
}

export const storage = new DatabaseStorage();
```

### 3. AI Integration (`server/gemini.ts`)

```typescript
import { GoogleGenAI } from "@google/genai";
import https from "https";
import { z } from "zod";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// Schema for template generation response
export const templateGenerationResponseSchema = z.object({
  templateSvg: z.string(),
  templateFonts: z.array(z.object({
    name: z.string(),
    fallback: z.string(),
  })),
  defaultBindings: z.object({
    headline: z.string(),
    subheadline: z.string(),
    cta: z.string(),
  }),
  styleHints: z.object({
    primaryColor: z.string(),
    secondaryColor: z.string(),
    backgroundColor: z.string(),
    fontStyle: z.string(),
    brandNotes: z.string(),
  }),
});

export type TemplateGenerationResponse = z.infer<typeof templateGenerationResponseSchema>;

// Helper function to convert Google Drive URLs to direct download links
function convertGoogleDriveUrl(url: string): string {
  const driveRegex = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
  const match = url.match(driveRegex);
  if (match && match[1]) {
    return `https://drive.google.com/uc?export=download&id=${match[1]}`;
  }
  return url;
}

// Helper function to download and convert image to base64
async function downloadImageAsBase64(imageUrl: string): Promise<{ data: string; mimeType: string }> {
  const processedUrl = convertGoogleDriveUrl(imageUrl);
  
  return new Promise((resolve, reject) => {
    https.get(processedUrl, (response) => {
      // Follow redirects
      if (response.statusCode === 302 || response.statusCode === 301) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          https.get(redirectUrl, (redirectResponse) => {
            handleResponse(redirectResponse, resolve, reject);
          }).on('error', reject);
          return;
        }
      }
      
      handleResponse(response, resolve, reject);
    }).on('error', reject);
  });
}

function handleResponse(
  response: any,
  resolve: (value: { data: string; mimeType: string }) => void,
  reject: (reason: any) => void
) {
  if (response.statusCode !== 200) {
    reject(new Error(`Failed to download image: ${response.statusCode}`));
    return;
  }

  const contentType = response.headers['content-type'] || 'image/jpeg';
  
  // Check if response is actually an image
  if (!contentType.startsWith('image/')) {
    reject(new Error(`URL does not point to an image. Got content-type: ${contentType}`));
    return;
  }

  const chunks: Buffer[] = [];
  response.on('data', (chunk: Buffer) => chunks.push(chunk));
  response.on('end', () => {
    const buffer = Buffer.concat(chunks);
    const base64Data = buffer.toString('base64');
    resolve({ data: base64Data, mimeType: contentType });
  });
}

// Main function to generate template from master asset
export async function generateTemplateFromMasterAsset(
  masterAssetUrl: string,
  assetName: string,
  projectContext: {
    name: string;
    brief?: string;
    clientName: string;
  }
): Promise<TemplateGenerationResponse> {
  try {
    console.log(`Generating template from master asset: ${masterAssetUrl}`);

    // Download the image
    const { data: imageData, mimeType } = await downloadImageAsBase64(masterAssetUrl);

    const systemPrompt = `You are an expert SVG template designer. Analyze the provided master asset image and generate a matching SVG template for ad variant generation.

Project Context:
- Asset Name: ${assetName}
- Project: ${projectContext.name}
- Client: ${projectContext.clientName}
${projectContext.brief ? `- Brief: ${projectContext.brief}` : ''}

Requirements:
1. Create an SVG template that visually matches the master asset's layout, style, and design
2. Include placeholder tokens: {{headline}}, {{subheadline}}, {{cta}} for text elements
3. Extract and suggest fonts that match the image typography
4. Generate appropriate default bindings with relevant content
5. Analyze colors and provide style hints
6. Ensure the SVG is properly formatted and functional

Response Format: Return valid JSON with the exact schema specified.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            templateSvg: { type: "string" },
            templateFonts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  fallback: { type: "string" }
                },
                required: ["name", "fallback"]
              }
            },
            defaultBindings: {
              type: "object",
              properties: {
                headline: { type: "string" },
                subheadline: { type: "string" },
                cta: { type: "string" }
              },
              required: ["headline", "subheadline", "cta"]
            },
            styleHints: {
              type: "object",
              properties: {
                primaryColor: { type: "string" },
                secondaryColor: { type: "string" },
                backgroundColor: { type: "string" },
                fontStyle: { type: "string" },
                brandNotes: { type: "string" }
              },
              required: ["primaryColor", "secondaryColor", "backgroundColor", "fontStyle", "brandNotes"]
            }
          },
          required: ["templateSvg", "templateFonts", "defaultBindings", "styleHints"]
        }
      },
      contents: [
        {
          inlineData: {
            data: imageData,
            mimeType: mimeType,
          },
        },
        `Analyze this master asset image and generate a matching SVG template with proper token bindings, fonts, and style hints.`
      ],
    });

    const rawJson = response.text;
    if (!rawJson) {
      throw new Error("Empty response from Gemini");
    }

    console.log(`Raw AI response: ${rawJson.substring(0, 200)}...`);

    const parsed = JSON.parse(rawJson);
    const validated = templateGenerationResponseSchema.parse(parsed);

    // Convert arrays to JSON strings for database storage
    const result = {
      templateSvg: validated.templateSvg,
      templateFonts: JSON.stringify(validated.templateFonts),
      defaultBindings: JSON.stringify(validated.defaultBindings),
      styleHints: JSON.stringify(validated.styleHints),
    };

    console.log(`Template generated successfully`);
    return result;

  } catch (error) {
    console.error("Template generation error:", error);
    throw new Error(`Failed to generate template from master asset: ${error}`);
  }
}

// Additional AI functions for text and image generation
export async function generateTextVariants(
  prompt: string,
  assetContext: any,
  count: number = 5
): Promise<Array<{ headline: string; subheadline: string; cta: string }>> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            variants: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  headline: { type: "string" },
                  subheadline: { type: "string" },
                  cta: { type: "string" }
                },
                required: ["headline", "subheadline", "cta"]
              }
            }
          },
          required: ["variants"]
        }
      },
      contents: `Generate ${count} text variants for an ad with the following context: ${prompt}. 
      Each variant should have a headline, subheadline, and call-to-action.`
    });

    const result = JSON.parse(response.text || '{"variants": []}');
    return result.variants || [];
  } catch (error) {
    console.error("Text generation error:", error);
    throw new Error(`Failed to generate text variants: ${error}`);
  }
}
```

### 4. Object Storage (`server/objectStorage.ts`)

```typescript
import { Storage, File } from "@google-cloud/storage";
import { Response } from "express";
import { randomUUID } from "crypto";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

// Object storage client
export const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class ObjectStorageService {
  constructor() {}

  getPrivateObjectDir(): string {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' " +
          "tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    return dir;
  }

  async downloadObject(file: File, res: Response, cacheTtlSec: number = 3600) {
    try {
      const [metadata] = await file.getMetadata();
      
      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Length": metadata.size,
        "Cache-Control": `public, max-age=${cacheTtlSec}`,
      });

      const stream = file.createReadStream();

      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });

      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }

  async getObjectEntityUploadURL(): Promise<string> {
    const privateObjectDir = this.getPrivateObjectDir();
    const objectId = randomUUID();
    const fullPath = `${privateObjectDir}/uploads/${objectId}`;

    const { bucketName, objectName } = parseObjectPath(fullPath);

    return signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900,
    });
  }

  async getObjectEntityFile(objectPath: string): Promise<File> {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }

    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2) {
      throw new ObjectNotFoundError();
    }

    const entityId = parts.slice(1).join("/");
    let entityDir = this.getPrivateObjectDir();
    if (!entityDir.endsWith("/")) {
      entityDir = `${entityDir}/`;
    }
    const objectEntityPath = `${entityDir}${entityId}`;
    const { bucketName, objectName } = parseObjectPath(objectEntityPath);
    const bucket = objectStorageClient.bucket(bucketName);
    const objectFile = bucket.file(objectName);
    const [exists] = await objectFile.exists();
    if (!exists) {
      throw new ObjectNotFoundError();
    }
    return objectFile;
  }
}

function parseObjectPath(path: string): { bucketName: string; objectName: string } {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  const pathParts = path.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }

  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");

  return { bucketName, objectName };
}

async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec,
}: {
  bucketName: string;
  objectName: string;
  method: "GET" | "PUT" | "DELETE" | "HEAD";
  ttlSec: number;
}): Promise<string> {
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
  };
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}, ` +
        `make sure you're running on Replit`
    );
  }

  const { signed_url: signedURL } = await response.json();
  return signedURL;
}
```

### 5. API Routes (`server/routes.ts`)

```typescript
import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import { 
  login, 
  register, 
  logout, 
  getMe, 
  requireAuth, 
  requireAdmin,
  type AuthenticatedRequest 
} from "./auth";
import { 
  insertClientSchema,
  insertProjectSchema,
  insertAssetSchema,
  insertVariantSchema,
} from "@shared/schema";
import { 
  generateTextVariants,
  generateImages,
  generateTemplateFromMasterAsset,
} from "./gemini";
import { z } from "zod";
import { ObjectStorageService } from "./objectStorage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || "dev-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  }));

  // Auth routes
  app.post("/api/auth/login", login);
  app.post("/api/auth/register", register);
  app.post("/api/auth/logout", logout);
  app.get("/api/me", getMe);

  // Error handling helper
  const handleError = (res: any, error: any) => {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        ok: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid input", details: error.errors }
      });
    }
    console.error("API Error:", error);
    return res.status(500).json({
      ok: false,
      error: { code: "INTERNAL_ERROR", message: "Internal server error" }
    });
  };

  // Dashboard stats
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const stats = await storage.getDashboardStats(user.id, user.role === "ADMIN");
      res.json({ ok: true, data: stats });
    } catch (error) {
      handleError(res, error);
    }
  });

  // Clients CRUD
  app.get("/api/clients", requireAuth, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const clients = await storage.getClients(user.id, user.role === "ADMIN");
      res.json({ ok: true, data: clients });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/clients", requireAuth, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const clientData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(clientData, user.id);
      res.json({ ok: true, data: client });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch("/api/clients/:id", requireAuth, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const updateData = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(req.params.id, updateData, user.id, user.role === "ADMIN");
      if (!client) {
        return res.status(404).json({
          ok: false,
          error: { code: "NOT_FOUND", message: "Client not found or access denied" }
        });
      }
      res.json({ ok: true, data: client });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/clients/:id", requireAuth, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const success = await storage.deleteClient(req.params.id, user.id, user.role === "ADMIN");
      if (!success) {
        return res.status(404).json({
          ok: false,
          error: { code: "NOT_FOUND", message: "Client not found or access denied" }
        });
      }
      res.json({ ok: true, data: { message: "Client deleted successfully" } });
    } catch (error) {
      handleError(res, error);
    }
  });

  // Projects CRUD (similar pattern)
  app.get("/api/projects", requireAuth, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const projects = await storage.getProjects(user.id, user.role === "ADMIN");
      res.json({ ok: true, data: projects });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/projects", requireAuth, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const projectData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(projectData, user.id);
      res.json({ ok: true, data: project });
    } catch (error) {
      handleError(res, error);
    }
  });

  // Assets CRUD with AI template generation
  app.get("/api/assets", requireAuth, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const assets = await storage.getAssets(user.id, user.role === "ADMIN");
      res.json({ ok: true, data: assets });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/assets", requireAuth, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      let assetData = insertAssetSchema.parse(req.body);

      // If master asset URL is provided, generate template automatically
      if (assetData.masterAssetUrl) {
        try {
          console.log(`Generating template from master asset: ${assetData.masterAssetUrl}`);
          
          // Get project context for better template generation
          const project = await storage.getProject(assetData.projectId, user.id, user.role === "ADMIN");
          if (!project) {
            return res.status(404).json({
              ok: false,
              error: { code: "NOT_FOUND", message: "Project not found" }
            });
          }

          // Generate template from master asset
          const templateData = await generateTemplateFromMasterAsset(
            assetData.masterAssetUrl,
            assetData.name,
            {
              name: project.name,
              brief: project.brief || undefined,
              clientName: project.client.name
            }
          );

          // Override with generated template data
          assetData = {
            ...assetData,
            templateSvg: templateData.templateSvg,
            templateFonts: templateData.templateFonts,
            defaultBindings: templateData.defaultBindings,
            styleHints: templateData.styleHints,
          };

          console.log(`Template generated successfully for asset: ${assetData.name}`);
        } catch (templateError) {
          console.error("Template generation failed:", templateError);
          console.log("Falling back to manual template creation");
          // Continue with manual template if AI generation fails
        }
      }

      const asset = await storage.createAsset(assetData, user.id);
      res.json({ ok: true, data: asset });
    } catch (error) {
      handleError(res, error);
    }
  });

  // Object storage routes
  app.get("/api/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", requireAuth, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ ok: true, data: { uploadURL } });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ ok: false, error: { code: "UPLOAD_ERROR", message: "Failed to generate upload URL" } });
    }
  });

  // AI generation routes
  app.post("/api/ai/generate-text-variants", requireAuth, async (req, res) => {
    try {
      const { prompt, assetContext, count } = req.body;
      const variants = await generateTextVariants(prompt, assetContext, count);
      res.json({ ok: true, data: variants });
    } catch (error) {
      handleError(res, error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
```

## Frontend Implementation

### 1. Project Configuration

Create `vite.config.ts`:
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
});
```

Create `tailwind.config.ts`:
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./client/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

### 2. Client Structure

Create `client/src/lib/queryClient.ts`:
```typescript
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const response = await fetch(queryKey[0] as string);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      },
    },
  },
});

export async function apiRequest(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}
```

Create `client/src/hooks/use-auth.ts`:
```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User, LoginRequest, RegisterRequest } from "@shared/schema";

export function useAuth() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<{ ok: boolean; data: { user: User } }>({
    queryKey: ["/api/me"],
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginRequest) =>
      apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: (userData: RegisterRequest) =>
      apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(userData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () =>
      apiRequest("/api/auth/logout", {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
    },
  });

  return {
    user: data?.data?.user,
    isLoading,
    error,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    isLoginPending: loginMutation.isPending,
    isRegisterPending: registerMutation.isPending,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
  };
}
```

### 3. Main App Component

Create `client/src/App.tsx`:
```typescript
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import Clients from "@/pages/clients";
import Projects from "@/pages/projects";
import Assets from "@/pages/assets";
import Variants from "@/pages/variants";
import Sidebar from "@/components/layout/sidebar";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar user={user} />
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/clients">
        <ProtectedRoute>
          <Clients />
        </ProtectedRoute>
      </Route>
      <Route path="/projects">
        <ProtectedRoute>
          <Projects />
        </ProtectedRoute>
      </Route>
      <Route path="/assets">
        <ProtectedRoute>
          <Assets />
        </ProtectedRoute>
      </Route>
      <Route path="/variants">
        <ProtectedRoute>
          <Variants />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
```

### 4. File Upload Component

Create `client/src/components/ObjectUploader.tsx`:
```typescript
import { useState } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => void;
  buttonClassName?: string;
  children: ReactNode;
}

export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [uppy] = useState(() =>
    new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
      },
      autoProceed: false,
    })
      .use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: onGetUploadParameters,
      })
      .on("complete", (result) => {
        onComplete?.(result);
      })
  );

  return (
    <div>
      <Button onClick={() => setShowModal(true)} className={buttonClassName}>
        {children}
      </Button>

      <DashboardModal
        uppy={uppy}
        open={showModal}
        onRequestClose={() => setShowModal(false)}
        proudlyDisplayPoweredByUppy={false}
      />
    </div>
  );
}
```

## Environment Setup

### 1. Environment Variables

Create `.env` file:
```env
# Database
DATABASE_URL=your_neon_database_url

# Session
SESSION_SECRET=your_session_secret_key

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Object Storage (set by Replit when using object storage)
DEFAULT_OBJECT_STORAGE_BUCKET_ID=your_bucket_id
PRIVATE_OBJECT_DIR=/your-bucket/private
PUBLIC_OBJECT_SEARCH_PATHS=/your-bucket/public
```

### 2. Scripts Configuration

Update `package.json` scripts:
```json
{
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js",
    "check": "tsc",
    "db:push": "drizzle-kit push"
  }
}
```

## Database Setup

### 1. Initialize Database

```bash
# Push schema to database
npm run db:push

# Optional: Create seed script
touch scripts/seed.ts
```

### 2. Create Seed Data (`scripts/seed.ts`)

```typescript
import { db } from "../server/db";
import { users, clients, projects, assets } from "../shared/schema";
import bcrypt from "bcrypt";

async function seed() {
  console.log("Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  const [adminUser] = await db.insert(users).values({
    email: "admin@example.com",
    name: "Admin User",
    password: adminPassword,
    role: "ADMIN"
  }).returning();

  // Create regular user
  const userPassword = await bcrypt.hash("user123", 10);
  const [regularUser] = await db.insert(users).values({
    email: "user@example.com",
    name: "Regular User",
    password: userPassword,
    role: "USER"
  }).returning();

  // Create sample client
  const [client] = await db.insert(clients).values({
    name: "Acme Corporation",
    description: "Leading technology company",
    createdByUserId: adminUser.id
  }).returning();

  // Create sample project
  const [project] = await db.insert(projects).values({
    clientId: client.id,
    name: "Summer Campaign 2024",
    description: "Promotional campaign for summer products",
    brief: "Create engaging ads for summer product launch targeting young adults",
    createdByUserId: adminUser.id
  }).returning();

  // Create sample asset
  await db.insert(assets).values({
    projectId: project.id,
    name: "Social Media Banner",
    templateSvg: `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
      <rect width="100%" height="100%" fill="#f8f9fa" stroke="#e9ecef" stroke-width="2"/>
      <text x="200" y="120" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#495057">{{headline}}</text>
      <text x="200" y="150" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#6c757d">{{subheadline}}</text>
      <rect x="150" y="180" width="100" height="30" fill="#007bff" rx="4"/>
      <text x="200" y="200" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="white">{{cta}}</text>
    </svg>`,
    templateFonts: JSON.stringify([
      { name: "Arial", fallback: "Arial, sans-serif" }
    ]),
    defaultBindings: JSON.stringify({
      headline: "Summer Sale is Here!",
      subheadline: "Get up to 50% off on all summer products",
      cta: "Shop Now"
    }),
    styleHints: JSON.stringify({
      primaryColor: "#007bff",
      secondaryColor: "#6c757d",
      backgroundColor: "#f8f9fa",
      fontStyle: "clean and professional",
      brandNotes: "Modern, clean design with blue accent color"
    }),
    createdByUserId: adminUser.id
  });

  console.log("Database seeded successfully!");
}

seed().catch(console.error);
```

## Running the Application

### 1. Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your actual values

# Push database schema
npm run db:push

# Optional: Seed database
npx tsx scripts/seed.ts

# Start development server
npm run dev
```

### 2. Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Key Features Implementation

### 1. Role-Based Access Control
- **ADMIN users**: Can view and manage all resources
- **USER**: Can only view and manage their own resources
- Implemented at the data access layer for security

### 2. AI-Powered Template Generation
- **Automatic generation**: When master assets are uploaded, AI analyzes them and creates matching SVG templates
- **Token binding**: Templates include `{{headline}}`, `{{subheadline}}`, `{{cta}}` tokens for content replacement
- **Style extraction**: AI extracts colors, fonts, and brand elements for consistency
- **Fallback handling**: Manual template creation when AI generation fails

### 3. File Upload & Storage
- **Object storage integration**: Supports direct uploads to Google Cloud Storage
- **Multiple file types**: Images, videos, documents, and audio files
- **Secure access**: Files served through application with proper access control
- **URL conversion**: Handles Google Drive URLs and other external sources

### 4. Hierarchical Data Management
- **Client → Project → Asset → Variant workflow**
- **Project briefs**: Support for detailed project requirements and content knowledge
- **Asset templates**: SVG-based templates with font and binding management
- **Variant generation**: Multiple content versions from single templates

### 5. Modern UI/UX
- **Responsive design**: Works on desktop and mobile devices
- **Professional styling**: shadcn/ui components with Tailwind CSS
- **Real-time updates**: Optimistic updates and automatic cache invalidation
- **Accessible components**: Built with Radix UI primitives for accessibility

## Testing

### 1. Manual Testing

1. **Authentication**: Test login/register flows
2. **CRUD operations**: Test creating, reading, updating, deleting all entities
3. **AI generation**: Test template generation from various image sources
4. **File upload**: Test uploading different file types
5. **Permissions**: Test role-based access control

### 2. API Testing

Use tools like Postman or curl to test API endpoints:

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Create client
curl -X POST http://localhost:5000/api/clients \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Client","description":"Test description"}'
```

## Deployment

### 1. Environment Setup

1. **Database**: Set up PostgreSQL database (Neon recommended)
2. **Object Storage**: Configure Google Cloud Storage bucket
3. **AI Service**: Set up Google Gemini API key
4. **Domain**: Configure custom domain if needed

### 2. Deployment Steps

1. **Build application**: `npm run build`
2. **Set environment variables**: Configure all required env vars
3. **Deploy database schema**: `npm run db:push`
4. **Start server**: `npm start`
5. **Test functionality**: Verify all features work in production

## Troubleshooting

### Common Issues

1. **Database connection errors**: Check DATABASE_URL and network connectivity
2. **AI generation failures**: Verify GEMINI_API_KEY and check image URL accessibility
3. **File upload issues**: Ensure object storage is properly configured
4. **Permission errors**: Check user roles and ownership filters
5. **Build failures**: Verify all dependencies are installed and TypeScript compiles

### Debug Tools

1. **Console logs**: Check browser and server console for errors
2. **Network tab**: Monitor API requests and responses
3. **Database queries**: Use database client to verify data
4. **Environment variables**: Ensure all required vars are set

## Conclusion

This recreation guide provides comprehensive instructions for building the Ad Variants Studio from scratch. The application demonstrates modern full-stack development practices with React, TypeScript, Node.js, and AI integration.

Key architectural decisions include:
- **Type-safe development** with TypeScript throughout
- **Role-based security** at the data access layer
- **AI-powered automation** for template generation
- **Modern UI patterns** with shadcn/ui and Tailwind CSS
- **Scalable data model** with hierarchical relationships

The codebase is designed to be maintainable, extensible, and production-ready.