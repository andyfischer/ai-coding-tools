import { describe, it, expect } from 'vitest';
import { runHook, createHookInput } from './test-utils';

describe('Edge cases and error handling', () => {
  describe('File type filtering', () => {
    it('should skip non-TypeScript files', async () => {
      const input = createHookInput(
        'Edit',
        'test.js',
        'const x = 1',
        'const x = 2'
      );
      
      const result = await runHook(input);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe('');
    });

    it('should process .tsx files', async () => {
      const input = createHookInput(
        'Edit',
        'Component.tsx',
        'const x=1',
        'const x = 1'
      );
      
      const result = await runHook(input);
      
      expect(result.exitCode).toBe(0);
      expect(result.parsed?.decision).toBe('approve');
    });

    it('should skip non-Edit tools', async () => {
      const input = createHookInput(
        'Write',
        'test.ts',
        undefined,
        'const x = 1'
      );
      
      const result = await runHook(input);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe('');
    });
  });

  describe('Input validation', () => {
    it('should handle empty old_string', async () => {
      const input = createHookInput(
        'Edit',
        'test.ts',
        '',
        'const x = 1'
      );
      
      const result = await runHook(input);
      
      expect(result.exitCode).toBe(0);
      expect(result.parsed?.decision).toBeUndefined();
    });

    it('should handle empty new_string', async () => {
      const input = createHookInput(
        'Edit',
        'test.ts',
        'const x = 1',
        ''
      );
      
      const result = await runHook(input);
      
      expect(result.exitCode).toBe(0);
      expect(result.parsed?.decision).toBeUndefined();
    });

    it('should handle identical strings', async () => {
      const input = createHookInput(
        'Edit',
        'test.ts',
        'const x = 1',
        'const x = 1'
      );
      
      const result = await runHook(input);
      
      expect(result.exitCode).toBe(0);
      expect(result.parsed?.decision).toBe('approve');
    });

    it('should handle missing old_string field', async () => {
      const input = {
        session_id: 'test',
        transcript_path: '/tmp/test',
        tool_name: 'Edit',
        tool_input: {
          file_path: 'test.ts',
          new_string: 'const x = 1'
        }
      };
      
      const result = await runHook(input);
      
      expect(result.exitCode).toBe(0);
      expect(result.parsed?.decision).toBeUndefined();
    });

    it('should handle missing new_string field', async () => {
      const input = {
        session_id: 'test',
        transcript_path: '/tmp/test',
        tool_name: 'Edit',
        tool_input: {
          file_path: 'test.ts',
          old_string: 'const x = 1'
        }
      };
      
      const result = await runHook(input);
      
      expect(result.exitCode).toBe(0);
      expect(result.parsed?.decision).toBeUndefined();
    });
  });

  describe('Complex whitespace scenarios', () => {
    it('should handle tabs vs spaces', async () => {
      const input = createHookInput(
        'Edit',
        'test.ts',
        '\tconst x = 1;',
        '    const x = 1;'
      );
      
      const result = await runHook(input);
      
      expect(result.exitCode).toBe(0);
      expect(result.parsed?.decision).toBe('approve');
    });

    it('should handle mixed line endings', async () => {
      const input = createHookInput(
        'Edit',
        'test.ts',
        'const x = 1;\r\nconst y = 2;',
        'const x = 1;\nconst y = 2;'
      );
      
      const result = await runHook(input);
      
      expect(result.exitCode).toBe(0);
      expect(result.parsed?.decision).toBe('approve');
    });

    it('should handle trailing whitespace', async () => {
      const input = createHookInput(
        'Edit',
        'test.ts',
        'const x = 1;  ',
        'const x = 1;'
      );
      
      const result = await runHook(input);
      
      expect(result.exitCode).toBe(0);
      expect(result.parsed?.decision).toBe('approve');
    });
  });

  describe('Regex edge cases', () => {
    it('should handle special regex characters in code', async () => {
      const input = createHookInput(
        'Edit',
        'test.ts',
        'const regex = /test.*/;',
        'const regex: RegExp = /test.*/;'
      );
      
      const result = await runHook(input);
      
      expect(result.exitCode).toBe(0);
      expect(result.parsed?.decision).toBeUndefined();
    });

    it('should handle code with parentheses in type annotations', async () => {
      const input = createHookInput(
        'Edit',
        'test.ts',
        'const fn = (x) => x',
        'const fn: (x: number) => number = (x) => x'
      );
      
      const result = await runHook(input);
      
      expect(result.exitCode).toBe(0);
      // This is a complex type annotation that might not be detected by our simple regex
      // so we shouldn't assume it will be approved
      expect(result.parsed?.decision).toBeUndefined();
    });
  });

  describe('Large content scenarios', () => {
    it('should handle multiline code blocks', async () => {
      const oldCode = `function complexFunction() {
  const x = 1;
  const y = 2;
  return x + y;
}`;
      
      const newCode = `function complexFunction() {
    const x = 1;
    const y = 2;
    return x + y;
}`;
      
      const input = createHookInput('Edit', 'test.ts', oldCode, newCode);
      const result = await runHook(input);
      
      expect(result.exitCode).toBe(0);
      expect(result.parsed?.decision).toBe('approve');
    });

    it('should handle complex JSDoc', async () => {
      const oldCode = 'function test() {}';
      const newCode = `/**
 * A comprehensive test function
 * @param {string} param1 - First parameter
 * @param {number} param2 - Second parameter
 * @returns {boolean} - Returns true if successful
 * @example
 * test("hello", 42)
 */
function test() {}`;
      
      const input = createHookInput('Edit', 'test.ts', oldCode, newCode);
      const result = await runHook(input);
      
      expect(result.exitCode).toBe(0);
      expect(result.parsed?.decision).toBeUndefined();
    });
  });

  describe('File path variations', () => {
    it('should handle nested TypeScript files', async () => {
      const input = createHookInput(
        'Edit',
        'src/components/Button.ts',
        'const x=1',
        'const x = 1'
      );
      
      const result = await runHook(input);
      
      expect(result.exitCode).toBe(0);
      expect(result.parsed?.decision).toBe('approve');
    });

    it('should handle files with multiple dots', async () => {
      const input = createHookInput(
        'Edit',
        'component.test.ts',
        'const x=1',
        'const x = 1'
      );
      
      const result = await runHook(input);
      
      expect(result.exitCode).toBe(0);
      expect(result.parsed?.decision).toBe('approve');
    });
  });
});