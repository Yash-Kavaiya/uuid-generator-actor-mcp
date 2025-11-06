# UUID Generator Actor

Generate universally unique identifiers (UUIDs) on demand through Apify's platform. This Actor supports multiple UUID versions including v1 (timestamp-based), v4 (random), and v5 (namespace-based), catering to a wide range of application needs.

## Features

### Bulk UUID Generation
Generate from 1 to 100,000 unique identifiers in a single run, perfect for seeding databases, testing applications, or generating unique keys at scale.

### Multiple UUID Version Support
- **Version 1 (Timestamp-based)**: Generates UUIDs using a timestamp and MAC address
- **Version 4 (Random)**: Generates truly random UUIDs (most commonly used)
- **Version 5 (Namespace-based SHA-1)**: Generates deterministic UUIDs from a namespace and name

### Customizable Output Formats
Export your generated UUIDs in multiple formats:
- **JSON**: Structured data with optional metadata (version, timestamp, format)
- **CSV**: Comma-separated values for easy spreadsheet import
- **Plain Text**: One UUID per line for simple integration

### Configurable Parameters
- Set namespace specifications for UUID v5
- Choose quantity limits (1-100,000 UUIDs)
- Toggle uppercase formatting
- Remove dashes for compact format
- Include/exclude metadata

## Use Cases

This Actor is designed for:

- **Software Developers**: Building applications that require unique identifiers
- **Database Administrators**: Managing large-scale data systems
- **API Developers**: Creating microservices architectures
- **QA Testers**: Needing test data with unique identifiers
- **System Integrators**: Working on distributed applications

## Input Configuration

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `uuidVersion` | String | UUID version to generate: `v1`, `v4`, or `v5` |
| `count` | Integer | Number of UUIDs to generate (1-100,000) |
| `outputFormat` | String | Output format: `json`, `csv`, or `text` |

### Optional Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `namespace` | String | `DNS` | Namespace for UUID v5 (DNS, URL, OID, X500, or custom UUID) |
| `name` | String | - | Name to hash with namespace (required for v5) |
| `includeMetadata` | Boolean | `true` | Include metadata in JSON output |
| `uppercase` | Boolean | `false` | Output UUIDs in uppercase |
| `removeDashes` | Boolean | `false` | Remove dashes from UUID output |

## Examples

### Generate 10 Random UUIDs (v4)

```json
{
  "uuidVersion": "v4",
  "count": 10,
  "outputFormat": "json",
  "includeMetadata": true
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
  },
  ...
]
```

### Generate Namespace-Based UUIDs (v5)

```json
{
  "uuidVersion": "v5",
  "count": 1,
  "namespace": "DNS",
  "name": "example.com",
  "outputFormat": "json"
}
```

**Output:**
```json
[
  {
    "uuid": "cfbff0d1-9375-5685-968c-48ce8b15ae17",
    "version": "v5",
    "timestamp": "2025-11-06T10:30:00.000Z",
    "format": "standard"
  }
]
```

### Generate Compact UUIDs Without Dashes

```json
{
  "uuidVersion": "v4",
  "count": 5,
  "outputFormat": "text",
  "removeDashes": true,
  "uppercase": true
}
```

**Output (OUTPUT.txt):**
```
F47AC10B58CC4372A5670E02B2C3D479
8B3E8F7A5D9C4B2A9F1E6D8C7B5A4E3D
A1B2C3D4E5F67890A1B2C3D4E5F67890
...
```

### Generate CSV Format for Database Import

```json
{
  "uuidVersion": "v4",
  "count": 100,
  "outputFormat": "csv",
  "includeMetadata": true
}
```

**Output (OUTPUT.csv):**
```csv
uuid,version,timestamp,format
f47ac10b-58cc-4372-a567-0e02b2c3d479,v4,2025-11-06T10:30:00.000Z,standard
8b3e8f7a-5d9c-4b2a-9f1e-6d8c7b5a4e3d,v4,2025-11-06T10:30:00.000Z,standard
...
```

## Output

The Actor saves generated UUIDs to:

1. **Apify Dataset**: All UUIDs are automatically saved to the default dataset
2. **Key-Value Store**: Based on selected format:
   - JSON: `OUTPUT` key
   - CSV: `OUTPUT.csv` key
   - Plain Text: `OUTPUT.txt` key

## UUID Versions Explained

### Version 1 (Timestamp-based)
- Uses current timestamp and MAC address
- Sortable by creation time
- Can leak information about when/where UUID was generated
- Example: `6fa459ea-ee8a-11ed-a05b-0242ac120003`

### Version 4 (Random)
- Completely random (122 bits of randomness)
- Most commonly used version
- No information leakage
- Example: `f47ac10b-58cc-4372-a567-0e02b2c3d479`

### Version 5 (Namespace-based)
- Generated from namespace UUID + name using SHA-1
- Deterministic (same input = same UUID)
- Useful for generating consistent IDs
- Example: `cfbff0d1-9375-5685-968c-48ce8b15ae17`

**Predefined Namespaces:**
- `DNS`: For domain names
- `URL`: For URLs
- `OID`: For ISO OIDs
- `X500`: For X.500 DNs

## Best Practices

1. **Use UUID v4 for most cases**: Random UUIDs are suitable for general-purpose unique identifiers
2. **Use UUID v5 for consistency**: When you need the same input to generate the same UUID
3. **Batch generation**: Generate UUIDs in bulk for better performance
4. **Choose appropriate format**:
   - JSON for metadata and structured data
   - CSV for database imports
   - Plain text for simple scripts

## Performance

- Generates up to 100,000 UUIDs per run
- Fast generation with minimal memory footprint
- Progress logging for batches > 1,000 UUIDs
- Optimized for both small and large-scale generation

## Integration

### Using with Apify API

```javascript
const { ApifyClient } = require('apify-client');

const client = new ApifyClient({
    token: 'YOUR_API_TOKEN',
});

const input = {
    uuidVersion: 'v4',
    count: 100,
    outputFormat: 'json',
};

const run = await client.actor('YOUR_ACTOR_ID').call(input);
const { items } = await client.dataset(run.defaultDatasetId).listItems();

console.log(items);
```

### Using with Apify SDK

```javascript
import { Actor } from 'apify';

await Actor.main(async () => {
    const run = await Actor.call('YOUR_ACTOR_ID', {
        uuidVersion: 'v4',
        count: 50,
        outputFormat: 'json',
    });

    const dataset = await Actor.openDataset(run.defaultDatasetId);
    const { items } = await dataset.getData();

    console.log(items);
});
```

## Error Handling

The Actor includes comprehensive error handling:

- Validates input parameters
- Warns about duplicate v5 UUIDs (same namespace + name)
- Validates custom namespace UUIDs
- Provides clear error messages

## Compliance

- Follows RFC 4122 standard for UUID generation
- Ensures uniqueness according to specification
- Compatible with all UUID-compliant systems

## Support & Contribution

For issues, questions, or contributions:
- Report issues on [GitHub](https://github.com/Yash-Kavaiya/uuid-generator-actor-mcp/issues)
- Contribute via pull requests
- Star the repository if you find it useful

## License

Apache-2.0

## Keywords

uuid, guid, identifier, generator, apify, actor, unique-id, v1, v4, v5, random, timestamp, namespace

---

**Note**: This Actor is production-ready and follows Apify best practices for Actor development. It's designed to be reliable, scalable, and easy to integrate with your existing workflows.
