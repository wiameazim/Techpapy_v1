# Documentation technique — TechPapy

## Sommaire

1. [Architecture générale](#1-architecture-générale)
2. [Stack technique](#2-stack-technique)
3. [Modèle de données](#3-modèle-de-données)
4. [Sécurité](#4-sécurité)
5. [API — endpoints](#5-api--endpoints)
6. [Visioconférence (WebRTC)](#6-visioconférence-webrtc)
7. [Observabilité](#7-observabilité)
8. [CI/CD](#8-cicd)
9. [Déploiement](#9-déploiement)
10. [Limites connues](#10-limites-connues)
11. [Méthodologie et usage de l'IA](#11-méthodologie-et-usage-de-lia)

---

## 1. Architecture générale

```
┌──────────────┐        HTTPS/REST        ┌──────────────┐        SQL        ┌──────────────┐
│  apps/web    │ ───────────────────────▶ │  apps/api    │ ─────────────────▶│  PostgreSQL  │
│  Next.js SPA │ ◀─────────────────────── │  Express API │ ◀──────────────── │              │
└──────────────┘      WebSocket (WebRTC    └──────────────┘                  └──────────────┘
                       signaling, Socket.IO)
```

- **Frontend** (`apps/web`) : Next.js App Router, rendu par composants
  serveur/client, appelle l'API via `fetch`
- **Backend** (`apps/api`) : API REST Express, expose aussi un serveur
  Socket.IO pour la signalisation vidéo
- **Base de données** : PostgreSQL en production, accédée via Prisma ORM
- Les deux applications sont conteneurisées indépendamment (un `Dockerfile`
  chacune) et orchestrées ensemble via `docker-compose.yml` en local

## 2. Stack technique

| Composant | Technologie | Version |
|---|---|---|
| Frontend | Next.js (App Router) | 16.x |
| UI | React + TypeScript + Tailwind CSS | 19.x / 4.x |
| Backend | Express + TypeScript | 4.x |
| ORM | Prisma | 6.x |
| Base de données | PostgreSQL | 16 (prod) / SQLite (dev local) |
| Authentification | JWT (`jsonwebtoken`) | — |
| Visioconférence | WebRTC via `simple-peer` + `socket.io` | 9.x / 4.x |
| Conteneurisation | Docker + docker-compose | — |
| Monitoring | Prometheus + Grafana + Loki/Promtail | — |
| CI/CD | GitHub Actions | — |

## 3. Modèle de données

Défini dans [`apps/api/prisma/schema.prisma`](apps/api/prisma/schema.prisma) :

| Modèle | Rôle |
|---|---|
| `User` | Compte utilisateur (nom, email, mot de passe haché, rôle, points cumulés) |
| `RefreshToken` | Jetons de rafraîchissement (hachés), rotation à chaque utilisation |
| `Skill` | Compétence déclarée par un utilisateur (offerte / recherchée) |
| `Match` | Mise en relation entre deux utilisateurs |
| `Session` | Session planifiée entre deux membres d'un match |
| `PointsLedger` | Historique des points gagnés (montant, raison, date) |
| `Badge` / `UserBadge` | Modèle prêt pour un futur système de badges (non activé) |
| `KnowledgeArticle` | Modèle prêt pour une future base de connaissances (non activé) |
| `AuditLog` | Journal des actions sensibles (connexions, échecs, etc.) |

## 4. Sécurité

- **Authentification** : JWT à courte durée de vie (access token, 15 min)
  + refresh token longue durée stocké haché en base et transmis via cookie
  `httpOnly`, avec rotation à chaque utilisation
- **Mots de passe** : hachés avec `bcrypt` (12 rounds), jamais stockés en clair
- **RBAC** : rôles `USER` / `ADMIN`, middleware de contrôle d'accès par route
- **Protection CSRF** : un en-tête personnalisé (`X-Requested-With`) est requis
  sur les routes qui s'appuient sur le cookie de session, bloquant les
  requêtes cross-site simples
- **Protection XSS / injection** : sanitisation de toutes les entrées
  (`sanitize-html`), validation stricte des schémas (`zod`)
- **En-têtes de sécurité** : `helmet` (CSP, HSTS, X-Frame-Options, etc.)
- **Limitation de débit** : `express-rate-limit`, seuil renforcé sur les
  routes d'authentification (anti brute-force)
- **Journalisation d'audit** : chaque connexion (réussie/échouée),
  inscription et déconnexion est enregistrée avec IP et user-agent

## 5. API — endpoints

| Méthode | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Création de compte |
| POST | `/api/auth/login` | — | Connexion |
| POST | `/api/auth/refresh` | Cookie | Renouvellement de l'access token |
| POST | `/api/auth/logout` | Cookie | Déconnexion |
| GET | `/api/me` | JWT | Profil complet (compétences, badges, points) |
| GET | `/api/me/points` | JWT | Historique des points |
| GET | `/api/skills` | — | Liste des compétences (filtrable par type) |
| POST | `/api/skills` | JWT | Créer une compétence |
| DELETE | `/api/skills/:id` | JWT | Supprimer sa propre compétence |
| GET | `/api/matches` | JWT | Mes matchs |
| POST | `/api/matches` | JWT | Créer un match |
| POST | `/api/sessions` | JWT | Planifier une session |
| GET | `/api/sessions/:id` | JWT | Détail d'une session |
| PATCH | `/api/sessions/:id/complete` | JWT | Clôturer une session (attribue les points) |
| GET | `/api/admin/audit-logs` | JWT + ADMIN | Journaux d'audit |
| GET | `/api/admin/users` | JWT + ADMIN | Liste des utilisateurs |
| GET | `/health` | — | Vérification de disponibilité |
| GET | `/metrics` | — | Métriques Prometheus |

## 6. Visioconférence (WebRTC)

Développée en interne, sans service tiers :

- **Signalisation** : serveur Socket.IO intégré à l'API, authentifié par
  JWT ; chaque session vidéo correspond à une "room" (`session:{id}`)
  limitée aux deux participants du match concerné
- **Flux audio/vidéo** : connexion peer-to-peer directe entre les deux
  navigateurs (WebRTC natif via la librairie `simple-peer`) — le
  flux ne transite jamais par notre serveur, seule la négociation initiale
  (offer/answer/ICE) passe par la signalisation

## 7. Observabilité

- **Métriques** (Prometheus) : requêtes/seconde, durée des requêtes par
  route, échecs d'authentification, métriques système (CPU, mémoire)
- **Visualisation** (Grafana) : tableau de bord provisionné automatiquement
- **Logs** (Loki + Promtail) : centralisation des logs applicatifs (format
  JSON structuré via `pino`)
- **Alertes** : règles Prometheus définies (API down, taux d'erreur élevé,
  pic d'échecs d'authentification) — *non connectées à un canal de
  notification (mail/Slack) à ce stade*

## 8. CI/CD

Pipeline GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) :

1. **Lint** — ESLint sur les deux applications
2. **Tests** — Jest avec une base PostgreSQL de test (service GitHub Actions)
3. **Build** — compilation TypeScript + build Next.js
4. **Images Docker** — construction et publication sur GitHub Container
   Registry (sur `main`/`develop`)

Un second workflow ([`deploy.yml`](.github/workflows/deploy.yml)) prépare un
déploiement avec rollback (déclenchement manuel).

## 9. Déploiement

- **Local** : `docker-compose.yml` (API, frontend, PostgreSQL, Redis*,
  Prometheus, Grafana, Loki, Promtail)
- **Cloud** : Google Cloud Platform — voir
  [DEPLOIEMENT_GCP.md](DEPLOIEMENT_GCP.md) pour la procédure détaillée
  (Cloud Run pour l'API et le frontend, Cloud SQL pour PostgreSQL)

\* Redis est provisionné dans `docker-compose.yml` mais n'est pas encore
utilisé par le code applicatif à ce stade.

## 10. Limites connues

- Aucune couverture de tests unitaires mesurée sur l'ensemble du code
  (seuil configuré à 70 %, jamais vérifié en pratique)
- Aucun scan de sécurité automatisé en CI (type `npm audit`/Snyk)
- Le statut d'un match reste bloqué à `PENDING` (la transition vers `ACTIVE`
  après une première session n'a pas été implémentée)
- Base de connaissances et badges : modèles de données prêts, aucune route
  API ni interface associée

## 11. Méthodologie et usage de l'IA

Ce projet a été développé avec l'assistance de **Claude (Claude Code,
Anthropic)**, un assistant IA de programmation utilisé pour générer le
squelette du code, implémenter les fonctionnalités, déboguer les problèmes
rencontrés et documenter le projet. La conception fonctionnelle, les choix
de priorités, les tests manuels et la validation de chaque étape ont été
réalisés par l'étudiante, qui est en mesure d'expliquer chaque partie du
projet.
