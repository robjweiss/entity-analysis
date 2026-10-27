# Entity Analysis

Entity Analysis is a Vue 3 application for viewing entity risk information.
It will use the [Sayari Node SDK](https://github.com/sayari-analytics/sayari-node)
as a read-only data source.

## Sayari credentials

The Sayari Node SDK requires a client ID and client secret issued by Sayari.
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

## Run locally with Docker

Docker runs both the UI and backend locally; no hosted server or local Node installation
is required. Install Docker Desktop (or another Docker-compatible runtime) first.

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

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
pnpm install
```

### Compile and Hot-Reload for Development

```sh
pnpm dev
```

### Type-Check, Compile and Minify for Production

```sh
pnpm build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
pnpm test:unit
```

### Run End-to-End Tests with [Playwright](https://playwright.dev)

```sh
# Install browsers for the first run
npx playwright install

# When testing on CI, must build the project first
pnpm build

# Runs the end-to-end tests
pnpm test:e2e
# Runs the tests only on Chromium
pnpm test:e2e --project=chromium
# Runs the tests of a specific file
pnpm test:e2e tests/example.spec.ts
# Runs the tests in debug mode
pnpm test:e2e --debug
```

### Lint with [ESLint](https://eslint.org/)

```sh
pnpm lint
```
