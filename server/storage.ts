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
    const [newItem] = await db.insert(maintenanceRequests).values(request).returning();
    return newItem;
  }
  async getRequests() {
    return await db.select().from(maintenanceRequests).orderBy(maintenanceRequests.createdAt);
  }
  async getRequest(id: number) {
    const [item] = await db.select().from(maintenanceRequests).where(eq(maintenanceRequests.id, id));
    return item;
  }
  async updateRequest(id: number, updates: Partial<MaintenanceRequest>) {
    const [updated] = await db.update(maintenanceRequests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(maintenanceRequests.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
