import { Button } from "@/components/ui/button";
import { Download, Plus } from "lucide-react";

interface HeaderProps {
  title: string;
  description: string;
  onCreateNew?: () => void;
  onExport?: () => void;
  createLabel?: string;
}

export default function Header({ 
  title, 
  description, 
  onCreateNew, 
  onExport,
  createLabel = "Create New"
}: HeaderProps) {
  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground" data-testid="page-title">
            {title}
          </h2>
          <p className="text-muted-foreground" data-testid="page-description">
            {description}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {onExport && (
            <Button 
              variant="outline"
              onClick={onExport}
              data-testid="button-export"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          )}
          {onCreateNew && (
            <Button 
              onClick={onCreateNew}
              data-testid="button-create-new"
            >
              <Plus className="w-4 h-4 mr-2" />
              {createLabel}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
