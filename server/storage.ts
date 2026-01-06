import { maintenanceRequests, type InsertMaintenanceRequest } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  createRequest(request: InsertMaintenanceRequest): Promise<typeof maintenanceRequests.$inferSelect>;
  getRequests(): Promise<(typeof maintenanceRequests.$inferSelect)[]>;
  getRequest(id: number): Promise<typeof maintenanceRequests.$inferSelect | undefined>;
  updateRequest(id: number, updates: any): Promise<typeof maintenanceRequests.$inferSelect | undefined>;
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
  async updateRequest(id: number, updates: any) {
    const [updated] = await db.update(maintenanceRequests)
      .set(updates)
      .where(eq(maintenanceRequests.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
