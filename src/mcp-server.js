#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
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
 * Create and configure the MCP server
 */
const server = new Server(
  {
    name: 'uuid-generator-server',
    version: '2.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * List available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'generate_uuid',
        description: 'Generate UUIDs with specified version (v1, v4, or v5) and options',
        inputSchema: {
          type: 'object',
          properties: {
            version: {
              type: 'string',
              description: 'UUID version to generate: v1 (timestamp), v4 (random), or v5 (namespace)',
              enum: ['v1', 'v4', 'v5'],
              default: 'v4',
            },
            count: {
              type: 'number',
              description: 'Number of UUIDs to generate (1-10000)',
              minimum: 1,
              maximum: 10000,
              default: 1,
            },
            namespace: {
              type: 'string',
              description: 'Namespace for v5 UUIDs (DNS, URL, OID, X500, or custom UUID)',
            },
            name: {
              type: 'string',
              description: 'Name to hash with namespace for v5 UUIDs',
            },
            uppercase: {
              type: 'boolean',
              description: 'Output UUIDs in uppercase',
              default: false,
            },
            removeDashes: {
              type: 'boolean',
              description: 'Remove dashes from UUIDs',
              default: false,
            },
          },
          required: ['version'],
        },
      },
      {
        name: 'validate_uuid',
        description: 'Validate a UUID string and return its version',
        inputSchema: {
          type: 'object',
          properties: {
            uuid: {
              type: 'string',
              description: 'UUID string to validate',
            },
          },
          required: ['uuid'],
        },
      },
      {
        name: 'analyze_uuid',
        description: 'Analyze a UUID and extract detailed information (version, variant, timestamp for v1, format, etc.)',
        inputSchema: {
          type: 'object',
          properties: {
            uuid: {
              type: 'string',
              description: 'UUID string to analyze',
            },
          },
          required: ['uuid'],
        },
      },
      {
        name: 'convert_uuid_format',
        description: 'Convert UUID between different formats (standard/compact, uppercase/lowercase)',
        inputSchema: {
          type: 'object',
          properties: {
            uuid: {
              type: 'string',
              description: 'UUID string to convert',
            },
            uppercase: {
              type: 'boolean',
              description: 'Convert to uppercase',
              default: false,
            },
            removeDashes: {
              type: 'boolean',
              description: 'Remove dashes (compact format)',
              default: false,
            },
          },
          required: ['uuid'],
        },
      },
      {
        name: 'batch_validate',
        description: 'Validate multiple UUIDs at once',
        inputSchema: {
          type: 'object',
          properties: {
            uuids: {
              type: 'array',
              description: 'Array of UUID strings to validate',
              items: {
                type: 'string',
              },
            },
          },
          required: ['uuids'],
        },
      },
      {
        name: 'batch_analyze',
        description: 'Analyze multiple UUIDs and get detailed breakdown',
        inputSchema: {
          type: 'object',
          properties: {
            uuids: {
              type: 'array',
              description: 'Array of UUID strings to analyze',
              items: {
                type: 'string',
              },
            },
          },
          required: ['uuids'],
        },
      },
      {
        name: 'check_collisions',
        description: 'Check for duplicate UUIDs in a collection',
        inputSchema: {
          type: 'object',
          properties: {
            uuids: {
              type: 'array',
              description: 'Array of UUID strings to check for duplicates',
              items: {
                type: 'string',
              },
            },
          },
          required: ['uuids'],
        },
      },
      {
        name: 'generate_statistics',
        description: 'Generate statistics about a collection of UUIDs (version distribution, format breakdown, etc.)',
        inputSchema: {
          type: 'object',
          properties: {
            uuids: {
              type: 'array',
              description: 'Array of UUID strings to analyze',
              items: {
                type: 'string',
              },
            },
          },
          required: ['uuids'],
        },
      },
    ],
  };
});

/**
 * Handle tool calls
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'generate_uuid': {
        const {
          version = 'v4',
          count = 1,
          namespace = 'DNS',
          name: uuidName,
          uppercase = false,
          removeDashes = false,
        } = args;

        if (count < 1 || count > 10000) {
          throw new Error('Count must be between 1 and 10,000');
        }

        if (version === 'v5' && !uuidName) {
          throw new Error('Name is required for UUID v5');
        }

        const uuids = [];
        const config = { namespace, name: uuidName, uppercase, removeDashes };

        for (let i = 0; i < count; i++) {
          let uuid;

          switch (version) {
            case 'v1':
              uuid = uuidv1();
              break;
            case 'v4':
              uuid = uuidv4();
              break;
            case 'v5': {
              let ns = NAMESPACES[namespace] || namespace;
              const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
              if (!uuidRegex.test(ns)) {
                ns = NAMESPACES.DNS;
              }
              uuid = uuidv5(uuidName, ns);
              break;
            }
            default:
              throw new Error(`Unsupported UUID version: ${version}`);
          }

          // Format UUID
          if (removeDashes) {
            uuid = uuid.replace(/-/g, '');
          }
          if (uppercase) {
            uuid = uuid.toUpperCase();
          }

          uuids.push(uuid);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  count: uuids.length,
                  version,
                  uuids,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'validate_uuid': {
        const { uuid } = args;
        const valid = validateUUID(uuid);
        const uuidVersion = valid ? getUUIDVersion(uuid) : null;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  uuid,
                  valid,
                  version: uuidVersion,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'analyze_uuid': {
        const { uuid } = args;
        const analysis = analyzeUUID(uuid);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(analysis, null, 2),
            },
          ],
        };
      }

      case 'convert_uuid_format': {
        const { uuid, uppercase = false, removeDashes = false } = args;

        try {
          const converted = convertUUIDFormat(uuid, { uppercase, removeDashes });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    original: uuid,
                    converted,
                    options: { uppercase, removeDashes },
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
          throw new Error(`Conversion failed: ${error.message}`);
        }
      }

      case 'batch_validate': {
        const { uuids } = args;
        const results = batchValidate(uuids);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      }

      case 'batch_analyze': {
        const { uuids } = args;
        const results = batchAnalyze(uuids);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      }

      case 'check_collisions': {
        const { uuids } = args;
        const results = checkCollisions(uuids);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      }

      case 'generate_statistics': {
        const { uuids } = args;
        const stats = generateStatistics(uuids);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(stats, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              error: error.message,
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
});

/**
 * Start the server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('UUID Generator MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
