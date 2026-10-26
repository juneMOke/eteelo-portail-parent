"""Génère les icônes et le manifeste du portail pour chaque environnement (prod, staging, dev).

Visuels sources dans branding/source/<env>/, recopiés de l'app mobile
(school_app_flutter/assets/app-icon, variantes de scripts/generate_flavor_icons.py) :
  - appstore_1024.png : icône pleine, logo en grand (favicon, iPhone, icône « any ») ;
  - ic_launcher_foreground.png : logo sur fond transparent dans la zone sûre (icônes « maskable »).
Le manifeste source porte les valeurs de prod ; staging et dev suffixent son nom.

Sortie dans branding/<env>/, servie à la racine du portail : le build sert prod,
ng serve sert dev (angular.json), le conteneur recopie celle de PORTAL_ENV au démarrage.

Usage (Pillow requis) : python3 scripts/generate-icons.py
"""
import json
import sys
from pathlib import Path
from PIL import Image

root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent
branding = root / "branding"
source = branding / "source"
ENVS = {
    # Fonds des icônes adaptatives de l'app mobile (flutter_launcher_icons-<flavor>.yaml).
    "prod": {"bg": "#0E2D42", "name": "", "short_name": ""},
    "staging": {"bg": "#9A4A21", "name": " Staging", "short_name": " STG"},
    "dev": {"bg": "#3D6B4A", "name": " Dev", "short_name": " DEV"},
}

def save_png(img, path):
    # Aplat de couleurs : la palette 256 couleurs divise le poids par trois sans perte visible.
    img.convert("RGB").quantize(256, method=Image.Quantize.MEDIANCUT).save(path, optimize=True)

def maskable(fg, bg, size):
    """Fond uni + logo du premier plan adaptatif : le logo tient dans la zone sûre (cercle de 80 %)."""
    img = Image.new("RGBA", fg.size, bg)
    img.alpha_composite(fg)
    return img.resize((size, size), Image.LANCZOS)

manifest = json.loads((source / "manifest.webmanifest").read_text(encoding="utf-8"))

for env, spec in ENVS.items():
    out = branding / env
    (out / "icons").mkdir(parents=True, exist_ok=True)
    full = Image.open(source / env / "appstore_1024.png").convert("RGBA")
    fg = Image.open(source / env / "ic_launcher_foreground.png").convert("RGBA")

    for size in (192, 512):
        save_png(full.resize((size, size), Image.LANCZOS), out / "icons" / f"icon-{size}.png")
        save_png(maskable(fg, spec["bg"], size), out / "icons" / f"icon-maskable-{size}.png")
    # iPhone : icône opaque, iOS arrondit lui-même les coins.
    save_png(full.resize((180, 180), Image.LANCZOS), out / "icons" / "apple-touch-icon.png")
    full.convert("RGB").save(out / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])

    env_manifest = dict(manifest)
    env_manifest["name"] = manifest["name"] + spec["name"]
    env_manifest["short_name"] = manifest["short_name"] + spec["short_name"]
    (out / "manifest.webmanifest").write_text(
        json.dumps(env_manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(env, "ok")
