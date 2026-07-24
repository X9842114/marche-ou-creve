# Marche ou Crève - H-47

Site d’inscription et de tirage pour l’événement GTA V RP **Marche ou Crève (H-47)**.

Développé par **CVE**.

## Stack

- Next.js (App Router)
- React + TypeScript + Tailwind
- SQLite (`@libsql/client`) - une base partagée pour tous les visiteurs

## Prérequis

- Node.js 20+
- Un hébergement **Node.js persistant** (VPS, Pterodactyl, machine dédiée…).  
  Un hébergement serverless type Vercel n’est **pas** adapté (fichier SQLite local).

## Installation

```bash
git clone <url-du-repo>
cd marche-ou-creve
cp .env.example .env
npm install
```

Édite `.env` :

```env
ADMIN_PASSWORD=ton-mot-de-passe-fort
ADMIN_SECRET=une-longue-chaine-aleatoire
```

## Lancer

### Développement

```bash
npm run dev
```

Le site écoute sur `0.0.0.0:3000` (accessible sur le réseau local).

### Production

```bash
npm run build
npm start
```

La base SQLite est créée automatiquement dans `data/marche-ou-creve.db`.

## Pages

| Route | Rôle |
|-------|------|
| `/` | Inscription (ou sélection si publiée) |
| `/selection` | Tirés au sort (si publié) |
| `/Admin47` | Panel organisateurs |

## Administration

1. Ouvre `/Admin47`
2. Connecte-toi avec `ADMIN_PASSWORD`
3. Ouvre / ferme les inscriptions, lance le tirage, publie la sélection, gère les avertissements

Tous les visiteurs voient la **même** donnée (sync ~3 s via `/api/sync`).

## Notes pour l’hébergeur

- Garde le dossier `data/` en volume persistant (sinon les inscriptions disparaissent au redémarrage).
- Ne commit jamais le fichier `.env`.
- En HTTPS, les cookies admin passent en `Secure` automatiquement en production.
- Ouvre le port 3000 (ou place un reverse proxy Nginx / Caddy devant).

## Licence

Usage interne événementiel - H-47 / CVE.
