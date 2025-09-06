import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Users, FolderOpen, Image, Lightbulb } from "lucide-react";
import { useLocation } from "wouter";

interface CreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateModal({ open, onOpenChange }: CreateModalProps) {
  const [, setLocation] = useLocation();

  const options = [
    {
      name: "New Client",
      description: "Add a new client to the system",
      icon: Users,
      action: () => {
        setLocation("/clients");
        onOpenChange(false);
      },
    },
    {
      name: "New Project",
      description: "Start a new campaign project",
      icon: FolderOpen,
      action: () => {
        setLocation("/projects");
        onOpenChange(false);
      },
    },
    {
      name: "New Template Asset",
      description: "Create an SVG template",
      icon: Image,
      action: () => {
        setLocation("/assets");
        onOpenChange(false);
      },
    },
    {
      name: "New Variant",
      description: "Generate ad variant from template",
      icon: Lightbulb,
      action: () => {
        setLocation("/variants");
        onOpenChange(false);
      },
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground">
            Create New
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Choose what you'd like to create
          </p>
        </DialogHeader>
        
        <div className="space-y-4 mt-6">
          {options.map((option) => (
            <Button
              key={option.name}
              variant="outline"
              className="w-full justify-start space-x-3 p-4 h-auto"
              onClick={option.action}
              data-testid={`button-create-${option.name.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <option.icon className="w-5 h-5 text-primary" />
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">{option.name}</p>
                <p className="text-xs text-muted-foreground">{option.description}</p>
              </div>
            </Button>
          ))}
        </div>
        
        <div className="mt-6 border-t border-border pt-4">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
