/* Garde-fous du scénario alternatif et de la météo régionale (contrôle du code source) + intégrité de la ligne AFM.
   Usage : node tests/guard-check.js */
"use strict";
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
let fails = 0;
function check(label, ok, detail){ console.log((ok ? "OK   " : "ÉCHEC") + "  " + label + (detail ? "  " + detail : "")); if (!ok) fails++; }
function body(name){
  const a = html.indexOf("function " + name + "(");
  if (a < 0) return "";
  const m = /\r?\n  function /g; m.lastIndex = a + 10;
  const r = m.exec(html), b = r ? r.index : -1;
  return html.slice(a, b < 0 ? a + 4000 : b);
}
const alt = body("altRwys") + body("altHtml");
const reg = body("regStations") + body("regLoad") + body("regEst") + body("regHtml") + body("metarVals");
const regAll = reg;

console.log("1. Scénario alternatif : la piste choisie n'est jamais changée automatiquement");
check("fonctions trouvées", alt.length > 200);
check("altRwys / altHtml n'appellent ni selectRwy ni n'écrivent dans un champ", !/selectRwy|\.value\s*=(?!=)|setField/.test(alt));
const calls = (html.match(/selectRwy\(/g) || []).length;
check("selectRwy n'est appelé que par un clic (bouton piste ou bouton « Utiliser la piste »)", calls === 4, calls + " occurrence(s) : définition, présélection du dégagement par défaut (Namur 06R, demandée), clic sur une piste, clic sur « Utiliser la piste »");

console.log("\n2. Météo régionale : jamais une observation locale, jamais favorable");
check("fonctions trouvées", reg.length > 500);
check("aucun appel au verdict d'atterrissage", !/landVerdict|status\s*[:=]\s*["']ok["']/.test(regAll));
check("aucune écriture dans les champs de la carte", !/\.value\s*=(?!=)/.test(regAll));
check("libellé « PAS UNE OBSERVATION DE » présent", /PAS UNE OBSERVATION DE/.test(html));
check("libellé « ESTIMATION RÉGIONALE (non validée) » présent", /ESTIMATION RÉGIONALE \(non validée\)/.test(html));
check("origine, distance, heure UTC et source affichées", /Origine :/.test(html) && /UTC/.test(regAll) && /source :/.test(regAll));
check("fraîcheur limitée (≤ 120 min) et rayon borné", /REG_MAX_KM\s*=\s*\d+/.test(html) && /WX_STALE_MIN/.test(regAll));

console.log("\n2b. Valeurs par défaut à la première ouverture");
check("départ et arrivée EBCI présélectionnés une seule fois, sans écraser une saisie", /dfltDone/.test(html) && /selectAd\("d", "EBCI"\)/.test(html) && /selectAd\("a", "EBCI"\)/.test(html) && /!cur\.d && \$\(pid\("d", "ad"\)\)\.value\.trim\(\) === ""/.test(html));
check("dégagement par défaut : Namur 06R (asphalte)", /DEF_ALT = \{EBCI: \{icao: "EBNM", rwy: "06R"\}\}/.test(html));

check("la sauvegarde locale couvre les champs de saisie de l'onglet Performance (QNH, vent, température)", /var scope = "#panel-performance input, #panel-performance select, #panel-performance textarea/.test(html));

console.log("\n3. Cache IEM");
check("fetchIemC mémorise la promesse et oublie les échecs", /iemC\[icao\]\s*=\s*\{/.test(html) && /delete iemC\[icao\]/.test(html));

console.log("\n4. Ligne de données AFM intacte (empreinte du dépôt au dernier commit publié)");
const afmLine = html.match(/var AFM = \{.*?\}\};\r?\n/s)[0].replace(/\r/g, "");
const h = crypto.createHash("sha256").update(afmLine).digest("hex");
const ref = path.join(__dirname, "afm-data.sha256");
if (!fs.existsSync(ref)) { fs.writeFileSync(ref, h + "\n"); console.log("  (empreinte de référence créée : " + h.slice(0, 12) + "…)"); }
check("empreinte SHA-256 identique à la référence", fs.readFileSync(ref, "utf8").trim() === h, h.slice(0, 12) + "…");

console.log("\n" + (fails ? fails + " échec(s)" : "Tout est conforme."));
process.exit(fails ? 1 : 0);
