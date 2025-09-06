import { useQuery } from "@tanstack/react-query";
import { Variant } from "@/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export default function RecentVariants() {
  const { data: variants = [], isLoading } = useQuery<Variant[]>({
    queryKey: ["/api/variants"],
  });

  const recentVariants = variants.slice(0, 4);

  if (isLoading) {
    return (
      <Card className="bg-card border border-border">
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Recent Variants</h3>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border border-border rounded-lg overflow-hidden">
                <div className="aspect-video bg-muted animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded" />
                  <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border border-border">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Recent Variants</h3>
          <Link href="/variants">
            <a className="text-sm text-primary hover:text-primary/80" data-testid="link-view-all-variants">
              View all variants
            </a>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentVariants.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-muted-foreground">No variants yet</p>
              <Link href="/variants">
                <a className="text-primary hover:text-primary/80">Create your first variant</a>
              </Link>
            </div>
          ) : (
            recentVariants.map((variant) => (
              <Link key={variant.id} href={`/variants/${variant.id}`}>
                <a className="group border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer" data-testid={`variant-${variant.id}`}>
                  <div className="aspect-video bg-muted flex items-center justify-center relative overflow-hidden">
                    {variant.renderPngUrl ? (
                      <img 
                        src={variant.renderPngUrl} 
                        alt="Variant preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-muted-foreground text-sm">No preview</div>
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
                    <h4 className="text-sm font-medium text-foreground truncate" data-testid={`text-variant-name-${variant.id}`}>
                      {(variant.bindings as any)?.headline || "Untitled Variant"}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1" data-testid={`text-project-name-${variant.id}`}>
                      {variant.asset.project.name}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(variant.createdAt), { addSuffix: true })}
                      </span>
                      <Badge 
                        variant={variant.source === "AUTO" ? "default" : "secondary"}
                        className={
                          variant.source === "AUTO" 
                            ? "bg-primary/10 text-primary" 
                            : "bg-secondary text-secondary-foreground"
                        }
                      >
                        {variant.source}
                      </Badge>
                    </div>
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
