# Configuration Examples

This directory contains example configuration files for the MCP Data Catalog.

## Available Examples

### 1. minimal.json
A minimal configuration with a single dataset showing only required fields.

**Use Case:** Getting started quickly, understanding the basics

**Features:**
- Single dataset
- Only required fields
- Simple string and number types
- Basic limits configuration

### 2. typical.json
A realistic configuration with multiple datasets and various field types.

**Use Case:** Most common production scenarios

**Features:**
- Multiple datasets (users, products)
- Mix of field types (string, number, boolean, enum)
- Realistic row limits
- Lookup keys configured
- All visible fields shown

### 3. advanced.json
A comprehensive configuration demonstrating advanced features.

**Use Case:** Complex scenarios with many datasets

**Features:**
- Multiple datasets (employees, inventory, orders)
- Extensive enum types
- Various limit configurations
- Complex field schemas
- Selective visible fields

---

## Configuration Field Reference

### Root Configuration

```json
{
  "datasets": [...]  // Array of dataset configurations
}
```

### Dataset Configuration

Each dataset has the following structure:

```json
{
  "id": "string",           // Unique identifier (required)
  "name": "string",         // Human-readable name (required)
  "schema": {...},          // Field definitions (required)
  "source": {...},          // Data source configuration (required)
  "lookupKey": "string",    // Field name for get-by-id queries (optional)
  "limits": {...}           // Row limit configuration (required)
}
```

#### `id` (required)
- **Type:** string
- **Description:** Unique identifier for the dataset
- **Rules:** Must be unique across all datasets
- **Example:** `"users"`, `"products"`, `"employees"`

#### `name` (required)
- **Type:** string
- **Description:** Human-readable display name
- **Example:** `"User Directory"`, `"Product Catalog"`

#### `schema` (required)
- **Type:** object
- **Description:** Defines the structure and types of dataset fields
- **Properties:**
  - `fields`: Array of field definitions (required)
  - `visibleFields`: Array of field names to expose (required)

##### Field Definition

```json
{
  "name": "string",         // Field name (required)
  "type": "string",         // Field type (required)
  "required": boolean,      // Whether field must have a value (optional, default: false)
  "values": ["string"]      // Valid enum values (required for enum type)
}
```

**Supported Types:**
- `"string"` - Text values
- `"number"` - Numeric values (integers and floats)
- `"boolean"` - true/false values
- `"enum"` - One of a predefined set of string values

**Type Examples:**

```json
// String field
{
  "name": "email",
  "type": "string",
  "required": true
}

// Number field
{
  "name": "age",
  "type": "number"
}

// Boolean field
{
  "name": "active",
  "type": "boolean"
}

// Enum field
{
  "name": "role",
  "type": "enum",
  "values": ["admin", "user", "guest"]
}
```

##### `visibleFields`
- **Type:** array of strings
- **Description:** List of field names that can be queried and returned
- **Rules:** 
  - All fields in this array must exist in the `fields` array
  - Only these fields can be projected in queries
  - Order is preserved in query results
- **Example:** `["id", "name", "email", "role"]`

#### `source` (required)
- **Type:** object
- **Description:** Defines where the data comes from
- **Current Support:** CSV files only (MVP)

```json
{
  "type": "csv",           // Source type (required, only "csv" in MVP)
  "path": "string"         // File path relative to project root (required)
}
```

**Path Examples:**
- `"./data/users.csv"`
- `"./examples/data/products.csv"`
- `"../external/inventory.csv"`

#### `lookupKey` (optional)
- **Type:** string
- **Description:** Field name to use for get-by-id queries
- **Rules:**
  - Must be a field name that exists in the schema
  - Should be unique per row (though not enforced)
- **Example:** `"id"`, `"employee_id"`, `"sku"`
- **Note:** If not specified, get-by-id tool will not work for this dataset

#### `limits` (required)
- **Type:** object
- **Description:** Controls how many rows can be returned

```json
{
  "maxRows": number,       // Maximum rows that can be returned (required)
  "defaultRows": number    // Default when no limit specified (required)
}
```

**Rules:**
- `maxRows` must be > 0
- `defaultRows` must be > 0
- `defaultRows` must be ≤ `maxRows`
- Queries cannot exceed `maxRows` even if they request more

**Example:**
```json
{
  "maxRows": 100,
  "defaultRows": 20
}
```

---

## Complete Example with Comments

```json
{
  "datasets": [
    {
      // Unique ID used in API calls
      "id": "users",
      
      // Human-readable name for display
      "name": "User Directory",
      
      // Schema defines structure and validation
      "schema": {
        "fields": [
          // Required numeric ID field
          {
            "name": "id",
            "type": "number",
            "required": true
          },
          // Required text field
          {
            "name": "name",
            "type": "string",
            "required": true
          },
          // Optional enum field with specific allowed values
          {
            "name": "role",
            "type": "enum",
            "values": ["admin", "user", "guest"]
          },
          // Optional boolean field
          {
            "name": "active",
            "type": "boolean"
          }
        ],
        // Only these fields are accessible via queries
        "visibleFields": ["id", "name", "role", "active"]
      },
      
      // CSV file location
      "source": {
        "type": "csv",
        "path": "./data/users.csv"
      },
      
      // Use "id" field for get-by-id lookups
      "lookupKey": "id",
      
      // Limit configuration
      "limits": {
        "maxRows": 100,      // Never return more than 100 rows
        "defaultRows": 20    // Return 20 rows when limit not specified
      }
    }
  ]
}
```

---

## Validation Rules

The configuration is validated on startup and will fail fast if invalid.

### Common Validation Errors

**1. Duplicate Dataset IDs**
```
Error: Dataset ID "users" is defined multiple times
```

**2. Invalid Field Type**
```
Error: Field "age" has invalid type "integer" (must be: string, number, boolean, enum)
```

**3. Enum Missing Values**
```
Error: Field "role" is type enum but has no values array
```

**4. Visible Field Not in Schema**
```
Error: Visible field "status" is not defined in fields array
```

**5. Invalid CSV Path**
```
Error: CSV file not found: ./data/missing.csv
```

**6. Invalid Limits**
```
Error: defaultRows (50) exceeds maxRows (20)
```

---

## Creating Your Own Configuration

### Step 1: Create CSV File

Create a CSV file with your data:

```csv
id,name,email,role
1,Alice,alice@example.com,admin
2,Bob,bob@example.com,user
```

### Step 2: Create Configuration

Copy `minimal.json` or `typical.json` as a starting point, then:

1. Set unique `id` (alphanumeric, underscores allowed)
2. Set descriptive `name`
3. Define fields matching CSV columns
4. Set appropriate types for each field
5. List fields to expose in `visibleFields`
6. Set CSV file path in `source.path`
7. Optionally set `lookupKey` (usually `id`)
8. Configure `limits` based on dataset size

### Step 3: Validate

Start the server - it will validate on startup:

```bash
npm run dev
```

If configuration is invalid, you'll see detailed error messages.

### Step 4: Test

Use the MCP tools to verify:

1. `list_datasets` - Check your dataset appears
2. `describe_dataset` - Verify schema is correct
3. `query_dataset` - Test querying
4. `get_by_id` - Test lookups (if lookupKey set)

---

## Hot Reload

The configuration file is watched for changes. When you modify it:

- ✅ Valid changes are applied automatically (1-3ms)
- ❌ Invalid changes are rejected, keeping the current configuration
- No server restart needed

To see reload in action:

1. Start the server: `npm run dev`
2. Modify `config/datasets.json`
3. Save the file
4. Check logs for reload confirmation
5. Query datasets to verify changes

---

## CSV File Requirements

CSV files must:
- Have a header row with column names
- Match field names in schema (case-sensitive)
- Contain valid data for defined types
- Use standard CSV format (comma-delimited)
- Be UTF-8 encoded

**Valid CSV Example:**
```csv
id,name,active
1,Alice,true
2,Bob,false
```

**Invalid CSV Example:**
```csv
id,name,active
1,Alice,yes    ← "yes" is not a boolean (should be true/false)
two,Bob,true   ← "two" is not a number
```

---

## Best Practices

### Field Naming
- Use snake_case or camelCase consistently
- Avoid special characters except underscore
- Keep names descriptive but concise

### Visible Fields
- Only expose fields that should be queryable
- Keep sensitive fields (passwords, SSNs) out of visibleFields
- Order fields logically (ID first, then key fields)

### Limits
- Set `maxRows` based on dataset size and use case
- Set `defaultRows` to a reasonable default (10-50 rows)
- For large datasets (>10K rows), keep maxRows ≤ 1000

### Enum Types
- Use enums for fields with fixed set of values
- Keep enum value lists short (< 20 values)
- Use lowercase for consistency

### Performance
- CSV files are loaded on-demand (not cached)
- Keep CSV files < 10MB for best performance
- For larger datasets, consider database sources (post-MVP)

---

## Related Documentation

- [Developer Documentation](../../docs/dev/mcp-data-catalog.md)
- [Configuration Schema](../../src/adapters/secondary/config/config-schema.ts)
- [API Reference](../../docs/api-reference.md) (coming soon)

---

## Need Help?

Check the [Troubleshooting Guide](../../docs/troubleshooting.md) (coming soon) for common issues and solutions.
