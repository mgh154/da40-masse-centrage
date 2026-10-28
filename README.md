# DA40 · Masse et centrage

Outil de préparation de vol pour le DA40 : masse et centrage avec centrogramme, performances (recherche d'aérodrome, METAR, vent, TODR/LDR, marges), triangle des vitesses et CRP-5.

Page unique : ouvrir `index.html` dans un navigateur.

## Sources de données

- **METAR** : AviationWeather.gov. Une tâche GitHub (`.github/workflows/metar.yml`) les récupère toutes les 30 min pour les aérodromes de `airports.txt` et les publie sur la branche `data`.
- **Aérodromes et pistes** : OurAirports (domaine public, base collaborative, non officielle), dans `airports.json`, reconstruit chaque mois par `tools/build_airports.py`. Élévation et axes de piste sont donc marqués « À vérifier ».
- **TODA / LDA** : jamais déduites. Elles se saisissent à la main depuis l'AIP, ou se déclarent dans `declared.json` une fois vérifiées (étiquette « AIP »).
- **Distances AFM** : lecture numérisée des graphiques de l'AFM DA 40 D rév. 7 (± 5 %), sans extrapolation hors des courbes : hors domaine, l'outil le dit et ne calcule rien.

Données basées sur la fiche New CAG « Mass and balance data », rév. 4.1 du 18 juin 2026. Outil d'aide uniquement, à vérifier avec l'AFM et le FI : il ne constitue pas une autorisation de vol.
