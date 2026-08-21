# RGPV Result Worker

Unified FastAPI service that fetches RGPV exam results. It **merges the three
legacy Python workers** — the session supplier, the bulk fetcher, and the single
fetcher — into one service with a single, shared scraping core.

## Why it exists

The RGPV result portal (`result.rgpv.ac.in`) is a legacy ASP.NET WebForms app
guarded by a 5-character image captcha. Fetching a result means:

1. **Handshake** — load `ProgramSelect.aspx`, extract `__VIEWSTATE` /
   `__EVENTVALIDATION`, post the B.Tech program selection, capture the session
   cookie. (`core/session.py`)
2. **Captcha** — download the captcha PNG and solve it via **AZCaptcha**
   (`core/azcaptcha.py` → `core/captcha.py`). Tesseract OCR is available as an
   offline fallback when no API key is configured.
3. **Fetch** — POST the result form with the tokens, enrollment, semester and
   solved captcha. (`core/fetch.py`)
4. **Parse** — turn the grading-panel HTML into a structured result.
   (`core/parser.py`)

The legacy repos duplicated steps 1–4 across three codebases; here they live
once in `app/core/`.

## Captcha flow (AZCaptcha)

```
RGPV portal                    Result worker                    AZCaptcha
     │                              │                              │
     │  handshake + captcha URL       │                              │
     │◄─────────────────────────────│                              │
     │                              │  GET captcha PNG               │
     │─────────────────────────────►│                              │
     │                              │  POST /createTask              │
     │                              │  (ImageToTextTask, base64)     │
     │                              │─────────────────────────────►│
     │                              │  poll POST /getTaskResult      │
     │                              │◄─────────────────────────────│
     │                              │  5-char answer                 │
     │  POST result form + captcha  │                              │
     │◄─────────────────────────────│                              │
```

Configuration (`.env`):

```bash
CAPTCHA_PROVIDER=azcaptcha          # azcaptcha | tesseract
AZCAPTCHA_API_KEY=your_key_here     # required for azcaptcha
AZCAPTCHA_BASE_URL=https://azcaptcha.com
```

| Provider | When to use | Typical solve time |
| --- | --- | --- |
| `azcaptcha` | Production and local dev (default) | ~0.3–1 s |
| `tesseract` | Offline dev without API key | 10–50 s (many retries) |

## Layout

```
app/
├── config.py            Env-driven settings (pydantic-settings)
├── logging_config.py    Structured logging
├── rate_limit.py        Shared slowapi limiter
├── main.py              App factory + lifespan (session pool)
├── core/                Shared scraping primitives
│   ├── constants.py     RGPV magic values (program id, viewstate gens, offsets)
│   ├── exceptions.py    Typed errors (ResultNotFound, CaptchaFailed, …)
│   ├── enrollment.py    Enrollment parser (mirror of @rgpv/shared)
│   ├── session.py       RGPVSession + handshake
│   ├── azcaptcha.py     AZCaptcha.com API client
│   ├── captcha.py       Captcha orchestration (AZCaptcha primary, Tesseract fallback)
│   ├── fetch.py         Result form submission
│   ├── parser.py        HTML → SemesterResult
│   └── models.py        Pydantic request/response models
├── services/
│   ├── result_service.py  Single + concurrent bulk orchestration
│   └── session_pool.py    Redis-backed pre-warmed session pool
└── routers/             single, bulk, queue, health
```

## Endpoints

| Method | Path                    | Purpose                                  |
| ------ | ----------------------- | ---------------------------------------- |
| POST   | `/api/v1/result`        | Single student's result                  |
| POST   | `/api/v1/bulk-results`  | Inclusive enrollment range (rate-limited)|
| POST   | `/api/v1/queue/refresh` | Start/extend the session-pool refill     |
| GET    | `/api/v1/queue/status`  | Pool size                                |
| GET    | `/health`               | Liveness                                 |

## Local development

From the **monorepo root** (recommended):

```bash
pnpm worker:setup                # create .venv + pip install -e ".[dev]"
cp services/result-worker/.env.example services/result-worker/.env
# Set AZCAPTCHA_API_KEY in .env
pnpm dev:worker                  # http://localhost:8000/docs

# or run web + worker together
pnpm dev
```

From this directory directly:

```bash
pnpm setup                       # same as pnpm worker:setup from root
pnpm dev
pnpm test
pnpm lint && pnpm typecheck
```

> **Note:** Production uses **AZCaptcha** — get an API key from
> [azcaptcha.com](https://azcaptcha.com). Tesseract (`brew install tesseract`)
> is only required when `CAPTCHA_PROVIDER=tesseract`. The Docker image bundles
> Tesseract for that fallback path.

## Caveat

This service depends on scraping a third-party portal, which is inherently
fragile (captcha/markup changes break it) and a legal gray area for commercial
use. Treat it as a best-effort source and design callers to degrade gracefully.
