# Example Datasets

This directory contains example datasets and configurations to help you get started with the MCP Data Catalog.

## Directory Structure

```
examples/
├── config/           # Example configuration files
│   ├── minimal.json      # Single dataset, basic features
│   ├── typical.json      # Multiple datasets, common use case
│   ├── advanced.json     # Complex scenarios, many features
│   └── README.md         # Detailed configuration documentation
└── data/             # Example CSV files
    ├── minimal.csv       # Simple 2-column dataset
    ├── sample-users.csv  # User directory (10 rows)
    ├── sample-products.csv # Product catalog (15 rows)
    ├── employees.csv     # Employee database (15 rows)
    ├── inventory.csv     # Warehouse inventory (20 rows)
    └── orders.csv        # Customer orders (20 rows)
```

## Quick Start

### 1. Choose an Example Configuration

**For beginners:**
```bash
cp examples/config/minimal.json config/datasets.json
```

**For typical use:**
```bash
cp examples/config/typical.json config/datasets.json
```

**For advanced features:**
```bash
cp examples/config/advanced.json config/datasets.json
```

### 2. Start the MCP Server

```bash
npm run build
npm run dev
```

The server will:
- Validate your configuration on startup
- Watch for config file changes (hot reload)
- Expose 4 MCP tools for querying

### 3. Test with MCP Tools

Use any MCP client to connect and try:

**List all datasets:**
```json
{
  "tool": "list_datasets"
}
```

**Describe a dataset:**
```json
{
  "tool": "describe_dataset",
  "arguments": {
    "datasetId": "users"
  }
}
```

**Query with filter:**
```json
{
  "tool": "query_dataset",
  "arguments": {
    "datasetId": "users",
    "filters": {
      "field": "role",
      "operator": "eq",
      "value": "admin"
    },
    "limit": 10
  }
}
```

**Get by ID:**
```json
{
  "tool": "get_by_id",
  "arguments": {
    "datasetId": "users",
    "id": "1"
  }
}
```

## Example Datasets

### minimal.csv
**Purpose:** Simple getting started example  
**Rows:** 5  
**Fields:** `id` (number), `name` (string)  
**Use Case:** Learning the basics

### sample-users.csv
**Purpose:** User directory  
**Rows:** 10  
**Fields:**
- `id` (number) - Lookup key
- `name` (string)
- `email` (string)
- `role` (enum: admin, user, guest)
- `active` (boolean)

**Use Case:** User management, access control

**Example Queries:**
- Find all admins: `role eq "admin"`
- Find active users: `active eq true`
- Search by name: `name contains "smith"`

### sample-products.csv
**Purpose:** Product catalog  
**Rows:** 15  
**Fields:**
- `id` (number) - Lookup key
- `name` (string)
- `price` (number)
- `category` (enum: electronics, clothing, books, home)
- `in_stock` (boolean)

**Use Case:** E-commerce, inventory tracking

**Example Queries:**
- Find electronics: `category eq "electronics"`
- Find in-stock items: `in_stock eq true`
- Search products: `name contains "laptop"`

### employees.csv
**Purpose:** Employee database  
**Rows:** 15  
**Fields:**
- `employee_id` (number) - Lookup key
- `first_name`, `last_name` (string)
- `email` (string)
- `department` (enum: engineering, sales, marketing, hr, finance)
- `title` (string)
- `salary` (number)
- `remote` (boolean)
- `start_date` (string)

**Use Case:** HR systems, employee directories

**Example Queries:**
- Find engineers: `department eq "engineering"`
- Find remote workers: `remote eq true`
- Find by department AND remote: Use `and` operator

### inventory.csv
**Purpose:** Warehouse inventory  
**Rows:** 20  
**Fields:**
- `sku` (string) - Lookup key
- `product_name` (string)
- `quantity` (number)
- `unit_price` (number)
- `category` (enum: electronics, clothing, furniture, appliances, toys, sports)
- `warehouse` (enum: north, south, east, west, central)
- `reorder_needed` (boolean)
- `supplier` (string)

**Use Case:** Inventory management, supply chain

**Example Queries:**
- Find items needing reorder: `reorder_needed eq true`
- Find electronics: `category eq "electronics"`
- Find items in north warehouse: `warehouse eq "north"`

### orders.csv
**Purpose:** Customer orders  
**Rows:** 20  
**Fields:**
- `order_id` (number) - Lookup key
- `customer_name` (string)
- `product` (string)
- `quantity` (number)
- `total` (number)
- `status` (enum: pending, processing, shipped, delivered, cancelled)
- `priority` (enum: low, medium, high, urgent)
- `paid` (boolean)
- `order_date` (string)

**Use Case:** Order management, fulfillment tracking

**Example Queries:**
- Find pending orders: `status eq "pending"`
- Find unpaid orders: `paid eq false`
- Find urgent orders: `priority eq "urgent"`
- Find pending AND unpaid: Use `and` operator

## CSV Format Requirements

Your CSV files must follow these rules:

### Header Row
- First row must contain column names
- Column names must match field definitions in config
- Names are case-sensitive

### Data Types

**String:**
```csv
name,email
Alice,alice@example.com
```

**Number:**
```csv
age,price
25,99.99
```

**Boolean:**
```csv
active,in_stock
true,false
```

**Enum:**
```csv
role,status
admin,active
user,inactive
```
All enum values must be in the `values` array in config.

### Common Mistakes

❌ **Wrong:**
```csv
id,active
1,yes          # Should be "true" not "yes"
two,false      # Should be "2" not "two"
```

✅ **Correct:**
```csv
id,active
1,true
2,false
```

## Creating Your Own Dataset

### Step 1: Create CSV File

Create a CSV file with your data:

```csv
id,name,email,active
1,Alice,alice@example.com,true
2,Bob,bob@example.com,true
```

### Step 2: Create Configuration

Copy an example config and modify:

```json
{
  "datasets": [
    {
      "id": "my-dataset",
      "name": "My Dataset",
      "schema": {
        "fields": [
          { "name": "id", "type": "number", "required": true },
          { "name": "name", "type": "string", "required": true },
          { "name": "email", "type": "string" },
          { "name": "active", "type": "boolean" }
        ],
        "visibleFields": ["id", "name", "email", "active"]
      },
      "source": {
        "type": "csv",
        "path": "./data/my-data.csv"
      },
      "lookupKey": "id",
      "limits": {
        "maxRows": 100,
        "defaultRows": 20
      }
    }
  ]
}
```

### Step 3: Test

1. Start server: `npm run dev`
2. List datasets to verify it appears
3. Describe dataset to check schema
4. Query to test data loading

## Filter Examples

The MVP supports three operators: `eq`, `contains`, and `and`.

### Equal (eq)
```json
{
  "field": "role",
  "operator": "eq",
  "value": "admin"
}
```

### Contains (case-insensitive substring)
```json
{
  "field": "name",
  "operator": "contains",
  "value": "smith"
}
```

### And (multiple conditions)
```json
{
  "operator": "and",
  "conditions": [
    { "field": "role", "operator": "eq", "value": "admin" },
    { "field": "active", "operator": "eq", "value": true }
  ]
}
```

## Limits and Pagination

Each dataset has configured limits:

```json
{
  "limits": {
    "maxRows": 100,      // Never return more than this
    "defaultRows": 20    // Default when no limit specified
  }
}
```

**Query with custom limit:**
```json
{
  "datasetId": "users",
  "limit": 50
}
```

**Truncation indicator:**
If results are truncated, the response includes:
```json
{
  "truncated": true,
  "rowsReturned": 100,
  "totalRows": 500
}
```

## Hot Reload

The configuration file is watched for changes. To modify datasets without restarting:

1. Edit `config/datasets.json`
2. Save the file
3. Changes apply automatically (1-3ms)
4. Invalid changes are rejected (keeps current config)

**Watch the logs:**
```
Config reloaded successfully in 2ms
```

## Related Documentation

- **[Configuration Reference](config/README.md)** - Complete config field documentation
- **[Developer Documentation](../docs/dev/mcp-data-catalog.md)** - Architecture and internals
- **[API Reference](../docs/api-reference.md)** - MCP tool schemas (coming soon)
- **[Troubleshooting Guide](../docs/troubleshooting.md)** - Common issues (coming soon)

## Best Practices

### Dataset Design
- Keep datasets focused (single entity type)
- Use descriptive IDs and names
- Define appropriate field types
- Only expose needed fields in `visibleFields`

### Performance
- Keep CSV files < 10MB for best performance
- Set reasonable row limits (< 1000)
- Use specific filters rather than retrieving all rows

### Security
- Don't include sensitive data in CSV files
- Use `visibleFields` to hide internal columns
- Never expose passwords, tokens, or PII unnecessarily

### Maintainability
- Document your datasets in config `name` field
- Use consistent field naming (snake_case or camelCase)
- Keep enum value lists concise and up-to-date

## Need Help?

1. Check the [configuration README](config/README.md)
2. Review [developer documentation](../docs/dev/mcp-data-catalog.md)
3. Look at existing examples for patterns
4. Test with `list_datasets` and `describe_dataset` first
