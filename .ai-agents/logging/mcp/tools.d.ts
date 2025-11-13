/**
 * MCP Tools for Logging + Tracing System
 *
 * Provides MCP tool definitions and handlers for integration
 * with the OpenMemory MCP server.
 */
/**
 * MCP Tool Definitions
 */
export declare const loggingTracingTools: ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            level: {
                type: string;
                description: string;
                enum: string[];
                minimum?: undefined;
                maximum?: undefined;
            };
            category: {
                type: string;
                description: string;
                enum: string[];
            };
            source: {
                type: string;
                description: string;
            };
            message: {
                type: string;
                description: string;
            };
            context: {
                type: string;
                description: string;
            };
            entries?: undefined;
            query?: undefined;
            limit?: undefined;
            file?: undefined;
            captureParams?: undefined;
            captureReturn?: undefined;
            captureAsync?: undefined;
            functions?: undefined;
            excludeFunctions?: undefined;
            exclude?: undefined;
            languages?: undefined;
            restore?: undefined;
            minDuration?: undefined;
            maxDuration?: undefined;
            hasError?: undefined;
            traceId?: undefined;
            threshold?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            entries: {
                type: string;
                description: string;
                items: {
                    type: string;
                    properties: {
                        level: {
                            type: string;
                        };
                        category: {
                            type: string;
                        };
                        source: {
                            type: string;
                        };
                        message: {
                            type: string;
                        };
                        context: {
                            type: string;
                        };
                    };
                };
            };
            level?: undefined;
            category?: undefined;
            source?: undefined;
            message?: undefined;
            context?: undefined;
            query?: undefined;
            limit?: undefined;
            file?: undefined;
            captureParams?: undefined;
            captureReturn?: undefined;
            captureAsync?: undefined;
            functions?: undefined;
            excludeFunctions?: undefined;
            exclude?: undefined;
            languages?: undefined;
            restore?: undefined;
            minDuration?: undefined;
            maxDuration?: undefined;
            hasError?: undefined;
            traceId?: undefined;
            threshold?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            query: {
                type: string;
                description: string;
            };
            category: {
                type: string;
                description: string;
                enum?: undefined;
            };
            level: {
                type: string;
                description: string;
                enum?: undefined;
                minimum?: undefined;
                maximum?: undefined;
            };
            limit: {
                type: string;
                description: string;
            };
            source?: undefined;
            message?: undefined;
            context?: undefined;
            entries?: undefined;
            file?: undefined;
            captureParams?: undefined;
            captureReturn?: undefined;
            captureAsync?: undefined;
            functions?: undefined;
            excludeFunctions?: undefined;
            exclude?: undefined;
            languages?: undefined;
            restore?: undefined;
            minDuration?: undefined;
            maxDuration?: undefined;
            hasError?: undefined;
            traceId?: undefined;
            threshold?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            file: {
                type: string;
                description: string;
            };
            level?: undefined;
            category?: undefined;
            source?: undefined;
            message?: undefined;
            context?: undefined;
            entries?: undefined;
            query?: undefined;
            limit?: undefined;
            captureParams?: undefined;
            captureReturn?: undefined;
            captureAsync?: undefined;
            functions?: undefined;
            excludeFunctions?: undefined;
            exclude?: undefined;
            languages?: undefined;
            restore?: undefined;
            minDuration?: undefined;
            maxDuration?: undefined;
            hasError?: undefined;
            traceId?: undefined;
            threshold?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            file: {
                type: string;
                description: string;
            };
            level: {
                type: string;
                description: string;
                minimum: number;
                maximum: number;
                enum?: undefined;
            };
            captureParams: {
                type: string;
                description: string;
            };
            captureReturn: {
                type: string;
                description: string;
            };
            captureAsync: {
                type: string;
                description: string;
            };
            category?: undefined;
            source?: undefined;
            message?: undefined;
            context?: undefined;
            entries?: undefined;
            query?: undefined;
            limit?: undefined;
            functions?: undefined;
            excludeFunctions?: undefined;
            exclude?: undefined;
            languages?: undefined;
            restore?: undefined;
            minDuration?: undefined;
            maxDuration?: undefined;
            hasError?: undefined;
            traceId?: undefined;
            threshold?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            file: {
                type: string;
                description: string;
            };
            level: {
                type: string;
                description: string;
                minimum: number;
                maximum: number;
                enum?: undefined;
            };
            functions: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            excludeFunctions: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            category?: undefined;
            source?: undefined;
            message?: undefined;
            context?: undefined;
            entries?: undefined;
            query?: undefined;
            limit?: undefined;
            captureParams?: undefined;
            captureReturn?: undefined;
            captureAsync?: undefined;
            exclude?: undefined;
            languages?: undefined;
            restore?: undefined;
            minDuration?: undefined;
            maxDuration?: undefined;
            hasError?: undefined;
            traceId?: undefined;
            threshold?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            file: {
                type: string;
                description: string;
            };
            functions: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            level: {
                type: string;
                description: string;
                minimum: number;
                maximum: number;
                enum?: undefined;
            };
            category?: undefined;
            source?: undefined;
            message?: undefined;
            context?: undefined;
            entries?: undefined;
            query?: undefined;
            limit?: undefined;
            captureParams?: undefined;
            captureReturn?: undefined;
            captureAsync?: undefined;
            excludeFunctions?: undefined;
            exclude?: undefined;
            languages?: undefined;
            restore?: undefined;
            minDuration?: undefined;
            maxDuration?: undefined;
            hasError?: undefined;
            traceId?: undefined;
            threshold?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            level: {
                type: string;
                description: string;
                minimum: number;
                maximum: number;
                enum?: undefined;
            };
            exclude: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            languages: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            category?: undefined;
            source?: undefined;
            message?: undefined;
            context?: undefined;
            entries?: undefined;
            query?: undefined;
            limit?: undefined;
            file?: undefined;
            captureParams?: undefined;
            captureReturn?: undefined;
            captureAsync?: undefined;
            functions?: undefined;
            excludeFunctions?: undefined;
            restore?: undefined;
            minDuration?: undefined;
            maxDuration?: undefined;
            hasError?: undefined;
            traceId?: undefined;
            threshold?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            file: {
                type: string;
                description: string;
            };
            restore: {
                type: string;
                description: string;
            };
            level?: undefined;
            category?: undefined;
            source?: undefined;
            message?: undefined;
            context?: undefined;
            entries?: undefined;
            query?: undefined;
            limit?: undefined;
            captureParams?: undefined;
            captureReturn?: undefined;
            captureAsync?: undefined;
            functions?: undefined;
            excludeFunctions?: undefined;
            exclude?: undefined;
            languages?: undefined;
            minDuration?: undefined;
            maxDuration?: undefined;
            hasError?: undefined;
            traceId?: undefined;
            threshold?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            restore: {
                type: string;
                description: string;
            };
            level?: undefined;
            category?: undefined;
            source?: undefined;
            message?: undefined;
            context?: undefined;
            entries?: undefined;
            query?: undefined;
            limit?: undefined;
            file?: undefined;
            captureParams?: undefined;
            captureReturn?: undefined;
            captureAsync?: undefined;
            functions?: undefined;
            excludeFunctions?: undefined;
            exclude?: undefined;
            languages?: undefined;
            minDuration?: undefined;
            maxDuration?: undefined;
            hasError?: undefined;
            traceId?: undefined;
            threshold?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            query: {
                type: string;
                description: string;
            };
            file: {
                type: string;
                description: string;
            };
            minDuration: {
                type: string;
                description: string;
            };
            maxDuration: {
                type: string;
                description: string;
            };
            hasError: {
                type: string;
                description: string;
            };
            limit: {
                type: string;
                description: string;
            };
            level?: undefined;
            category?: undefined;
            source?: undefined;
            message?: undefined;
            context?: undefined;
            entries?: undefined;
            captureParams?: undefined;
            captureReturn?: undefined;
            captureAsync?: undefined;
            functions?: undefined;
            excludeFunctions?: undefined;
            exclude?: undefined;
            languages?: undefined;
            restore?: undefined;
            traceId?: undefined;
            threshold?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            traceId: {
                type: string;
                description: string;
            };
            level?: undefined;
            category?: undefined;
            source?: undefined;
            message?: undefined;
            context?: undefined;
            entries?: undefined;
            query?: undefined;
            limit?: undefined;
            file?: undefined;
            captureParams?: undefined;
            captureReturn?: undefined;
            captureAsync?: undefined;
            functions?: undefined;
            excludeFunctions?: undefined;
            exclude?: undefined;
            languages?: undefined;
            restore?: undefined;
            minDuration?: undefined;
            maxDuration?: undefined;
            hasError?: undefined;
            threshold?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            threshold: {
                type: string;
                description: string;
            };
            limit: {
                type: string;
                description: string;
            };
            level?: undefined;
            category?: undefined;
            source?: undefined;
            message?: undefined;
            context?: undefined;
            entries?: undefined;
            query?: undefined;
            file?: undefined;
            captureParams?: undefined;
            captureReturn?: undefined;
            captureAsync?: undefined;
            functions?: undefined;
            excludeFunctions?: undefined;
            exclude?: undefined;
            languages?: undefined;
            restore?: undefined;
            minDuration?: undefined;
            maxDuration?: undefined;
            hasError?: undefined;
            traceId?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            limit: {
                type: string;
                description: string;
            };
            level?: undefined;
            category?: undefined;
            source?: undefined;
            message?: undefined;
            context?: undefined;
            entries?: undefined;
            query?: undefined;
            file?: undefined;
            captureParams?: undefined;
            captureReturn?: undefined;
            captureAsync?: undefined;
            functions?: undefined;
            excludeFunctions?: undefined;
            exclude?: undefined;
            languages?: undefined;
            restore?: undefined;
            minDuration?: undefined;
            maxDuration?: undefined;
            hasError?: undefined;
            traceId?: undefined;
            threshold?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            file: {
                type: string;
                description: string;
            };
            level?: undefined;
            category?: undefined;
            source?: undefined;
            message?: undefined;
            context?: undefined;
            entries?: undefined;
            query?: undefined;
            limit?: undefined;
            captureParams?: undefined;
            captureReturn?: undefined;
            captureAsync?: undefined;
            functions?: undefined;
            excludeFunctions?: undefined;
            exclude?: undefined;
            languages?: undefined;
            restore?: undefined;
            minDuration?: undefined;
            maxDuration?: undefined;
            hasError?: undefined;
            traceId?: undefined;
            threshold?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            level?: undefined;
            category?: undefined;
            source?: undefined;
            message?: undefined;
            context?: undefined;
            entries?: undefined;
            query?: undefined;
            limit?: undefined;
            file?: undefined;
            captureParams?: undefined;
            captureReturn?: undefined;
            captureAsync?: undefined;
            functions?: undefined;
            excludeFunctions?: undefined;
            exclude?: undefined;
            languages?: undefined;
            restore?: undefined;
            minDuration?: undefined;
            maxDuration?: undefined;
            hasError?: undefined;
            traceId?: undefined;
            threshold?: undefined;
        };
        required?: undefined;
    };
})[];
/**
 * MCP Tool Handlers
 */
export declare function handleLoggingTracingTool(name: string, args: any): Promise<any>;
//# sourceMappingURL=tools.d.ts.map