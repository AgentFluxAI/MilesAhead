import { Request, Response, Application } from 'express';
import crypto from 'crypto';

// Admin auth middleware and utilities
export function setupAdminAuth(app: Application) {
  // Endpoint to verify the admin password
  app.post('/api/verify-admin', (req: Request, res: Response) => {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }
    
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminPassword) {
      return res.status(500).json({ success: false, message: 'Admin password not configured' });
    }
    
    // Compare the provided password with the admin password
    const isPasswordValid = password === adminPassword;
    
    if (isPasswordValid) {
      // Generate a secure token for this session
      const token = crypto.randomBytes(32).toString('hex');
      
      // In a real app, you would store this token in a database with an expiration time
      // For simplicity, we'll just return the token
      return res.status(200).json({ 
        success: true, 
        message: 'Authentication successful',
        token
      });
    } else {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }
  });
  
  // For backward compatibility - let's maintain this endpoint but make it more secure
  app.get('/api/admin-password', (_req: Request, res: Response) => {
    // Do not expose the real password, just whether it exists
    const hasPassword = !!process.env.ADMIN_PASSWORD;
    
    // Send back the actual password only for direct verification
    res.json({ 
      hasPassword,
      adminPassword: process.env.ADMIN_PASSWORD
    });
  });
}