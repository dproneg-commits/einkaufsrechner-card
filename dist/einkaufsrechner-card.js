/* Einkaufsrechner Card – shopping expenses per shop and person, with settle-up for two people.
   Lovelace custom card for Home Assistant (HACS). Data lives in a local to-do list (todo.*).
   https://github.com/dproneg-commits/einkaufsrechner-card · MIT License */

const ER_VERSION = '1.0.0';
const ER_BASE = (() => { try { return new URL('.', import.meta.url).href; } catch (e) { return '/hacsfiles/einkaufsrechner-card/'; } })();
try { console.info('%cEinkaufsrechner Card%c ' + ER_VERSION, 'font-weight:700;color:var(--primary-color,#03a9f4)', ''); } catch (e) { /* */ }

const PAL = ['#4dd0e1', '#81c784', '#f06292', '#ffd54f', '#e57373', '#7986cb', '#4db6ac', '#ba68c8', '#ff8a65', '#90a4ae'];
const OTHER_COLOR = '#90a4ae';
const CART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.4 11h10.2L20 7H6.3"/><circle cx="9" cy="19" r="1.6"/><circle cx="17" cy="19" r="1.6"/></svg>';
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ymd = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const toDate = (s) => { const p = String(s).split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); };
const monday = (d = new Date()) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
const isoWeek = (d) => { const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())), n = x.getUTCDay() || 7; x.setUTCDate(x.getUTCDate() + 4 - n); return Math.ceil(((x - Date.UTC(x.getUTCFullYear(), 0, 1)) / 864e5 + 1) / 7); };
/* Text color on a colored chip (dark text on light colors) */
const onColor = (hex) => {
  const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(String(hex || '')); if (!m) return '#fff';
  const [r, g, b] = [m[1], m[2], m[3]].map((x) => parseInt(x, 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.55 ? '#1c1c1c' : '#fff';
};

/* ===== Texts (German, English) ===== */
const ER_T = {
  de: {
    name: 'Einkaufsrechner', desc: 'Einkäufe pro Laden und Person erfassen, mit Ausgleich für zwei Personen.',
    noEntity: 'entity fehlt (lokale To-do-Liste, z. B. todo.einkaufsrechner)',
    missing: (e) => `Die Liste <b>${e}</b> gibt es in Home Assistant nicht. Unter Einstellungen → Geräte & Dienste → Integration hinzufügen → „Lokale To-do-Liste“ eine Liste anlegen und in der Karte auswählen.`,
    unreadable: (e, m) => `Liste ${e} nicht lesbar: ${m}`,
    other: 'Sonstige', purchase: 'Einkauf', edit: 'Ändern', today: 'Heute', yesterday: 'Gestern', otherDay: 'Anderer Tag',
    amount: 'Betrag', shop: 'Laden', paidBy: 'Bezahlt von', save: '＋ Speichern', saveEdit: '✓ Ändern', cancel: 'Abbrechen', del: 'Löschen', clear: 'Löschen',
    newShop: 'Neuer Laden', scan: '📷 Bon', scanLabel: 'Bon scannen',
    enterAmount: 'Bitte einen Betrag eingeben.', pickShop: 'Bitte einen Laden wählen.', pickWho: 'Bitte wählen, wer bezahlt hat.',
    changed: (a, s) => `Geändert: ${a} bei ${s}.`, saved: (a, s) => `${a} bei ${s} gespeichert.`, moved: (a, s) => `${a} jetzt bei ${s}.`, deleted: (a, s) => `${a} bei ${s} gelöscht.`,
    failed: (m) => `Hat nicht geklappt: ${m}`,
    nameMissing: 'Bitte einen Namen eingeben.', exists: (n) => `„${n}“ gibt es schon.`, shopAdded: (n) => `Laden „${n}“ angelegt.`,
    settled: 'Ausgleich gespeichert – es wird neu gezählt.',
    itemBuy: '🛒', itemShop: '⚙️ Laden', itemTill: '⚙️ Kasse', itemSettle: '⚖️ Ausgleich',
    reading: 'Bon wird gelesen …', notReceipt: 'Der Code ist kein Kassenbon-Code.', noCode: 'Kein QR- oder Strichcode gefunden. Bitte den Code näher und scharf fotografieren.',
    noCodeOcr: 'Kein Code gefunden – Summe wird gelesen …', voidReceipt: (a) => `Storno- oder Nullbon (${a}) – bitte bei Bedarf von Hand eintragen.`,
    dup: (a, s, d) => `Dieser Bon ist schon eingetragen: ${a} bei ${s}, vom ${d}`,
    qrRead: (a, s) => s ? `Bon gelesen: ${a} bei ${s}. Bitte prüfen und speichern.` : `Bon gelesen: ${a}. Bitte den Laden wählen – er wird für diese Kasse gemerkt.`,
    barRead: (d, s) => `Strichcode gelesen: Bon vom ${d}${s ? ' bei ' + s : ''}`, ocrRun: 'Summe wird gelesen …',
    barTypeIn: (s) => ` – bitte den Betrag eintippen${s ? '' : ' und den Laden wählen (wird gemerkt)'}.`,
    unreadableBon: (m) => `Bon nicht lesbar: ${m}`,
    pickShopRem: (none) => 'den Laden wählen' + (none ? '' : ' (wird gemerkt)'), checkDay: 'den Tag kontrollieren, ',
    sumOk: (a, chk) => `Summe gelesen: ${a} (passt zur MwSt-Tabelle). Bitte ${chk}prüfen und speichern.`,
    sumErr: (m, sh) => `Summe nicht lesbar (${m}) – bitte den Betrag eintippen${sh}.`, sumUnsure: (sh) => `Summe nicht sicher lesbar – bitte den Betrag eintippen${sh}.`,
    and: ' und ', qsRun: 'Summe wird gelesen …', qsOk: 'Summe gelesen und geprüft', qsType: 'Betrag bitte eintippen',
    qhNone: 'kein Code', qhBar: 'Strichcode: Datum vom Bon', qhQr: 'vom Bon', qhKnown: 'Laden bekannt', qhNew: 'neue Kasse: Laden antippen, wird gemerkt',
    spend: 'Ausgaben', perShop: 'pro Laden', back: 'Zurück', fwd: 'Weiter', week: 'Woche', month: 'Monat', year: 'Jahr',
    wk: 'KW', prev: { w: 'Vorwoche', m: 'Vormonat', y: 'Vorjahr' }, untilToday: 'bis heute', allInPeriod: 'Alle Einkäufe im Zeitraum',
    nBuys: (n) => (n === 1 ? '1 Einkauf' : n + ' Einkäufe'), thisW: 'Diese Woche', thisM: 'Dieser Monat', thisY: 'Dieses Jahr',
    settle: 'Ausgleich', since: (d) => 'seit ' + d, allSettled: '✓ Alles ausgeglichen', noneSince: 'Seit dem Ausgleich noch keine Einkäufe',
    even: '✓ Gleichstand', bothPaid: (a) => `Beide haben ${a} bezahlt`, evenUntil: (d) => 'Gleichstand bis ' + d, onlyPaid: (p) => `Bisher hat nur ${p} bezahlt`,
    ahead: (p, a) => `${p} liegt ${a} vorne`, owes: (p, a) => `${p} müsste ${a} ausgleichen`, settleBtn: 'Ausgeglichen ✓', sure: 'Wirklich? Nochmal tippen',
    lastSettle: (d) => 'Letzter Ausgleich ' + d, evenMark: 'gleichauf', chartLabel: 'Verlauf der Ausgaben seit dem letzten Ausgleich',
    recent: 'Letzte Einkäufe', all: 'Alle ›', noBuys: 'Noch keine Einkäufe eingetragen.', noBuysPeriod: 'In diesem Zeitraum keine Einkäufe.', allF: 'Alle',
    assign: 'Zuordnen:', purchases: 'Einkäufe', close: 'Schließen',
    shops: 'Läden', ownShop: 'eigenen Laden anlegen', nameL: 'Name', namePh: 'z. B. Bäckerei', logo: 'Logo', pickImg: '📷 Bild wählen', rmLogo: 'Logo entfernen',
    barColor: 'Farbe für die Balken', saveShop: '＋ Laden speichern', ownShops: 'Eigene Läden', reallyDel: 'Wirklich löschen?',
    delHint: (o) => `Einkäufe eines gelöschten Ladens zählen danach bei „${o}“ und lassen sich neu zuordnen.`,
    imgBad: 'Bild nicht lesbar', notImg: 'Das ist kein Bild', photoBad: 'Foto nicht lesbar', qrMissing: 'QR-Leser (jsQR.js) nicht gefunden', ocrMissing: 'Texterkennung nicht gefunden',
    color: 'Farbe',
    /* editor */
    eEntity: 'To-do-Liste (Speicher)', eCurrency: 'Währung (ISO-Code, z. B. EUR)', eScan: 'Bon scannen – Österreich (RKSV-QR-Code, Spar-Strichcode)', eOcr: 'Summe per Texterkennung lesen',
    eAdd: '„＋ Laden“ anzeigen', eRecent: 'Anzahl letzte Einkäufe (0 = automatisch)', eReset: 'Auswahl zurücksetzen nach Sekunden (0 = nie)',
    eKeypad: 'Ziffernblock', kAuto: 'Automatisch (breite Ansicht)', kOn: 'Immer', kOff: 'Nie',
    ePeople: 'Personen', eShops: 'Läden', ePName: 'Name', ePUser: 'HA-Benutzer (optional)', eSName: 'Name', eSLogo: 'Logo-URL (optional)',
    eAddP: '＋ Person', eAddS: '＋ Laden', eRm: 'Entfernen', eUp: 'Nach oben',
    ePeopleHint: 'Bei genau zwei Personen zeigt die Karte den Ausgleich. Ist der angemeldete Benutzer eine der Personen, ist sie vorausgewählt.',
    eShopsHint: '„Sonstige“ wird automatisch angehängt. Läden lassen sich auch direkt in der Karte über „＋“ anlegen, mit hochgeladenem Logo.'
  },
  en: {
    name: 'Einkaufsrechner (Shopping split)', desc: 'Track purchases per shop and person, with settle-up for two people.',
    noEntity: 'entity is missing (local to-do list, e.g. todo.shopping_expenses)',
    missing: (e) => `The list <b>${e}</b> does not exist in Home Assistant. Go to Settings → Devices & services → Add integration → “Local To-do”, create a list and select it in the card.`,
    unreadable: (e, m) => `Cannot read list ${e}: ${m}`,
    other: 'Other', purchase: 'Purchase', edit: 'Edit', today: 'Today', yesterday: 'Yesterday', otherDay: 'Other day',
    amount: 'Amount', shop: 'Shop', paidBy: 'Paid by', save: '＋ Save', saveEdit: '✓ Update', cancel: 'Cancel', del: 'Delete', clear: 'Delete',
    newShop: 'New shop', scan: '📷 Receipt', scanLabel: 'Scan receipt',
    enterAmount: 'Please enter an amount.', pickShop: 'Please pick a shop.', pickWho: 'Please pick who paid.',
    changed: (a, s) => `Updated: ${a} at ${s}.`, saved: (a, s) => `${a} at ${s} saved.`, moved: (a, s) => `${a} now at ${s}.`, deleted: (a, s) => `${a} at ${s} deleted.`,
    failed: (m) => `That did not work: ${m}`,
    nameMissing: 'Please enter a name.', exists: (n) => `“${n}” already exists.`, shopAdded: (n) => `Shop “${n}” added.`,
    settled: 'Settle-up saved – counting starts over.',
    itemBuy: '🛒', itemShop: '⚙️ Shop', itemTill: '⚙️ Till', itemSettle: '⚖️ Settle-up',
    reading: 'Reading receipt …', notReceipt: 'This code is not a receipt code.', noCode: 'No QR code or barcode found. Please take a closer, sharp photo of the code.',
    noCodeOcr: 'No code found – reading the total …', voidReceipt: (a) => `Void or zero receipt (${a}) – enter it by hand if needed.`,
    dup: (a, s, d) => `This receipt is already saved: ${a} at ${s}, from ${d}`,
    qrRead: (a, s) => s ? `Receipt read: ${a} at ${s}. Please check and save.` : `Receipt read: ${a}. Please pick the shop – it is remembered for this till.`,
    barRead: (d, s) => `Barcode read: receipt from ${d}${s ? ' at ' + s : ''}`, ocrRun: 'reading the total …',
    barTypeIn: (s) => ` – please type the amount${s ? '' : ' and pick the shop (remembered)'}.`,
    unreadableBon: (m) => `Receipt not readable: ${m}`,
    pickShopRem: (none) => 'pick the shop' + (none ? '' : ' (remembered)'), checkDay: 'check the day, ',
    sumOk: (a, chk) => `Total read: ${a} (matches the VAT table). Please ${chk}check and save.`,
    sumErr: (m, sh) => `Total not readable (${m}) – please type the amount${sh}.`, sumUnsure: (sh) => `Total not reliably readable – please type the amount${sh}.`,
    and: ' and ', qsRun: 'reading total …', qsOk: 'total read and checked', qsType: 'please type the amount',
    qhNone: 'no code', qhBar: 'Barcode: date from receipt', qhQr: 'from receipt', qhKnown: 'shop known', qhNew: 'new till: tap the shop, it is remembered',
    spend: 'Spending', perShop: 'per shop', back: 'Back', fwd: 'Forward', week: 'Week', month: 'Month', year: 'Year',
    wk: 'Wk', prev: { w: 'last week', m: 'last month', y: 'last year' }, untilToday: 'to date', allInPeriod: 'All purchases in this period',
    nBuys: (n) => (n === 1 ? '1 purchase' : n + ' purchases'), thisW: 'This week', thisM: 'This month', thisY: 'This year',
    settle: 'Settle-up', since: (d) => 'since ' + d, allSettled: '✓ All settled', noneSince: 'No purchases since the last settle-up',
    even: '✓ Even', bothPaid: (a) => `Both paid ${a}`, evenUntil: (d) => 'Even until ' + d, onlyPaid: (p) => `So far only ${p} has paid`,
    ahead: (p, a) => `${p} is ${a} ahead`, owes: (p, a) => `${p} would owe ${a}`, settleBtn: 'Settled ✓', sure: 'Sure? Tap again',
    lastSettle: (d) => 'Last settle-up ' + d, evenMark: 'even', chartLabel: 'Spending since the last settle-up',
    recent: 'Recent purchases', all: 'All ›', noBuys: 'No purchases yet.', noBuysPeriod: 'No purchases in this period.', allF: 'All',
    assign: 'Assign:', purchases: 'Purchases', close: 'Close',
    shops: 'Shops', ownShop: 'add your own shop', nameL: 'Name', namePh: 'e.g. Bakery', logo: 'Logo', pickImg: '📷 Choose image', rmLogo: 'Remove logo',
    barColor: 'Bar color', saveShop: '＋ Save shop', ownShops: 'Your shops', reallyDel: 'Really delete?',
    delHint: (o) => `Purchases of a deleted shop then count as “${o}” and can be reassigned.`,
    imgBad: 'Image not readable', notImg: 'This is not an image', photoBad: 'Photo not readable', qrMissing: 'QR reader (jsQR.js) not found', ocrMissing: 'Text recognition not found',
    color: 'Color',
    eEntity: 'To-do list (storage)', eCurrency: 'Currency (ISO code, e.g. EUR)', eScan: 'Scan receipts – Austria (RKSV QR code, Spar barcode)', eOcr: 'Read total with text recognition',
    eAdd: 'Show “＋ shop” tile', eRecent: 'Number of recent purchases (0 = auto)', eReset: 'Reset selection after seconds (0 = never)',
    eKeypad: 'Keypad', kAuto: 'Auto (wide layout)', kOn: 'Always', kOff: 'Never',
    ePeople: 'People', eShops: 'Shops', ePName: 'Name', ePUser: 'HA user (optional)', eSName: 'Name', eSLogo: 'Logo URL (optional)',
    eAddP: '＋ Person', eAddS: '＋ Shop', eRm: 'Remove', eUp: 'Move up',
    ePeopleHint: 'With exactly two people the card shows the settle-up. If the logged-in user is one of them, that person is preselected.',
    eShopsHint: '“Other” is added automatically. Shops can also be added right in the card with “＋”, including an uploaded logo.'
  }
};
const erLang = (h) => (String((h && ((h.locale && h.locale.language) || h.language)) || navigator.language || 'en').toLowerCase().startsWith('de') ? 'de' : 'en');
const erT = (h) => ER_T[erLang(h)];

/* Logo from an image file: scaled to S×S px on white → data: URL (webp, else jpeg) */
const erImg = (file, T, S = 96) => new Promise((ok, no) => {
  const fr = new FileReader(); fr.onerror = () => no(new Error(T.imgBad));
  fr.onload = () => {
    const im = new Image(); im.onerror = () => no(new Error(T.notImg));
    im.onload = () => {
      const c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d');
      g.fillStyle = '#fff'; g.fillRect(0, 0, S, S);
      const k = Math.min(S / im.width, S / im.height) * 0.92, w = im.width * k, h = im.height * k; g.drawImage(im, (S - w) / 2, (S - h) / 2, w, h);
      let u = c.toDataURL('image/webp', 0.85); if (!u.startsWith('data:image/webp')) u = c.toDataURL('image/jpeg', 0.85); ok(u);
    };
    im.src = fr.result;
  };
  fr.readAsDataURL(file);
});

/* ===== Receipt scan (Austria) =====
   RKSV code of an Austrian receipt: _R1-AT1_Till_Receipt_Date_Normal_Red1_Red2_Zero_Special_Turnover_Cert_…
   → { kid, nr, d (day), b (sum of all tax rates), z (certificate) }, else null */
const erRksv = (txt) => {
  const s = String(txt || '').trim(); if (!/^_R\d+-[A-Z]{2}\d*_/.test(s)) return null;
  const p = s.split('_'), i = p.findIndex((x) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(x)); if (i < 4 || p.length < i + 6) return null;
  const am = p.slice(i + 1, i + 6).map((x) => { x = String(x).trim(); return parseFloat(x.includes(',') ? x.replace(/\./g, '').replace(',', '.') : x); });
  if (am.some(isNaN)) return null;
  return { kid: p.slice(2, i - 1).join('_'), nr: p[i - 1], dt: p[i], d: p[i].slice(0, 10), b: Math.round(am.reduce((a, x) => a + x, 0) * 100) / 100, z: p[i + 7] || '' };
};
/* jsQR: bundled file next to this card, else CDN */
let erJsQR = null;
const erLoadQR = (src, T) => erJsQR || (erJsQR = new Promise((ok, no) => {
  if (window.jsQR) { ok(window.jsQR); return; }
  const tr = (u, next) => { const sc = document.createElement('script'); sc.src = u; sc.onload = () => (window.jsQR ? ok(window.jsQR) : next()); sc.onerror = next; document.head.appendChild(sc); };
  tr(src, () => tr('https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js', () => { erJsQR = null; no(new Error(T.qrMissing)); }));
}));
/* Code 128 barcode from a grayscale image (scan rows, compare bar widths, checksum) – for receipts without QR code (Spar) */
const ER_C128 = '212222 222122 222221 121223 121322 131222 122213 122312 132212 221213 221312 231212 112232 122132 122231 113222 123122 123221 223211 221132 221231 213212 223112 312131 311222 321122 321221 312212 322112 322211 212123 212321 232121 111323 131123 131321 112313 132113 132311 211313 231113 231311 112133 112331 132131 113123 113321 133121 313121 211331 231131 213113 213311 213131 311123 311321 331121 312113 312311 332111 314111 221411 431111 111224 111422 121124 121421 141122 141221 112214 112412 122114 122411 142112 142211 241211 221114 413111 241112 134111 111242 121142 121241 114212 124112 124211 411212 421112 421211 212141 214121 412121 111143 111341 131141 114113 114311 411113 411311 113141 114131 311141 411131 211412 211214 211232 233111'.split(' ').map((p) => p.split('').map(Number));
const erSym = (r, i) => {   /* 6 widths from i → best Code 128 value or -1 */
  let S = 0; for (let k = 0; k < 6; k++) S += r[i + k]; if (!S) return -1;
  let best = -1, bd = 1e9;
  /* compare edge-to-edge distances (bar + space): robust when printed bars get wider */
  const e = [0, 1, 2, 3].map((k) => (r[i + k] + r[i + k + 1]) * 11 / S);
  for (let v = 0; v < ER_C128.length; v++) {
    const p = ER_C128[v]; let d = 0;
    for (let k = 0; k < 4; k++) d += Math.abs(e[k] - p[k] - p[k + 1]);
    for (let k = 0; k < 6; k++) d += 0.15 * Math.abs(r[i + k] * 11 / S - p[k]);
    if (d < bd) { bd = d; best = v; }
  }
  return bd < 1.8 ? best : -1;
};
const erC128Runs = (r) => {   /* r = widths, starting with a bar → text or null */
  for (let i = 0; i + 30 < r.length; i += 2) {
    const st = erSym(r, i); if (st < 103 || st > 105) continue;
    const vals = [st]; let j = i + 6, ok = false;
    while (j + 6 <= r.length) { const v = erSym(r, j); if (v < 0) break; vals.push(v); j += 6; if (v === 106) { ok = true; break; } }
    if (!ok || vals.length < 4) continue;
    const data = vals.slice(1, -2), chk = vals[vals.length - 2];
    let sum = vals[0]; data.forEach((v, k) => { sum += v * (k + 1); }); if (sum % 103 !== chk) continue;
    let set = st === 105 ? 'C' : st === 104 ? 'B' : 'A', out = '';
    for (const v of data) {
      if (v === 99) set = 'C'; else if (v === 100) set = 'B'; else if (v === 101) set = 'A'; else if (v >= 96) continue;
      else if (set === 'C') out += String(v).padStart(2, '0'); else out += String.fromCharCode(set === 'B' ? v + 32 : v < 64 ? v + 32 : v - 64);
    }
    if (out) return out;
  }
  return null;
};
function erC128(g, w, h) {   /* g = grayscale (Uint8), rows and columns in both directions; 2 equal hits needed */
  const hits = {};
  const line = (get, n) => {
    let mn = 255, mx = 0; for (let k = 0; k < n; k++) { const v = get(k); if (v < mn) mn = v; if (v > mx) mx = v; }
    if (mx - mn < 60) return null; const t = (mn + mx) / 2, runs = []; let cur = get(0) < t, len = 0, started = false;
    for (let k = 0; k < n; k++) { const b = get(k) < t; if (b === cur) len++; else { if (started || cur) { runs.push(len); started = true; } cur = b; len = 1; } }
    for (const rr of [runs, runs.slice().reverse().slice(runs.length % 2 ? 0 : 1)]) { const x = erC128Runs(rr); if (x) return x; }
    return null;
  };
  const tryL = (get, n) => { const x = line(get, n); if (x) { hits[x] = (hits[x] || 0) + 1; if (hits[x] >= 2) return x; } return null; };
  for (let y = 2; y < h; y += Math.max(1, Math.floor(h / 300))) { const x = tryL((k) => g[y * w + k], w); if (x) return x; }
  for (let x0 = 2; x0 < w; x0 += Math.max(1, Math.floor(w / 300))) { const x = tryL((k) => g[k * w + x0], h); if (x) return x; }
  return null;
}
/* Barcode receipt (Spar): branch 11 · till 3 · YYMMDD · hhmmss · receipt 4 digits → { kid, nr, d } */
const erBar = (t) => {
  const m = /^(\d{11})(\d{3})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{4})$/.exec(String(t || '').trim()); if (!m) return null;
  if (+m[4] < 1 || +m[4] > 12 || +m[5] < 1 || +m[5] > 31 || +m[6] > 23 || +m[7] > 59) return null;
  return { kid: 'BC' + m[1] + '-' + m[2], nr: m[9], d: `20${m[3]}-${m[4]}-${m[5]}` };
};
/* Read codes from a receipt photo – on the device only: BarcodeDetector (Android), else jsQR and the own Code 128 reader */
async function erReadBon(file, lib, T) {
  const url = URL.createObjectURL(file);
  try {
    const im = await new Promise((ok, no) => { const x = new Image(); x.onload = () => ok(x); x.onerror = () => no(new Error(T.photoBad)); x.src = url; });
    const W = im.naturalWidth, H = im.naturalHeight, all = [];
    if ('BarcodeDetector' in window) {
      try { (await new window.BarcodeDetector({ formats: ['qr_code', 'code_128'] }).detect(im)).forEach((r) => all.push(r.rawValue)); } catch (e) { /* not supported */ }
      const t = all.find(erRksv); if (t) return [t];
    }
    const c = document.createElement('canvas'), g = c.getContext('2d', { willReadFrequently: true });
    const draw = (S) => { const k = Math.min(1, S / Math.max(W, H)); c.width = Math.round(W * k); c.height = Math.round(H * k); g.drawImage(im, 0, 0, c.width, c.height); return k; };
    let J = null; try { J = await erLoadQR(lib, T); } catch (e) { if (!all.length) throw e; }
    if (J) for (const S of [1200, 1800, 2600]) {   /* small first (fast), then larger for small codes */
      const k = draw(S), r = J(g.getImageData(0, 0, c.width, c.height).data, c.width, c.height, { inversionAttempts: 'attemptBoth' });
      if (r && r.data) { all.push(r.data); if (erRksv(r.data)) return [r.data]; }
      if (k === 1) break;
    }
    if (!all.some(erBar)) {   /* no RKSV QR → look for a barcode in grayscale */
      draw(2400); const d = g.getImageData(0, 0, c.width, c.height).data, gr = new Uint8Array(c.width * c.height);
      for (let i = 0; i < gr.length; i++) gr[i] = (d[i * 4] * 77 + d[i * 4 + 1] * 150 + d[i * 4 + 2] * 29) >> 8;
      const b = erC128(gr, c.width, c.height); if (b) all.push(b);
    }
    return all;
  } finally { URL.revokeObjectURL(url); }
}
/* Text recognition (Tesseract.js) – on the device only; bundled files under ocr_path first, else CDN */
let erTess = null, erOcrW = null, erOcrT = 0;
const erLoadOcr = (path, T) => erTess || (erTess = new Promise((ok, no) => {
  const tr = (u, loc, next) => { const sc = document.createElement('script'); sc.src = u; sc.onload = () => (window.Tesseract ? ok(loc) : next()); sc.onerror = next; document.head.appendChild(sc); };
  if (window.Tesseract) { ok(null); return; }
  tr(path + 'tesseract.min.js', path, () => tr('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js', null, () => { erTess = null; no(new Error(T.ocrMissing)); }));
}));
async function erOcr(file, path, T) {
  const loc = await erLoadOcr(path, T), abs = (u) => new URL(u, location.href).href;
  clearTimeout(erOcrT);
  if (!erOcrW) erOcrW = window.Tesseract.createWorker('eng', 1, loc ? { workerPath: abs(loc + 'worker.min.js'), corePath: abs(loc).replace(/\/$/, ''), langPath: abs(loc).replace(/\/$/, '') } : {})
    .catch((e) => { erOcrW = null; throw e; });
  const w = await erOcrW, url = URL.createObjectURL(file);
  try {
    const im = await new Promise((ok, no) => { const x = new Image(); x.onload = () => ok(x); x.onerror = () => no(new Error(T.photoBad)); x.src = url; });
    const k = Math.min(1, 2000 / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement('canvas');
    c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
    return (await w.recognize(c)).data.text || '';
  } finally {
    URL.revokeObjectURL(url);
    erOcrT = setTimeout(() => { if (erOcrW) { erOcrW.then((x) => x.terminate()).catch(() => {}); erOcrW = null; } }, 60000);   /* free memory again */
  }
}
/* Total from receipt text: SUMME line must match the VAT table (sum of gross amounts per rate) → amount or null */
const erSumme = (txt) => {
  const am = (l) => [...l.matchAll(/(\d{1,4})\s?[,.]\s?(\d{2})(?![\d%])/g)].map((m) => +(m[1] + '.' + m[2]));
  let mw = 0, n = 0, bad = false; const tot = [];
  String(txt || '').split('\n').forEach((l) => {
    const pm = /\d{1,2}(?:\s?[,.]\s?\d{1,2})?\s?%/.exec(l);
    if (pm && !/SUMME|GESAMT/i.test(l)) {
      const a = am(l.slice(pm.index + pm[0].length)); if (!a.length) return;
      if (a.length >= 3 && Math.abs(a[a.length - 3] + a[a.length - 2] - a[a.length - 1]) > 0.011) bad = true;   /* net + VAT ≠ gross */
      mw += a[a.length - 1]; n++;
    } else if (/SUMME|GESAMT|ZU ZAHLEN|ZAHLBETRAG/i.test(l) && !/MWST|ERSPARNIS/i.test(l)) { const a = am(l); if (a.length) tot.push(a[a.length - 1]); }
  });
  if (!n || bad) return null;
  mw = Math.round(mw * 100) / 100;
  return tot.some((t) => Math.abs(t - mw) < 0.011) && mw > 0 ? mw : null;
};

/* ===== Styles (Home Assistant theme variables, light and dark) ===== */
const ER_CSS = `
  :host{display:block;min-width:0;color:var(--primary-text-color);
    --er-acc:var(--primary-color,#03a9f4);--er-on-acc:var(--text-primary-color,#fff);--er-fg2:var(--secondary-text-color,#727272);
    --er-line:var(--divider-color,rgba(127,127,127,.25));--er-s1:color-mix(in srgb,var(--primary-text-color,#212121) 5%,transparent);
    --er-s2:color-mix(in srgb,var(--primary-text-color,#212121) 10%,transparent);--er-sel:color-mix(in srgb,var(--er-acc) 18%,transparent);
    --er-warn:var(--warning-color,#ffa600);--er-ok:var(--success-color,#43a047);--er-err:var(--error-color,#db4437)}
  *{box-sizing:border-box}
  ha-card{overflow:hidden}
  .w{display:grid;grid-template-columns:340px minmax(0,1fr) minmax(0,1fr);align-items:stretch}
  .w>.g+.g{border-left:1px solid var(--er-line)}
  :host(.nar) .w{display:flex;flex-direction:column}:host(.nar) .w>.g+.g{border-left:0;border-top:1px solid var(--er-line)}
  .g{padding:14px 16px;display:flex;flex-direction:column;gap:10px;min-width:0}
  button{font:inherit;color:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
  h2{margin:0;font-size:17px;font-weight:600;display:flex;align-items:center;gap:8px;min-height:30px}h2 small{margin-left:auto;font-size:12.5px;color:var(--er-fg2);font-weight:400}
  .tg{font-size:10.5px;letter-spacing:.07em;color:var(--er-fg2);text-transform:uppercase;font-weight:600;margin-bottom:-4px}
  .days{margin-left:auto;display:flex;gap:4px;align-items:center}
  .ch{border:1px solid var(--er-line);background:var(--er-s1);border-radius:999px;padding:5px 11px;font-size:12.5px;font-weight:500;white-space:nowrap}
  .ch.on{background:var(--er-sel);border-color:var(--er-acc)}
  .dp{position:relative;display:grid;place-items:center;padding:5px 9px}.dp input{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer}
  .amt{position:relative;display:flex;align-items:baseline;justify-content:center;gap:6px;padding:8px 12px;border-radius:16px;background:var(--er-s1);border:1px solid var(--er-line)}
  .qr{position:absolute;left:8px;top:50%;transform:translateY(-50%);display:flex;align-items:center;gap:5px;height:38px;padding:0 10px;border-radius:12px;border:1px solid color-mix(in srgb,var(--er-acc) 50%,transparent);background:var(--er-sel);font-size:12.5px;font-weight:600;cursor:pointer;overflow:hidden;white-space:nowrap}
  .qr input{position:absolute;inset:0;opacity:0;cursor:pointer}.qr.bz{opacity:.6}.amt.sc{padding-left:112px}
  .qh{font-size:12px;background:var(--er-sel);border:1px solid color-mix(in srgb,var(--er-acc) 35%,transparent);border-radius:11px;padding:5px 10px;margin-top:-4px}
  .qh.nw{background:color-mix(in srgb,var(--er-warn) 12%,transparent);border-color:color-mix(in srgb,var(--er-warn) 40%,transparent)}
  .amt input{width:100%;min-width:0;text-align:right;font:inherit;font-size:36px;font-weight:600;color:var(--primary-text-color);background:none;border:0;outline:none;padding:0;letter-spacing:.5px}
  .amt input::placeholder{color:var(--er-fg2);opacity:.5}.amt span{font-size:22px;color:var(--er-fg2);flex:none;width:40%}
  .sh{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
  :host(.nar) .sh{grid-template-columns:repeat(auto-fill,minmax(74px,1fr))}
  .sb{display:flex;flex-direction:column;align-items:center;gap:4px;padding:7px 4px 5px;border-radius:14px;border:1px solid var(--er-line);background:var(--er-s1);font-size:11.5px;min-width:0}
  .sb.on{background:var(--er-sel);border-color:var(--er-acc);box-shadow:0 0 0 2px color-mix(in srgb,var(--er-acc) 30%,transparent);font-weight:600}
  .sb span{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .lg{position:relative;width:34px;height:34px;border-radius:10px;background:#fff;overflow:hidden;display:grid;place-items:center;flex:none;color:#1c1c1c;font-weight:700;font-size:15px}
  .lg img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}
  .lg.no{background:var(--er-s2);color:var(--er-fg2)}.lg svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
  .lg.s{width:24px;height:24px;border-radius:7px;font-size:11px}.lg.s svg{width:15px;height:15px}
  .who{display:grid;grid-template-columns:repeat(auto-fit,minmax(0,1fr));gap:6px}
  .wb{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:14px;border:1px solid var(--er-line);background:var(--er-s1);font-size:14.5px;font-weight:500;min-width:0}
  .wb.on{background:var(--er-sel);border-color:var(--er-acc);box-shadow:0 0 0 2px color-mix(in srgb,var(--er-acc) 30%,transparent)}
  .av{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:700;flex:none}
  .pad{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
  .pad button{height:42px;border-radius:12px;border:1px solid var(--er-line);background:var(--er-s1);font-size:18px}
  .pad button.f{font-size:13px;color:var(--er-fg2)}
  .sv{height:46px;border-radius:14px;border:0;background:var(--er-acc);color:var(--er-on-acc);font-weight:700;font-size:15px}
  .pad .sv{grid-column:span 3;height:42px;font-size:15px;color:var(--er-on-acc);border:0;background:var(--er-acc)}
  .sv[disabled],.pad .sv[disabled]{background:var(--er-s2);color:var(--er-fg2);cursor:default}
  .msg{font-size:13px;color:var(--er-warn);text-align:center;min-height:17px;margin-top:-4px}.msg.ok{color:var(--er-ok)}
  .seg{display:flex;gap:3px;padding:3px;border-radius:12px;background:var(--er-s1);border:1px solid var(--er-line);flex:1}
  .seg button{flex:1;font-size:13px;padding:6px 0;border-radius:9px;border:0;background:none;color:var(--er-fg2)}.seg button.on{background:var(--er-sel);color:var(--primary-text-color);font-weight:600}
  .nv{display:flex;gap:6px;align-items:center}
  .arr{font-size:16px;color:var(--er-fg2);width:34px;height:34px;border-radius:10px;background:var(--er-s1);border:0;flex:none}.arr[disabled]{opacity:.3;cursor:default}
  .tot{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}.tot b{font-size:32px;font-weight:600;white-space:nowrap;letter-spacing:-.3px}
  .tot span{font-size:13px;color:var(--er-fg2)}.tot em{font-style:normal;margin-left:auto;font-size:12px;color:var(--er-fg2);white-space:nowrap}
  .bars{display:flex;flex-direction:column;gap:8px}
  .bar{display:grid;grid-template-columns:24px 92px minmax(0,1fr) 86px;align-items:center;gap:9px;font-size:13.5px}
  .bar>span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .bar small{display:block;font-size:11px;color:var(--er-fg2)}
  .bar .t{height:8px;border-radius:8px;background:var(--er-s2);position:relative;overflow:hidden}.bar .t u{position:absolute;left:0;top:0;bottom:0;border-radius:8px}
  .bar em{font-style:normal;text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}.bar.z{opacity:.4}
  .mini{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:auto}
  .mini button{text-align:left;padding:7px 10px;border-radius:14px;background:var(--er-s1);border:1px solid var(--er-line);font-size:11.5px;color:var(--er-fg2)}
  .mini button.on{border-color:var(--er-acc)}.mini b{display:block;font-size:15.5px;color:var(--primary-text-color);font-weight:600;margin-top:1px;white-space:nowrap}
  .bal{padding:10px 12px;border-radius:16px;background:color-mix(in srgb,var(--er-warn) 12%,transparent);border:1px solid color-mix(in srgb,var(--er-warn) 45%,transparent);display:flex;flex-direction:column;gap:3px}
  .bal.eq{background:color-mix(in srgb,var(--er-ok) 12%,transparent);border-color:color-mix(in srgb,var(--er-ok) 45%,transparent)}
  .bal .m{font-size:13px;color:var(--er-warn);font-weight:600}.bal.eq .m{color:var(--er-ok)}
  .bal .l{font-size:19px;font-weight:600}
  .bal .r{display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--er-fg2);flex-wrap:wrap}
  .bt{margin-left:auto;border:1px solid var(--er-line);background:var(--er-s1);border-radius:11px;padding:6px 11px;font-size:12.5px;white-space:nowrap}
  .bt.cf{background:var(--er-warn);color:#1c1c1c;border-color:var(--er-warn);font-weight:700}
  svg.cv{width:100%;height:auto;display:block;fill:none;stroke-linecap:round}
  svg.cv .gl{stroke:var(--er-line)}svg.cv .mk{stroke:var(--er-warn)}svg.cv .mkf{fill:var(--er-warn);stroke:none}svg.cv .mkb{fill:color-mix(in srgb,var(--er-warn) 10%,transparent);stroke:none}
  svg.cv text{fill:var(--er-fg2);stroke:none;font-size:10px;font-family:inherit}svg.cv text.mt{fill:var(--er-warn)}
  .lgd{display:flex;gap:14px;font-size:12px;color:var(--er-fg2);flex-wrap:wrap}.lgd span{display:flex;align-items:center;gap:6px}.lgd i{width:14px;height:3px;border-radius:2px}
  .ls{display:flex;flex-direction:column;gap:5px}
  .row{display:grid;grid-template-columns:44px 24px minmax(0,1fr) auto auto;gap:9px;align-items:center;padding:6px 10px;border-radius:13px;background:var(--er-s1);border:1px solid var(--er-line);font-size:13.5px;text-align:left;width:100%}
  .row>span:nth-child(3){overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .row .d{font-size:11px;color:var(--er-fg2);line-height:1.2}.row b{font-variant-numeric:tabular-nums;white-space:nowrap}
  .row .av{width:22px;height:22px;font-size:10.5px}.row.op{border-color:color-mix(in srgb,var(--er-err) 50%,transparent)}
  .del{border:1px solid color-mix(in srgb,var(--er-err) 50%,transparent);background:color-mix(in srgb,var(--er-err) 14%,transparent);color:var(--er-err);border-radius:9px;padding:4px 9px;font-size:12px;font-weight:600}
  .acts{display:flex;gap:6px}.chg{border:1px solid color-mix(in srgb,var(--er-acc) 50%,transparent);background:var(--er-sel);color:var(--er-acc);border-radius:9px;padding:4px 9px;font-size:12px;font-weight:600}
  .row.ed{border-color:var(--er-acc);background:var(--er-sel)}
  .pad .sv.e{grid-column:span 2}.cn{padding:0 2px;min-width:0;overflow:hidden;border-radius:12px;border:1px solid var(--er-line);background:var(--er-s1);font-size:12px !important;color:var(--er-fg2)}
  .eb{display:grid;grid-template-columns:2fr 1fr;gap:6px}.eb .cn{height:46px}
  .none{font-size:13px;color:var(--er-fg2);padding:4px 2px}
  .lh{display:flex;align-items:center;gap:8px;margin-top:2px}.lh .tg{margin:0}
  .al{margin-left:auto;border:1px solid var(--er-line);background:var(--er-s1);border-radius:999px;padding:3px 10px;font-size:12px;color:var(--er-fg2)}
  button.tot{border:0;background:none;padding:0;text-align:left;width:100%}button.bar{border:0;background:none;padding:0;width:100%;text-align:left}
  .pp{display:flex;flex-direction:column;gap:10px;min-width:0}.pp .row{grid-template-columns:76px 24px minmax(0,1fr) auto auto}
  .fl{display:flex;gap:6px;flex-wrap:wrap}.fl .ch{display:flex;align-items:center;gap:6px;padding:4px 10px 4px 4px}.fl .ch.a{padding:5px 11px}.fl .lg{width:22px;height:22px;border-radius:6px}.fl .lg svg{width:14px;height:14px}
  .ps{display:flex;gap:14px;flex-wrap:wrap;font-size:13px;color:var(--er-fg2)}.ps b{color:var(--primary-text-color)}.ps>span{display:flex;align-items:center;gap:6px}
  :host(.nar) .row.op .acts{grid-column:1/-1;justify-content:flex-end}
  .sb.nw{border-style:dashed;background:none;color:var(--er-fg2);justify-content:center;font-size:22px}
  .mv{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:6px 10px 8px;margin-top:-3px;border-radius:0 0 13px 13px;background:var(--er-sel);border:1px solid color-mix(in srgb,var(--er-acc) 35%,transparent);border-top:0;font-size:12px;color:var(--er-fg2)}
  .mv button{border:1px solid var(--er-line);background:var(--er-s1);border-radius:9px;padding:3px;display:grid;place-items:center}
  .ns{display:flex;flex-direction:column;gap:10px}
  .ns input[type=text]{font:inherit;font-size:16px;padding:10px 12px;border-radius:12px;border:1px solid var(--er-line);background:var(--er-s1);color:var(--primary-text-color)}
  .nl{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.nl .lg{width:56px;height:56px;border-radius:14px;font-size:24px}
  .fp{position:relative;overflow:hidden}.fp input{position:absolute;inset:0;opacity:0;cursor:pointer}
  .cl{display:flex;gap:8px;flex-wrap:wrap}.cl button{width:34px;height:34px;border-radius:50%;border:2px solid transparent}.cl button.on{border-color:var(--primary-text-color);box-shadow:0 0 0 2px var(--er-s2)}
  .last{font-size:11.5px;color:var(--er-fg2)}
  .err{font-size:13px;color:var(--er-err);background:color-mix(in srgb,var(--er-err) 12%,transparent);border-radius:12px;padding:8px 10px}`;
const ER_DLG_CSS = `
  .bg{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.5);font-family:var(--ha-font-family-body,var(--paper-font-body1_-_font-family,Roboto,system-ui,sans-serif))}
  .p{width:min(var(--w,680px),96vw);max-height:94vh;display:flex;flex-direction:column;background:var(--ha-card-background,var(--card-background-color,#fff));color:var(--primary-text-color);border-radius:var(--ha-dialog-border-radius,24px);padding:16px 18px;box-shadow:0 20px 60px rgba(0,0,0,.4);box-sizing:border-box}
  .h{display:flex;align-items:center;gap:10px;font-size:18px;font-weight:600;margin-bottom:12px}
  .h span{font-weight:400;font-size:13px;color:var(--secondary-text-color)}
  .x{margin-left:auto;width:40px;height:40px;border-radius:12px;border:0;background:color-mix(in srgb,var(--primary-text-color) 8%,transparent);color:inherit;font-size:22px;cursor:pointer;flex:none}
  .b{overflow:auto;min-height:0}`;

/* Simple dialog in document.body (inherits the HA theme variables) */
function erDialog(o) {
  const el = document.createElement('div'), sr = el.attachShadow({ mode: 'open' });
  el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', o.title);
  sr.innerHTML = `<style>${ER_DLG_CSS}</style><div class="bg"><div class="p" style="--w:${o.width || 680}px"><div class="h"><em style="font-style:normal">${esc(o.title)}</em><span>${esc(o.sub || '')}</span><button class="x" aria-label="${esc(o.close || 'Close')}">×</button></div><div class="b"></div></div></div>`;
  const d = { el, body: sr.querySelector('.b') };
  let t;
  const onKey = (e) => { if (e.key === 'Escape') d.close(); };
  d.bump = () => { clearTimeout(t); if (o.timeout) t = setTimeout(d.close, o.timeout * 1000); };
  d.close = () => { if (!el.isConnected) return; document.removeEventListener('keydown', onKey); clearTimeout(t); el.remove(); if (o.onClose) o.onClose(); };
  sr.querySelector('.x').addEventListener('click', d.close);
  sr.querySelector('.bg').addEventListener('click', (e) => { if (e.target.classList.contains('bg')) d.close(); });
  el.addEventListener('pointerdown', d.bump);
  document.addEventListener('keydown', onKey);
  d.bump();
  document.body.appendChild(el);
  return d;
}

/* ===== Card =====
   Each purchase is an item in a local to-do list, e.g. "🛒 Lidl · €34.60 · Anna"; the data is JSON in the description:
   { e: { s shop, b amount, p person, d day, t time, q receipt key } } · { a: settle-up } · { shop: own shop } · { kasse: till → shop } */
class EinkaufsrechnerCard extends HTMLElement {
  static getConfigElement() { return document.createElement('einkaufsrechner-card-editor'); }
  static getStubConfig(h) {
    const ids = Object.keys((h && h.states) || {});
    const ent = ids.find((x) => /^todo\..*(einkauf|ausgab|expense|spend)/i.test(x)) || ids.find((x) => x.startsWith('todo.')) || 'todo.einkaufsrechner';
    const people = ids.filter((x) => x.startsWith('person.')).slice(0, 2).map((x) => ({ name: (h.states[x].attributes || {}).friendly_name || x.slice(7) }));
    return { entity: ent, people: people.length ? people : [{ name: 'Anna' }, { name: 'Ben' }] };
  }
  setConfig(c) {
    if (!c || !c.entity) throw new Error(ER_T.en.noEntity);
    this._c = c;
    this._shops = (c.shops || []).map((s, i) => {
      const o = typeof s === 'string' ? { name: s } : { ...s }; o.name = String(o.name || '').trim();
      o.color = o.color || PAL[i % PAL.length]; return o;
    }).filter((o) => o.name);
    this._ppl = (c.people || []).map((p) => (typeof p === 'string' ? { name: p } : { ...p })).filter((p) => p.name).map((p, i) => ({ ...p, name: String(p.name), color: p.color || PAL[(i * 2) % PAL.length] }));
    if (!this._day) this._day = 0;
    if (!this._per) { this._per = 'm'; this._off = 0; }
    if (!this.shadowRoot) {
      const r = this.attachShadow({ mode: 'open' });
      r.innerHTML = `<style>${ER_CSS}</style><ha-card><div id="b"></div></ha-card>`;
      this._wire(r);
      r.addEventListener('input', (e) => {   /* amount typed on a keyboard */
        if (e.target.id !== 'amt') return;
        const v = this._clean(e.target.value); if (v !== e.target.value) e.target.value = v;
        this._amt = v; this._touch(); this._btn();
      });
      r.addEventListener('change', (e) => {   /* other day from the date picker, receipt photo */
        if (e.target.id === 'qf') { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (f) this._scan(f); return; }
        if (e.target.id !== 'dd' || !e.target.value) return;
        const y = new Date(); y.setDate(y.getDate() - 1); const v = e.target.value;
        this._day = v === ymd(new Date()) ? 0 : v === ymd(y) ? 1 : v; this._touch(); this._render();
      });
    }
    this._html = null;
    if (this._h) { this._fmtInit(); this._render(); }
  }
  _wire(r) {
    r.addEventListener('click', (e) => this._click(e));
    r.addEventListener('error', (e) => { if (e.target.tagName === 'IMG') e.target.remove(); }, true);   /* logo missing → initial */
  }
  set hass(h) {
    const first = !this._h; this._h = h; this.T = erT(h);
    if (first) this._fmtInit();
    if (first || (!this._unsub && !this._poll)) this._sub();
    if (this._poll) { const st = h.states[this._c.entity], k = st ? st.state + '|' + st.last_updated : ''; if (k !== this._pk) { this._pk = k; this._load(); } }
    if (!this._who) { const me = this._me(); if (me) this._who = me.name; }
    if (first) this._render();
  }
  connectedCallback() {
    if (this._h && !this._unsub && !this._poll) this._sub();
    this._ro = new ResizeObserver(() => { const n = this.getBoundingClientRect().width < 900; if (n !== this._nar) { this._nar = n; this.classList.toggle('nar', n); this._render(); } });
    this._ro.observe(this);
    this._iv = setInterval(() => {   /* wall tablet: reset the selection after a while without touch (not when the user is one of the people) */
      const lim = this._c.reset_after != null ? Number(this._c.reset_after) : 120;
      if (lim > 0 && Date.now() - (this._tT || 0) > lim * 1000 && (this._shop || this._amt || this._edt || this._qr || (this._who && !this._me()) || this._day !== 0)) {
        this._shop = null; this._amt = ''; this._day = 0; this._edt = null; this._qr = null; if (!this._me()) this._who = null;
      }
      if (this._h) this._render();
    }, 20000);
  }
  disconnectedCallback() {
    if (this._ro) this._ro.disconnect(); clearInterval(this._iv); if (this._pop) this._pop.close(); if (this._sp) this._sp.close();
    if (this._unsub) { const u = this._unsub; this._unsub = null; Promise.resolve(u).then((f) => { try { f(); } catch (e) { /* */ } }).catch(() => {}); }
  }
  /* number, currency and date formats from the HA language */
  _fmtInit() {
    const h = this._h, loc = (h.locale && h.locale.language) || h.language || navigator.language || 'en', cur = String(this._c.currency || 'EUR').toUpperCase();
    this._loc = loc;
    try { this._nf = new Intl.NumberFormat(loc, { style: 'currency', currency: cur }); } catch (e) { this._nf = new Intl.NumberFormat(loc, { style: 'currency', currency: 'EUR' }); }
    const parts = this._nf.formatToParts(1234.5);
    this._dec = (parts.find((p) => p.type === 'decimal') || { value: '.' }).value;
    this._sym = (parts.find((p) => p.type === 'currency') || { value: cur }).value;
  }
  _m(v) { return this._nf.format(Math.round(Math.abs(v) * 100) / 100); }
  _d(s, o) { return toDate(s).toLocaleDateString(this._loc, o || { weekday: 'short', day: 'numeric', month: 'short' }); }
  _me() {
    const u = this._h && this._h.user; if (!u) return null;
    const n = String(u.name || '').toLowerCase(), id = u.id;
    return this._ppl.find((p) => (p.user && (p.user === id || String(p.user).toLowerCase() === n)) || (!p.user && String(p.name).toLowerCase() === n)) || null;
  }
  _touch() { this._tT = Date.now(); }
  _sub() {
    const h = this._h; if (!h || !h.connection || !h.connection.subscribeMessage) { this._poll = true; this._load(); return; }
    try {
      const p = h.connection.subscribeMessage((m) => { this._set(m.items || []); }, { type: 'todo/item/subscribe', entity_id: this._c.entity });
      this._unsub = p;
      if (p && p.catch) p.catch(() => { this._unsub = null; this._poll = true; this._load(); });
    } catch (e) { this._poll = true; this._load(); }
  }
  async _load() {
    try {
      const en = this._c.entity, r = await this._h.callWS({ type: 'call_service', domain: 'todo', service: 'get_items', target: { entity_id: en }, service_data: { status: ['needs_action', 'completed'] }, return_response: true });
      this._set((r && r.response && r.response[en] && r.response[en].items) || []);
    } catch (e) { this._err = this.T.unreadable(this._c.entity, (e && e.message) || e); this._render(); }
  }
  _set(items) {
    this._err = ''; this._ent = []; this._aus = []; this._xs = []; this._ks = [];
    items.forEach((it) => {
      let m = null; try { m = JSON.parse(it.description || ''); } catch (e) { /* foreign item */ }
      if (m && m.e && Number(m.e.b) > 0 && m.e.d) this._ent.push({ ...m.e, b: Number(m.e.b), t: m.e.t || m.e.d, uid: it.uid });
      else if (m && m.a && m.a.t) this._aus.push({ ...m.a, uid: it.uid });
      else if (m && m.kasse && m.kasse.id && m.kasse.s) this._ks.push({ ...m.kasse, uid: it.uid });
      else if (m && m.shop && m.shop.name) this._xs.push({ name: String(m.shop.name), logo: m.shop.logo || '', color: m.shop.color || '', uid: it.uid });
    });
    this._render(); this._renderShop();
  }
  _scanOn() { const c = this._c; return c.scan != null ? c.scan !== false : !!(this._h && this._h.config && this._h.config.country === 'AT'); }
  _keypad() { const k = this._c.keypad; return k === true || k === 'on' ? true : k === false || k === 'off' ? false : !this._nar; }
  /* amount: digits and one decimal separator, at most 2 decimals */
  _clean(v) {
    const D = this._dec;
    let s = String(v || '').replace(/[.,]/g, D).replace(new RegExp(`[^\\d${D === '.' ? '\\.' : D}]`, 'g'), ''); const i = s.indexOf(D);
    if (i >= 0) s = s.slice(0, i + 1) + s.slice(i + 1).split(D).join('').slice(0, 2);
    s = s.replace(/^0+(?=\d)/, ''); return s.slice(0, 8);
  }
  _val() { const v = parseFloat(String(this._amt || '').replace(this._dec, '.')); return isNaN(v) ? 0 : v; }
  _amtStr(b) { return b.toFixed(2).replace('.', this._dec); }
  _ymd() { if (typeof this._day === 'string') return this._day; const d = new Date(); d.setDate(d.getDate() - this._day); return ymd(d); }
  _ok() { return this._val() > 0 && this._shop && (this._who || this._ppl.length < 2); }
  _btn() { const b = this.shadowRoot.getElementById('sv'); if (b) b.disabled = !this._ok(); }
  _say(t, ok) { this._msg = t; this._msgOk = !!ok; clearTimeout(this._mt); this._mt = setTimeout(() => { this._msg = ''; this._render(); }, 4000); this._render(); }
  _title(r) { return `${this.T.itemBuy} ${r.s} · ${this._m(r.b)}${r.p ? ' · ' + r.p : ''}`; }
  _call(service, data) { return this._h.callService('todo', service, { entity_id: this._c.entity, ...data }); }
  async _click(e) {
    const b = e.target.closest('[data-k],[data-shop],[data-who],[data-day],[data-save],[data-per],[data-nav],[data-row],[data-del],[data-chg],[data-cancel],[data-aus],[data-all],[data-pf],[data-ns],[data-ncol],[data-nsave],[data-ncancel],[data-nlx],[data-nsdel],[data-mv]'); if (!b) return;
    const d = b.dataset, T = this.T; this._touch();
    if (d.k != null) {
      const a = this._amt || '';
      this._amt = d.k === 'back' ? a.slice(0, -1) : d.k === 'c' ? '' : this._clean(a + (d.k === 'dec' ? this._dec : d.k)); if (d.k === 'c') this._qr = null;
      this._render(); return;
    }
    if (d.shop != null) { this._shop = d.shop; this._render(); return; }
    if (d.who != null) { this._who = d.who; this._render(); return; }
    if (d.day != null) { this._day = Number(d.day); this._render(); return; }
    if (d.per != null) { this._per = d.per; this._off = 0; this._render(); return; }
    if (d.nav != null) { this._off = Math.min(0, (this._off || 0) + Number(d.nav)); this._render(); return; }
    if (d.row != null) { this._open = this._open === d.row ? null : d.row; this._render(); return; }
    if (d.ns != null) { this._openShop(); return; }
    if (d.ncol != null) { this._nc = d.ncol; this._renderShop(); return; }
    if (d.nlx != null) { this._nl = ''; this._renderShop(); return; }
    if (d.ncancel != null) { if (this._sp) this._sp.close(); return; }
    if (d.all != null) { this._pf = d.all || null; this._open = null; this._openAll(); return; }
    if (d.pf != null) { this._pf = d.pf || null; this._open = null; this._render(); return; }
    if (d.chg != null) {
      if (this._pop) this._pop.close();   /* edit an entry: load its values into the input */
      const r = (this._ent || []).find((x) => x.uid === d.chg); if (!r || r.uid.startsWith('tmp')) return;
      const y = new Date(); y.setDate(y.getDate() - 1);
      this._edt = r.uid; this._open = null; this._amt = this._amtStr(r.b); this._shop = r.s; this._who = r.p || this._who;
      this._day = r.d === ymd(new Date()) ? 0 : r.d === ymd(y) ? 1 : r.d;
      this._render(); const el = this.shadowRoot.querySelector('.amt'); if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (d.cancel != null) { this._edt = null; this._qr = null; this._amt = ''; this._shop = null; this._day = 0; this._render(); return; }
    try {
      if (d.save != null) {
        if (!this._ok()) { this._say(!(this._val() > 0) ? T.enterAmount : !this._shop ? T.pickShop : T.pickWho); return; }
        const p = this._who || (this._ppl[0] || {}).name || '', r = { s: this._shop, b: Math.round(this._val() * 100) / 100, p, d: this._ymd(), t: new Date().toISOString() };
        const old = this._edt && (this._ent || []).find((x) => x.uid === this._edt); this._edt = null;
        if (old) {   /* edited entry keeps its time (counts the same for the settle-up) */
          r.t = old.t; if (old.q) r.q = old.q; Object.assign(old, r); this._amt = ''; this._shop = null; this._day = 0;
          const el = this.shadowRoot.getElementById('amt'); if (el) el.blur();
          this._say(T.changed(this._m(r.b), r.s), true);
          await this._call('update_item', { item: old.uid, rename: this._title(r), description: JSON.stringify({ e: r }) });
          if (this._poll) this._load();
          return;
        }
        const qr = this._qr; this._qr = null; if (qr) r.q = qr.q;
        (this._ent = this._ent || []).push({ ...r, uid: 'tmp' + Date.now() });
        this._amt = ''; this._shop = null; this._day = 0;
        const el = this.shadowRoot.getElementById('amt'); if (el) el.blur();
        this._say(T.saved(this._m(r.b), r.s), true);
        await this._call('add_item', { item: this._title(r), description: JSON.stringify({ e: r }) });
        if (qr && qr.kid && r.s !== this._oth().name) {   /* remember (or correct) the shop for this till */
          const k = (this._ks || []).find((x) => x.id === qr.kid), kasse = { id: qr.kid, z: qr.z, s: r.s };
          if (!k) { (this._ks = this._ks || []).push({ ...kasse, uid: 'tmp' }); await this._call('add_item', { item: `${T.itemTill}: ${qr.kid} → ${r.s}`, description: JSON.stringify({ kasse }) }); }
          else if (k.s !== r.s && k.uid !== 'tmp') { k.s = r.s; await this._call('update_item', { item: k.uid, rename: `${T.itemTill}: ${qr.kid} → ${r.s}`, description: JSON.stringify({ kasse }) }); }
        }
      } else if (d.nsave != null) {
        const nm = String(this._nn || '').trim().slice(0, 24);
        if (!nm) { this._nerr = T.nameMissing; this._renderShop(); return; }
        if (this._sh().some((x) => x.name.toLowerCase() === nm.toLowerCase())) { this._nerr = T.exists(nm); this._renderShop(); return; }
        const shop = { name: nm, logo: this._nl || '', color: this._nc };
        (this._xs = this._xs || []).push({ ...shop, uid: 'tmp' + Date.now() }); this._shop = nm;
        this._nn = ''; this._nl = ''; this._nerr = ''; this._render(); this._renderShop();
        this._say(T.shopAdded(nm), true);
        await this._call('add_item', { item: `${T.itemShop}: ${nm}`, description: JSON.stringify({ shop }) });
      } else if (d.nsdel != null) {
        const x = (this._xs || []).find((y) => y.uid === d.nsdel); if (!x || x.uid.startsWith('tmp')) return;
        if (this._nsd !== x.uid) { this._nsd = x.uid; this._renderShop(); return; }   /* tap twice */
        this._nsd = null; this._xs = this._xs.filter((y) => y !== x); if (this._shop === x.name) this._shop = null; this._render(); this._renderShop();
        await this._call('remove_item', { item: x.uid });
      } else if (d.mv != null) {   /* Other → assign to a shop */
        const r = (this._ent || []).find((x) => x.uid === d.u); if (!r || r.uid.startsWith('tmp')) return;
        r.s = d.mv; this._open = null; this._render();
        const e2 = { s: r.s, b: r.b, p: r.p, d: r.d, t: r.t, q: r.q };
        await this._call('update_item', { item: r.uid, rename: this._title(r), description: JSON.stringify({ e: e2 }) });
        this._say(T.moved(this._m(r.b), r.s), true);
      } else if (d.del != null) {
        const r = (this._ent || []).find((x) => x.uid === d.del); if (!r || r.uid.startsWith('tmp')) return;
        this._ent = this._ent.filter((x) => x !== r); this._open = null; if (this._edt === r.uid) { this._edt = null; this._amt = ''; this._shop = null; this._day = 0; } this._render();
        await this._call('remove_item', { item: r.uid });
        this._say(T.deleted(this._m(r.b), r.s), true);
      } else if (d.aus != null) {
        if (!(this._cf > Date.now())) { this._cf = Date.now() + 5000; this._render(); setTimeout(() => this._render(), 5100); return; }   /* tap twice */
        this._cf = 0; const B = this._bal(); if (!B || !B.lead) return;
        const a = { t: new Date().toISOString(), d: ymd(new Date()), von: B.low, an: B.lead, b: Math.round(B.diff / 2 * 100) / 100 };
        (this._aus = this._aus || []).push({ ...a, uid: 'tmp' }); this._render();
        await this._call('add_item', { item: `${T.itemSettle} · ${a.von} → ${a.an} ${this._m(a.b)}`, description: JSON.stringify({ a }) });
        this._say(T.settled, true);
      }
    } catch (er) { this._say(T.failed((er && er.message) || er)); }
    if (this._poll) this._load();
  }
  /* shop for a till: same till id, else same certificate (if unique) */
  _kasse(kid, z) {
    const K = this._ks || [], a = K.find((x) => x.id === kid); if (a) return a.s;
    const b = z ? [...new Set(K.filter((x) => x.z === z).map((x) => x.s))] : []; return b.length === 1 ? b[0] : null;
  }
  _ocrOn() { return this._c.ocr !== false; }
  async _scan(file) {
    const T = this.T;
    if (this._scanning) return; this._scanning = true; this._touch(); this._msg = T.reading; this._msgOk = true; this._render();
    try {
      const all = await erReadBon(file, this._c.qr_lib || ER_BASE + 'jsQR.js', T);
      const qt = all.find(erRksv), q = qt ? erRksv(qt) : null, bt = q ? null : all.find(erBar), bc = bt ? erBar(bt) : null;
      if (!q && !bc) {
        if (!this._ocrOn()) { this._say(all.length ? T.notReceipt : T.noCode); return; }
        this._edt = null; this._open = null; this._amt = ''; this._day = 0; this._qr = { ocr: 'run', none: true };
        this._msg = T.noCodeOcr; this._msgOk = true; this._ocr(file, this._qr); return;
      }
      if (q && !(q.b > 0)) { this._say(T.voidReceipt((q.b < 0 ? '−' : '') + this._m(q.b))); return; }
      const R0 = q || bc, key = R0.kid + '/' + R0.nr, dup = (this._ent || []).find((r) => r.q === key);
      if (dup) { this._say(T.dup(this._m(dup.b), dup.s, this._d(dup.d, { day: 'numeric', month: 'numeric' }))); return; }
      const y = new Date(), shop = this._kasse(R0.kid, q ? q.z : 'BC'); y.setDate(y.getDate() - 1);
      this._edt = null; this._open = null; this._amt = q ? this._amtStr(q.b) : '';
      this._day = R0.d === ymd(new Date()) ? 0 : R0.d === ymd(y) ? 1 : R0.d;
      this._shop = shop && this._sh().some((x) => x.name === shop) ? shop : null;
      this._qr = { q: key, kid: R0.kid, z: q ? q.z : 'BC', known: !!this._shop, bar: !q, ocr: !q && this._ocrOn() ? 'run' : null };
      const dt = this._d(R0.d, { day: 'numeric', month: 'numeric' });
      if (q) this._say(T.qrRead(this._m(q.b), this._shop), true);
      else if (this._qr.ocr) { this._msg = T.barRead(dt, this._shop) + ' – ' + T.ocrRun; this._msgOk = true; this._ocr(file, this._qr); }
      else {
        this._say(T.barRead(dt, this._shop) + T.barTypeIn(this._shop), true);
        if (this._nar) setTimeout(() => { const el = this.shadowRoot.getElementById('amt'); if (el) el.focus(); }, 50);
      }
    } catch (er) { this._say(T.unreadableBon((er && er.message) || er)); }
    finally { this._scanning = false; this._render(); }
  }
  /* read the total with text recognition; only filled in when it matches the VAT table and nothing was typed yet */
  async _ocr(file, tok) {
    const T = this.T; let b = null, err = '';
    try { b = erSumme(await erOcr(file, this._c.ocr_path || ER_BASE, T)); } catch (e) { err = (e && e.message) || String(e); }
    if (this._qr !== tok) return;   /* cancelled, saved or new receipt meanwhile */
    const shopTxt = this._shop ? '' : T.and + T.pickShopRem(tok.none), chk = (this._shop ? '' : T.pickShopRem(tok.none) + ', ') + (tok.none ? T.checkDay : '');
    if (b && !this._amt) {
      tok.ocr = 'ok'; this._amt = this._amtStr(b);
      this._say(T.sumOk(this._m(b), chk), true);
    } else {
      tok.ocr = 'no'; if (tok.none && !this._amt) this._qr = null;
      this._say(err ? T.sumErr(err, shopTxt) : T.sumUnsure(shopTxt), !err);
      if (this._nar && !this._amt) setTimeout(() => { const el = this.shadowRoot.getElementById('amt'); if (el) el.focus(); }, 50);
    }
    this._btn(); this._render();
  }
  /* period: week/month/year, off = periods back → [start, end) as YYYY-MM-DD */
  _range(per, off) {
    const n = new Date(); let a, z;
    if (per === 'w') { a = monday(n); a.setDate(a.getDate() + off * 7); z = new Date(a); z.setDate(z.getDate() + 7); }
    else if (per === 'y') { a = new Date(n.getFullYear() + off, 0, 1); z = new Date(n.getFullYear() + off + 1, 0, 1); }
    else { a = new Date(n.getFullYear(), n.getMonth() + off, 1); z = new Date(n.getFullYear(), n.getMonth() + off + 1, 1); }
    return { a: ymd(a), z: ymd(z), A: a, Z: z };
  }
  _sum(R) { return (this._ent || []).filter((r) => r.d >= R.a && r.d < R.z).reduce((s, r) => s + r.b, 0); }
  /* settle-up since the last "settled" (only with exactly two people) */
  _bal() {
    if (this._ppl.length !== 2) return null;
    const last = (this._aus || []).slice().sort((x, y) => (x.t < y.t ? -1 : 1)).pop() || null;
    const E = (this._ent || []).filter((r) => !last || r.t > last.t).sort((x, y) => (x.d === y.d ? (x.t < y.t ? -1 : 1) : x.d < y.d ? -1 : 1));
    const [p0, p1] = this._ppl.map((p) => p.name), S = { [p0]: 0, [p1]: 0 };
    E.forEach((r) => { if (r.p in S) S[r.p] += r.b; });
    const diff = Math.abs(S[p0] - S[p1]), lead = diff < 0.005 ? null : S[p0] > S[p1] ? p0 : p1, low = lead === p0 ? p1 : p0;
    let mark = null;   /* marker day: up to here the leading person spent as much as the other in total */
    if (lead && S[low] > 0) { let c = 0; for (const r of E) { if (r.p !== lead) continue; c += r.b; if (c >= S[low] - 0.005) { mark = r.d; break; } } }
    return { last, E, T: S, diff, lead, low, mark, p0, p1 };
  }
  /* "Other" = shop marked other: true, else added automatically; shops = configured + own (before Other) */
  _oth() {
    const o = this._shops.find((x) => x.other);
    if (o) return o;
    if (!this._autoOth || this._autoOth.name !== this.T.other) this._autoOth = { name: this.T.other, color: OTHER_COLOR, other: true, auto: true };
    return this._autoOth;
  }
  _sh() {
    const o = this._oth(), b = this._shops.filter((x) => x !== o), low = (n) => String(n).toLowerCase();
    const own = (this._xs || []).filter((x) => !b.some((y) => low(y.name) === low(x.name)) && low(x.name) !== low(o.name)).map((x, i) => ({ ...x, own: true, color: x.color || PAL[(i + 3) % PAL.length] }));
    return [...b, ...own, o];
  }
  _logo(s, sm) {
    const o = this._sh().find((x) => x.name === s) || { name: s }, cls = `lg${sm ? ' s' : ''}`;
    if (!o.logo) return o !== this._oth() && o.color ? `<span class="${cls} no" style="background:${esc(o.color)};color:${onColor(o.color)}">${esc(String(o.name).charAt(0))}</span>` : `<span class="${cls} no">${CART}</span>`;
    return `<span class="${cls}">${esc(String(o.name).charAt(0))}<img src="${esc(o.logo)}" alt=""></span>`;
  }
  /* does the purchase belong to the shop? Unknown (deleted) shops count as Other */
  _inShop(r, n) {
    if (r.s === n) return true;
    const o = this._oth(); return o.name === n && !this._sh().some((x) => x.name === r.s);
  }
  /* dialog "New shop" */
  _openShop() {
    if (this._sp) return;
    const T = this.T;
    this._nn = ''; this._nl = ''; this._nc = PAL[(this._sh().length + 2) % PAL.length]; this._nsd = null; this._nerr = '';
    const o = this._sp = erDialog({ title: T.shops, sub: T.ownShop, close: T.close, width: 520, timeout: 180, onClose: () => { this._sp = null; } });
    const host = document.createElement('div'), r = host.attachShadow({ mode: 'open' });
    r.innerHTML = `<style>${ER_CSS}</style><div id="b"></div>`;
    this._wire(r);
    r.addEventListener('input', (e) => { if (e.target.id === 'nn') { this._nn = e.target.value; this._nerr = ''; } });
    r.addEventListener('change', async (e) => {
      if (e.target.id !== 'nf' || !e.target.files || !e.target.files[0]) return;
      try { this._nl = await erImg(e.target.files[0], T); this._nerr = ''; } catch (er) { this._nerr = (er && er.message) || String(er); }
      this._renderShop();
    });
    o.body.appendChild(host); o._b = r.getElementById('b');
    this._renderShop();
  }
  _renderShop() {
    const o = this._sp; if (!o || !o._b) return;
    const T = this.T, nm = this._nn || '', lg = this._nl ? `<span class="lg"><img src="${this._nl}" alt=""></span>` : `<span class="lg no" style="background:${esc(this._nc)};color:${onColor(this._nc)}">${esc(nm.charAt(0) || '?')}</span>`;
    const own = this._sh().filter((x) => x.own);
    o._b.innerHTML = `<div class="ns"><div class="tg">${T.nameL}</div><input id="nn" type="text" maxlength="24" placeholder="${esc(T.namePh)}" value="${esc(nm)}" autocomplete="off">
      <div class="tg">${T.logo}</div><div class="nl">${lg}<label class="bt fp" style="margin-left:0">${T.pickImg}<input id="nf" type="file" accept="image/*"></label>${this._nl ? `<button class="bt" style="margin-left:0" data-nlx>${T.rmLogo}</button>` : ''}</div>
      <div class="tg">${T.barColor}</div><div class="cl">${PAL.map((c) => `<button class="${c === this._nc ? 'on' : ''}" style="background:${c}" data-ncol="${c}" aria-label="${T.color} ${c}"></button>`).join('')}</div>
      ${this._nerr ? `<div class="err">${esc(this._nerr)}</div>` : ''}
      <div class="eb"><button class="sv" data-nsave>${T.saveShop}</button><button class="cn" data-ncancel>${T.close}</button></div>
      ${own.length ? `<div class="tg">${T.ownShops}</div><div class="ls">${own.map((x) => `<div class="row" style="grid-template-columns:34px minmax(0,1fr) auto">${this._logo(x.name)}<span>${esc(x.name)}</span><button class="del" data-nsdel="${esc(x.uid)}">${this._nsd === x.uid ? T.reallyDel : T.del}</button></div>`).join('')}</div><div class="last">${esc(T.delHint(this._oth().name))}</div>` : ''}</div>`;
  }
  /* dialog: all purchases in the selected period */
  _openAll() {
    if (this._pop) { this._render(); return; }
    const o = this._pop = erDialog({ title: this.T.purchases, close: this.T.close, width: 680, timeout: 120, onClose: () => { this._pop = null; this._pf = null; this._open = null; } });
    const host = document.createElement('div'), r = host.attachShadow({ mode: 'open' });
    r.innerHTML = `<style>${ER_CSS}</style><div id="b"></div>`;
    this._wire(r);
    o.body.appendChild(host); o._b = r.getElementById('b'); o._html = null;
    this._render();
  }
  _chart(B) {
    const today = ymd(new Date()), d0 = B.last ? B.last.d : B.E[0].d, t0 = toDate(d0), n = Math.max(1, Math.round((toDate(today) - t0) / 864e5));
    const W = 340, H = 118, L = 4, R = 4, Tp = 12, Bt = 20, cols = this._ppl.map((p) => p.color);
    const mx = Math.max(1, B.T[B.p0], B.T[B.p1]) * 1.08, x = (d) => L + Math.round((toDate(d) - t0) / 864e5) / n * (W - L - R), y = (v) => Tp + (1 - v / mx) * (H - Tp - Bt);
    const line = (p) => { let c = 0, s = `M${L},${y(0).toFixed(1)}`; B.E.filter((r) => r.p === p).forEach((r) => { c += r.b; s += `H${x(r.d).toFixed(1)}V${y(c).toFixed(1)}`; }); return s + `H${W - R}`; };
    let g = [0, 0.5, 1].map((f) => `<line class="gl" x1="${L}" x2="${W - R}" y1="${y(mx / 1.08 * f).toFixed(1)}" y2="${y(mx / 1.08 * f).toFixed(1)}"/>`).join('');
    if (B.mark) { const m = x(B.mark).toFixed(1); g += `<rect class="mkb" x="${m}" y="${Tp}" width="${(W - R - m).toFixed(1)}" height="${H - Tp - Bt}"/>`; }
    g += `<path d="${line(B.p1)}" stroke="${esc(cols[1])}" stroke-width="2.2"/><path d="${line(B.p0)}" stroke="${esc(cols[0])}" stroke-width="2.2"/>`;
    if (B.mark) {
      const m = x(B.mark), lab = this._d(B.mark, { day: 'numeric', month: 'numeric' }) + ' ' + this.T.evenMark;
      g += `<line class="mk" x1="${m.toFixed(1)}" x2="${m.toFixed(1)}" y1="${Tp - 6}" y2="${H - Bt}" stroke-width="1.5" stroke-dasharray="3 3"/><circle class="mkf" cx="${m.toFixed(1)}" cy="${y(B.T[B.low]).toFixed(1)}" r="4.5"/>`;
      g += `<text class="mt" x="${(m > W / 2 ? m - 6 : m + 6).toFixed(1)}" y="${Tp + 2}" text-anchor="${m > W / 2 ? 'end' : 'start'}">${esc(lab)}</text>`;
    }
    g += `<text x="${L}" y="${H - 5}">${esc(this._d(d0, { day: 'numeric', month: 'numeric' }))}</text><text x="${W - R}" y="${H - 5}" text-anchor="end">${esc(this.T.today)}</text>`;
    return `<svg class="cv" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(this.T.chartLabel)}">${g}</svg>`;
  }
  _render() {
    const b = this.shadowRoot && this.shadowRoot.getElementById('b'); if (!b || !this._h || !this._nf) return;
    const c = this._c, h = this._h, T = this.T, nar = !!this._nar, kp = this._keypad(), E = (this._ent || []).slice().sort((x, y) => (x.d === y.d ? (x.t < y.t ? 1 : -1) : x.d < y.d ? 1 : -1));
    const pc = (n) => (this._ppl.find((p) => p.name === n) || {}).color || '#8a97a8';
    const av = (n) => `<span class="av" style="background:${esc(pc(n))};color:${onColor(pc(n))}">${esc(String(n).charAt(0))}</span>`;
    /* left: add a purchase */
    const day = this._ymd(), cust = typeof this._day === 'string' && this._day !== ymd(new Date());
    let L = `<h2>🧾 ${this._edt ? T.edit : T.purchase}<div class="days"><button class="ch${this._day === 0 ? ' on' : ''}" data-day="0">${T.today}</button><button class="ch${this._day === 1 ? ' on' : ''}" data-day="1">${T.yesterday}</button><label class="ch dp${cust ? ' on' : ''}">${cust ? esc(this._d(day, { day: 'numeric', month: 'numeric' })) : '📅'}<input id="dd" type="date" max="${ymd(new Date())}" value="${day}" aria-label="${esc(T.otherDay)}"></label></div></h2>`;
    if (!h.states[c.entity]) L += `<div class="err">${T.missing(esc(c.entity))}</div>`;
    else if (this._err) L += `<div class="err">${esc(this._err)}</div>`;
    const scan = this._scanOn() ? `<label class="qr${this._scanning ? ' bz' : ''}" aria-label="${esc(T.scanLabel)}">${T.scan}<input id="qf" type="file" accept="image/*" capture="environment"></label>` : '';
    L += `<div class="amt${scan ? ' sc' : ''}">${scan}<input id="amt" type="text" inputmode="${kp ? 'none' : 'decimal'}" placeholder="${this._amtStr(0)}" value="${esc(this._amt || '')}" aria-label="${esc(T.amount)}" autocomplete="off"><span>${esc(this._sym)}</span></div>`;
    const qo = this._qr && this._qr.ocr, qs = qo === 'run' ? T.qsRun : qo === 'ok' ? T.qsOk : T.qsType;
    if (this._qr && this._qr.none) L += `<div class="qh nw">🧾 ${T.qhNone} · ${qs}</div>`;
    else if (this._qr) L += `<div class="qh${this._qr.known ? '' : ' nw'}">🧾 ${this._qr.bar ? T.qhBar + ' · ' + qs : T.qhQr} · ${this._qr.known ? T.qhKnown : T.qhNew}</div>`;
    L += `<div class="tg">${T.shop}</div><div class="sh">${this._sh().map((s) => `<button class="sb${this._shop === s.name ? ' on' : ''}" data-shop="${esc(s.name)}">${this._logo(s.name)}<span>${esc(s.name)}</span></button>`).join('')}${c.add_shops === false ? '' : `<button class="sb nw" data-ns aria-label="${esc(T.newShop)}">＋</button>`}</div>`;
    if (this._ppl.length > 1) L += `<div class="tg">${T.paidBy}</div><div class="who">${this._ppl.map((p) => `<button class="wb${this._who === p.name ? ' on' : ''}" data-who="${esc(p.name)}">${av(p.name)}${esc(p.name)}</button>`).join('')}</div>`;
    const ed = !!this._edt, sv = `<button class="sv${ed ? ' e' : ''}" id="sv" data-save${this._ok() ? '' : ' disabled'}>${ed ? T.saveEdit : T.save}</button>`, cn = ed ? `<button class="cn" data-cancel>${T.cancel}</button>` : '';
    L += !kp ? (ed ? `<div class="eb">${sv}${cn}</div>` : sv) : `<div class="pad">${['7', '8', '9'].map((k) => `<button data-k="${k}">${k}</button>`).join('')}<button class="f" data-k="back" aria-label="${esc(T.clear)}">⌫</button>${['4', '5', '6'].map((k) => `<button data-k="${k}">${k}</button>`).join('')}<button class="f" data-k="c">C</button>${['1', '2', '3'].map((k) => `<button data-k="${k}">${k}</button>`).join('')}<button data-k="dec">${esc(this._dec)}</button><button data-k="0">0</button>${sv}${cn}</div>`;
    L += `<div class="msg${this._msgOk ? ' ok' : ''}">${esc(this._msg || '')}</div>`;
    /* middle: spending per shop */
    const per = this._per, off = this._off || 0, R = this._range(per, off), P = this._range(per, off - 1), tot = this._sum(R), prev = this._sum(P);
    const lastDay = new Date(R.Z - 864e5), dm = (d) => d.toLocaleDateString(this._loc, { day: 'numeric', month: 'numeric' });
    const cur = off === 0, lab = per === 'w' ? `${T.wk} ${isoWeek(R.A)} · ${dm(R.A)}–${dm(lastDay)}`
      : per === 'y' ? String(R.A.getFullYear()) : R.A.toLocaleDateString(this._loc, { month: 'long', year: 'numeric' });
    const rows = this._sh().map((s) => { const a = (this._ent || []).filter((r) => r.d >= R.a && r.d < R.z && this._inShop(r, s.name)); return { s, n: a.length, v: a.reduce((x, r) => x + r.b, 0) }; });
    rows.sort((x, y) => y.v - x.v); const mx = Math.max(1, ...rows.map((x) => x.v));
    const seg = `<div class="nv"><button class="arr" data-nav="-1" aria-label="${esc(T.back)}">‹</button><div class="seg">${[['w', T.week], ['m', T.month], ['y', T.year]].map(([k, t]) => `<button class="${per === k ? 'on' : ''}" data-per="${k}">${t}</button>`).join('')}</div><button class="arr" data-nav="1" aria-label="${esc(T.fwd)}"${cur ? ' disabled' : ''}>›</button></div>`;
    let M = `<h2>📊 ${T.spend}<small>${T.perShop}</small></h2>${seg}`;
    M += `<button class="tot" data-all="" aria-label="${esc(T.allInPeriod)}"><b>${this._m(tot)}</b><span>${esc(lab)}${cur ? ' · ' + T.untilToday : ''}</span><em>${T.prev[per]} ${this._m(prev)}</em></button>`;
    M += `<div class="bars">${rows.map((x) => `<button class="bar${x.v ? '' : ' z'}" data-all="${esc(x.s.name)}">${this._logo(x.s.name, true)}<span>${esc(x.s.name)}<small>${T.nBuys(x.n)}</small></span><div class="t"><u style="width:${(x.v / mx * 100).toFixed(1)}%;background:${esc(x.s.color)}"></u></div><em>${x.v ? this._m(x.v) : '–'}<small>${tot ? Math.round(x.v / tot * 100) + ' %' : ''}</small></em></button>`).join('')}</div>`;
    M += `<div class="mini">${[['w', T.thisW], ['m', T.thisM], ['y', T.thisY]].map(([k, t]) => `<button class="${per === k && cur ? 'on' : ''}" data-per="${k}">${t}<b>${this._m(this._sum(this._range(k, 0)))}</b></button>`).join('')}</div>`;
    /* right: settle-up + recent purchases */
    const B = this._bal();
    let Rt = '';
    if (B) {
      const since = B.last ? this._d(B.last.d, { day: 'numeric', month: 'short' }) : B.E.length ? this._d(B.E[0].d, { day: 'numeric', month: 'short' }) : '';
      Rt += `<h2>⚖️ ${T.settle}<small>${since ? esc(T.since(since)) : ''}</small></h2>`;
      if (!B.E.length) Rt += `<div class="bal eq"><span class="m">${T.allSettled}</span><span class="l">${T.noneSince}</span></div>`;
      else if (!B.lead) Rt += `<div class="bal eq"><span class="m">${T.even}</span><span class="l">${esc(T.bothPaid(this._m(B.T[B.p0])))}</span></div>`;
      else {
        const conf = this._cf > Date.now();
        Rt += `<div class="bal"><span class="m">📍 ${esc(B.mark ? T.evenUntil(this._d(B.mark, { weekday: 'short', day: 'numeric', month: 'short' })) : T.onlyPaid(B.lead))}</span><span class="l">${esc(T.ahead(B.lead, this._m(B.diff)))}</span>`
          + `<span class="r"><span>${esc(T.owes(B.low, this._m(B.diff / 2)))}</span><button class="bt${conf ? ' cf' : ''}" data-aus>${conf ? T.sure : T.settleBtn}</button></span></div>`;
      }
      if (B.E.length) Rt += this._chart(B) + `<div class="lgd">${[B.p0, B.p1].map((p) => `<span><i style="background:${esc(pc(p))}"></i>${esc(p)} ${this._m(B.T[p])}</span>`).join('')}</div>`;
      if (B.last) Rt += `<div class="last">${esc(T.lastSettle(this._d(B.last.d, { day: 'numeric', month: 'numeric', year: 'numeric' })))}${B.last.von ? ' · ' + esc(B.last.von) + ' → ' + esc(B.last.an) + ' ' + this._m(B.last.b || 0) : ''}</div>`;
    }
    const nL = Number(c.recent) || (nar ? 8 : 4);
    const oth = this._oth();
    const row = (r, long) => {
      const op = this._open === r.uid, dt = esc(this._d(r.d, { weekday: 'short' })) + '<br>' + esc(this._d(r.d, long ? { day: 'numeric', month: 'numeric', year: '2-digit' } : { day: 'numeric', month: 'numeric' }));
      return `<button class="row${op ? ' op' : ''}${this._edt === r.uid ? ' ed' : ''}" data-row="${esc(r.uid)}"><span class="d">${dt}</span>${this._logo(r.s, true)}<span>${esc(r.s)}</span><b>${this._m(r.b)}</b>${op ? `<span class="acts"><span class="chg" data-chg="${esc(r.uid)}">${T.edit}</span><span class="del" data-del="${esc(r.uid)}">${T.del}</span></span>` : r.p && this._ppl.length > 1 ? av(r.p) : '<span></span>'}</button>`
        + (op && this._inShop(r, oth.name) && this._sh().length > 1 ? `<div class="mv">${T.assign}${this._sh().filter((x) => x !== oth).map((x) => `<button data-mv="${esc(x.name)}" data-u="${esc(r.uid)}" aria-label="${esc(x.name)}" title="${esc(x.name)}">${this._logo(x.name, true)}</button>`).join('')}</div>` : '');
    };
    Rt += `<div class="lh"><span class="tg">${T.recent}</span>${E.length ? `<button class="al" data-all="">${T.all}</button>` : ''}</div><div class="ls">${E.length ? E.slice(0, nL).map((r) => row(r)).join('') : `<div class="none">${T.noBuys}</div>`}</div>`;
    const html = `<div class="w"><div class="g">${L}</div><div class="g">${M}</div><div class="g">${Rt}</div></div>`;
    const PO = this._pop;
    if (PO && PO._b) {
      const inR = E.filter((r) => r.d >= R.a && r.d < R.z), sel = this._pf, list = sel ? inR.filter((r) => this._inShop(r, sel)) : inR, sum = list.reduce((x, r) => x + r.b, 0);
      const fl = this._sh().map((s) => ({ s, n: inR.filter((r) => this._inShop(r, s.name)).length })).filter((x) => x.n);
      let ph = seg;
      ph += `<div class="tot"><b>${this._m(sum)}</b><span>${esc(lab)}${sel ? ' · ' + esc(sel) : ''} · ${T.nBuys(list.length)}</span></div>`;
      if (this._ppl.length > 1 && list.length) ph += `<div class="ps">${this._ppl.map((p) => `<span>${av(p.name)} ${esc(p.name)} <b>${this._m(list.filter((r) => r.p === p.name).reduce((x, r) => x + r.b, 0))}</b></span>`).join('')}</div>`;
      if (fl.length > 1 || sel) ph += `<div class="fl"><button class="ch a${sel ? '' : ' on'}" data-pf="">${T.allF}</button>${fl.map((x) => `<button class="ch${sel === x.s.name ? ' on' : ''}" data-pf="${esc(x.s.name)}">${this._logo(x.s.name, true)}${esc(x.s.name)} · ${x.n}</button>`).join('')}</div>`;
      ph += `<div class="ls">${list.length ? list.map((r) => row(r, true)).join('') : `<div class="none">${T.noBuysPeriod}</div>`}</div>`;
      ph = `<div class="pp">${ph}</div>`;
      if (ph !== PO._html) { PO._html = ph; PO._b.innerHTML = ph; }
    }
    if (html !== this._html) {
      const foc = this.shadowRoot.activeElement && this.shadowRoot.activeElement.id;
      this._html = html; b.innerHTML = html;
      if (foc === 'amt') { const el = this.shadowRoot.getElementById('amt'); if (el) { el.focus(); const n = el.value.length; try { el.setSelectionRange(n, n); } catch (e) { /* */ } } }
    }
  }
  getCardSize() { return 10; }
  getGridOptions() { return { columns: 'full', rows: 'auto', min_columns: 6 }; }
}

/* ===== Visual card editor ===== */
class EinkaufsrechnerCardEditor extends HTMLElement {
  setConfig(c) { this._c = { ...c }; if (!this._built) this._build(); else this._fill(); }
  set hass(h) { this._h = h; this.T = erT(h); if (this._form) this._form.hass = h; if (!this._built && this._c) this._build(); }
  _emit() { this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._c }, bubbles: true, composed: true })); }
  _build() {
    if (!this._c || !this._h) return;
    this._built = true; const T = this.T = erT(this._h);
    const r = this.shadowRoot || this.attachShadow({ mode: 'open' });
    r.innerHTML = `<style>
      :host{display:block}.sec{margin-top:18px}.sec h3{margin:0 0 4px;font-size:15px;font-weight:600}.hint{font-size:12.5px;color:var(--secondary-text-color);margin:0 0 8px}
      .it{display:grid;gap:6px;align-items:center;margin-bottom:6px}.it.p{grid-template-columns:minmax(0,1fr) minmax(0,1fr) 40px auto auto}.it.s{grid-template-columns:minmax(0,1fr) minmax(0,1.4fr) 40px auto auto}
      input[type=text]{font:inherit;font-size:14px;padding:9px 10px;border-radius:8px;border:1px solid var(--divider-color,#ccc);background:var(--card-background-color,#fff);color:var(--primary-text-color);min-width:0}
      input[type=color]{width:40px;height:38px;padding:2px;border:1px solid var(--divider-color,#ccc);border-radius:8px;background:none}
      button{font:inherit;font-size:13px;padding:8px 10px;border-radius:8px;border:1px solid var(--divider-color,#ccc);background:none;color:var(--primary-text-color);cursor:pointer}
      button.add{color:var(--primary-color);border-style:dashed}</style>
      <div id="f"></div>
      <div class="sec"><h3>${T.ePeople}</h3><p class="hint">${T.ePeopleHint}</p><div id="pl"></div><button class="add" data-add="people">${T.eAddP}</button></div>
      <div class="sec"><h3>${T.eShops}</h3><p class="hint">${T.eShopsHint}</p><div id="sl"></div><button class="add" data-add="shops">${T.eAddS}</button></div>`;
    const f = this._form = document.createElement('ha-form');
    f.hass = this._h;
    f.schema = [
      { name: 'entity', required: true, selector: { entity: { domain: 'todo' } } },
      { name: 'currency', selector: { text: {} } },
      { type: 'grid', name: '', schema: [{ name: 'scan', selector: { boolean: {} } }, { name: 'ocr', selector: { boolean: {} } }, { name: 'add_shops', selector: { boolean: {} } }] },
      { name: 'keypad', selector: { select: { mode: 'dropdown', options: [{ value: 'auto', label: T.kAuto }, { value: 'on', label: T.kOn }, { value: 'off', label: T.kOff }] } } },
      { type: 'grid', name: '', schema: [{ name: 'recent', selector: { number: { min: 0, max: 30, mode: 'box' } } }, { name: 'reset_after', selector: { number: { min: 0, max: 3600, mode: 'box' } } }] }
    ];
    const lab = { entity: T.eEntity, currency: T.eCurrency, scan: T.eScan, ocr: T.eOcr, add_shops: T.eAdd, keypad: T.eKeypad, recent: T.eRecent, reset_after: T.eReset };
    f.computeLabel = (s) => lab[s.name] || s.name;
    f.addEventListener('value-changed', (e) => {
      const v = { ...e.detail.value };
      if (v.keypad === 'auto') delete v.keypad;
      if (v.ocr === true) delete v.ocr; if (v.add_shops === true) delete v.add_shops; if (v.scan === this._scanDef()) delete v.scan;
      ['currency', 'recent', 'reset_after'].forEach((k) => { if (v[k] === '' || v[k] == null) delete v[k]; });
      this._c = { ...v, people: this._c.people, shops: this._c.shops };
      if (!this._c.people) delete this._c.people; if (!this._c.shops) delete this._c.shops;
      this._emit();
    });
    r.getElementById('f').appendChild(f);
    r.addEventListener('click', (e) => {
      const b = e.target.closest('[data-add],[data-rm],[data-up]'); if (!b) return;
      const d = b.dataset, key = d.add || d.list, L = this._list(key);
      if (d.add) L.push({ name: '' });
      else if (d.rm != null) L.splice(Number(d.rm), 1);
      else if (d.up != null && Number(d.up) > 0) { const i = Number(d.up); [L[i - 1], L[i]] = [L[i], L[i - 1]]; }
      this._setList(key, L); this._lists();
    });
    r.addEventListener('input', (e) => {   /* typing: update the config without rebuilding (keeps focus) */
      const t = e.target, key = t.dataset.list; if (!key) return;
      const L = this._list(key), i = Number(t.dataset.i), f2 = t.dataset.f; L[i] = { ...L[i], [f2]: t.value };
      if (!t.value && f2 !== 'name') delete L[i][f2];
      this._setList(key, L, true);
    });
    this._fill();
  }
  _list(key) { return (this._c[key] || []).map((x) => (typeof x === 'string' ? { name: x } : { ...x })); }
  _setList(key, L, quiet) {
    const clean = L.filter((x, i) => quiet || x.name || i === L.length - 1);
    this._c = { ...this._c, [key]: clean }; if (!clean.length) delete this._c[key];
    this._emit();
  }
  _fill() {
    if (!this._form) return;
    const c = this._c;
    this._form.data = { ...c, scan: c.scan != null ? c.scan !== false : this._scanDef(), ocr: c.ocr !== false, add_shops: c.add_shops !== false, keypad: c.keypad === true || c.keypad === 'on' ? 'on' : c.keypad === false || c.keypad === 'off' ? 'off' : 'auto' };
    this._lists();
  }
  _scanDef() { return !!(this._h && this._h.config && this._h.config.country === 'AT'); }
  _lists() {
    const r = this.shadowRoot, T = this.T; if (!r) return;
    const act = r.activeElement; if (act && act.dataset && act.dataset.list) return;   /* do not rebuild while typing */
    const row = (key, x, i, cls, f2, ph2) => `<div class="it ${cls}"><input type="text" data-list="${key}" data-i="${i}" data-f="name" placeholder="${esc(key === 'people' ? T.ePName : T.eSName)}" value="${esc(x.name || '')}">`
      + `<input type="text" data-list="${key}" data-i="${i}" data-f="${f2}" placeholder="${esc(ph2)}" value="${esc(x[f2] || '')}">`
      + `<input type="color" data-list="${key}" data-i="${i}" data-f="color" value="${esc(/^#[\da-f]{6}$/i.test(x.color || '') ? x.color : PAL[(key === 'people' ? i * 2 : i) % PAL.length])}" title="${esc(T.color)}">`
      + `<button data-list="${key}" data-up="${i}" title="${esc(T.eUp)}"${i ? '' : ' disabled'}>↑</button><button data-list="${key}" data-rm="${i}" title="${esc(T.eRm)}">✕</button></div>`;
    r.getElementById('pl').innerHTML = this._list('people').map((x, i) => row('people', x, i, 'p', 'user', T.ePUser)).join('');
    r.getElementById('sl').innerHTML = this._list('shops').map((x, i) => row('shops', x, i, 's', 'logo', T.eSLogo)).join('');
  }
}

if (!customElements.get('einkaufsrechner-card')) customElements.define('einkaufsrechner-card', EinkaufsrechnerCard);
if (!customElements.get('einkaufsrechner-card-editor')) customElements.define('einkaufsrechner-card-editor', EinkaufsrechnerCardEditor);
window.customCards = window.customCards || [];
if (!window.customCards.some((x) => x.type === 'einkaufsrechner-card')) {
  const T0 = ER_T[String(navigator.language || '').toLowerCase().startsWith('de') ? 'de' : 'en'];
  window.customCards.push({ type: 'einkaufsrechner-card', name: T0.name, description: T0.desc, preview: true, documentationURL: 'https://github.com/dproneg-commits/einkaufsrechner-card' });
}
