# Entity Analysis

Entity Analysis is a Vue 3 application for viewing entity risk information.
It uses the [Sayari Node SDK](https://github.com/sayari-analytics/sayari-node) and API
as a data source.

## Project structure

- `web/`: Vue application, components, and frontend unit tests.
- `bff/`: Express backend for frontend and server-side Sayari integration.
- `shared/`: API contracts shared by the frontend and BFF.
- `e2e/`: Playwright browser tests.

## Sayari credentials

The Sayari Node SDK requires a client ID and client secret.
The local BFF in `bff/` works with the SDK and credentials.

1. Copy the committed template to a local environment file:

   ```sh
   cp .env.example .env
   ```

2. Add the values supplied by Sayari:

   ```dotenv
   SAYARI_CLIENT_ID=your-client-id
   SAYARI_CLIENT_SECRET=your-client-secret
   ```

The SDK client is initialized only in `bff/sayari.ts`:

```ts
import { SayariClient } from '@sayari/sdk'

const client = new SayariClient({
  clientId: process.env.SAYARI_CLIENT_ID,
  clientSecret: process.env.SAYARI_CLIENT_SECRET,
})
```

Vite proxies `/api` requests to the BFF on `127.0.0.1:8787`.

The BFF exposes read-only, feature-specific endpoints for Sayari project data.

## Run locally

### Docker

Docker runs both the UI and backend locally.

For convenience, after installing the project dependencies with `pnpm install`, build
the image and start the app with these package scripts:

```sh
pnpm docker:build
```

Copy `.env.example` to `.env` and enter your own Sayari credentials as described above.
Then start the app:

```sh
pnpm docker:run
```

Open <http://localhost:8787>. Stop it with Ctrl+C.

The scripts are shortcuts; Docker commands can also be run directly. For example:

```sh
docker build -t entity-analysis:prototype .
docker run --rm --init --name entity-analysis --env-file .env -p 127.0.0.1:8787:8787 entity-analysis:prototype
```

### pnpm

```sh
pnpm install
```

#### Compile and Hot-Reload for Development

```sh
pnpm dev
```

#### Type-Check, Compile and Minify

```sh
pnpm build
```

#### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
pnpm test:unit
```

#### Measure web application coverage

```sh
pnpm test:coverage:web
```

The report includes all TypeScript and Vue source under `web/`, including files
not imported by the current tests. Generated shadcn-vue wrappers in
`web/components/ui/` are excluded; coverage therefore describes application
code, not the UI library wrappers. Application bootstrap, router, and stores
remain in scope. This command runs both web and BFF unit tests, but measures
only web coverage. The HTML report is written under the ignored `coverage/web/`
directory, and a text summary is printed in the terminal.

#### Run End-to-End Tests with [Playwright](https://playwright.dev)

```sh
# Install browsers for the first run
pnpm exec playwright install.

# Runs the end-to-end tests
pnpm test:e2e
```

#### Lint

```sh
pnpm lint
```
