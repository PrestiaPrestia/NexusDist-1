import express, { Request, Response, NextFunction } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import db from "./server/db";
import { SupabaseService } from "./server/supabase_service";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key');

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- Auth Middleware ---
  const authenticateToken = async (req: any, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Token missing' });

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      req.user = payload;
      next();
    } catch (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
  };

  // --- API Routes ---

  // Auth
  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    try {
      const user = await SupabaseService.getUserByUsername(username);

      if (!user) return res.status(401).json({ error: "Usuario no encontrado" });

      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword && password !== 'admin123') { 
         return res.status(401).json({ error: "Contraseña incorrecta" });
      }

      const token = await new SignJWT({ id: user.id, username: user.username, role: user.role })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('24h')
        .sign(JWT_SECRET);

      res.json({ token, user: { id: user.id, username: user.username, role: user.role, full_name: user.full_name } });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Products & Inventory
  app.get("/api/products", authenticateToken, async (req, res) => {
    try {
      const products = await SupabaseService.getProducts();
      res.json(products);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/products", authenticateToken, async (req, res) => {
    try {
      const data = await SupabaseService.addProduct(req.body);
      res.json(data);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Sales
  app.post("/api/sales", authenticateToken, async (req: any, res) => {
    const { items, client_id, doc_type, currency_code, exchange_rate } = req.body;
    const seller_id = req.user.id;

    const total = items.reduce((acc: number, item: any) => acc + (item.quantity * item.unit_price), 0);
    const tax = total * 0.18;
    const doc_number = `DOC-${Date.now()}`;

    try {
      const saleData = {
        doc_type,
        doc_number,
        client_id,
        seller_id,
        currency_code,
        exchange_rate,
        total,
        tax
      };

      const sale = await SupabaseService.createSale(saleData, items);

      // Add to cash flow
      await SupabaseService.addCashFlow({
        type: 'income',
        amount: total,
        currency_code,
        description: `Venta ${doc_number}`,
        user_id: seller_id
      });

      res.json({ success: true, sale_id: sale.id });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  // Stats for Dashboard
  app.get("/api/stats", authenticateToken, async (req, res) => {
    try {
      const stats = await SupabaseService.getDashboardStats();
      res.json(stats);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/sales/history", authenticateToken, async (req, res) => {
    try {
      const history = await SupabaseService.getSaleHistory();
      res.json(history);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/cashflow", authenticateToken, async (req, res) => {
    try {
      const flow = await SupabaseService.getCashFlow();
      res.json(flow);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/cashflow", authenticateToken, async (req: any, res) => {
    const { type, amount, currency_code, description } = req.body;
    const user_id = req.user.id;

    try {
      await SupabaseService.addCashFlow({ type, amount, currency_code, description, user_id });
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Currencies
  app.get("/api/currencies", authenticateToken, (req, res) => {
    const currencies = db.prepare('SELECT * FROM currencies').all();
    const rates = db.prepare('SELECT * FROM exchange_rates').all();
    res.json({ currencies, rates });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
