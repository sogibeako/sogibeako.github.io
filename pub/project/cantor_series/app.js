'use strict';
const $ = id => document.getElementById(id);
let current;
function parameters() {
  const kind = $('kind').value;
  $('a-field').hidden = !['constant', 'exponential', 'linear', 'power'].includes(kind);
  $('b-field').hidden = kind !== 'linear'; $('list-field').hidden = kind !== 'cycle';
  $('a-label').textContent = { constant: '基数 b', exponential: '底 b', linear: '係数 A', power: '指数 k' }[kind] || '';
}
function render() {
  try {
    const seq = Cantor.sequence($('kind').value, $('a').value, $('b').value, $('bases').value);
    const result = Cantor.expand(Cantor.parse($('rational').value), seq, $('count').value);
    current = { result, seq }; $('error').hidden = true; $('results').style.opacity = '1';
    const { rows, value, whole, negative, terminated, repeat, remainder, product, sum } = result;
    $('status').textContent = terminated ? '有限展開' : repeat ? '循環を検出' : `${rows.length} 桁で打ち切り`;
    $('result-label').textContent = `x = ${Cantor.format(value.p, value.d)}　 /　 ${seq.label}`;
    $('digits').replaceChildren();
    const prefix = document.createElement('span'); prefix.className = 'integer'; prefix.textContent = `${negative ? '−(' : ''}${whole} + 0.`; $('digits').append(prefix);
    rows.forEach((row, i) => {
      const tile = document.createElement('span'); tile.className = 'digit' + (repeat && i >= repeat.start ? ' cyclic' : '');
      tile.title = `第 ${row.n} 桁: a = ${row.digit}, q = ${row.q}`;
      const b = document.createElement('b'); b.textContent = String(row.digit);
      const small = document.createElement('small'); small.textContent = `q=${row.q}`; small.style.overflowWrap = 'anywhere';
      tile.append(b, small); $('digits').append(tile);
    });
    const end = document.createElement('span'); end.className = 'integer'; end.textContent = `${!rows.length ? '0' : ''}${terminated ? '' : '…'}${negative ? ')' : ''}`; $('digits').append(end);
    $('notation').textContent = '枠 1 つが 1 桁。整数部分 + 小数部分として表示しています。';
    $('sum').textContent = Cantor.format(sum, product);
    $('tail').textContent = Cantor.format(remainder, value.d * product);
    $('conclusion').textContent = terminated ? `${rows.length} 桁で余りが 0 になりました。以後の桁はすべて 0 です。` : repeat ? `第 ${repeat.start + 1} 桁から ${repeat.length} 桁の周期を検出しました。緑色は循環部分です。` : 'この表示範囲では終了していません。打ち切りは、無限展開であることの判定ではありません。';
    $('rows').replaceChildren(); $('chart').replaceChildren();
    rows.forEach(row => {
      const tr = document.createElement('tr');
      rowValues(row, value.d).forEach(v => { const td = document.createElement('td'); td.textContent = v; tr.append(td); }); $('rows').append(tr);
      const cell = document.createElement('div'); cell.className = 'bar-cell'; cell.title = `第 ${row.n} 桁: ${row.digit} / ${row.q - 1n}`;
      const bar = document.createElement('div'); bar.className = 'bar'; bar.style.height = `${Number(row.digit * 10000n / (row.q - 1n)) / 100}%`;
      const label = document.createElement('small'); label.textContent = String(row.n); cell.append(bar, label); $('chart').append(cell);
    });
    if (!rows.length) { $('chart').textContent = '小数部分は 0 です。'; $('rows').innerHTML = '<tr><td colspan="7">整数のため、小数部分の計算はありません。</td></tr>'; }
    $('download').disabled = false;
  } catch (e) {
    $('error').textContent = e.message; $('error').hidden = false;
    $('results').style.opacity = '.45'; $('download').disabled = true;
  }
}
function rowValues(row, d) { return [row.n, row.q, row.digit, row.product, Cantor.format(row.digit, row.product), Cantor.format(row.sum, row.product), Cantor.format(row.r, d)].map(String); }
$('form').addEventListener('submit', e => { e.preventDefault(); render(); });
$('kind').addEventListener('change', () => { parameters(); render(); });
document.querySelectorAll('[data-value]').forEach(button => button.addEventListener('click', () => { $('rational').value = button.dataset.value; render(); }));
$('download').addEventListener('click', () => {
  if (!current) return;
  const { result, seq } = current;
  const data = [['x', Cantor.format(result.value.p, result.value.d)], ['基数', seq.label], ['n', 'q_n', 'a_n', 'Q_n', 'a_n/Q_n', 'S_n', 'r_n'], ...result.rows.map(row => rowValues(row, result.value.d))];
  const csv = '\uFEFF' + data.map(row => row.map(x => '"' + String(x).replace(/"/g, '""') + '"').join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a'); link.href = url; link.download = 'cantor-expansion.csv'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
parameters(); render();
