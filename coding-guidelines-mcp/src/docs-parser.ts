import * as fs from 'fs';
import * as path from 'path';
import matter = require('gray-matter');

export interface DocResource {
  uri: string;
  name: string;
  description: string;
  content: string;
}

export class DocsParser {
  private docsDir: string;

  constructor(docsDir?: string) {
    if (docsDir) {
      this.docsDir = docsDir;
    } else {
      // Get the directory where this script is located
      const scriptDir = path.dirname(__filename);
      // Go up one level to the project root and then into docs
      this.docsDir = path.join(scriptDir, '..', 'docs');
    }
  }

  async getDocResources(): Promise<DocResource[]> {
    const resources: DocResource[] = [];
    
    try {
      const files = await fs.promises.readdir(this.docsDir);
      const markdownFiles = files.filter(file => file.endsWith('.md'));

      for (const file of markdownFiles) {
        const filePath = path.join(this.docsDir, file);
        const content = await fs.promises.readFile(filePath, 'utf-8');
        const parsed = matter(content);
        
        const description = parsed.data.description || `Documentation file: ${file}`;
        
        resources.push({
          uri: `docs://${file}`,
          name: file,
          description,
          content: parsed.content
        });
      }
    } catch (error) {
      console.error('Error reading docs directory:', error);
    }

    return resources;
  }

  async getDocContent(filename: string): Promise<string | null> {
    try {
      const filePath = path.join(this.docsDir, filename);
      const content = await fs.promises.readFile(filePath, 'utf-8');
      const parsed = matter(content);
      return parsed.content;
    } catch (error) {
      console.error(`Error reading doc file ${filename}:`, error);
      return null;
    }
  }
}