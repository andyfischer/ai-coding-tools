import { describe, it, expect } from 'vitest';
import { runHook, createHookInput } from './test-utils';

describe('Auto-approve scenarios', () => {
  describe('Formatting changes', () => {
    it('should approve whitespace-only changes', async () => {
      const input = createHookInput(
        'Edit',
        'test.ts',
        'const x=1;',
        'const x = 1;'
      );
      
      const result = await runHook(input);
      
      expect(result.exitCode).toBe(0);
      expect(result.parsed?.decision).toBe('approve');
      expect(result.parsed?.reason).toContain('Safe TypeScript edit');
    });

    it('should approve indentation changes', async () => {
      const input = createHookInput(
        'Edit',
        'test.ts',
        'function test() {\nreturn 1;\n}',
        'function test() {\n  return 1;\n}'
      );
      
      const result = await runHook(input);
      
      expect(result.exitCode).toBe(0);
      expect(result.parsed?.decision).toBe('approve');
    });

    it('should approve mixed whitespace normalization', async () => {
      const input = createHookInput(
        'Edit',
        'test.ts',
        'const\tx\t=\t1;',
        'const x = 1;'
      );
      
      const result = await runHook(input);
      
      expect(result.exitCode).toBe(0);
      expect(result.parsed?.decision).toBe('approve');
    });
  });




  describe('Import statements', () => {
    it('should approve adding new import', async () => {
      const input = createHookInput(
        'Edit',
        'test.ts',
        '',
        'import { useState } from "react";'
      );
      
      const result = await runHook(input);
      
      expect(result.exitCode).toBe(0);
      expect(result.parsed?.decision).toBe('approve');
    });

    it('should approve modifying existing import', async () => {
      const input = createHookInput(
        'Edit',
        'test.ts',
        'import { useState } from "react";',
        'import { useState, useEffect } from "react";'
      );
      
      const result = await runHook(input);
      
      expect(result.exitCode).toBe(0);
      expect(result.parsed?.decision).toBe('approve');
    });

    it('should approve removing import', async () => {
      const input = createHookInput(
        'Edit',
        'test.ts',
        'import { unused } from "library";',
        ''
      );
      
      const result = await runHook(input);
      
      expect(result.exitCode).toBe(0);
      expect(result.parsed?.decision).toBe('approve');
    });

    it('should approve changing import source', async () => {
      const input = createHookInput(
        'Edit',
        'test.ts',
        'import { helper } from "./utils";',
        'import { helper } from "./lib/utils";'
      );
      
      const result = await runHook(input);
      
      expect(result.exitCode).toBe(0);
      expect(result.parsed?.decision).toBe('approve');
    });

    it('should approve default import changes', async () => {
      const input = createHookInput(
        'Edit',
        'test.ts',
        'import React from "react";',
        'import * as React from "react";'
      );
      
      const result = await runHook(input);
      
      expect(result.exitCode).toBe(0);
      expect(result.parsed?.decision).toBe('approve');
    });
  });
});