import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FolderOpen, Image, Zap, FileText } from "lucide-react";
import CreateModal from "@/components/modals/create-modal";

export default function QuickActions() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const actions = [
    {
      name: "New Client",
      description: "Add a new client account",
      icon: Plus,
      bgColor: "bg-primary/10",
      iconColor: "text-primary",
      action: () => setShowCreateModal(true),
    },
    {
      name: "New Project",
      description: "Start a new campaign",
      icon: FolderOpen,
      bgColor: "bg-chart-2/10",
      iconColor: "text-chart-2",
      action: () => setShowCreateModal(true),
    },
    {
      name: "New Template",
      description: "Create SVG template",
      icon: Image,
      bgColor: "bg-chart-3/10",
      iconColor: "text-chart-3",
      action: () => setShowCreateModal(true),
    },
  ];

  const tools = [
    {
      name: "Text Generation",
      description: "Auto-generate copy variants",
      icon: Zap,
      bgFrom: "from-primary/10",
      bgTo: "to-chart-2/10",
      btnColor: "bg-primary",
      btnText: "text-primary-foreground",
      btnHover: "hover:bg-primary/90",
    },
    {
      name: "Image Generation",
      description: "Gemini-powered backgrounds",
      icon: FileText,
      bgFrom: "from-chart-2/10",
      bgTo: "to-chart-4/10",
      btnColor: "bg-chart-2",
      btnText: "text-white",
      btnHover: "hover:bg-chart-2/90",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card className="bg-card border border-border">
        <CardHeader className="border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {actions.map((action) => (
            <Button
              key={action.name}
              variant="outline"
              className="w-full justify-start space-x-3 p-4 h-auto"
              onClick={action.action}
              data-testid={`button-${action.name.toLowerCase().replace(" ", "-")}`}
            >
              <div className={`w-8 h-8 ${action.bgColor} rounded-lg flex items-center justify-center`}>
                <action.icon className={`w-4 h-4 ${action.iconColor}`} />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">{action.name}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* AI Tools */}
      <Card className="bg-card border border-border">
        <CardHeader className="border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">AI Tools</h3>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {tools.map((tool) => (
            <div
              key={tool.name}
              className={`flex items-center justify-between p-4 bg-gradient-to-r ${tool.bgFrom} ${tool.bgTo} rounded-lg`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 ${tool.btnColor} rounded-lg flex items-center justify-center`}>
                  <tool.icon className={`w-4 h-4 ${tool.btnText}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{tool.name}</p>
                  <p className="text-xs text-muted-foreground">{tool.description}</p>
                </div>
              </div>
              <Button
                size="sm"
                className={`${tool.btnColor} ${tool.btnText} ${tool.btnHover} transition-colors`}
                data-testid={`button-${tool.name.toLowerCase().replace(" ", "-")}`}
              >
                Generate
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <CreateModal 
        open={showCreateModal} 
        onOpenChange={setShowCreateModal} 
      />
    </div>
  );
}
