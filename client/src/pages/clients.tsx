import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Client, Project } from "@/types";
import { apiPost, apiDelete } from "@/lib/api";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit, Users, Plus, FolderPlus, Archive, ArchiveRestore } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Clients() {
  const [showCreateClientDialog, setShowCreateClientDialog] = useState(false);
  const [showCreateProjectDialog, setShowCreateProjectDialog] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [newClient, setNewClient] = useState({ name: "", description: "" });
  const [newProject, setNewProject] = useState({ name: "", description: "", clientId: "" });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: clients = [], isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const createClientMutation = useMutation({
    mutationFn: (client: { name: string; description: string }) => 
      apiPost<Client>("/api/clients", client),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setShowCreateClientDialog(false);
      setNewClient({ name: "", description: "" });
      toast({
        title: "Success",
        description: "Client created successfully",
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

  const createProjectMutation = useMutation({
    mutationFn: (project: { name: string; description: string; clientId: string }) => 
      apiPost<Project>("/api/projects", project),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
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

  const deleteClientMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/clients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Success",
        description: "Client deleted successfully",
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

  const archiveProjectMutation = useMutation({
    mutationFn: (id: string) => apiPost(`/api/projects/${id}/archive`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Success",
        description: "Project archived successfully",
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

  const unarchiveProjectMutation = useMutation({
    mutationFn: (id: string) => apiPost(`/api/projects/${id}/unarchive`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Success",
        description: "Project unarchived successfully",
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

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    createClientMutation.mutate(newClient);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    createProjectMutation.mutate(newProject);
  };

  const handleDeleteClient = (id: string) => {
    if (confirm("Are you sure you want to delete this client?")) {
      deleteClientMutation.mutate(id);
    }
  };

  const handleArchiveProject = (id: string) => {
    archiveProjectMutation.mutate(id);
  };

  const handleUnarchiveProject = (id: string) => {
    unarchiveProjectMutation.mutate(id);
  };

  const getProjectsForClient = (clientId: string) => {
    return projects.filter(project => project.clientId === clientId);
  };

  const getActiveProjectsForClient = (clientId: string) => {
    return projects.filter(project => project.clientId === clientId && !project.archived);
  };

  const openCreateProjectDialog = (clientId: string) => {
    setSelectedClientId(clientId);
    setNewProject({ ...newProject, clientId });
    setShowCreateProjectDialog(true);
  };

  if (clientsLoading || projectsLoading) {
    return (
      <>
        <Header 
          title="Clients"
          description="Manage your client accounts"
          onCreateNew={() => setShowCreateClientDialog(true)}
          createLabel="New Client"
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
        title="Clients"
        description="Manage your client accounts"
        onCreateNew={() => setShowCreateClientDialog(true)}
        createLabel="New Client"
      />
      
      <div className="flex-1 overflow-auto p-6">
        {clients.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No clients yet</h3>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first client account.
            </p>
            <Button onClick={() => setShowCreateClientDialog(true)} data-testid="button-create-first-client">
              Create First Client
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client) => {
              const clientProjects = getProjectsForClient(client.id);
              const activeProjects = getActiveProjectsForClient(client.id);
              
              return (
                <Card key={client.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1" data-testid={`text-client-name-${client.id}`}>
                          {client.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Created {formatDistanceToNow(new Date(client.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" data-testid={`button-edit-${client.id}`}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteClient(client.id)}
                          data-testid={`button-delete-${client.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {client.description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {client.description}
                      </p>
                    )}
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm text-muted-foreground">
                        <span>{activeProjects.length} active project{activeProjects.length !== 1 ? 's' : ''}</span>
                        {clientProjects.length > activeProjects.length && (
                          <span className="ml-2">
                            ({clientProjects.length - activeProjects.length} archived)
                          </span>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => openCreateProjectDialog(client.id)}
                        data-testid={`button-create-project-${client.id}`}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Create Project
                      </Button>
                    </div>

                    {clientProjects.length > 0 && (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {clientProjects.map((project) => (
                          <div 
                            key={project.id} 
                            className={`flex items-center justify-between p-2 rounded-md border ${
                              project.archived ? 'bg-muted/50 opacity-60' : 'bg-background'
                            }`}
                            data-testid={`project-card-${project.id}`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {project.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
                                {project.archived && " (Archived)"}
                              </p>
                            </div>
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => project.archived ? handleUnarchiveProject(project.id) : handleArchiveProject(project.id)}
                                data-testid={`button-${project.archived ? 'unarchive' : 'archive'}-${project.id}`}
                              >
                                {project.archived ? (
                                  <ArchiveRestore className="w-3 h-3" />
                                ) : (
                                  <Archive className="w-3 h-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {clientProjects.length === 0 && (
                      <div className="text-center py-4">
                        <FolderPlus className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No projects yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Client Dialog */}
      <Dialog open={showCreateClientDialog} onOpenChange={setShowCreateClientDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Client</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateClient} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Client Name</Label>
              <Input
                id="name"
                value={newClient.name}
                onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                required
                data-testid="input-client-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={newClient.description}
                onChange={(e) => setNewClient({ ...newClient, description: e.target.value })}
                data-testid="input-client-description"
              />
            </div>
            <div className="flex space-x-2">
              <Button 
                type="submit" 
                disabled={createClientMutation.isPending}
                data-testid="button-create-client"
              >
                {createClientMutation.isPending ? "Creating..." : "Create Client"}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setShowCreateClientDialog(false)}
                data-testid="button-cancel-create"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Project Dialog */}
      <Dialog open={showCreateProjectDialog} onOpenChange={setShowCreateProjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Select value={newProject.clientId} onValueChange={(value) => setNewProject({ ...newProject, clientId: value })}>
                <SelectTrigger data-testid="select-project-client">
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
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                required
                data-testid="input-project-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectDescription">Description (optional)</Label>
              <Textarea
                id="projectDescription"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                data-testid="input-project-description"
              />
            </div>
            <div className="flex space-x-2">
              <Button 
                type="submit" 
                disabled={createProjectMutation.isPending || !newProject.clientId}
                data-testid="button-create-project"
              >
                {createProjectMutation.isPending ? "Creating..." : "Create Project"}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setShowCreateProjectDialog(false)}
                data-testid="button-cancel-create-project"
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