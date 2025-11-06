# Changelog

All notable changes to this project will be documented in this file.

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
