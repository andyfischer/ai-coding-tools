# Claude History tool

A desktop application for browsing and viewing your Claude chat history.

## Download

Download the latest release [here](https://github.com/andyfischer/ai-coding-tools/releases).

## Features

- **Browseable Session History**: View all your Claude conversations organized by project.
- **Full Message Details**: Examine the stored JSON to see extra details about your chats.
- **Full Tool Use**: See the full input & response data for each tool use.
- **Token Costs**: See token cost per message.
- **Analytics**: Presents some basic analytics about your sessions and tool use.

## Data Usage and Privacy notice

The "Claude History" tool does not transmit or upload or share your data in any way.
All the related data remains private and local to your machine.

## Development

To run the code locally:

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd claude-history-tool
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Build the application:
   ```bash
   yarn rebuild
   ```

4. (Optional) Copy `.env.sample` to `.env` and adjust as needed.

### Running in Development Mode

The project uses multiple services that can be managed with the included `candle` MCP tool:

1. **Start TypeScript compiler** (watches for changes):
   ```bash
   yarn dev:main
   ```

2. **Start the renderer development server** (http://localhost:3447):
   ```bash
   yarn dev:renderer
   ```

3. **Start Electron in development mode**:
   ```bash
   yarn dev:electron
   ```

4. **Start Storybook** (http://localhost:3448):
   ```bash
   yarn storybook
   ```

### Testing

Run the test suite:
```bash
yarn test
```

Run tests with UI:
```bash
yarn test:ui
```

## License

MIT License - see package.json for details

## Author

https://andyfischer.dev
