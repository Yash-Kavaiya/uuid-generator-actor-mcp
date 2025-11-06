# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2025-11-06

### Added - Major Feature Release

#### New Operations
- **Validate** - Check if a UUID is valid and identify its version
- **Analyze** - Extract detailed UUID information (version, variant, timestamp for v1, format)
- **Convert** - Transform UUIDs between different formats (standard/compact, upper/lowercase)
- **Batch Validate** - Validate multiple UUIDs in a single operation
- **Batch Analyze** - Analyze multiple UUIDs with comprehensive statistics
- **Check Collisions** - Detect duplicate UUIDs in collections
- **Statistics** - Generate detailed statistics about UUID collections

#### MCP Server Integration
- Full Model Context Protocol (MCP) server implementation
- 8 MCP tools for AI agent integration:
  - `generate_uuid`
  - `validate_uuid`
  - `analyze_uuid`
  - `convert_uuid_format`
  - `batch_validate`
  - `batch_analyze`
  - `check_collisions`
  - `generate_statistics`
- MCP configuration file for easy integration
- Support for stdio transport

#### Advanced UUID Analysis
- UUID version detection and validation
- Variant identification (RFC 4122, NCS, Microsoft, Reserved)
- Timestamp extraction from UUID v1 with multiple formats (ISO, Unix, raw)
- Format detection (standard vs compact)
- Comprehensive UUID parsing utilities

#### Utilities Module
- `validateUUID()` - Validate UUID strings
- `getUUIDVersion()` - Get UUID version number
- `analyzeUUID()` - Full UUID analysis with metadata
- `convertUUIDFormat()` - Format conversion utility
- `checkCollisions()` - Duplicate detection
- `batchValidate()` - Batch validation with statistics
- `batchAnalyze()` - Batch analysis with version breakdown
- `generateStatistics()` - Comprehensive statistics generation

#### Enhanced Input Schema
- Operation selector for all 8 operations
- Support for single UUID operations
- Support for batch UUID operations with arrays
- Improved field descriptions and help text
- Better validation and error messages

### Changed
- Upgraded version from 1.0.0 to 2.0.0
- Refactored main.js with operation handlers
- Enhanced export functionality for all data types
- Improved CSV export with better escaping
- Updated README with comprehensive documentation for all features

### Enhanced
- Better error handling across all operations
- Improved progress logging
- More detailed output metadata
- Enhanced validation messages
- Better type checking

### Documentation
- Comprehensive README covering all 8 operations
- MCP server usage guide
- API integration examples
- Input/output examples for each operation
- Best practices and use cases
- RFC 4122 compliance notes

### Examples
- Added validate-uuid.json example
- Added analyze-uuid.json example
- Added convert-uuid.json example
- Added batch-validate.json example
- Added check-collisions.json example
- Added statistics.json example

## [1.0.0] - 2025-11-06

### Added
- Initial release of UUID Generator Actor
- Support for UUID v1 (timestamp-based generation)
- Support for UUID v4 (random generation)
- Support for UUID v5 (namespace-based generation with SHA-1)
- Bulk generation capability (1-100,000 UUIDs per run)
- Multiple output formats: JSON, CSV, and plain text
- Configurable UUID formatting (uppercase, remove dashes)
- Metadata inclusion option for JSON output
- Predefined namespace support (DNS, URL, OID, X500)
- Custom namespace UUID support for v5
- Comprehensive input validation
- Progress logging for large batches
- Example input configurations
- Full documentation and usage examples

### Features
- RFC 4122 compliant UUID generation
- Apify dataset integration
- Key-Value Store export in multiple formats
- Error handling and validation
- Performance optimized for high-volume generation
