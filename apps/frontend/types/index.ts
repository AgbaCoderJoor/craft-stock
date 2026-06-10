export interface User {
  user_id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export interface Material {
  material_id: number;
  name: string;
  category: string;
  supplier?: string;
  cost_price: string;
  quantity_available: string;
  minimum_stock: string;
  batch_number?: string;
  created_at: string;
  updated_at: string;
}

export interface FinishedGood {
  finished_id: number;
  name: string;
  sku: string;
  size?: string;
  quantity_produced: number;
  quantity_sold: number;
  current_quantity: number;
  production_date?: string;
  created_at: string;
  updated_at: string;
}

export type MovementType = "IN" | "OUT" | "ADJUSTMENT" | "PRODUCTION";

export interface StockMovement {
  movement_id: number;
  material_id?: number;
  finished_id?: number;
  movement_type: MovementType;
  quantity: string;
  purpose?: string;
  issued_by: number;
  approved_by?: number;
  confirmed_by?: number;
  movement_date: string;
  material?: { name: string };
  finished?: { name: string; sku: string };
  issuer: { name: string };
  approver?: { name: string };
  confirmer?: { name: string };
}

export interface AuditLog {
  log_id: number;
  user_id: number;
  action: string;
  table_name: string;
  record_id: number;
  old_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  created_at: string;
  user: { name: string; email: string };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Analytics types
export interface MovementTrendPoint {
  date: string;
  IN: number;
  OUT: number;
  ADJUSTMENT: number;
  PRODUCTION: number;
}

export interface CategoryStat {
  category: string;
  value: number;
  count: number;
}

export interface TopMaterialStat {
  name: string;
  value: number;
  cost_price: number;
  quantity: number;
  isLow: boolean;
}

export interface MovementDistribution {
  type: string;
  count: number;
  total_qty: number;
}

export interface FinishedGoodSummary {
  name: string;
  quantity_produced: number;
  quantity_sold: number;
  current_quantity: number;
}
