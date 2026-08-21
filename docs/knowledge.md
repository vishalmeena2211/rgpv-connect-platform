# RGPV Connect — Knowledge Base

Internal reference for how RGPV results work, how our scraper interacts with the
official portal, and how to run or debug the monorepo. For product architecture
see [`architecture.md`](architecture.md); for setup see the root
[README](../README.md).

---

## 1. Official RGPV result portal

| Item | Value |
| --- | --- |
| **Portal URL** | https://result.rgpv.ac.in/Result/BErslt.aspx |
| **Base path** | https://result.rgpv.ac.in/Result |
| **Technology** | Legacy ASP.NET WebForms |
| **Program** | B.Tech (radio value `24` on `ProgramSelect.aspx`) |
| **Captcha** | 5-character image captcha — solved via **AZCaptcha** (primary) or Tesseract (fallback) |
| **Grading modes** | Grading / Non-Grading (we fetch **Grading** results) |

The portal is **not** a REST API. Every lookup replays a full WebForms session:
load page → extract hidden tokens → select program → solve captcha → POST form.

---

## 2. Enrollment number format

RGPV enrollment numbers are **12 characters** in the shape `CCCCBBYYNNN`:

```
0198 CS 23 1019
│    │  │  └── serial (3 digits — roll within college/branch)
│    │  └───── admission year (2 digits → 2023)
│    └──────── branch code (2 letters, e.g. CS, IT, EC, ME)
└───────────── college code (4 digits, affiliated institute)
```

**Examples**

| Enrollment | College | Branch | Admitted | Batch (B.Tech +4) |
| --- | --- | --- | --- | --- |
| `0198CS231019` | `0198` | CS | 2023 | 2027 |
| `0928CS241109` | `0928` | CS | 2024 | 2028 |
| `0151CS21001` | `0151` | CS | 2021 | 2025 (demo seed user) |

The parser lives in:

- TypeScript: [`packages/shared/src/enrollment/parser.ts`](../packages/shared/src/enrollment/parser.ts)
- Python mirror: [`services/result-worker/app/core/enrollment.py`](../services/result-worker/app/core/enrollment.py)

Both sides must stay in sync — enrollment decoding drives auto-grouping (college,
branch, batch) after verification.

**Validation regex:** `^(\d{4})([A-Z]{2})(\d{2})(\d{3})$`

---

## 3. Which semester to check

RGPV declares results in **two cycles** per academic year:

| Cycle | Exam period | Typical declaration |
| --- | --- | --- |
| **Odd semester** (1, 3, 5, 7, 9) | Nov–Dec | Jan–Feb (next calendar year) |
| **Even semester** (2, 4, 6, 8, 10) | May–Jun | Jul–Aug (same calendar year) |

**Rule of thumb for a batch**

If a student was admitted in year `YY`, their current semester in academic year
`N` is roughly:

```
semester ≈ 2 × (current_year − admission_year)   (even/odd depends on cycle)
```

| Batch (admitted) | As of Aug 2026 | Latest result to check |
| --- | --- | --- |
| **2024** (`…24…`) | 2nd year, even sem | **Semester 4** (May–Jun 2026 exams) |
| **2023** (`…23…`) | 3rd year, even sem | **Semester 6** |
| **2022** (`…22…`) | 4th year, even sem | **Semester 8** |

Always pick the **highest semester whose result has been declared** for the
current cycle. When in doubt, try the latest even semester first (Aug window),
then step down.

---

## 4. How our result worker fetches a result

End-to-end flow (implemented in `services/result-worker/app/core/`):

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. SESSION HANDSHAKE  (core/session.py)                         │
│    GET  ProgramSelect.aspx                                        │
│    POST program = B.Tech (24)                                     │
│    → cookies, __VIEWSTATE, __EVENTVALIDATION, captcha image URL   │
├─────────────────────────────────────────────────────────────────┤
│ 2. CAPTCHA  (core/captcha.py + core/azcaptcha.py)                 │
│    Download captcha PNG → AZCaptcha ImageToTextTask API             │
│    (fallback: local Tesseract OCR if no API key)                    │
├─────────────────────────────────────────────────────────────────┤
│ 3. FETCH  (core/fetch.py)                                         │
│    POST BErslt.aspx with enrollment, semester, captcha, tokens    │
├─────────────────────────────────────────────────────────────────┤
│ 4. PARSE  (core/parser.py)                                        │
│    Detect errors (wrong captcha, not found) in raw HTML           │
│    Extract name, SGPA, CGPA, subject grades from grading panel     │
└─────────────────────────────────────────────────────────────────┘
```

**Subject row counts** (hardcoded bands from the live portal):

| Semester range | Subject tables parsed |
| --- | --- |
| 1–4 | 12 |
| 5–6 | 11 |
| 7–10 | 8 |

**Portal error strings** (checked in `core/parser.py` / `core/constants.py`):

- `"Result for this Enrollment No. not Found"` → 404 / `ResultNotFound`
- `"you have entered a wrong text"` → captcha retry

**Orchestration** (`services/result_service.py`):

- Tries all OCR candidates on the same session before re-handshaking.
- Retries up to a configured limit on captcha failure.
- Does **not** yet consume the Redis session pool (see §8).

---

## 5. Worker API

Base URL (local): `http://localhost:8000`

| Method | Path | Body | Purpose |
| --- | --- | --- | --- |
| `GET` | `/health` | — | Liveness |
| `POST` | `/api/v1/result` | `{ enrollment, semester }` | Single result |
| `POST` | `/api/v1/bulk-results` | `{ first_enrollment, last_enrollment, semester }` | Range fetch (rate-limited) |
| `POST` | `/api/v1/queue/refresh` | — | Refill Redis session pool |
| `GET` | `/api/v1/queue/status` | — | Current pool size |

**Example — single result**

```bash
curl -s -X POST http://localhost:8000/api/v1/result \
  -H 'content-type: application/json' \
  -d '{"enrollment":"0198CS231019","semester":4}' | jq .
```

**Response shape** (`SemesterResult` — shared between Python and TypeScript):

```json
{
  "name": "ARYAN DUBEY",
  "enrollment": "0198CS231019",
  "session": "DEC-2025",
  "course": "B.Tech",
  "branch": "CS",
  "semester": 4,
  "status": "UNKNOWN",
  "sgpa": 4.71,
  "cgpa": 5.23,
  "result_description": "Fail in BT401",
  "subjects": [ { "name": "BT401- [T]", "grade": "F", ... } ]
}
```

The web app calls the same endpoint via
[`apps/web/src/lib/result-worker.ts`](../apps/web/src/lib/result-worker.ts)
and validates the JSON with `@rgpv/shared` zod schemas before rendering.

---

## 6. Monorepo layout & commands

Everything lives in one **pnpm + Turborepo** monorepo:

```
rgpv-connect-platform/
├── apps/web/                 @rgpv/web          — Next.js 15
├── packages/config/          @rgpv/config        — ESLint / TS / Tailwind presets
├── packages/shared/          @rgpv/shared        — enrollment parser, zod, types
├── packages/db/              @rgpv/db            — Prisma + seed
├── services/result-worker/   @rgpv/result-worker — FastAPI scraper (Python)
├── infra/                    docker-compose, Dockerfiles
└── docs/                     architecture, strategy, this file
```

| Command | What it does |
| --- | --- |
| `pnpm install` | Install JS deps across all workspaces |
| `pnpm worker:setup` | Create Python venv + `pip install -e ".[dev]"` |
| `pnpm setup` | Full bootstrap: install + worker + prisma generate |
| `pnpm dev` | Run **web + worker** in parallel |
| `pnpm dev:web` | Next.js only (`:3000`) |
| `pnpm dev:worker` | FastAPI only (`:8000`) |
| `pnpm test` | Vitest (TS) + pytest (Python) |
| `pnpm lint` | ESLint + ruff |
| `pnpm typecheck` | tsc + mypy |
| `pnpm db:generate` | `prisma generate` |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:seed` | Seed demo user `0151CS21001` |

**Infra (Postgres + Redis)**

```bash
docker compose -f infra/docker-compose.yml up -d postgres redis
```

---

## 7. Local dev prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| Node.js | ≥ 20 | |
| pnpm | 9.x | |
| Python | ≥ 3.11 | Worker venv may use 3.14 locally |
| Tesseract OCR | optional | Only needed if `CAPTCHA_PROVIDER=tesseract` |
| AZCaptcha API key | recommended | Set `AZCAPTCHA_API_KEY` in worker `.env` |
| Docker | optional | Postgres `:5432`, Redis `:6379` |

**Env files**

| File | Purpose |
| --- | --- |
| `packages/db/.env` | `DATABASE_URL` for Prisma |
| `apps/web/.env.local` | Auth secret, `RESULT_WORKER_URL`, OAuth keys |
| `services/result-worker/.env` | CORS origins, `REDIS_URL`, **`AZCAPTCHA_API_KEY`** |

Copy from the corresponding `.env.example` files.

---

## 8. Performance & known gaps

### Captcha configuration

```bash
# services/result-worker/.env
CAPTCHA_PROVIDER=azcaptcha          # azcaptcha | tesseract
AZCAPTCHA_API_KEY=your_key_here     # from https://azcaptcha.com dashboard
AZCAPTCHA_BASE_URL=https://azcaptcha.com
```

AZCaptcha uses the JSON API (`POST /createTask` → poll `POST /getTaskResult`) with
task type `ImageToTextTask`, module `azcaptcha_v2`, and 5-char length hints.
Typical solve time: **0.3–1 s** vs 10–50 s with Tesseract retries.

### Timing (observed, Aug 2026)

| Step | Typical time |
| --- | --- |
| ASP.NET handshake | ~1–2 s |
| Captcha (AZCaptcha) | ~0.3–1 s |
| Captcha (Tesseract fallback) | ~70–80% of total variance |
| **Single result (AZCaptcha)** | ~3–8 s |
| **Single result (typical)** | 10–20 s |
| **Single result (many captcha retries)** | up to ~50 s |

### Verified test enrollment

| Enrollment | Semester | Student | Notes |
| --- | --- | --- | --- |
| `0198CS231019` | 4 | ARYAN DUBEY | SGPA 4.71, CGPA 5.23 — use for E2E tests |

### Known gaps (improvement backlog)

1. **Session pool not consumed** — `SessionPool` LPUSHes warm sessions to Redis
   but `fetch_single()` never LPOPs them. Wiring the pool in is the highest-ROI
   speed win.
2. **Captcha accuracy** — AZCaptcha is primary; Tesseract remains as offline fallback.
3. **Bulk concurrency** — currently capped at 5 parallel fetches; can raise once
   pool is wired.
4. **Result caching** — no Redis/Postgres cache before hitting RGPV; add for
   repeat lookups.
5. **Python venv quirk** — on some Mac setups `.venv/bin/python` points to 3.9
   while packages install under `python3.14`. Scripts use `python3.14` explicitly.

---

## 9. Troubleshooting

### `No module named uvicorn`

Run `pnpm worker:setup` from the monorepo root, or:

```bash
cd services/result-worker
python3 -m venv .venv
.venv/bin/pip install -e ".[dev]"
```

Use `.venv/bin/python3.14` if the default `python` symlink is wrong.

### Captcha keeps failing / "Grading panel missing"

Usually means wrong captcha text was submitted and the error wasn't detected.
Check `core/parser.py` → `detect_error()` against live portal HTML if RGPV
changed markup.

### `Result service is unreachable` (web app)

- Worker not running → `pnpm dev:worker`
- Wrong URL → `RESULT_WORKER_URL=http://localhost:8000` in `apps/web/.env.local`

### Docker / Postgres errors

Start Docker Desktop, then:

```bash
docker compose -f infra/docker-compose.yml up -d postgres redis
pnpm db:migrate && pnpm db:seed
```

### Direct Python test (no HTTP server)

```bash
cd services/result-worker
.venv/bin/python3.14 -c "
from app.services.result_service import fetch_single
print(fetch_single('0198CS231019', 4))
"
```

### API test (in-process, no server)

```bash
cd services/result-worker
.venv/bin/pip install httpx   # once, for TestClient
.venv/bin/python3.14 -c "
from fastapi.testclient import TestClient
from app.main import app
c = TestClient(app)
print(c.get('/health').json())
print(c.post('/api/v1/result', json={'enrollment':'0198CS231019','semester':4}).status_code)
"
```

---

## 10. Web app integration points

| Feature | Entry | Worker call |
| --- | --- | --- |
| Public result lookup | `/results` → `lookupResult()` | `POST /api/v1/result` |
| Enrollment verification | auth flow → `verifyEnrollment()` | `POST /api/v1/result` |
| Sync my results | `/results/me` → `syncMyResults()` | one call per semester |

Protected routes (`/results`, `/results/me`, etc.) require sign-in via Auth.js.
The landing page (`/`) and `/login` are public.

---

## 11. Legal & operational caveat

The worker **scrapes a third-party government university portal**. This is
inherently fragile (captcha/markup changes break it) and may have terms-of-use
implications for commercial deployment. Design all callers to degrade gracefully
when the worker is down or returns 502.

---

## 12. Related docs

| Doc | Contents |
| --- | --- |
| [`architecture.md`](architecture.md) | Product layers, identity model, data flow |
| [`strategy.md`](strategy.md) | Phased roadmap |
| [`launch-free.md`](launch-free.md) | ₹0-infra deployment guide |
| [`services/result-worker/README.md`](../services/result-worker/README.md) | Worker layout & endpoints |
| [`CONTRIBUTING.md`](../CONTRIBUTING.md) | Contributor setup & workflow |

---

*Last updated: August 2026 — AZCaptcha integration, monorepo consolidation, and
verified E2E fetch for `0198CS231019` sem 4.*
