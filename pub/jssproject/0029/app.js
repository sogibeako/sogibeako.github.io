const SUITS = [
  { id: "wands", mark: "W", label: "杖", glyph: "♣" },
  { id: "cups", mark: "C", label: "杯", glyph: "♥" },
  { id: "swords", mark: "S", label: "剣", glyph: "♠" },
  { id: "coins", mark: "P", label: "金貨", glyph: "♦" }
];

const RANKS = [
  ["1", "1", 1], ["2", "2", 2], ["3", "3", 3], ["4", "4", 4], ["5", "5", 5],
  ["6", "6", 6], ["7", "7", 7], ["8", "8", 8], ["9", "9", 9], ["10", "10", 10],
  ["jack", "J", 11], ["knight", "N", 12], ["queen", "Q", 13], ["king", "K", 14]
];

const MAJORS = [
  "愚者", "魔術師", "女教皇", "女帝", "皇帝", "教皇", "恋人", "戦車", "力", "隠者", "運命の輪",
  "正義", "吊された男", "死神", "節制", "悪魔", "塔", "星", "月", "太陽", "審判", "世界"
];

const PLAYERS = [
  { name: "水原一彌", tag: "ダボッとした黒服の兄。理論派ぶりたいが迂闊。", cpu: false },
  { name: "水原一埜", tag: "水色ロングヘアーに赤い眼鏡の妹。危険札への嗅覚が鋭い。", cpu: true },
  { name: "夕畑目ななよ", tag: "ピンクの革命児。軽やかに場をかき回す。", cpu: true },
  { name: "沖中真宵", tag: "銀髪スポーティ。堅実で無駄な勝ちを避ける。", cpu: true }
];

const DEFAULT_DEAL_COUNT = 6;
const DEFAULT_PASS_COUNT = 1;

const LINES = [
  {
    ready: ["まず場の構造を見るんだ……危険札は、だいたい向こうから来る！", "フッ……勝つより取らないことだ！ これは人生にも似ている。"],
    deal: ["よしっ、この配り方なら、まだ読み筋は残っている！", "親か。責任だけが重いんだよな……。"],
    pass: ["不要なものを手放す訓練、ということにしておこう……。"],
    play: ["ふむ、ここは小さく通す……。", "まだ結論を急ぐ局面ではないなっ。"],
    dangerPlay: ["悪いが、これは場に返す。", "この札は、ぼくの手には余るな！"],
    win: ["まだ焦る場面ではないな。", "ふむ、悪くないな！"],
    takeDanger: ["ぐああっ、これは痛い！💦", "しまった、危険札を回収してしまった！💦"],
    gameWin: ["最小の損失で済んだ。つまり……勝利だ！"],
    gameSecond: ["二位か。悪くないが、まだ改善の余地があるな……！"],
    gameThird: ["三位。読みが一手遅れたな……。"],
    gameFourth: ["ぐわああ、四位！ ……これは反省文だ！💦"]
  },
  {
    ready: ["お兄ちゃん、変なカード取らないでね～？", "ズルしちゃダメだよ！ 私、ちゃんと見てるからね！"],
    deal: ["この枚数なら、危ない札を覚えやすいかも。", "一埜センサー、起動だよ！"],
    pass: ["えへへ、これは隣におすそわけ。"],
    play: ["これなら出せるよね。", "うーん、こっちかな。"],
    dangerPlay: ["ごめんね、危ないの置いていくね。", "危険札さん、旅に出てください！","この札欲しい人、挙手～！"],
    win: ["やった、でも中身は確認しないとね。", "ふふ、ちょっと上手くいった。"],
    takeDanger: ["えー、危ない札取っちゃった！💦 これはお兄ちゃんのせいでは？", "うわぁ～、眼鏡がズレちゃいそう！💦"],
    gameWin: ["一埜の勝ち！✨ えへへ～、お兄ちゃん、見てた？"],
    gameSecond: ["二位だよ。あとちょっとだったのにー。"],
    gameThird: ["三位かぁ。危ない札、もっと避けられたかも。"],
    gameFourth: ["うわぁ～ん、びり！💦 ……えへへ、お兄ちゃん、慰めてくれる？"]
  },
  {
    ready: ["よーし、革命的に押し付けていこー！", "場を読む？ もちろん読むよ、未来までね！"],
    deal: ["ふふーん、かわいくない札から切っていこっと！", "親の権限！ なかなか悪くないじゃん。"],
    pass: ["はい、友情のプレゼント！ 中身は見ないでね。"],
    play: ["じゃーん、これでどう？", "いひひー、ノリで出してるように見えて、わりと考えてるんだよ？"],
    dangerPlay: ["危険札、バイバーイ！", "そのカードは、うちの管轄外でーす。"],
    win: ["取っちゃった。まあ映えるからヨシ！", "ふふん、場を制したね。"],
    takeDanger: ["えっ、これ減点じゃん！ 革命失敗だ！💦", "やっば、可愛い顔して重い札だった！💦"],
    gameWin: ["いぇーい、勝利！ みんな、ななよ政権をよろしく！✨"],
    gameSecond: ["二位！ これはもうほぼ勝ちみたいなもんでしょ？"],
    gameThird: ["三位かー。ま、革命には準備期間が必要ってことで。"],
    gameFourth: ["えっ四位！？ ウソでしょ？ ちょっと、再集計しよ再集計！💦"]
  },
  {
    ready: ["焦らずいこう。無理な勝ちは怪我のもと。", "危険札は避ける。基本だけど大事。"],
    deal: ["体力配分みたいなもの。最後まで崩れない手を作っていくよ。", "この枚数なら、守備寄りでいけるね。"],
    pass: ["いらない札は早めに流す。判断は素早く冷静に。"],
    play: ["ん。これで十分。", "無駄に勝ちに行かない。"],
    dangerPlay: ["よし、ここで危険札を処理するよ。", "ここで手放せるなら悪くない。"],
    win: ["よし。次も落ち着いていくよ。", "流れは悪くない。"],
    takeDanger: ["うっ、しまった……💦 次で取り返すからね。", "これは反省。守備位置を直す……！"],
    gameWin: ["よし、勝ち……！✨ 最後まで姿勢を崩さなかった結果だね。"],
    gameSecond: ["二位。うん、判断は悪くなかった。次は詰めるよ。"],
    gameThird: ["三位。んん、守り切れなかった場面があった。"],
    gameFourth: ["四位。完敗だ……！💦 よかったら、もう一戦お願い。"]
  }
];

const state = {
  players: [],
  deck: [],
  round: 1,
  dealer: 0,
  leader: 0,
  turn: 0,
  leadSuit: null,
  trick: [],
  phase: "setup",
  dealCount: DEFAULT_DEAL_COUNT,
  passCount: DEFAULT_PASS_COUNT,
  passSelection: new Set(),
  finalKitty: [],
  lastWinner: 0,
  autoHuman: false,
  dialogue: [],
  log: []
};

const $ = (id) => document.getElementById(id);

function buildDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const [rank, short, strength] of RANKS) {
      deck.push({
        id: `${suit.id}_${rank}`,
        type: "minor",
        suit: suit.id,
        suitLabel: suit.label,
        mark: suit.mark,
        glyph: suit.glyph,
        rank,
        short,
        strength,
        point: rank === "queen" ? -50 : 0,
        name: `${suit.label}${rankName(rank)}`
      });
    }
  }
  for (let number = 0; number <= 21; number++) {
    deck.push({
      id: `major_${number}`,
      type: number === 0 ? "fool" : "major",
      number,
      strength: number,
      point: number === 0 ? 0 : -number,
      name: MAJORS[number]
    });
  }
  return deck;
}

function rankName(rank) {
  return ({ jack: "ジャック", knight: "ナイト", queen: "クイーン", king: "キング" }[rank] || rank);
}

function shuffle(deck) {
  const next = [...deck];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function startGame() {
  state.players = PLAYERS.map((p, id) => ({
    ...p,
    id,
    hand: [],
    captured: [],
    score: 0
  }));
  state.deck = shuffle(buildDeck());
  state.round = 1;
  state.dealer = 0;
  state.leader = 0;
  state.turn = 0;
  state.trick = [];
  state.leadSuit = null;
  state.phase = "deal_config";
  state.dealCount = DEFAULT_DEAL_COUNT;
  state.passCount = DEFAULT_PASS_COUNT;
  state.passSelection = new Set();
  state.cpuPasses = null;
  state.finalKitty = [];
  state.lastWinner = 0;
  state.autoHuman = false;
  state.dialogue = LINES.map((lines) => pick(lines.ready));
  state.log = [];
  const autoBtn = $("autoBtn");
  if (autoBtn) autoBtn.textContent = "CPUに任せる";
  addLog("新しい山札を用意しました。親が配る枚数と交換枚数を決めます。");
  render();
}

function addLog(text) {
  state.log.unshift(text);
  state.log = state.log.slice(0, 80);
}

function beginRound() {
  const maxDeal = Math.floor(state.deck.length / 4);
  state.dealCount = clamp(Number($("dealCount")?.value || state.dealCount), 1, maxDeal);
  state.passCount = clamp(Number($("passCount")?.value || state.passCount), 0, state.dealCount);
  for (const p of state.players) p.hand = [];
  for (let c = 0; c < state.dealCount; c++) {
    for (const p of state.players) {
      p.hand.push(state.deck.shift());
    }
  }
  for (const p of state.players) sortHand(p.hand);
  state.finalKitty = state.deck.length < 4 ? [...state.deck] : [];
  if (state.finalKitty.length) state.deck = [];
  state.phase = state.passCount > 0 ? "pass_cards" : "trick_play";
  state.passSelection = new Set();
  state.leader = state.dealer;
  state.turn = state.leader;
  state.trick = [];
  state.leadSuit = null;
  say(state.dealer, "deal");
  addLog(`第${state.round}ラウンド開始。各自${state.dealCount}枚、交換${state.passCount}枚。`);
  if (state.phase === "pass_cards") cpuPass();
  render();
  if (state.phase === "trick_play") maybeCpuTurn();
}

function cpuPass() {
  const allPasses = state.players.map((p) => {
    if (!p.cpu) return [];
    return [...p.hand].sort((a, b) => dangerValue(b) - dangerValue(a) || cardOrder(b) - cardOrder(a)).slice(0, state.passCount);
  });
  state.players.forEach((p, i) => {
    if (!p.cpu) return;
    p.hand = p.hand.filter((card) => !allPasses[i].includes(card));
  });
  state.cpuPasses = allPasses;
}

function finishHumanPass() {
  if (state.passSelection.size !== state.passCount) return;
  const allPasses = state.cpuPasses || state.players.map(() => []);
  allPasses[0] = [...state.passSelection].map((idx) => state.players[0].hand[idx]);
  state.players[0].hand = state.players[0].hand.filter((_, idx) => !state.passSelection.has(idx));

  const additions = state.players.map(() => []);
  allPasses.forEach((cards, from) => {
    const to = (from + 1) % 4;
    additions[to].push(...cards);
  });
  state.players.forEach((p, i) => {
    p.hand.push(...additions[i]);
    sortHand(p.hand);
  });
  state.passSelection = new Set();
  state.cpuPasses = null;
  state.phase = "trick_play";
  say(0, "pass");
  addLog("全員が左隣へ同時にカードを渡しました。");
  render();
  maybeCpuTurn();
}

function canPlay(card, hand, leadSuit) {
  if (card.type === "fool") return true;
  if (!leadSuit) return true;
  if (leadSuit === "trump") {
    const hasTrump = hand.some((c) => c.type === "major");
    return hasTrump ? card.type === "major" : true;
  }
  const hasLead = hand.some((c) => c.type === "minor" && c.suit === leadSuit);
  return hasLead ? card.type === "minor" && card.suit === leadSuit : true;
}

function playCard(playerIndex, cardIndex) {
  if (state.phase !== "trick_play" || state.turn !== playerIndex) return;
  const player = state.players[playerIndex];
  const card = player.hand[cardIndex];
  if (!canPlay(card, player.hand, state.leadSuit)) return;
  player.hand.splice(cardIndex, 1);
  state.trick.push({ playerIndex, card });
  say(playerIndex, dangerValue(card) > 0 ? "dangerPlay" : "play");
  if (!state.leadSuit && card.type !== "fool") {
    state.leadSuit = card.type === "major" ? "trump" : card.suit;
  }
  addLog(`${player.name} が ${card.name} を出しました。`);
  if (state.trick.length === 4) {
    render();
    setTimeout(resolveTrick, 1100);
  } else {
    state.turn = (state.turn + 1) % 4;
    render();
    maybeCpuTurn();
  }
}

function resolveTrick() {
  const winner = determineWinner();
  const cards = state.trick.map((t) => t.card);
  const risk = cards.reduce((sum, card) => sum + dangerValue(card), 0);
  state.players[winner].captured.push(...cards);
  state.lastWinner = winner;
  say(winner, risk > 0 ? "takeDanger" : "win");
  addLog(`${state.players[winner].name} がトリックを取りました。`);
  state.trick = [];
  state.leadSuit = null;
  state.leader = winner;
  state.turn = winner;
  updateScores();
  if (state.players.every((p) => p.hand.length === 0)) {
    endRound();
  } else {
    render();
    maybeCpuTurn();
  }
}

function determineWinner() {
  const active = state.trick.filter((t) => t.card.type !== "fool");
  const trumps = active.filter((t) => t.card.type === "major");
  if (trumps.length) {
    return trumps.reduce((best, t) => t.card.number > best.card.number ? t : best).playerIndex;
  }
  const suited = active.filter((t) => t.card.type === "minor" && t.card.suit === state.leadSuit);
  if (suited.length) {
    return suited.reduce((best, t) => t.card.strength > best.card.strength ? t : best).playerIndex;
  }
  return state.leader;
}

function endRound() {
  if (state.finalKitty.length) {
    state.players[state.lastWinner].captured.push(...state.finalKitty);
    addLog(`余り札${state.finalKitty.length}枚は最後の勝者 ${state.players[state.lastWinner].name} が受け取りました。`);
    state.finalKitty = [];
  }
  updateScores();
  if (state.deck.length < 4) {
    state.phase = "game_end";
    const ranked = getRankedPlayers();
    const lineKeys = ["gameWin", "gameSecond", "gameThird", "gameFourth"];
    ranked.forEach((p, index) => say(p.id, lineKeys[index]));
    addLog(`ゲーム終了。1位は ${ranked[0].name} です。`);
  } else {
    state.phase = "deal_config";
    state.round += 1;
    state.dealer = (state.dealer + 1) % 4;
    state.leader = state.dealer;
    addLog(`ラウンド終了。次の親は ${state.players[state.dealer].name} です。`);
  }
  render();
}

function getRankedPlayers() {
  return [...state.players].sort((a, b) => b.score - a.score || a.id - b.id);
}

function pick(lines) {
  return lines[Math.floor(Math.random() * lines.length)];
}

function say(playerIndex, context) {
  const options = LINES[playerIndex]?.[context] || LINES[playerIndex]?.ready || ["……"];
  state.dialogue[playerIndex] = pick(options);
}

function updateScores() {
  for (const p of state.players) {
    p.score = p.captured.reduce((sum, card) => sum + card.point, 0);
  }
}

function maybeCpuTurn() {
  if (state.phase !== "trick_play") return;
  if (state.players[state.turn].cpu || state.autoHuman) {
    setTimeout(() => {
      const p = state.players[state.turn];
      const idx = chooseCpuCard(p);
      playCard(p.id, idx);
    }, 520);
  }
}

function chooseCpuCard(player) {
  const legal = player.hand.map((card, idx) => ({ card, idx })).filter((x) => canPlay(x.card, player.hand, state.leadSuit));
  const currentRisk = state.trick.reduce((sum, t) => sum + dangerValue(t.card), 0);
  const sorted = [...legal].sort((a, b) => cardOrder(a.card) - cardOrder(b.card));
  if (!state.leadSuit) {
    const safeMinor = sorted.find((x) => x.card.type === "minor" && dangerValue(x.card) === 0);
    return (safeMinor || sorted[0]).idx;
  }
  const losing = sorted.filter((x) => !wouldCurrentlyWin(player.id, x.card));
  if (currentRisk > 0 && losing.length) return losing[0].idx;
  const disposableDanger = losing.find((x) => dangerValue(x.card) > 0);
  if (disposableDanger) return disposableDanger.idx;
  if (losing.length) return losing[0].idx;
  return [...legal].sort((a, b) => dangerValue(a.card) - dangerValue(b.card) || cardOrder(a.card) - cardOrder(b.card))[0].idx;
}

function wouldCurrentlyWin(playerIndex, card) {
  const savedTrick = state.trick;
  const savedLead = state.leadSuit;
  const hypotheticalLead = savedLead || (card.type === "fool" ? null : card.type === "major" ? "trump" : card.suit);
  state.trick = [...savedTrick, { playerIndex, card }];
  state.leadSuit = hypotheticalLead;
  const winner = determineWinner();
  state.trick = savedTrick;
  state.leadSuit = savedLead;
  return winner === playerIndex;
}

function dangerValue(card) {
  return Math.abs(card.point);
}

function cardOrder(card) {
  if (card.type === "fool") return 0;
  if (card.type === "major") return 100 + card.number;
  const suitIndex = SUITS.findIndex((s) => s.id === card.suit);
  return suitIndex * 20 + card.strength;
}

function sortHand(hand) {
  hand.sort((a, b) => cardOrder(a) - cardOrder(b));
}

function cardHTML(card, extra = "") {
  const classes = ["card", card.type, dangerValue(card) ? "danger" : "", extra].filter(Boolean).join(" ");
  const top = card.type === "minor" ? `${card.mark} ${card.short}` : String(card.number);
  const suit = card.type === "minor" ? `${card.glyph} ${card.suitLabel}` : card.type === "fool" ? "いつでも出せる" : "切り札";
  const point = card.point ? `${card.point}点` : "0点";
  return `<div class="${classes}">
    <span class="big">${top}</span>
    <span class="suit">${suit}</span>
    <span class="name">${card.name}</span>
    <span class="point">${point}</span>
  </div>`;
}

function render() {
  renderPlayers();
  renderTrick();
  renderHand();
  renderControls();
  renderInfo();
  $("statusLine").innerHTML = statusText();
  $("log").innerHTML = state.log.map((x) => `<div>${x}</div>`).join("");
}

function renderPlayers() {
  $("players").innerHTML = state.players.map((p) => `
    <article class="player ${p.id === state.turn && state.phase === "trick_play" ? "active" : ""} ${p.cpu ? "" : "human"}">
      <div class="portrait p${p.id}"><span class="face"></span><span class="accentmark"></span></div>
      <div>
        <p class="pname">${p.name}</p>
        <p class="ptag">${p.tag}</p>
        <p class="quote">「${state.dialogue[p.id] || ""}」</p>
        <div class="scoreline">
          <span>手札 ${p.hand.length}</span>
          <span>獲得 ${p.captured.length}</span>
          <span>得点 ${p.score}</span>
        </div>
      </div>
    </article>
  `).join("");
}

function renderTrick() {
  $("trick").innerHTML = state.players.map((p) => {
    const play = state.trick.find((t) => t.playerIndex === p.id);
    return `<div class="slot">${play ? cardHTML(play.card) : `<span class="slotname">${p.name}</span>`}</div>`;
  }).join("");
}

function renderHand() {
  const human = state.players[0];
  if (state.phase === "pass_cards") {
    $("hand").innerHTML = human.hand.map((card, idx) => {
      const selected = state.passSelection.has(idx);
      return `<button class="cardbutton" data-pass="${idx}" aria-label="${card.name}">${cardHTML(card, selected ? "selected selectable" : "selectable")}</button>`;
    }).join("");
    document.querySelectorAll("[data-pass]").forEach((btn) => btn.addEventListener("click", () => togglePass(Number(btn.dataset.pass))));
    return;
  }
  $("hand").innerHTML = human.hand.map((card, idx) => {
    const legal = state.phase === "trick_play" && state.turn === 0 && canPlay(card, human.hand, state.leadSuit);
    const cls = legal ? "playable" : "unplayable";
    return `<button class="cardbutton" data-play="${idx}" ${legal ? "" : "disabled"} aria-label="${card.name}">${cardHTML(card, cls)}</button>`;
  }).join("");
  document.querySelectorAll("[data-play]").forEach((btn) => btn.addEventListener("click", () => playCard(0, Number(btn.dataset.play))));
}

function togglePass(idx) {
  if (state.passSelection.has(idx)) {
    state.passSelection.delete(idx);
  } else if (state.passSelection.size < state.passCount) {
    state.passSelection.add(idx);
  } else if (state.passCount > 0) {
    const oldest = state.passSelection.values().next().value;
    state.passSelection.delete(oldest);
    state.passSelection.add(idx);
  }
  render();
}

function renderControls() {
  const maxDeal = Math.max(1, Math.floor(state.deck.length / 4));
  if (state.phase === "deal_config") {
    const suggested = Math.min(state.dealCount, maxDeal);
    $("controls").innerHTML = `
      <label>配る枚数 <input id="dealCount" type="number" min="1" max="${maxDeal}" value="${suggested}"></label>
      <label>交換枚数 <input id="passCount" type="number" min="0" max="${suggested}" value="${Math.min(state.passCount, suggested)}"></label>
      <button id="dealBtn" class="primary">ラウンド開始</button>
    `;
    $("dealBtn").addEventListener("click", beginRound);
  } else if (state.phase === "pass_cards") {
    $("controls").innerHTML = `
      <span>左隣へ渡すカードを ${state.passCount} 枚選んでください。</span>
      <button id="passBtn" class="primary" ${state.passSelection.size === state.passCount ? "" : "disabled"}>同時交換</button>
    `;
    $("passBtn").addEventListener("click", finishHumanPass);
  } else if (state.phase === "game_end") {
    $("controls").innerHTML = `<button id="againBtn" class="primary">もう一度</button>`;
    $("againBtn").addEventListener("click", startGame);
  } else {
    $("controls").innerHTML = `<span>${state.turn === 0 ? "出せるカードが明るく表示されています。" : "CPUの手番です。"}</span>`;
  }
}

function renderInfo() {
  const lead = state.leadSuit ? (state.leadSuit === "trump" ? "切り札" : SUITS.find((s) => s.id === state.leadSuit).label) : "未確定";
  $("roundInfo").innerHTML = [
    ["ラウンド", state.round],
    ["山札", state.deck.length],
    ["親", state.players[state.dealer]?.name || "-"],
    ["リード", lead],
    ["場の減点", state.trick.reduce((s, t) => s + t.card.point, 0)],
    ["余り札", state.finalKitty.length]
  ].map(([label, value]) => `<div class="stat"><span>${label}</span><b>${value}</b></div>`).join("");

  const seen = new Set();
  state.players.forEach((p) => p.captured.forEach((c) => seen.add(c.id)));
  state.trick.forEach((t) => seen.add(t.card.id));
  const remainingDanger = buildDeck().filter((c) => dangerValue(c) > 0 && !seen.has(c.id))
    .sort((a, b) => dangerValue(b) - dangerValue(a))
    .slice(0, 10);
  $("dangerInfo").innerHTML = remainingDanger.map((c) => `
    <div class="danger-row"><span>${c.name}</span><b>${c.point}</b></div>
  `).join("");
}

function statusText() {
  if (state.phase === "deal_config") return `第${state.round}ラウンド準備。親は ${state.players[state.dealer]?.name || "水原一彌"} です。`;
  if (state.phase === "pass_cards") return `交換フェーズ。危険札を押し付けるか、手札を整えるか。`;
  if (state.phase === "game_end") {
    const ranking = getRankedPlayers()
      .map((p, index) => `${index + 1}位 ${p.name} (${p.score}点)`)
      .join(" / ");
    return `<span class="toast">ゲーム終了。</span> ${ranking}`;
  }
  return `${state.players[state.turn].name} の手番。現在の場は ${state.trick.length}/4 枚です。`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}

function setHelpOpen(open) {
  const overlay = $("helpOverlay");
  const button = $("helpBtn");
  if (!overlay || !button) return;
  overlay.hidden = !open;
  button.setAttribute("aria-expanded", String(open));
}

document.addEventListener("click", (event) => {
  if (event.target.id === "newGameBtn") startGame();
  if (event.target.id === "autoBtn") {
    state.autoHuman = !state.autoHuman;
    event.target.textContent = state.autoHuman ? "自分で遊ぶ" : "CPUに任せる";
    maybeCpuTurn();
  }
  if (event.target.id === "helpBtn") setHelpOpen($("helpOverlay")?.hidden !== false);
  if (event.target.id === "helpCloseBtn" || event.target.id === "helpOverlay") setHelpOpen(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setHelpOpen(false);
});

startGame();
