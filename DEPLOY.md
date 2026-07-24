# Déploiement cveshop.com (sans VPS)

Base : **Supabase**  
App : **Vercel** (gratuit)  
URL : **https://h47.cveshop.com** (ne casse pas le shop principal)

## 1. Tables Supabase

1. Ouvre ton projet Supabase (celui de CVE Shop)
2. SQL Editor → colle le fichier `supabase/schema.sql` → Run

## 2. Clés API

Project Settings → API :
- `Project URL` → `SUPABASE_URL`
- `service_role` (secret) → `SUPABASE_SERVICE_ROLE_KEY`

## 3. Vercel

```bash
npm i -g vercel
vercel login
vercel
vercel --prod
```

Variables d'environnement Vercel :

| Nom | Valeur |
|-----|--------|
| `ADMIN_PASSWORD` | ex. H47ADMIN47 |
| `ADMIN_SECRET` | chaîne longue aléatoire |
| `SUPABASE_URL` | https://xxxx.supabase.co |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role |

## 4. Domaine OVH → h47.cveshop.com

1. Vercel → Domains → ajoute `h47.cveshop.com`
2. OVH → Zone DNS `cveshop.com` → CNAME :
   - Sous-domaine : `h47`
   - Cible : `cname.vercel-dns.com.` (ou celle indiquée par Vercel)

Admin : https://h47.cveshop.com/Admin47
