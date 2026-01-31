import { pgTable, text, serial, timestamp, boolean, varchar, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// --- Users & Auth (Existing) ---
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email").unique(),
  password: text("password"),
  isAdmin: boolean("is_admin").default(false),
});

// --- Maintenance Requests (Existing) ---
export const maintenanceRequests = pgTable("maintenance_requests", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  contactInfo: text("contact_info").notNull(),
  vehicleInfo: text("vehicle_info").notNull(),
  vehicleColor: text("vehicle_color"),
  mileage: integer("mileage"),
  description: text("description").notNull(),
  status: text("status").notNull().default("pending"),
  isUrgent: boolean("is_urgent").default(false),
  workDone: text("work_done"),
  partsUsed: text("parts_used"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- NEW: Invoices Table ---
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => maintenanceRequests.id),
  invoiceNumber: text("invoice_number").notNull(),
  laborDescription: text("labor_description"),
  laborHours: text("labor_hours").notNull(),
  laborRate: text("labor_rate").notNull(),
  laborTotal: text("labor_total").notNull(),
  partsDetails: text("parts_details"),
  partsTotal: text("parts_total").notNull(),
  miscDescription: text("misc_description"),
  miscTotal: text("misc_total").default("0"),
  subtotal: text("subtotal").notNull(),
  tax: text("tax").default("0"),
  total: text("total").notNull(),
  notes: text("notes"),
  paymentStatus: text("payment_status").default("unpaid"), // unpaid, paid, void
  paymentMethod: text("payment_method"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- Zod Schemas ---
export const insertMaintenanceRequestSchema = createInsertSchema(maintenanceRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type MaintenanceRequest = typeof maintenanceRequests.$inferSelect;
export type InsertMaintenanceRequest = z.infer<typeof insertMaintenanceRequestSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
