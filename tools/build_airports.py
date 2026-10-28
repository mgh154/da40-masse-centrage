"""Construit airports.json (aérodromes européens et pistes) à partir d'OurAirports (domaine public).

Usage : python tools/build_airports.py [dossier_des_csv]
Sans argument, les CSV sont téléchargés depuis https://davidmegginson.github.io/ourairports-data/
Aucune valeur n'est déduite : un champ absent de la source reste null.
"""
import csv, io, json, re, sys, urllib.request
from datetime import datetime, timezone
from pathlib import Path

BASE = "https://davidmegginson.github.io/ourairports-data/"
KEEP = {"large_airport", "medium_airport", "small_airport"}


def rows(name, folder):
    if folder:
        text = (Path(folder) / name).read_text(encoding="utf-8")
    else:
        text = urllib.request.urlopen(BASE + name, timeout=60).read().decode("utf-8")
    return csv.DictReader(io.StringIO(text))


def num(v, nd=None):
    try:
        x = float(v)
    except (TypeError, ValueError):
        return None
    return round(x, nd) if nd is not None else x


def main():
    folder = sys.argv[1] if len(sys.argv) > 1 else None
    airports = {}
    for r in rows("airports.csv", folder):
        if r["continent"] != "EU" or r["type"] not in KEEP:
            continue
        code = r["gps_code"] or r["ident"]
        if not re.fullmatch(r"[A-Z]{4}", code or ""):
            continue
        elev = num(r["elevation_ft"])
        airports[r["ident"]] = [code, r["name"], r["municipality"], None if elev is None else round(elev), []]
    out = {}
    for r in rows("runways.csv", folder):
        a = airports.get(r["airport_ident"])
        if not a or r["closed"] == "1":
            continue
        length_ft = num(r["length_ft"])
        a[4].append([
            r["le_ident"], num(r["le_heading_degT"], 0), r["he_ident"], num(r["he_heading_degT"], 0),
            None if length_ft is None else round(length_ft * 0.3048), r["surface"],
        ])
    for a in airports.values():
        out[a[0]] = a[1:]
    data = {"source": "OurAirports (domaine public)", "built": datetime.now(timezone.utc).strftime("%Y-%m-%d"), "a": out}
    Path("airports.json").write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(len(out), "aérodromes,", sum(len(v[3]) for v in out.values()), "pistes")


main()
