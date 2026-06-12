import { prisma } from "../../config/db";

export const getMovementsTrend = async (business_id: number, days: number = 30) => {
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const movements = await prisma.stockMovement.findMany({
    where: { business_id, movement_date: { gte: since } },
    select: { movement_date: true, movement_type: true, quantity: true },
    orderBy: { movement_date: "asc" },
  });

  const dateMap: Record<string, { date: string; IN: number; OUT: number; ADJUSTMENT: number; PRODUCTION: number }> = {};

  for (let d = 0; d < days; d++) {
    const date = new Date(since);
    date.setDate(date.getDate() + d);
    const key = date.toISOString().split("T")[0];
    dateMap[key] = { date: key, IN: 0, OUT: 0, ADJUSTMENT: 0, PRODUCTION: 0 };
  }

  for (const m of movements) {
    const key = m.movement_date.toISOString().split("T")[0];
    if (dateMap[key]) {
      dateMap[key][m.movement_type] += Number(m.quantity);
    }
  }

  return Object.values(dateMap);
};

export const getInventoryByCategory = async (business_id: number) => {
  const materials = await prisma.material.findMany({
    where: { business_id },
    select: { category: true, cost_price: true, quantity_available: true },
  });

  const grouped = materials.reduce(
    (acc, m) => {
      const cat = m.category;
      if (!acc[cat]) acc[cat] = { category: cat, value: 0, count: 0 };
      acc[cat].value += Number(m.cost_price) * Number(m.quantity_available);
      acc[cat].count += 1;
      return acc;
    },
    {} as Record<string, { category: string; value: number; count: number }>
  );

  return Object.values(grouped).sort((a, b) => b.value - a.value);
};

export const getTopMaterials = async (business_id: number, limit: number = 10) => {
  const materials = await prisma.material.findMany({
    where: { business_id },
    select: { name: true, cost_price: true, quantity_available: true, minimum_stock: true },
  });

  return materials
    .map((m) => ({
      name: m.name,
      value: Number(m.cost_price) * Number(m.quantity_available),
      cost_price: Number(m.cost_price),
      quantity: Number(m.quantity_available),
      isLow: Number(m.quantity_available) <= Number(m.minimum_stock),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
};

export const getMovementDistribution = async (business_id: number) => {
  const result = await prisma.stockMovement.groupBy({
    by: ["movement_type"],
    where: { business_id },
    _count: { movement_id: true },
    _sum: { quantity: true },
  });

  return result.map((r) => ({
    type: r.movement_type,
    count: r._count.movement_id,
    total_qty: Number(r._sum.quantity ?? 0),
  }));
};

export const getFinishedGoodsSummary = async (business_id: number) => {
  return prisma.finishedGood.findMany({
    where: { business_id },
    select: {
      name: true,
      quantity_produced: true,
      quantity_sold: true,
      current_quantity: true,
    },
    orderBy: { current_quantity: "desc" },
    take: 10,
  });
};
