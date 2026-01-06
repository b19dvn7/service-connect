import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const maintenanceRequests = pgTable("maintenance_requests", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  contactInfo: text("contact_info").notNull(),
  vehicleInfo: text("vehicle_info").notNull(), // Year, Make, Model, VIN
  description: text("description").notNull(),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed
  isUrgent: boolean("is_urgent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMaintenanceRequestSchema = createInsertSchema(maintenanceRequests).omit({
  id: true,
  createdAt: true,
  status: true 
});

export type MaintenanceRequest = typeof maintenanceRequests.$inferSelect;
export type InsertMaintenanceRequest = z.infer<typeof insertMaintenanceRequestSchema>;

export type UpdateStatusRequest = {
  status: string;
};
