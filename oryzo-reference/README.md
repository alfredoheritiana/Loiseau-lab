# ORYZO REFERENCE LAB — étude et reconstruction (V3)

**Attention : ce dépôt est un prototype de reconstruction, PAS une copie validée d'oryzo.ai à 100 %.** La branche principale de LOISEAU est intacte. Toutes les modifications ci-dessous concernent uniquement la branche **experiments/oryzo-reference**.

## Ce qui est déjà prêt

- L'application qui démarre depuis la RACINE de cette branche affiche désormais une étude ORYZO indépendante : 3D WebGL persistante, modèle de coaster OFFICIEL sous licence MIT, chapitres narratifs et interactions de base.
- Les docs et scripts de référence sont dans oryzo-reference/ : capteur Playwright, captures d'interactions, inventaire URL d'actifs 3D, comparaison pixel/geometry par frame.
- Les méthodes publiques True Web Clone ont été intégrées dans method/ avec leur licence MIT; ce n'est pas un clone téléchargeable d'Oryzo.
- Les scripts de capture ne sont pas exécutés automatiquement lors de l'import GitHub, et une simulation AI Studio n'a pas les droits/ressources des vrais assets Oryzo.

## IMPORTANT — importer la bonne version dans Google AI Studio

1. Utiliser un **nouveau projet Build** (ne pas écraser un projet LOISEAU).
2. Dans AI Studio, choisir Add files (+) > Import from GitHub (fonction documentée officiellement).
3. Sélectionner alfredoheritiana/Loiseau-lab et, **si l'UI permet de choisir la branche**, choisir EXACTEMENT experiments/oryzo-reference. Vérifier que index.html indique ORYZO Reference et que src/App.tsx commence par l'étude Oryzo.
4. **Si AI Studio impose la branche main, ne pas lancer de modifications** : main reste LOISEAU. Dans ce cas, créer un dépôt GitHub séparé à partir du contenu de cette branche, ou importer le code depuis un dépôt ORYZO dédié; ne pas changer le branchement principal du vrai site.
5. Coller le texte intégral de GOOGLE_AI_STUDIO_PROMPT.md. La première phase imposée est le diagnostic/build, pas une génération complète improvisée.

Source officielle AI Studio : https://ai.google.dev/gemini-api/docs/aistudio-build-mode

## Démarrer l'application sur un environnement Node

À la RACINE du dépôt (bonne branche) :
  npm install
  npm run dev
  npm run build
  npm run lint

L'app s'ouvre sur http://127.0.0.1:3000. Une erreur de build doit être corrigée avant de poursuivre; aucune build réelle n'a été vérifiée dans cette session.

## Auditer le vrai site

Playwright et Chromium se lancent depuis un environnement Node.js classique, par exemple local ou Codespaces. Google AI Studio peut ne pas fournir un vrai navigateur exécutable pour ces scripts.

  cd oryzo-reference
  npm install
  npx playwright install chromium
  FRAMES=64 npm run capture
  npm run interactions
  npm run inventory

Sur Windows PowerShell, utiliser :
  $env:FRAMES="64"; npm run capture; Remove-Item Env:FRAMES

Outputs :
- captures/source/{desktop,tablet,mobile}/frame-NN.png + capture.json et initial.html.
- captures/source/interactions/...
- reports/assets-manifest.json / assets-manifest.md

Les captures et rapports ne sont pas committés sur GitHub (voir .gitignore), en raison des ressources et données de tiers.

## Comparer notre prototype

Démarrer d'abord la web app racine en localhost:3000. Dans le dossier oryzo-reference :

Mac / Linux :
  MODE=local URL=http://127.0.0.1:3000 FRAMES=64 npm run capture
  MODE=local URL=http://127.0.0.1:3000 npm run interactions
  npm run compare

PowerShell :
  $env:MODE="local"; $env:URL="http://127.0.0.1:3000"; $env:FRAMES="64"; npm run capture; npm run interactions
  Remove-Item Env:MODE; Remove-Item Env:URL; Remove-Item Env:FRAMES
  npm run compare

Consulter reports/comparison.md, reports/comparison.json et les PNG de différence. Si les canvas/animations ont des états non déterministes, considérer le pixel mismatch comme un indicateur partiel et vérifier la timeline par d'autres moyens.

## Contenus encore manquants

Le rendu courant est un scaffold avec placeholders déclarés. Il manque notamment la vraie intro complète, l'univers 3D réaliste de l'atelier, les ressources propriétaires .sog/.buf/.riv/.wasm, les scènes caméra exactes, plusieurs interactions et la plupart des détails de post-processing. Lire ORYZO_REFERENCE_SPEC.md avant de considérer la reconstruction « terminée ».

## Séparation des droits

Le seul modèle Oryzo inclus dans le dépôt est officiel et MIT avec sa licence. La méthode True Web Clone est MIT également. Le site original, ses médias, textures, polices, scripts de production et marques **ne deviennent pas réutilisables commercialement** parce qu'ils sont visibles publiquement. La future version LOISEAU devra être originale ou autorisée.
