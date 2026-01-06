import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  app.get(api.requests.list.path, async (_req, res) => {
    const requests = await storage.getRequests();
    res.json(requests);
  });

  app.get(api.requests.get.path, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(404).json({ message: "Invalid ID" });
    const request = await storage.getRequest(id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    res.json(request);
  });

  app.post(api.requests.create.path, async (req, res) => {
    try {
      const input = api.requests.create.input.parse(req.body);
      const request = await storage.createRequest(input);
      res.status(201).json(request);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors[0].message });
      }
      throw e;
    }
  });

  app.patch(api.requests.updateStatus.path, async (req, res) => {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    const updated = await storage.updateStatus(id, status);
    if (!updated) return res.status(404).json({ message: "Request not found" });
    res.json(updated);
  });

  // Seed data
  const existing = await storage.getRequests();
  if (existing.length === 0) {
    await storage.createRequest({
      customerName: "John Doe",
      contactInfo: "555-0123",
      vehicleInfo: "2018 Ford F-150",
      description: "Oil change and tire rotation needed.",
      isUrgent: false
    });
    await storage.createRequest({
      customerName: "Alice Smith",
      contactInfo: "alice@example.com",
      vehicleInfo: "2020 Peterbilt 579",
      description: "Check engine light is on. Losing power on hills.",
      isUrgent: true
    });
    console.log("Database seeded with example requests");
  }

  return httpServer;
}
