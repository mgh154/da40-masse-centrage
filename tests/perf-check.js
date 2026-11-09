/* Vérifie le verdict d'atterrissage : une marge brute positive n'est jamais une validation opérationnelle.
   Usage : node tests/perf-check.js */
"use strict";
const fs = require("fs"), path = require("path");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const i = html.indexOf("/* LAND:début"), j = html.indexOf("/* LAND:fin */");
const landVerdict = new Function(html.slice(i, j) + "\nreturn landVerdict;")();

let fails = 0;
function check(label, ok, detail){ console.log((ok ? "OK   " : "ÉCHEC") + "  " + label + (detail ? "  " + detail : "")); if (!ok) fails++; }
const NOW = Date.UTC(2026, 10, 9, 12, 0), MIN = 6e4;
const man = (o) => ({auto: false, now: NOW, man: Object.assign({any: true, src: "Tour de Namur", obs: NOW - 20 * MIN, ver: "1", complete: true}, o)});
const good = {ldr: 500, lda: 1000, op: {val: 1.5, unit: "x", ok: true}, wx: {auto: true, man: {any: false}, now: NOW}, rcond: "ref", grass: false, prov: false};
const v = (o) => landVerdict(Object.assign({}, good, o));

console.log("1. Marge négative");
check("LDR > LDA : INSUFFISANT", v({ldr: 700, lda: 690}).status === "bad");
check("marge opérationnelle exigée non respectée : INSUFFISANT", (r => r.status === "bad" && r.opMargin < 0)(v({ldr: 680, lda: 800, op: {val: 1.5, unit: "x", ok: true}})));

console.log("\n2. Marge brute positive sans critère opérationnel validé");
const nam = {ldr: 680, lda: 690, op: {val: null, unit: "x", ok: false}};
check("Namur 680 / 690, aucune marge définie : À VÉRIFIER (pas SUFFISANT)", (r => r.status === "check" && r.gross === 10)(v(nam)));
check("marge brute de 10 m affichée séparément", v(nam).gross === 10 && v(nam).opMargin === null);
check("marge saisie mais non validée : À VÉRIFIER", v({op: {val: 1.2, unit: "x", ok: false}}).status === "check");
check("coefficient < 1 refusé : marge non définie", v({op: {val: 0.5, unit: "x", ok: true}}).status === "check");
check("aucun coefficient arbitraire : sans marge, jamais favorable, même avec 5000 m de marge brute", v({ldr: 300, lda: 5000, op: {val: null, unit: "x", ok: false}}).status === "check");

console.log("\n3. Conditions de calcul non remplies, marge validée");
check("météo absente (ni METAR ni saisie) : À VÉRIFIER", v({wx: {auto: false, man: {any: false}, now: NOW}}).status === "check");
check("piste en herbe : À VÉRIFIER", v({grass: true}).status === "check");
check("piste mouillée / autre état : À VÉRIFIER", v({rcond: "other"}).status === "check");
check("état de piste non précisé : À VÉRIFIER", v({rcond: ""}).status === "check");
check("données provisoires : À VÉRIFIER", v({prov: true}).status === "check");

console.log("\n3b.Météo saisie à la main (aérodrome sans METAR)");
check("saisie complète + source + heure + vérification explicite : acceptée", v({wx: man({})}).status === "ok");
check("sans vérification explicite : À VÉRIFIER", v({wx: man({ver: ""})}).status === "check");
check("sans source : À VÉRIFIER", v({wx: man({src: ""})}).status === "check");
check("sans heure d'observation : À VÉRIFIER", v({wx: man({obs: null})}).status === "check");
check("observation de plus de 2 h : À VÉRIFIER", v({wx: man({obs: NOW - 121 * MIN})}).status === "check");
check("observation dans le futur : À VÉRIFIER", v({wx: man({obs: NOW + 30 * MIN})}).status === "check");
check("données incomplètes (vent/QNH/température) : À VÉRIFIER", v({wx: man({complete: false})}).status === "check");
check("saisie seule (rien d'autre) : jamais favorable", v({wx: man({src: "", obs: null, complete: false})}).status === "check");
check("météo manuelle vérifiée mais marge opérationnelle non validée : À VÉRIFIER", v({wx: man({}), op: {val: 1.5, unit: "x", ok: false}}).status === "check");
check("météo manuelle vérifiée mais piste herbe : À VÉRIFIER", v({wx: man({}), grass: true}).status === "check");
check("météo manuelle vérifiée mais piste mouillée : À VÉRIFIER", v({wx: man({}), rcond: "other"}).status === "check");
check("météo manuelle vérifiée mais marge insuffisante : INSUFFISANT", v({wx: man({}), ldr: 680, lda: 690, op: {val: 1.5, unit: "x", ok: true}}).status === "bad");
check("« marge validée » seule ne contourne rien (ni météo ni état de piste) : À VÉRIFIER", v({wx: {auto: false, man: {any: false}, now: NOW}, rcond: ""}).status === "check");

console.log("\n4. Marge opérationnelle validée et toutes conditions remplies");
check("coefficient validé respecté : favorable", v({}).status === "ok");
check("marge en mètres validée respectée : favorable", v({ldr: 680, lda: 800, op: {val: 100, unit: "m", ok: true}}).status === "ok");
check("marge en mètres validée non respectée : INSUFFISANT", v({ldr: 680, lda: 750, op: {val: 100, unit: "m", ok: true}}).status === "bad");

console.log("\n4b. Deux marges distinctes (essai Namur : LDR 500, LDA 690, × 1,2)");
const t12 = v({ldr: 500, lda: 690, op: {val: 1.2, unit: "x", ok: true}});
check("marge brute +190 m", t12.gross === 190);
check("distance requise corrigée 600 m", t12.need === 600);
check("marge restante après coefficient +90 m, distincte de la marge brute", t12.opMargin === 90 && t12.opMargin !== t12.gross);
check("sans coefficient : aucune distance corrigée ni marge restante (rien n'est imposé)", (r => r.need === null && r.opMargin === null && r.gross === 190)(v({ldr: 500, lda: 690, op: {val: null, unit: "x", ok: false}})));

console.log("\n5. Données absentes");
check("LDR absente : incomplet", v({ldr: null}).status === "na");
check("LDA absente : incomplet", v({lda: null}).status === "na");

console.log("\n6. Les formules AFM ne sont pas dans ce bloc");
check("aucune référence aux graphiques AFM dans le verdict", !/toDist|ldDist|AFM\[|afm\(/.test(html.slice(i, j)));

console.log("\n" + (fails ? fails + " échec(s)" : "Tout est conforme."));
process.exit(fails ? 1 : 0);
