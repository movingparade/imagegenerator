import { useQuery } from "@tanstack/react-query";
import { DashboardStats } from "@/types";
import Header from "@/components/layout/header";
import StatsCards from "@/components/dashboard/stats-cards";
import RecentProjects from "@/components/dashboard/recent-projects";
import QuickActions from "@/components/dashboard/quick-actions";
import RecentVariants from "@/components/dashboard/recent-variants";

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("Export functionality not yet implemented");
  };

  return (
    <>
      <Header 
        title="Dashboard"
        description="Overview of your ad variants and projects"
        onExport={handleExport}
      />
      
      <div className="flex-1 overflow-auto p-6">
        {/* Stats Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : stats ? (
          <StatsCards stats={stats} />
        ) : null}

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <RecentProjects />
          <QuickActions />
        </div>

        {/* Recent Variants Preview */}
        <RecentVariants />
      </div>
    </>
  );
}
