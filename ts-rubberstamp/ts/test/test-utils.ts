import { spawn } from 'child_process';
import { join } from 'path';

export interface HookInput {
  session_id: string;
  transcript_path: string;
  tool_name: string;
  tool_input: {
    file_path: string;
    old_string?: string;
    new_string?: string;
  };
}

export interface HookOutput {
  decision?: 'approve' | 'block';
  reason?: string;
}

export async function runHook(input: HookInput): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
  parsed?: HookOutput;
}> {
  const binaryPath = join(process.cwd(), '..', 'target', 'release', 'ts-hook-validator');
  
  return new Promise((resolve, reject) => {
    const child = spawn(binaryPath, [], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      let parsed: HookOutput | undefined;
      
      if (stdout.trim()) {
        try {
          parsed = JSON.parse(stdout.trim());
        } catch (e) {
          // If JSON parsing fails, leave parsed as undefined
        }
      }

      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: code || 0,
        parsed
      });
    });

    child.on('error', (error) => {
      reject(error);
    });

    // Send input to stdin
    child.stdin.write(JSON.stringify(input));
    child.stdin.end();
  });
}

export function createHookInput(
  toolName: string,
  filePath: string,
  oldString?: string,
  newString?: string
): HookInput {
  return {
    session_id: 'test-session',
    transcript_path: '/tmp/test-transcript',
    tool_name: toolName,
    tool_input: {
      file_path: filePath,
      old_string: oldString,
      new_string: newString
    }
  };
}