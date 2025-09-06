export interface User {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "USER";
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  description: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  clientId: string;
  name: string;
  description: string | null;
  archived: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  client: Client;
}

export interface Asset {
  id: string;
  projectId: string;
  name: string;
  templateSvg: string;
  templateFonts: any;
  defaultBindings: any;
  styleHints: any;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  project: Project;
}

export interface Variant {
  id: string;
  assetId: string;
  source: "USER" | "AUTO";
  bindings: any;
  renderSvg: string;
  renderPngUrl: string | null;
  status: "DRAFT" | "READY" | "ERROR";
  errorMessage: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  asset: Asset;
}

export interface DashboardStats {
  totalClients: number;
  activeProjects: number;
  templateAssets: number;
  generatedVariants: number;
}
