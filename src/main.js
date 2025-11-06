import { Actor } from 'apify';
import { v1 as uuidv1, v4 as uuidv4, v5 as uuidv5 } from 'uuid';
import {
    validateUUID,
    getUUIDVersion,
    analyzeUUID,
    convertUUIDFormat,
    checkCollisions,
    batchValidate,
    batchAnalyze,
    generateStatistics,
} from './utils.js';

// Predefined namespace UUIDs
const NAMESPACES = {
    DNS: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    URL: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
    OID: '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
    X500: '6ba7b814-9dad-11d1-80b4-00c04fd430c8',
};

/**
 * Format UUID according to user preferences
 */
function formatUUID(uuid, { uppercase = false, removeDashes = false }) {
    let formatted = uuid;
    if (removeDashes) {
        formatted = formatted.replace(/-/g, '');
    }
    if (uppercase) {
        formatted = formatted.toUpperCase();
    }
    return formatted;
}

/**
 * Generate UUIDs based on version and configuration
 */
function generateUUID(version, config) {
    let uuid;

    switch (version) {
        case 'v1':
            uuid = uuidv1();
            break;
        case 'v4':
            uuid = uuidv4();
            break;
        case 'v5':
            // Determine namespace
            let namespace = NAMESPACES[config.namespace] || config.namespace;

            // If custom namespace is not a valid UUID, use DNS namespace as fallback
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(namespace)) {
                console.warn(`Invalid namespace UUID: ${namespace}. Using DNS namespace as fallback.`);
                namespace = NAMESPACES.DNS;
            }

            const name = config.name || 'default-name';
            uuid = uuidv5(name, namespace);
            break;
        default:
            throw new Error(`Unsupported UUID version: ${version}`);
    }

    return formatUUID(uuid, {
        uppercase: config.uppercase,
        removeDashes: config.removeDashes,
    });
}

/**
 * Generate metadata for a UUID
 */
function generateMetadata(uuid, version) {
    return {
        uuid,
        version,
        timestamp: new Date().toISOString(),
        format: uuid.includes('-') ? 'standard' : 'compact',
    };
}

/**
 * Export data in different formats
 */
async function exportData(data, format, keyName = 'OUTPUT') {
    const keyValueStore = await Actor.openKeyValueStore();

    switch (format) {
        case 'json':
            await keyValueStore.setValue(keyName, data);
            break;

        case 'csv':
            let csvContent;
            if (Array.isArray(data) && data[0] && typeof data[0] === 'object') {
                // Generate CSV with headers
                const headers = Object.keys(data[0]).join(',');
                const rows = data.map(item => {
                    return Object.values(item).map(val => {
                        // Handle nested objects
                        if (typeof val === 'object' && val !== null) {
                            val = JSON.stringify(val);
                        }
                        return typeof val === 'string' && (val.includes(',') || val.includes('"'))
                            ? `"${val.replace(/"/g, '""')}"`
                            : val;
                    }).join(',');
                });
                csvContent = [headers, ...rows].join('\n');
            } else {
                // Simple format
                csvContent = JSON.stringify(data);
            }
            await keyValueStore.setValue(`${keyName}.csv`, csvContent, { contentType: 'text/csv' });
            break;

        case 'text':
            let textContent;
            if (Array.isArray(data)) {
                textContent = data.map(item => {
                    if (typeof item === 'object') {
                        return item.uuid || JSON.stringify(item);
                    }
                    return item;
                }).join('\n');
            } else {
                textContent = JSON.stringify(data, null, 2);
            }
            await keyValueStore.setValue(`${keyName}.txt`, textContent, { contentType: 'text/plain' });
            break;

        default:
            throw new Error(`Unsupported output format: ${format}`);
    }
}

/**
 * Handle Generate operation
 */
async function handleGenerate(input) {
    const {
        uuidVersion = 'v4',
        count = 10,
        namespace = 'DNS',
        name,
        outputFormat = 'json',
        includeMetadata = true,
        uppercase = false,
        removeDashes = false,
    } = input;

    console.log('Starting UUID generation...');
    console.log(`Configuration: ${JSON.stringify({ uuidVersion, count, outputFormat, includeMetadata }, null, 2)}`);

    // Validate count
    if (count < 1 || count > 100000) {
        throw new Error('Count must be between 1 and 100,000');
    }

    // Special validation for UUID v5
    if (uuidVersion === 'v5' && !name) {
        throw new Error('Name is required for UUID version 5');
    }

    // Generate UUIDs
    const uuids = [];
    const config = { namespace, name, uppercase, removeDashes };

    console.log(`Generating ${count} UUID(s) version ${uuidVersion}...`);

    // For v5 with same name/namespace, all UUIDs will be identical
    if (uuidVersion === 'v5' && count > 1) {
        console.warn('Warning: All UUID v5 will be identical with the same namespace and name combination.');
        console.warn('Consider using UUID v4 for generating multiple unique identifiers.');
    }

    for (let i = 0; i < count; i++) {
        const uuid = generateUUID(uuidVersion, config);

        if (includeMetadata && outputFormat === 'json') {
            uuids.push(generateMetadata(uuid, uuidVersion));
        } else {
            uuids.push({ uuid });
        }

        // Log progress for large batches
        if (count > 1000 && (i + 1) % 1000 === 0) {
            console.log(`Generated ${i + 1}/${count} UUIDs...`);
        }
    }

    console.log(`Successfully generated ${count} UUID(s)`);

    // Save to dataset
    await Actor.pushData(uuids);

    // Export in requested format
    await exportData(uuids, outputFormat);

    // Log sample
    const sampleSize = Math.min(5, uuids.length);
    console.log(`\nSample (first ${sampleSize}):`);
    uuids.slice(0, sampleSize).forEach((item, index) => {
        const uuid = typeof item === 'object' ? item.uuid : item;
        console.log(`  ${index + 1}. ${uuid}`);
    });

    console.log(`\nGeneration completed!`);
}

/**
 * Handle Validate operation
 */
async function handleValidate(input) {
    const { uuid, outputFormat = 'json' } = input;

    if (!uuid) {
        throw new Error('UUID is required for validation');
    }

    console.log(`Validating UUID: ${uuid}`);

    const valid = validateUUID(uuid);
    const version = valid ? getUUIDVersion(uuid) : null;

    const result = {
        uuid,
        valid,
        version,
        message: valid ? `Valid UUID version ${version}` : 'Invalid UUID',
    };

    await Actor.pushData([result]);
    await exportData(result, outputFormat, 'VALIDATION_RESULT');

    console.log(`Validation result: ${result.message}`);
}

/**
 * Handle Analyze operation
 */
async function handleAnalyze(input) {
    const { uuid, outputFormat = 'json' } = input;

    if (!uuid) {
        throw new Error('UUID is required for analysis');
    }

    console.log(`Analyzing UUID: ${uuid}`);

    const analysis = analyzeUUID(uuid);

    await Actor.pushData([analysis]);
    await exportData(analysis, outputFormat, 'ANALYSIS_RESULT');

    if (analysis.valid) {
        console.log(`Analysis completed: UUID v${analysis.version}, ${analysis.type}`);
    } else {
        console.log(`Analysis failed: ${analysis.error}`);
    }
}

/**
 * Handle Convert operation
 */
async function handleConvert(input) {
    const { uuid, uppercase = false, removeDashes = false, outputFormat = 'json' } = input;

    if (!uuid) {
        throw new Error('UUID is required for conversion');
    }

    console.log(`Converting UUID: ${uuid}`);

    try {
        const converted = convertUUIDFormat(uuid, { uppercase, removeDashes });

        const result = {
            original: uuid,
            converted,
            options: { uppercase, removeDashes },
        };

        await Actor.pushData([result]);
        await exportData(result, outputFormat, 'CONVERSION_RESULT');

        console.log(`Converted: ${uuid} → ${converted}`);
    } catch (error) {
        throw new Error(`Conversion failed: ${error.message}`);
    }
}

/**
 * Handle Batch Validate operation
 */
async function handleBatchValidate(input) {
    const { uuids, outputFormat = 'json' } = input;

    if (!uuids || !Array.isArray(uuids) || uuids.length === 0) {
        throw new Error('Array of UUIDs is required for batch validation');
    }

    console.log(`Validating ${uuids.length} UUIDs...`);

    const results = batchValidate(uuids);

    await Actor.pushData(results.results);
    await exportData(results, outputFormat, 'BATCH_VALIDATION');

    console.log(`Batch validation completed: ${results.valid} valid, ${results.invalid} invalid`);
}

/**
 * Handle Batch Analyze operation
 */
async function handleBatchAnalyze(input) {
    const { uuids, outputFormat = 'json' } = input;

    if (!uuids || !Array.isArray(uuids) || uuids.length === 0) {
        throw new Error('Array of UUIDs is required for batch analysis');
    }

    console.log(`Analyzing ${uuids.length} UUIDs...`);

    const results = batchAnalyze(uuids);

    await Actor.pushData(results.results);
    await exportData(results, outputFormat, 'BATCH_ANALYSIS');

    console.log(`Batch analysis completed: ${results.valid} valid, ${results.invalid} invalid`);
    console.log(`Version breakdown:`, results.versionBreakdown);
}

/**
 * Handle Check Collisions operation
 */
async function handleCheckCollisions(input) {
    const { uuids, outputFormat = 'json' } = input;

    if (!uuids || !Array.isArray(uuids) || uuids.length === 0) {
        throw new Error('Array of UUIDs is required for collision checking');
    }

    console.log(`Checking ${uuids.length} UUIDs for collisions...`);

    const results = checkCollisions(uuids);

    await Actor.pushData([results]);
    await exportData(results, outputFormat, 'COLLISION_CHECK');

    console.log(`Collision check completed:`);
    console.log(`  Total: ${results.total}`);
    console.log(`  Unique: ${results.unique}`);
    console.log(`  Duplicates: ${results.duplicates}`);

    if (results.duplicates > 0) {
        console.log(`\nCollisions found:`);
        results.collisions.slice(0, 5).forEach(c => {
            console.log(`  - ${c.uuid} at index ${c.index}`);
        });
    }
}

/**
 * Handle Statistics operation
 */
async function handleStatistics(input) {
    const { uuids, outputFormat = 'json' } = input;

    if (!uuids || !Array.isArray(uuids) || uuids.length === 0) {
        throw new Error('Array of UUIDs is required for statistics generation');
    }

    console.log(`Generating statistics for ${uuids.length} UUIDs...`);

    const stats = generateStatistics(uuids);

    await Actor.pushData([stats]);
    await exportData(stats, outputFormat, 'STATISTICS');

    console.log(`\nStatistics:`);
    console.log(`  Total UUIDs: ${stats.total}`);
    console.log(`  Version breakdown:`, stats.versions);
    console.log(`  Format breakdown:`, stats.formats);
    console.log(`  Variant breakdown:`, stats.variants);
}

/**
 * Main Actor entry point
 */
await Actor.main(async () => {
    // Get input
    const input = await Actor.getInput();

    // Validate input
    if (!input) {
        throw new Error('Input is required');
    }

    const { operation = 'generate' } = input;

    console.log(`Starting operation: ${operation}`);

    // Route to appropriate handler
    switch (operation) {
        case 'generate':
            await handleGenerate(input);
            break;

        case 'validate':
            await handleValidate(input);
            break;

        case 'analyze':
            await handleAnalyze(input);
            break;

        case 'convert':
            await handleConvert(input);
            break;

        case 'batch_validate':
            await handleBatchValidate(input);
            break;

        case 'batch_analyze':
            await handleBatchAnalyze(input);
            break;

        case 'check_collisions':
            await handleCheckCollisions(input);
            break;

        case 'statistics':
            await handleStatistics(input);
            break;

        default:
            throw new Error(`Unknown operation: ${operation}`);
    }

    console.log('\nOperation completed successfully!');
});
