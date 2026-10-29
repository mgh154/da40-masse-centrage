# DA40 · Masse et centrage

Outil de préparation de vol pour le DA40 : masse et centrage avec centrogramme, performances (recherche d'aérodrome, METAR, vent, TODR/LDR, marges), triangle des vitesses et CRP-5.

Page unique : ouvrir `index.html` dans un navigateur.

## Sources de données

- **METAR** : AviationWeather.gov. Une tâche GitHub (`.github/workflows/metar.yml`) les récupère toutes les 30 min pour les aérodromes de `airports.txt` et les publie sur la branche `data`.
- **Aérodromes et pistes** : OurAirports (domaine public, base collaborative, non officielle), dans `airports.json`, reconstruit chaque mois par `tools/build_airports.py`. Élévation et axes de piste sont donc marqués « À vérifier ».
- **TODA / LDA** : jamais déduites. Elles se saisissent à la main depuis l'AIP, ou se déclarent dans `declared.json` une fois vérifiées (étiquette « AIP »).
- **Distances AFM** : lecture numérisée des graphiques de l'AFM DA 40 D rév. 7 (± 5 %), sans extrapolation hors des courbes : hors domaine, l'outil le dit et ne calcule rien.

## Vérification contre l'AFM

`node tests/afm-check.js` recalcule les exemples chiffrés de l'AFM DA 40 D (décollage p. 5-12, atterrissage p. 5-20 et p. 5-18, chargement p. 6-9, vent p. 5-8). Résultats, conditions d'application, avions à contrôler et raisons des N/D : [VERIFICATION_AFM.md](VERIFICATION_AFM.md).

## Fiche New CAG remplie

Le bouton « Télécharger la fiche New CAG remplie » écrit les données de la page par-dessus le PDF d'origine (`fiche.js`, bibliothèque pdf-lib) : tableau Mass and Balance, points sur les deux graphiques, tableau Performance Data. Une valeur absente, ou « à vérifier », reste en N/D (case à cocher pour les imprimer quand même, marquées `*`).

Le PDF modèle (`newcag-fiche.pdf`) est un document de l'école : il n'est pas dans le dépôt (`.gitignore`). Sans lui, le bouton demande de le choisir une fois ; il est ensuite gardé sur l'appareil (IndexedDB, rien n'est envoyé sur Internet). Si le navigateur l'efface (iPhone après plusieurs jours sans visite, données du site supprimées), la page l'affiche en rouge et redemande le PDF. Pour le publier avec le site, déposer `newcag-fiche.pdf` à la racine et retirer la ligne du `.gitignore`.

Données basées sur la fiche New CAG « Mass and balance data », rév. 4.1 du 18 juin 2026. Outil d'aide uniquement, à vérifier avec l'AFM et le FI : il ne constitue pas une autorisation de vol.
