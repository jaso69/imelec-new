"""Genera css/icons.css: iconos de Font Awesome Free como máscaras CSS (sin fuentes ni CDN).

Uso (tras npm install): npm run build:icons
Vuelve a ejecutarlo si se añade un icono <i class="fas fa-..."> nuevo en los HTML o JS.
"""
import re, glob
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent.parent
SVGS = ROOT / 'node_modules/@fortawesome/fontawesome-free/svgs'

# Nombres antiguos (FA5) usados en el HTML -> nombre del fichero en FA6
ALIAS = {
    'map-marker-alt': 'location-dot', 'check-circle': 'circle-check', 'tools': 'screwdriver-wrench',
    'times': 'xmark', 'exclamation-triangle': 'triangle-exclamation',
}

used = set()
for f in list(ROOT.glob('*.html')) + list(ROOT.glob('js/*.js')):
    for m in re.finditer(r'<i class="(fas|fab|far) ([^"]*)"', f.read_text(encoding='utf-8')):
        style = m.group(1)
        for cls in m.group(2).split():
            if cls.startswith('fa-'):
                used.add((style, cls[3:]))

rules = []
for style, name in sorted(used, key=lambda x: x[1]):
    folder = {'fas': 'solid', 'fab': 'brands', 'far': 'regular'}[style]
    path = SVGS / folder / f'{ALIAS.get(name, name)}.svg'
    svg = path.read_text(encoding='utf-8')
    svg = re.sub(r'<!--.*?-->', '', svg, flags=re.S).strip()
    w, h = map(float, re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', svg).groups())
    data = quote(svg.replace('"', "'"), safe=" =:/'.,-")
    rules.append(f'.fa-{name}{{--fa-icon:url("data:image/svg+xml,{data}");width:{w / h:.4g}em}}')

css = f'''/* Iconos: Font Awesome Free 6 (https://fontawesome.com), licencia CC BY 4.0.
   Generado a partir de node_modules/@fortawesome/fontawesome-free/svgs.
   Se mantiene el marcado <i class="fas fa-..."> y cada icono se pinta con una máscara
   del color del texto, sin cargar la fuente ni el CSS completo desde un CDN. */
.fas,.fab,.far{{display:inline-block;height:1em;width:1em;vertical-align:-.125em;background-color:currentColor;-webkit-mask:var(--fa-icon) no-repeat center/contain;mask:var(--fa-icon) no-repeat center/contain;font-style:normal}}
{chr(10).join(rules)}
'''
(ROOT / 'css/icons.css').write_text(css, encoding='utf-8')
print(len(used), 'iconos,', len(css), 'bytes')
