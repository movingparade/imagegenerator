import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Variant, Asset } from "@/types";
import { apiPost, apiDelete } from "@/lib/api";
import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit, Lightbulb, Zap, User, Download } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Variants() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [newVariant, setNewVariant] = useState({ 
    assetId: "",
    bindings: JSON.stringify({
      headline: "",
      subheadline: "",
      cta: "",
      imageUrl: ""
    })
  });
  const [generateRequest, setGenerateRequest] = useState({
    assetId: "",
    generateText: true,
    generateImages: true,
    textCount: 3,
    imageCount: 1,
    constraints: JSON.stringify({
      tone: "conversational",
      headlineMaxWords: 8,
      subheadlineMaxChars: 100
    })
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: variants = [], isLoading } = useQuery<Variant[]>({
    queryKey: ["/api/variants"],
  });

  const { data: assets = [] } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  });

  const createMutation = useMutation({
    mutationFn: (variant: typeof newVariant) => 
      apiPost<Variant>("/api/variants", {
        ...variant,
        bindings: JSON.parse(variant.bindings),
        renderSvg: assets.find(a => a.id === variant.assetId)?.templateSvg || "",
        source: "USER",
        status: "DRAFT",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/variants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setShowCreateDialog(false);
      setNewVariant({ 
        assetId: "",
        bindings: JSON.stringify({
          headline: "",
          subheadline: "",
          cta: "",
          imageUrl: ""
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

  const generateMutation = useMutation({
    mutationFn: (request: typeof generateRequest) => 
      apiPost("/api/variants/generate", {
        ...request,
        constraints: JSON.parse(request.constraints),
      }),
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/variants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setShowGenerateDialog(false);
      toast({
        title: "Success",
        description: `Generated ${result.variants.length} variants${result.errors.length > 0 ? ` with ${result.errors.length} errors` : ''}`,
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

  const deleteMutation = useMutation({
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

  const handleCreate = (e: React.FormEvent) => {
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

    createMutation.mutate(newVariant);
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!generateRequest.assetId) {
      toast({
        title: "Error",
        description: "Please select an asset",
        variant: "destructive",
      });
      return;
    }

    try {
      JSON.parse(generateRequest.constraints);
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid JSON in constraints",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate(generateRequest);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this variant?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleExport = () => {
    toast({
      title: "Export",
      description: "Export functionality not yet implemented",
    });
  };

  if (isLoading) {
    return (
      <>
        <Header 
          title="Variants"
          description="Manage your ad variants"
          onCreateNew={() => setShowCreateDialog(true)}
          onExport={handleExport}
          createLabel="New Variant"
        />
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header 
        title="Variants"
        description="Manage your ad variants"
        onCreateNew={() => setShowCreateDialog(true)}
        onExport={handleExport}
        createLabel="New Variant"
      />
      
      <div className="flex-1 overflow-auto p-6">
        {/* Generate Actions */}
        <div className="mb-6">
          <Button
            onClick={() => setShowGenerateDialog(true)}
            className="bg-gradient-to-r from-primary to-chart-2 text-primary-foreground hover:from-primary/90 hover:to-chart-2/90"
            data-testid="button-auto-generate"
          >
            <Zap className="w-4 h-4 mr-2" />
            Auto Generate Variants
          </Button>
        </div>

        {variants.length === 0 ? (
          <div className="text-center py-12">
            <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No variants yet</h3>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first ad variant.
            </p>
            <div className="space-x-2">
              <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-first-variant">
                Create Variant
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowGenerateDialog(true)}
                data-testid="button-generate-first-variant"
              >
                Auto Generate
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {variants.map((variant) => (
              <Card key={variant.id} className="hover:shadow-lg transition-shadow group">
                <CardContent className="p-0">
                  <div className="aspect-video bg-muted flex items-center justify-center border-b relative overflow-hidden">
                    {variant.renderPngUrl ? (
                      <img 
                        src={variant.renderPngUrl} 
                        alt="Variant preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center scale-50"
                        dangerouslySetInnerHTML={{ 
                          __html: variant.renderSvg.replace(/\{\{headline\}\}/g, (variant.bindings as any)?.headline || 'Headline')
                            .replace(/\{\{subheadline\}\}/g, (variant.bindings as any)?.subheadline || 'Subheadline')
                            .replace(/\{\{cta\}\}/g, (variant.bindings as any)?.cta || 'CTA')
                        }}
                      />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Badge 
                        variant={variant.status === "READY" ? "default" : variant.status === "ERROR" ? "destructive" : "secondary"}
                        className={
                          variant.status === "READY" 
                            ? "bg-green-100 text-green-800" 
                            : variant.status === "ERROR"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {variant.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold mb-1 line-clamp-1" data-testid={`text-variant-headline-${variant.id}`}>
                          {(variant.bindings as any)?.headline || "Untitled Variant"}
                        </h3>
                        <p className="text-xs text-muted-foreground mb-1">
                          {variant.asset.project.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(variant.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm" data-testid={`button-edit-${variant.id}`}>
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(variant.id)}
                          data-testid={`button-delete-${variant.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Badge 
                        variant={variant.source === "AUTO" ? "default" : "secondary"}
                        className={
                          variant.source === "AUTO" 
                            ? "bg-primary/10 text-primary text-xs" 
                            : "bg-secondary text-secondary-foreground text-xs"
                        }
                      >
                        {variant.source === "AUTO" ? <Zap className="w-3 h-3 mr-1" /> : <User className="w-3 h-3 mr-1" />}
                        {variant.source}
                      </Badge>
                      {variant.status === "READY" && (
                        <Button variant="ghost" size="sm" data-testid={`button-download-${variant.id}`}>
                          <Download className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Variant Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Variant</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="asset">Asset Template</Label>
              <Select
                value={newVariant.assetId}
                onValueChange={(value) => setNewVariant({ ...newVariant, assetId: value })}
              >
                <SelectTrigger data-testid="select-asset">
                  <SelectValue placeholder="Select an asset" />
                </SelectTrigger>
                <SelectContent>
                  {assets.map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {asset.name} - {asset.project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bindings">Content Bindings (JSON)</Label>
              <Textarea
                id="bindings"
                value={newVariant.bindings}
                onChange={(e) => setNewVariant({ ...newVariant, bindings: e.target.value })}
                rows={6}
                className="font-mono text-sm"
                data-testid="input-bindings"
              />
              <p className="text-xs text-muted-foreground">
                Include headline, subheadline, cta, and imageUrl properties
              </p>
            </div>
            <div className="flex space-x-2">
              <Button 
                type="submit" 
                disabled={createMutation.isPending}
                data-testid="button-create-variant"
              >
                {createMutation.isPending ? "Creating..." : "Create Variant"}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                data-testid="button-cancel-create"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Generate Variants Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Auto Generate Variants</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="generateAsset">Asset Template</Label>
              <Select
                value={generateRequest.assetId}
                onValueChange={(value) => setGenerateRequest({ ...generateRequest, assetId: value })}
              >
                <SelectTrigger data-testid="select-generate-asset">
                  <SelectValue placeholder="Select an asset" />
                </SelectTrigger>
                <SelectContent>
                  {assets.map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {asset.name} - {asset.project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="textCount">Text Variants</Label>
                <Input
                  id="textCount"
                  type="number"
                  min="1"
                  max="10"
                  value={generateRequest.textCount}
                  onChange={(e) => setGenerateRequest({ ...generateRequest, textCount: parseInt(e.target.value) })}
                  data-testid="input-text-count"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imageCount">Image Variants</Label>
                <Input
                  id="imageCount"
                  type="number"
                  min="1"
                  max="5"
                  value={generateRequest.imageCount}
                  onChange={(e) => setGenerateRequest({ ...generateRequest, imageCount: parseInt(e.target.value) })}
                  data-testid="input-image-count"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="constraints">Generation Constraints (JSON)</Label>
              <Textarea
                id="constraints"
                value={generateRequest.constraints}
                onChange={(e) => setGenerateRequest({ ...generateRequest, constraints: e.target.value })}
                rows={4}
                className="font-mono text-sm"
                data-testid="input-constraints"
              />
              <p className="text-xs text-muted-foreground">
                Configure tone, length limits, and style preferences
              </p>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                type="submit" 
                disabled={generateMutation.isPending}
                data-testid="button-generate-variants"
                className="bg-gradient-to-r from-primary to-chart-2"
              >
                {generateMutation.isPending ? "Generating..." : "Generate Variants"}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setShowGenerateDialog(false)}
                data-testid="button-cancel-generate"
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
