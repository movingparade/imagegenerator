import { DashboardStats } from "@/types";
import { Users, FolderOpen, Image, Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardsProps {
  stats: DashboardStats;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Clients",
      value: stats.totalClients,
      icon: Users,
      bgColor: "bg-primary/10",
      iconColor: "text-primary",
      growth: "+2.5%",
    },
    {
      title: "Active Projects", 
      value: stats.activeProjects,
      icon: FolderOpen,
      bgColor: "bg-chart-2/10",
      iconColor: "text-chart-2",
      growth: "+12.3%",
    },
    {
      title: "Template Assets",
      value: stats.templateAssets,
      icon: Image,
      bgColor: "bg-chart-3/10", 
      iconColor: "text-chart-3",
      growth: "+8.1%",
    },
    {
      title: "Generated Variants",
      value: stats.generatedVariants,
      icon: Lightbulb,
      bgColor: "bg-chart-4/10",
      iconColor: "text-chart-4", 
      growth: "+24.7%",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card) => (
        <Card key={card.title} className="bg-card border border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-foreground" data-testid={`stat-${card.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  {card.value.toLocaleString()}
                </p>
              </div>
              <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                <card.icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-green-600">{card.growth}</span> from last month
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
