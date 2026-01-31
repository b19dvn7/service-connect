import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, isAuthenticated, registerAuthRoutes } from "./replit_integrations/auth";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Setup Replit Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  app.get(api.requests.list.path, isAuthenticated, async (_req, res) => {
    const requests = await storage.getRequests();
    res.json(requests);
  });

  app.get(api.requests.get.path, isAuthenticated, async (req, res) => {
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

  app.patch(api.requests.update.path, isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(404).json({ message: "Invalid ID" });
    
    try {
      const input = api.requests.update.input.parse(req.body);
      const updated = await storage.updateRequest(id, input);
      if (!updated) return res.status(404).json({ message: "Request not found" });
      res.json(updated);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors[0].message });
      }
      throw e;
    }
  });

  app.delete(api.requests.delete.path, isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(404).json({ message: "Invalid ID" });
    const deleted = await storage.deleteRequest(id);
    if (!deleted) return res.status(404).json({ message: "Request not found" });
    res.json(deleted);
  });

  // Invoice routes
  app.get(api.invoices.list.path, isAuthenticated, async (_req, res) => {
    const invoices = await storage.getInvoices();
    res.json(invoices);
  });

  app.get(api.invoices.getByRequest.path, isAuthenticated, async (req, res) => {
    const requestId = parseInt(req.params.requestId);
    if (isNaN(requestId)) return res.status(400).json({ message: "Invalid request ID" });
    
    const invoice = await storage.getInvoiceByRequest(requestId);
    res.json(invoice || null);
  });

  app.post(api.invoices.create.path, isAuthenticated, async (req, res) => {
    try {
      const invoice = await storage.createInvoice(req.body);
      res.status(201).json(invoice);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors[0].message });
      }
      throw e;
    }
  });

  app.patch(api.invoices.update.path, isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(404).json({ message: "Invalid ID" });
    
    try {
      const updated = await storage.updateInvoice(id, req.body);
      if (!updated) return res.status(404).json({ message: "Invoice not found" });
      res.json(updated);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors[0].message });
      }
      throw e;
    }
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
