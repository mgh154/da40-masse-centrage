# Vérification des calculs contre l'AFM DA 40 D

Source de contrôle : extraits de l'AFM **DA 40 D, Doc. 6.01.05-E, révision 7 (27 sept. 2013)**, certaines pages en révision 6.
Ces extraits ne sont pas l'AFM à jour de chaque avion : voir « Correspondance avec les avions ».

Les contrôles se relancent avec `node tests/afm-check.js`.

## 1. TODR et LDR : exemples chiffrés de l'AFM

| Contrôle | AFM | Calcul du site | Écart | Valeur affichée (arrondie au 10 m supérieur) |
|---|---|---|---|---|
| Décollage, exemple p. 5-12 : PA 4 000 ft, 22 °C, 1 070 kg, vent de face 10 kt | 600 m | 605,1 m | +0,9 % | 610 m |
| Atterrissage volets LDG, exemple p. 5-20 : PA 2 000 ft, 15 °C, 1 000 kg, vent de face 10 kt | 500 m | 496,3 m | −0,7 % | 500 m |
| Atterrissage volets LDG, ISA niveau de la mer, 1 150 kg (p. 5-18) | 744 m | 738,6 m | −0,7 % | 740 m |

Les trois exemples traversent les quatre étapes de lecture (température et altitude pression, masse, vent, échelle de distance) des deux graphiques.

**Aucune formule n'a été modifiée** : l'écart reste sous 1 % sur les trois contrôles, bien en dessous de la précision annoncée (± 5 %, lecture numérisée). Aucune erreur n'est démontrée.

**Écarts expliqués**
- Les courbes sont numérisées à partir des graphiques : l'écart vient de la lecture des courbes, pas d'une erreur de méthode.
- L'arrondi au 10 m supérieur ne couvre pas toujours l'écart de lecture : dans le cas ISA, 740 m est affiché alors que l'AFM écrit 744 m. Si la marge est serrée, la valeur de l'AFM prime (case « TODR / LDR AFM saisi »).
- Les graphiques de distance utilisent l'**altitude pression et la température extérieure**, pas l'altitude densité : l'altitude densité affichée (formule de la fiche, 120 ft par °C) est informative. Exemple p. 5-5 : PA 900 ft, +21 °C : la formule donne 1 860 ft, le graphique de l'AFM se lit 1 800 ft.
- Composante traversière, exemple p. 5-8 (32° / 30 kt) : calcul 15,9 kt, AFM 16 kt.
- Chargement, exemple p. 6-9 (réservoirs pleins) : 1 135,8 kg, 2 917,6 kgm, CG 2,569 m, identique à l'AFM.

## 2. Conditions d'application des graphiques

| Condition | Décollage (p. 5-12) | Atterrissage (p. 5-20) |
|---|---|---|
| Puissance | MAX | ralenti |
| Volets | T/O | LDG |
| Piste | revêtue (asphalte), plane | revêtue (asphalte), plane |
| Distance | au passage de 50 ft | au passage de 50 ft |
| Altitude pression | 0 à 10 000 ft | 0 à 10 000 ft |
| Température | −35 à +50 °C | −35 à +50 °C |
| Masse | 750 à 1 150 kg | 850 à 1 150 kg |
| Vent | vent arrière jusqu'à 5 m/s (9,7 kt), vent de face jusqu'à 10 m/s (19,5 kt) | vent de face seulement, jusqu'à 10 m/s |

Hors de ces limites, le site ne calcule rien (pas d'extrapolation) et affiche la raison.

Non traité (l'AFM donne des majorations, le site ne les applique pas) : herbe (décollage +10, 15, ≥ 25 % du roulage ; atterrissage +5, 15, ≥ 25 %), piste mouillée, pente (2 % montante : environ +10 % au décollage ; 2 % descendante : environ +10 % à l'atterrissage), atterrissage volets UP (p. 5-22 à 5-25). L'AFM demande une piste disponible au moins égale à la distance au passage des 50 ft.

## 3. Correspondance avec les avions

Les documents fournis ne donnent **ni le modèle, ni le moteur, ni les suppléments, ni le numéro de série** des huit avions de la fiche New CAG. Rien n'est donc déduit : l'applicabilité est à confirmer par l'utilisateur, avion par avion (case dans « Conditions d'application des graphiques AFM »), et la fiche PDF indique si elle est confirmée.

| Avion | Masse à vide (fiche) | Bras (fiche) | Modèle, moteur, équipements |
|---|---|---|---|
| F-GUPL | 799,0 kg | 2,397 m | à confirmer |
| F-GUVM | 815,0 kg | 2,390 m | à confirmer |
| F-GXNC | 799,5 kg | 2,410 m | à confirmer |
| F-HABM | 794,0 kg | 2,404 m | à confirmer |
| F-HABP | 798,5 kg | 2,400 m | à confirmer |
| F-HABQ | 784,5 kg | 2,450 m | à confirmer |
| F-HYOP | 845,8 kg | 2,452 m | à confirmer |
| F-HYOU | 830,0 kg | 2,453 m | à confirmer |

Points de l'AFM qui dépendent de la configuration et que le site ne peut pas connaître :
- **Modèle et moteur** : l'AFM DA 40 D liste des variantes (moteur TAE 125-02-99, G1000 VFR ou IFR, suppléments). Le numéro de série et l'inventaire d'équipement (section 6.5) tranchent.
- **Masse maximale à l'atterrissage** : 1 150 kg avec les jambes de train modifiées (MÖM 40-123), **1 092 kg sinon**. Le site et la fiche New CAG utilisent 1 150 kg.
- **Réservoir** : le site suppose le réservoir standard (106 L utilisables, limite arrière 2,59 m). Avec le réservoir longue portée (MÖM 40-130), la limite arrière est 2,55 m : non géré.

Limites de masse et de centrage vérifiées : masse maximale 1 150 kg (normal) et 980 kg (utility), 30 kg de bagages, CG avant 2,40 m jusqu'à 980 kg puis 2,46 m à 1 150 kg, CG arrière 2,59 m, bras 2,30 / 3,25 / 3,65 / 2,63 m, carburant 0,84 kg/L : conformes à l'AFM.

## 4. Pourquoi une valeur affiche N/D

| Raison | Exemple | Que faire |
|---|---|---|
| Donnée automatique à confirmer | élévation ou axe de piste issus d'OurAirports, METAR de plus de 2 h | contrôler dans l'AIP puis « J'ai contrôlé ces valeurs », ou saisir la valeur |
| Donnée manquante | pas de piste choisie, pas de vent, QNH ou température absent | choisir la piste ou saisir |
| Hors des graphiques AFM | altitude pression négative, vent arrière à l'atterrissage, masse hors plage | saisir la valeur lue dans l'AFM |
| Jamais déduite | TODA, LDA | saisir celles de l'AIP (ou `declared.json` une fois vérifiées) |

Le tableau « PERFORMANCE DATA » et la fiche PDF utilisent exactement les mêmes valeurs et les mêmes règles.
