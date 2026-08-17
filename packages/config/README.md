# @rgpv/config

Shared build/lint/format presets so every workspace package stays consistent.

## Contents

| Path                  | Purpose                                                  |
| --------------------- | -------------------------------------------------------- |
| `eslint/base.js`      | Base flat ESLint config (TS, imports)                    |
| `eslint/next.js`      | Next.js + React rules, extends base                      |
| `tsconfig/base.json`  | Strict TS base (`noUncheckedIndexedAccess`, declarations)|
| `tsconfig/library.json` | For framework-agnostic packages (`@rgpv/shared`)       |
| `tsconfig/next.json`  | For the Next.js app                                      |

## Usage

```jsonc
// a package's tsconfig.json
{ "extends": "@rgpv/config/tsconfig/library.json" }
```

```js
// a package's eslint.config.js
import config from '@rgpv/config/eslint/base.js';
export default config;
```

> `tsconfig/next.json` disables `declaration`/`declarationMap` to work around an
> Auth.js v5 + pnpm type-portability issue (TS2742). Don't re-enable them.
