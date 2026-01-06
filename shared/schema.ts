import { pgTable, text, serial, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const maintenanceRequests = pgTable("maintenance_requests", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  contactInfo: text("contact_info").notNull(),
  vehicleInfo: text("vehicle_info").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("pending"),
  isUrgent: boolean("is_urgent").default(false),
  workDone: text("work_done"),
  partsUsed: jsonb("parts_used").$type<{ name: string; quantity: number }[]>().default([]),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMaintenanceRequestSchema = createInsertSchema(maintenanceRequests).omit({
  id: true,
  createdAt: true,
  status: true,
  workDone: true,
  partsUsed: true,
  notes: true
});

export type MaintenanceRequest = typeof maintenanceRequests.$inferSelect;
export type InsertMaintenanceRequest = z.infer<typeof insertMaintenanceRequestSchema>;

export type UpdateWorkOrderRequest = {
  status?: string;
  workDone?: string;
  partsUsed?: { name: string; quantity: number }[];
  notes?: string;
};
