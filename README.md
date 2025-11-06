# UUID Generator Actor with MCP Server

A comprehensive UUID toolkit for the Apify platform with Model Context Protocol (MCP) server integration. Generate, validate, analyze, and manage universally unique identifiers (UUIDs) with support for multiple UUID versions and advanced operations.

## Features

### Core Operations

1. **Generate** - Create UUIDs in bulk with multiple version support
2. **Validate** - Check if a UUID is valid and identify its version
3. **Analyze** - Extract detailed information from UUIDs (version, variant, timestamp, format)
4. **Convert** - Transform UUIDs between different formats
5. **Batch Validate** - Validate multiple UUIDs at once
6. **Batch Analyze** - Analyze multiple UUIDs with statistics
7. **Check Collisions** - Find duplicate UUIDs in collections
8. **Statistics** - Generate comprehensive UUID statistics

### UUID Version Support

- **Version 1 (v1)**: Timestamp-based UUIDs with MAC address
- **Version 4 (v4)**: Random UUIDs (most common)
- **Version 5 (v5)**: Namespace-based UUIDs using SHA-1

### Output Formats

- **JSON**: Structured data with full metadata support
- **CSV**: Comma-separated values for database imports
- **Plain Text**: One UUID per line for simple integration

### MCP Server Integration

Built-in Model Context Protocol server for AI agent integration. Allows AI assistants (like Claude, GPT, etc.) to directly access UUID operations as tools.

## Quick Start

### As an Apify Actor

```javascript
const { ApifyClient } = require('apify-client');

const client = new ApifyClient({ token: 'YOUR_API_TOKEN' });

const run = await client.actor('YOUR_ACTOR_ID').call({
    operation: 'generate',
    uuidVersion: 'v4',
    count: 100,
    outputFormat: 'json',
});
```

### As an MCP Server

Configure in your MCP settings:

```json
{
  "mcpServers": {
    "uuid-generator": {
      "command": "npx",
      "args": ["-y", "uuid-generator-actor", "mcp"]
    }
  }
}
```

## Operations

### 1. Generate UUIDs

Create UUIDs in bulk with specified version and formatting options.

**Input:**
```json
{
  "operation": "generate",
  "uuidVersion": "v4",
  "count": 10,
  "outputFormat": "json",
  "includeMetadata": true,
  "uppercase": false,
  "removeDashes": false
}
```

**Output:**
```json
[
  {
    "uuid": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "version": "v4",
    "timestamp": "2025-11-06T10:30:00.000Z",
    "format": "standard"
  }
]
```

### 2. Validate UUID

Check if a UUID is valid and get its version.

**Input:**
```json
{
  "operation": "validate",
  "uuid": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "outputFormat": "json"
}
```

**Output:**
```json
{
  "uuid": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "valid": true,
  "version": 4,
  "message": "Valid UUID version 4"
}
```

### 3. Analyze UUID

Extract detailed information including version, variant, format, and timestamp (for v1).

**Input:**
```json
{
  "operation": "analyze",
  "uuid": "6fa459ea-ee8a-11ed-a05b-0242ac120003",
  "outputFormat": "json"
}
```

**Output:**
```json
{
  "valid": true,
  "uuid": "6fa459ea-ee8a-11ed-a05b-0242ac120003",
  "version": 1,
  "format": "standard",
  "variant": "RFC 4122",
  "type": "timestamp-based",
  "timestamp": {
    "iso": "2023-04-20T15:30:42.000Z",
    "unix": 1682005842000,
    "raw": "138967806420000000"
  }
}
```

### 4. Convert Format

Transform UUIDs between different formats (standard/compact, upper/lowercase).

**Input:**
```json
{
  "operation": "convert",
  "uuid": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "uppercase": true,
  "removeDashes": true,
  "outputFormat": "json"
}
```

**Output:**
```json
{
  "original": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "converted": "F47AC10B58CC4372A5670E02B2C3D479",
  "options": {
    "uppercase": true,
    "removeDashes": true
  }
}
```

### 5. Batch Validate

Validate multiple UUIDs at once.

**Input:**
```json
{
  "operation": "batch_validate",
  "uuids": [
    "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "invalid-uuid",
    "8b3e8f7a-5d9c-4b2a-9f1e-6d8c7b5a4e3d"
  ],
  "outputFormat": "json"
}
```

**Output:**
```json
{
  "total": 3,
  "valid": 2,
  "invalid": 1,
  "results": [
    {
      "uuid": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "valid": true,
      "version": 4
    },
    {
      "uuid": "invalid-uuid",
      "valid": false,
      "version": null
    },
    {
      "uuid": "8b3e8f7a-5d9c-4b2a-9f1e-6d8c7b5a4e3d",
      "valid": true,
      "version": 4
    }
  ]
}
```

### 6. Batch Analyze

Analyze multiple UUIDs with version breakdown.

**Input:**
```json
{
  "operation": "batch_analyze",
  "uuids": [
    "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "6fa459ea-ee8a-11ed-a05b-0242ac120003"
  ],
  "outputFormat": "json"
}
```

**Output:**
```json
{
  "total": 2,
  "valid": 2,
  "invalid": 0,
  "versionBreakdown": {
    "1": 1,
    "4": 1
  },
  "results": [...]
}
```

### 7. Check Collisions

Find duplicate UUIDs in a collection.

**Input:**
```json
{
  "operation": "check_collisions",
  "uuids": [
    "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "8b3e8f7a-5d9c-4b2a-9f1e-6d8c7b5a4e3d",
    "f47ac10b-58cc-4372-a567-0e02b2c3d479"
  ],
  "outputFormat": "json"
}
```

**Output:**
```json
{
  "total": 3,
  "unique": 2,
  "duplicates": 1,
  "collisions": [
    {
      "uuid": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "index": 2
    }
  ]
}
```

### 8. Generate Statistics

Get comprehensive statistics about UUID collections.

**Input:**
```json
{
  "operation": "statistics",
  "uuids": [
    "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "6fa459ea-ee8a-11ed-a05b-0242ac120003",
    "cfbff0d1-9375-5685-968c-48ce8b15ae17"
  ],
  "outputFormat": "json"
}
```

**Output:**
```json
{
  "total": 3,
  "versions": {
    "1": 1,
    "4": 1,
    "5": 1
  },
  "formats": {
    "standard": 3,
    "compact": 0
  },
  "variants": {
    "RFC 4122": 3
  }
}
```

## MCP Server Tools

When running as an MCP server, the following tools are available to AI agents:

- `generate_uuid` - Generate UUIDs with version and format options
- `validate_uuid` - Validate a single UUID
- `analyze_uuid` - Analyze UUID and extract details
- `convert_uuid_format` - Convert UUID format
- `batch_validate` - Validate multiple UUIDs
- `batch_analyze` - Analyze multiple UUIDs
- `check_collisions` - Find duplicates
- `generate_statistics` - Generate UUID statistics

### MCP Server Usage

Start the MCP server:

```bash
npm run mcp
```

Or install globally and run:

```bash
npm install -g uuid-generator-actor
uuid-generator-mcp
```

## Configuration

### Input Schema

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `operation` | String | `generate` | Operation to perform |
| `uuidVersion` | String | `v4` | UUID version (v1, v4, v5) |
| `count` | Integer | `10` | Number of UUIDs to generate (1-100,000) |
| `namespace` | String | `DNS` | Namespace for v5 (DNS, URL, OID, X500, or custom) |
| `name` | String | - | Name for v5 hashing (required for v5) |
| `uuid` | String | - | Single UUID for validate/analyze/convert |
| `uuids` | Array | - | Multiple UUIDs for batch operations |
| `outputFormat` | String | `json` | Output format (json, csv, text) |
| `includeMetadata` | Boolean | `true` | Include metadata in JSON output |
| `uppercase` | Boolean | `false` | Output in uppercase |
| `removeDashes` | Boolean | `false` | Remove dashes (compact format) |

### Predefined Namespaces (UUID v5)

- `DNS` - For domain names (6ba7b810-9dad-11d1-80b4-00c04fd430c8)
- `URL` - For URLs (6ba7b811-9dad-11d1-80b4-00c04fd430c8)
- `OID` - For ISO OIDs (6ba7b812-9dad-11d1-80b4-00c04fd430c8)
- `X500` - For X.500 DNs (6ba7b814-9dad-11d1-80b4-00c04fd430c8)

## Use Cases

### Software Development
- Generate unique IDs for database records
- Create session tokens
- Generate unique filenames
- API key generation

### Testing & QA
- Generate test data with unique identifiers
- Validate UUID fields in APIs
- Test UUID collision resistance
- Performance testing with bulk UUID generation

### Data Management
- Database record identification
- Distributed system node IDs
- File versioning systems
- Message queue identifiers

### Analysis & Auditing
- Validate UUID compliance in datasets
- Analyze UUID version distribution
- Detect duplicate identifiers
- Generate UUID usage reports

## API Integration

### Using Apify Client

```javascript
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: process.env.APIFY_TOKEN });

// Generate UUIDs
const generateRun = await client.actor('YOUR_ACTOR_ID').call({
  operation: 'generate',
  uuidVersion: 'v4',
  count: 1000,
  outputFormat: 'json'
});

const dataset = await client.dataset(generateRun.defaultDatasetId).listItems();
console.log(dataset.items);
```

### Using Apify SDK

```javascript
import { Actor } from 'apify';

// Call the UUID Generator Actor
const run = await Actor.call('YOUR_ACTOR_ID', {
  operation: 'validate',
  uuid: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
});

// Get results
const { items } = await Actor.openDataset(run.defaultDatasetId).getData();
console.log(items[0]);
```

## Performance

- **Generation**: Up to 100,000 UUIDs per run
- **Validation**: Handles large batches efficiently
- **Memory**: Optimized for minimal memory footprint
- **Progress Logging**: Real-time updates for batches > 1,000 items

## Best Practices

1. **Use UUID v4 for general purposes** - Random UUIDs are suitable for most use cases
2. **Use UUID v5 for deterministic generation** - When you need the same input to produce the same UUID
3. **Use UUID v1 for sortable identifiers** - When time-ordering is important
4. **Batch operations for efficiency** - Process multiple UUIDs in a single run
5. **Choose appropriate output format**:
   - JSON for metadata and structured data
   - CSV for database imports
   - Text for simple scripts and piping

## RFC 4122 Compliance

This Actor follows RFC 4122 standards:
- Correct version bits in all generated UUIDs
- Proper variant field encoding
- Standard formatting (8-4-4-4-12 hex digits)
- Cryptographically secure random generation for v4

## Error Handling

The Actor includes comprehensive error handling:
- Input validation with clear error messages
- UUID format validation
- Version-specific requirement checks
- Graceful handling of invalid inputs

## Installation

### Local Installation

```bash
git clone https://github.com/Yash-Kavaiya/uuid-generator-actor-mcp.git
cd uuid-generator-actor-mcp
npm install
```

### Running Locally

```bash
# As Apify Actor
npm start

# As MCP Server
npm run mcp
```

## Examples

See the `.actor/input_examples/` directory for complete example configurations for all operations.

## Support & Contribution

- **Report Issues**: [GitHub Issues](https://github.com/Yash-Kavaiya/uuid-generator-actor-mcp/issues)
- **Contribute**: Pull requests welcome
- **Documentation**: [Full API Documentation](https://docs.apify.com)

## License

Apache-2.0

## Keywords

uuid, guid, identifier, generator, apify, actor, mcp, model-context-protocol, validation, analysis, batch-operations, unique-id, v1, v4, v5, random, timestamp, namespace, collision-detection

---

**Production Ready** - This Actor follows Apify best practices and is designed for reliability, scalability, and easy integration with your existing workflows and AI agents.
