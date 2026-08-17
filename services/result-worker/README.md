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
2. **Captcha** — download the captcha image and OCR it with Tesseract.
   (`core/captcha.py`)
3. **Fetch** — POST the result form with the tokens, enrollment, semester and
   solved captcha. (`core/fetch.py`)
4. **Parse** — turn the grading-panel HTML into a structured result.
   (`core/parser.py`)

The legacy repos duplicated steps 1–4 across three codebases; here they live
once in `app/core/`.

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
│   ├── captcha.py       Tesseract OCR solver
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

```bash
cd services/result-worker
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"          # needs Tesseract installed system-wide
cp .env.example .env

uvicorn app.main:app --reload    # http://localhost:8000/docs

pytest                           # run unit tests
ruff check . && mypy app         # lint + type-check
```

> **Note:** OCR requires the `tesseract` binary (`brew install tesseract` on
> macOS, `apt-get install tesseract-ocr` on Debian). The Docker image bundles it.

## Caveat

This service depends on scraping a third-party portal, which is inherently
fragile (captcha/markup changes break it) and a legal gray area for commercial
use. Treat it as a best-effort source and design callers to degrade gracefully.
