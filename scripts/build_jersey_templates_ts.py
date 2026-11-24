import os
import json

base_dir = r"src/Design Jersey templates/Texture Pattern"
preview_dir = r"public/cdr_previews_clean"
folders = ['001 - 100', '101 - 200', '201 - 300', '301 - 400', '401 - 500', '501 - 600', '601 -', 'Special texture']

templates = []

presets = [
    {
        'id': 'design-01',
        'name': 'Design 01 - Topography Gold',
        'folder': '001 - 100',
        'category': 'Modern Abstract',
        'thumbnailUrl': '/mockups/templates/design-01_thumb.png?v=natural_sleeve_v7',
        'textureUrl': '/mockups/templates/design-01_full.png?v=natural_sleeve_v7',
        'description': 'Motif kontur topografi emas mewah, bersih polosan.',
        'defaultCollarColor': '#1a1a1a',
        'defaultPlayerColor': '#111827',
        'defaultNumberColor': '#111827'
    },
    {
        'id': 'design-02',
        'name': 'Design 02 - Sage Modern Art',
        'folder': '001 - 100',
        'category': 'Abstract & Style',
        'thumbnailUrl': '/mockups/templates/design-02_thumb.png?v=natural_sleeve_v7',
        'textureUrl': '/mockups/templates/design-02_full.png?v=natural_sleeve_v7',
        'description': 'Tekstur artistik nuansa sage & olive elegan, bersih polosan.',
        'defaultCollarColor': '#2d3748',
        'defaultPlayerColor': '#111827',
        'defaultNumberColor': '#111827'
    },
    {
        'id': 'design-03',
        'name': 'Design 03 - Crimson Speed Dynamic',
        'folder': '001 - 100',
        'category': 'Sport & Racing',
        'thumbnailUrl': '/mockups/templates/design-03_thumb.png?v=natural_sleeve_v7',
        'textureUrl': '/mockups/templates/design-03_full.png?v=natural_sleeve_v7',
        'description': 'Corak dinamis gradasi merah crimson & putih sporty.',
        'defaultCollarColor': '#1a202c',
        'defaultPlayerColor': '#111827',
        'defaultNumberColor': '#111827'
    },
    {
        'id': 'design-04',
        'name': 'Design 04 - Scarlet Geometric',
        'folder': '001 - 100',
        'category': 'Geometris',
        'thumbnailUrl': '/mockups/templates/design-04_thumb.png?v=natural_sleeve_v7',
        'textureUrl': '/mockups/templates/design-04_full.png?v=natural_sleeve_v7',
        'description': 'Pola geometris merah membara modern, bersih polosan.',
        'defaultCollarColor': '#111827',
        'defaultPlayerColor': '#111827',
        'defaultNumberColor': '#111827'
    },
    {
        'id': 'design-05',
        'name': 'Design 05 - Electric Cyan Wave',
        'folder': '001 - 100',
        'category': 'Dynamic Sport',
        'thumbnailUrl': '/mockups/templates/design-05_thumb.png?v=natural_sleeve_v7',
        'textureUrl': '/mockups/templates/design-05_full.png?v=natural_sleeve_v7',
        'description': 'Motif gelombang biru cyan elektrik energik.',
        'defaultCollarColor': '#0f172a',
        'defaultPlayerColor': '#111827',
        'defaultNumberColor': '#111827'
    }
]

added_ids = set(['design 001.cdr', 'design 002.cdr', 'design 003.cdr', 'design 004.cdr', 'design 005.cdr'])

for p in presets:
    templates.append(p)

for fld in folders:
    p = os.path.join(base_dir, fld)
    if not os.path.exists(p):
        continue
    files = sorted([f for f in os.listdir(p) if f.lower().endswith('.cdr') and not f.startswith('Backup_of_')])
    for f in files:
        if f.lower() in added_ids:
            continue
        thumb_name = f.replace('.cdr', '.png')
        thumb_path = os.path.join(preview_dir, thumb_name)
        if os.path.exists(thumb_path):
            clean_title = f.replace('.cdr', '')
            safe_id = 'tmpl-' + clean_title.lower().replace(' ', '-').replace('_', '-')
            templates.append({
                'id': safe_id,
                'name': clean_title,
                'folder': fld,
                'category': fld,
                'thumbnailUrl': f'/cdr_previews_clean/{thumb_name}',
                'textureUrl': f'/cdr_previews_clean/{thumb_name}',
                'description': f'Tekstur bersih autentik CorelDRAW ({fld}).',
                'defaultCollarColor': '#1a1a1a',
                'defaultPlayerColor': '#111827',
                'defaultNumberColor': '#111827'
            })

print(f"Total templates to write: {len(templates)}")

with open('src/data/jerseyTemplates.ts', 'w', encoding='utf-8') as out_f:
    out_f.write('export interface JerseyTemplateItem {\n')
    out_f.write('  id: string;\n')
    out_f.write('  name: string;\n')
    out_f.write('  folder: string;\n')
    out_f.write('  category?: string;\n')
    out_f.write('  thumbnailUrl: string;\n')
    out_f.write('  textureUrl: string;\n')
    out_f.write('  description?: string;\n')
    out_f.write('  defaultCollarColor?: string;\n')
    out_f.write('  defaultPlayerColor?: string;\n')
    out_f.write('  defaultNumberColor?: string;\n')
    out_f.write('}\n\n')

    out_f.write('export const JERSEY_FOLDERS = [\n')
    out_f.write('  "Semua",\n')
    for fld in folders:
        out_f.write(f'  "{fld}",\n')
    out_f.write('] as const;\n\n')

    out_f.write('export const JERSEY_TEMPLATES: JerseyTemplateItem[] = ')
    out_f.write(json.dumps(templates, indent=2, ensure_ascii=False))
    out_f.write(';\n')

print("Successfully written src/data/jerseyTemplates.ts!")

