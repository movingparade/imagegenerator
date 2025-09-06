import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Project, Client, Asset } from "@/types";
import { apiPost, apiDelete } from "@/lib/api";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit, FolderOpen, Building, Plus, FileText, Image } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Projects() {
  const [showCreateProjectDialog, setShowCreateProjectDialog] = useState(false);
  const [showCreateAssetDialog, setShowCreateAssetDialog] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [newProject, setNewProject] = useState({ 
    name: "", 
    description: "", 
    clientId: "" 
  });
  const [newAsset, setNewAsset] = useState({ 
    name: "", 
    templateSvg: "", 
    projectId: "" 
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: assets = [], isLoading: assetsLoading } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  });

  const createProjectMutation = useMutation({
    mutationFn: (project: { name: string; description: string; clientId: string }) => 
      apiPost<Project>("/api/projects", project),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setShowCreateProjectDialog(false);
      setNewProject({ name: "", description: "", clientId: "" });
      toast({
        title: "Success",
        description: "Project created successfully",
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

  const createAssetMutation = useMutation({
    mutationFn: (asset: { name: string; templateSvg: string; projectId: string }) => 
      apiPost<Asset>("/api/assets", {
        ...asset,
        templateFonts: {},
        defaultBindings: {},
        styleHints: {}
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setShowCreateAssetDialog(false);
      setNewAsset({ name: "", templateSvg: "", projectId: "" });
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

  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Project deleted successfully",
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

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.clientId) {
      toast({
        title: "Error",
        description: "Please select a client",
        variant: "destructive",
      });
      return;
    }
    createProjectMutation.mutate(newProject);
  };

  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    createAssetMutation.mutate(newAsset);
  };

  const handleDeleteProject = (id: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      deleteProjectMutation.mutate(id);
    }
  };

  const getAssetsForProject = (projectId: string) => {
    return assets.filter(asset => asset.projectId === projectId);
  };

  const openCreateAssetDialog = (projectId: string) => {
    setSelectedProjectId(projectId);
    setNewAsset({ ...newAsset, projectId });
    setShowCreateAssetDialog(true);
  };

  if (projectsLoading || assetsLoading) {
    return (
      <>
        <Header 
          title="Projects"
          description="Manage your campaign projects"
          onCreateNew={() => setShowCreateProjectDialog(true)}
          createLabel="New Project"
        />
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header 
        title="Projects"
        description="Manage your campaign projects"
        onCreateNew={() => setShowCreateProjectDialog(true)}
        createLabel="New Project"
      />
      
      <div className="flex-1 overflow-auto p-6">
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first campaign project.
            </p>
            <Button onClick={() => setShowCreateProjectDialog(true)} data-testid="button-create-first-project">
              Create First Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const projectAssets = getAssetsForProject(project.id);
              
              return (
                <Card key={project.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1" data-testid={`text-project-name-${project.id}`}>
                          {project.name}
                          {project.archived && <span className="text-muted-foreground text-sm ml-2">(Archived)</span>}
                        </CardTitle>
                        <div className="flex items-center text-sm text-muted-foreground mb-2">
                          <Building className="w-4 h-4 mr-1" />
                          {project.client.name}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Created {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" data-testid={`button-edit-${project.id}`}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteProject(project.id)}
                          data-testid={`button-delete-${project.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {project.description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {project.description}
                      </p>
                    )}
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm text-muted-foreground">
                        <span>{projectAssets.length} asset{projectAssets.length !== 1 ? 's' : ''}</span>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => openCreateAssetDialog(project.id)}
                        data-testid={`button-create-asset-${project.id}`}
                        disabled={!!project.archived}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Create Asset
                      </Button>
                    </div>

                    {projectAssets.length > 0 && (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {projectAssets.map((asset) => (
                          <div 
                            key={asset.id} 
                            className="flex items-center justify-between p-2 rounded-md border bg-background"
                            data-testid={`asset-card-${asset.id}`}
                          >
                            <div className="flex items-center flex-1 min-w-0">
                              <FileText className="w-4 h-4 mr-2 text-muted-foreground flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {asset.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(asset.createdAt), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                data-testid={`button-edit-asset-${asset.id}`}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {projectAssets.length === 0 && (
                      <div className="text-center py-4">
                        <Image className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No assets yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Project Dialog */}
      <Dialog open={showCreateProjectDialog} onOpenChange={setShowCreateProjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Select
                value={newProject.clientId}
                onValueChange={(value) => setNewProject({ ...newProject, clientId: value })}
              >
                <SelectTrigger data-testid="select-client">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                required
                data-testid="input-project-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                data-testid="input-project-description"
              />
            </div>
            <div className="flex space-x-2">
              <Button 
                type="submit" 
                disabled={createProjectMutation.isPending}
                data-testid="button-create-project"
              >
                {createProjectMutation.isPending ? "Creating..." : "Create Project"}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setShowCreateProjectDialog(false)}
                data-testid="button-cancel-create"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Asset Dialog */}
      <Dialog open={showCreateAssetDialog} onOpenChange={setShowCreateAssetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Asset</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateAsset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select value={newAsset.projectId} onValueChange={(value) => setNewAsset({ ...newAsset, projectId: value })}>
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
            <div className="space-y-2">
              <Label htmlFor="templateSvg">Template SVG</Label>
              <Textarea
                id="templateSvg"
                value={newAsset.templateSvg}
                onChange={(e) => setNewAsset({ ...newAsset, templateSvg: e.target.value })}
                placeholder="<svg>...</svg>"
                required
                data-testid="input-asset-svg"
              />
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
    </>
  );
}