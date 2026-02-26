-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    "timeReceived" TIME NOT NULL,
    "obNumber" VARCHAR(50) NOT NULL,
    "customerName" VARCHAR(255) NOT NULL,
    "contactOnScene" VARCHAR(255) NOT NULL,
    "pickupLocation" TEXT NOT NULL,
    "dropoffLocation" TEXT,
    "vehicleDetails" TEXT NOT NULL,
    "towClass" VARCHAR(100) NOT NULL,
    "vehicleUse" VARCHAR(255) NOT NULL,
    notes TEXT,
    "invoiceGenerated" BOOLEAN DEFAULT FALSE,
    price DECIMAL(10, 2),
    "invoiceNumber" VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create company_info table (single row configuration)
CREATE TABLE IF NOT EXISTS company_info (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    "registrationNumber" VARCHAR(100),
    "bankName" VARCHAR(255),
    "accountNumber" VARCHAR(100),
    "sortCode" VARCHAR(50),
    "logoUrl" TEXT,
    "nextInvoiceNumber" INTEGER DEFAULT 1,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default company info if table is empty
INSERT INTO company_info (name, address, phone, email, "nextInvoiceNumber")
VALUES ('Towing Company', '123 Main St', '555-0123', 'info@towingcompany.com', 1)
ON CONFLICT (id) DO NOTHING;

-- Create index for faster job queries
CREATE INDEX IF NOT EXISTS idx_jobs_date ON jobs(date);
CREATE INDEX IF NOT EXISTS idx_jobs_ob_number ON jobs("obNumber");
CREATE INDEX IF NOT EXISTS idx_jobs_invoice_generated ON jobs("invoiceGenerated");

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_info_updated_at BEFORE UPDATE ON company_info
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
