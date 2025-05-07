import { contacts, type Contact, type InsertContact } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";

const PostgresStore = connectPgSimple(session);

export interface IStorage {
  saveContactMessage(contact: InsertContact): Promise<Contact>;
  getContactMessages(): Promise<Contact[]>;
  getContactMessageById(id: number): Promise<Contact | undefined>;
  deleteContactMessage(id: number): Promise<boolean>;
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true
    });
  }

  async saveContactMessage(contactData: InsertContact): Promise<Contact> {
    const [contact] = await db
      .insert(contacts)
      .values(contactData)
      .returning();
    
    return contact;
  }

  async getContactMessages(): Promise<Contact[]> {
    return db
      .select()
      .from(contacts)
      .orderBy(desc(contacts.createdAt));
  }

  async getContactMessageById(id: number): Promise<Contact | undefined> {
    const [contact] = await db
      .select()
      .from(contacts)
      .where(eq(contacts.id, id));
    
    return contact;
  }

  async deleteContactMessage(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(contacts)
        .where(eq(contacts.id, id))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting contact message:", error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();
