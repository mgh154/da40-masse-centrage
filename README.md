# DA40 · Masse et centrage

Outil de préparation de vol pour le DA40 : masse et centrage avec centrogramme, performances (recherche d'aérodrome, METAR, vent, TODR/LDR, marges, tableau PERFORMANCE DATA à recopier sur la fiche papier), triangle des vitesses et CRP-5.

Page unique : ouvrir `index.html` dans un navigateur.

## Sources de données

- **METAR** : deux sources, comparées à chaque contrôle, la plus récente observation l'emporte.
  1. Un relais GitHub (`.github/workflows/metar.yml`) copie AviationWeather.gov toutes les 10 minutes pour les aérodromes de `airports.txt` sur la branche `data`.
  2. Une source directe, Iowa Environmental Mesonet (IEM, accès libre et CORS), interrogée par le navigateur pour les seuls aérodromes choisis : elle ne dépend pas de GitHub Actions et couvre n'importe quel code OACI.
  Le site contrôle à l'ouverture, au retour sur l'onglet, au retour du réseau, puis toutes les 5 minutes tant que la page est visible, et à chaque appui sur « Recharger le METAR » (pause minimale de 30 s entre deux appels). L'âge est toujours calculé depuis l'heure d'observation, jamais depuis le téléchargement. En cas d'échec, le dernier METAR connu reste affiché avec une alerte.
- **Aérodromes et pistes** : OurAirports (domaine public, base collaborative, non officielle), dans `airports.json`, reconstruit chaque mois par `tools/build_airports.py`. Élévation et axes de piste sont donc marqués « À vérifier ».
- **Élévation, orientations vraies, TODA / LDA** : jamais déduites. `declared.json` contient les données officielles relevées dans l'AIP (EBCI et EBLG : élévation, orientation vraie, TORA, TODA, ASDA, LDA, départs d'intersection, source, date d'effet, date de vérification). Pour les autres aérodromes, saisie manuelle : elle est mémorisée sur l'appareil avec sa piste, sa date et son cycle AIRAC (84 jours).
- **Distances AFM** : lecture numérisée des graphiques de l'AFM DA 40 D rév. 7 (± 5 %), sans extrapolation hors des courbes : hors domaine, l'outil le dit et ne calcule rien.

## Vérification contre l'AFM

`node tests/aip-check.js` contrôle les règles de validité des données aéronautiques et `declared.json`. `node tests/afm-check.js` recalcule les exemples chiffrés de l'AFM DA 40 D (décollage p. 5-12, atterrissage p. 5-20 et p. 5-18, chargement p. 6-9, vent p. 5-8). Résultats, conditions d'application, avions à contrôler et raisons des N/D : [VERIFICATION_AFM.md](VERIFICATION_AFM.md).

Données basées sur la fiche New CAG « Mass and balance data », rév. 4.1 du 18 juin 2026. Outil d'aide uniquement, à vérifier avec l'AFM et le FI : il ne constitue pas une autorisation de vol.

## Si les METAR ne se mettent plus à jour

1. Regarder la ligne « Relais GitHub » sous le METAR : si elle est en retard, seule la source directe est utilisée (le site continue de fonctionner).
2. Relancer le relais : onglet Actions du dépôt, « Mise à jour des METAR », « Run workflow » (ou `gh workflow run metar.yml`).
3. Si la source directe échoue aussi : le dernier METAR reste affiché avec l'alerte « peut être périmé » ; coller un METAR récupéré ailleurs dans la zone METAR (son âge est alors inconnu, signalé comme tel).
4. GitHub n'exécute pas toujours les déclenchements planifiés (best effort, parfois en retard ou abandonnés) : c'est la raison de la source directe.
