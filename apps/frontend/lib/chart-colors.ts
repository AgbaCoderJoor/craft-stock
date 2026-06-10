export const CHART_COLORS = {
  teal:    "#0d9488",
  blue:    "#3b82f6",
  emerald: "#10b981",
  amber:   "#f59e0b",
  rose:    "#f43f5e",
  violet:  "#8b5cf6",
  sky:     "#0ea5e9",
  orange:  "#f97316",
};

export const MOVEMENT_COLORS: Record<string, string> = {
  IN:         CHART_COLORS.emerald,
  OUT:        CHART_COLORS.rose,
  ADJUSTMENT: CHART_COLORS.amber,
  PRODUCTION: CHART_COLORS.blue,
};

export const PALETTE = [
  CHART_COLORS.teal,
  CHART_COLORS.blue,
  CHART_COLORS.violet,
  CHART_COLORS.amber,
  CHART_COLORS.orange,
  CHART_COLORS.sky,
  CHART_COLORS.emerald,
  CHART_COLORS.rose,
];
