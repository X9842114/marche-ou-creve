# Marche ou Crève - H-47

Site d'inscription et de tirage pour l'événement GTA V RP **Marche ou Crève (H-47)**.

Développé par **CVE**.

## Stack

- Next.js (App Router)
- React + TypeScript + Tailwind
- **Supabase** (Postgres) - données partagées pour tous les visiteurs

## Déploiement (cveshop.com, sans VPS)

Voir **[DEPLOY.md](DEPLOY.md)** : Vercel + Supabase + sous-domaine `h47.cveshop.com`.

## Installation locale

```bash
git clone https://github.com/X9842114/marche-ou-creve.git
cd marche-ou-creve
cp .env.example .env
# renseigner SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY + ADMIN_*
npm install
# Exécuter supabase/schema.sql dans le SQL Editor Supabase
npm run dev
```

## Pages

| Route | Rôle |
|-------|------|
| `/` | Inscription (ou sélection si publiée) |
| `/selection` | Tirés au sort (si publié) |
| `/Admin47` | Panel organisateurs |

## Administration

1. Ouvre `/Admin47`
2. Mot de passe = `ADMIN_PASSWORD`
3. Ouvre / ferme les inscriptions, tirage, publication, avertissements

## Licence

Usage interne événementiel - H-47 / CVE.
