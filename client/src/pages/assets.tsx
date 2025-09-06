import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Asset, Project } from "@/types";
import { apiPost, apiDelete } from "@/lib/api";
import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit, Image, FolderOpen, Code } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Assets() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
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
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: assets = [], isLoading } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const createMutation = useMutation({
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
      setShowCreateDialog(false);
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

  const deleteMutation = useMutation({
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

  const handleCreate = (e: React.FormEvent) => {
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

    createMutation.mutate(newAsset);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this asset?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <>
        <Header 
          title="Assets"
          description="Manage your template assets"
          onCreateNew={() => setShowCreateDialog(true)}
          createLabel="New Asset"
        />
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
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
        title="Assets"
        description="Manage your template assets"
        onCreateNew={() => setShowCreateDialog(true)}
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
            <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-first-asset">
              Create First Asset
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.map((asset) => (
              <Card key={asset.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="aspect-video bg-muted flex items-center justify-center border-b">
                    <div 
                      className="w-full h-full flex items-center justify-center"
                      dangerouslySetInnerHTML={{ __html: asset.templateSvg }}
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-1" data-testid={`text-asset-name-${asset.id}`}>
                          {asset.name}
                        </h3>
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
                          onClick={() => handleDelete(asset.id)}
                          data-testid={`button-delete-${asset.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <span>0 variants</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Asset</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
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
                  {projects.map((project) => (
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
                disabled={createMutation.isPending}
                data-testid="button-create-asset"
              >
                {createMutation.isPending ? "Creating..." : "Create Asset"}
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
    </>
  );
}
