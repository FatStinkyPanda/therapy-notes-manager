"""
Python Instrumenter

Uses Python's ast module to parse and transform code,
automatically wrapping functions with tracing instrumentation.
"""

import ast
import astor
import os
from pathlib import Path
from typing import List, Optional, Dict, Any

class InstrumentOptions:
    def __init__(
        self,
        level: int = 2,
        capture_params: bool = True,
        capture_return: bool = True,
        capture_vars: bool = False,
        capture_async: bool = True,
        functions: Optional[List[str]] = None,
        exclude_functions: Optional[List[str]] = None
    ):
        self.level = level
        self.capture_params = capture_params
        self.capture_return = capture_return
        self.capture_vars = capture_vars
        self.capture_async = capture_async
        self.functions = functions or []
        self.exclude_functions = exclude_functions or []


class FunctionWrapper(ast.NodeTransformer):
    """AST transformer that wraps functions with tracing code"""

    def __init__(self, file_path: str, options: InstrumentOptions):
        self.file_path = file_path
        self.options = options
        self.functions_wrapped = 0
        self.exclude_functions = self._get_excluded_functions()

    def _get_excluded_functions(self) -> List[str]:
        """Get list of functions to exclude from instrumentation"""
        excluded = self.options.exclude_functions.copy()

        # Add from environment
        env_excluded = os.getenv('TRACING_EXCLUDE_FUNCTIONS', '')
        if env_excluded:
            excluded.extend([f.strip() for f in env_excluded.split(',')])

        # Common Python special methods
        excluded.extend(['__init__', '__str__', '__repr__', '__eq__'])

        return excluded

    def _should_instrument(self, func_name: str) -> bool:
        """Check if function should be instrumented"""
        # Check exclude list
        if func_name in self.exclude_functions:
            return False

        # If specific functions specified, only instrument those
        if self.options.functions:
            return func_name in self.options.functions

        # Check prefixes
        env_prefixes = os.getenv('TRACING_EXCLUDE_FUNCTION_PREFIXES', '')
        if env_prefixes:
            for prefix in env_prefixes.split(','):
                if func_name.startswith(prefix.strip()):
                    return False

        return True

    def visit_FunctionDef(self, node: ast.FunctionDef) -> ast.FunctionDef:
        """Transform function definitions"""
        if not self._should_instrument(node.name):
            return node

        self.functions_wrapped += 1

        if self.options.level == 0:
            return node
        elif self.options.level == 1:
            return self._wrap_minimal(node)
        elif self.options.level == 2:
            return self._wrap_standard(node)
        else:  # level >= 3
            return self._wrap_detailed(node)

    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef) -> ast.AsyncFunctionDef:
        """Transform async function definitions"""
        if not self._should_instrument(node.name):
            return node

        self.functions_wrapped += 1

        if self.options.level == 0:
            return node
        else:
            return self._wrap_async(node)

    def _wrap_minimal(self, node: ast.FunctionDef) -> ast.FunctionDef:
        """Level 1: Minimal - just entry/exit"""
        # __tracer.enter('function_name', 'file.py')
        enter_call = ast.Expr(
            value=ast.Call(
                func=ast.Attribute(
                    value=ast.Name(id='__tracer', ctx=ast.Load()),
                    attr='enter',
                    ctx=ast.Load()
                ),
                args=[
                    ast.Constant(value=node.name),
                    ast.Constant(value=self.file_path)
                ],
                keywords=[]
            )
        )

        # __tracer.exit('function_name')
        exit_call = ast.Expr(
            value=ast.Call(
                func=ast.Attribute(
                    value=ast.Name(id='__tracer', ctx=ast.Load()),
                    attr='exit',
                    ctx=ast.Load()
                ),
                args=[ast.Constant(value=node.name)],
                keywords=[]
            )
        )

        # Add to function body
        new_body = [enter_call] + node.body + [exit_call]
        node.body = new_body

        return node

    def _wrap_standard(self, node: ast.FunctionDef) -> ast.FunctionDef:
        """Level 2: Standard - entry/exit with params and return"""
        # Get function parameters as dict
        params_dict = self._create_params_dict(node.args)

        # __ctx = __tracer.start_function('name', 'file.py', params)
        start_call = ast.Assign(
            targets=[ast.Name(id='__ctx', ctx=ast.Store())],
            value=ast.Call(
                func=ast.Attribute(
                    value=ast.Name(id='__tracer', ctx=ast.Load()),
                    attr='start_function',
                    ctx=ast.Load()
                ),
                args=[
                    ast.Constant(value=node.name),
                    ast.Constant(value=self.file_path),
                    params_dict
                ],
                keywords=[]
            )
        )

        # Wrap body in try-except
        try_body = self._transform_returns(node.body)

        # except Exception as error:
        #     __tracer.error_function(__ctx, error)
        #     raise
        except_handler = ast.ExceptHandler(
            type=ast.Name(id='Exception', ctx=ast.Load()),
            name='error',
            body=[
                ast.Expr(
                    value=ast.Call(
                        func=ast.Attribute(
                            value=ast.Name(id='__tracer', ctx=ast.Load()),
                            attr='error_function',
                            ctx=ast.Load()
                        ),
                        args=[
                            ast.Name(id='__ctx', ctx=ast.Load()),
                            ast.Name(id='error', ctx=ast.Load())
                        ],
                        keywords=[]
                    )
                ),
                ast.Raise(exc=ast.Name(id='error', ctx=ast.Load()))
            ]
        )

        try_except = ast.Try(
            body=try_body,
            handlers=[except_handler],
            orelse=[],
            finalbody=[]
        )

        node.body = [start_call, try_except]

        return node

    def _wrap_detailed(self, node: ast.FunctionDef) -> ast.FunctionDef:
        """Level 3+: Detailed - with child calls and async tracking"""
        # For now, same as standard
        # Full implementation would wrap all function calls within the body
        return self._wrap_standard(node)

    def _wrap_async(self, node: ast.AsyncFunctionDef) -> ast.AsyncFunctionDef:
        """Wrap async functions"""
        params_dict = self._create_params_dict(node.args)

        start_call = ast.Assign(
            targets=[ast.Name(id='__ctx', ctx=ast.Store())],
            value=ast.Call(
                func=ast.Attribute(
                    value=ast.Name(id='__tracer', ctx=ast.Load()),
                    attr='start_function',
                    ctx=ast.Load()
                ),
                args=[
                    ast.Constant(value=node.name),
                    ast.Constant(value=self.file_path),
                    params_dict
                ],
                keywords=[]
            )
        )

        try_body = self._transform_returns(node.body)

        except_handler = ast.ExceptHandler(
            type=ast.Name(id='Exception', ctx=ast.Load()),
            name='error',
            body=[
                ast.Expr(
                    value=ast.Call(
                        func=ast.Attribute(
                            value=ast.Name(id='__tracer', ctx=ast.Load()),
                            attr='error_function',
                            ctx=ast.Load()
                        ),
                        args=[
                            ast.Name(id='__ctx', ctx=ast.Load()),
                            ast.Name(id='error', ctx=ast.Load())
                        ],
                        keywords=[]
                    )
                ),
                ast.Raise(exc=ast.Name(id='error', ctx=ast.Load()))
            ]
        )

        try_except = ast.Try(
            body=try_body,
            handlers=[except_handler],
            orelse=[],
            finalbody=[]
        )

        node.body = [start_call, try_except]

        return node

    def _create_params_dict(self, args: ast.arguments) -> ast.Dict:
        """Create dictionary of function parameters"""
        keys = []
        values = []

        # Regular arguments
        for arg in args.args:
            keys.append(ast.Constant(value=arg.arg))
            values.append(ast.Name(id=arg.arg, ctx=ast.Load()))

        return ast.Dict(keys=keys, values=values)

    def _transform_returns(self, body: List[ast.stmt]) -> List[ast.stmt]:
        """Transform return statements to call tracer"""
        transformer = ReturnTransformer()
        return [transformer.visit(stmt) for stmt in body]


class ReturnTransformer(ast.NodeTransformer):
    """Transformer that wraps return statements"""

    def visit_Return(self, node: ast.Return) -> ast.Return:
        """Transform return statement to call __tracer.end_function"""
        if node.value:
            # return __tracer.end_function(__ctx, value)
            node.value = ast.Call(
                func=ast.Attribute(
                    value=ast.Name(id='__tracer', ctx=ast.Load()),
                    attr='end_function',
                    ctx=ast.Load()
                ),
                args=[
                    ast.Name(id='__ctx', ctx=ast.Load()),
                    node.value
                ],
                keywords=[]
            )
        return node


class PythonInstrumenter:
    """Main instrumenter class for Python files"""

    def __init__(self):
        self.backup_dir = Path.cwd() / '.ai-agents' / 'logging' / 'backups' / 'original'
        self.backup_dir.mkdir(parents=True, exist_ok=True)

    def instrument_file(self, file_path: str, options: InstrumentOptions) -> Dict[str, Any]:
        """Instrument a Python file"""
        try:
            # Read original file
            with open(file_path, 'r', encoding='utf-8') as f:
                original_code = f.read()

            # Create backup
            backup_path = self._create_backup(file_path, original_code)

            # Check if already instrumented
            if self._is_instrumented(original_code):
                return {
                    'success': False,
                    'error': 'File is already instrumented. Use uninstrument first.',
                    'functions_wrapped': 0,
                    'backup_path': backup_path
                }

            # Parse to AST
            tree = ast.parse(original_code, filename=file_path)

            # Transform AST
            transformer = FunctionWrapper(file_path, options)
            new_tree = transformer.visit(tree)

            # Fix missing locations
            ast.fix_missing_locations(new_tree)

            # Generate code
            instrumented_code = astor.to_source(new_tree)

            # Add tracer import
            instrumented_code = self._add_tracer_import(instrumented_code)

            # Write instrumented code
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(instrumented_code)

            return {
                'success': True,
                'original_code': original_code,
                'instrumented_code': instrumented_code,
                'functions_wrapped': transformer.functions_wrapped,
                'backup_path': backup_path
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'functions_wrapped': 0,
                'backup_path': ''
            }

    def uninstrument_file(self, file_path: str, restore: bool = True) -> bool:
        """Remove instrumentation from a file"""
        try:
            if restore:
                # Restore from backup
                backup_path = self._get_backup_path(file_path)
                if backup_path.exists():
                    with open(backup_path, 'r', encoding='utf-8') as f:
                        original_code = f.read()
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(original_code)
                    return True
            else:
                # Remove instrumentation
                with open(file_path, 'r', encoding='utf-8') as f:
                    code = f.read()
                cleaned = self._remove_instrumentation(code)
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(cleaned)
                return True
            return False
        except Exception as e:
            print(f'[Instrumenter] Failed to uninstrument: {e}')
            return False

    def get_functions_in_file(self, file_path: str) -> List[str]:
        """Get list of functions in a file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                code = f.read()

            tree = ast.parse(code, filename=file_path)
            functions = []

            for node in ast.walk(tree):
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    functions.append(node.name)

            return functions

        except Exception as e:
            print(f'[Instrumenter] Failed to get functions: {e}')
            return []

    def _add_tracer_import(self, code: str) -> str:
        """Add tracer import to code"""
        import_statement = 'from .ai_agents.logging.runtime.tracer import __tracer\n\n'
        return import_statement + code

    def _is_instrumented(self, code: str) -> bool:
        """Check if code is already instrumented"""
        return '__tracer' in code or 'from .ai_agents.logging.runtime.tracer' in code

    def _remove_instrumentation(self, code: str) -> str:
        """Remove instrumentation from code"""
        # Simple approach: remove import and __tracer calls
        lines = code.split('\n')
        cleaned_lines = []

        for line in lines:
            if '__tracer' not in line and 'from .ai_agents.logging.runtime.tracer' not in line:
                cleaned_lines.append(line)

        return '\n'.join(cleaned_lines)

    def _create_backup(self, file_path: str, content: str) -> Path:
        """Create backup of original file"""
        relative_path = Path(file_path).relative_to(Path.cwd())
        backup_path = self.backup_dir / relative_path

        # Ensure directory exists
        backup_path.parent.mkdir(parents=True, exist_ok=True)

        # Write backup
        with open(backup_path, 'w', encoding='utf-8') as f:
            f.write(content)

        return backup_path

    def _get_backup_path(self, file_path: str) -> Path:
        """Get backup path for file"""
        relative_path = Path(file_path).relative_to(Path.cwd())
        return self.backup_dir / relative_path
