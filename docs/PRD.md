# Ad Variants Studio - Product Requirements Document

## 1. Problem Statement

Marketing teams and agencies spend significant time creating multiple ad variants for campaigns, manually adjusting copy, images, and layouts for different audiences and platforms. The current process is labor-intensive, inconsistent, and doesn't leverage AI capabilities to scale content creation efficiently.

**Pain Points:**
- Manual creation of ad variants is time-consuming and error-prone
- Inconsistent branding and messaging across variants  
- Difficulty maintaining templates and reusing design assets
- No centralized system for managing client campaigns and assets
- Limited automation for text and image generation

## 2. Goals & Non-Goals

### Goals
- **Primary:** Create a web application to generate multiple ad variants from master templates
- **Secondary:** Implement AI-powered text and image generation for automated variant creation
- **Tertiary:** Provide role-based access control for team collaboration

### Success Metrics
- Reduce manual variant creation time by 80%
- Generate consistent, on-brand ad variants at scale
- Support multiple clients and projects with proper access controls
- Enable template reuse across campaigns

### Non-Goals (MVP)
- External SSO integration
- Billing and subscription management
- Approval workflows and review processes
- Localization and multi-language support
- Public sharing or white-label solutions
- Multi-region deployment and scaling

## 3. User Roles & Permissions Matrix

| Action | ADMIN | USER |
|--------|-------|------|
| View all resources | ✅ | ❌ |
| View own resources | ✅ | ✅ |
| Create clients/projects/assets/variants | ✅ | ✅ |
| Update/delete own resources | ✅ | ✅ |
| Update/delete any resources | ✅ | ❌ |
| User management | ✅ | ❌ |
| System configuration | ✅ | ❌ |

**Ownership Rules:**
- USER role can only access resources they created (createdByUserId match)
- ADMIN role has unrestricted access to all resources
- Resource hierarchy: Client → Project → Asset → Variant

## 4. Detailed Use Cases

### 4.1 Create Client → Project → Asset Flow
1. **Create Client:**
   - User navigates to `/clients`
   - Clicks "New Client" button
   - Fills client name and description
   - System creates client record with user ownership

2. **Create Project:**
   - User navigates to `/projects`
   - Clicks "New Project" button
   - Selects existing client from dropdown
   - Fills project name and description
   - System creates project linked to client

3. **Create Asset Template:**
   - User navigates to `/assets`
   - Clicks "New Asset" button
   - Selects existing project from dropdown
   - Provides asset name and SVG template with tokens
   - Configures fonts, default bindings, and style hints
   - System validates SVG and creates asset record

### 4.2 Manual Variant Creation
1. User navigates to `/variants`
2. Clicks "New Variant" button
3. Selects existing asset template
4. Provides custom bindings (headline, subheadline, CTA, image URL)
5. System processes template with bindings
6. Generates SVG with token replacements
7. Creates variant record with DRAFT status
8. User can preview and export final PNG

### 4.3 Auto Variant Generation
1. User clicks "Auto Generate Variants" button
2. Selects asset template for generation
3. Configures generation parameters:
   - Text variant count (1-10)
   - Image variant count (1-5)
   - Tone and style constraints
   - Length limitations
4. System calls Gemini API for text generation
5. System calls Gemini Image API for background generation
6. Creates multiple variant combinations
7. All variants stored with AUTO source tag

### 4.4 Template Authoring
1. User creates SVG template with tokenized placeholders:
   - `{{headline}}` - Main advertising headline
   - `{{subheadline}}` - Supporting text
   - `{{cta}}` - Call-to-action button text
   - `{{image}}` - Background image URL
2. Configures font definitions with web font URLs
3. Sets default bindings for preview and fallback
4. Provides style hints for AI generation consistency

### 4.5 Preview & Export
1. User selects variant from grid view
2. System renders SVG with current bindings
3. Preview shows pixel-accurate representation
4. User can download PNG export (1200px width default)
5. Export includes embedded fonts and proper text rendering

## 5. System Overview & Constraints

### Architecture
- **Frontend:** Next.js 14 with App Router, React 18, TypeScript
- **Backend:** Next.js API routes with Express session management
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** Credential-based authentication with bcrypt
- **Storage:** Google Cloud Storage with signed URLs
- **AI Services:** Google AI SDK (Gemini 2.5 Flash & Image)

### SVG Processing Pipeline
1. **Template Storage:** SVG stored as text with token placeholders
2. **Token Replacement:** Server-side string substitution for content
3. **Font Embedding:** TTF/OTF fonts fetched and embedded as data URLs
4. **Text Wrapping:** Automatic line breaking with opentype.js metrics
5. **Sanitization:** XSS prevention with allowlist-based SVG cleaning
6. **Rasterization:** SVG to PNG conversion using resvg/sharp

### File Storage Strategy
- **Assets:** SVG templates, font files, generated images
- **Storage Location:** Google Cloud Storage bucket
- **Access Method:** Signed URLs with expiration (24 hours)
- **File Limits:** 20MB maximum per file
- **MIME Validation:** Strict type checking (svg, ttf, otf, jpg, png)

### Rate Limits & Quotas
- **API Requests:** 1000 requests/hour per user
- **AI Generation:** 50 text generations/day, 20 images/day per user  
- **File Uploads:** 100MB total per user per day
- **Concurrent Renders:** 5 simultaneous SVG processing jobs

## 6. Data Model

### Entity Relationship Diagram
