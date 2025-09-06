import { 
  users, clients, projects, assets, variants,
  type User, type InsertUser,
  type Client, type InsertClient,
  type Project, type InsertProject,
  type Asset, type InsertAsset,
  type Variant, type InsertVariant
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Clients
  getClients(userId: string, isAdmin: boolean): Promise<Client[]>;
  getClient(id: string, userId: string, isAdmin: boolean): Promise<Client | undefined>;
  createClient(client: InsertClient & { createdByUserId: string }): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>, userId: string, isAdmin: boolean): Promise<Client | undefined>;
  deleteClient(id: string, userId: string, isAdmin: boolean): Promise<boolean>;
  
  // Projects
  getProjects(clientId?: string, userId?: string, isAdmin?: boolean, includeArchived?: boolean): Promise<(Project & { client: Client })[]>;
  getProject(id: string, userId: string, isAdmin: boolean): Promise<(Project & { client: Client }) | undefined>;
  createProject(project: InsertProject & { createdByUserId: string }): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>, userId: string, isAdmin: boolean): Promise<Project | undefined>;
  deleteProject(id: string, userId: string, isAdmin: boolean): Promise<boolean>;
  archiveProject(id: string, userId: string, isAdmin: boolean): Promise<Project | undefined>;
  unarchiveProject(id: string, userId: string, isAdmin: boolean): Promise<Project | undefined>;
  
  // Assets
  getAssets(projectId?: string, userId?: string, isAdmin?: boolean): Promise<(Asset & { project: Project & { client: Client } })[]>;
  getAsset(id: string, userId: string, isAdmin: boolean): Promise<(Asset & { project: Project & { client: Client } }) | undefined>;
  createAsset(asset: InsertAsset & { createdByUserId: string }): Promise<Asset>;
  updateAsset(id: string, asset: Partial<InsertAsset>, userId: string, isAdmin: boolean): Promise<Asset | undefined>;
  deleteAsset(id: string, userId: string, isAdmin: boolean): Promise<boolean>;
  
  // Variants
  getVariants(assetId?: string, userId?: string, isAdmin?: boolean): Promise<(Variant & { asset: Asset & { project: Project & { client: Client } } })[]>;
  getVariant(id: string, userId: string, isAdmin: boolean): Promise<(Variant & { asset: Asset & { project: Project & { client: Client } } }) | undefined>;
  createVariant(variant: InsertVariant & { createdByUserId: string }): Promise<Variant>;
  updateVariant(id: string, variant: Partial<InsertVariant>, userId: string, isAdmin: boolean): Promise<Variant | undefined>;
  deleteVariant(id: string, userId: string, isAdmin: boolean): Promise<boolean>;
  
  // Dashboard stats
  getDashboardStats(userId: string, isAdmin: boolean): Promise<{
    totalClients: number;
    activeProjects: number;
    templateAssets: number;
    generatedVariants: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Clients
  async getClients(userId: string, isAdmin: boolean): Promise<Client[]> {
    const query = db.select().from(clients);
    if (!isAdmin) {
      query.where(eq(clients.createdByUserId, userId));
    }
    return await query.orderBy(desc(clients.createdAt));
  }

  async getClient(id: string, userId: string, isAdmin: boolean): Promise<Client | undefined> {
    const conditions = [eq(clients.id, id)];
    if (!isAdmin) {
      conditions.push(eq(clients.createdByUserId, userId));
    }
    const [client] = await db.select().from(clients).where(and(...conditions));
    return client || undefined;
  }

  async createClient(client: InsertClient & { createdByUserId: string }): Promise<Client> {
    const [newClient] = await db.insert(clients).values(client).returning();
    return newClient;
  }

  async updateClient(id: string, client: Partial<InsertClient>, userId: string, isAdmin: boolean): Promise<Client | undefined> {
    const conditions = [eq(clients.id, id)];
    if (!isAdmin) {
      conditions.push(eq(clients.createdByUserId, userId));
    }
    const [updated] = await db.update(clients).set(client).where(and(...conditions)).returning();
    return updated || undefined;
  }

  async deleteClient(id: string, userId: string, isAdmin: boolean): Promise<boolean> {
    const conditions = [eq(clients.id, id)];
    if (!isAdmin) {
      conditions.push(eq(clients.createdByUserId, userId));
    }
    
    // First, get all projects for this client
    const clientProjects = await db.select({ id: projects.id })
      .from(projects)
      .where(eq(projects.clientId, id));
    
    // Delete all assets and variants for each project
    for (const project of clientProjects) {
      // Get all assets for this project
      const projectAssets = await db.select({ id: assets.id })
        .from(assets)
        .where(eq(assets.projectId, project.id));
      
      // Delete all variants for each asset
      for (const asset of projectAssets) {
        await db.delete(variants).where(eq(variants.assetId, asset.id));
      }
      
      // Delete all assets for this project
      await db.delete(assets).where(eq(assets.projectId, project.id));
    }
    
    // Delete all projects for this client
    await db.delete(projects).where(eq(projects.clientId, id));
    
    // Finally delete the client
    const result = await db.delete(clients).where(and(...conditions));
    return (result.rowCount ?? 0) > 0;
  }

  // Projects
  async getProjects(clientId?: string, userId?: string, isAdmin = false, includeArchived = false): Promise<(Project & { client: Client })[]> {
    const query = db.select().from(projects).leftJoin(clients, eq(projects.clientId, clients.id));
    const conditions = [];
    
    if (clientId) {
      conditions.push(eq(projects.clientId, clientId));
    }
    if (!isAdmin && userId) {
      conditions.push(eq(projects.createdByUserId, userId));
    }
    if (!includeArchived) {
      conditions.push(sql`${projects.archived} IS NULL`);
    }
    
    if (conditions.length > 0) {
      query.where(and(...conditions));
    }
    
    const result = await query.orderBy(desc(projects.createdAt));
    return result.map(row => ({ ...row.projects, client: row.clients! }));
  }

  async getProject(id: string, userId: string, isAdmin: boolean): Promise<(Project & { client: Client }) | undefined> {
    const conditions = [eq(projects.id, id)];
    if (!isAdmin) {
      conditions.push(eq(projects.createdByUserId, userId));
    }
    
    const [result] = await db.select()
      .from(projects)
      .leftJoin(clients, eq(projects.clientId, clients.id))
      .where(and(...conditions));
    
    return result ? { ...result.projects, client: result.clients! } : undefined;
  }

  async createProject(project: InsertProject & { createdByUserId: string }): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async updateProject(id: string, project: Partial<InsertProject>, userId: string, isAdmin: boolean): Promise<Project | undefined> {
    const conditions = [eq(projects.id, id)];
    if (!isAdmin) {
      conditions.push(eq(projects.createdByUserId, userId));
    }
    const [updated] = await db.update(projects).set(project).where(and(...conditions)).returning();
    return updated || undefined;
  }

  async deleteProject(id: string, userId: string, isAdmin: boolean): Promise<boolean> {
    const conditions = [eq(projects.id, id)];
    if (!isAdmin) {
      conditions.push(eq(projects.createdByUserId, userId));
    }
    
    // First, get all assets for this project
    const projectAssets = await db.select({ id: assets.id })
      .from(assets)
      .where(eq(assets.projectId, id));
    
    // Delete all variants for each asset
    for (const asset of projectAssets) {
      await db.delete(variants).where(eq(variants.assetId, asset.id));
    }
    
    // Delete all assets for this project
    await db.delete(assets).where(eq(assets.projectId, id));
    
    // Finally delete the project
    const result = await db.delete(projects).where(and(...conditions));
    return (result.rowCount ?? 0) > 0;
  }

  async archiveProject(id: string, userId: string, isAdmin: boolean): Promise<Project | undefined> {
    const conditions = [eq(projects.id, id)];
    if (!isAdmin) {
      conditions.push(eq(projects.createdByUserId, userId));
    }
    const [updated] = await db.update(projects)
      .set({ archived: new Date() })
      .where(and(...conditions))
      .returning();
    return updated || undefined;
  }

  async unarchiveProject(id: string, userId: string, isAdmin: boolean): Promise<Project | undefined> {
    const conditions = [eq(projects.id, id)];
    if (!isAdmin) {
      conditions.push(eq(projects.createdByUserId, userId));
    }
    const [updated] = await db.update(projects)
      .set({ archived: null })
      .where(and(...conditions))
      .returning();
    return updated || undefined;
  }

  // Assets
  async getAssets(projectId?: string, userId?: string, isAdmin = false): Promise<(Asset & { project: Project & { client: Client } })[]> {
    const query = db.select()
      .from(assets)
      .leftJoin(projects, eq(assets.projectId, projects.id))
      .leftJoin(clients, eq(projects.clientId, clients.id));
    
    const conditions = [];
    if (projectId) {
      conditions.push(eq(assets.projectId, projectId));
    }
    if (!isAdmin && userId) {
      conditions.push(eq(assets.createdByUserId, userId));
    }
    
    if (conditions.length > 0) {
      query.where(and(...conditions));
    }
    
    const result = await query.orderBy(desc(assets.createdAt));
    return result.map(row => ({ 
      ...row.assets, 
      project: { ...row.projects!, client: row.clients! } 
    }));
  }

  async getAsset(id: string, userId: string, isAdmin: boolean): Promise<(Asset & { project: Project & { client: Client } }) | undefined> {
    const conditions = [eq(assets.id, id)];
    if (!isAdmin) {
      conditions.push(eq(assets.createdByUserId, userId));
    }
    
    const [result] = await db.select()
      .from(assets)
      .leftJoin(projects, eq(assets.projectId, projects.id))
      .leftJoin(clients, eq(projects.clientId, clients.id))
      .where(and(...conditions));
    
    return result ? { 
      ...result.assets, 
      project: { ...result.projects!, client: result.clients! } 
    } : undefined;
  }

  async createAsset(asset: InsertAsset & { createdByUserId: string }): Promise<Asset> {
    const [newAsset] = await db.insert(assets).values(asset).returning();
    return newAsset;
  }

  async updateAsset(id: string, asset: Partial<InsertAsset>, userId: string, isAdmin: boolean): Promise<Asset | undefined> {
    const conditions = [eq(assets.id, id)];
    if (!isAdmin) {
      conditions.push(eq(assets.createdByUserId, userId));
    }
    const [updated] = await db.update(assets).set(asset).where(and(...conditions)).returning();
    return updated || undefined;
  }

  async deleteAsset(id: string, userId: string, isAdmin: boolean): Promise<boolean> {
    const conditions = [eq(assets.id, id)];
    if (!isAdmin) {
      conditions.push(eq(assets.createdByUserId, userId));
    }
    
    // First delete all variants for this asset
    await db.delete(variants).where(eq(variants.assetId, id));
    
    // Then delete the asset
    const result = await db.delete(assets).where(and(...conditions));
    return (result.rowCount ?? 0) > 0;
  }

  // Variants
  async getVariants(assetId?: string, userId?: string, isAdmin = false): Promise<(Variant & { asset: Asset & { project: Project & { client: Client } } })[]> {
    const query = db.select()
      .from(variants)
      .leftJoin(assets, eq(variants.assetId, assets.id))
      .leftJoin(projects, eq(assets.projectId, projects.id))
      .leftJoin(clients, eq(projects.clientId, clients.id));
    
    const conditions = [];
    if (assetId) {
      conditions.push(eq(variants.assetId, assetId));
    }
    if (!isAdmin && userId) {
      conditions.push(eq(variants.createdByUserId, userId));
    }
    
    if (conditions.length > 0) {
      query.where(and(...conditions));
    }
    
    const result = await query.orderBy(desc(variants.createdAt));
    return result.map(row => ({ 
      ...row.variants, 
      asset: { 
        ...row.assets!, 
        project: { ...row.projects!, client: row.clients! } 
      } 
    }));
  }

  async getVariant(id: string, userId: string, isAdmin: boolean): Promise<(Variant & { asset: Asset & { project: Project & { client: Client } } }) | undefined> {
    const conditions = [eq(variants.id, id)];
    if (!isAdmin) {
      conditions.push(eq(variants.createdByUserId, userId));
    }
    
    const [result] = await db.select()
      .from(variants)
      .leftJoin(assets, eq(variants.assetId, assets.id))
      .leftJoin(projects, eq(assets.projectId, projects.id))
      .leftJoin(clients, eq(projects.clientId, clients.id))
      .where(and(...conditions));
    
    return result ? { 
      ...result.variants, 
      asset: { 
        ...result.assets!, 
        project: { ...result.projects!, client: result.clients! } 
      } 
    } : undefined;
  }

  async createVariant(variant: InsertVariant & { createdByUserId: string }): Promise<Variant> {
    const [newVariant] = await db.insert(variants).values(variant).returning();
    return newVariant;
  }

  async updateVariant(id: string, variant: Partial<InsertVariant>, userId: string, isAdmin: boolean): Promise<Variant | undefined> {
    const conditions = [eq(variants.id, id)];
    if (!isAdmin) {
      conditions.push(eq(variants.createdByUserId, userId));
    }
    const [updated] = await db.update(variants).set(variant).where(and(...conditions)).returning();
    return updated || undefined;
  }

  async deleteVariant(id: string, userId: string, isAdmin: boolean): Promise<boolean> {
    const conditions = [eq(variants.id, id)];
    if (!isAdmin) {
      conditions.push(eq(variants.createdByUserId, userId));
    }
    const result = await db.delete(variants).where(and(...conditions));
    return (result.rowCount ?? 0) > 0;
  }

  // Dashboard stats
  async getDashboardStats(userId: string, isAdmin: boolean): Promise<{
    totalClients: number;
    activeProjects: number;
    templateAssets: number;
    generatedVariants: number;
  }> {
    const baseCondition = isAdmin ? undefined : userId;
    
    const clientsQuery = db.select({ count: sql<number>`count(*)` }).from(clients);
    if (!isAdmin) {
      clientsQuery.where(eq(clients.createdByUserId, userId));
    }
    
    const projectsQuery = db.select({ count: sql<number>`count(*)` }).from(projects);
    if (!isAdmin) {
      projectsQuery.where(eq(projects.createdByUserId, userId));
    }
    
    const assetsQuery = db.select({ count: sql<number>`count(*)` }).from(assets);
    if (!isAdmin) {
      assetsQuery.where(eq(assets.createdByUserId, userId));
    }
    
    const variantsQuery = db.select({ count: sql<number>`count(*)` }).from(variants);
    if (!isAdmin) {
      variantsQuery.where(eq(variants.createdByUserId, userId));
    }
    
    const [clientsResult, projectsResult, assetsResult, variantsResult] = await Promise.all([
      clientsQuery,
      projectsQuery,
      assetsQuery,
      variantsQuery
    ]);
    
    return {
      totalClients: clientsResult[0]?.count || 0,
      activeProjects: projectsResult[0]?.count || 0,
      templateAssets: assetsResult[0]?.count || 0,
      generatedVariants: variantsResult[0]?.count || 0,
    };
  }
}

export const storage = new DatabaseStorage();
