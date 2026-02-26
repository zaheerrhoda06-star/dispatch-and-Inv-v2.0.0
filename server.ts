import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { query } from "./lib/db";

// Convert ES module URL to file path for __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json()); // Enable JSON body parsing

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // ==================== JOBS API ROUTES ====================

  // GET all jobs
  app.get("/api/jobs", async (req, res) => {
    try {
      const { date, obNumber, customerName } = req.query;
      let sql = 'SELECT * FROM jobs ORDER BY date DESC, "timeReceived" DESC';
      let params: any[] = [];

      if (date || obNumber || customerName) {
        const conditions: string[] = [];
        if (date) {
          conditions.push('date = $' + (params.length + 1));
          params.push(date);
        }
        if (obNumber) {
          conditions.push('"obNumber" ILIKE $' + (params.length + 1));
          params.push(`%${obNumber}%`);
        }
        if (customerName) {
          conditions.push('"customerName" ILIKE $' + (params.length + 1));
          params.push(`%${customerName}%`);
        }
        sql = 'SELECT * FROM jobs WHERE ' + conditions.join(' AND ') + ' ORDER BY date DESC, "timeReceived" DESC';
      }

      const result = await query(sql, params);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      res.status(500).json({ error: 'Failed to fetch jobs' });
    }
  });

  // GET single job by ID
  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const result = await query('SELECT * FROM jobs WHERE id = $1', [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Job not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching job:', error);
      res.status(500).json({ error: 'Failed to fetch job' });
    }
  });

  // CREATE new job
  app.post("/api/jobs", async (req, res) => {
    try {
      const {
        date,
        timeReceived,
        obNumber,
        customerName,
        contactOnScene,
        pickupLocation,
        dropoffLocation,
        vehicleDetails,
        towClass,
        vehicleUse,
        notes,
      } = req.body;

      const result = await query(
        `INSERT INTO jobs 
         (date, "timeReceived", "obNumber", "customerName", "contactOnScene", 
          "pickupLocation", "dropoffLocation", "vehicleDetails", "towClass", 
          "vehicleUse", notes) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
         RETURNING *`,
        [date, timeReceived, obNumber, customerName, contactOnScene,
         pickupLocation, dropoffLocation, vehicleDetails, towClass,
         vehicleUse, notes]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating job:', error);
      res.status(500).json({ error: 'Failed to create job' });
    }
  });

  // UPDATE job (partial update supported)
  app.put("/api/jobs/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const {
        date,
        timeReceived,
        obNumber,
        customerName,
        contactOnScene,
        pickupLocation,
        dropoffLocation,
        vehicleDetails,
        towClass,
        vehicleUse,
        notes,
        invoiceGenerated,
        price,
        invoiceNumber,
      } = req.body;

      // Build dynamic update query
      const updates: string[] = [];
      const params: any[] = [];
      let paramCount = 1;

      if (date !== undefined) {
        updates.push(`"date" = $${paramCount++}`);
        params.push(date);
      }
      if (timeReceived !== undefined) {
        updates.push(`"timeReceived" = $${paramCount++}`);
        params.push(timeReceived);
      }
      if (obNumber !== undefined) {
        updates.push(`"obNumber" = $${paramCount++}`);
        params.push(obNumber);
      }
      if (customerName !== undefined) {
        updates.push(`"customerName" = $${paramCount++}`);
        params.push(customerName);
      }
      if (contactOnScene !== undefined) {
        updates.push(`"contactOnScene" = $${paramCount++}`);
        params.push(contactOnScene);
      }
      if (pickupLocation !== undefined) {
        updates.push(`"pickupLocation" = $${paramCount++}`);
        params.push(pickupLocation);
      }
      if (dropoffLocation !== undefined) {
        updates.push(`"dropoffLocation" = $${paramCount++}`);
        params.push(dropoffLocation);
      }
      if (vehicleDetails !== undefined) {
        updates.push(`"vehicleDetails" = $${paramCount++}`);
        params.push(vehicleDetails);
      }
      if (towClass !== undefined) {
        updates.push(`"towClass" = $${paramCount++}`);
        params.push(towClass);
      }
      if (vehicleUse !== undefined) {
        updates.push(`"vehicleUse" = $${paramCount++}`);
        params.push(vehicleUse);
      }
      if (notes !== undefined) {
        updates.push(`"notes" = $${paramCount++}`);
        params.push(notes);
      }
      if (invoiceGenerated !== undefined) {
        updates.push(`"invoiceGenerated" = $${paramCount++}`);
        params.push(invoiceGenerated);
      }
      if (price !== undefined) {
        updates.push(`"price" = $${paramCount++}`);
        params.push(price);
      }
      if (invoiceNumber !== undefined) {
        updates.push(`"invoiceNumber" = $${paramCount++}`);
        params.push(invoiceNumber);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      // Add updated_at
      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      params.push(id);

      const sql = `UPDATE jobs SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
      const result = await query(sql, params);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Job not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating job:', error);
      res.status(500).json({ error: 'Failed to update job' });
    }
  });

  // DELETE job
  app.delete("/api/jobs/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const result = await query('DELETE FROM jobs WHERE id = $1 RETURNING *', [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Job not found' });
      }

      res.json({ message: 'Job deleted successfully', job: result.rows[0] });
    } catch (error) {
      console.error('Error deleting job:', error);
      res.status(500).json({ error: 'Failed to delete job' });
    }
  });

  // ==================== COMPANY SETTINGS API ROUTES ====================

  // GET company info (single row)
  app.get("/api/company", async (req, res) => {
    try {
      const result = await query('SELECT * FROM company_info LIMIT 1');
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Company info not found' });
      }
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching company info:', error);
      res.status(500).json({ error: 'Failed to fetch company info' });
    }
  });

  // UPDATE company info
  app.put("/api/company", async (req, res) => {
    try {
      const {
        name,
        address,
        phone,
        email,
        registrationNumber,
        bankName,
        accountNumber,
        sortCode,
        logoUrl,
        nextInvoiceNumber,
      } = req.body;

      const result = await query(
        `UPDATE company_info SET 
         name = $1, address = $2, phone = $3, email = $4, 
         "registrationNumber" = $5, "bankName" = $6, "accountNumber" = $7, 
         "sortCode" = $8, "logoUrl" = $9, "nextInvoiceNumber" = $10, 
         updated_at = CURRENT_TIMESTAMP 
         WHERE id = 1 
         RETURNING *`,
        [name, address, phone, email, registrationNumber,
         bankName, accountNumber, sortCode, logoUrl, nextInvoiceNumber]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Company info not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating company info:', error);
      res.status(500).json({ error: 'Failed to update company info' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      root: __dirname, // Use the directory where server.ts is located
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files from the 'dist' directory
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
