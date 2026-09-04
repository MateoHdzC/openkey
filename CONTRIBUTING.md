# Contributing to OpenKey

We welcome contributions from developers worldwide!

## Development Setup

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/<your-username>/openkey.git
   cd openkey
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run tests:
   ```bash
   npm test
   ```
4. Run locally with `tsx`:
   ```bash
   npm run dev
   ```

## Adding a New Provider Adapter

1. Create a new file in `src/providers/adapters/<provider>.ts`.
2. Implement the `ProviderAdapter` interface from `src/providers/adapter.interface.ts`.
3. Register the adapter in `src/providers/registry.ts`.
4. Add unit tests in `test/providers.test.ts`.

## Commit Conventions

Use conventional commits:
- `feat: add mistral ai provider adapter`
- `fix: resolve token parsing in deepseek stream`
- `docs: update quickstart guide`
- `test: add encryption salt validation test`
