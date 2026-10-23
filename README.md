<h1 align="center">
SSLATT (OSS marketplace)
</h1>

<h3 align="center">
Super Slime 🐍 Love All The Time
</h3>

<p align="center">
  <a href="#"><img height="300" src="public/assets/images/tech.png" alt="SSLATT Tech"></a>
</p>

## Sponsors

<table width="100%">
  <tr height="187px">
    <td align="center" width="33%">
      <a href="mailto:support@stoqey.com">
        Add your logo here
      </a>
    </td>
  </tr>
</table>

## Main Features

| Name                    | Progress |
| ----------------------- | -------- |
| PGP 2FA                 | ✅       |
| Autowithdraw            | ✅       |
| BTC, XMR                | ✅       |
| Escrow / FE             | ✅       |
| Multisig support        | ❌       |
| Jabberbot               | ❌       |
| FE disputes             | ❌       |
| Auto dispute resolution | ❌       |
| Walletless pay          | ❌       |

<a href="#Roadmap">See all features ....</a>

<p align="center">
  <img height="500" src="public/assets/images/infra-ops.png" alt="SSLATT Infra">
</p>

#### Demo
- JS <a target="_blank" href="https://sslatt.com">sslatt.com</a> (any browser)
- HTML <a target="_blank" href="https://sslatt.com/html">sslatt.com/html</a> (tor browser without js)

### Features frontend

| Name             | Description                                                                           |
| ---------------- | ------------------------------------------------------------------------------------- |
| UI               | Styled-components, twitch-ui like [UUIX](https://github.com/uuixjs/uxweb)             |
| API              | Hooks/Context, Apollo GraphQL via [RoadmanJS Framework](https://github.com/roadmanjs) |
| .....UI features |

### Features backend

| Name     | Description                                                                                                                                               |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Database | Couchbase via [Couchset ORM](https://github.com/couchset)                                                                                                 |
| API      | Apollo GraphQL via [RoadmanJS Framework](https://github.com/roadmanjs)                                                                                    |
| Payments | BTC(btcpayserver), XMR(monero rpc) via [RoadmanJS Wallet](https://github.com/roadmanjs/wallet), [RoadmanJS MoneroX](https://github.com/roadmanjs/monerox) |
| Auth     | JWT, 2FA via [RoadmanJS Auth](https://github.com/roadmanjs/auth)                                                                                          |
| Storage  | Local disk / FastDFS via [RoadmanJS](https://github.com/roadmanjs)                                                                                        |

### Requirements

- Node.js 18+ and npm
- Couchbase
- Redis
- BTCPayerServer or monero rpc

## Getting started backend

Run the following command on your local environment:

```shell
git clone git@github.com:stoqey/sslatt-backend.git
yarn
```

Then, you can run the project locally in development mode with live reload by executing:

```shell
yarn dev
```

Open http://localhost:3000 with your favorite browser to see your project.

### Environment

#### Set up authentication

```shell
PORT=3037
APP_NAME=sslatty
DEBUG=sslatty*

# 32 chars each
ACCESS_TOKEN_SECRET=random ass string
REFRESH_TOKEN_SECRET=random ass string
```

#### Security settings

```shell
# ACCESS_TOKEN_SECRET must be at least 32 random characters. It signs session
# tokens and (through HKDF) also keys the captcha/endgame cookies; the app
# refuses to start the captcha flow with a missing or short secret.

# Hostnames (comma separated) this site is served from. Needed when the app
# sits behind a reverse proxy that rewrites the Host header (e.g. an onion
# service in front of Next.js): POSTs whose Origin is not the request host or
# one of these are rejected as cross-site (CSRF protection).
ALLOWED_HOSTS=youronionaddress.onion,www.example.com

# Cookies are HttpOnly + SameSite=Lax, and Secure in production. If you serve
# over plain http (common for onion services) set this to false, otherwise
# browsers will not send the Secure cookies back.
COOKIE_SECURE=false

# Max avatar/listing image upload size in bytes (default 5 MB, images only)
MAX_UPLOAD_BYTES=5242880
```

#### Database and Storage

Set up couchbase and redis

```shell
COUCHBASE_URL=
COUCHBASE_BUCKET=dev
COUCHBASE_USERNAME=admin
COUCHBASE_PASSWORD=

REDIS_URL="rediss://:xxxxxxxx@xxxxxxxx:30296"
```

Default storage is set to local uploads, but you can set fastdfs, pictr e.t.c

#### Database migration

To set up db indexes, and initial data pass the `STARTUP` env with any value, this will populate the database with the defined config from `src/config` i.e categories, site settings, admin user e.t.c

```shell
STARTUP=anyvalue
```

Once app is up and running you can remove the `STARTUP` env

#### Set up Payments XMR/BTC

You can accept payments using BTC with btcpayserver or XMR with Monerox

```shell
#BTCPAYSERVER ENV
BTCPAYSERVER_TOKEN=xxxxx
BTCPAYSERVER_STORE=xxxxx
BTCPAYSERVER_URL=https://xxxxxxx.com/api/v1
BTCPAYSERVER_BTC=S-xxxxxx-BTC
BTCPAYSERVER_XMR=S-xxxx-XMR
BTCPAYSERVER_CRON_ENABLED=BTC,XMR
BTCPAYSERVER_CRON=*/1 * * * *

# MONEROX
MONEROX_URL=same as backend url
MONEROX_WALLET=xxxx-xxx-xx-xxx-xxxxxx
MONEROX_CRON=*/1 * * * *

# WALLET RPC
WALLET_RPC_URL=http://xxxxxxxxx:38084
WALLET_RPC_USER=rpc_user
WALLET_RPC_PASSWORD=abc123

# MAIN wallet
WALLET_PATH=abc123
WALLET_PASSWORD=abc123
WALLETS_DIR=/Users/ceddy/xmr/xwallet
```

#### Backend structure

```shell

├── README.md                             # README file
├── .env                                  # Environment configuration
├── .github                               # GitHub folder
├── .vscode                               # VSCode configuration
├── src                                   #
│   └── config                            # Config
│   │   ├── categories.ts                 # Site categories
│   │   ├── site.ts                       # Site settings, admin user, welcome message, e.t.c
│   └── feature                           # Feature e.g. auth, user, wallet
│   │   ├── feature.model.ts              # feature couchbase model / collection / table
│   │   ├── feature.methods.ts            # feature methods
│   │   ├── feature.resolver.ts           # feature graphql api resolver
└── tsconfig.json                         # TypeScript configuration
```

#### Backend customization

Use the `src/config` to set site settings, categories, admin user, welcome message

- `src/config/categories.ts`: categories
- `src/config/site.ts`: site settings configuration file, admin user, welcome message
- `.env`: default environment variables

## Getting started frontend

<!-- UI -->

Run the following command on your local environment:

```shell
git clone git@github.com:stoqey/sslatt.git
yarn
```

Then, you can run the project locally in development mode with live reload by executing:

```shell
yarn dev
```

Open http://localhost:3000 with your favorite browser to see your project.

### Frontend environment

```shell
API_URL="localhost:3037"

ACCESS_TOKEN_SECRET=AadsfasdfASDBSADTFGHLWEFDVKAWMERTXC
REFRESH_TOKEN_SECRET=sadfgsdfvsdfvsdafbsdfbsdf

# ENDGAME rate limit
REQ_PER_MINUTE=25

#
REDIS_URL="redis://localhost"
```

### Frontend structure

```shell
.
├── README.md                         # README file
├── .env                              # Environment configuration
├── .github                           # GitHub folder
├── .husky                            # Husky configuration
├── .storybook                        # Storybook folder
├── .vscode                           # VSCode configuration
├── public                            # Public assets folder
├── src                               #
│   └── app                           # Next JS App (App Router)
│   │    ├── /*                       # JS   routes
│   │    ├── /login                   # JS   /login route
│   │    ├── /html/*                  # HTML routes (NOSCRIPT)
│   │    ├── /html/login              # HTML /html/login route
│   │    └── /api                     # API  routes
│   ├── components                    # React components
│   ├── containers                    # React containers
│   │   └── feature                   # feature, e.g auth, wallet, user
│   │   │   ├── feature.tsx           # JS feature with hooks e.t.c
│   │   │   └── feature.html.tsx      # HTML-only feature no javascript / react hooks, just plain HTML
│   ├── middlewares                   # Middlewares
│   │   └── endgame.ts                # Endgame middleware / rate limiter
│   │   └── translation.ts            # translation
│   ├── middleware.ts                 # Root Middleware (combines all)
│   ├── libs                          # 3rd party libraries configuration
│   ├── locales                       # Locales folder (i18n messages)
│   ├── types                         # Type definitions
│   ├── utils                         # Utilities folder
├── tests                             #
│   ├── e2e                           # E2E tests, also includes Monitoring as Code
│   └── integration                   # Integration tests
└── tsconfig.json                     # TypeScript configuration
```

### Frontend customization

Search for // FIXME: to customize: here is some of the most important files to customize:

- `public/apple-touch-icon.png`, `public/favicon.ico`, `public/favicon-16x16.png` and `public/favicon-32x32.png`: your website favicon, you can generate from https://favicon.io/favicon-converter/
- `src/components/logo`: logo and load screen animation
- `.env`: default environment variables

You have access to the whole code source if you need further customization.  

### Contributions

Everyone is welcome to contribute to this project. Feel free to open an issue if you have question or found a bug. Totally open to any suggestions and improvements.

### Roadmap

<a href="https://github.com/orgs/stoqey/projects/1">SSLATT Project</a>

- API - Backend api
- HTML - HTML only routes / noscript / no javascript
- JS - Javascript routes

| Feature                 | API | HTML | JS  |
| ----------------------- | --- | ---- | --- |
| Profile / Account       | ✅  | ✅   | ❌  |
| PGP 2FA                 | ✅  | ✅   | ❌  |
| PWD change/reset        | ✅  | ✅   | ✅  |
| Orders manager          | ✅  | ✅   | ✅  |
| Orders admin manager    | ✅  | ❌   | ❌  |
| Wallet BTC, XMR         | ✅  | ✅   | ❌  |
| Wallet transactions     | ✅  | ✅   | ✅  |
| Wallet withdraw / auto  | ✅  | ✅   | ✅  |
| Wallet admin withdraw   | ✅  | ❌   | ❌  |
| Wallet admin manager    | ❌  | ❌   | ❌  |
| Store dashboard         | ✅  | ✅   | ❌  |
| Store ads manager       | ✅  | ✅   | ✅  |
| Store ads admin         | ❌  | ❌   | ❌  |
| Store settings          | ✅  | ✅   | ✅  |
| Escrow / FE             | ✅  | ✅   | ✅  |
| Notifications           | ✅  | ✅   | ❌  |
| Jabberbot               | ✅  | ❌   | ❌  |
| Chat                    | ✅  | ✅   | ❌  |
| Chat admin              | ✅  | ✅   | ❌  |
| Chat admin tickets      | ❌  | ❌   | ❌  |
| Disputes                | ❌  | ❌   | ❌  |
| Disputes admin manager  | ❌  | ❌   | ❌  |
| Admin category          | ✅  | ❌   | ❌  |
| Admin branding          | ❌  | ❌   | ❌  |
| FE disputes             | ❌  | ❌   | ❌  |
| Auto dispute resolution | ❌  | ❌   | ❌  |
| Multisig support        | ❌  | ❌   | ❌  |
| Walletless pay          | ❌  | ❌   | ❌  |

##### ✅ - implemented, ❌ - no implemented yet

### License

Licensed under the MIT License, Copyright © 2024

See [LICENSE](LICENSE) for more information.

## Sponsors

<table width="100%">
    <td align="center" width="33%">
      <a href="mailto:support@stoqey.com">
        Add your logo here
      </a>
    </td>
  </tr>
</table>

---

<p align="center">
  <a alt="Sponsor SSLATT" href="https://github.com/sponsors/stoqey"><img src="https://cdn.buymeacoffee.com/buttons/default-red.png" alt="SSLATT Tech"></a>
</p>

<h3 align="center">
Algo Inc
</h3>
