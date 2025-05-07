import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { contactSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { ZodError } from "zod";
import { setupAdminAuth } from "./admin-auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup admin authentication routes
  setupAdminAuth(app);
  // Contact form submission route
  app.post("/api/contact", async (req: Request, res: Response) => {
    try {
      const validatedData = contactSchema.parse(req.body);
      const contact = await storage.saveContactMessage(validatedData);
      res.status(201).json({ success: true, message: "Contact message saved", data: contact });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ success: false, message: validationError.message });
      } else {
        res.status(500).json({ success: false, message: "Internal server error" });
      }
    }
  });

  // Admin middleware to check for token or password validation
  const checkAdminAuth = (req: Request, res: Response, next: Function) => {
    // Check for authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    
    // We're using a simpler token-based auth for this example
    // In a real app, you would validate the token against a database
    // For now, we'll just check if a token exists (it was set during login)
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
    
    // Token exists, proceed to protected route
    next();
  };
  
  // Get all contact form submissions for admin page (protected)
  app.get("/api/contacts", checkAdminAuth, async (_req: Request, res: Response) => {
    try {
      const contacts = await storage.getContactMessages();
      res.status(200).json(contacts);
    } catch (error) {
      console.error("Error retrieving contacts:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Get a specific contact message by ID (protected)
  app.get("/api/contacts/:id", checkAdminAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: "Invalid ID format" });
      }

      const contact = await storage.getContactMessageById(id);
      if (!contact) {
        return res.status(404).json({ success: false, message: "Contact not found" });
      }

      res.status(200).json(contact);
    } catch (error) {
      console.error("Error retrieving contact:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });
  
  // Delete a contact message (protected)
  app.delete("/api/contacts/:id", checkAdminAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: "Invalid ID format" });
      }

      const success = await storage.deleteContactMessage(id);
      if (!success) {
        return res.status(404).json({ success: false, message: "Contact not found or could not be deleted" });
      }

      res.status(200).json({ success: true, message: "Contact deleted successfully" });
    } catch (error) {
      console.error("Error deleting contact:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
