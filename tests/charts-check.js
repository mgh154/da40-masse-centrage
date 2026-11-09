/* Graphiques complémentaires : composantes de vent (AFM p. 5-8), PA/DA (p. 5-5), légendes de référence, agrandissement.
   Usage : node tests/charts-check.js */
"use strict";
const fs = require("fs"), path = require("path");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
let fails = 0;
function check(label, ok, detail){ console.log((ok ? "OK   " : "ÉCHEC") + "  " + label + (detail ? "  " + detail : "")); if (!ok) fails++; }

const i = html.indexOf("/* GRAPH+:début"), j = html.indexOf("/* GRAPH+:fin */");
const code = html.slice(i, j);
/* On isole les fonctions pures (sans DOM) : tout avant « Agrandissement » */
const pure = code.slice(0, code.indexOf("/* Agrandissement"));
const lib = new Function("fmt", "R", "afmOpen", pure + "\nreturn {daOf, windSvg, paSvg, refCap, addCharts};")((n, d) => Number(n).toFixed(d), Math.PI / 180, {});

console.log("1. Altitude densité");
check("DA(0 ft, 15 °C) = 0 (ISA)", lib.daOf(0, 15) === 0);
check("exemple AFM p. 5-5 : 900 ft, +21 °C ≈ 1800 ft (± 100)", Math.abs(lib.daOf(900, 21) - 1800) <= 100, lib.daOf(900, 21) + " ft");
check("calcCard utilise daOf (une seule formule)", /da = daOf\(pa, v\.temp\)/.test(html) && !/120 \* \(v\.temp/.test(html));

console.log("\n2. Composantes de vent");
const hw = 30 * Math.cos(32 * Math.PI / 180), cr = 30 * Math.sin(32 * Math.PI / 180);
const sv = lib.windSvg(hw, cr, 30, 32);
check("SVG construit, 32° / 30 kt : traversier 15,9 kt affiché", /<svg/.test(sv) && /trav\. 15\.9/.test(sv), "face " + hw.toFixed(1));
check("vent arrière indiqué comme tel", /arrière/.test(lib.windSvg(-5, 5, 7, 135)));
check("vent hors cadre (> 40 kt) : message, pas de point faux", /hors du cadre/.test(lib.windSvg(50, 10, 51, 10)));
check("ligne du traversier démontré (20 kt) présente, non présentée comme limitation", /démontré 20 kt/.test(sv) && /pas une limitation/.test(lib.addCharts({k: "to", title: "T"}, {wc: {known: true, hw: 10, cr: 5}, v: {ws: 12, wd: 30, rwy: 0, temp: null}, pa: null, da: null})));

console.log("\n3. PA / DA");
const ps = lib.paSvg(2000, 20, lib.daOf(2000, 20));
check("SVG construit avec le point PA/OAT/DA", /<svg/.test(ps) && /DA 3[0-9]{3} ft/.test(ps), (ps.match(/DA \d+ ft/) || [""])[0]);
check("point hors cadre : message", /hors du cadre/.test(lib.paSvg(2000, 70, 9000)));

console.log("\n4. Références et agrandissement");
check("TODR : référence p. 5-12, unités et domaine", /p\. 5-12/.test(lib.refCap("to")) && /750–1 150 kg/.test(lib.refCap("to")) && /arrière ≤ 9,7 kt/.test(lib.refCap("to")));
check("LDR : référence p. 5-20, pas de vent arrière", /p\. 5-20/.test(lib.refCap("ld")) && /pas de vent arrière/.test(lib.refCap("ld")) && /850–1 150 kg/.test(lib.refCap("ld")));
check("bouton « Agrandir / zoom » sur chaque graphique", (code.match(/data-zoom=/g) || []).length >= 1 && /data-zoom="' \+ c\.k/.test(html));
check("fenêtre d'agrandissement : dialogue modal, Échap, boutons ≥ 44 px", /aria-modal/.test(code) && /Escape/.test(code) && /#afmz \.zbar button\{min-height:44px/.test(html));
check("le bloc ne touche ni AFM[ ni toDist/ldDist (formules inchangées)", !/toDist|ldDist|AFM\[|afm\(/.test(code));

console.log("\n" + (fails ? fails + " échec(s)" : "Tout est conforme."));
process.exit(fails ? 1 : 0);
