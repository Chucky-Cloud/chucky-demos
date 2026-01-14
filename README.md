# Chucky Demos

Demo applications showcasing [Chucky AI](https://chucky.cloud) SDKs across different languages and frameworks.

## Demos

| Demo | Description | SDK | Live |
|------|-------------|-----|------|
| [Schengen Form Filler](./schengen-form-filler) | AI-assisted visa application form | TypeScript/React | [schengen-demo.pages.dev](https://schengen-demo.pages.dev) |

## Structure

Each demo is self-contained in its own folder with:
- Frontend application
- `/worker` - Cloudflare Worker for backend logic (if needed)
- `/workspace` - Chucky workspace configuration (CLAUDE.md, tools, etc.)

## Adding a New Demo

1. Create a new folder: `my-demo/`
2. Add your demo code with its own `package.json` / `go.mod` / `composer.json`
3. Create a GitHub Actions workflow in `.github/workflows/deploy-my-demo.yml`
4. Add secrets to the repo for deployment

## Required Secrets

For each demo, configure these secrets in GitHub:

| Secret | Description |
|--------|-------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Workers/Pages permissions |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |
| `{DEMO}_PROJECT_ID` | Chucky project ID for the workspace |
| `{DEMO}_HMAC_SECRET` | Chucky HMAC secret for token signing |

## License

MIT
