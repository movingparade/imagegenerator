import { useQuery } from "@tanstack/react-query";
import { Project } from "@/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export default function RecentProjects() {
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const recentProjects = projects.slice(0, 3);

  if (isLoading) {
    return (
      <Card className="lg:col-span-2 bg-card border border-border">
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Recent Projects</h3>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2 bg-card border border-border">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Recent Projects</h3>
          <Link href="/projects">
            <a className="text-sm text-primary hover:text-primary/80" data-testid="link-view-all-projects">
              View all
            </a>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {recentProjects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No projects yet</p>
              <Link href="/projects">
                <a className="text-primary hover:text-primary/80">Create your first project</a>
              </Link>
            </div>
          ) : (
            recentProjects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <a className="flex items-center space-x-4 p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer" data-testid={`project-${project.id}`}>
                  <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
                    <div className="w-8 h-8 bg-primary/20 rounded object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-foreground truncate" data-testid={`text-project-name-${project.id}`}>
                      {project.name}
                    </h4>
                    <p className="text-xs text-muted-foreground" data-testid={`text-client-name-${project.id}`}>
                      {project.client.name}
                    </p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-muted-foreground">No assets yet</span>
                      <span className="text-xs text-muted-foreground">No variants yet</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
                    </p>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  </div>
                </a>
              </Link>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
