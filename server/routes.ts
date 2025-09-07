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
  validateTextGenerationRequest,
  validateImageGenerationRequest 
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

  // Helper function for error responses
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

  // Clients routes
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
      const client = await storage.createClient({
        ...clientData,
        createdByUserId: user.id,
      });
      res.status(201).json({ ok: true, data: client });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/clients/:id", requireAuth, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const client = await storage.getClient(req.params.id, user.id, user.role === "ADMIN");
      if (!client) {
        return res.status(404).json({
          ok: false,
          error: { code: "NOT_FOUND", message: "Client not found" }
        });
      }
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

  // Projects routes
  app.get("/api/projects", requireAuth, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const clientId = req.query.clientId as string | undefined;
      const projects = await storage.getProjects(clientId, user.id, user.role === "ADMIN");
      res.json({ ok: true, data: projects });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/projects", requireAuth, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const projectData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject({
        ...projectData,
        createdByUserId: user.id,
      });
      res.status(201).json({ ok: true, data: project });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/projects/:id", requireAuth, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const project = await storage.getProject(req.params.id, user.id, user.role === "ADMIN");
      if (!project) {
        return res.status(404).json({
          ok: false,
          error: { code: "NOT_FOUND", message: "Project not found" }
        });
      }
      res.json({ ok: true, data: project });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch("/api/projects/:id", requireAuth, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const updateData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(req.params.id, updateData, user.id, user.role === "ADMIN");
      if (!project) {
        return res.status(404).json({
          ok: false,
          error: { code: "NOT_FOUND", message: "Project not found or access denied" }
        });
      }
      res.json({ ok: true, data: project });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/projects/:id", requireAuth, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const success = await storage.deleteProject(req.params.id, user.id, user.role === "ADMIN");
      if (!success) {
        return res.status(404).json({
          ok: false,
          error: { code: "NOT_FOUND", message: "Project not found or access denied" }
        });
      }
      res.json({ ok: true, data: { message: "Project deleted successfully" } });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/projects/:id/archive", requireAuth, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const project = await storage.archiveProject(req.params.id, user.id, user.role === "ADMIN");
      if (!project) {
        return res.status(404).json({
          ok: false,
          error: { code: "NOT_FOUND", message: "Project not found or access denied" }
        });
      }
      res.json({ ok: true, data: project });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/projects/:id/unarchive", requireAuth, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const project = await storage.unarchiveProject(req.params.id, user.id, user.role === "ADMIN");
      if (!project) {
        return res.status(404).json({
          ok: false,
          error: { code: "NOT_FOUND", message: "Project not found or access denied" }
        });
      }
      res.json({ ok: true, data: project });
    } catch (error) {
      handleError(res, error);
    }
  });

  // Assets routes
  app.get("/api/assets", requireAuth, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const projectId = req.query.projectId as string | undefined;
      const assets = await storage.getAssets(projectId, user.id, user.role === "ADMIN");
      res.json({ ok: true, data: assets });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/assets", requireAuth, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      let assetData = insertAssetSchema.parse(req.body);

      // If a master asset URL is provided, generate template from it
      if (assetData.masterAssetUrl) {
        try {
          // Get project context for template generation
          const project = await storage.getProject(assetData.projectId, user.id, user.role === "ADMIN");
          if (!project) {
            return res.status(404).json({
              ok: false,
              error: { code: "NOT_FOUND", message: "Project not found" }
            });
          }

          console.log(`Generating template from master asset: ${assetData.masterAssetUrl}`);
          
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

          // Update asset data with generated template
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
          // Continue with manual template creation if generation fails
          console.log("Falling back to manual template creation");
        }
      }

      const asset = await storage.createAsset({
        ...assetData,
        createdByUserId: user.id,
      });
      res.status(201).json({ ok: true, data: asset });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/assets/:id", requireAuth, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const asset = await storage.getAsset(req.params.id, user.id, user.role === "ADMIN");
      if (!asset) {
        return res.status(404).json({
          ok: false,
          error: { code: "NOT_FOUND", message: "Asset not found" }
        });
      }
      res.json({ ok: true, data: asset });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch("/api/assets/:id", requireAuth, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      let updateData = insertAssetSchema.partial().parse(req.body);

      // If master asset URL was updated, regenerate template
      if (updateData.masterAssetUrl) {
        try {
          // Get the existing asset to access project context
          const existingAsset = await storage.getAsset(req.params.id, user.id, user.role === "ADMIN");
          if (existingAsset && existingAsset.masterAssetUrl !== updateData.masterAssetUrl) {
            console.log(`Regenerating template for updated master asset: ${updateData.masterAssetUrl}`);
            
            // Generate template from master asset
            const templateData = await generateTemplateFromMasterAsset(
              updateData.masterAssetUrl,
              updateData.name || existingAsset.name,
              {
                name: existingAsset.project.name,
                brief: existingAsset.project.brief || undefined,
                clientName: existingAsset.project.client.name
              }
            );

            // Include generated template in update data
            updateData = {
              ...updateData,
              templateSvg: templateData.templateSvg,
              templateFonts: templateData.templateFonts,
              defaultBindings: templateData.defaultBindings,
              styleHints: templateData.styleHints,
            };

            console.log(`Template regenerated successfully for asset update`);
          }
        } catch (templateError) {
          console.error("Template generation failed during update:", templateError);
          // Continue with update without template regeneration
        }
      }

      const asset = await storage.updateAsset(req.params.id, updateData, user.id, user.role === "ADMIN");
      if (!asset) {
        return res.status(404).json({
          ok: false,
          error: { code: "NOT_FOUND", message: "Asset not found or access denied" }
        });
      }
      res.json({ ok: true, data: asset });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/assets/:id", requireAuth, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const success = await storage.deleteAsset(req.params.id, user.id, user.role === "ADMIN");
      if (!success) {
        return res.status(404).json({
          ok: false,
          error: { code: "NOT_FOUND", message: "Asset not found or access denied" }
        });
      }
      res.json({ ok: true, data: { message: "Asset deleted successfully" } });
    } catch (error) {
      handleError(res, error);
    }
  });

  // Generate template from master asset
  app.post("/api/assets/:id/generate-template", requireAuth, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      
      // Get the asset
      const asset = await storage.getAsset(req.params.id, user.id, user.role === "ADMIN");
      if (!asset) {
        return res.status(404).json({
          ok: false,
          error: { code: "NOT_FOUND", message: "Asset not found or access denied" }
        });
      }

      // Check if asset has master asset URL
      if (!asset.masterAssetUrl) {
        return res.status(400).json({
          ok: false,
          error: { code: "INVALID_REQUEST", message: "Asset has no master asset URL" }
        });
      }

      console.log(`Regenerating template from master asset: ${asset.masterAssetUrl}`);
      
      // Generate template from master asset
      const templateData = await generateTemplateFromMasterAsset(
        asset.masterAssetUrl,
        asset.name,
        {
          name: asset.project.name,
          brief: asset.project.brief || undefined,
          clientName: asset.project.client.name
        }
      );

      // Update the asset with generated template
      const updatedAsset = await storage.updateAsset(
        req.params.id,
        {
          templateSvg: templateData.templateSvg,
          templateFonts: templateData.templateFonts,
          defaultBindings: templateData.defaultBindings,
          styleHints: templateData.styleHints,
        },
        user.id,
        user.role === "ADMIN"
      );

      if (!updatedAsset) {
        return res.status(500).json({
          ok: false,
          error: { code: "UPDATE_FAILED", message: "Failed to update asset with generated template" }
        });
      }

      console.log(`Template regenerated successfully for asset: ${asset.name}`);
      res.json({ ok: true, data: updatedAsset });
    } catch (error) {
      console.error("Template regeneration failed:", error);
      handleError(res, error);
    }
  });

  // Variants routes
  app.get("/api/variants", requireAuth, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const assetId = req.query.assetId as string | undefined;
      const variants = await storage.getVariants(assetId, user.id, user.role === "ADMIN");
      res.json({ ok: true, data: variants });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/variants", requireAuth, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const variantData = insertVariantSchema.parse(req.body);
      const variant = await storage.createVariant({
        ...variantData,
        createdByUserId: user.id,
      });
      res.status(201).json({ ok: true, data: variant });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/variants/:id", requireAuth, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const variant = await storage.getVariant(req.params.id, user.id, user.role === "ADMIN");
      if (!variant) {
        return res.status(404).json({
          ok: false,
          error: { code: "NOT_FOUND", message: "Variant not found" }
        });
      }
      res.json({ ok: true, data: variant });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch("/api/variants/:id", requireAuth, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const updateData = insertVariantSchema.partial().parse(req.body);
      const variant = await storage.updateVariant(req.params.id, updateData, user.id, user.role === "ADMIN");
      if (!variant) {
        return res.status(404).json({
          ok: false,
          error: { code: "NOT_FOUND", message: "Variant not found or access denied" }
        });
      }
      res.json({ ok: true, data: variant });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/variants/:id", requireAuth, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const success = await storage.deleteVariant(req.params.id, user.id, user.role === "ADMIN");
      if (!success) {
        return res.status(404).json({
          ok: false,
          error: { code: "NOT_FOUND", message: "Variant not found or access denied" }
        });
      }
      res.json({ ok: true, data: { message: "Variant deleted successfully" } });
    } catch (error) {
      handleError(res, error);
    }
  });

  // AI Generation routes
  app.post("/api/generate/text", requireAuth, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const request = validateTextGenerationRequest(req.body);
      
      // Get asset context
      const asset = await storage.getAsset(request.assetId, user.id, user.role === "ADMIN");
      if (!asset) {
        return res.status(404).json({
          ok: false,
          error: { code: "NOT_FOUND", message: "Asset not found" }
        });
      }
      
      const variants = await generateTextVariants(request, {
        name: asset.name,
        defaultBindings: asset.defaultBindings,
        styleHints: asset.styleHints,
        projectName: asset.project.name,
        clientName: asset.project.client.name,
      });
      
      res.json({ ok: true, data: { variants } });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/generate/image", requireAuth, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const request = validateImageGenerationRequest(req.body);
      
      // Get asset context
      const asset = await storage.getAsset(request.assetId, user.id, user.role === "ADMIN");
      if (!asset) {
        return res.status(404).json({
          ok: false,
          error: { code: "NOT_FOUND", message: "Asset not found" }
        });
      }
      
      const imageUrls = await generateImages(request, {
        name: asset.name,
        styleHints: asset.styleHints,
        projectName: asset.project.name,
        clientName: asset.project.client.name,
      });
      
      res.json({ ok: true, data: { images: imageUrls } });
    } catch (error) {
      handleError(res, error);
    }
  });

  // Bulk variant generation
  app.post("/api/variants/generate", requireAuth, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const schema = z.object({
        assetId: z.string().uuid(),
        generateText: z.boolean().default(true),
        generateImages: z.boolean().default(true),
        textCount: z.number().min(1).max(10).default(3),
        imageCount: z.number().min(1).max(5).default(1),
        constraints: z.object({
          headlineMaxWords: z.number().optional(),
          subheadlineMaxChars: z.number().optional(),
          ctaPhrasesAllowed: z.array(z.string()).optional(),
          tone: z.enum(["conversational", "direct", "playful", "formal"]).optional(),
          bannedPhrases: z.array(z.string()).optional(),
        }).optional(),
      });
      
      const request = schema.parse(req.body);
      
      // Get asset context
      const asset = await storage.getAsset(request.assetId, user.id, user.role === "ADMIN");
      if (!asset) {
        return res.status(404).json({
          ok: false,
          error: { code: "NOT_FOUND", message: "Asset not found" }
        });
      }
      
      const results = {
        variants: [] as any[],
        errors: [] as string[],
      };
      
      try {
        // Generate text variants
        let textVariants: any[] = [];
        if (request.generateText) {
          textVariants = await generateTextVariants({
            assetId: request.assetId,
            count: request.textCount,
            constraints: request.constraints,
          }, {
            name: asset.name,
            defaultBindings: asset.defaultBindings,
            styleHints: asset.styleHints,
            projectName: asset.project.name,
            clientName: asset.project.client.name,
          });
        }
        
        // Generate images
        let imageUrls: string[] = [];
        if (request.generateImages) {
          imageUrls = await generateImages({
            assetId: request.assetId,
            count: request.imageCount,
          }, {
            name: asset.name,
            styleHints: asset.styleHints,
            projectName: asset.project.name,
            clientName: asset.project.client.name,
          });
        }
        
        // Create variants combining text and images
        const maxVariants = Math.max(textVariants.length, imageUrls.length);
        for (let i = 0; i < maxVariants; i++) {
          const textVariant = textVariants[i % textVariants.length] || asset.defaultBindings;
          const imageUrl = imageUrls[i % imageUrls.length] || "";
          
          try {
            const variant = await storage.createVariant({
              assetId: request.assetId,
              source: "AUTO",
              bindings: {
                headline: textVariant.headline,
                subheadline: textVariant.subheadline,
                cta: textVariant.cta,
                imageUrl: imageUrl,
              },
              renderSvg: asset.templateSvg, // TODO: Process template with bindings
              status: "DRAFT",
              createdByUserId: user.id,
            });
            
            results.variants.push(variant);
          } catch (error) {
            results.errors.push(`Failed to create variant ${i + 1}: ${error}`);
          }
        }
      } catch (error) {
        results.errors.push(`Generation failed: ${error}`);
      }
      
      res.json({ ok: true, data: results });
    } catch (error) {
      handleError(res, error);
    }
  });

  // Object storage routes for file uploads
  app.post("/api/objects/upload", requireAuth, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ ok: true, data: { uploadURL } });
    } catch (error) {
      handleError(res, error);
    }
  });

  // Serve uploaded files
  app.get("/api/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = `/objects/${req.params.objectPath}`;
      const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      return res.status(404).json({
        ok: false,
        error: { code: "NOT_FOUND", message: "File not found" }
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
