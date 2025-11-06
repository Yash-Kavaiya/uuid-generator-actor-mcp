import { Actor } from 'apify';
import { v1 as uuidv1, v4 as uuidv4, v5 as uuidv5 } from 'uuid';

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
 * Export UUIDs in different formats
 */
async function exportUUIDs(uuids, format, includeMetadata) {
    const keyValueStore = await Actor.openKeyValueStore();

    switch (format) {
        case 'json':
            // Already in JSON format from dataset
            await keyValueStore.setValue('OUTPUT', uuids);
            break;

        case 'csv':
            let csvContent;
            if (includeMetadata && uuids[0] && typeof uuids[0] === 'object') {
                // Generate CSV with headers
                const headers = Object.keys(uuids[0]).join(',');
                const rows = uuids.map(item => {
                    return Object.values(item).map(val =>
                        typeof val === 'string' && val.includes(',') ? `"${val}"` : val
                    ).join(',');
                });
                csvContent = [headers, ...rows].join('\n');
            } else {
                // Simple CSV with just UUIDs
                csvContent = 'uuid\n' + uuids.map(u => typeof u === 'object' ? u.uuid : u).join('\n');
            }
            await keyValueStore.setValue('OUTPUT.csv', csvContent, { contentType: 'text/csv' });
            break;

        case 'text':
            // Plain text format - one UUID per line
            const textContent = uuids.map(u => typeof u === 'object' ? u.uuid : u).join('\n');
            await keyValueStore.setValue('OUTPUT.txt', textContent, { contentType: 'text/plain' });
            break;

        default:
            throw new Error(`Unsupported output format: ${format}`);
    }
}

await Actor.main(async () => {
    // Get input
    const input = await Actor.getInput();

    // Validate input
    if (!input) {
        throw new Error('Input is required');
    }

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
    // Show warning if generating multiple v5 UUIDs with same input
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
    await exportUUIDs(uuids, outputFormat, includeMetadata);

    // Log sample of generated UUIDs
    const sampleSize = Math.min(5, uuids.length);
    console.log(`\nSample of generated UUIDs (first ${sampleSize}):`);
    uuids.slice(0, sampleSize).forEach((item, index) => {
        const uuid = typeof item === 'object' ? item.uuid : item;
        console.log(`  ${index + 1}. ${uuid}`);
    });

    // Output summary
    console.log(`\nSummary:`);
    console.log(`  Total UUIDs generated: ${count}`);
    console.log(`  UUID Version: ${uuidVersion}`);
    console.log(`  Output Format: ${outputFormat}`);
    console.log(`  Includes Metadata: ${includeMetadata && outputFormat === 'json'}`);

    if (uuidVersion === 'v5') {
        console.log(`  Namespace: ${namespace}`);
        console.log(`  Name: ${name}`);
    }

    console.log('\nUUID generation completed successfully!');
});
