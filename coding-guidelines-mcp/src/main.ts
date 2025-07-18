import 'source-map-support/register';
import { StandardStyleMCPServer } from './index';

export async function main() {
  const server = new StandardStyleMCPServer();
  await server.run();
}