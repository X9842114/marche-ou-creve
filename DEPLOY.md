# Déploiement sans VPS (cveshop.com)

Le shop `cveshop.com` est en Apache OVH : on ne peut pas y coller Next.js directement.
Solution : **Vercel** (app) + **Turso** (base SQLite cloud) + sous-domaine DNS.

URL cible : `https://h47.cveshop.com`

## 1. Créer la base Turso (gratuit)

1. Va sur https://turso.tech et crée un compte
2. Crée une base `marche-ou-creve`
3. Copie :
   - URL `libsql://...turso.io`
   - Token d'auth

## 2. Déployer sur Vercel

```bash
npm i -g vercel
vercel login
cd marche-ou-creve
vercel
```

Dans le dashboard Vercel → Project → Settings → Environment Variables :

| Nom | Valeur |
|-----|--------|
| `ADMIN_PASSWORD` | ton mot de passe admin |
| `ADMIN_SECRET` | longue chaîne aléatoire |
| `DATABASE_URL` | URL Turso |
| `DATABASE_AUTH_TOKEN` | token Turso |

Puis :

```bash
vercel --prod
```

## 3. Brancher h47.cveshop.com (OVH)

1. Vercel → Project → Settings → Domains → ajoute `h47.cveshop.com`
2. Panel OVH → Domaines → `cveshop.com` → Zone DNS → ajoute :

| Type | Sous-domaine | Cible |
|------|--------------|--------|
| CNAME | `h47` | `cname.vercel-dns.com.` |

(ou la cible exacte indiquée par Vercel)

3. Attends 5-30 min (propagation DNS)
4. Site : https://h47.cveshop.com  
   Admin : https://h47.cveshop.com/Admin47

## Pourquoi pas directement sur cveshop.com ?

Ça écraserait le shop FiveM actuel. Le sous-domaine `h47` laisse les deux sites vivre ensemble.
