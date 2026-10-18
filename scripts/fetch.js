const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const BASE = 'https://www.sxmn.com.vn/';
const DATA = path.join(__dirname, '..', 'data');
const RESULTS = path.join(DATA, 'results');
const prizeMap = [
  ['G8', 'eighthPrize'], ['G7', 'seventhPrize'], ['G6', 'sixthPrize'],
  ['G5', 'fifthPrize'], ['G4', 'fourthPrize'], ['G3', 'thirdPrize'],
  ['G2', 'secondPrize'], ['G1', 'firstPrize'], ['ĐB', 'specialPrize'], ['DB', 'specialPrize']
];
const normalize = s => (s || '').replace(/\s+/g, ' ').trim();
const isoTodayVN = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

async function main() {
  const requestedDate = process.argv[2] || isoTodayVN();
  fs.mkdirSync(RESULTS, { recursive: true });
  const { data: html } = await axios.get(BASE, { timeout: 25000, headers: { 'User-Agent': 'VIP-XoSo-DataBot/1.0 (personal project)' } });
  const $ = cheerio.load(html);
  const dateText = requestedDate.split('-').reverse().join('/');
  let targetTable = null;
  // Only accept a result table when the requested date is present in its nearby heading.
  // This prevents yesterday's results from being mislabeled as today's.
  $('table').each((_, table) => {
    const txt = normalize($(table).text());
    if (!(txt.includes('G8') && (txt.includes('ĐB') || txt.includes('DB')))) return;
    const preceding = $(table).prevAll('h1,h2,h3,h4,p,div').slice(0, 5).text();
    const context = normalize(preceding + ' ' + $(table).parent().text().slice(0, 300));
    if (context.includes(dateText) && !targetTable) targetTable = table;
  });
  if (!targetTable) throw new Error(`Không tìm thấy bảng kết quả được gắn rõ ngày ${dateText}. Dừng để tránh lưu nhầm kết quả ngày khác.`);

  const table = $(targetTable);
  const rows = [];
  table.find('tr').each((_, tr) => {
    const cells = $(tr).find('th,td').map((__, td) => normalize($(td).text())).get();
    if (cells.length >= 2) rows.push(cells);
  });
  if (rows.length < 8) throw new Error('Bảng kết quả không đủ hàng; dừng để tránh lưu dữ liệu sai.');

  const prizeRows = new Map();
  let provinceNames = [];
  for (const row of rows) {
    const label = row[0].replace(/\s/g, '').toUpperCase();
    const match = prizeMap.find(([k]) => k.toUpperCase() === label || (k === 'ĐB' && label.includes('ĐB')));
    if (match) prizeRows.set(match[1], row.slice(1));
  }
  // Tên đài thường xuất hiện ở hàng tiêu đề; bỏ qua các hàng không nhận diện được.
  const header = rows.find(r => !prizeMap.some(([k]) => r[0].replace(/\s/g, '').toUpperCase() === k.toUpperCase()));
  if (header && header.length > 1) provinceNames = header.slice(1);
  if (!provinceNames.length) {
    // Một số phiên bản HTML có tiêu đề nằm ngoài bảng. Dừng an toàn thay vì đoán tên đài.
    throw new Error('Không nhận diện được tên các đài trong bảng. Không ghi dữ liệu để tránh nhầm đài.');
  }
  const results = provinceNames.map((province, idx) => {
    const prizes = {};
    for (const [key, values] of prizeRows.entries()) {
      const cell = values[idx] || '';
      const nums = cell.match(/\b\d{2,6}\b/g) || [];
      if (nums.length) prizes[key] = key === 'specialPrize' || key === 'firstPrize' || key === 'secondPrize' || key === 'fifthPrize' || key === 'seventhPrize' || key === 'eighthPrize' ? nums[0] : nums;
    }
    return { id: `${requestedDate}-${province}`, date: requestedDate, province, region: 'Miền Nam', prizes };
  }).filter(r => Object.keys(r.prizes).length >= 8);

  if (!results.length) throw new Error('Không trích xuất được kết quả hợp lệ; không ghi file.');
  const payload = { date: requestedDate, fetchedAt: new Date().toISOString(), source: BASE, results };
  fs.writeFileSync(path.join(RESULTS, `${requestedDate}.json`), JSON.stringify(payload, null, 2) + '\n');
  let dates = [];
  const indexPath = path.join(DATA, 'index.json');
  if (fs.existsSync(indexPath)) { try { dates = JSON.parse(fs.readFileSync(indexPath, 'utf8')).dates || []; } catch (_) {} }
  dates = [...new Set([requestedDate, ...dates])].sort().reverse();
  fs.writeFileSync(indexPath, JSON.stringify({ updatedAt: new Date().toISOString(), dates }, null, 2) + '\n');
  console.log(`Saved ${requestedDate}: ${results.length} provinces`);
}
main().catch(err => { console.error(err.message || err); process.exit(1); });
