/* Registre AFM et fiche avion : une version non prise en charge ne tombe jamais sur les graphiques DA 40 D.
   Usage : node tests/aircraft-check.js */
"use strict";
const fs = require("fs"), path = require("path");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
let fails = 0;
function check(label, ok, detail){ console.log((ok ? "OK   " : "ÉCHEC") + "  " + label + (detail ? "  " + detail : "")); if (!ok) fails++; }

const i = html.indexOf("var AFM_REG"), j = html.indexOf("  function acpApply");
const store = {};
const localStorage = {getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }};
const lib = new Function("localStorage", html.slice(i, j) + "\nreturn {AFM_REG, acp, acGate};")(localStorage);
const setProf = (r, o) => { store["da40-acp-v1"] = JSON.stringify({[r]: o}); };

console.log("1. Registre");
check("une seule version enregistrée : DA 40 D", Object.keys(lib.AFM_REG).join() === "DA40D");
check("moteurs couverts : TAE 125-01 et TAE 125-02-99", lib.AFM_REG.DA40D.engines.join() === "TAE 125-01,TAE 125-02-99");
check("enveloppe DA 40 D : 1150 kg, 780 kg, 2,59 m", (e => e.MTOM === 1150 && e.MMIN === 780 && e.AFT === 2.59)(lib.AFM_REG.DA40D.env));

console.log("\n2. Les huit avions enregistrés sont conservés");
const AC = html.match(/var AC = \{[\s\S]*?\n  \};/)[0];
const regs = AC.match(/"F-[A-Z]{4}":/g) || [];
check("8 immatriculations", regs.length === 8, regs.join(" "));

console.log("\n3. Fiche par défaut : jamais devinée");
delete store["da40-acp-v1"];
let g = lib.acGate("F-GUPL");
check("version par défaut DA 40 D, moteur et suppléments à préciser", g.p.ver === "DA40D" && g.p.eng === "" && g.p.supp === "");
check("par défaut : les graphiques DA 40 D valent pour les avions du site, sans fiche à compléter", g.sup && g.complete && g.msg === "");

console.log("\n4. Version, moteur, suppléments");
setProf("F-GUPL", {ver: "DA40D", eng: "TAE 125-02-99", supp: "none"});
g = lib.acGate("F-GUPL"); check("DA 40 D + TAE 125-02-99 + aucun supplément : complet", g.sup && g.complete && g.mb);
setProf("F-GUPL", {ver: "DA40D", eng: "TAE 125-01", supp: "noperf"});
g = lib.acGate("F-GUPL"); check("suppléments sans influence déclarés : complet", g.sup && g.complete);
setProf("F-GUPL", {ver: "DA40D", eng: "TAE 125-01", supp: "perf"});
g = lib.acGate("F-GUPL"); check("supplément influençant les performances : aucun calcul, M&C inchangée", !g.sup && g.mb && /Aucune distance/.test(g.msg));
setProf("F-GUPL", {ver: "DA40NG", eng: "TAE 125-01", supp: "none"});
g = lib.acGate("F-GUPL"); check("DA 40 NG : non pris en charge, pas de repli sur DA 40 D", !g.sup && !g.mb && g.reg === null && /non pris en charge/.test(g.msg));
setProf("F-GUPL", {ver: "DA40P", eng: "", supp: ""});
g = lib.acGate("F-GUPL"); check("DA 40 essence : non pris en charge", !g.sup && !g.mb);
setProf("F-GUPL", {ver: "other", eng: "", supp: ""});
g = lib.acGate("F-GUPL"); check("version inconnue : non pris en charge", !g.sup && !g.mb);
setProf("F-GUPL", {ver: "DA40D", eng: "other", supp: "none"});
g = lib.acGate("F-GUPL"); check("moteur non couvert : non pris en charge", !g.sup && !g.mb);
g = lib.acGate(""); check("aucun avion : refus", !g.sup && !g.mb);
setProf("F-GUPL", {ver: "DA40NG"});
g = lib.acGate("F-GUVM"); check("la fiche d'un avion n'affecte pas les autres", g.sup && g.p.ver === "DA40D");

console.log("\n5. Garde-fous dans le code");
const calls = html.split(/\r?\n/).filter(l => /[^.\w]afm\(/.test(l) && !/function afm\(|afm\(\) inchangée|afm\("ld", r\.pa/.test(l));
check("tous les appels à afm() (carte, estimation régionale) passent par le verrou", calls.length === 2 && calls.every(l => /\b(gate|gt)\.sup \? afm\(/.test(l)), calls.length + " appel(s) direct(s)");
const altBody = html.slice(html.indexOf("function altRwys("), html.indexOf("function altHtml("));
check("le scénario d'une autre piste est coupé si le verrou refuse (altRwys)", /acGate\(window\.__ac \|\| ""\)\.sup/.test(altBody) && /afm\("ld"/.test(altBody));
check("applicabilité AFM : seulement si l'avion est pris en charge (plus de confirmation manuelle)", /ok: !!\(ac && g\.sup && g\.complete\)/.test(html) && !/id="afmok"/.test(html));
check("l'enveloppe de masse dépend de la version (acpApply)", /MTOM = env\.MTOM/.test(html) && /acpApply\(state\.ac\)/.test(html));

console.log("\n" + (fails ? fails + " échec(s)" : "Tout est conforme."));
process.exit(fails ? 1 : 0);
