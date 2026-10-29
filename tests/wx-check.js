/* Vérifie le choix de l'observation METAR (sources, fraîcheur, délais d'appel). Usage : node tests/wx-check.js */
"use strict";
const fs = require("fs"), path = require("path");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const i = html.indexOf("/* WX:début"), j = html.indexOf("/* WX:fin */");
const L = new Function(html.slice(i, j) + "\nreturn {parseIem, bestWx, wxAgeAt, wxCheckAllowed, wxShouldApply, WX_AUTO_MIN, WX_COOL_S};")();
let fails = 0;
const check = (label, ok, d) => { console.log((ok ? "OK   " : "ÉCHEC") + "  " + label + (d ? "  " + d : "")); if (!ok) fails++; };
const U = (s) => Date.parse(s) / 1000;

console.log("1. Lecture de la source directe (IEM)");
const csv = "station,valid,metar\nEBCI,2026-10-28 23:50,EBCI 282350Z 20004KT 9000 BKN025 09/07 Q1029 NOSIG\nEBCI,2026-10-29 00:20,EBCI 290020Z 20004KT 9000 BKN025 08/06 Q1029 NOSIG\nEBCI,2026-10-29 00:50,EBCI 290050Z 19003KT 9000 BKN025 08/07 Q1029 NOSIG\n";
const r = L.parseIem(csv);
check("la plus récente observation est choisie", r && r.raw.indexOf("290050Z") > 0 && r.obs === U("2026-10-29T00:50:00Z"));
check("réponse vide : aucune observation", L.parseIem("station,valid,metar\n") === null);
check("lignes sans METAR ignorées", L.parseIem("station,valid,metar\nEBCI,2026-10-29 00:20,\n") === null);
check("réponse d'erreur illisible : aucune observation", L.parseIem("Invalid times provided.") === null);

console.log("\n2. Choix entre le relais GitHub (awc) et la source directe (iem)");
const awcOld = {src: "awc", raw: "METAR EBCI 282320Z ...", obs: U("2026-10-28T23:20:00Z")}, iemNew = {src: "iem", raw: "EBCI 290050Z ...", obs: U("2026-10-29T00:50:00Z")};
check("l'observation la plus récente l'emporte, même si le relais est en retard", L.bestWx([awcOld, iemNew]).src === "iem");
check("à égalité, AviationWeather.gov est préféré", L.bestWx([{src: "iem", raw: "a", obs: 100}, {src: "awc", raw: "b", obs: 100}]).src === "awc");
check("un seul candidat : il est utilisé", L.bestWx([null, awcOld]).src === "awc");
check("aucun candidat : rien", L.bestWx([null, undefined]) === null);

console.log("\n3. Âge réel : calculé depuis l'observation, jamais depuis le téléchargement");
const now = Date.parse("2026-10-29T02:00:00Z");
check("observation de 00:50 vue à 02:00 : 70 min", L.wxAgeAt(U("2026-10-29T00:50:00Z"), now) === 70);
check("un METAR de la veille reste « ancien » même s'il vient d'être téléchargé", L.wxAgeAt(U("2026-10-28T23:20:00Z"), now) === 160);

console.log("\n4. Remplacement du METAR affiché");
const cur = {obs: U("2026-10-29T00:20:00Z")};
check("observation plus récente : remplacement", L.wxShouldApply(cur, iemNew, true, false));
check("observation plus ancienne : le METAR affiché est conservé", !L.wxShouldApply({obs: U("2026-10-29T01:20:00Z")}, iemNew, true, false));
check("même observation : pas de remplacement", !L.wxShouldApply({obs: iemNew.obs}, iemNew, true, false));
check("rien d'affiché : remplissage", L.wxShouldApply({}, iemNew, false, false));
check("aucune source : rien ne change", !L.wxShouldApply(cur, null, true, true));
check("METAR saisi à la main : pas de remplacement automatique", !L.wxShouldApply({manual: true}, iemNew, true, false));
check("METAR saisi à la main : remplacé sur demande (bouton)", L.wxShouldApply({manual: true}, iemNew, true, true));

console.log("\n5. Fréquence d'appel aux fournisseurs");
const t0 = 1e12;
check("jamais vérifié : autorisé", L.wxCheckAllowed(undefined, t0, false) === "ok");
check("vérifié il y a 10 s : pause (même à la demande)", L.wxCheckAllowed({tried: t0 - 10e3}, t0, true) === "cool");
check("vérifié il y a 2 min : contrôle automatique refusé", L.wxCheckAllowed({tried: t0 - 120e3}, t0, false) === "recent");
check("vérifié il y a 2 min : bouton ou ouverture autorisés", L.wxCheckAllowed({tried: t0 - 120e3}, t0, true) === "ok");
check("vérifié il y a 6 min : contrôle automatique autorisé", L.wxCheckAllowed({tried: t0 - 360e3}, t0, false) === "ok");

console.log("\n" + (fails ? fails + " échec(s)" : "Tout est conforme."));
process.exit(fails ? 1 : 0);
