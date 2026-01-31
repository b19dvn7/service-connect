import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage"; // Assuming you are using the storage.ts file
import { insertMaintenanceRequestSchema, insertInvoiceSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // --- Maintenance Request Routes ---
  app.get("/api/requests", async (req, res) => {
    const requests = await storage.getRequests();
    res.json(requests);
  });

  app.get("/api/requests/:id", async (req, res) => {
    const request = await storage.getRequest(Number(req.params.id));
    if (!request) return res.status(404).json({ message: "Request not found" });
    res.json(request);
  });

  app.post("/api/requests", async (req, res) => {
    const parsed = insertMaintenanceRequestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    const request = await storage.createRequest(parsed.data);
    res.status(201).json(request);
  });

  app.patch("/api/requests/:id", async (req, res) => {
    const updated = await storage.updateRequest(Number(req.params.id), req.body);
    res.json(updated);
  });

  app.delete("/api/requests/:id", async (req, res) => {
    const deleted = await storage.deleteRequest(Number(req.params.id));
    if (!deleted) return res.status(404).json({ message: "Request not found" });
    res.json(deleted);
  });

  // --- NEW: Invoice Routes ---
  
  // Create an invoice for a specific request
  app.post("/api/invoices", async (req, res) => {
    const parsed = insertInvoiceSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    
    // Logic to save invoice using your storage method
    // If you are using 'storage.ts', ensure it has a createInvoice method
    const invoice = await storage.createInvoice(parsed.data);
    res.status(201).json(invoice);
  });

  // Get invoice by Request ID
  app.get("/api/invoices/request/:requestId", async (req, res) => {
    const invoice = await storage.getInvoiceByRequest(Number(req.params.requestId));
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    res.json(invoice);
  });

  const httpServer = createServer(app);
  return httpServer;
}
