import { describe, it, expect } from 'vitest';
import { runHook, createHookInput } from './test-utils';

describe('Non-approved scenarios', () => {
  describe('Logic changes', () => {
    it('should not approve changing variable values', async () => {
      const input = createHookInput(
        'Edit',
        'test.ts',
        'const x = 1',
        'const x = 2'
      );
      
      const result = await runHook(input);
      
      expect(result.exitCode).toBe(0);
      expect(result.parsed?.decision).toBeUndefined();
    });

    it('should not approve changing function logic', async () => {
      const input = createHookInput(
        'Edit',
        'test.ts',
        'function add(a, b) { return a + b; }',
        'function add(a, b) { return a * b; }'
      );
      
      const result = await runHook(input);
      
      expect(result.exitCode).toBe(0);
      expect(result.parsed?.decision).toBeUndefined();
    });

    it('should not approve adding new code logic', async () => {
      const input = createHookInput(
        'Edit',
        'test.ts',
        'const x = 1',
        'const x = 1; console.log(x);'
      );
      
      const result = await runHook(input);
      
      expect(result.exitCode).toBe(0);
      expect(result.parsed?.decision).toBeUndefined();
    });

    it('should not approve changing string literals', async () => {
      const input = createHookInput(
        'Edit',
        'test.ts',
        'const message = "Hello"',
        'const message = "Goodbye"'
      );
      
      const result = await runHook(input);
      
      expect(result.exitCode).toBe(0);
      expect(result.parsed?.decision).toBeUndefined();
    });
  });

  describe('Structural changes', () => {
    it('should not approve adding new functions', async () => {
      const input = createHookInput(
        'Edit',
        'test.ts',
        'const x = 1',
        'const x = 1; function newFunc() { return 2; }'
      );
      
      const result = await runHook(input);
      
      expect(result.exitCode).toBe(0);
      expect(result.parsed?.decision).toBeUndefined();
    });

    it('should not approve adding new class methods', async () => {
      const input = createHookInput(
        'Edit',
        'test.ts',
        'class Test { }',
        'class Test { method() { return 1; } }'
      );
      
      const result = await runHook(input);
      
      expect(result.exitCode).toBe(0);
      expect(result.parsed?.decision).toBeUndefined();
    });

    it('should not approve changing class structure', async () => {
      const input = createHookInput(
        'Edit',
        'test.ts',
        'class Test extends Base { }',
        'class Test extends Other { }'
      );
      
      const result = await runHook(input);
      
      expect(result.exitCode).toBe(0);
      expect(result.parsed?.decision).toBeUndefined();
    });
  });

  describe('Variable changes', () => {
    it('should not approve simple variable rename', async () => {
      const input = createHookInput(
        'Edit',
        'test.ts',
        'const temp = getValue()',
        'const result = getValue()'
      );
      
      const result = await runHook(input);
      
      expect(result.exitCode).toBe(0);
      expect(result.parsed?.decision).toBeUndefined();
    });

    it('should not approve function parameter rename', async () => {
      const input = createHookInput(
        'Edit',
        'test.ts',
        'function process(data) { return data; }',
        'function process(input) { return input; }'
      );
      
      const result = await runHook(input);
      
      expect(result.exitCode).toBe(0);
      expect(result.parsed?.decision).toBeUndefined();
    });

    it('should not approve multiple variable renames', async () => {
      const input = createHookInput(
        'Edit',
        'test.ts',
        'const a = 1, b = 2',
        'const x = 1, y = 2'
      );
      
      const result = await runHook(input);
      
      expect(result.exitCode).toBe(0);
      expect(result.parsed?.decision).toBeUndefined();
    });

    it('should not approve variable rename with value change', async () => {
      const input = createHookInput(
        'Edit',
        'test.ts',
        'const temp = 1',
        'const result = 2'
      );
      
      const result = await runHook(input);
      
      expect(result.exitCode).toBe(0);
      expect(result.parsed?.decision).toBeUndefined();
    });
  });

  describe('Type annotations', () => {
    it('should not approve adding type annotations to variables', async () => {
      const input = createHookInput(
        'Edit',
        'test.ts',
        'const x = 1',
        'const x: number = 1'
      );
      
      const result = await runHook(input);
      
      expect(result.exitCode).toBe(0);
      expect(result.parsed?.decision).toBeUndefined();
    });

    it('should not approve adding type annotations to function parameters', async () => {
      const input = createHookInput(
        'Edit',
        'test.ts',
        'function test(x) { return x; }',
        'function test(x: number) { return x; }'
      );
      
      const result = await runHook(input);
      
      expect(result.exitCode).toBe(0);
      expect(result.parsed?.decision).toBeUndefined();
    });

    it('should not approve type annotation with logic change', async () => {
      const input = createHookInput(
        'Edit',
        'test.ts',
        'const x = 1',
        'const x: number = 2'
      );
      
      const result = await runHook(input);
      
      expect(result.exitCode).toBe(0);
      expect(result.parsed?.decision).toBeUndefined();
    });

    it('should not approve adding JSDoc comments', async () => {
      const input = createHookInput(
        'Edit',
        'test.ts',
        'function add(a, b) { return a + b; }',
        '/**\n * Adds two numbers\n */\nfunction add(a, b) { return a + b; }'
      );
      
      const result = await runHook(input);
      
      expect(result.exitCode).toBe(0);
      expect(result.parsed?.decision).toBeUndefined();
    });

    it('should not approve JSDoc with implementation change', async () => {
      const input = createHookInput(
        'Edit',
        'test.ts',
        'function add(a, b) { return a + b; }',
        '/** Multiplies two numbers */\nfunction add(a, b) { return a * b; }'
      );
      
      const result = await runHook(input);
      
      expect(result.exitCode).toBe(0);
      expect(result.parsed?.decision).toBeUndefined();
    });
  });

  describe('Non-import statement changes', () => {
    it('should not approve regular code as import', async () => {
      const input = createHookInput(
        'Edit',
        'test.ts',
        'const x = 1',
        'const import = require("module")'
      );
      
      const result = await runHook(input);
      
      expect(result.exitCode).toBe(0);
      expect(result.parsed?.decision).toBeUndefined();
    });

    it('should not approve adding logic to non-import code', async () => {
      const input = createHookInput(
        'Edit',
        'test.ts',
        'const x = 1',
        'const x = 1; console.log("added logic");'
      );
      
      const result = await runHook(input);
      
      expect(result.exitCode).toBe(0);
      expect(result.parsed?.decision).toBeUndefined();
    });
  });
});