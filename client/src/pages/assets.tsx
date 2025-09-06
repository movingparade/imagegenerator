import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Asset, Project, Variant } from "@/types";
import { apiPost, apiPatch, apiDelete } from "@/lib/api";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit, Image, FolderOpen, Code, Plus, Sparkles, User, Bot, CheckCircle, AlertCircle, Clock, Upload, FileImage, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ObjectUploader } from "@/components/ObjectUploader";

export default function Assets() {
  const [showCreateAssetDialog, setShowCreateAssetDialog] = useState(false);
  const [showEditAssetDialog, setShowEditAssetDialog] = useState(false);
  const [showCreateVariantDialog, setShowCreateVariantDialog] = useState(false);
  const [showEditVariantDialog, setShowEditVariantDialog] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string>("");
  const [newAsset, setNewAsset] = useState({ 
    name: "", 
    projectId: "",
    masterAssetUrl: "",
    masterAssetType: "",
    templateSvg: `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f0f0f0"/>
  <text x="50%" y="30%" text-anchor="middle" font-family="Arial" font-size="24" font-weight="bold">{{headline}}</text>
  <text x="50%" y="50%" text-anchor="middle" font-family="Arial" font-size="16">{{subheadline}}</text>
  <rect x="50%" y="70%" width="120" height="40" rx="20" transform="translate(-60, 0)" fill="#007bff"/>
  <text x="50%" y="78%" text-anchor="middle" font-family="Arial" font-size="14" fill="white">{{cta}}</text>
</svg>`,
    templateFonts: JSON.stringify([
      {
        family: "Arial",
        url: "",
        weight: "normal",
        style: "normal"
      }
    ]),
    defaultBindings: JSON.stringify({
      headline: "Sample Headline",
      subheadline: "Sample subheadline text",
      cta: "Click Here",
      image: ""
    }),
    styleHints: JSON.stringify({
      palette: ["#007bff", "#ffffff", "#000000"],
      brand: "Modern and clean",
      notes: "Use consistent spacing and typography"
    })
  });
  const [editingAsset, setEditingAsset] = useState({ 
    id: "",
    name: "", 
    projectId: "",
    masterAssetUrl: "",
    masterAssetType: "",
    templateSvg: "",
    templateFonts: "",
    defaultBindings: "",
    styleHints: ""
  });
  const [newVariant, setNewVariant] = useState({
    assetId: "",
    source: "USER" as "USER" | "AUTO",
    bindings: JSON.stringify({
      headline: "New Headline",
      subheadline: "New subheadline text",
      cta: "Get Started",
      image: ""
    })
  });
  const [editingVariant, setEditingVariant] = useState({
    id: "",
    assetId: "",
    source: "USER" as "USER" | "AUTO",
    bindings: ""
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: assets = [], isLoading: assetsLoading } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: variants = [], isLoading: variantsLoading } = useQuery<Variant[]>({
    queryKey: ["/api/variants"],
  });

  const createAssetMutation = useMutation({
    mutationFn: (asset: typeof newAsset) => 
      apiPost<Asset>("/api/assets", {
        ...asset,
        templateFonts: JSON.parse(asset.templateFonts),
        defaultBindings: JSON.parse(asset.defaultBindings),
        styleHints: JSON.parse(asset.styleHints),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setShowCreateAssetDialog(false);
      resetNewAsset();
      toast({
        title: "Success",
        description: "Asset created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const editAssetMutation = useMutation({
    mutationFn: ({ id, ...asset }: typeof editingAsset) => 
      apiPatch<Asset>(`/api/assets/${id}`, {
        ...asset,
        templateFonts: JSON.parse(asset.templateFonts),
        defaultBindings: JSON.parse(asset.defaultBindings),
        styleHints: JSON.parse(asset.styleHints),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      setShowEditAssetDialog(false);
      setEditingAsset({ 
        id: "", name: "", projectId: "", masterAssetUrl: "", masterAssetType: "",
        templateSvg: "", templateFonts: "", defaultBindings: "", styleHints: ""
      });
      toast({
        title: "Success",
        description: "Asset updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createVariantMutation = useMutation({
    mutationFn: (variant: typeof newVariant) => 
      apiPost("/api/variants", {
        ...variant,
        bindings: JSON.parse(variant.bindings),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/variants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setShowCreateVariantDialog(false);
      setNewVariant({
        assetId: "",
        source: "USER",
        bindings: JSON.stringify({
          headline: "New Headline",
          subheadline: "New subheadline text",
          cta: "Get Started",
          image: ""
        })
      });
      toast({
        title: "Success",
        description: "Variant created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const editVariantMutation = useMutation({
    mutationFn: ({ id, ...variant }: typeof editingVariant) => 
      apiPatch(`/api/variants/${id}`, {
        ...variant,
        bindings: JSON.parse(variant.bindings),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/variants"] });
      setShowEditVariantDialog(false);
      setEditingVariant({ id: "", assetId: "", source: "USER", bindings: "" });
      toast({
        title: "Success",
        description: "Variant updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteAssetMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/assets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Asset deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteVariantMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/variants/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/variants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Variant deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const regenerateTemplateMutation = useMutation({
    mutationFn: (assetId: string) => apiPost(`/api/assets/${assetId}/generate-template`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      toast({
        title: "Success",
        description: "Template regenerated from master asset successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetNewAsset = () => {
    setNewAsset({ 
      name: "", 
      projectId: "",
      masterAssetUrl: "",
      masterAssetType: "",
      templateSvg: `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f0f0f0"/>
  <text x="50%" y="30%" text-anchor="middle" font-family="Arial" font-size="24" font-weight="bold">{{headline}}</text>
  <text x="50%" y="50%" text-anchor="middle" font-family="Arial" font-size="16">{{subheadline}}</text>
  <rect x="50%" y="70%" width="120" height="40" rx="20" transform="translate(-60, 0)" fill="#007bff"/>
  <text x="50%" y="78%" text-anchor="middle" font-family="Arial" font-size="14" fill="white">{{cta}}</text>
</svg>`,
      templateFonts: JSON.stringify([
        {
          family: "Arial",
          url: "",
          weight: "normal",
          style: "normal"
        }
      ]),
      defaultBindings: JSON.stringify({
        headline: "Sample Headline",
        subheadline: "Sample subheadline text",
        cta: "Click Here",
        image: ""
      }),
      styleHints: JSON.stringify({
        palette: ["#007bff", "#ffffff", "#000000"],
        brand: "Modern and clean",
        notes: "Use consistent spacing and typography"
      })
    });
  };

  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsset.projectId) {
      toast({
        title: "Error",
        description: "Please select a project",
        variant: "destructive",
      });
      return;
    }
    createAssetMutation.mutate(newAsset);
  };

  const handleEditAsset = (e: React.FormEvent) => {
    e.preventDefault();
    editAssetMutation.mutate(editingAsset);
  };

  const handleCreateVariant = (e: React.FormEvent) => {
    e.preventDefault();
    createVariantMutation.mutate(newVariant);
  };

  const handleEditVariant = (e: React.FormEvent) => {
    e.preventDefault();
    editVariantMutation.mutate(editingVariant);
  };

  const handleDeleteAsset = (id: string) => {
    if (confirm("Are you sure you want to delete this asset? This will also delete all associated variants.")) {
      deleteAssetMutation.mutate(id);
    }
  };

  const handleDeleteVariant = (id: string) => {
    if (confirm("Are you sure you want to delete this variant?")) {
      deleteVariantMutation.mutate(id);
    }
  };

  const handleRegenerateTemplate = (assetId: string, assetName: string) => {
    if (confirm(`Are you sure you want to regenerate the template for "${assetName}"? This will overwrite the existing template.`)) {
      regenerateTemplateMutation.mutate(assetId);
    }
  };

  const openEditAsset = (asset: Asset) => {
    setEditingAsset({
      id: asset.id,
      name: asset.name,
      projectId: asset.projectId,
      masterAssetUrl: asset.masterAssetUrl || "",
      masterAssetType: asset.masterAssetType || "",
      templateSvg: asset.templateSvg,
      templateFonts: JSON.stringify(asset.templateFonts, null, 2),
      defaultBindings: JSON.stringify(asset.defaultBindings, null, 2),
      styleHints: JSON.stringify(asset.styleHints, null, 2)
    });
    setShowEditAssetDialog(true);
  };

  const openEditVariant = (variant: Variant) => {
    setEditingVariant({
      id: variant.id,
      assetId: variant.assetId,
      source: variant.source,
      bindings: JSON.stringify(variant.bindings, null, 2)
    });
    setShowEditVariantDialog(true);
  };

  const openCreateVariantDialog = (assetId: string) => {
    setSelectedAssetId(assetId);
    setNewVariant({ ...newVariant, assetId });
    setShowCreateVariantDialog(true);
  };

  const getVariantsForAsset = (assetId: string) => {
    return variants.filter(variant => variant.assetId === assetId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "generating":
        return <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSourceIcon = (source: string) => {
    return source === "AUTO" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />;
  };

  if (assetsLoading || variantsLoading) {
    return (
      <>
        <Header 
          title="Assets"
          description="Manage your creative assets and templates"
          onCreateNew={() => setShowCreateAssetDialog(true)}
          createLabel="New Asset"
        />
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-96 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header 
        title="Assets"
        description="Manage your creative assets and templates"
        onCreateNew={() => setShowCreateAssetDialog(true)}
        createLabel="New Asset"
      />
      
      <div className="flex-1 overflow-auto p-6">
        {assets.length === 0 ? (
          <div className="text-center py-12">
            <Image className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No assets yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first template asset to start generating variants.
            </p>
            <Button onClick={() => setShowCreateAssetDialog(true)} data-testid="button-create-first-asset">
              Create First Asset
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {assets.map((asset) => {
              const assetVariants = getVariantsForAsset(asset.id);
              
              return (
                <Card key={asset.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1" data-testid={`text-asset-name-${asset.id}`}>
                          {asset.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mb-2">
                          {asset.project.name} • {asset.project.client.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Created {formatDistanceToNow(new Date(asset.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        {asset.masterAssetUrl && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleRegenerateTemplate(asset.id, asset.name)}
                            disabled={regenerateTemplateMutation.isPending}
                            title="Regenerate template from master asset"
                            data-testid={`button-regenerate-template-${asset.id}`}
                          >
                            <RefreshCw className={`w-4 h-4 ${regenerateTemplateMutation.isPending ? 'animate-spin' : ''}`} />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => openEditAsset(asset)}
                          data-testid={`button-edit-asset-${asset.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteAsset(asset.id)}
                          data-testid={`button-delete-asset-${asset.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {asset.masterAssetUrl && (
                      <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-md">
                        <div className="flex items-center text-sm text-blue-700 dark:text-blue-300">
                          <FileImage className="w-4 h-4 mr-2" />
                          Master asset: {asset.masterAssetType}
                        </div>
                      </div>
                    )}
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    {/* Template Preview */}
                    <div className="mb-4 p-3 bg-muted/50 rounded-md">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Template</span>
                        <Code className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="max-h-40 overflow-y-auto">
                        <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                          {asset.templateSvg.substring(0, 200)}...
                        </pre>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm text-muted-foreground">
                        <span>{assetVariants.length} variant{assetVariants.length !== 1 ? 's' : ''}</span>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => openCreateVariantDialog(asset.id)}
                        data-testid={`button-create-variant-${asset.id}`}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Create Variant
                      </Button>
                    </div>

                    {/* Variants List */}
                    {assetVariants.length > 0 && (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {assetVariants.map((variant) => (
                          <div 
                            key={variant.id} 
                            className="flex items-center justify-between p-2 rounded-md border bg-background"
                            data-testid={`variant-card-${variant.id}`}
                          >
                            <div className="flex items-center flex-1 min-w-0">
                              {getSourceIcon(variant.source)}
                              <div className="flex-1 min-w-0 ml-2">
                                <p className="text-sm font-medium truncate">
                                  Variant #{variant.id.slice(-8)}
                                </p>
                                <div className="flex items-center text-xs text-muted-foreground">
                                  {getStatusIcon(variant.status)}
                                  <span className="ml-1 capitalize">{variant.status}</span>
                                  {variant.source === "AUTO" && (
                                    <Badge variant="secondary" className="ml-2 text-xs">
                                      <Sparkles className="w-3 h-3 mr-1" />
                                      AI
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditVariant(variant)}
                                data-testid={`button-edit-variant-${variant.id}`}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteVariant(variant.id)}
                                data-testid={`button-delete-variant-${variant.id}`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {assetVariants.length === 0 && (
                      <div className="text-center py-4">
                        <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No variants yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Asset Dialog */}
      <Dialog open={showCreateAssetDialog} onOpenChange={setShowCreateAssetDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Asset</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateAsset} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project">Project</Label>
                <Select
                  value={newAsset.projectId}
                  onValueChange={(value) => setNewAsset({ ...newAsset, projectId: value })}
                >
                  <SelectTrigger data-testid="select-asset-project">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.filter(p => !p.archived).map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name} ({project.client.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assetName">Asset Name</Label>
                <Input
                  id="assetName"
                  value={newAsset.name}
                  onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                  required
                  data-testid="input-asset-name"
                />
              </div>
            </div>

            {/* Master Asset Upload Section */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
              <div className="flex items-center space-x-2">
                <Upload className="w-5 h-5" />
                <h3 className="text-lg font-medium">Master Asset (Optional)</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Upload a master asset file that variants will be built from (images, videos, documents, etc.)
              </p>
              
              {/* File Upload Option */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Upload File</Label>
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={50485760} // 50MB
                    onGetUploadParameters={async () => {
                      const response = await fetch("/api/objects/upload", {
                        method: "POST",
                        credentials: "include"
                      });
                      const data = await response.json();
                      if (!data.ok) throw new Error("Failed to get upload URL");
                      return { method: "PUT", url: data.data.uploadURL };
                    }}
                    onComplete={(result) => {
                      if (result.successful && result.successful.length > 0) {
                        const uploadedFile = result.successful[0];
                        const fileUrl = uploadedFile.uploadURL;
                        const fileName = uploadedFile.name;
                        const fileType = fileName.split('.').pop()?.toLowerCase() || 'other';
                        
                        // Determine asset type based on file extension
                        let assetType = 'other';
                        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileType)) {
                          assetType = 'image';
                        } else if (['mp4', 'avi', 'mov', 'wmv'].includes(fileType)) {
                          assetType = 'video';
                        } else if (['pdf', 'doc', 'docx', 'txt'].includes(fileType)) {
                          assetType = 'document';
                        } else if (['mp3', 'wav', 'ogg'].includes(fileType)) {
                          assetType = 'audio';
                        }
                        
                        setNewAsset({
                          ...newAsset,
                          masterAssetUrl: fileUrl,
                          masterAssetType: assetType
                        });
                        
                        toast({
                          title: "Success",
                          description: `File "${fileName}" uploaded successfully`
                        });
                      }
                    }}
                    buttonClassName="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File to Upload
                  </ObjectUploader>
                </div>
                
                {/* OR Divider */}
                <div className="flex items-center space-x-4">
                  <div className="flex-1 border-t"></div>
                  <span className="text-sm text-muted-foreground">OR</span>
                  <div className="flex-1 border-t"></div>
                </div>
                
                {/* URL Input Option */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="masterAssetUrl">Master Asset URL</Label>
                    <Input
                      id="masterAssetUrl"
                      value={newAsset.masterAssetUrl}
                      onChange={(e) => setNewAsset({ ...newAsset, masterAssetUrl: e.target.value })}
                      placeholder="https://example.com/asset.jpg"
                      data-testid="input-master-asset-url"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="masterAssetType">Asset Type</Label>
                    <Select
                      value={newAsset.masterAssetType}
                      onValueChange={(value) => setNewAsset({ ...newAsset, masterAssetType: value })}
                    >
                      <SelectTrigger data-testid="select-master-asset-type">
                        <SelectValue placeholder="Select asset type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="image">Image</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="audio">Audio</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="templateSvg">Template SVG</Label>
              <Textarea
                id="templateSvg"
                value={newAsset.templateSvg}
                onChange={(e) => setNewAsset({ ...newAsset, templateSvg: e.target.value })}
                placeholder="<svg>...</svg>"
                required
                rows={8}
                data-testid="input-asset-svg"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="templateFonts">Template Fonts (JSON)</Label>
                <Textarea
                  id="templateFonts"
                  value={newAsset.templateFonts}
                  onChange={(e) => setNewAsset({ ...newAsset, templateFonts: e.target.value })}
                  rows={4}
                  data-testid="input-template-fonts"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultBindings">Default Bindings (JSON)</Label>
                <Textarea
                  id="defaultBindings"
                  value={newAsset.defaultBindings}
                  onChange={(e) => setNewAsset({ ...newAsset, defaultBindings: e.target.value })}
                  rows={4}
                  data-testid="input-default-bindings"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="styleHints">Style Hints (JSON)</Label>
                <Textarea
                  id="styleHints"
                  value={newAsset.styleHints}
                  onChange={(e) => setNewAsset({ ...newAsset, styleHints: e.target.value })}
                  rows={4}
                  data-testid="input-style-hints"
                />
              </div>
            </div>

            <div className="flex space-x-2">
              <Button 
                type="submit" 
                disabled={createAssetMutation.isPending || !newAsset.projectId}
                data-testid="button-create-asset"
              >
                {createAssetMutation.isPending ? "Creating..." : "Create Asset"}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setShowCreateAssetDialog(false)}
                data-testid="button-cancel-create-asset"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Asset Dialog */}
      <Dialog open={showEditAssetDialog} onOpenChange={setShowEditAssetDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditAsset} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editProject">Project</Label>
                <Select
                  value={editingAsset.projectId}
                  onValueChange={(value) => setEditingAsset({ ...editingAsset, projectId: value })}
                >
                  <SelectTrigger data-testid="select-edit-asset-project">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.filter(p => !p.archived).map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name} ({project.client.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editAssetName">Asset Name</Label>
                <Input
                  id="editAssetName"
                  value={editingAsset.name}
                  onChange={(e) => setEditingAsset({ ...editingAsset, name: e.target.value })}
                  required
                  data-testid="input-edit-asset-name"
                />
              </div>
            </div>

            {/* Master Asset Upload Section */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
              <div className="flex items-center space-x-2">
                <Upload className="w-5 h-5" />
                <h3 className="text-lg font-medium">Master Asset</h3>
              </div>
              {/* File Upload Option */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Upload File</Label>
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={50485760} // 50MB
                    onGetUploadParameters={async () => {
                      const response = await fetch("/api/objects/upload", {
                        method: "POST",
                        credentials: "include"
                      });
                      const data = await response.json();
                      if (!data.ok) throw new Error("Failed to get upload URL");
                      return { method: "PUT", url: data.data.uploadURL };
                    }}
                    onComplete={(result) => {
                      if (result.successful && result.successful.length > 0) {
                        const uploadedFile = result.successful[0];
                        const fileUrl = uploadedFile.uploadURL;
                        const fileName = uploadedFile.name;
                        const fileType = fileName.split('.').pop()?.toLowerCase() || 'other';
                        
                        // Determine asset type based on file extension
                        let assetType = 'other';
                        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileType)) {
                          assetType = 'image';
                        } else if (['mp4', 'avi', 'mov', 'wmv'].includes(fileType)) {
                          assetType = 'video';
                        } else if (['pdf', 'doc', 'docx', 'txt'].includes(fileType)) {
                          assetType = 'document';
                        } else if (['mp3', 'wav', 'ogg'].includes(fileType)) {
                          assetType = 'audio';
                        }
                        
                        setEditingAsset({
                          ...editingAsset,
                          masterAssetUrl: fileUrl,
                          masterAssetType: assetType
                        });
                        
                        toast({
                          title: "Success",
                          description: `File "${fileName}" uploaded successfully`
                        });
                      }
                    }}
                    buttonClassName="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File to Upload
                  </ObjectUploader>
                </div>
                
                {/* OR Divider */}
                <div className="flex items-center space-x-4">
                  <div className="flex-1 border-t"></div>
                  <span className="text-sm text-muted-foreground">OR</span>
                  <div className="flex-1 border-t"></div>
                </div>
                
                {/* URL Input Option */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editMasterAssetUrl">Master Asset URL</Label>
                    <Input
                      id="editMasterAssetUrl"
                      value={editingAsset.masterAssetUrl}
                      onChange={(e) => setEditingAsset({ ...editingAsset, masterAssetUrl: e.target.value })}
                      placeholder="https://example.com/asset.jpg"
                      data-testid="input-edit-master-asset-url"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editMasterAssetType">Asset Type</Label>
                    <Select
                      value={editingAsset.masterAssetType}
                      onValueChange={(value) => setEditingAsset({ ...editingAsset, masterAssetType: value })}
                    >
                      <SelectTrigger data-testid="select-edit-master-asset-type">
                        <SelectValue placeholder="Select asset type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="image">Image</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="audio">Audio</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editTemplateSvg">Template SVG</Label>
              <Textarea
                id="editTemplateSvg"
                value={editingAsset.templateSvg}
                onChange={(e) => setEditingAsset({ ...editingAsset, templateSvg: e.target.value })}
                rows={8}
                data-testid="input-edit-asset-svg"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editTemplateFonts">Template Fonts (JSON)</Label>
                <Textarea
                  id="editTemplateFonts"
                  value={editingAsset.templateFonts}
                  onChange={(e) => setEditingAsset({ ...editingAsset, templateFonts: e.target.value })}
                  rows={4}
                  data-testid="input-edit-template-fonts"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDefaultBindings">Default Bindings (JSON)</Label>
                <Textarea
                  id="editDefaultBindings"
                  value={editingAsset.defaultBindings}
                  onChange={(e) => setEditingAsset({ ...editingAsset, defaultBindings: e.target.value })}
                  rows={4}
                  data-testid="input-edit-default-bindings"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editStyleHints">Style Hints (JSON)</Label>
                <Textarea
                  id="editStyleHints"
                  value={editingAsset.styleHints}
                  onChange={(e) => setEditingAsset({ ...editingAsset, styleHints: e.target.value })}
                  rows={4}
                  data-testid="input-edit-style-hints"
                />
              </div>
            </div>

            <div className="flex space-x-2">
              <Button 
                type="submit" 
                disabled={editAssetMutation.isPending}
                data-testid="button-save-asset"
              >
                {editAssetMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setShowEditAssetDialog(false)}
                data-testid="button-cancel-edit-asset"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Variant Dialog */}
      <Dialog open={showCreateVariantDialog} onOpenChange={setShowCreateVariantDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Variant</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateVariant} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="variantAsset">Asset</Label>
              <Select value={newVariant.assetId} onValueChange={(value) => setNewVariant({ ...newVariant, assetId: value })}>
                <SelectTrigger data-testid="select-variant-asset">
                  <SelectValue placeholder="Select an asset" />
                </SelectTrigger>
                <SelectContent>
                  {assets.map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {asset.name} ({asset.project.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="variantSource">Source</Label>
              <Select value={newVariant.source} onValueChange={(value: "USER" | "AUTO") => setNewVariant({ ...newVariant, source: value })}>
                <SelectTrigger data-testid="select-variant-source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">Manual</SelectItem>
                  <SelectItem value="AUTO">AI Generated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="variantBindings">Bindings (JSON)</Label>
              <Textarea
                id="variantBindings"
                value={newVariant.bindings}
                onChange={(e) => setNewVariant({ ...newVariant, bindings: e.target.value })}
                rows={6}
                data-testid="input-variant-bindings"
              />
            </div>
            <div className="flex space-x-2">
              <Button 
                type="submit" 
                disabled={createVariantMutation.isPending || !newVariant.assetId}
                data-testid="button-create-variant"
              >
                {createVariantMutation.isPending ? "Creating..." : "Create Variant"}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setShowCreateVariantDialog(false)}
                data-testid="button-cancel-create-variant"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Variant Dialog */}
      <Dialog open={showEditVariantDialog} onOpenChange={setShowEditVariantDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Variant</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditVariant} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editVariantAsset">Asset</Label>
              <Select value={editingVariant.assetId} onValueChange={(value) => setEditingVariant({ ...editingVariant, assetId: value })}>
                <SelectTrigger data-testid="select-edit-variant-asset">
                  <SelectValue placeholder="Select an asset" />
                </SelectTrigger>
                <SelectContent>
                  {assets.map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {asset.name} ({asset.project.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editVariantSource">Source</Label>
              <Select value={editingVariant.source} onValueChange={(value: "USER" | "AUTO") => setEditingVariant({ ...editingVariant, source: value })}>
                <SelectTrigger data-testid="select-edit-variant-source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">Manual</SelectItem>
                  <SelectItem value="AUTO">AI Generated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editVariantBindings">Bindings (JSON)</Label>
              <Textarea
                id="editVariantBindings"
                value={editingVariant.bindings}
                onChange={(e) => setEditingVariant({ ...editingVariant, bindings: e.target.value })}
                rows={6}
                data-testid="input-edit-variant-bindings"
              />
            </div>
            <div className="flex space-x-2">
              <Button 
                type="submit" 
                disabled={editVariantMutation.isPending}
                data-testid="button-save-variant"
              >
                {editVariantMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setShowEditVariantDialog(false)}
                data-testid="button-cancel-edit-variant"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}