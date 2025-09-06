import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Asset, Project, Variant } from "@/types";
import { apiPost, apiDelete } from "@/lib/api";
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
import { Trash2, Edit, Image, FolderOpen, Code, Plus, Sparkles, User, Bot, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Assets() {
  const [showCreateAssetDialog, setShowCreateAssetDialog] = useState(false);
  const [showCreateVariantDialog, setShowCreateVariantDialog] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string>("");
  const [newAsset, setNewAsset] = useState({ 
    name: "", 
    projectId: "",
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
      setNewAsset({ 
        name: "", 
        projectId: "",
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

  const createVariantMutation = useMutation({
    mutationFn: (variant: typeof newVariant) => 
      apiPost<Variant>("/api/variants", {
        ...variant,
        bindings: JSON.parse(variant.bindings),
        renderSvg: "", // Will be generated by the backend
        status: "DRAFT"
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/variants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setShowCreateVariantDialog(false);
      setNewVariant({
        assetId: "",
        source: "USER" as "USER" | "AUTO",
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

    try {
      JSON.parse(newAsset.templateFonts);
      JSON.parse(newAsset.defaultBindings);
      JSON.parse(newAsset.styleHints);
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid JSON in configuration fields",
        variant: "destructive",
      });
      return;
    }

    createAssetMutation.mutate(newAsset);
  };

  const handleCreateVariant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVariant.assetId) {
      toast({
        title: "Error",
        description: "Please select an asset",
        variant: "destructive",
      });
      return;
    }

    try {
      JSON.parse(newVariant.bindings);
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid JSON in bindings",
        variant: "destructive",
      });
      return;
    }

    createVariantMutation.mutate(newVariant);
  };

  const handleDeleteAsset = (id: string) => {
    if (confirm("Are you sure you want to delete this asset?")) {
      deleteAssetMutation.mutate(id);
    }
  };

  const getVariantsForAsset = (assetId: string) => {
    return variants.filter(variant => variant.assetId === assetId);
  };

  const openCreateVariantDialog = (assetId: string) => {
    setSelectedAssetId(assetId);
    setNewVariant({ ...newVariant, assetId });
    setShowCreateVariantDialog(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "READY":
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case "ERROR":
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      case "DRAFT":
      default:
        return <Clock className="w-3 h-3 text-yellow-500" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "READY":
        return "default";
      case "ERROR":
        return "destructive";
      case "DRAFT":
      default:
        return "secondary";
    }
  };

  if (assetsLoading || variantsLoading) {
    return (
      <>
        <Header 
          title="Assets"
          description="Manage your template assets"
          onCreateNew={() => setShowCreateAssetDialog(true)}
          createLabel="New Asset"
        />
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        description="Manage your template assets"
        onCreateNew={() => setShowCreateAssetDialog(true)}
        createLabel="New Asset"
      />
      
      <div className="flex-1 overflow-auto p-6">
        {assets.length === 0 ? (
          <div className="text-center py-12">
            <Image className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No assets yet</h3>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first template asset.
            </p>
            <Button onClick={() => setShowCreateAssetDialog(true)} data-testid="button-create-first-asset">
              Create First Asset
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.map((asset) => {
              const assetVariants = getVariantsForAsset(asset.id);
              
              return (
                <Card key={asset.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="p-0">
                    <div className="aspect-video bg-muted flex items-center justify-center border-b">
                      <div 
                        className="w-full h-full flex items-center justify-center"
                        dangerouslySetInnerHTML={{ __html: asset.templateSvg }}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1" data-testid={`text-asset-name-${asset.id}`}>
                          {asset.name}
                        </CardTitle>
                        <div className="flex items-center text-sm text-muted-foreground mb-2">
                          <FolderOpen className="w-4 h-4 mr-1" />
                          {asset.project.name}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Created {formatDistanceToNow(new Date(asset.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" data-testid={`button-edit-${asset.id}`}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteAsset(asset.id)}
                          data-testid={`button-delete-${asset.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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

                    {assetVariants.length > 0 && (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {assetVariants.map((variant) => (
                          <div 
                            key={variant.id} 
                            className="flex items-center justify-between p-2 rounded-md border bg-background"
                            data-testid={`variant-card-${variant.id}`}
                          >
                            <div className="flex items-center flex-1 min-w-0">
                              <div className="flex items-center mr-2">
                                {variant.source === "AUTO" ? (
                                  <Bot className="w-4 h-4 text-blue-500" />
                                ) : (
                                  <User className="w-4 h-4 text-gray-500" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <Badge variant={getStatusVariant(variant.status)} className="text-xs">
                                    <div className="flex items-center space-x-1">
                                      {getStatusIcon(variant.status)}
                                      <span>{variant.status}</span>
                                    </div>
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {variant.source}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDistanceToNow(new Date(variant.createdAt), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                data-testid={`button-edit-variant-${variant.id}`}
                              >
                                <Edit className="w-3 h-3" />
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Asset</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateAsset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select
                value={newAsset.projectId}
                onValueChange={(value) => setNewAsset({ ...newAsset, projectId: value })}
              >
                <SelectTrigger data-testid="select-project">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.filter(p => !p.archived).map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name} - {project.client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Asset Name</Label>
              <Input
                id="name"
                value={newAsset.name}
                onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                required
                data-testid="input-asset-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="templateSvg">SVG Template</Label>
              <Textarea
                id="templateSvg"
                value={newAsset.templateSvg}
                onChange={(e) => setNewAsset({ ...newAsset, templateSvg: e.target.value })}
                rows={8}
                className="font-mono text-sm"
                data-testid="input-template-svg"
              />
              <p className="text-xs text-muted-foreground">
                Use {`{{headline}}`}, {`{{subheadline}}`}, {`{{cta}}`}, {`{{image}}`} as placeholders
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="templateFonts">Template Fonts (JSON)</Label>
                <Textarea
                  id="templateFonts"
                  value={newAsset.templateFonts}
                  onChange={(e) => setNewAsset({ ...newAsset, templateFonts: e.target.value })}
                  rows={4}
                  className="font-mono text-sm"
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
                  className="font-mono text-sm"
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
                  className="font-mono text-sm"
                  data-testid="input-style-hints"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <Button 
                type="submit" 
                disabled={createAssetMutation.isPending}
                data-testid="button-create-asset"
              >
                {createAssetMutation.isPending ? "Creating..." : "Create Asset"}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setShowCreateAssetDialog(false)}
                data-testid="button-cancel-create"
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
              <Label htmlFor="asset">Asset</Label>
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
              <Label htmlFor="source">Source</Label>
              <Select value={newVariant.source} onValueChange={(value: "USER" | "AUTO") => setNewVariant({ ...newVariant, source: value })}>
                <SelectTrigger data-testid="select-variant-source">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>Manual (USER)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="AUTO">
                    <div className="flex items-center space-x-2">
                      <Bot className="w-4 h-4" />
                      <span>AI Generated (AUTO)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bindings">Bindings (JSON)</Label>
              <Textarea
                id="bindings"
                value={newVariant.bindings}
                onChange={(e) => setNewVariant({ ...newVariant, bindings: e.target.value })}
                rows={6}
                className="font-mono text-sm"
                data-testid="input-variant-bindings"
                placeholder='{"headline": "Your Headline", "subheadline": "Your subheadline", "cta": "Click Here"}'
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
    </>
  );
}