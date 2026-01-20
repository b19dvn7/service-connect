import { pgTable, text, serial, timestamp, boolean, varchar, jsonb, index, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

// Replit Auth required tables
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  }
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const maintenanceRequests = pgTable("maintenance_requests", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  contactInfo: text("contact_info").notNull(),
  vehicleInfo: text("vehicle_info").notNull(),
  vehicleColor: text("vehicle_color"),
  mileage: integer("mileage"),
  description: text("description").notNull(),
  status: text("status").notNull().default("new"),
  isUrgent: boolean("is_urgent").default(false),
  workDone: text("work_done"), // Admin updates what work was performed
  partsUsed: text("parts_used"), // Admin tracks parts/misc items
  checklist: jsonb("checklist").default([]), // Admin tracking of specific tasks
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMaintenanceRequestSchema = createInsertSchema(maintenanceRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  workDone: true,
  partsUsed: true,
});

export type MaintenanceRequest = typeof maintenanceRequests.$inferSelect;
export type InsertMaintenanceRequest = z.infer<typeof insertMaintenanceRequestSchema>;

export type UpdateRequestDetails = {
  status?: string;
  workDone?: string;
  partsUsed?: string;
};
