import sanitize from 'sanitize-filename';
import iconv from 'iconv-lite'; // optionnel, utile si tu veux d'autres encodages

function tryFixEncoding(name) {
  if (!name) return 'unknown';

  // si déjà valide UTF-8, on renvoie tel quel
  try {
    const buf = Buffer.from(name, 'utf8');
    if (buf.toString('utf8') === name) return name;
  } catch (e) {
    // ignore
  }

  // Tentative la plus simple : réinterpréter bytes comme latin1/binary -> utf8
  try {
    const fixed = Buffer.from(name, 'binary').toString('utf8');
    if (fixed && fixed.length > 0) return fixed;
  } catch (e) {}

  // Optionnel : tenter avec iconv-lite (ex: windows-1252 -> utf8)
  try {
    const b = Buffer.from(name, 'binary');
    const conv = iconv.decode(b, 'win1252'); // tu peux essayer 'latin1', 'cp1252', etc.
    if (conv && conv.length > 0) return conv;
  } catch (e) {}

  // fallback simple : remplacer séquences non imprimables
  return name.replace(/[^\x20-\x7E\u00A0-\uFFFF]+/g, '');
}

export default function normalizeOriginalName(originalname) {
  // 1) essayer de corriger l'encodage si nécessaire
  let fixed = tryFixEncoding(originalname);

  // 2) retirer chemin éventuel et espaces de début/fin
  fixed = fixed.split(/[\\/]/).pop().trim();

  // 3) sanitiser pour éviter ../ \0 et caractères problématiques
  fixed = sanitize(fixed) || 'file';

  // 4) si trop long, tronquer tout en gardant l'extension
  const maxLen = 180;
  if (fixed.length > maxLen) {
    const ext = path.extname(fixed);
    const base = path.basename(fixed, ext).slice(0, maxLen - ext.length);
    fixed = base + ext;
  }

  return fixed;
}
