/* Majorations indicatives de l'AFM (herbe, pente) : valeurs exactes de l'AFM, jamais intégrées au résultat ni au verdict.
   Usage : node tests/corr-check.js */
"use strict";
const fs = require("fs"), path = require("path");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
let fails = 0;
function check(label, ok, detail){ console.log((ok ? "OK   " : "ÉCHEC") + "  " + label + (detail ? "  " + detail : "")); if (!ok) fails++; }
const i = html.indexOf("/* CORR:début"), j = html.indexOf("  function corrHtml(");
const L = new Function(html.slice(i, j) + "\nreturn {GRASS, SLOPE_PCT, surfCorr};")();
const t = (k, g, s, v) => L.surfCorr(k, g, s, v);

console.log("1. Valeurs de l'AFM (p. 5-10, 5-19, 5-23)");
check("herbe décollage : 10 / 15 / ≥ 25 %", L.GRASS.g1.to === 10 && L.GRASS.g2.to === 15 && L.GRASS.g3.to === 25 && L.GRASS.g3.atLeast);
check("herbe atterrissage : 5 / 15 / ≥ 25 %", L.GRASS.g1.ld === 5 && L.GRASS.g2.ld === 15 && L.GRASS.g3.ld === 25);
check("pente de 2 % : environ +10 %", L.SLOPE_PCT === 10);

console.log("\n2. Calculs");
check("rien choisi : aucune ligne", t("to", "", "", 500).length === 0);
check("distance absente : aucune ligne", t("to", "g1", "ap", NaN).length === 0 && t("to", "g1", "ap", null).length === 0);
const g = t("to", "g1", "", 500)[0];
check("herbe ≤ 5 cm, TODR 500 m : majorant 550 m (500 × 1,10)", g.max === 550 && /\+10 %/.test(g.t) && /majorant/.test(g.t));
check("atterrissage herbe ≤ 5 cm : +5 % → 530 m pour 500 m (arrondi 10 m supérieur)", t("ld", "g1", "", 500)[0].max === 530);
check("herbe 5–10 cm : +15 %", t("ld", "g2", "", 400)[0].max === 460);
const g3 = t("to", "g3", "", 500)[0];
check("herbe > 10 cm : « au moins », aucune distance chiffrée (pas de maximum dans l'AFM)", g3.max === undefined && /au moins \+25 %/.test(g3.t) && /aucune distance chiffrée/.test(g3.t));
const s = t("to", "", "ap", 500)[0];
check("pente 2 % : environ +10 % → 550 m, présenté comme approximatif", s.approx === 550 && /environ/.test(s.t) && /plus grand/.test(s.t));
check("autre pente : aucune correction calculée, pas d'extrapolation", (r => r.approx === undefined && /Aucune correction calculée|aucune correction calculée/.test(r.t))(t("ld", "", "other", 500)[0]));
const both = t("to", "g1", "ap", 500);
check("herbe + pente : aucun total cumulé", both.length === 3 && both[2].k === "both" && /aucun total/.test(both[2].t) && both.every(x => x.max === undefined || x.k === "grass"));
check("libellés montante (décollage) / descendante (atterrissage)", /montante/.test(t("to", "", "ap", 500)[0].t) && /descendante/.test(t("ld", "", "ap", 500)[0].t));

console.log("\n3. Jamais intégré au résultat");
function body(name){ const a = html.indexOf("function " + name + "("); const m = /\r?\n  function /g; m.lastIndex = a + 10; const r = m.exec(html); return html.slice(a, r ? r.index : a + 6000); }
const lv = html.slice(html.indexOf("/* LAND:début"), html.indexOf("/* LAND:fin */"));
check("le verdict d'atterrissage ne connaît pas les majorations", !/surfCorr|GRASS|SLOPE_PCT|corrHtml/.test(lv));
check("calcCard ne les utilise pas", !/surfCorr|GRASS|corrHtml/.test(body("calcCard")) && !/surfCorr|corrHtml/.test(body("cardStatus")));
check("elles sont affichées seulement via corrHtml, étiquetées indicatives et non validées", /INDICATIVES, NON VALIDÉES/.test(html) && /corrHtml\(c, r\) \+ afmExtra/.test(html));
check("piste mouillée / contaminée : aucun chiffre, avertissement", /aucun chiffre/.test(html));
check("les formules AFM ne sont pas dans ce bloc", !/toDist|ldDist|AFM\[|afm\(/.test(html.slice(i, j)));

console.log("\n" + (fails ? fails + " échec(s)" : "Tout est conforme."));
process.exit(fails ? 1 : 0);
