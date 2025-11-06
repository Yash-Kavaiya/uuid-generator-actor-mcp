import { validate, version, parse } from 'uuid';

/**
 * Validate a UUID string
 */
export function validateUUID(uuid) {
    try {
        return validate(uuid);
    } catch (error) {
        return false;
    }
}

/**
 * Get UUID version
 */
export function getUUIDVersion(uuid) {
    try {
        if (!validate(uuid)) {
            return null;
        }
        return version(uuid);
    } catch (error) {
        return null;
    }
}

/**
 * Parse UUID and extract detailed information
 */
export function analyzeUUID(uuid) {
    // Normalize UUID format (remove dashes, convert to lowercase)
    const normalized = uuid.replace(/-/g, '').toLowerCase();

    if (normalized.length !== 32) {
        return {
            valid: false,
            error: 'Invalid UUID length',
        };
    }

    // Reformat to standard UUID format
    const formatted = `${normalized.slice(0, 8)}-${normalized.slice(8, 12)}-${normalized.slice(12, 16)}-${normalized.slice(16, 20)}-${normalized.slice(20, 32)}`;

    if (!validate(formatted)) {
        return {
            valid: false,
            error: 'Invalid UUID format',
        };
    }

    const uuidVersion = version(formatted);
    const analysis = {
        valid: true,
        uuid: formatted,
        version: uuidVersion,
        format: uuid.includes('-') ? 'standard' : 'compact',
        variant: getVariant(normalized),
    };

    // Add version-specific information
    if (uuidVersion === 1) {
        analysis.timestamp = extractV1Timestamp(normalized);
        analysis.type = 'timestamp-based';
    } else if (uuidVersion === 4) {
        analysis.type = 'random';
    } else if (uuidVersion === 5) {
        analysis.type = 'namespace-based (SHA-1)';
    } else if (uuidVersion === 3) {
        analysis.type = 'namespace-based (MD5)';
    }

    return analysis;
}

/**
 * Get UUID variant
 */
function getVariant(normalizedUUID) {
    const variantByte = parseInt(normalizedUUID.charAt(16), 16);

    if ((variantByte & 0x8) === 0) {
        return 'NCS backward compatible';
    } else if ((variantByte & 0xC) === 0x8) {
        return 'RFC 4122';
    } else if ((variantByte & 0xE) === 0xC) {
        return 'Microsoft';
    } else {
        return 'Reserved for future use';
    }
}

/**
 * Extract timestamp from UUID v1
 */
function extractV1Timestamp(normalizedUUID) {
    try {
        // Extract time fields from UUID v1
        const timeLow = normalizedUUID.slice(0, 8);
        const timeMid = normalizedUUID.slice(8, 12);
        const timeHigh = normalizedUUID.slice(12, 16);

        // Remove version bits from timeHigh
        const timeHighAndVersion = parseInt(timeHigh, 16);
        const timeHighValue = timeHighAndVersion & 0x0FFF;

        // Combine into 60-bit timestamp
        const timestamp = (BigInt(`0x${timeHighValue.toString(16)}`) << 48n) |
            (BigInt(`0x${timeMid}`) << 32n) |
            BigInt(`0x${timeLow}`);

        // UUID v1 uses 100-nanosecond intervals since Oct 15, 1582
        // Convert to Unix timestamp (milliseconds since Jan 1, 1970)
        const UUID_EPOCH_OFFSET = 122192928000000000n; // Difference between UUID and Unix epochs in 100-ns intervals
        const unixTimestamp = Number((timestamp - UUID_EPOCH_OFFSET) / 10000n);

        return {
            iso: new Date(unixTimestamp).toISOString(),
            unix: unixTimestamp,
            raw: timestamp.toString(),
        };
    } catch (error) {
        return null;
    }
}

/**
 * Convert UUID format
 */
export function convertUUIDFormat(uuid, options = {}) {
    const { uppercase = false, removeDashes = false } = options;

    // Normalize input
    let normalized = uuid.replace(/-/g, '').toLowerCase();

    if (normalized.length !== 32) {
        throw new Error('Invalid UUID length');
    }

    // Reformat to standard
    let result = `${normalized.slice(0, 8)}-${normalized.slice(8, 12)}-${normalized.slice(12, 16)}-${normalized.slice(16, 20)}-${normalized.slice(20, 32)}`;

    if (!validate(result)) {
        throw new Error('Invalid UUID format');
    }

    if (removeDashes) {
        result = result.replace(/-/g, '');
    }

    if (uppercase) {
        result = result.toUpperCase();
    }

    return result;
}

/**
 * Check for UUID collisions in an array
 */
export function checkCollisions(uuids) {
    const seen = new Set();
    const duplicates = [];

    for (let i = 0; i < uuids.length; i++) {
        const uuid = typeof uuids[i] === 'object' ? uuids[i].uuid : uuids[i];
        const normalized = uuid.toLowerCase().replace(/-/g, '');

        if (seen.has(normalized)) {
            duplicates.push({
                uuid: uuid,
                index: i,
            });
        } else {
            seen.add(normalized);
        }
    }

    return {
        total: uuids.length,
        unique: seen.size,
        duplicates: duplicates.length,
        collisions: duplicates,
    };
}

/**
 * Batch validate UUIDs
 */
export function batchValidate(uuids) {
    const results = [];

    for (const uuid of uuids) {
        const valid = validateUUID(uuid);
        results.push({
            uuid,
            valid,
            version: valid ? getUUIDVersion(uuid) : null,
        });
    }

    return {
        total: uuids.length,
        valid: results.filter(r => r.valid).length,
        invalid: results.filter(r => !r.valid).length,
        results,
    };
}

/**
 * Batch analyze UUIDs
 */
export function batchAnalyze(uuids) {
    const results = [];

    for (const uuid of uuids) {
        results.push(analyzeUUID(uuid));
    }

    const validCount = results.filter(r => r.valid).length;
    const versionCounts = {};

    results.forEach(r => {
        if (r.valid && r.version) {
            versionCounts[r.version] = (versionCounts[r.version] || 0) + 1;
        }
    });

    return {
        total: uuids.length,
        valid: validCount,
        invalid: results.length - validCount,
        versionBreakdown: versionCounts,
        results,
    };
}

/**
 * Generate UUID statistics
 */
export function generateStatistics(uuids) {
    const stats = {
        total: uuids.length,
        versions: {},
        formats: {
            standard: 0,
            compact: 0,
        },
        variants: {},
    };

    for (const uuidData of uuids) {
        const uuid = typeof uuidData === 'object' ? uuidData.uuid : uuidData;

        if (!validate(uuid.replace(/-/g, '').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5'))) {
            continue;
        }

        const analysis = analyzeUUID(uuid);

        if (analysis.valid) {
            // Count versions
            stats.versions[analysis.version] = (stats.versions[analysis.version] || 0) + 1;

            // Count formats
            stats.formats[analysis.format] = (stats.formats[analysis.format] || 0) + 1;

            // Count variants
            stats.variants[analysis.variant] = (stats.variants[analysis.variant] || 0) + 1;
        }
    }

    return stats;
}
