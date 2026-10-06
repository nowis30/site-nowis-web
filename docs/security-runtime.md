# Runtime et dépendances — 5 octobre 2026

Le durcissement initial désactivait seulement le traitement serveur des images sur Next.js 14. Cette mesure a été complétée par la migration vers **Next.js 16.3.8 / React 19.3.0**, ainsi que **Nodemailer 10.0.15** et les correctifs de dépendances transitives. Le détail des versions, sources officielles, changements de compatibilité et validations figure dans [dependency-security.md](./dependency-security.md).

L’audit actuel du verrou avec `npm audit --omit=dev --json` ne signale **aucune vulnérabilité de production**. L’audit complet conserve sept entrées élevées liées à `braces`, uniquement dans l’outillage de développement, sans version corrigée publiée. L’exception et les conditions précises de non-exposition HTTP sont documentées; ce résultat ne doit pas être présenté comme un audit complet sans aucune alerte ni comme une garantie contre des failles inconnues.

L’optimisation d’images reste désactivée (`images.unoptimized: true`), avec livraison des fichiers sources. Les URL d’images distantes autorisées utilisent `remotePatterns` plutôt que l’ancienne liste `domains`. Les réécritures d’audio et de radio sont conservées. Les paramètres et en-têtes Next.js sont maintenant lus de manière asynchrone conformément aux versions 15/16.

## Environnement et stockage

Le code utilise Prisma/PostgreSQL côté serveur. Aucune intégration Supabase ni politique RLS n’a été trouvée dans le projet. Un audit de code ne confirme pas les privilèges effectifs des rôles PostgreSQL ni les politiques d’accès S3; ces contrôles d’infrastructure doivent être vérifiés sur l’environnement visé avant une livraison.

Les anciens relevés de variables Vercel confirmaient uniquement la présence et le type de stockage des secrets, pas leur force cryptographique, leur validité chez les fournisseurs ni l’isolation des bases de preview et de production. Aucune valeur de secret n’est publiée dans les rapports. La nouvelle procédure de build doit générer le client Prisma sans appliquer de migration automatique; les migrations sont une étape de livraison explicite vers une base confirmée.

Le suivi des corrections d’authentification, d’accès aux dossiers, des téléversements et des autres endpoints apparaît dans [security-audit-2026-10-05.md](./security-audit-2026-10-05.md). Ces corrections locales ne signifient pas qu’elles sont déjà déployées sur le site public.
