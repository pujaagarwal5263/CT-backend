-- Database Schema for Operations Control Tower Dashboard

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS orders_history CASCADE;
DROP TABLE IF EXISTS orders_master CASCADE;
DROP TABLE IF EXISTS upload_history CASCADE;
DROP TABLE IF EXISTS daily_plan CASCADE;
DROP TABLE IF EXISTS warehouse_master CASCADE;
DROP TABLE IF EXISTS courier_master CASCADE;
DROP TABLE IF EXISTS client_master CASCADE;

-- Warehouse Master Table
CREATE TABLE warehouse_master (
  id SERIAL PRIMARY KEY,
  warehouse_code VARCHAR(100) UNIQUE NOT NULL,
  warehouse_name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courier Master Table
CREATE TABLE courier_master (
  id SERIAL PRIMARY KEY,
  courier_code VARCHAR(100) UNIQUE NOT NULL,
  courier_name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Client Master Table
CREATE TABLE client_master (
  id SERIAL PRIMARY KEY,
  client_code VARCHAR(100) UNIQUE NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Upload History Table (Audit trail) - Create before orders_history since it's referenced
CREATE TABLE upload_history (
  id SERIAL PRIMARY KEY,
  file_name VARCHAR(255) NOT NULL,
  upload_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_rows INTEGER DEFAULT 0,
  inserted_rows INTEGER DEFAULT 0,
  updated_rows INTEGER DEFAULT 0,
  failed_rows INTEGER DEFAULT 0,
  uploaded_by VARCHAR(100),
  status VARCHAR(50) DEFAULT 'COMPLETED'
);

-- Orders Master Table (Latest state)
CREATE TABLE orders_master (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(255) NOT NULL,
  awb_number VARCHAR(255),
  order_date DATE NOT NULL,
  warehouse VARCHAR(100) NOT NULL,
  courier VARCHAR(100) NOT NULL,
  client VARCHAR(100),
  sku VARCHAR(255),
  quantity INTEGER DEFAULT 1,
  order_status VARCHAR(50) DEFAULT 'Confirmed',
  shipping_status VARCHAR(50),
  tat TIMESTAMP,
  manifested_at TIMESTAMP,
  delivered_at TIMESTAMP,
  sla_status VARCHAR(20) DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(order_id, awb_number)
);

-- Orders History Table (Track all changes)
CREATE TABLE orders_history (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(255) NOT NULL,
  awb_number VARCHAR(255),
  order_date DATE NOT NULL,
  warehouse VARCHAR(100) NOT NULL,
  courier VARCHAR(100) NOT NULL,
  client VARCHAR(100),
  sku VARCHAR(255),
  quantity INTEGER DEFAULT 1,
  order_status VARCHAR(50),
  shipping_status VARCHAR(50),
  tat TIMESTAMP,
  manifested_at TIMESTAMP,
  delivered_at TIMESTAMP,
  sla_status VARCHAR(20),
  upload_id INTEGER REFERENCES upload_history(id),
  change_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily Plan Table (Manual planning)
CREATE TABLE daily_plan (
  id SERIAL PRIMARY KEY,
  plan_date DATE NOT NULL,
  warehouse VARCHAR(100) NOT NULL,
  planned_manifest_qty INTEGER NOT NULL,
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(plan_date, warehouse)
);

-- Create indexes for performance
CREATE INDEX idx_orders_master_order_date ON orders_master(order_date);
CREATE INDEX idx_orders_master_warehouse ON orders_master(warehouse);
CREATE INDEX idx_orders_master_courier ON orders_master(courier);
CREATE INDEX idx_orders_master_client ON orders_master(client);
CREATE INDEX idx_orders_master_sla_status ON orders_master(sla_status);
CREATE INDEX idx_orders_history_order_id ON orders_history(order_id);
CREATE INDEX idx_upload_history_timestamp ON upload_history(upload_timestamp);
CREATE INDEX idx_daily_plan_date ON daily_plan(plan_date);

-- Insert default warehouse data
INSERT INTO warehouse_master (warehouse_code, warehouse_name, location) VALUES
('SUPERFOODS_Bhiwandi', 'Superfoods Bhiwandi', 'Bhiwandi'),
('SUPERFOODS_Bilaspur', 'Superfoods Bilaspur', 'Bilaspur'),
('SUPERFOODS_Malur_01', 'Superfoods Malur 01', 'Malur');

-- Insert default courier data
INSERT INTO courier_master (courier_code, courier_name) VALUES
('Delhivery', 'Delhivery'),
('Ekart', 'Ekart'),
('XpressBees', 'XpressBees'),
('SelfShip', 'Self Ship');

-- Insert default client data
INSERT INTO client_master (client_code, client_name) VALUES
('Titan', 'Titan'),
('Superfoods_B2B', 'Superfoods B2B'),
('Superfoods_B2C', 'Superfoods B2C');
