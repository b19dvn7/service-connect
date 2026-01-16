import { maintenanceRequests, type InsertMaintenanceRequest, type MaintenanceRequest } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  createRequest(request: InsertMaintenanceRequest): Promise<MaintenanceRequest>;
  getRequests(): Promise<MaintenanceRequest[]>;
  getRequest(id: number): Promise<MaintenanceRequest | undefined>;
  updateRequest(id: number, updates: Partial<MaintenanceRequest>): Promise<MaintenanceRequest | undefined>;
}

export class DatabaseStorage implements IStorage {
  async createRequest(request: InsertMaintenanceRequest) {
    if (!db) {
      throw new Error("Database not configured.");
    }
    const [newItem] = await db.insert(maintenanceRequests).values(request).returning();
    return newItem;
  }
  async getRequests() {
    if (!db) {
      throw new Error("Database not configured.");
    }
    return await db.select().from(maintenanceRequests).orderBy(maintenanceRequests.createdAt);
  }
  async getRequest(id: number) {
    if (!db) {
      throw new Error("Database not configured.");
    }
    const [item] = await db.select().from(maintenanceRequests).where(eq(maintenanceRequests.id, id));
    return item;
  }
  async updateRequest(id: number, updates: Partial<MaintenanceRequest>) {
    if (!db) {
      throw new Error("Database not configured.");
    }
    const [updated] = await db.update(maintenanceRequests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(maintenanceRequests.id, id))
      .returning();
    return updated;
  }
}

class MemoryStorage implements IStorage {
  private items: MaintenanceRequest[] = [];
  private nextId = 1;

  async createRequest(request: InsertMaintenanceRequest) {
    const now = new Date();
    const newItem: MaintenanceRequest = {
      id: this.nextId++,
      customerName: request.customerName,
      contactInfo: request.contactInfo,
      vehicleInfo: request.vehicleInfo,
      vehicleColor: request.vehicleColor ?? null,
      mileage: request.mileage ?? null,
      description: request.description,
      status: "pending",
      isUrgent: request.isUrgent ?? false,
      workDone: null,
      partsUsed: null,
      createdAt: now,
      updatedAt: now,
    };

    this.items.push(newItem);
    return newItem;
  }

  async getRequests() {
    return [...this.items].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async getRequest(id: number) {
    return this.items.find((item) => item.id === id);
  }

  async updateRequest(id: number, updates: Partial<MaintenanceRequest>) {
    const item = this.items.find((entry) => entry.id === id);
    if (!item) return undefined;

    const updated: MaintenanceRequest = {
      ...item,
      ...updates,
      updatedAt: new Date(),
    };
    const index = this.items.findIndex((entry) => entry.id === id);
    this.items[index] = updated;
    return updated;
  }
}

export const storage: IStorage = db ? new DatabaseStorage() : new MemoryStorage();
