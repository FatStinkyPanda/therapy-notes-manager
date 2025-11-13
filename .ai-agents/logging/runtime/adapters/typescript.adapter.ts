/**
 * TypeScript/JavaScript Instrumenter
 *
 * Uses TypeScript Compiler API to parse and transform code,
 * automatically wrapping functions with tracing instrumentation.
 */

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

export interface InstrumentOptions {
  level: number;
  captureParams: boolean;
  captureReturn: boolean;
  captureVars: boolean;
  captureAsync: boolean;
  functions?: string[]; // Specific functions to instrument (empty = all)
  excludeFunctions?: string[]; // Functions to exclude
}

export interface InstrumentResult {
  success: boolean;
  originalCode: string;
  instrumentedCode: string;
  functionsWrapped: number;
  backupPath: string;
  error?: string;
}

export class TypeScriptInstrumenter {
  private backupDir: string;

  constructor() {
    this.backupDir = path.join(process.cwd(), '.ai-agents', 'logging', 'backups', 'original');
    this.ensureBackupDir();
  }

  /**
   * Instrument a TypeScript/JavaScript file
   */
  public async instrumentFile(filePath: string, options: InstrumentOptions): Promise<InstrumentResult> {
    try {
      // Read original file
      const originalCode = fs.readFileSync(filePath, 'utf-8');

      // Create backup
      const backupPath = this.createBackup(filePath, originalCode);

      // Check if already instrumented
      if (this.isInstrumented(originalCode)) {
        return {
          success: false,
          originalCode,
          instrumentedCode: originalCode,
          functionsWrapped: 0,
          backupPath,
          error: 'File is already instrumented. Use uninstrument first.'
        };
      }

      // Parse to AST
      const sourceFile = ts.createSourceFile(
        filePath,
        originalCode,
        ts.ScriptTarget.Latest,
        true
      );

      // Transform AST
      let functionsWrapped = 0;
      const transformer = this.createTransformer(filePath, options, () => functionsWrapped++);
      const result = ts.transform(sourceFile, [transformer]);
      const transformedSourceFile = result.transformed[0];

      // Generate code
      const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
      let instrumentedCode = printer.printFile(transformedSourceFile as ts.SourceFile);

      // Add import at the top
      instrumentedCode = this.addTracerImport(instrumentedCode);

      // Clean up
      result.dispose();

      // Write instrumented code
      fs.writeFileSync(filePath, instrumentedCode, 'utf-8');

      return {
        success: true,
        originalCode,
        instrumentedCode,
        functionsWrapped,
        backupPath
      };
    } catch (error: any) {
      return {
        success: false,
        originalCode: '',
        instrumentedCode: '',
        functionsWrapped: 0,
        backupPath: '',
        error: error.message
      };
    }
  }

  /**
   * Remove instrumentation from a file
   */
  public async uninstrumentFile(filePath: string, restore: boolean = true): Promise<boolean> {
    try {
      if (restore) {
        // Restore from backup
        const backupPath = this.getBackupPath(filePath);
        if (fs.existsSync(backupPath)) {
          const originalCode = fs.readFileSync(backupPath, 'utf-8');
          fs.writeFileSync(filePath, originalCode, 'utf-8');
          return true;
        }
      } else {
        // Remove instrumentation by parsing and removing tracer calls
        const code = fs.readFileSync(filePath, 'utf-8');
        const cleaned = this.removeInstrumentation(code);
        fs.writeFileSync(filePath, cleaned, 'utf-8');
        return true;
      }
      return false;
    } catch (error) {
      console.error('[Instrumenter] Failed to uninstrument:', error);
      return false;
    }
  }

  /**
   * Create transformer factory
   */
  private createTransformer(
    filePath: string,
    options: InstrumentOptions,
    onFunctionWrapped: () => void
  ): ts.TransformerFactory<ts.SourceFile> {
    return (context: ts.TransformationContext) => {
      const visit: ts.Visitor = (node: ts.Node): ts.Node => {
        // Transform function declarations
        if (ts.isFunctionDeclaration(node) && node.name) {
          return this.transformFunction(node, filePath, options, onFunctionWrapped);
        }

        // Transform arrow functions assigned to const/let/var
        if (ts.isVariableStatement(node)) {
          return this.transformVariableStatement(node, filePath, options, onFunctionWrapped);
        }

        // Transform method declarations in classes
        if (ts.isMethodDeclaration(node)) {
          return this.transformMethod(node, filePath, options, onFunctionWrapped);
        }

        return ts.visitEachChild(node, visit, context);
      };

      return (sourceFile: ts.SourceFile) => ts.visitNode(sourceFile, visit) as ts.SourceFile;
    };
  }

  /**
   * Transform function declaration
   */
  private transformFunction(
    node: ts.FunctionDeclaration,
    filePath: string,
    options: InstrumentOptions,
    onWrapped: () => void
  ): ts.FunctionDeclaration {
    const functionName = node.name?.getText() || 'anonymous';

    // Check if should instrument this function
    if (!this.shouldInstrumentFunction(functionName, options)) {
      return node;
    }

    onWrapped();

    const isAsync = node.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword) ?? false;
    const wrappedBody = this.wrapFunctionBody(node.body!, functionName, filePath, options, isAsync);

    return ts.factory.updateFunctionDeclaration(
      node,
      node.modifiers,
      node.asteriskToken,
      node.name,
      node.typeParameters,
      node.parameters,
      node.type,
      wrappedBody
    );
  }

  /**
   * Transform variable statement (for arrow functions)
   */
  private transformVariableStatement(
    node: ts.VariableStatement,
    filePath: string,
    options: InstrumentOptions,
    onWrapped: () => void
  ): ts.VariableStatement {
    const declaration = node.declarationList.declarations[0];
    if (!declaration.initializer) return node;

    // Check if it's an arrow function
    if (ts.isArrowFunction(declaration.initializer)) {
      const functionName = declaration.name.getText();

      if (!this.shouldInstrumentFunction(functionName, options)) {
        return node;
      }

      onWrapped();

      const arrowFunc = declaration.initializer;
      const isAsync = arrowFunc.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword) ?? false;

      // If arrow function has block body
      if (ts.isBlock(arrowFunc.body)) {
        const wrappedBody = this.wrapFunctionBody(arrowFunc.body, functionName, filePath, options, isAsync);

        const newArrow = ts.factory.updateArrowFunction(
          arrowFunc,
          arrowFunc.modifiers,
          arrowFunc.typeParameters,
          arrowFunc.parameters,
          arrowFunc.type,
          arrowFunc.equalsGreaterThanToken,
          wrappedBody
        );

        const newDeclaration = ts.factory.updateVariableDeclaration(
          declaration,
          declaration.name,
          declaration.exclamationToken,
          declaration.type,
          newArrow
        );

        return ts.factory.updateVariableStatement(
          node,
          node.modifiers,
          ts.factory.updateVariableDeclarationList(
            node.declarationList,
            [newDeclaration]
          )
        );
      }
    }

    return node;
  }

  /**
   * Transform method declaration
   */
  private transformMethod(
    node: ts.MethodDeclaration,
    filePath: string,
    options: InstrumentOptions,
    onWrapped: () => void
  ): ts.MethodDeclaration {
    const methodName = node.name.getText();

    if (!this.shouldInstrumentFunction(methodName, options)) {
      return node;
    }

    onWrapped();

    const isAsync = node.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword) ?? false;
    const wrappedBody = this.wrapFunctionBody(node.body!, methodName, filePath, options, isAsync);

    return ts.factory.updateMethodDeclaration(
      node,
      node.modifiers,
      node.asteriskToken,
      node.name,
      node.questionToken,
      node.typeParameters,
      node.parameters,
      node.type,
      wrappedBody
    );
  }

  /**
   * Wrap function body with tracing code
   */
  private wrapFunctionBody(
    body: ts.Block,
    functionName: string,
    filePath: string,
    options: InstrumentOptions,
    isAsync: boolean
  ): ts.Block {
    const level = options.level;

    if (level === 0) return body; // No instrumentation
    if (level === 1) return this.wrapMinimal(body, functionName, filePath);
    if (level === 2) return this.wrapStandard(body, functionName, filePath, options);
    if (level >= 3) return this.wrapDetailed(body, functionName, filePath, options, isAsync);

    return body;
  }

  /**
   * Level 1: Minimal - Just entry/exit
   */
  private wrapMinimal(body: ts.Block, functionName: string, filePath: string): ts.Block {
    const statements = [
      // __tracer.enter('functionName', 'file.ts');
      ts.factory.createExpressionStatement(
        this.createTracerCall('enter', [
          ts.factory.createStringLiteral(functionName),
          ts.factory.createStringLiteral(filePath)
        ])
      ),
      ...body.statements,
      // __tracer.exit('functionName');
      ts.factory.createExpressionStatement(
        this.createTracerCall('exit', [
          ts.factory.createStringLiteral(functionName)
        ])
      )
    ];

    return ts.factory.createBlock(statements, true);
  }

  /**
   * Level 2: Standard - Entry/exit with params and return
   */
  private wrapStandard(
    body: ts.Block,
    functionName: string,
    filePath: string,
    options: InstrumentOptions
  ): ts.Block {
    // const __ctx = __tracer.startFunction('name', 'file.ts', arguments);
    const startCall = this.createVariableStatement('__ctx',
      this.createTracerCall('startFunction', [
        ts.factory.createStringLiteral(functionName),
        ts.factory.createStringLiteral(filePath),
        ts.factory.createIdentifier('arguments')
      ])
    );

    // Wrap body in try-catch
    const tryBlock = this.wrapInTryCatch(body, functionName);

    return ts.factory.createBlock([startCall, tryBlock], true);
  }

  /**
   * Level 3+: Detailed - Everything
   */
  private wrapDetailed(
    body: ts.Block,
    functionName: string,
    filePath: string,
    options: InstrumentOptions,
    isAsync: boolean
  ): ts.Block {
    // Same as standard for now, would need more complex transformation for child calls
    return this.wrapStandard(body, functionName, filePath, options);
  }

  /**
   * Wrap statements in try-catch with tracer calls
   */
  private wrapInTryCatch(body: ts.Block, functionName: string): ts.TryStatement {
    // Find return statements and wrap them
    const transformReturn = (node: ts.Node): ts.Node => {
      if (ts.isReturnStatement(node) && node.expression) {
        // return __tracer.endFunction(__ctx, value);
        return ts.factory.createReturnStatement(
          this.createTracerCall('endFunction', [
            ts.factory.createIdentifier('__ctx'),
            node.expression
          ])
        );
      }
      return ts.visitEachChild(node, transformReturn, undefined as any);
    };

    const transformedStatements = body.statements.map(stmt =>
      ts.visitNode(stmt, transformReturn) as ts.Statement
    );

    const tryBlock = ts.factory.createBlock(transformedStatements, true);

    // catch (error) { __tracer.errorFunction(__ctx, error); throw error; }
    const catchClause = ts.factory.createCatchClause(
      ts.factory.createVariableDeclaration(
        'error',
        undefined,
        undefined,
        undefined
      ),
      ts.factory.createBlock([
        ts.factory.createExpressionStatement(
          this.createTracerCall('errorFunction', [
            ts.factory.createIdentifier('__ctx'),
            ts.factory.createIdentifier('error')
          ])
        ),
        ts.factory.createThrowStatement(
          ts.factory.createIdentifier('error')
        )
      ], true)
    );

    return ts.factory.createTryStatement(tryBlock, catchClause, undefined);
  }

  /**
   * Create tracer method call
   */
  private createTracerCall(method: string, args: ts.Expression[]): ts.CallExpression {
    return ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier('__tracer'),
        ts.factory.createIdentifier(method)
      ),
      undefined,
      args
    );
  }

  /**
   * Create variable statement
   */
  private createVariableStatement(name: string, initializer: ts.Expression): ts.VariableStatement {
    return ts.factory.createVariableStatement(
      undefined,
      ts.factory.createVariableDeclarationList(
        [ts.factory.createVariableDeclaration(
          name,
          undefined,
          undefined,
          initializer
        )],
        ts.NodeFlags.Const
      )
    );
  }

  /**
   * Check if should instrument function
   */
  private shouldInstrumentFunction(functionName: string, options: InstrumentOptions): boolean {
    // Check exclude list
    if (options.excludeFunctions?.includes(functionName)) {
      return false;
    }

    // If specific functions specified, only instrument those
    if (options.functions && options.functions.length > 0) {
      return options.functions.includes(functionName);
    }

    // Check common exclusions from env
    const excluded = (process.env.TRACING_EXCLUDE_FUNCTIONS || '').split(',').map(f => f.trim());
    if (excluded.includes(functionName)) {
      return false;
    }

    // Check prefixes
    const excludePrefixes = (process.env.TRACING_EXCLUDE_FUNCTION_PREFIXES || '').split(',').map(p => p.trim());
    for (const prefix of excludePrefixes) {
      if (functionName.startsWith(prefix)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Add tracer import to code
   */
  private addTracerImport(code: string): string {
    const importStatement = `import { __tracer } from './.ai-agents/logging/runtime/tracer';\n\n`;
    return importStatement + code;
  }

  /**
   * Check if file is already instrumented
   */
  private isInstrumented(code: string): boolean {
    return code.includes('__tracer') || code.includes('from \'./.ai-agents/logging/runtime/tracer\'');
  }

  /**
   * Remove instrumentation from code
   */
  private removeInstrumentation(code: string): string {
    // Simple approach: remove import and __tracer calls
    // This is a placeholder - full implementation would parse AST and remove properly
    let cleaned = code.replace(/import\s+{\s*__tracer\s*}\s+from\s+['"].*tracer['"]\s*;?\s*\n?/g, '');
    cleaned = cleaned.replace(/__tracer\.\w+\([^)]*\)\s*;?\s*/g, '');
    cleaned = cleaned.replace(/const\s+__ctx\s*=\s*__tracer\.startFunction[^;]+;\s*/g, '');
    return cleaned;
  }

  /**
   * Create backup of original file
   */
  private createBackup(filePath: string, content: string): string {
    const relativePath = path.relative(process.cwd(), filePath);
    const backupPath = path.join(this.backupDir, relativePath);

    // Ensure directory exists
    const backupDirPath = path.dirname(backupPath);
    if (!fs.existsSync(backupDirPath)) {
      fs.mkdirSync(backupDirPath, { recursive: true });
    }

    // Write backup
    fs.writeFileSync(backupPath, content, 'utf-8');

    return backupPath;
  }

  /**
   * Get backup path for file
   */
  private getBackupPath(filePath: string): string {
    const relativePath = path.relative(process.cwd(), filePath);
    return path.join(this.backupDir, relativePath);
  }

  /**
   * Ensure backup directory exists
   */
  private ensureBackupDir(): void {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Get list of functions in file
   */
  public getFunctionsInFile(filePath: string): string[] {
    try {
      const code = fs.readFileSync(filePath, 'utf-8');
      const sourceFile = ts.createSourceFile(filePath, code, ts.ScriptTarget.Latest, true);

      const functions: string[] = [];

      const visit = (node: ts.Node) => {
        if (ts.isFunctionDeclaration(node) && node.name) {
          functions.push(node.name.getText());
        } else if (ts.isMethodDeclaration(node)) {
          functions.push(node.name.getText());
        } else if (ts.isVariableStatement(node)) {
          const declaration = node.declarationList.declarations[0];
          if (declaration.initializer && ts.isArrowFunction(declaration.initializer)) {
            functions.push(declaration.name.getText());
          }
        }
        ts.forEachChild(node, visit);
      };

      visit(sourceFile);

      return functions;
    } catch (error) {
      console.error('[Instrumenter] Failed to get functions:', error);
      return [];
    }
  }
}
