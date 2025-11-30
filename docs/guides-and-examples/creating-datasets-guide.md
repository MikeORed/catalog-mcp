# Complete Guide to Creating Datasets and Configurations

This guide walks you through the entire process of taking your data and creating appropriate dataset configurations for the MCP Data Catalog.

---

## Table of Contents

1. [Understanding the System](#understanding-the-system)
2. [Is Your Data Suitable?](#is-your-data-suitable)
3. [Step-by-Step: From Raw Data to Working Dataset](#step-by-step-from-raw-data-to-working-dataset)
4. [Field Type Selection Guide](#field-type-selection-guide)
5. [Advanced Configuration Patterns](#advanced-configuration-patterns)
6. [Common Use Cases and Examples](#common-use-cases-and-examples)
7. [Testing and Validation](#testing-and-validation)
8. [Troubleshooting](#troubleshooting)

---

## Understanding the System

### What This System Does

The MCP Data Catalog provides **AI assistants with structured access to tabular data** stored in CSV files. Think of it as a read-only database layer that:

- Exposes your data through standardized MCP tools
- Enforces type safety and schema validation
- Provides filtering and querying capabilities
- Supports hot-reload of configuration changes

### What This System Is NOT

- ❌ A production database replacement
- ❌ A data transformation/ETL tool
- ❌ A write-enabled CRUD system
- ❌ Suitable for large-scale (>100K rows) datasets

### Ideal Use Cases

✅ **Reference Data**
- Code lookup tables
- Product catalogs
- Employee directories
- Configuration data

✅ **Project Context**
- Documentation indexes
- Task lists
- Issue trackers
- Resource inventories

✅ **Hobby/Personal Projects**
- Personal databases
- Collection catalogs
- Research data
- Learning datasets

---

## Is Your Data Suitable?

### Quick Checklist

Answer these questions about your data:

- [ ] Is it **tabular** (rows and columns)?
- [ ] Does it have **consistent structure** (same columns for all rows)?
- [ ] Is it **relatively small** (< 10MB, < 100K rows)?
- [ ] Does it **rarely change** or change in predictable ways?
- [ ] Do you need **read-only access** (not writing/updating)?
- [ ] Can it be represented with **basic types** (string, number, boolean)?

If you answered **YES to most**, your data is suitable!

### Data Volume Guidelines

| Dataset Size | Performance | Recommended |
|--------------|-------------|-------------|
| < 1,000 rows | Excellent (1-2ms) | ✅ Ideal |
| 1,000 - 10,000 rows | Good (5-10ms) | ✅ Good |
| 10,000 - 100,000 rows | Acceptable (10-50ms) | ⚠️ Use with care |
| > 100,000 rows | Slow (50ms+) | ❌ Consider alternatives |

---

## Step-by-Step: From Raw Data to Working Dataset

### Step 1: Analyze Your Data

Before creating any configuration, understand your data structure.

**Example: You have a spreadsheet of books**

```
Title                    | Author           | Year | Genre      | Read  | Rating
-------------------------|------------------|------|------------|-------|--------
The Great Gatsby         | F. Scott Fitzgerald | 1925 | Fiction  | true  | 5
To Kill a Mockingbird    | Harper Lee      | 1960 | Fiction  | true  | 5
1984                     | George Orwell   | 1949 | Dystopian| true  | 4
```

**Key Questions:**
1. What makes each row unique? (Title + Author combination? An ID?)
2. What are the data types? (Year = number, Read = boolean, etc.)
3. What fields have limited values? (Genre might be an enum)
4. What fields will you query/filter on? (Genre, Read status, Rating)

### Step 2: Convert to CSV Format

#### CSV Requirements

1. **UTF-8 encoding**
2. **Header row** (column names)
3. **Consistent columns** (same for every row)
4. **Proper data formatting** (see below)

#### Data Type Formatting Rules

**Strings:**
- Can contain any text
- Quote with double-quotes if containing commas
- Example: `"Smith, John"`, `Simple Text`

**Numbers:**
- No thousands separators
- Use dot for decimal
- Examples: `42`, `3.14`, `-5`, `0.99`

**Booleans:**
- Must be exactly `true` or `false` (lowercase)
- NOT: `yes/no`, `1/0`, `TRUE/FALSE`

**Empty values:**
- Leave blank for optional fields
- Examples: `Alice,,30` (middle field empty)

#### Convert Your Data

**Create `books.csv`:**

```csv
id,title,author,year,genre,read,rating
1,The Great Gatsby,F. Scott Fitzgerald,1925,fiction,true,5
2,To Kill a Mockingbird,Harper Lee,1960,fiction,true,5
3,1984,George Orwell,1949,dystopian,true,4
4,Pride and Prejudice,Jane Austen,1813,romance,false,
5,The Hobbit,J.R.R. Tolkien,1937,fantasy,true,5
```

**Common Mistakes to Avoid:**

❌ **Wrong:**
```csv
id,read,rating
1,yes,five
2,no,4.5 stars
```

✅ **Correct:**
```csv
id,read,rating
1,true,5
2,false,4
```

### Step 3: Create Your Configuration

Now create the JSON configuration that describes your dataset.

#### Basic Configuration Template

```json
{
  "datasets": [
    {
      "id": "YOUR_DATASET_ID",
      "name": "Human-Readable Name",
      "schema": {
        "fields": [
          {
            "name": "field_name",
            "type": "string|number|boolean|enum",
            "required": true|false,
            "values": ["for", "enum", "only"]
          }
        ],
        "visibleFields": ["field1", "field2"]
      },
      "source": {
        "type": "csv",
        "path": "./path/to/file.csv"
      },
      "lookupKey": "id_field",
      "limits": {
        "maxRows": 100,
        "defaultRows": 20
      }
    }
  ]
}
```

#### Complete Books Example

**Create `config/datasets.json`:**

```json
{
  "datasets": [
    {
      "id": "books",
      "name": "Personal Book Collection",
      "schema": {
        "fields": [
          {
            "name": "id",
            "type": "number",
            "required": true
          },
          {
            "name": "title",
            "type": "string",
            "required": true
          },
          {
            "name": "author",
            "type": "string",
            "required": true
          },
          {
            "name": "year",
            "type": "number",
            "required": true
          },
          {
            "name": "genre",
            "type": "enum",
            "values": ["fiction", "non-fiction", "fantasy", "sci-fi", "romance", "dystopian", "mystery"]
          },
          {
            "name": "read",
            "type": "boolean"
          },
          {
            "name": "rating",
            "type": "number"
          }
        ],
        "visibleFields": ["id", "title", "author", "year", "genre", "read", "rating"]
      },
      "source": {
        "type": "csv",
        "path": "./data/books.csv"
      },
      "lookupKey": "id",
      "limits": {
        "maxRows": 200,
        "defaultRows": 25
      }
    }
  ]
}
```

### Step 4: Field-by-Field Configuration

Let's break down each field configuration:

#### Field: `id`

```json
{
  "name": "id",
  "type": "number",
  "required": true
}
```

**Why?**
- Every dataset needs a unique identifier
- `type: "number"` because IDs are numeric (1, 2, 3...)
- `required: true` because every row must have an ID

#### Field: `title`

```json
{
  "name": "title",
  "type": "string",
  "required": true
}
```

**Why?**
- Book titles are text = `string`
- Every book must have a title = `required: true`

#### Field: `genre`

```json
{
  "name": "genre",
  "type": "enum",
  "values": ["fiction", "non-fiction", "fantasy", "sci-fi", "romance", "dystopian", "mystery"]
}
```

**Why?**
- Limited set of predefined categories = `enum`
- `values` array lists all allowed options
- Enables precise filtering: `genre eq "fantasy"`
- Not required (omit `required` if books can have no genre)

#### Field: `read`

```json
{
  "name": "read",
  "type": "boolean"
}
```

**Why?**
- True/false value = `boolean`
- Enables filtering: `read eq true` (find all read books)

#### Field: `rating`

```json
{
  "name": "rating",
  "type": "number"
}
```

**Why?**
- Numeric rating (1-5) = `number`
- Not required (unread books have no rating)

### Step 5: Configure Visibility and Access

#### Visible Fields

```json
"visibleFields": ["id", "title", "author", "year", "genre", "read", "rating"]
```

**Purpose:**
- Controls which fields are accessible in queries
- Hide sensitive/internal fields
- Reduce token usage by limiting exposed data

**Example - Hide Internal Fields:**

```json
"schema": {
  "fields": [
    { "name": "id", "type": "number", "required": true },
    { "name": "internal_code", "type": "string" },
    { "name": "title", "type": "string", "required": true }
  ],
  "visibleFields": ["id", "title"]
}
```

Now `internal_code` exists in the CSV but won't be exposed to queries.

#### Lookup Key

```json
"lookupKey": "id"
```

**Purpose:**
- Enables `get_by_id` tool for direct row retrieval
- Must be a field that uniquely identifies rows
- Common choices: `id`, `sku`, `employee_id`, `isbn`

**Example Query:**
```json
{
  "tool": "get_by_id",
  "arguments": {
    "datasetId": "books",
    "id": "3"
  }
}
```

Returns the book with ID 3 directly.

#### Limits Configuration

```json
"limits": {
  "maxRows": 200,
  "defaultRows": 25
}
```

**Purpose:**
- `maxRows`: Hard ceiling (never return more than this)
- `defaultRows`: Used when query doesn't specify a limit

**Guidelines:**
- Small reference data (< 100 rows): `maxRows: 100`, `defaultRows: 50`
- Medium datasets (100-1000 rows): `maxRows: 500`, `defaultRows: 50`
- Large datasets (1000+ rows): `maxRows: 1000`, `defaultRows: 100`

### Step 6: Test Your Configuration

#### Start the Server

```bash
npm run build
npm run dev
```

Watch for validation errors:

```
✅ Config loaded successfully
✅ Found 1 dataset(s)
✅ Server started
```

If you see errors, check the [Troubleshooting](#troubleshooting) section.

#### Test with MCP Tools

**1. List Datasets:**
```json
{
  "tool": "list_datasets"
}
```

Should show your `books` dataset.

**2. Describe Dataset:**
```json
{
  "tool": "describe_dataset",
  "arguments": {
    "datasetId": "books"
  }
}
```

Verify all fields appear correctly.

**3. Query Data:**
```json
{
  "tool": "query_dataset",
  "arguments": {
    "datasetId": "books",
    "limit": 5
  }
}
```

Should return first 5 books.

**4. Test Filtering:**
```json
{
  "tool": "query_dataset",
  "arguments": {
    "datasetId": "books",
    "filters": {
      "field": "genre",
      "op": "eq",
      "value": "fiction"
    }
  }
}
```

Should return only fiction books.

---

## Field Type Selection Guide

### Decision Tree

```
Is it text data?
├─ YES → type: "string"
└─ NO ↓

Is it a number?
├─ YES → type: "number"
└─ NO ↓

Is it true/false?
├─ YES → type: "boolean"
└─ NO ↓

Does it have a fixed set of values?
├─ YES → type: "enum"
└─ NO → Consider restructuring data
```

### Type: `string`

**Use When:**
- Free-form text (names, descriptions, addresses)
- Identifiers with letters (SKUs like "ABC-123")
- Dates as text (for display only, not filtering)
- Anything that doesn't fit other types

**Examples:**
```json
{ "name": "title", "type": "string" }
{ "name": "email", "type": "string" }
{ "name": "description", "type": "string" }
{ "name": "sku", "type": "string" }
```

**CSV Format:**
```csv
title,email,sku
"The Great Gatsby",alice@example.com,SKU-A001
```

### Type: `number`

**Use When:**
- Integers (IDs, counts, quantities)
- Decimals (prices, ratings, measurements)
- Negative numbers allowed

**Examples:**
```json
{ "name": "id", "type": "number" }
{ "name": "price", "type": "number" }
{ "name": "quantity", "type": "number" }
{ "name": "rating", "type": "number" }
```

**CSV Format:**
```csv
id,price,quantity,rating
1,99.99,5,4.5
2,149.99,0,-1
```

**Important:**
- No commas in numbers: `1000` not `1,000`
- Use dot for decimal: `3.14` not `3,14`

### Type: `boolean`

**Use When:**
- True/false flags (active/inactive, enabled/disabled)
- Yes/no questions (read/unread, paid/unpaid)
- Binary states

**Examples:**
```json
{ "name": "active", "type": "boolean" }
{ "name": "in_stock", "type": "boolean" }
{ "name": "paid", "type": "boolean" }
```

**CSV Format:**
```csv
active,in_stock,paid
true,false,true
false,true,false
```

**Important:**
- Must be lowercase: `true` and `false`
- NOT: `yes/no`, `1/0`, `TRUE/FALSE`, `Yes/No`

### Type: `enum`

**Use When:**
- Fixed set of predefined values
- Categories, statuses, types
- Better than free-text for filtering

**Examples:**
```json
{
  "name": "status",
  "type": "enum",
  "values": ["pending", "processing", "shipped", "delivered"]
}
```

```json
{
  "name": "priority",
  "type": "enum",
  "values": ["low", "medium", "high", "urgent"]
}
```

**CSV Format:**
```csv
status,priority
pending,high
shipped,low
delivered,medium
```

**Important:**
- CSV values must EXACTLY match one value in the `values` array
- Case-sensitive: `admin` ≠ `Admin`
- Must provide non-empty `values` array

**Benefits:**
- Type safety (prevents typos)
- Clear documentation of valid values
- Better AI understanding

---

## Advanced Configuration Patterns

### Pattern 1: Multiple Related Datasets

**Scenario:** You have users and their orders in separate datasets.

```json
{
  "datasets": [
    {
      "id": "users",
      "name": "User Directory",
      "schema": {
        "fields": [
          { "name": "user_id", "type": "number", "required": true },
          { "name": "name", "type": "string", "required": true },
          { "name": "email", "type": "string", "required": true }
        ],
        "visibleFields": ["user_id", "name", "email"]
      },
      "source": {
        "type": "csv",
        "path": "./data/users.csv"
      },
      "lookupKey": "user_id",
      "limits": {
        "maxRows": 100,
        "defaultRows": 20
      }
    },
    {
      "id": "orders",
      "name": "Customer Orders",
      "schema": {
        "fields": [
          { "name": "order_id", "type": "number", "required": true },
          { "name": "user_id", "type": "number", "required": true },
          { "name": "total", "type": "number", "required": true },
          { "name": "status", "type": "enum", "values": ["pending", "completed", "cancelled"] }
        ],
        "visibleFields": ["order_id", "user_id", "total", "status"]
      },
      "source": {
        "type": "csv",
        "path": "./data/orders.csv"
      },
      "lookupKey": "order_id",
      "limits": {
        "maxRows": 500,
        "defaultRows": 50
      }
    }
  ]
}
```

**Usage:**
1. Query orders: `query_dataset` with `datasetId: "orders"`
2. Get user_id from order result
3. Look up user: `get_by_id` with `datasetId: "users"`, `id: user_id`

### Pattern 2: Index + Detail Datasets

**Scenario:** Lightweight index for browsing, detailed dataset for full info.

```json
{
  "datasets": [
    {
      "id": "products-index",
      "name": "Product Index (Light)",
      "schema": {
        "fields": [
          { "name": "id", "type": "number", "required": true },
          { "name": "name", "type": "string", "required": true },
          { "name": "category", "type": "enum", "values": ["electronics", "clothing", "books"] },
          { "name": "in_stock", "type": "boolean" }
        ],
        "visibleFields": ["id", "name", "category", "in_stock"]
      },
      "source": {
        "type": "csv",
        "path": "./data/products-index.csv"
      },
      "lookupKey": "id",
      "limits": {
        "maxRows": 1000,
        "defaultRows": 100
      }
    },
    {
      "id": "products-detail",
      "name": "Product Details (Full)",
      "schema": {
        "fields": [
          { "name": "id", "type": "number", "required": true },
          { "name": "name", "type": "string", "required": true },
          { "name": "description", "type": "string" },
          { "name": "specifications", "type": "string" },
          { "name": "price", "type": "number" },
          { "name": "category", "type": "enum", "values": ["electronics", "clothing", "books"] }
        ],
        "visibleFields": ["id", "name", "description", "specifications", "price", "category"]
      },
      "source": {
        "type": "csv",
        "path": "./data/products-detail.csv"
      },
      "lookupKey": "id",
      "limits": {
        "maxRows": 100,
        "defaultRows": 10
      }
    }
  ]
}
```

**Benefit:** Browse with lightweight index, fetch details only when needed.

### Pattern 3: Hiding Sensitive Fields

**Scenario:** CSV contains sensitive data that shouldn't be exposed.

```json
{
  "id": "employees",
  "name": "Employee Directory",
  "schema": {
    "fields": [
      { "name": "id", "type": "number", "required": true },
      { "name": "name", "type": "string", "required": true },
      { "name": "email", "type": "string", "required": true },
      { "name": "salary", "type": "number" },
      { "name": "ssn", "type": "string" },
      { "name": "department", "type": "enum", "values": ["eng", "sales", "hr"] }
    ],
    "visibleFields": ["id", "name", "email", "department"]
  },
  "source": {
    "type": "csv",
    "path": "./data/employees.csv"
  },
  "lookupKey": "id",
  "limits": {
    "maxRows": 100,
    "defaultRows": 20
  }
}
```

**Result:** `salary` and `ssn` exist in CSV but are not accessible through queries.

### Pattern 4: String Lookup Keys

**Scenario:** Using non-numeric identifiers (SKUs, codes, usernames).

```json
{
  "id": "inventory",
  "name": "Warehouse Inventory",
  "schema": {
    "fields": [
      { "name": "sku", "type": "string", "required": true },
      { "name": "product", "type": "string", "required": true },
      { "name": "quantity", "type": "number", "required": true }
    ],
    "visibleFields": ["sku", "product", "quantity"]
  },
  "source": {
    "type": "csv",
    "path": "./data/inventory.csv"
  },
  "lookupKey": "sku",
  "limits": {
    "maxRows": 500,
    "defaultRows": 50
  }
}
```

**CSV:**
```csv
sku,product,quantity
SKU-A001,Laptop,45
SKU-B002,Mouse,120
```

**Query:**
```json
{
  "tool": "get_by_id",
  "arguments": {
    "datasetId": "inventory",
    "id": "SKU-A001"
  }
}
```

---

## Common Use Cases and Examples

### Use Case 1: Personal Library

**Data:** Book collection with ratings and read status.

**CSV (`books.csv`):**
```csv
id,title,author,year,genre,read,rating
1,Dune,Frank Herbert,1965,sci-fi,true,5
2,Foundation,Isaac Asimov,1951,sci-fi,true,5
3,Neuromancer,William Gibson,1984,cyberpunk,false,
```

**Config:**
```json
{
  "datasets": [
    {
      "id": "books",
      "name": "Personal Library",
      "schema": {
        "fields": [
          { "name": "id", "type": "number", "required": true },
          { "name": "title", "type": "string", "required": true },
          { "name": "author", "type": "string", "required": true },
          { "name": "year", "type": "number" },
          { "name": "genre", "type": "enum", "values": ["sci-fi", "fantasy", "mystery", "non-fiction", "cyberpunk"] },
          { "name": "read", "type": "boolean" },
          { "name": "rating", "type": "number" }
        ],
        "visibleFields": ["id", "title", "author", "year", "genre", "read", "rating"]
      },
      "source": {
        "type": "csv",
        "path": "./data/books.csv"
      },
      "lookupKey": "id",
      "limits": {
        "maxRows": 500,
        "defaultRows": 50
      }
    }
  ]
}
```

**Queries:**
- Find unread books: `read eq false`
- Find sci-fi books: `genre eq "sci-fi"`
- Find highly-rated books: (Not supported in MVP, need `gt` operator)

### Use Case 2: Recipe Database

**Data:** Cooking recipes with ingredients and prep time.

**CSV (`recipes.csv`):**
```csv
id,name,cuisine,prep_time_mins,difficulty,vegetarian,main_ingredient
1,Pasta Carbonara,italian,30,medium,false,pasta
2,Chicken Tikka Masala,indian,45,hard,false,chicken
3,Greek Salad,greek,15,easy,true,vegetables
```

**Config:**
```json
{
  "datasets": [
    {
      "id": "recipes",
      "name": "Recipe Collection",
      "schema": {
        "fields": [
          { "name": "id", "type": "number", "required": true },
          { "name": "name", "type": "string", "required": true },
          { "name": "cuisine", "type": "enum", "values": ["italian", "indian", "greek", "chinese", "mexican", "american"] },
          { "name": "prep_time_mins", "type": "number" },
          { "name": "difficulty", "type": "enum", "values": ["easy", "medium", "hard"] },
          { "name": "vegetarian", "type": "boolean" },
          { "name": "main_ingredient", "type": "string" }
        ],
        "visibleFields": ["id", "name", "cuisine", "prep_time_mins", "difficulty", "vegetarian", "main_ingredient"]
      },
      "source": {
        "type": "csv",
        "path": "./data/recipes.csv"
      },
      "lookupKey": "id",
      "limits": {
        "maxRows": 200,
        "defaultRows": 25
      }
    }
  ]
}
```

**Queries:**
- Find vegetarian recipes: `vegetarian eq true`
- Find easy recipes: `difficulty eq "easy"`
- Find Italian vegetarian recipes: Use `and` filter

### Use Case 3: Project Task Tracker

**Data:** Development tasks with status and priority.

**CSV (`tasks.csv`):**
```csv
id,title,status,priority,assigned_to,story_points,completed
1,Implement login,in-progress,high,Alice,5,false
2,Fix bug in API,pending,urgent,Bob,3,false
3,Write documentation,done,low,Charlie,2,true
```

**Config:**
```json
{
  "datasets": [
    {
      "id": "tasks",
      "name": "Development Tasks",
      "schema": {
        "fields": [
          { "name": "id", "type": "number", "required": true },
          { "name": "title", "type": "string", "required": true },
          { "name": "status", "type": "enum", "values": ["pending", "in-progress", "done", "blocked"] },
          { "name": "priority", "type": "enum", "values": ["low", "medium", "high", "urgent"] },
          { "name": "assigned_to", "type": "string" },
          { "name": "story_points", "type": "number" },
          { "name": "completed", "type": "boolean" }
        ],
        "visibleFields": ["id", "title", "status", "priority", "assigned_to", "story_points", "completed"]
      },
      "source": {
        "type": "csv",
        "path": "./data/tasks.csv"
      },
      "lookupKey": "id",
      "limits": {
        "maxRows": 500,
        "defaultRows": 50
      }
    }
  ]
}
```

**Queries:**
- Find pending tasks: `status eq "pending"`
- Find urgent tasks: `priority eq "urgent"`
- Find Alice's tasks: `assigned_to eq "Alice"`
- Find incomplete urgent tasks: Use `and` filter

### Use Case 4: Equipment Inventory

**Data:** Office equipment with location and status.

**CSV (`equipment.csv`):**
```csv
asset_id,name,type,location,condition,checked_out,assigned_to
EQ-001,Dell Laptop,laptop,office-a,good,true,john.doe
EQ-002,Monitor 27",monitor,office-a,excellent,false,
EQ-003,Wireless Mouse,peripheral,storage,good,false,
```

**Config:**
```json
{
  "datasets": [
    {
      "id": "equipment",
      "name": "Office Equipment",
      "schema": {
        "fields": [
          { "name": "asset_id", "type": "string", "required": true },
          { "name": "name", "type": "string", "required": true },
          { "name": "type", "type": "enum", "values": ["laptop", "desktop", "monitor", "peripheral", "furniture"] },
          { "name": "location", "type": "string" },
          { "name": "condition", "type": "enum", "values": ["excellent", "good", "fair", "poor"] },
          { "name": "checked_out", "type": "boolean" },
          { "name": "assigned_to", "type": "string" }
        ],
        "visibleFields": ["asset_id", "name", "type", "location", "condition", "checked_out", "assigned_to"]
      },
      "source": {
        "type": "csv",
        "path": "./data/equipment.csv"
      },
      "lookupKey": "asset_id",
      "limits": {
        "maxRows": 300,
        "defaultRows": 30
      }
    }
  ]
}
```

**Queries:**
- Find available equipment: `checked_out eq false`
- Find laptops: `type eq "laptop"`
- Find items in office-a: `location eq "office-a"`

---

## Testing and Validation

### Pre-Flight Checklist

Before starting the server, verify:

- [ ] CSV file exists at specified path
- [ ] CSV has header row matching field names
- [ ] All data types formatted correctly
- [ ] Enum values in CSV match config `values` array
- [ ] Boolean fields use `true`/`false` (lowercase)
- [ ] Numbers don't have commas or currency symbols
- [ ] Field names are valid identifiers (alphanumeric + underscore)
- [ ] Dataset IDs are unique
- [ ] `lookupKey` references an existing field
- [ ] All `visibleFields` reference existing fields

### Validation Process

**1. Syntax Check**
```bash
# Validate JSON syntax
cat config/datasets.json | json_pp
```

**2. Start Server**
```bash
npm run build
npm run dev
```

Watch for errors in console output.

**3. Test Tools**

Run through all tools:

```json
// Test 1: List datasets
{ "tool": "list_datasets" }

// Test 2: Describe
{
  "tool": "describe_dataset",
  "arguments": { "datasetId": "YOUR_ID" }
}

// Test 3: Query all
{
  "tool": "query_dataset",
  "arguments": {
    "datasetId": "YOUR_ID",
    "limit": 10
  }
}

// Test 4: Test filtering
{
  "tool": "query_dataset",
  "arguments": {
    "datasetId": "YOUR_ID",
    "filters": {
      "field": "your_field",
      "op": "eq",
      "value": "test_value"
    }
  }
}

// Test 5: Get by ID
{
  "tool": "get_by_id",
  "arguments": {
    "datasetId": "YOUR_ID",
    "id": "1"
  }
}
```

### Common Validation Errors

**Error: "Field name must be a valid identifier"**
- Field names must start with letter or underscore
- Can only contain letters, numbers, underscores
- ❌ Bad: `"first-name"`, `"2nd_place"`, `"@email"`
- ✅ Good: `"first_name"`, `"second_place"`, `"email"`

**Error: "Enum fields must have non-empty 'values' array"**
```json
// ❌ Wrong
{ "name": "status", "type": "enum" }

// ✅ Correct
{ "name": "status", "type": "enum", "values": ["active", "inactive"] }
```

**Error: "keyField must exist in fields array"**
```json
// ❌ Wrong - lookupKey references non-existent field
"lookupKey": "user_id",
"fields": [
  { "name": "id", "type": "number" }
]

// ✅ Correct
"lookupKey": "id",
"fields": [
  { "name": "id", "type": "number" }
]
```

**Error: "All visibleFields must exist in fields array"**
```json
// ❌ Wrong - references non-existent field
"visibleFields": ["id", "name", "email"],
"fields": [
  { "name": "id", "type": "number" },
  { "name": "name", "type": "string" }
]

// ✅ Correct
"visibleFields": ["id", "name"],
"fields": [
  { "name": "id", "type": "number" },
  { "name": "name", "type": "string" }
]
```

---

## Troubleshooting

### Problem: Server won't start

**Symptoms:**
- Error messages on startup
- Server exits immediately

**Solutions:**

1. **Check JSON syntax**
   ```bash
   # On Windows
   type config\datasets.json | python -m json.tool
   
   # On Linux/Mac
   cat config/datasets.json | python -m json.tool
   ```

2. **Verify file paths**
   - Paths are relative to project root
   - Use forward slashes `/` or escaped backslashes `\\`
   - Check CSV files exist at specified paths

3. **Review error messages**
   - Server provides detailed validation errors
   - Fix issues one at a time
   - Restart after each fix

### Problem: Dataset not appearing

**Check:**
- Dataset ID is unique
- Config file saved properly
- Server restarted (if not using hot reload)
- No validation errors in console

### Problem: Queries return no results

**Possible causes:**

1. **CSV file is empty or has only headers**
   - Verify CSV has data rows
   - Check file encoding (must be UTF-8)

2. **Filters don't match data**
   - Verify field names are correct
   - Check values match exactly (case-sensitive for strings)
   - Ensure enum values match configuration

3. **Field not in visibleFields**
   - Check field is listed in `visibleFields` array
   - Add field if needed and reload config

### Problem: Type validation errors

**Error: "Expected number, got string"**

CSV has:
```csv
id,price
1,"99.99"
```

Should be:
```csv
id,price
1,99.99
```

Numbers should NOT be quoted in CSV.

**Error: "Expected boolean, got string"**

CSV has:
```csv
id,active
1,yes
```

Should be:
```csv
id,active
1,true
```

Must use lowercase `true` or `false`.

**Error: "Invalid enum value"**

CSV has:
```csv
id,status
1,Active
```

Config has:
```json
{ "name": "status", "type": "enum", "values": ["active", "inactive"] }
```

Enum is case-sensitive. CSV should have `active` not `Active`.

### Problem: Hot reload not working

**Check:**
- Config file path is correct
- File system permissions allow reading
- Look for reload confirmation in logs
- Invalid configs are rejected (keeps old config)

**Workaround:**
- Manually restart server if hot reload fails
- Check for syntax errors in new config

### Problem: Performance issues

**Symptoms:**
- Slow query responses
- High memory usage

**Solutions:**

1. **Reduce dataset size**
   - Split large CSVs into multiple datasets
   - Use index/detail pattern

2. **Limit visible fields**
   - Only expose necessary fields
   - Reduces data transferred

3. **Adjust row limits**
   - Lower `defaultRows` and `maxRows`
   - Encourage more specific queries

4. **Consider alternatives**
   - For datasets > 100K rows
   - Consider database-backed MCP servers

### Problem: CSV encoding issues

**Symptoms:**
- Special characters display incorrectly
- Server errors on CSV load

**Solution:**
- Save CSV as UTF-8 encoding
- Most spreadsheet tools have "Save As UTF-8 CSV" option
- Avoid special characters if possible

### Getting Help

If you're still stuck:

1. **Review examples**
   - Check `examples/` directory
   - Compare your config to working examples

2. **Check documentation**
   - Main README.md
   - examples/config/README.md
   - docs/dev/mcp-data-catalog.md

3. **Validate step by step**
   - Start with minimal.json example
   - Add your data gradually
   - Test after each change

---

## Best Practices Summary

### Configuration Design

✅ **Do:**
- Use descriptive dataset IDs and names
- Document purpose in `name` field
- Only expose needed fields in `visibleFields`
- Use enums for categorical data
- Set reasonable row limits
- Keep configs organized and commented (add comments in separate docs)

❌ **Don't:**
- Mix different entities in one dataset
- Expose sensitive data unnecessarily
- Set extremely high row limits
- Use free-text where enums would work
- Create giant monolithic datasets

### CSV Best Practices

✅ **Do:**
- Use consistent column names
- Format data types correctly
- Include header row
- Use UTF-8 encoding
- Keep files under 10MB
- Use meaningful identifiers

❌ **Don't:**
- Mix data types in columns
- Use special formatting (colors, fonts)
- Include formula cells
- Use merged cells
- Embed images or objects
- Use inconsistent values for enums

### Workflow Tips

1. **Start small** - Begin with minimal example
2. **Test early** - Validate after each change
3. **Use examples** - Copy and modify working configs
4. **Document** - Add descriptive names and maintain external docs
5. **Iterate** - Refine based on usage patterns

---

## Quick Reference

### Minimum Valid Config

```json
{
  "datasets": [
    {
      "id": "my_data",
      "name": "My Dataset",
      "schema": {
        "fields": [
          { "name": "id", "type": "number", "required": true }
        ],
        "visibleFields": ["id"]
      },
      "source": {
        "type": "csv",
        "path": "./data/my_data.csv"
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

### All Field Type Examples

```json
{
  "fields": [
    { "name": "id", "type": "number", "required": true },
    { "name": "name", "type": "string", "required": true },
    { "name": "active", "type": "boolean" },
    { "name": "status", "type": "enum", "values": ["new", "active", "archived"] }
  ]
}
```

### Filter Examples

```json
// Equal
{ "field": "status", "op": "eq", "value": "active" }

// Contains (case-insensitive)
{ "field": "name", "op": "contains", "value": "smith" }

// And (multiple conditions)
{
  "and": [
    { "field": "status", "op": "eq", "value": "active" },
    { "field": "priority", "op": "eq", "value": "high" }
  ]
}
```

---

## Next Steps

Now that you understand how to create datasets:

1. **Try the examples** - Start with `examples/config/minimal.json`
2. **Create your own** - Follow the step-by-step guide
3. **Explore features** - Test filtering, limits, multiple datasets
4. **Read advanced docs** - Check `docs/dev/mcp-data-catalog.md`
5. **Integrate with AI** - Connect to Claude or other MCP clients

---

## Additional Resources

- **[Main README](../../README.md)** - Overview and quick start
- **[Example Configurations](../../examples/config/README.md)** - Config field reference
- **[Developer Guide](../dev/mcp-data-catalog.md)** - Architecture details
- **[Example Datasets](../../examples/README.md)** - Sample data and use cases

---

**Happy cataloging! 📊**
