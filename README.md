# TechPapy

Échange intergénérationnel — mettre en relation jeunes et seniors pour des échanges de compétences mutuels.

📄 [Documentation fonctionnelle](DOCUMENTATION_FONCTIONNELLE.docx) ·
📄 [Documentation technique](DOCUMENTATION_TECHNIQUE.docx) ·
☁️ [Guide de déploiement GCP](DEPLOIEMENT_GCP.docx)

## Stack

- **Frontend** — Next.js (App Router) + TypeScript + Tailwind, style 2 couleurs strict (`ink` / `signal`), sans arrondis.
- **Backend** — Express + TypeScript + Prisma (PostgreSQL), JWT (access + refresh tokens), RBAC.
- **Sécurité** — bcrypt, helmet, CORS strict, rate limiting, sanitisation des entrées, CSRF header guard, logs d'audit.
- **Monitoring** — Prometheus (métriques `/metrics`), Grafana (dashboards provisionnés), Loki + Promtail (logs centralisés).
- **CI/CD** — GitHub Actions (lint, tests avec coverage, build, images Docker vers GHCR) + workflow de déploiement avec rollback.
- **Infra** — Docker / docker-compose pour le dev local, squelette Terraform (`infra/terraform`) pour l'ECR AWS.

## Structure

```
apps/
  web/    Next.js frontend (port 3000)
  api/    Express API REST (port 4000)
docker/
  prometheus/, grafana/, loki/, promtail/   configuration de l'observabilité
infra/
  terraform/   squelette IaC (ECR)
.github/workflows/  CI (ci.yml) et déploiement (deploy.yml)
```

## Démarrage local

```bash
npm install

cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# éditer apps/api/.env : JWT_ACCESS_SECRET et JWT_REFRESH_SECRET (32+ caractères)

docker compose up -d postgres redis
npm run prisma:migrate --workspace=apps/api

npm run dev
```

- Frontend: http://localhost:3000
- API: http://localhost:4000
- Health check: http://localhost:4000/health

## Démarrage local sans Docker (base SQLite temporaire)

Si Docker/PostgreSQL ne sont pas installés (ex. Windows sans Docker Desktop),
`apps/api/prisma/sqlite/schema.prisma` fournit un schéma identique sur SQLite
(fichier local, zéro installation) :

```bash
cd apps/api
cat > .env <<'EOF'
NODE_ENV=development
PORT=4000
DATABASE_URL="file:./dev.db"
JWT_ACCESS_SECRET=change-me-32-chars-minimum-please
JWT_REFRESH_SECRET=change-me-different-32-chars-please
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL_DAYS=30
CORS_ORIGIN=http://localhost:3000
EOF

npm run sqlite:migrate --workspace=apps/api
npm run sqlite:generate --workspace=apps/api
npm run dev --workspace=apps/api    # API sur :4000, DB dans prisma/sqlite/dev.db

# dans un autre terminal
npm run dev --workspace=apps/web    # front sur :3000
```

C'est une base **jetable**, pratique pour tester le flow inscription/connexion/dashboard
en local. Le schéma "officiel" pour Docker/CI/production reste
[apps/api/prisma/schema.prisma](apps/api/prisma/schema.prisma) (PostgreSQL) — ne pas
committer `apps/api/prisma/sqlite/dev.db` (déjà dans `.gitignore`).

## Stack complète via Docker

```bash
export JWT_ACCESS_SECRET=$(openssl rand -hex 32)
export JWT_REFRESH_SECRET=$(openssl rand -hex 32)
docker compose up --build
```

| Service    | URL                     |
|------------|-------------------------|
| Web        | http://localhost:3000   |
| API        | http://localhost:4000   |
| Prometheus | http://localhost:9090   |
| Grafana    | http://localhost:3001 (admin/admin) |
| Loki       | http://localhost:3100   |

## Tests

```bash
npm run test --workspace=apps/api   # nécessite Postgres (voir docker-compose)
```

## Domaine (Prisma)

`User`, `Skill` (offerte/recherchée), `Match`, `Session`, `PointsLedger`, `Badge`, `KnowledgeArticle`, `AuditLog` — voir [apps/api/prisma/schema.prisma](apps/api/prisma/schema.prisma).

## Stratégie de branches

- **`main`** — toujours déployable, protégée, reçoit uniquement des merges depuis `develop`.
- **`develop`** — branche d'intégration pour le travail en cours.
- Pour une nouvelle fonctionnalité : partir de `develop`, créer `feature/nom-de-la-feature`, ouvrir une pull request vers `develop`.
- La CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) tourne sur les push/PR vers `main` et `develop`.
