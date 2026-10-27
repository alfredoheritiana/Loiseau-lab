# ORYZO — AUDIT DE RÉFÉRENCE ET GAPS (v2.0)
Date de vérification documentaire : 27 octobre 2026.
Projet : reconstruction d'étude isolée, **pas une copie originale validée**.

## Sources et degré de certitude

1. Site officiel https://oryzo.ai/ : textes, boutons, catégories et ordre éditorial visible (CERTAIN POUR LE CONTENU).
2. Lusion, BTS Part 3/7 https://blog.lusion.co/oryzo-bts-part-3-7-website-ux-ui-and-illustrations : direction artistique, couleurs et principes de conception (SOURCE PREMIÈRE).
3. https://rickcreates.com/r/2026-04-13-oryzo-ai : analyse externe des scènes/techniques, observations à revalider (SOURCE SECONDAIRE).
4. https://github.com/SkyNotSilent/true-web-clone/tree/main/examples/oryzo-ai : étude antérieure, chiffres annoncés non reproduits dans ce dépôt (SOURCE SECONDAIRE).
5. Ref ory.rar transmis par l'utilisateur : ~41 entrées, HTML, CSS, JS compilé, images WebP. Archive **non commitée** pour éviter la redistribution de ressources de tiers.

Les mesures de coordonnées, timing, caméra, positions d'objets, shaders, matériaux et changements par breakpoint **ne sont pas connues** tant que les captures comparables n'ont pas été exécutées.

## Direction artistique vérifiée

- Palette publiée/analysée : brun presque noir **#100904**, crème **#FFEDD7**, orange **#DC5000**, olive sourd **#445231**.
- Police principale rapportée : **Halyard Display**. Ne pas embarquer sans licence. Police de substitution utilisée temporairement dans le scaffold : DM Sans / Space Grotesk (écart explicite).
- Exceptions typographiques : **Literata** sur le magazine, **DM Mono** pour le papier académique.
- 16 colonnes sur le large viewport d'après une analyse externe : à re-mesurer, ne pas coder comme règle universelle.
- Quatre principes affirmés par Lusion : image réaliste, produit central, transitions sans coupure, humour.
- Un **modèle de coaster présent tout au long de l'expérience** et des couches DOM superposées à un canvas persistant sont rapportés par l'analyse technique. Validations dans le navigateur requises.

## Cartographie à reconstruire et vérifier

| ID | Chapitre / état | Interaction / motion critique | Situation dans le scaffold |
|---|---|---|---|
| 00 | Loader : tracé circulaire, points de contrôle | Timeline entrée/sortie | ABSENT / BLOQUÉ |
| 01 | Hero atelier : tapis vert quadrillé, outils, coaster, grande typo, vidéo | WebGL, motion d'entrée, vidéo, scroll | PARTIEL (props / lumière / micro-motion) |
| 02 | Présentation studio et bénéfice | Transition de caméra/objets sans couture | PARTIEL |
| 03 | Déclaration « isn't just a coaster » | Échelle et masque typographiques | PARTIEL |
| 04 | « Powered by AI* » avec main à six doigts | Réaction main/curseur, scene GPU | PARTIEL (texte, pas de main) |
| 05 | Wearable / galerie de visuels | Images, transitions, contenu dynamique | PARTIEL (emplacements) |
| 06 | « bikini » : mini-interaction conversation | État bouton Send et média modifié | ABSENT |
| 07 | Magazine RISE / We Are So Cooked | Transformation photo wall / cover | PARTIEL |
| 08 | Product lift / real-life desk | Coaster continu, props et travelling | PARTIEL |
| 09 | Thermodynamic stability | Animation de matière/thermique, indices T | PARTIEL |
| 10 | Roundness / illustrations | Proximité/coaster, dessins | ABSENT |
| 11 | Micro-zoom / tardigrades | Zoom extrême et personnages tardifs | ABSENT |
| 12 | Smart flip encryption | Saisie, inversion, rendu sur dessous 3D | PARTIEL (texte seulement) |
| 13 | Antislip / texture macro | Physique/adhérence/zoom | PARTIEL |
| 14 | Sustainability, données | Cartes data / illustration | PARTIEL |
| 15 | Testimonials/Reviews | Galerie, médias, cartes, drag | PARTIEL |
| 16 | Product picker / ORYZO, Pro, Pro Max | Variantes 1/2/3 couches | PARTIEL (modèles empilés) |
| 17 | ORYZO-1 scientific paper | Editorial document, liens externes | PARTIEL |
| 18 | Finale agence / CTA / réseaux | Seamless close, footer, menus | PARTIEL |

Le site complet est long (un examen indépendant mentionne environ 64 écrans). Le scaffold actuel n'est PAS une couverture de 64 vues; chaque chapitre peut contenir de nombreuses sous-scènes.

## Inventaire des ressources

### Présent dans le dépôt sur la branche expérimentale
- oryzo-reference/licensed-assets/oryzo-1-26b-a0b.obj : modèle de coaster OFFICIEL publié par Lusion sous licence MIT.
- oryzo-reference/licensed-assets/LICENSE-LUSION-MIT.txt : attribution et licence conservées.
- Script Playwright de capture, inventaire des URLs, capture des interactions et comparateur.

### Manquant pour une fidélité réelle
- Scènes WebGL complètes, anim caméras, matériaux, lumière HDR, textures précises.
- Rive + WASM, fichiers GPU comme .buf et splats .sog.
- Ensemble de médias produits et images responsives (photo wall, magazine, reviews).
- Polices/licences nécessaires, vidéo et sources des illustrations.
- Paramètres de motion (durées, easing, courbes, timing), comportements aux breakpoints.
- Tests de toutes les interactions avec vidéos/captures normalisées.

Le cas True Web Clone cite (à titre d'indices, sans qu'ils soient inclus dans son dépôt) : /rive/oryzo.riv, /vendor/rive/rive.wasm, /models/coaster_hero_animation.buf, /splats/props.sog, /splats/table_reflection.sog. Ne pas prétendre que leur simple citation les rend disponibles.

## Critères qualité non négociables

- Test sur 1440×900, 768×1024, 390×844 (DPR et navigateur fixés).
- Screenshots **de viewport** à scroll contrôlé; les captures fullPage seules sont trompeuses avec canvas fixed.
- Comparer plusieurs états par scène, pas uniquement frame initiale.
- Les erreurs de ressources et les écarts de canvas doivent être consignés.
- Vérifier navigation, hover, modèle, encode/decode, menu, carrousels, tactile et reduced-motion.
- Les mesures pixelmatch sont des écarts visuels, **pas** un score total de fidélité.
- Ne jamais valider « 100 % » sans tests des séquences et comportements dans les conditions de référence.
- Le miroir privé d'étude et la future publication LOISEAU ont des exigences de licence différentes.
