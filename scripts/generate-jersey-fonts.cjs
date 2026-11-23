const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.cwd(), 'src', 'Design Jersey templates', 'Font', 'TTF-OTF');
const destDir = path.join(process.cwd(), 'public', 'fonts', 'jersey');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const files = fs.readdirSync(srcDir).filter(f => {
  const ext = path.extname(f).toLowerCase();
  return ext === '.ttf' || ext === '.otf';
});

console.log('Total font files found:', files.length);

const fontList = [];
let cssRules = '/* Auto-generated Jersey Fonts CSS */\n\n';

files.forEach((file, index) => {
  const ext = path.extname(file).toLowerCase();
  const baseName = path.basename(file, path.extname(file));
  const safeFile = 'font_' + index.toString().padStart(3, '0') + '_' + file.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  let category = 'custom';
  const lower = file.toLowerCase();
  
  if (lower.includes('persib') || lower.includes('persija') || lower.includes('borneo') || lower.includes('psis')) {
    category = 'liga1';
  } else if (lower.includes('nba') || lower.includes('bulls') || lower.includes('celtics') || lower.includes('lakers') || lower.includes('heat') || lower.includes('knicks') || lower.includes('cavaliers') || lower.includes('clippers') || lower.includes('hornets') || lower.includes('jazz') || lower.includes('kings') || lower.includes('mavericks') || lower.includes('nets') || lower.includes('nuggets') || lower.includes('pacers') || lower.includes('pistons') || lower.includes('timberwolves') || lower.includes('wizards')) {
    category = 'nba';
  } else if (lower.includes('world cup') || lower.includes('wc20') || lower.includes('euro') || lower.includes('brasil') || lower.includes('brazil') || lower.includes('england') || lower.includes('france') || lower.includes('portugal') || lower.includes('holanda') || lower.includes('holland') || lower.includes('peru') || lower.includes('panama') || lower.includes('usa-') || lower.includes('germany') || lower.includes('itália')) {
    category = 'national';
  } else if (lower.includes('madrid') || lower.includes('barca') || lower.includes('barça') || lower.includes('barcelona') || lower.includes('milan') || lower.includes('juventus') || lower.includes('arsenal') || lower.includes('manchester') || lower.includes('chelsea') || lower.includes('liverpool') || lower.includes('bayern') || lower.includes('dortmund') || lower.includes('psg') || lower.includes('roma') || lower.includes('atletico') || lower.includes('benfica') || lower.includes('ajax') || lower.includes('flamengo') || lower.includes('palmeiras') || lower.includes('santos') || lower.includes('vasco') || lower.includes('botafogo') || lower.includes('gremio') || lower.includes('fluminense') || lower.includes('inter') || lower.includes('spurs') || lower.includes('la liga') || lower.includes('lfp') || lower.includes('bahia') || lower.includes('ponte preta') || lower.includes('vitoria') || lower.includes('nautico')) {
    category = 'clubs';
  }
  
  let cleanName = baseName
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/karteltech\.net|marccos designer|nerodesign|tipografstore|licensed by x11|wigo12fc/gi, '')
    .trim();

  // Better club name formatting
  if (cleanName.toLowerCase().startsWith('persib')) cleanName = 'Persib Bandung (Liga 1 23/24)';
  else if (cleanName.toLowerCase().startsWith('persija')) cleanName = 'Persija Jakarta';
  else if (cleanName.toLowerCase().startsWith('borneo')) cleanName = 'Borneo FC 23/24';
  else if (cleanName.toLowerCase().startsWith('psis')) cleanName = 'PSIS Semarang 23/24';
  else if (cleanName.toLowerCase().startsWith('nba bulls')) cleanName = 'NBA Chicago Bulls';
  else if (cleanName.toLowerCase().startsWith('nba celtics')) cleanName = 'NBA Boston Celtics';
  else if (cleanName.toLowerCase().startsWith('nba lakers')) cleanName = 'NBA LA Lakers';
  else if (cleanName.toLowerCase().startsWith('nba heat')) cleanName = 'NBA Miami Heat';
  else if (cleanName.toLowerCase().startsWith('nba knicks')) cleanName = 'NBA NY Knicks';
  else if (cleanName.toLowerCase().startsWith('nba nets')) cleanName = 'NBA Brooklyn Nets';
  else if (cleanName.toLowerCase().startsWith('nba nuggets')) cleanName = 'NBA Denver Nuggets';
  else if (cleanName.toLowerCase().startsWith('nba pacers')) cleanName = 'NBA Indiana Pacers';
  else if (cleanName.toLowerCase().startsWith('nba pistons')) cleanName = 'NBA Detroit Pistons';
  else if (cleanName.toLowerCase().startsWith('nba cavaliers')) cleanName = 'NBA Cleveland Cavaliers';
  else if (cleanName.toLowerCase().startsWith('nba clippers')) cleanName = 'NBA LA Clippers';
  else if (cleanName.toLowerCase().startsWith('nba hornets')) cleanName = 'NBA Charlotte Hornets';
  else if (cleanName.toLowerCase().startsWith('nba jazz')) cleanName = 'NBA Utah Jazz';
  else if (cleanName.toLowerCase().startsWith('nba kings')) cleanName = 'NBA Sacramento Kings';
  else if (cleanName.toLowerCase().startsWith('nba mavericks')) cleanName = 'NBA Dallas Mavericks';
  else if (cleanName.toLowerCase().startsWith('nba timberwolves')) cleanName = 'NBA Minnesota Timberwolves';
  else if (cleanName.toLowerCase().startsWith('nba wizards')) cleanName = 'NBA Washington Wizards';

  const familyName = 'JerseyFont_' + index;
  const format = ext === '.otf' ? 'opentype' : 'truetype';

  // Ensure file is copied
  const destFilePath = path.join(destDir, safeFile);
  if (!fs.existsSync(destFilePath)) {
    fs.copyFileSync(path.join(srcDir, file), destFilePath);
  }

  cssRules += `@font-face {\n  font-family: '${familyName}';\n  src: url('/fonts/jersey/${safeFile}') format('${format}');\n  font-display: swap;\n}\n\n`;

  fontList.push({
    id: familyName,
    name: cleanName,
    category,
    file: safeFile,
    format
  });
});

const cssDir = path.join(process.cwd(), 'src', 'styles');
if (!fs.existsSync(cssDir)) fs.mkdirSync(cssDir, { recursive: true });
fs.writeFileSync(path.join(cssDir, 'jersey-fonts.css'), cssRules, 'utf8');

const tsContent = `// Auto-generated list of jersey fonts
export interface JerseyFontItem {
  id: string;
  name: string;
  category: 'default' | 'liga1' | 'clubs' | 'national' | 'nba' | 'custom';
  file?: string;
  format?: string;
}

export const JERSEY_FONT_CATEGORIES = [
  { id: 'all', label: 'Semua Font' },
  { id: 'liga1', label: '🇮🇩 Liga Indonesia' },
  { id: 'clubs', label: '⚽ Klub Sepakbola' },
  { id: 'national', label: '🏆 Timnas & World Cup' },
  { id: 'nba', label: '🏀 Basket NBA' },
  { id: 'custom', label: '⚡ Esport & Streetwear' },
  { id: 'default', label: 'Standard' },
] as const;

export const DEFAULT_FONTS: JerseyFontItem[] = [
  { id: 'Impact', name: 'Varsity Bold (Impact)', category: 'default' },
  { id: 'Teko', name: 'Athletic Condensed (Teko)', category: 'default' },
  { id: 'Montserrat', name: 'Modern Pro (Montserrat)', category: 'default' },
  { id: 'Arial Black', name: 'Classic Heavy (Block)', category: 'default' },
];

export const ALL_JERSEY_FONTS: JerseyFontItem[] = [
  ...DEFAULT_FONTS,
${fontList.map(f => `  ${JSON.stringify(f)}`).join(',\n')}
];

export async function ensureJerseyFontLoaded(fontFamily: string, sampleText: string = '10 PERALTA'): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return;
  try {
    await document.fonts.load(\`bold 48px "\${fontFamily}"\`, sampleText);
    await document.fonts.load(\`900 120px "\${fontFamily}"\`, sampleText);
  } catch (err) {
    console.warn('Font load warning:', fontFamily, err);
  }
}
`;

const dataDir = path.join(process.cwd(), 'src', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
fs.writeFileSync(path.join(dataDir, 'jerseyFonts.ts'), tsContent, 'utf8');

console.log('Successfully generated jersey-fonts.css and jerseyFonts.ts with', fontList.length, 'fonts!');

