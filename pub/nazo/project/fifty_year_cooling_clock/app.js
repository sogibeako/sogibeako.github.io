(() => {
  'use strict';

  const START_MS = Date.UTC(2026, 7, 13, 15, 0, 0); // 2026-08-14 00:00:00 JST
  const END_MS = Date.UTC(2076, 7, 13, 15, 0, 0);   // 2076-08-14 00:00:00 JST
  const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
  const TOTAL_SPAN_MS = END_MS - START_MS;
  const unitMs = {
    years: TOTAL_SPAN_MS / 50,
    months: TOTAL_SPAN_MS / 600,
    days: 24 * 60 * 60 * 1000,
    hours: 60 * 60 * 1000,
    minutes: 60 * 1000,
    seconds: 1000
  };
  let displayMode = 'elapsed';
  let conversionUnit = 'years';

  const stages = [
    { year: 0,  range: '0〜5年',  title: '完全非接触', detail: '偶然見かけても接近しない', icon: '◇' },
    { year: 5,  range: '5〜10年', title: '同じ場所への滞在を解禁', detail: '同じ建物・イベントへの滞在を許可。ただし会話なし', icon: '⌂' },
    { year: 10, range: '10年',    title: '会釈を解禁', detail: '「どうも」まで', icon: '⌄' },
    { year: 15, range: '15年',    title: '定型挨拶を解禁', detail: '「お久しぶりです」「ではまた」程度', icon: '··' },
    { year: 20, range: '20年',    title: '1分以内の立ち話を解禁', detail: '天気・仕事など無害な話題のみ', icon: '01' },
    { year: 25, range: '25年',    title: '5分程度の雑談を解禁', detail: 'ただし自分から会う約束はしない', icon: '05' },
    { year: 30, range: '30年',    title: '同席を解禁', detail: '共通の知人の集まりなどで普通に振る舞ってよい', icon: '○' },
    { year: 35, range: '35年',    title: '短時間の一対一会話を解禁', detail: '「最近どう？」が使用可能に', icon: '↔' },
    { year: 40, range: '40年',    title: 'まとまった交流を解禁', detail: '食事など。ただし積極的には誘わない', icon: '□' },
    { year: 45, range: '45年',    title: '自分からの連絡・誘いを解禁', detail: '自分から連絡・誘いを行ってよい', icon: '→' },
    { year: 50, range: '50年',    title: '全制限解除', detail: '普通に会う', icon: '✦' }
  ];

  const quotes = [
    { latin: 'Cum procul alter ab alterō sīmus, nihil facere possumus.', japanese: '遠くにいるのだから、仕方ない。' },
    { latin: 'Tempus omnia sānat.', japanese: '時間が解決してくれる。' },
    { latin: 'Tempus fugit.', japanese: '光陰矢の如し。' },
    { latin: 'Tempus est quaedam pars aeternitātis.', japanese: '時間は永遠の一部である。', source: 'Cicero' },
    { latin: 'Tempore cuncta mītiōra.', japanese: '時間と共に全てがより熟したものとなる。' },
    { latin: 'Fac, quod rēctum est, dīc, quod vērum est.', japanese: '正しいことを為せ、真のことを言え。' },
    { latin: 'Errāre hūmānum est.', japanese: '間違うことは人間的だ。' },
    { latin: 'Superanda omnis fortūna ferendō est.', japanese: 'すべての運命は耐えることで克服されなければならない。', source: 'Vergilius, Aeneis 5.710' },
    { latin: 'Post tenebrās lūx.', japanese: '闇の後に光あり。' },
    { latin: 'Quod scrīpsī, scrīpsī.', japanese: '書いたものは書いた。' },
    { latin: 'Mea culpa maxima.', japanese: '私の最大の罪。' },
    { latin: 'Vīve ut vīvās.', japanese: '生きよ、そのために生きよ。' },
    { latin: 'Vēritās vōs līberābit.', japanese: '真実は汝らを自由にする。', source: 'John 8:32' },
    { latin: 'Distantia nōn est āmissiō.', japanese: '遠さは、失われたことと同じではない。', source: 'ChatGPT' },
    { latin: 'Quod mūtārī nōn potest, ferrī potest.', japanese: '変えられないものは、運ぶことができる。', source: 'ChatGPT' },
    { latin: 'Tempus vulnus nōn dēlet, sed vītam circum id auget.', japanese: '時は傷を消さず、その周りに人生を育てる。', source: 'ChatGPT' },
    { latin: 'Quod praeteriit nōn redit; neque tamen factum nōn est.', japanese: '過ぎ去ったものは戻らない。しかし、無かったことにもならない。', source: 'ChatGPT' },
    { latin: 'Exspectāre quoque interdum agere est.', japanese: '待つこともまた、時に行為である。', source: 'ChatGPT' },
    { latin: 'Vēritās nōn semper cōnsōlātur, sed fundāmentum praebet.', japanese: '真実は慰めないこともある。それでも、足場にはなる。', source: 'ChatGPT' },
    { latin: 'Aeternitās nōn est temporis absentia, sed etiam tempus āmissum complectitur.', japanese: '永遠とは、時間が無いことではなく、失われた時間をも含むことだ。', source: 'ChatGPT' },
    { latin: 'Ferre ipsum respōnsum est.', japanese: '耐えること自体が、すでに答えである。', source: 'Claude' },
    { latin: 'Tempus nōn sānat omnia, sed omnia testātur.', japanese: '時間はすべてを癒すのではなく、すべての証人であり続ける。', source: 'Claude' },
    { latin: 'Ignōscī facile est; sibi ignōscere, ars est.', japanese: '赦されるのは易しい、自分を許すことは技術である。', source: 'Claude' },
    { latin: 'Nōn causam quaerō; agō.', japanese: '理由を探してはいない、ただ行う。', source: 'Claude' },
    { latin: 'Nōlī fluēns tempus gemere, sed quid in eō sculpās quaere.', japanese: '流れる時を嘆くのではなく、その流れの中で何を刻むかを問い続けよ。', source: 'Gemini' },
    { latin: 'Sōlus quī altitūdinem tenebrārum nōvit, pretium lūcis rēctē mētītur.', japanese: '闇の深さを知る者だけが、一筋の光の価値を正しく測ることができる。', source: 'Gemini' },
    { latin: 'Imperfectiō nōn est venia, sed initium rēctum ēligendī.', japanese: '不完全であることは免罪符ではない。それは正しさを選び続けるための出発点だ。', source: 'Gemini' },
    { latin: 'Etsī ventum sistere nōn potes, voluntās vēla reōrdinandī semper in manibus tuīs est.', japanese: '風を止めることはできなくとも、帆を張り直す意志は常に自らの手の中にある。', source: 'Gemini' },
    { latin: 'Licet spatiō impedītī et tempore raptī sīmus, animus vēritātem tenēns numquam sōlus est.', japanese: '距離に阻まれ、時間に流されようとも、真実を抱く魂は決して孤立しない。', source: 'Gemini' },
    { latin: 'Quantam sōlitūdinem accēperis, tantō mītior et līberior fīēs.', japanese: '引き受けた孤独の分だけ、人は優しく、そして自由になれる。', source: 'Gemini' }
  ];
  let currentQuoteIndex = -1;

  const AU_KM = 149597870.7;
  const MOON_KM = 384400;
  const MOON_ROUND_TRIP_KM = MOON_KM * 2;
  const EARTH_CIRCUMFERENCE_KM = 40075;
  const orbit = au => au * AU_KM;

  const innerWorlds = [
    { value: orbit(0.387), label: '水星軌道', note: '太陽から約0.39 AU' },
    { value: orbit(0.723), label: '金星軌道', note: '太陽から約0.72 AU' },
    { value: orbit(1), label: '地球軌道', note: '1天文単位（1 AU）' },
    { value: orbit(1.524), label: '火星軌道', note: '太陽から約1.52 AU' }
  ];

  const journeys = {
    walk: {
      name: '徒歩', final: 2191560, unit: 'km',
      checkpoints: [
        { value: MOON_KM, label: '月に到着', note: '地球から月までの平均距離' },
        { value: MOON_ROUND_TRIP_KM, label: '月まで1往復', note: '地球–月間を1往復' },
        { value: MOON_ROUND_TRIP_KM * 2, label: '月まで2往復', note: '地球–月間を2往復' }
      ]
    },
    bicycle: {
      name: '自転車', final: 8766240, unit: 'km',
      checkpoints: Array.from({ length: 11 }, (_, index) => ({
        value: MOON_ROUND_TRIP_KM * (index + 1),
        label: `月まで${index + 1}往復`,
        note: `地球–月間を${index + 1}往復`
      }))
    },
    car: {
      name: '自動車', final: 43831200, unit: 'km',
      checkpoints: [100, 250, 500, 750, 1000].map(laps => ({
        value: EARTH_CIRCUMFERENCE_KM * laps,
        label: `地球${laps.toLocaleString('ja-JP')}周`,
        note: `地球の赤道周長約40,075 kmを${laps.toLocaleString('ja-JP')}周分`
      }))
    },
    shinkansen: {
      name: '新幹線', final: 140259840, unit: 'km',
      checkpoints: innerWorlds.filter(point => point.value <= 140259840)
    },
    airplane: {
      name: '旅客機', final: 394480800, unit: 'km',
      checkpoints: [
        ...innerWorlds,
        { value: orbit(2.1), label: '小惑星帯・内縁', note: '太陽から約2.1 AU、主要な小惑星帯へ' }
      ]
    },
    sound: {
      name: '音速', final: 541315320, unit: 'km',
      checkpoints: [
        ...innerWorlds,
        { value: orbit(2.1), label: '小惑星帯・内縁', note: '太陽から約2.1 AU' },
        { value: orbit(2.77), label: '準惑星ケレス軌道', note: '太陽から約2.77 AU、小惑星帯最大の天体' },
        { value: orbit(3.3), label: '小惑星帯・外縁', note: '太陽から約3.3 AU' }
      ]
    },
    iss: {
      name: 'ISS', final: 12097411200, unit: 'km',
      checkpoints: [
        { value: orbit(5.2), label: '木星軌道', note: '太陽から約5.2 AU' },
        { value: orbit(9.58), label: '土星軌道', note: '太陽から約9.58 AU' },
        { value: orbit(19.2), label: '天王星軌道', note: '太陽から約19.2 AU' },
        { value: orbit(30.05), label: '海王星軌道', note: '太陽から約30.05 AU・カイパーベルト内縁' },
        { value: orbit(39.24), label: '冥王星の平均軌道', note: '太陽から平均約39.24 AU' },
        { value: orbit(50), label: 'カイパーベルト主領域・外縁', note: '主領域は太陽から約30〜50 AU' }
      ]
    },
    voyager: {
      name: 'Voyager 1級', final: 26737032000, unit: 'km',
      checkpoints: [
        { value: orbit(5.2), label: '木星軌道', note: '太陽から約5.2 AU' },
        { value: orbit(9.58), label: '土星軌道', note: '太陽から約9.58 AU' },
        { value: orbit(19.2), label: '天王星軌道', note: '太陽から約19.2 AU' },
        { value: orbit(30.05), label: '海王星軌道', note: '太陽から約30.05 AU・カイパーベルト内縁' },
        { value: orbit(39.24), label: '冥王星の平均軌道', note: '太陽から平均約39.24 AU' },
        { value: orbit(50), label: 'カイパーベルト主領域・外縁', note: 'この先は散乱円盤領域へ' },
        { value: orbit(94), label: '末端衝撃波面', note: 'Voyager 1が太陽風の減速境界を通過した距離' },
        { value: orbit(122), label: 'ヘリオポーズ', note: '太陽圏を抜け、星間空間へ' }
      ]
    },
    light: {
      name: '光速', final: 50.001, unit: 'ly',
      checkpoints: [
        { value: 4.2, label: 'プロキシマ・ケンタウリ', note: '太陽に最も近い恒星' },
        { value: 6, label: 'バーナード星', note: '太陽に近い単独の赤色矮星' },
        { value: 8.6, label: 'シリウス', note: '地球の夜空で最も明るい恒星' },
        { value: 17, label: 'アルタイル', note: '夏の大三角をつくる恒星' },
        { value: 25, label: 'ベガ', note: '夏の大三角をつくる恒星' },
        { value: 37, label: 'アークトゥルス', note: '北天で特に明るい橙色の恒星' },
        { value: 43, label: 'カペラ', note: 'ぎょしゃ座の明るい連星系' }
      ]
    }
  };

  const elements = Object.fromEntries(
    ['years', 'months', 'days', 'hours', 'minutes', 'seconds', 'currentTitle', 'currentDetail', 'nextUnlock', 'statusIcon', 'progressText', 'progressFill', 'progressPulse', 'timeline', 'elapsed-heading', 'modeNote']
      .map(id => [id, document.getElementById(id)])
  );
  const timeGrid = document.querySelector('.time-grid');
  const modeButtons = [...document.querySelectorAll('.mode-button')];
  const unitSwitch = document.querySelector('.unit-switch');
  const unitButtons = [...document.querySelectorAll('.unit-button')];
  const unitPanels = [...document.querySelectorAll('[data-unit-panel]')];
  const unitLabels = { years: '年', months: '月', days: '日', hours: '時', minutes: '分', seconds: '秒' };
  const journeyViews = [];
  const quoteCard = document.querySelector('.temporal-quote');
  const quoteLatin = document.getElementById('quoteLatin');
  const quoteJapanese = document.getElementById('quoteJapanese');
  const quoteSource = document.getElementById('quoteSource');
  const quoteShuffle = document.getElementById('quoteShuffle');

  const pad = value => String(value).padStart(2, '0');
  const jstDate = ms => new Date(ms + JST_OFFSET_MS);

  function anniversaryMs(years) {
    return Date.UTC(2026 + years, 7, 13, 15, 0, 0);
  }

  function calendarDifference(fromMs, toMs) {
    if (toMs <= fromMs) return { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };

    const start = jstDate(fromMs);
    const end = jstDate(toMs);
    let years = end.getUTCFullYear() - start.getUTCFullYear();
    let months = end.getUTCMonth() - start.getUTCMonth();
    let days = end.getUTCDate() - start.getUTCDate();
    let hours = end.getUTCHours() - start.getUTCHours();
    let minutes = end.getUTCMinutes() - start.getUTCMinutes();
    let seconds = end.getUTCSeconds() - start.getUTCSeconds();

    if (seconds < 0) { seconds += 60; minutes--; }
    if (minutes < 0) { minutes += 60; hours--; }
    if (hours < 0) { hours += 24; days--; }
    if (days < 0) {
      const previousMonthDays = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 0)).getUTCDate();
      days += previousMonthDays;
      months--;
    }
    if (months < 0) { months += 12; years--; }

    return { years, months, days, hours, minutes, seconds };
  }

  function formatRemaining(ms) {
    const d = calendarDifference(Date.now(), ms);
    if (ms <= Date.now()) return '解禁済み';
    const parts = [
      [d.years, '年'], [d.months, 'か月'], [d.days, '日'],
      [d.hours, '時間'], [d.minutes, '分'], [d.seconds, '秒']
    ];
    return parts.filter(([value], index) => value > 0 || index >= 4).slice(0, 3).map(([value, unit]) => `${value}${unit}`).join(' ');
  }

  function renderTimeline(activeIndex) {
    elements.timeline.innerHTML = stages.map((stage, index) => {
      const state = index < activeIndex ? 'completed' : index === activeIndex ? 'current' : 'locked';
      const label = state === 'completed' ? 'UNLOCKED' : state === 'current' ? 'CURRENT' : 'LOCKED';
      return `<li class="milestone ${state}">
        <span class="milestone-range">${stage.range}</span>
        <span class="milestone-node" aria-hidden="true"><i></i></span>
        <span class="milestone-text"><strong>${stage.title}</strong><span>${stage.detail}</span></span>
        <span class="milestone-state">${label}</span>
      </li>`;
    }).join('');
  }

  function formatConverted(value, unit) {
    const maximumFractionDigits = unit === 'seconds' ? 0 : unit === 'minutes' ? 2 : unit === 'hours' ? 3 : 6;
    return new Intl.NumberFormat('ja-JP', { maximumFractionDigits }).format(value);
  }

  function showRandomQuote() {
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * quotes.length);
    } while (quotes.length > 1 && nextIndex === currentQuoteIndex);
    currentQuoteIndex = nextIndex;
    const quote = quotes[nextIndex];
    quoteLatin.textContent = quote.latin;
    quoteJapanese.textContent = quote.japanese;
    quoteSource.textContent = quote.source || '';
    quoteCard.classList.remove('quote-changing');
    requestAnimationFrame(() => quoteCard.classList.add('quote-changing'));
  }

  function formatDistance(value, unit) {
    if (unit === 'ly') return `${value < 1 ? value.toFixed(3) : value.toFixed(2)} 光年`;
    if (value < 10000) return `${Math.round(value).toLocaleString('ja-JP')} km`;
    if (value < 100000000) return `${(value / 10000).toLocaleString('ja-JP', { maximumFractionDigits: 1 })}万 km`;
    return `${(value / 100000000).toLocaleString('ja-JP', { maximumFractionDigits: 2 })}億 km`;
  }

  function checkpointDate(fraction) {
    return new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', year: 'numeric', month: 'long', day: 'numeric' })
      .format(new Date(START_MS + TOTAL_SPAN_MS * fraction));
  }

  function closeJourneyTips(except) {
    document.querySelectorAll('.journey-point.tip-open').forEach(point => {
      if (point !== except) {
        point.classList.remove('tip-open');
        point.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function makeTipButton(className, left, label, html) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `journey-point ${className} ${left < 8 ? 'tip-left' : left > 92 ? 'tip-right' : ''}`;
    button.style.left = `${left}%`;
    button.setAttribute('aria-label', label);
    button.setAttribute('aria-expanded', 'false');
    button.innerHTML = `<span class="journey-tip" role="tooltip">${html}</span>`;
    button.addEventListener('click', event => {
      event.stopPropagation();
      const opening = !button.classList.contains('tip-open');
      closeJourneyTips(button);
      button.classList.toggle('tip-open', opening);
      button.setAttribute('aria-expanded', String(opening));
    });
    return button;
  }

  function initJourneyTracks() {
    document.querySelectorAll('[data-journey]').forEach(row => {
      const journey = journeys[row.dataset.journey];
      if (!journey) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'journey-progress';
      wrapper.setAttribute('role', 'cell');
      wrapper.setAttribute('aria-colspan', '3');
      wrapper.innerHTML = `<div class="journey-progress-meta"><span>START · 2026</span><strong>現在地点を計算中…</strong><span>GOAL · 2076</span></div><div class="journey-track"><div class="journey-fill"></div></div>`;
      const track = wrapper.querySelector('.journey-track');
      const checkpoints = [
        ...journey.checkpoints,
        { value: journey.final, label: '50年後の到達距離', note: '2076年8月14日・完全解禁' }
      ];
      checkpoints.forEach(checkpoint => {
        const fraction = checkpoint.value / journey.final;
        const percent = fraction * 100;
        if (percent <= 0 || percent > 100.000001) return;
        const tip = `<b>${checkpoint.label}</b>${checkpointDate(fraction)}ごろ<br>${formatDistance(checkpoint.value, journey.unit)}<br>${checkpoint.note}`;
        track.appendChild(makeTipButton('checkpoint-point', percent, `${journey.name}・${checkpoint.label}`, tip));
      });
      const current = makeTipButton('current-point tip-left', 0, `${journey.name}の現在地点`, '<b>NOW</b>計算中…');
      track.appendChild(current);
      row.appendChild(wrapper);
      journeyViews.push({ journey, wrapper, current });
    });
  }

  function updateJourneyTracks(progress) {
    const fraction = progress / 100;
    journeyViews.forEach(({ journey, wrapper, current }) => {
      const distance = journey.final * fraction;
      wrapper.querySelector('.journey-fill').style.width = `${progress}%`;
      wrapper.querySelector('.journey-progress-meta strong').textContent = `現在 ${formatDistance(distance, journey.unit)} · ${progress.toFixed(6)}%`;
      current.style.left = `${progress}%`;
      current.classList.toggle('tip-left', progress < 8);
      current.classList.toggle('tip-right', progress > 92);
      current.setAttribute('aria-label', `${journey.name}の現在地点、${formatDistance(distance, journey.unit)}`);
      current.querySelector('.journey-tip').innerHTML = `<b>NOW · ${progress.toFixed(6)}%</b>現在までに進む距離<br>${formatDistance(distance, journey.unit)}`;
    });
  }

  function renderClock(now, clamped) {
    const valueElements = ['years', 'months', 'days', 'hours', 'minutes', 'seconds'];

    if (displayMode === 'conversion') {
      const remainingMs = Math.max(0, END_MS - Math.max(now, START_MS));
      elements[conversionUnit].textContent = formatConverted(remainingMs / unitMs[conversionUnit], conversionUnit);
      unitPanels.forEach(panel => {
        const selected = panel.dataset.unitPanel === conversionUnit;
        panel.hidden = !selected;
        if (selected) panel.querySelector('span').textContent = `${unitLabels[conversionUnit]}換算での残り時間`;
      });
      elements['elapsed-heading'].textContent = '残り時間の総単位換算';
      elements.modeNote.textContent = '残り期間全体を、選択した1単位だけで表しています。年・月は50年間の実日数（うるう日を含む）から求めた平均長で換算し、うるう秒は含みません。';
      timeGrid.classList.add('conversion-mode');
      unitSwitch.hidden = false;
      timeGrid.setAttribute('aria-label', `残り時間を${unitLabels[conversionUnit]}に換算した総量`);
      return;
    }

    unitPanels.forEach(panel => {
      panel.hidden = false;
      panel.querySelector('span').textContent = unitLabels[panel.dataset.unitPanel];
    });
    const difference = displayMode === 'remaining'
      ? calendarDifference(clamped, END_MS)
      : calendarDifference(START_MS, clamped);
    valueElements.forEach(unit => { elements[unit].textContent = pad(difference[unit]); });
    const isRemaining = displayMode === 'remaining';
    elements['elapsed-heading'].textContent = isRemaining ? '完全解禁までの残り時間' : '経過時間';
    elements.modeNote.textContent = isRemaining
      ? '完全解禁までの残りを暦に沿って表示しています。うるう日は算入し、うるう秒は含みません。'
      : '開始からの経過を暦に沿って表示しています。うるう日は算入し、うるう秒は含みません。';
    timeGrid.classList.remove('conversion-mode');
    unitSwitch.hidden = true;
    timeGrid.setAttribute('aria-label', isRemaining ? '完全解禁までの残り時間' : '経過時間');
  }

  function setDisplayMode(mode) {
    if (!['elapsed', 'remaining', 'conversion'].includes(mode)) return;
    displayMode = mode;
    modeButtons.forEach(button => {
      const active = button.dataset.mode === mode;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    update();
  }

  function setConversionUnit(unit) {
    if (!Object.hasOwn(unitMs, unit)) return;
    conversionUnit = unit;
    unitButtons.forEach(button => {
      const active = button.dataset.unit === unit;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    update();
  }

  function update() {
    const now = Date.now();
    const clamped = Math.min(Math.max(now, START_MS), END_MS);
    renderClock(now, clamped);

    const progress = ((clamped - START_MS) / (END_MS - START_MS)) * 100;
    const boundedProgress = Math.min(100, Math.max(0, progress));
    elements.progressText.textContent = `${boundedProgress.toFixed(6)}%`;
    elements.progressFill.style.width = `${boundedProgress}%`;
    elements.progressPulse.style.left = `${boundedProgress}%`;
    document.querySelector('.progress-track').setAttribute('aria-valuenow', boundedProgress.toFixed(6));
    updateJourneyTracks(boundedProgress);

    let activeIndex = 0;
    stages.forEach((stage, index) => {
      if (now >= anniversaryMs(stage.year)) activeIndex = index;
    });
    if (now < START_MS) activeIndex = 0;

    const current = stages[activeIndex];
    elements.currentTitle.textContent = now < START_MS ? '冷却開始前' : current.title;
    elements.currentDetail.textContent = now < START_MS ? '2026年8月14日 00:00:00から計測を開始します' : current.detail;
    elements.statusIcon.textContent = current.icon;

    if (now < START_MS) {
      elements.nextUnlock.textContent = `開始まで ${formatRemaining(START_MS)}`;
    } else if (activeIndex === stages.length - 1) {
      elements.nextUnlock.textContent = '50年間の冷却期間が完了しました';
    } else {
      const next = stages[activeIndex + 1];
      elements.nextUnlock.textContent = `次の解禁「${next.title}」まで ${formatRemaining(anniversaryMs(next.year))}`;
    }

    renderTimeline(activeIndex);
  }

  modeButtons.forEach(button => button.addEventListener('click', () => setDisplayMode(button.dataset.mode)));
  unitButtons.forEach(button => button.addEventListener('click', () => setConversionUnit(button.dataset.unit)));
  quoteShuffle.addEventListener('click', showRandomQuote);
  document.addEventListener('click', () => closeJourneyTips());
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeJourneyTips(); });
  initJourneyTracks();
  showRandomQuote();
  update();
  window.setInterval(update, 1000);
})();
