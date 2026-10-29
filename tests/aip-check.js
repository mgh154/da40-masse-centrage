/* Vérifie les règles de validité des données aéronautiques (priorité des sources, expiration, AIRAC)
   et le contenu de declared.json. Usage : node tests/aip-check.js */
"use strict";
const fs = require("fs"), path = require("path");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const i = html.indexOf("/* AIP:début"), j = html.indexOf("/* AIP:fin */");
const L = new Function(html.slice(i, j) + "\nreturn {airacOf, ymd, memValid, afmValid, declOk, declElevOf, declRwyOf, pickValue, AIP_VALID_DAYS};")();

let fails = 0;
function check(label, ok, detail){ console.log((ok ? "OK   " : "ÉCHEC") + "  " + label + (detail ? "  " + detail : "")); if (!ok) fails++; }
const D = 864e5, now = Date.UTC(2026, 9, 29), day = n => ymd(now - n * D), ymd = L.ymd;

console.log("1. Cycles AIRAC");
[["2025-01-23", "2501"], ["2025-12-25", "2513"], ["2026-01-22", "2601"], ["2026-10-01", "2610"], ["2026-10-28", "2610"], ["2026-10-29", "2611"]].forEach(([d, lab]) => {
  const a = L.airacOf(Date.parse(d));
  check("AIRAC en vigueur le " + d, a.label === lab, "calculé " + a.label + ", attendu " + lab);
});

console.log("\n2. Durée de validité d'une donnée vérifiée (" + L.AIP_VALID_DAYS + " jours)");
check("vérifiée il y a 84 jours : valable", L.memValid({date: day(84)}, now) === "ok");
check("vérifiée il y a 85 jours : expirée", L.memValid({date: day(85)}, now) === "exp");
check("date illisible : expirée", L.memValid({date: "hier"}, now) === "exp");
check("confirmation AFM : valable 1 an, même référence", L.afmValid({d: day(300), ref: "6.01.05-E rév. 7"}, now) && !L.afmValid({d: day(400), ref: "6.01.05-E rév. 7"}, now));
check("confirmation AFM d'une autre révision : refusée", !L.afmValid({d: day(1), ref: "6.01.05-E rév. 6"}, now));

console.log("\n3. Priorité des sources");
const pv = (s) => L.pickValue(s, now);
check("officielle valide > mémorisée > OurAirports", pv({decl: {v: 614, verified: day(10)}, mem: {v: 600, date: day(5), srcv: null}, ours: 620}).src === "ver");
check("mémorisée valide > OurAirports", (r => r.src === "mem" && r.v === 600)(pv({decl: null, mem: {v: 600, date: day(5), srcv: null}, ours: 620})));
check("OurAirports seul : provisoire", (r => r.src === "chk" && r.v === 620)(pv({decl: null, mem: null, ours: 620})));
check("rien : aucune valeur, jamais inventée", (r => r.v === null && r.src === null)(pv({decl: null, mem: null, ours: null})));
check("confirmation expirée, source seule : provisoire (la confirmation n'est pas conservée)", (r => r.src === "chk" && r.v === 620)(pv({decl: null, mem: {v: 620, date: day(200), srcv: 620}, ours: 620})));
check("confirmation expirée, sans autre source : EXPIRÉ", (r => r.src === "exp" && r.v === 600)(pv({decl: null, mem: {v: 600, date: day(200), srcv: null}, ours: null})));
check("la source a changé depuis la confirmation : confirmation ignorée", (r => r.src === "chk" && r.v === 630 && r.note === "stale")(pv({decl: null, mem: {v: 620, date: day(5), srcv: 620}, ours: 630})));
check("valeur saisie (sans source d'origine) : conservée même si OurAirports diffère", pv({decl: null, mem: {v: 600, date: day(5), srcv: null}, ours: 999}).src === "mem");
check("donnée officielle devenue ancienne : EXPIRÉE, pas validée", (r => r.src === "exp" && r.v === 614)(pv({decl: {v: 614, verified: day(100)}, mem: null, ours: null})));

console.log("\n4. Une donnée officielle sans source ou sans dates est ignorée");
const decl = {airports: {EBXX: {elev: {ft: 100, src: "AIP", effective: "2026-10-01", verified: "2026-10-20"}, runways: {
  "06": {src: "AIP", effective: "2026-10-01", verified: "2026-10-20", trueBearing: 66.1, toda: 3000, lda: 2900},
  "24": {src: "AIP", effective: "2026-10-01", toda: 3000, lda: 2900},
  "07": {toda: 1000}}}}};
check("élévation complète acceptée", L.declElevOf(decl, "EBXX") && L.declElevOf(decl, "EBXX").ft === 100);
check("piste complète acceptée", !!L.declRwyOf(decl, "EBXX", "06"));
check("piste sans date de vérification refusée", L.declRwyOf(decl, "EBXX", "24") === null);
check("piste sans source refusée", L.declRwyOf(decl, "EBXX", "07") === null);
check("aérodrome inconnu : rien", L.declElevOf(decl, "ZZZZ") === null && L.declRwyOf(decl, "ZZZZ", "06") === null);

console.log("\n5. declared.json du dépôt");
const file = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "declared.json"), "utf8"));
let n = 0, bad = [];
Object.keys(file.airports || {}).forEach(icao => {
  const a = file.airports[icao];
  if (!/^[A-Z]{4}$/.test(icao)) bad.push(icao + " : code OACI invalide");
  if (a.elev){ n++; if (!L.declOk(a.elev) || !(a.elev.ft > -100 && a.elev.ft < 15000)) bad.push(icao + " : élévation incomplète ou invraisemblable"); }
  Object.keys(a.runways || {}).forEach(id => {
    const r = a.runways[id]; n++;
    if (!L.declOk(r)) bad.push(icao + " " + id + " : source, date d'effet ou date de vérification manquante");
    if (r.trueBearing !== undefined && !(r.trueBearing >= 0 && r.trueBearing < 360)) bad.push(icao + " " + id + " : orientation hors de 0-360");
    ["tora", "toda", "asda", "lda"].forEach(f => { if (r[f] !== undefined && !(r[f] > 0 && r[f] < 6000)) bad.push(icao + " " + id + " : " + f + " invraisemblable"); });
    if (r.tora !== undefined && r.toda !== undefined && r.toda < r.tora) bad.push(icao + " " + id + " : TODA inférieure à la TORA");
    if (r.length !== undefined || r.physicalLength !== undefined) bad.push(icao + " " + id + " : une longueur physique n'a pas sa place ici");
  });
});
check("toutes les entrées de declared.json ont source, date d'effet et date de vérification", bad.length === 0, n + " donnée(s) officielle(s) enregistrée(s)" + (bad.length ? " : " + bad.join(" ; ") : ""));

console.log("\n" + (fails ? fails + " échec(s)" : "Tout est conforme."));
process.exit(fails ? 1 : 0);
