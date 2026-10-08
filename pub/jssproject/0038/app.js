'use strict';
const $ = id => document.getElementById(id);
let current;
let reverseSequence, reverseReference, reverseValue;
function parameters(prefix = '') {
  const kind = $(prefix + 'kind').value;
  $(prefix + 'a-field').hidden = !['constant', 'exponential', 'linear', 'power'].includes(kind);
  $(prefix + 'b-field').hidden = kind !== 'linear'; $(prefix + 'list-field').hidden = kind !== 'cycle';
  $(prefix + 'a-label').textContent = { constant: '基数 b', exponential: '底 b', linear: '係数 A', power: '指数 k' }[kind] || '';
  $(prefix + 'power-hint').hidden = kind !== 'power';
}
function render() {
  try {
    const config = ['kind', 'a', 'b', 'bases'].map(id => $(id).value);
    const seq = Cantor.sequence(...config);
    const result = Cantor.expandExpression(Cantor.expression($('rational').value), seq, $('count').value);
    current = { result, seq, config }; $('error').hidden = true; $('results').style.opacity = '1';
    const { rows, value, whole, negative, terminated, repeat, remainder, product, sum } = result;
    $('status').textContent = result.approximate ? `${rows.length} 桁確定${result.precisionLimited ? '・精度上限' : '・無理数'}` : terminated ? '有限展開' : repeat ? '循環を検出' : `${rows.length} 桁で打ち切り`;
    $('result-label').textContent = `x = ${result.approximate ? result.source : Cantor.format(value.p, value.d)}　 /　 ${seq.label}`;
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
    $('tail').textContent = result.approximate ? `${Cantor.scientific(remainder, value.d * product)} < 残り < ${Cantor.scientific(result.remainderUpper, value.d * product, true)}` : Cantor.format(remainder, value.d * product);
    $('conclusion').textContent = terminated ? `${rows.length} 桁で余りが 0 になりました。以後の桁はすべて 0 です。` : repeat ? `第 ${repeat.start + 1} 桁から ${repeat.length} 桁の周期を検出しました。緑色は循環部分です。` : 'この表示範囲では終了していません。打ち切りは、無限展開であることの判定ではありません。';
    if (result.approximate) $('conclusion').textContent = `数を幅 10⁻²⁴⁰ の上下限で挟み、両側で一致する桁だけを表示しています。${result.precisionLimited ? '次の桁はこの精度では確定できないため停止しました。' : '表示した各桁と部分和は厳密です。'} 余りの上下限は外側へ丸めて表示。詳細な分数は CSV に保存できます。`;
    $('rows').replaceChildren(); $('chart').replaceChildren();
    rows.forEach(row => {
      const tr = document.createElement('tr');
      rowValues(row, value.d).forEach((v, i) => {
        const td = document.createElement('td');
        td.textContent = i === 6 && result.approximate ? `${Cantor.scientific(row.r, value.d)} < r < ${Cantor.scientific(row.rUpper, value.d, true)}` : v;
        tr.append(td);
      }); $('rows').append(tr);
      const cell = document.createElement('div'); cell.className = 'bar-cell'; cell.title = `第 ${row.n} 桁: ${row.digit} / ${row.q - 1n}`;
      const bar = document.createElement('div'); bar.className = 'bar'; bar.style.height = `${Number(row.digit * 10000n / (row.q - 1n)) / 100}%`;
      const label = document.createElement('small'); label.textContent = String(row.n); cell.append(bar, label); $('chart').append(cell);
    });
    if (!rows.length) { $('chart').textContent = result.approximate ? 'この精度で確定できた桁はありません。' : '小数部分は 0 です。'; $('rows').innerHTML = '<tr><td colspan="7">表示する桁がありません。</td></tr>'; }
    $('download').disabled = false;
    $('import-digits').disabled = false;
  } catch (e) {
    $('error').textContent = e.message; $('error').hidden = false;
    $('results').style.opacity = '.45'; $('download').disabled = true;
    $('import-digits').disabled = true;
  }
}
function rowValues(row, d) { return [row.n, row.q, row.digit, row.product, Cantor.format(row.digit, row.product), Cantor.format(row.sum, row.product), row.rUpper === undefined ? Cantor.format(row.r, d) : `${Cantor.format(row.r, d)} < r < ${Cantor.format(row.rUpper, d)}`].map(String); }
$('form').addEventListener('submit', e => { e.preventDefault(); render(); });
$('kind').addEventListener('change', () => { parameters(); render(); });
document.querySelectorAll('[data-value]').forEach(button => button.addEventListener('click', () => { $('rational').value = button.dataset.value; render(); }));
$('download').addEventListener('click', () => {
  if (!current) return;
  const { result, seq } = current;
  const data = [['x', result.approximate ? result.source : Cantor.format(result.value.p, result.value.d)], ['計算', result.approximate ? '区間評価で確定した桁。余りは上下限。' : '厳密な有理数'], ['基数', seq.label], ['n', 'q_n', 'a_n', 'Q_n', 'a_n/Q_n', 'S_n', 'r_n'], ...result.rows.map(row => rowValues(row, result.value.d))];
  const csv = '\uFEFF' + data.map(row => row.map(x => '"' + String(x).replace(/"/g, '""') + '"').join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a'); link.href = url; link.download = 'cantor-expansion.csv'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
function reverseRender(rebuild = true) {
  $('remove-digit').disabled = !$('reverse-list').value.trim();
  $('reverse-basis').textContent = '';
  try {
    reverseSequence = Cantor.sequence(...['kind', 'a', 'b', 'bases'].map(id => $('reverse-' + id).value));
    $('reverse-basis').textContent = reverseSequence.label;
    const result = Cantor.reverse($('reverse-list').value, reverseSequence, $('reverse-whole').value, $('reverse-sign').value === '-');
    reverseValue = result.value;
    $('reverse-error').hidden = true; $('reverse-output').hidden = false; $('use-reverse').disabled = false;
    $('reverse-value').textContent = Cantor.format(result.value.p, result.value.d);
    $('reverse-decimal').textContent = Cantor.decimal(result.value);
    const delta = Cantor.fraction(result.value.p * reverseReference.d - reverseReference.p * result.value.d, result.value.d * reverseReference.d);
    $('reverse-difference').textContent = `取り込み時の値からの変化 Δx = ${Cantor.format(delta.p, delta.d)}`;
    if (rebuild) {
      $('reverse-tiles').replaceChildren();
      result.rows.forEach(row => {
        const label = document.createElement('label'); label.className = 'digit editable-digit';
        const input = document.createElement('input'); input.value = String(row.digit); input.inputMode = 'numeric'; input.setAttribute('aria-label', `第 ${row.n} 桁（0〜${row.q - 1n}）`);
        input.addEventListener('input', () => {
          const values = Array.from($('reverse-tiles').querySelectorAll('input'), el => el.value.trim() || '?');
          $('reverse-list').value = values.join(','); reverseRender(false);
        });
        const caption = document.createElement('small'); caption.textContent = `第${row.n}桁 / q=${row.q}`;
        label.append(input, caption); $('reverse-tiles').append(label);
      });
    }
  } catch (e) {
    reverseValue = null; $('reverse-error').textContent = e.message; $('reverse-error').hidden = false; $('reverse-output').hidden = true; $('use-reverse').disabled = true;
    if (rebuild) $('reverse-tiles').replaceChildren();
  }
}
function importDigits() {
  if (!current) return;
  const { result, seq, config } = current;
  ['kind', 'a', 'b', 'bases'].forEach((id, i) => { $('reverse-' + id).value = config[i]; });
  parameters('reverse-');
  $('reverse-sign').value = result.negative ? '-' : '+'; $('reverse-whole').value = String(result.whole);
  $('reverse-list').value = result.rows.map(row => String(row.digit)).join(',');
  reverseReference = Cantor.reverse($('reverse-list').value, seq, String(result.whole), result.negative).value;
  reverseRender();
}
$('import-digits').addEventListener('click', importDigits);
$('reverse-kind').replaceChildren(...Array.from($('kind').options, option => option.cloneNode(true)));
$('reverse-kind').addEventListener('change', () => { parameters('reverse-'); reverseRender(); });
['reverse-a', 'reverse-b', 'reverse-bases'].forEach(id => $(id).addEventListener('input', () => reverseRender()));
['reverse-list', 'reverse-whole', 'reverse-sign'].forEach(id => $(id).addEventListener('input', () => reverseRender()));
$('add-digit').addEventListener('click', () => { $('reverse-list').value = $('reverse-list').value.trim() ? $('reverse-list').value + ',0' : '0'; reverseRender(); });
$('remove-digit').addEventListener('click', () => {
  const entries = $('reverse-list').value.trim().split(/[,、\s]+/);
  entries.pop();
  $('reverse-list').value = entries.join(',');
  reverseRender();
});
$('use-reverse').addEventListener('click', () => {
  if (!reverseValue) return;
  const text = Cantor.format(reverseValue.p, reverseValue.d);
  if (text.length > 300) { $('reverse-error').textContent = 'この分数は上の入力上限（300 文字）を超えています。桁数を減らしてください。'; $('reverse-error').hidden = false; return; }
  $('rational').value = text; render(); $('form').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
parameters(); render(); importDigits();
