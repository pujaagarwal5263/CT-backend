# Operations Control Tower - Backend

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)

### Installation

1. Install dependencies:
```bash
cd backend
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your database credentials:
```
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=operations_control_tower
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

3. Create database:
```bash
createdb operations_control_tower
```

4. Run database schema:
```bash
psql -U postgres -d operations_control_tower -f src/config/schema.sql
```

### Running the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

### API Endpoints

#### Upload
- POST `/api/upload/upload` - Upload CSV file
- GET `/api/upload/history` - Get upload history
- GET `/api/upload/history/:id` - Get specific upload

#### Dashboard
- GET `/api/dashboard/kpis` - Get dashboard KPIs
- GET `/api/dashboard/warehouse-metrics` - Get warehouse metrics
- GET `/api/dashboard/courier-metrics` - Get courier metrics
- GET `/api/dashboard/daily-trends` - Get daily trends
- GET `/api/dashboard/plan-achievement` - Get plan achievement
- GET `/api/dashboard/orders` - Get orders with filters

#### Plans
- POST `/api/plans` - Create/update daily plan
- GET `/api/plans` - Get plans with achievement
- GET `/api/plans/achievement` - Get plan achievement for specific date

#### Master Data
- GET `/api/master/warehouses` - Get all warehouses
- GET `/api/master/couriers` - Get all couriers
- GET `/api/master/clients` - Get all clients

### CSV Format

The CSV file should contain the following columns:
- order_id (required)
- awb_number (required)
- order_date (required, format: YYYY-MM-DD)
- warehouse (required)
- courier (required)
- client (optional)
- sku (optional)
- quantity (optional, numeric)
- order_status (optional)
- shipping_status (optional)
- tat (optional, timestamp)
- manifested_at (optional, timestamp)
- delivered_at (optional, timestamp)
