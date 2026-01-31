import { 
  maintenanceRequests, 
  invoices,
  type InsertMaintenanceRequest, 
  type MaintenanceRequest,
  type InsertInvoice,
  type Invoice
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  createRequest(request: InsertMaintenanceRequest): Promise<MaintenanceRequest>;
  getRequests(): Promise<MaintenanceRequest[]>;
  getRequest(id: number): Promise<MaintenanceRequest | undefined>;
  updateRequest(id: number, updates: Partial<MaintenanceRequest>): Promise<MaintenanceRequest | undefined>;
  
  // Invoice methods
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  getInvoices(): Promise<Invoice[]>;
  getInvoiceByRequest(requestId: number): Promise<Invoice | undefined>;
  updateInvoice(id: number, updates: Partial<Invoice>): Promise<Invoice | undefined>;
}

function requireDb() {
  if (!db) {
    throw new Error("DATABASE_URL not set. Database features are disabled.");
  }
  return db;
}

export class DatabaseStorage implements IStorage {
  async createRequest(request: InsertMaintenanceRequest) {
    const database = requireDb();
    const [newItem] = await database.insert(maintenanceRequests).values(request).returning();
    return newItem;
  }
  async getRequests() {
    const database = requireDb();
    return await database.select().from(maintenanceRequests).orderBy(maintenanceRequests.createdAt);
  }
  async getRequest(id: number) {
    const database = requireDb();
    const [item] = await database.select().from(maintenanceRequests).where(eq(maintenanceRequests.id, id));
    return item;
  }
  async updateRequest(id: number, updates: Partial<MaintenanceRequest>) {
    const database = requireDb();
    const [updated] = await database.update(maintenanceRequests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(maintenanceRequests.id, id))
      .returning();
    return updated;
  }
  
  // Invoice methods
  async createInvoice(invoice: InsertInvoice) {
    const database = requireDb();
    const [newInvoice] = await database.insert(invoices).values(invoice).returning();
    return newInvoice;
  }
  async getInvoices() {
    const database = requireDb();
    return await database.select().from(invoices).orderBy(invoices.createdAt);
  }
  async getInvoiceByRequest(requestId: number) {
    const database = requireDb();
    const [invoice] = await database.select().from(invoices).where(eq(invoices.requestId, requestId));
    return invoice;
  }
  async updateInvoice(id: number, updates: Partial<Invoice>) {
    const database = requireDb();
    const [updated] = await database.update(invoices)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return updated;
  }
}

class MemoryStorage implements IStorage {
  private requests = new Map<number, MaintenanceRequest>();
  private invoices = new Map<number, Invoice>();
  private requestId = 1;
  private invoiceId = 1;

  async createRequest(request: InsertMaintenanceRequest) {
    const now = new Date();
    const item: MaintenanceRequest = {
      id: this.requestId++,
      customerName: request.customerName,
      contactInfo: request.contactInfo,
      vehicleInfo: request.vehicleInfo,
      vehicleColor: request.vehicleColor ?? null,
      mileage: request.mileage ?? null,
      description: request.description,
      status: request.status ?? "pending",
      isUrgent: request.isUrgent ?? false,
      workDone: request.workDone ?? null,
      partsUsed: request.partsUsed ?? null,
      createdAt: now,
      updatedAt: now,
    };

    this.requests.set(item.id, item);
    return item;
  }

  async getRequests() {
    return Array.from(this.requests.values()).sort((a, b) => {
      return (a.createdAt?.getTime?.() ?? 0) - (b.createdAt?.getTime?.() ?? 0);
    });
  }

  async getRequest(id: number) {
    return this.requests.get(id);
  }

  async updateRequest(id: number, updates: Partial<MaintenanceRequest>) {
    const existing = this.requests.get(id);
    if (!existing) return undefined;
    const updated: MaintenanceRequest = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.requests.set(id, updated);
    return updated;
  }

  async createInvoice(invoice: InsertInvoice) {
    const now = new Date();
    const item: Invoice = {
      id: this.invoiceId++,
      requestId: invoice.requestId,
      invoiceNumber: invoice.invoiceNumber,
      laborDescription: invoice.laborDescription ?? null,
      laborHours: invoice.laborHours,
      laborRate: invoice.laborRate,
      laborTotal: invoice.laborTotal,
      partsDetails: invoice.partsDetails ?? null,
      partsTotal: invoice.partsTotal,
      miscDescription: invoice.miscDescription ?? null,
      miscTotal: invoice.miscTotal ?? "0",
      subtotal: invoice.subtotal,
      tax: invoice.tax ?? "0",
      total: invoice.total,
      notes: invoice.notes ?? null,
      paymentStatus: invoice.paymentStatus ?? "unpaid",
      paymentMethod: invoice.paymentMethod ?? null,
      createdAt: now,
      updatedAt: now,
    };

    this.invoices.set(item.id, item);
    return item;
  }

  async getInvoices() {
    return Array.from(this.invoices.values()).sort((a, b) => {
      return (a.createdAt?.getTime?.() ?? 0) - (b.createdAt?.getTime?.() ?? 0);
    });
  }

  async getInvoiceByRequest(requestId: number) {
    return Array.from(this.invoices.values()).find((invoice) => invoice.requestId === requestId);
  }

  async updateInvoice(id: number, updates: Partial<Invoice>) {
    const existing = this.invoices.get(id);
    if (!existing) return undefined;
    const updated: Invoice = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.invoices.set(id, updated);
    return updated;
  }
}

export const storage: IStorage = db ? new DatabaseStorage() : new MemoryStorage();
