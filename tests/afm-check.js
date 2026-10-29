/* Vérifie les calculs d'index.html contre les exemples chiffrés de l'AFM DA 40 D (Doc. 6.01.05-E, rév. 7).
   Usage : node tests/afm-check.js
   Les valeurs « attendues » sont celles écrites dans l'AFM (exemples dessinés sur les graphiques p. 5-12 et p. 5-20,
   valeurs ISA / niveau de la mer p. 5-18, exemple de chargement p. 6-9). */
"use strict";
const fs = require("fs"), path = require("path");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const afmData = html.match(/var AFM = \{.*?\}\};\n/s)[0];
const i = html.indexOf("/* AFM:début"), j = html.indexOf("  /* Applicabilité des graphiques");
const body = afmData + "\n" + html.slice(i, j) + "\nreturn {afm, toDist, ldDist, afmTrace, afmSvg};";
const lib = new Function("fmt", body)((n, d) => Number(n).toFixed(d));

let fails = 0;
function check(label, ok, detail){ console.log((ok ? "OK   " : "ÉCHEC") + "  " + label + (detail ? "  " + detail : "")); if (!ok) fails++; }

/* 1. Exemples de l'AFM */
const ex = [
  ["Décollage, exemple p. 5-12 (PA 4000 ft, 22 °C, 1070 kg, face 10 kt)", "to", 4000, 22, 1070, 10, 600],
  ["Atterrissage LDG, exemple p. 5-20 (PA 2000 ft, 15 °C, 1000 kg, face 10 kt)", "ld", 2000, 15, 1000, 10, 500],
  ["Atterrissage LDG, ISA niveau mer 1150 kg, p. 5-18", "ld", 0, 15, 1150, 0, 744]
];
console.log("\n1. Exemples chiffrés de l'AFM");
ex.forEach(function(e){
  const raw = e[1] === "to" ? lib.toDist(e[2], e[3], e[4], e[5]) : lib.ldDist(e[2], e[3], e[4], e[5]), shown = lib.afm(e[1], e[2], e[3], e[4], e[5]).val;
  const err = (raw - e[6]) / e[6] * 100;
  check(e[0], Math.abs(err) <= 2, "AFM " + e[6] + " m · calcul " + raw.toFixed(1) + " m (" + (err >= 0 ? "+" : "") + err.toFixed(2) + " %) · affiché " + shown + " m");
});

/* 2. Le tracé du graphique redonne exactement la même distance que le calcul */
console.log("\n2. Tracé du graphique = calcul");
let n = 0, bad = 0;
for (const k of ["to", "ld"]) for (let pa = 0; pa <= 9000; pa += 1500) for (let t = -20; t <= 40; t += 12) for (const m of [800, 950, 1100, 1150]) for (const w of [0, 4, 11, 17]) {
  const raw = k === "to" ? lib.toDist(pa, t, m, w) : lib.ldDist(pa, t, m, w);
  if (!isFinite(raw)) continue;
  n++;
  if (Math.abs(lib.afmTrace(k, pa, t, m, w).dist - raw) > 1e-9) bad++;
}
check("tracé identique au calcul sur " + n + " combinaisons", bad === 0 && n > 200);
check("le graphique SVG se construit", /<svg/.test(lib.afmSvg(lib.afmTrace("to", 4000, 22, 1070, 10))) && /<svg/.test(lib.afmSvg(lib.afmTrace("ld", 2000, 15, 1000, 10))));

/* 3. Refus hors du domaine des graphiques */
console.log("\n3. Domaine des graphiques (aucune extrapolation)");
check("altitude pression négative refusée", !!lib.afm("to", -100, 15, 1000, 0).err);
check("altitude pression > 10 000 ft refusée", !!lib.afm("to", 10500, 15, 1000, 0).err);
check("température hors −35 / +50 °C refusée", !!lib.afm("ld", 0, 55, 1000, 0).err);
check("masse > 1 150 kg refusée", !!lib.afm("to", 0, 15, 1160, 0).err);
check("atterrissage sous 850 kg refusé", !!lib.afm("ld", 0, 15, 800, 0).err);
check("vent arrière à l'atterrissage refusé (non prévu par l'AFM)", !!lib.afm("ld", 0, 15, 1000, -3).err);
check("vent arrière au décollage > 5 m/s refusé", !!lib.afm("to", 0, 15, 1000, -12).err);
check("vent de face > 10 m/s refusé", !!lib.afm("to", 0, 15, 1000, 21).err);

/* 4. Autres formules de la page contre l'AFM */
console.log("\n4. Autres formules");
const cross = 30 * Math.sin(32 * Math.PI / 180);
check("composante traversière, exemple p. 5-8 (32° / 30 kt)", Math.round(cross) === 16, "calcul " + cross.toFixed(1) + " kt, AFM 16 kt");
const CG = {front: 2.30, rear: 3.25, bag: 3.65, fuel: 2.63}, m1 = 735 + 150 + 150 + 100.8, mo1 = 1820 + 150 * CG.front + 150 * CG.rear + 100.8 * CG.fuel;
check("chargement, exemple p. 6-9 (réservoirs pleins)", Math.abs(m1 - 1135.8) < 0.01 && Math.abs(mo1 - 2917.6) < 0.2 && Math.abs(mo1 / m1 - 2.569) < 0.0005, "masse " + m1.toFixed(1) + " kg, moment " + mo1.toFixed(1) + " kgm, CG " + (mo1 / m1).toFixed(3) + " m (AFM 1135,8 · 2917,60 · 2,569)");
check("moments de l'enveloppe (780 × 2,40 ; 780 × 2,59 ; 980 × 2,40 ; 1150 × 2,46 ; 1150 × 2,59)", [780 * 2.4, 780 * 2.59, 980 * 2.4, 1150 * 2.46, 1150 * 2.59].map(Math.round).join() === "1872,2020,2352,2829,2979", "arrondis : 1872, 2020, 2352, 2829, 2979 (la fiche écrit 2830 et 2978)");
const pa = 900, dens = pa + 120 * (21 - Math.round(15 - 2 * pa / 1000));
check("altitude densité, exemple p. 5-5 (900 ft, +21 °C)", Math.abs(dens - 1800) <= 100, "formule de la fiche " + dens + " ft, lecture AFM 1800 ft (écart de lecture du graphique ; les graphiques de distance utilisent PA et OAT, pas l'altitude densité)");

console.log("\n" + (fails ? fails + " échec(s)" : "Tout est conforme."));
process.exit(fails ? 1 : 0);
