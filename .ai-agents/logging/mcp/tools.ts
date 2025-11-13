/**
 * MCP Tools for Logging + Tracing System
 *
 * Provides MCP tool definitions and handlers for integration
 * with the OpenMemory MCP server.
 */

import fetch from 'node-fetch';

const LOGGING_API_URL = process.env.LOGGING_API_URL || 'http://localhost:8083';

/**
 * MCP Tool Definitions
 */
export const loggingTracingTools = [
  // ========================================================================
  // LOGGING TOOLS
  // ========================================================================
  {
    name: 'log_event',
    description: 'Log an event/action to the logging system. AI agents MUST use this to log all significant actions.',
    inputSchema: {
      type: 'object',
      properties: {
        level: {
          type: 'string',
          description: 'Log level: trace, debug, info, warn, error, fatal',
          enum: ['trace', 'debug', 'info', 'warn', 'error', 'fatal']
        },
        category: {
          type: 'string',
          description: 'Log category: main, error, ai-agent, api, debug, system, performance',
          enum: ['main', 'error', 'ai-agent', 'api', 'debug', 'system', 'performance']
        },
        source: {
          type: 'string',
          description: 'Source file (e.g., "src/users.ts")'
        },
        message: {
          type: 'string',
          description: 'Log message'
        },
        context: {
          type: 'object',
          description: 'Additional context data (optional)'
        }
      },
      required: ['level', 'category', 'source', 'message']
    }
  },

  {
    name: 'log_batch',
    description: 'Log multiple events at once for efficiency',
    inputSchema: {
      type: 'object',
      properties: {
        entries: {
          type: 'array',
          description: 'Array of log entries',
          items: {
            type: 'object',
            properties: {
              level: { type: 'string' },
              category: { type: 'string' },
              source: { type: 'string' },
              message: { type: 'string' },
              context: { type: 'object' }
            }
          }
        }
      },
      required: ['entries']
    }
  },

  {
    name: 'search_logs',
    description: 'Search log entries with filters',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query'
        },
        category: {
          type: 'string',
          description: 'Filter by category'
        },
        level: {
          type: 'string',
          description: 'Filter by level'
        },
        limit: {
          type: 'number',
          description: 'Maximum results (default: 100)'
        }
      }
    }
  },

  // ========================================================================
  // TRACING CONFIGURATION TOOLS
  // ========================================================================
  {
    name: 'get_tracing_config',
    description: 'Get current tracing configuration for a file or globally',
    inputSchema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          description: 'File path (optional, omit for global config)'
        }
      }
    }
  },

  {
    name: 'set_tracing_level',
    description: 'Set tracing detail level for a specific file. Levels: 0=OFF, 1=MINIMAL, 2=STANDARD, 3=DETAILED, 4=VERBOSE, 5=EXTREME',
    inputSchema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          description: 'File path (e.g., "src/users.ts")'
        },
        level: {
          type: 'number',
          description: 'Detail level (0-5)',
          minimum: 0,
          maximum: 5
        },
        captureParams: {
          type: 'boolean',
          description: 'Capture function parameters (default: true)'
        },
        captureReturn: {
          type: 'boolean',
          description: 'Capture return values (default: true)'
        },
        captureAsync: {
          type: 'boolean',
          description: 'Capture async operations (default: true)'
        }
      },
      required: ['file', 'level']
    }
  },

  // ========================================================================
  // INSTRUMENTATION TOOLS
  // ========================================================================
  {
    name: 'instrument_file',
    description: 'Automatically instrument a file with execution tracing. Wraps all functions to capture execution flow.',
    inputSchema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          description: 'File path to instrument (e.g., "src/users.ts")'
        },
        level: {
          type: 'number',
          description: 'Instrumentation detail level (0-5, default: 2)',
          minimum: 0,
          maximum: 5
        },
        functions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific functions to instrument (optional, empty = all functions)'
        },
        excludeFunctions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Functions to exclude from instrumentation'
        }
      },
      required: ['file']
    }
  },

  {
    name: 'instrument_function',
    description: 'Instrument specific functions in a file',
    inputSchema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          description: 'File path'
        },
        functions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Function names to instrument'
        },
        level: {
          type: 'number',
          description: 'Detail level (default: 3)',
          minimum: 0,
          maximum: 5
        }
      },
      required: ['file', 'functions']
    }
  },

  {
    name: 'instrument_all',
    description: 'Instrument all source files in the project. Use with caution - can be resource intensive.',
    inputSchema: {
      type: 'object',
      properties: {
        level: {
          type: 'number',
          description: 'Detail level for all files (default: 2)',
          minimum: 0,
          maximum: 5
        },
        exclude: {
          type: 'array',
          items: { type: 'string' },
          description: 'File patterns to exclude (e.g., ["*.test.ts", "*.spec.ts"])'
        },
        languages: {
          type: 'array',
          items: { type: 'string' },
          description: 'Languages to instrument (default: ["typescript", "javascript"])'
        }
      }
    }
  },

  {
    name: 'uninstrument_file',
    description: 'Remove instrumentation from a file and restore original code',
    inputSchema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          description: 'File path to uninstrument'
        },
        restore: {
          type: 'boolean',
          description: 'Restore from backup (default: true)'
        }
      },
      required: ['file']
    }
  },

  {
    name: 'uninstrument_all',
    description: 'Remove instrumentation from all files',
    inputSchema: {
      type: 'object',
      properties: {
        restore: {
          type: 'boolean',
          description: 'Restore from backups (default: true)'
        }
      }
    }
  },

  // ========================================================================
  // EXECUTION TRACE SEARCH & ANALYSIS TOOLS
  // ========================================================================
  {
    name: 'search_traces',
    description: 'Search execution traces with filters. Find specific function calls, slow executions, errors, etc.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (function name, file, etc.)'
        },
        file: {
          type: 'string',
          description: 'Filter by file'
        },
        minDuration: {
          type: 'number',
          description: 'Minimum execution duration in milliseconds'
        },
        maxDuration: {
          type: 'number',
          description: 'Maximum execution duration in milliseconds'
        },
        hasError: {
          type: 'boolean',
          description: 'Filter for traces with errors'
        },
        limit: {
          type: 'number',
          description: 'Maximum results (default: 100)'
        }
      }
    }
  },

  {
    name: 'get_trace_tree',
    description: 'Get complete execution tree for a specific trace ID. Shows full call hierarchy.',
    inputSchema: {
      type: 'object',
      properties: {
        traceId: {
          type: 'string',
          description: 'Trace ID to retrieve'
        }
      },
      required: ['traceId']
    }
  },

  {
    name: 'find_slow_executions',
    description: 'Find slow function executions above a threshold',
    inputSchema: {
      type: 'object',
      properties: {
        threshold: {
          type: 'number',
          description: 'Duration threshold in milliseconds (default: 1000)'
        },
        limit: {
          type: 'number',
          description: 'Maximum results (default: 50)'
        }
      }
    }
  },

  {
    name: 'find_errors',
    description: 'Find execution traces that resulted in errors',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum results (default: 100)'
        }
      }
    }
  },

  {
    name: 'get_performance_stats',
    description: 'Get performance statistics for a specific file',
    inputSchema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          description: 'File path to analyze'
        }
      },
      required: ['file']
    }
  },

  {
    name: 'get_hotspots',
    description: 'Find performance hotspots - functions consuming most time',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Number of hotspots to return (default: 20)'
        }
      }
    }
  },

  // ========================================================================
  // FILE MANAGEMENT TOOLS
  // ========================================================================
  {
    name: 'check_file_logging',
    description: 'Check if a file has logging/tracing integrated. AI agents MUST use this before modifying files.',
    inputSchema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          description: 'File path to check'
        }
      },
      required: ['file']
    }
  },

  {
    name: 'get_instrumented_files',
    description: 'Get list of all files with tracing instrumentation',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },

  {
    name: 'get_uninstrumented_files',
    description: 'Get list of files without tracing instrumentation',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },

  {
    name: 'get_file_functions',
    description: 'Get list of functions in a file',
    inputSchema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          description: 'File path'
        }
      },
      required: ['file']
    }
  },

  // ========================================================================
  // SYSTEM STATUS TOOLS
  // ========================================================================
  {
    name: 'get_logging_status',
    description: 'Get overall status of logging and tracing systems',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];

/**
 * MCP Tool Handlers
 */
export async function handleLoggingTracingTool(name: string, args: any): Promise<any> {
  try {
    switch (name) {
      // LOGGING TOOLS
      case 'log_event':
        return await apiCall('POST', '/api/log', args);

      case 'log_batch':
        return await apiCall('POST', '/api/log/batch', args);

      case 'search_logs':
        const logParams = new URLSearchParams();
        if (args.query) logParams.append('query', args.query);
        if (args.category) logParams.append('category', args.category);
        if (args.level) logParams.append('level', args.level);
        if (args.limit) logParams.append('limit', args.limit.toString());
        return await apiCall('GET', `/api/log/latest?${logParams}`);

      // TRACING CONFIGURATION
      case 'get_tracing_config':
        return await apiCall('GET', '/api/tracing/config');

      case 'set_tracing_level':
        return await apiCall('PUT', '/api/tracing/config/file', args);

      // INSTRUMENTATION
      case 'instrument_file':
        return await apiCall('POST', '/api/tracing/instrument/file', args);

      case 'instrument_function':
        return await apiCall('POST', '/api/tracing/instrument/function', args);

      case 'instrument_all':
        return await apiCall('POST', '/api/tracing/instrument/all', args);

      case 'uninstrument_file':
        return await apiCall('POST', '/api/tracing/uninstrument/file', args);

      case 'uninstrument_all':
        return await apiCall('POST', '/api/tracing/uninstrument/all', args);

      // SEARCH & ANALYSIS
      case 'search_traces':
        const traceParams = new URLSearchParams();
        if (args.query) traceParams.append('query', args.query);
        if (args.file) traceParams.append('file', args.file);
        if (args.minDuration) traceParams.append('minDuration', args.minDuration.toString());
        if (args.maxDuration) traceParams.append('maxDuration', args.maxDuration.toString());
        if (args.hasError !== undefined) traceParams.append('hasError', args.hasError.toString());
        if (args.limit) traceParams.append('limit', args.limit.toString());
        return await apiCall('GET', `/api/tracing/search?${traceParams}`);

      case 'get_trace_tree':
        return await apiCall('GET', `/api/tracing/trace/${args.traceId}`);

      case 'find_slow_executions':
        const slowParams = new URLSearchParams();
        if (args.threshold) slowParams.append('threshold', args.threshold.toString());
        if (args.limit) slowParams.append('limit', args.limit.toString());
        return await apiCall('GET', `/api/tracing/slow?${slowParams}`);

      case 'find_errors':
        const errorParams = new URLSearchParams();
        if (args.limit) errorParams.append('limit', args.limit.toString());
        return await apiCall('GET', `/api/tracing/errors?${errorParams}`);

      case 'get_performance_stats':
        return await apiCall('GET', `/api/tracing/stats/file/${args.file}`);

      case 'get_hotspots':
        const hotspotParams = new URLSearchParams();
        if (args.limit) hotspotParams.append('limit', args.limit.toString());
        return await apiCall('GET', `/api/tracing/hotspots?${hotspotParams}`);

      // FILE MANAGEMENT
      case 'check_file_logging':
        const allFiles = await apiCall('GET', '/api/files');
        const fileInfo = allFiles.files.find((f: any) => f.file === args.file);
        return {
          file: args.file,
          instrumented: fileInfo?.instrumented || false,
          functionCount: fileInfo?.functionCount || 0,
          functions: fileInfo?.functions || []
        };

      case 'get_instrumented_files':
        return await apiCall('GET', '/api/files/integrated');

      case 'get_uninstrumented_files':
        return await apiCall('GET', '/api/files/missing');

      case 'get_file_functions':
        const filesData = await apiCall('GET', '/api/files');
        const targetFile = filesData.files.find((f: any) => f.file === args.file);
        return {
          file: args.file,
          functions: targetFile?.functions || []
        };

      // SYSTEM STATUS
      case 'get_logging_status':
        return await apiCall('GET', '/api/status');

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Helper to make API calls
 */
async function apiCall(method: string, endpoint: string, body?: any): Promise<any> {
  const url = `${LOGGING_API_URL}${endpoint}`;

  const options: any = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  return await response.json();
}
