import { tool } from '@openai/agents';
import { z } from 'zod';
import path from 'node:path';
import process from 'node:process';
import { promises as fs } from 'node:fs';

const ALLOWED_DIRECTORIES = ['assets', 'docs', 'public'];

function resolveSafePath(requestedPath) {
  const normalized = path.normalize(requestedPath).replace(/^[\\/]+/, '');

  if (path.isAbsolute(normalized) || normalized.startsWith('..')) {
    throw new Error('Only relative paths within the project are allowed.');
  }

  const resolved = path.resolve(process.cwd(), normalized);
  const allowedRoots = ALLOWED_DIRECTORIES.map((dir) => path.resolve(process.cwd(), dir));

  const isWithinAllowedRoot = allowedRoots.some((root) => resolved === root || resolved.startsWith(`${root}${path.sep}`));

  if (!isWithinAllowedRoot) {
    throw new Error(`Access to "${requestedPath}" is not permitted. Allowed roots: ${ALLOWED_DIRECTORIES.join(', ')}`);
  }

  return resolved;
}

export const localFilesTool = tool({
  name: 'read_local_file',
  description: 'Read local project files (assets, docs, public) to answer user questions.',
  parameters: z
    .object({
      path: z.string().min(1, 'Relative path to the file to load.'),
      max_bytes: z
        .number()
        .int()
        .positive()
        .lte(32_768)
        .describe('Maximum number of bytes to read for large files.')
        .nullish()
        .default(4096),
    })
    .strict(),
  strict: true,
  async execute({ path: requestedPath, max_bytes }) {
    const maxBytes = max_bytes ?? 4096;
    const targetPath = resolveSafePath(requestedPath);
    const stats = await fs.stat(targetPath);

    if (stats.isDirectory()) {
      const entries = await fs.readdir(targetPath);
      return `Directory listing for ${requestedPath}:\n${entries.join('\n')}`;
    }

    const content = await fs.readFile(targetPath, 'utf8');
    const truncated = content.slice(0, maxBytes);

    const suffix = content.length > maxBytes ? '\n...\n[content truncated]' : '';
    const relativePath = path.relative(process.cwd(), targetPath);

    return `File: ${relativePath}\n---\n${truncated}${suffix}`;
  },
});
