# Example Datasets

This directory contains example datasets and configurations to help you get started with the Catalog MCP Server.

## Quick Start

1. **Copy the example configuration:**
   ```bash
   cp config/datasets.example.json config/datasets.json
   ```

2. **Update paths in your config** to point to your own CSV files:
   ```json
   {
     "id": "my-dataset",
     "name": "My Dataset",
     "path": "./path/to/your/data.csv",
     ...
   }
   ```

3. **Start the server:**
   ```bash
   npm start config/datasets.json
   ```

## Example Files

### `data/sample-users.csv`
A simple user directory with the following fields:
- `user_id` (string, key field)
- `email` (string, lookup key)
- `first_name` (string)
- `last_name` (string)
- `department` (enum: Engineering, Sales, Marketing, HR, Finance)
- `active` (boolean)

### `data/sample-products.csv`
A product catalog with the following fields:
- `product_id` (string, key field)
- `name` (string)
- `category` (enum: Electronics, Clothing, Books, Home, Sports)
- `price` (number)
- `in_stock` (boolean)

## CSV Format Requirements

Your CSV files must:
- Have a header row with column names
- Match the field names defined in your configuration
- Use appropriate value formats:
  - **string**: any text
  - **number**: numeric values (e.g., 123, 45.67)
  - **boolean**: `true` or `false`
  - **enum**: must match one of the defined enumValues

## Configuration Guide

### Dataset Structure

```json
{
  "id": "unique-dataset-id",           // Unique identifier
  "name": "Display Name",              // Human-readable name
  "description": "What this dataset contains",
  "path": "./path/to/data.csv",       // Relative path to CSV file
  
  "fields": [                          // Define each column
    {
      "name": "column_name",           // Must match CSV header
      "type": "string",                // string | number | boolean | enum
      "isKey": true,                   // Primary key for get_by_id
      "isLookupKey": true,             // Searchable field
      "enumValues": []                 // Required if type is "enum"
    }
  ],
  
  "keyField": "column_name",           // Which field is the primary key
  "lookupKeys": ["field1", "field2"],  // Fields that can be searched
  "visibleFields": ["field1", ...],    // Default fields returned
  
  "limits": {
    "defaultLimit": 50,                // Default rows per query
    "maxLimit": 200                    // Maximum rows per query
  }
}
```

### Field Types

- **string**: Text data (names, IDs, emails)
- **number**: Numeric data (prices, quantities, ages)
- **boolean**: True/false values (active, in_stock)
- **enum**: Limited set of values (status, category, department)

### Best Practices

1. **Key Field**: Choose a unique identifier (like `id`, `user_id`, `product_id`)
2. **Lookup Keys**: Include fields users will search by (email, username, code)
3. **Visible Fields**: Only include commonly needed fields to reduce data transfer
4. **Limits**: Set reasonable defaults based on expected dataset size
5. **Enum Values**: List all valid options for enum fields

## Need Help?

See the main project README for:
- Full API documentation
- MCP tool usage examples
- Configuration schema details
- Troubleshooting tips
