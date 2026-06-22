const tileNames = {
  m: ["", "一萬", "二萬", "三萬", "四萬", "五萬", "六萬", "七萬", "八萬", "九萬"],
  p: ["", "一筒", "二筒", "三筒", "四筒", "五筒", "六筒", "七筒", "八筒", "九筒"],
  s: ["", "一索", "二索", "三索", "四索", "五索", "六索", "七索", "八索", "九索"],
  z: ["", "東", "南", "西", "北", "白", "發", "中"],
  f: ["", "春", "夏", "秋", "冬", "梅", "蘭", "菊", "竹"]
};

const suitColor = { m: "#bf2638", p: "#1b1f26", s: "#158057", z: "#202420", f: "#b98517" };
const suitMark = { m: "萬", p: "●", s: "♣", z: "", f: "✿" };

const players = [
  { name: "水原一彌", wind: "東", img: "p0", score: 25000, quote: "標準形から崩さず、勝ち筋だけ拾う。" },
  { name: "水原一埜", wind: "南", img: "p1", score: 25000, quote: "白が多いなら、白に聞けばいいじゃない。" },
  { name: "夕畑目ななよ", wind: "西", img: "p2", score: 25000, quote: "花牌の気配、卓の外側まで見えています。" },
  { name: "沖中真宵", wind: "北", img: "p3", score: 25000, quote: "九一二？ それ、もう一本道ですね。" }
];

const presets = [
  {
    id: "standard",
    name: "標準リーチ",
    description: "4人日本式、花牌なし、白4枚。",
    settings: { flowers: false, whiteStorm: false, cosmic: false, china: false, whiteCount: 4 }
  },
  {
    id: "white",
    name: "白だらけ",
    description: "白12枚。白色地平線を狙う実験卓。",
    settings: { flowers: false, whiteStorm: true, cosmic: false, china: false, whiteCount: 12 }
  },
  {
    id: "cosmic",
    name: "宇宙麻雀",
    description: "891、912、白發中、東南西を順子扱い。",
    settings: { flowers: false, whiteStorm: false, cosmic: true, china: false, whiteCount: 4 }
  },
  {
    id: "hybrid",
    name: "統合実験卓",
    description: "花牌、白増量、宇宙順子、中国役を全部オン。",
    settings: { flowers: true, whiteStorm: true, cosmic: true, china: true, whiteCount: 12 }
  }
];

const riichiYakuCatalog = [
  { id: "riichi", name: "立直", han: "1", status: "implemented" },
  { id: "menzen_tsumo", name: "門前清自摸和", han: "1", status: "implemented" },
  { id: "ippatsu", name: "一発", han: "1", status: "implemented" },
  { id: "pinfu", name: "平和", han: "1", status: "implemented" },
  { id: "tanyao", name: "断么九", han: "1", status: "implemented" },
  { id: "iipeikou", name: "一盃口", han: "1", status: "implemented" },
  { id: "yakuhai", name: "役牌", han: "1", status: "implemented" },
  { id: "rinshan", name: "嶺上開花", han: "1", status: "implemented" },
  { id: "chankan", name: "槍槓", han: "1", status: "implemented" },
  { id: "haitei", name: "海底摸月", han: "1", status: "implemented" },
  { id: "houtei", name: "河底撈魚", han: "1", status: "implemented" },
  { id: "double_riichi", name: "ダブル立直", han: "2", status: "implemented" },
  { id: "chiitoi", name: "七対子", han: "2", status: "implemented" },
  { id: "toitoi", name: "対々和", han: "2", status: "implemented" },
  { id: "sanankou", name: "三暗刻", han: "2", status: "implemented" },
  { id: "sanshoku_doukou", name: "三色同刻", han: "2", status: "implemented" },
  { id: "sankantsu", name: "三槓子", han: "2", status: "implemented" },
  { id: "sanshoku_doujun", name: "三色同順", han: "2/1", status: "implemented" },
  { id: "ikkitsuukan", name: "一気通貫", han: "2/1", status: "implemented" },
  { id: "chanta", name: "混全帯么九", han: "2/1", status: "implemented" },
  { id: "shousangen", name: "小三元", han: "2", status: "implemented" },
  { id: "honroutou", name: "混老頭", han: "2", status: "implemented" },
  { id: "ryanpeikou", name: "二盃口", han: "3", status: "implemented" },
  { id: "junchan", name: "純全帯么九", han: "3/2", status: "implemented" },
  { id: "honitsu", name: "混一色", han: "3/2", status: "implemented" },
  { id: "chinitsu", name: "清一色", han: "6/5", status: "implemented" },
  { id: "kokushi", name: "国士無双", han: "役満", status: "implemented" },
  { id: "suuankou", name: "四暗刻", han: "役満", status: "implemented" },
  { id: "daisangen", name: "大三元", han: "役満", status: "implemented" },
  { id: "shousuushii", name: "小四喜", han: "役満", status: "implemented" },
  { id: "daisuushii", name: "大四喜", han: "役満", status: "implemented" },
  { id: "tsuuiisou", name: "字一色", han: "役満", status: "implemented" },
  { id: "ryuuiisou", name: "緑一色", han: "役満", status: "implemented" },
  { id: "chinroutou", name: "清老頭", han: "役満", status: "implemented" },
  { id: "suukantsu", name: "四槓子", han: "役満", status: "implemented" },
  { id: "chuuren", name: "九蓮宝燈", han: "役満", status: "implemented" },
  { id: "tenhou", name: "天和", han: "役満", status: "implemented" },
  { id: "chiihou", name: "地和", han: "役満", status: "implemented" }
];

riichiYakuCatalog.push(
  { id: "sanrenkou", name: "三連刻", han: "2", status: "implemented" },
  { id: "suurenkou", name: "四連刻", han: "役満", status: "implemented" },
  { id: "daichisei", name: "大七星", han: "ダブル役満", status: "implemented" },
  { id: "suuankou_tanki", name: "四暗刻単騎", han: "ダブル役満", status: "implemented" },
  { id: "junsei_chuuren", name: "純正九蓮宝燈", han: "ダブル役満", status: "implemented" },
  { id: "kokushi_13men", name: "国士無双十三面待ち", han: "ダブル役満", status: "implemented" },
  { id: "hyakumangoku", name: "百万石", han: "役満", status: "planned" },
  { id: "daisharin", name: "大車輪", han: "役満", status: "implemented" },
  { id: "benikujaku", name: "紅孔雀", han: "役満", status: "planned" },
  { id: "renhou", name: "人和", han: "役満候補", status: "planned" }
);

const chineseFanCatalog = [
  { id: "big_four_winds", name: "大四喜", english: "Big Four Winds", fan: 88 },
  { id: "big_three_dragons", name: "大三元", english: "Big Three Dragons", fan: 88 },
  { id: "all_green", name: "緑一色", english: "All Green", fan: 88 },
  { id: "nine_gates", name: "九蓮宝燈", english: "Nine Gates", fan: 88 },
  { id: "four_kongs", name: "四槓", english: "Four Kongs", fan: 88 },
  { id: "seven_shifted_pairs", name: "連七対", english: "Seven Shifted Pairs", fan: 88 },
  { id: "thirteen_orphans", name: "十三么九", english: "Thirteen Orphans", fan: 88 },
  { id: "all_terminals", name: "清么九", english: "All Terminals", fan: 64 },
  { id: "little_four_winds", name: "小四喜", english: "Little Four Winds", fan: 64 },
  { id: "little_three_dragons", name: "小三元", english: "Little Three Dragons", fan: 64 },
  { id: "all_honors", name: "字一色", english: "All Honors", fan: 64 },
  { id: "four_concealed_pungs", name: "四暗刻", english: "Four Concealed Pungs", fan: 64 },
  { id: "pure_terminal_chows", name: "一色双龍会", english: "Pure Terminal Chows", fan: 64 },
  { id: "quadruple_chow", name: "一色四同順", english: "Quadruple Chow", fan: 48 },
  { id: "four_pure_shifted_pungs", name: "一色四節高", english: "Four Pure Shifted Pungs", fan: 48 },
  { id: "four_pure_shifted_chows", name: "一色四歩高", english: "Four Pure Shifted Chows", fan: 32 },
  { id: "three_kongs", name: "三槓", english: "Three Kongs", fan: 32 },
  { id: "all_terminals_and_honors", name: "混么九", english: "All Terminals and Honors", fan: 32 },
  { id: "seven_pairs", name: "七対", english: "Seven Pairs", fan: 24 },
  { id: "greater_honors_knitted", name: "七星不靠", english: "Greater Honors and Knitted Tiles", fan: 24 },
  { id: "all_even_pungs", name: "全双刻", english: "All Even Pungs", fan: 24 },
  { id: "full_flush", name: "清一色", english: "Full Flush", fan: 24 },
  { id: "pure_triple_chow", name: "一色三同順", english: "Pure Triple Chow", fan: 24 },
  { id: "pure_shifted_pungs", name: "一色三節高", english: "Pure Shifted Pungs", fan: 24 },
  { id: "upper_tiles", name: "全大", english: "Upper Tiles", fan: 24 },
  { id: "middle_tiles", name: "全中", english: "Middle Tiles", fan: 24 },
  { id: "lower_tiles", name: "全小", english: "Lower Tiles", fan: 24 },
  { id: "pure_straight", name: "清龍", english: "Pure Straight", fan: 16 },
  { id: "three_suited_terminal_chows", name: "三色双龍会", english: "Three-Suited Terminal Chows", fan: 16 },
  { id: "pure_shifted_chows", name: "一色三歩高", english: "Pure Shifted Chows", fan: 16 },
  { id: "all_fives", name: "全帯五", english: "All Fives", fan: 16 },
  { id: "triple_pung", name: "三同刻", english: "Triple Pung", fan: 16 },
  { id: "three_concealed_pungs", name: "三暗刻", english: "Three Concealed Pungs", fan: 16 },
  { id: "lesser_honors_knitted", name: "全不靠", english: "Lesser Honors and Knitted Tiles", fan: 12 },
  { id: "knitted_straight", name: "組合龍", english: "Knitted Straight", fan: 12 },
  { id: "upper_four", name: "大於五", english: "Upper Four", fan: 12 },
  { id: "lower_four", name: "小於五", english: "Lower Four", fan: 12 },
  { id: "big_three_winds", name: "三風刻", english: "Big Three Winds", fan: 12 },
  { id: "mixed_straight", name: "花龍", english: "Mixed Straight", fan: 8 },
  { id: "reversible_tiles", name: "推不倒", english: "Reversible Tiles", fan: 8 },
  { id: "mixed_triple_chow", name: "三色三同順", english: "Mixed Triple Chow", fan: 8 },
  { id: "mixed_shifted_pungs", name: "三色三節高", english: "Mixed Shifted Pungs", fan: 8 },
  { id: "chicken_hand", name: "無番和", english: "Chicken Hand", fan: 8 },
  { id: "last_tile_draw", name: "妙手回春", english: "Last Tile Draw", fan: 8 },
  { id: "last_tile_claim", name: "海底撈月", english: "Last Tile Claim", fan: 8 },
  { id: "out_with_replacement", name: "槓上開花", english: "Out with Replacement Tile", fan: 8 },
  { id: "robbing_kong", name: "搶槓和", english: "Robbing the Kong", fan: 8 },
  { id: "all_pungs", name: "碰碰和", english: "All Pungs", fan: 6 },
  { id: "half_flush", name: "混一色", english: "Half Flush", fan: 6 },
  { id: "mixed_shifted_chows", name: "三色三歩高", english: "Mixed Shifted Chows", fan: 6 },
  { id: "all_types", name: "五門斉", english: "All Types", fan: 6 },
  { id: "melded_hand", name: "全求人", english: "Melded Hand", fan: 6 },
  { id: "two_concealed_kongs", name: "双暗槓", english: "Two Concealed Kongs", fan: 6 },
  { id: "two_dragon_pungs", name: "双箭刻", english: "Two Dragon Pungs", fan: 6 },
  { id: "outside_hand", name: "全帯么", english: "Outside Hand", fan: 4 },
  { id: "fully_concealed_hand", name: "不求人", english: "Fully Concealed Hand", fan: 4 },
  { id: "two_melded_kongs", name: "双明槓", english: "Two Melded Kongs", fan: 4 },
  { id: "last_tile", name: "和絶張", english: "Last Tile", fan: 4 },
  { id: "dragon_pung", name: "箭刻", english: "Dragon Pung", fan: 2 },
  { id: "prevalent_wind", name: "圏風刻", english: "Prevalent Wind", fan: 2 },
  { id: "seat_wind", name: "門風刻", english: "Seat Wind", fan: 2 },
  { id: "concealed_hand", name: "門前清", english: "Concealed Hand", fan: 2 },
  { id: "all_chows", name: "平和", english: "All Chows", fan: 2 },
  { id: "tile_hog", name: "四帰一", english: "Tile Hog", fan: 2 },
  { id: "double_pung", name: "双同刻", english: "Double Pung", fan: 2 },
  { id: "two_concealed_pungs", name: "双暗刻", english: "Two Concealed Pungs", fan: 2 },
  { id: "concealed_kong", name: "暗槓", english: "Concealed Kong", fan: 2 },
  { id: "all_simples", name: "断么", english: "All Simples", fan: 2 },
  { id: "pure_double_chow", name: "一般高", english: "Pure Double Chow", fan: 1 },
  { id: "mixed_double_chow", name: "喜相逢", english: "Mixed Double Chow", fan: 1 },
  { id: "short_straight", name: "連六", english: "Short Straight", fan: 1 },
  { id: "two_terminal_chows", name: "老少副", english: "Two Terminal Chows", fan: 1 },
  { id: "terminal_honor_pung", name: "么九刻", english: "Pung of Terminals or Honors", fan: 1 },
  { id: "melded_kong", name: "明槓", english: "Melded Kong", fan: 1 },
  { id: "one_voided_suit", name: "缺一門", english: "One Voided Suit", fan: 1 },
  { id: "no_honors", name: "無字", english: "No Honors", fan: 1 },
  { id: "edge_wait", name: "辺張", english: "Edge Wait", fan: 1 },
  { id: "closed_wait", name: "嵌張", english: "Closed Wait", fan: 1 },
  { id: "single_wait", name: "単釣将", english: "Single Wait", fan: 1 },
  { id: "self_drawn", name: "自摸", english: "Self-Drawn", fan: 1 },
  { id: "flower_tiles", name: "花牌", english: "Flower Tiles", fan: 1 }
];

const excludedChineseFanIds = new Set([
  "all_chows",
  "all_simples",
  "half_flush",
  "full_flush",
  "dragon_pung",
  "prevalent_wind",
  "seat_wind",
  "big_four_winds",
  "big_three_dragons",
  "all_green",
  "nine_gates",
  "four_kongs",
  "thirteen_orphans",
  "all_terminals",
  "little_four_winds",
  "little_three_dragons",
  "all_honors",
  "four_concealed_pungs",
  "four_pure_shifted_pungs",
  "pure_shifted_pungs",
  "pure_straight",
  "three_kongs",
  "all_terminals_and_honors",
  "fully_concealed_hand",
  "triple_pung",
  "three_concealed_pungs",
  "mixed_triple_chow",
  "last_tile_draw",
  "last_tile_claim",
  "out_with_replacement",
  "robbing_kong",
  "all_pungs",
  "outside_hand"
]);

const implementedChineseFanIds = new Set([
  "seven_shifted_pairs",
  "pure_terminal_chows",
  "seven_pairs",
  "quadruple_chow",
  "four_pure_shifted_chows",
  "pure_triple_chow",
  "pure_double_chow",
  "three_suited_terminal_chows",
  "pure_shifted_chows",
  "all_fives",
  "all_even_pungs",
  "greater_honors_knitted",
  "lesser_honors_knitted",
  "knitted_straight",
  "two_terminal_chows",
  "tile_hog",
  "concealed_hand",
  "self_drawn",
  "upper_tiles",
  "middle_tiles",
  "lower_tiles",
  "upper_four",
  "lower_four",
  "all_types",
  "big_three_winds",
  "mixed_straight",
  "reversible_tiles",
  "mixed_shifted_pungs",
  "mixed_shifted_chows",
  "melded_hand",
  "two_concealed_kongs",
  "two_dragon_pungs",
  "two_concealed_pungs",
  "concealed_kong",
  "two_melded_kongs",
  "double_pung",
  "mixed_double_chow",
  "short_straight",
  "last_tile",
  "terminal_honor_pung",
  "melded_kong",
  "chicken_hand",
  "one_voided_suit",
  "no_honors",
  "edge_wait",
  "closed_wait",
  "single_wait",
  "flower_tiles"
]);

let state = {};
let autoTimer = null;
const roundNames = ["東一局", "東二局", "東三局", "東四局", "南一局", "南二局", "南三局", "南四局"];
const matchState = { honba: 0, riichiPot: 0 };

const el = {
  seats: [0, 1, 2, 3].map((i) => document.getElementById(`seat${i}`)),
  rivers: [0, 1, 2, 3].map((i) => document.getElementById(`river${i}`)),
  riichiSticks: document.getElementById("riichiSticks"),
  tableMelds: [0, 1, 2, 3].map((i) => document.getElementById(`tableMeld${i}`)),
  wallTop: document.getElementById("wallTop"),
  wallRight: document.getElementById("wallRight"),
  wallBottom: document.getElementById("wallBottom"),
  wallLeft: document.getElementById("wallLeft"),
  playerStatus: document.getElementById("playerStatus"),
  tableViewport: document.getElementById("tableViewport"),
  callPanel: document.getElementById("callPanel"),
  scoreOverlay: document.getElementById("scoreOverlay"),
  hand: document.getElementById("hand"),
  flowers: document.getElementById("flowers"),
  doraTiles: document.getElementById("doraTiles"),
  analysis: document.getElementById("analysis"),
  log: document.getElementById("log"),
  presets: document.getElementById("presets"),
  roundName: document.getElementById("roundName"),
  wallCount: document.getElementById("wallCount"),
  ruleName: document.getElementById("ruleName"),
  turnStatus: document.getElementById("turnStatus"),
  tsumoBtn: document.getElementById("tsumoBtn"),
  autoPlayBtn: document.getElementById("autoPlayBtn"),
  debugBtn: document.getElementById("debugBtn"),
  refreshLabBtn: document.getElementById("refreshLabBtn"),
  copyAgariBtn: document.getElementById("copyAgariBtn"),
  labResult: document.getElementById("labResult"),
  agariData: document.getElementById("agariData"),
  newRoundBtn: document.getElementById("newRoundBtn"),
  flowersToggle: document.getElementById("flowersToggle"),
  whiteStormToggle: document.getElementById("whiteStormToggle"),
  cosmicToggle: document.getElementById("cosmicToggle"),
  chinaToggle: document.getElementById("chinaToggle"),
  whiteCountInput: document.getElementById("whiteCountInput")
};

function tileId(suit, value, serial = 0) {
  return `${suit}${value}-${serial}`;
}

function label(tile) {
  return tileNames[tile.suit][tile.value];
}

function keyOf(tile) {
  return `${tile.suit}${tile.value}`;
}

function doraKeyFromIndicator(indicator) {
  if (!indicator) return null;
  if (["m", "p", "s"].includes(indicator.suit)) return `${indicator.suit}${indicator.value === 9 ? 1 : indicator.value + 1}`;
  if (indicator.suit !== "z") return null;
  if (indicator.value <= 4) return `z${indicator.value === 4 ? 1 : indicator.value + 1}`;
  return `z${indicator.value === 7 ? 5 : indicator.value + 1}`;
}

function countIndicatorDora(allTiles, indicators = []) {
  const counts = countMap(allTiles);
  return indicators.reduce((sum, indicator) => sum + (counts[doraKeyFromIndicator(indicator)] || 0), 0);
}

function doraBreakdownForTiles(playerIndex, allTiles) {
  const visibleIndicators = [...(state.dora || [])];
  const uraIndicators = state.riichi?.[playerIndex] ? [...(state.uraDora || [])] : [];
  return {
    visibleIndicators,
    uraIndicators,
    doraHan: countIndicatorDora(allTiles, visibleIndicators),
    uraDoraHan: countIndicatorDora(allTiles, uraIndicators),
    riichi: !!state.riichi?.[playerIndex]
  };
}

function makeTile(suit, value, serial) {
  return { id: tileId(suit, value, serial), suit, value };
}

function makeWall(settings) {
  const tiles = [];
  for (const suit of ["m", "p", "s"]) {
    for (let value = 1; value <= 9; value += 1) {
      for (let serial = 0; serial < 4; serial += 1) tiles.push(makeTile(suit, value, serial));
    }
  }
  for (let value = 1; value <= 7; value += 1) {
    const count = value === 5 ? Number(settings.whiteCount) : 4;
    for (let serial = 0; serial < count; serial += 1) tiles.push(makeTile("z", value, serial));
  }
  if (settings.flowers) {
    for (let value = 1; value <= 8; value += 1) tiles.push(makeTile("f", value, 0));
  }
  return shuffle(tiles);
}

function createDeadWall(tiles) {
  return {
    tiles: [...tiles],
    rinshan: tiles.slice(0, 4),
    doraIndicators: [tiles[4], tiles[6], tiles[8], tiles[10], tiles[12]],
    uraIndicators: [tiles[5], tiles[7], tiles[9], tiles[11], tiles[13]],
    replenished: []
  };
}

function makeWallState(settings) {
  const liveWall = makeWall(settings);
  const deadTiles = [];
  for (let index = liveWall.length - 1; index >= 0 && deadTiles.length < 14; index -= 1) {
    if (liveWall[index].suit === "f") continue;
    deadTiles.unshift(liveWall.splice(index, 1)[0]);
  }
  return { liveWall, deadWall: createDeadWall(deadTiles) };
}

function shuffle(items) {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function sortTiles(tiles) {
  const order = { m: 0, p: 1, s: 2, z: 3, f: 4 };
  return [...tiles].sort((a, b) => order[a.suit] - order[b.suit] || a.value - b.value);
}

function startRound(settings = state.settings || presets[0].settings, presetId = state.presetId || "standard", roundIndex = state.roundIndex || 0) {
  clearTimeout(autoTimer);
  const keepAutoPlay = !!state.autoPlay;
  const keepDebug = !!state.debug;
  const keepDebugMode = state.debugMode || "view";
  const keepDebugSeat = state.debugSeat ?? 0;
  const keepDebugTileKey = state.debugTileKey || "m1";
  const wallState = makeWallState(settings);
  state = {
    settings: { ...settings },
    presetId,
    roundIndex,
    wall: wallState.liveWall,
    deadWall: wallState.deadWall,
    dora: [],
    uraDora: [],
    turn: 0,
    phase: "discard",
    drawnTileId: null,
    hands: [[], [], [], []],
    rivers: [[], [], [], []],
    melds: [[], [], [], []],
    flowers: [[], [], [], []],
    riichi: [false, false, false, false],
    riichiIppatsu: [false, false, false, false],
    riichiPendingDiscard: [false, false, false, false],
    doubleRiichi: [false, false, false, false],
    discardCounts: [0, 0, 0, 0],
    callMade: false,
    pendingCall: null,
    pendingWin: null,
    pendingKan: null,
    scoreResult: null,
    autoPlay: keepAutoPlay,
    debug: keepDebug,
    debugMode: keepDebugMode,
    debugSeat: keepDebugSeat,
    debugTileKey: keepDebugTileKey,
    selectedDebugSeat: null,
    selectedDebugTile: null,
    log: []
  };
  revealDoraPair();
  for (let i = 0; i < 13; i += 1) {
    for (let player = 0; player < 4; player += 1) drawIntoHand(player, false);
  }
  addLog(`${roundNames[state.roundIndex % roundNames.length]}、配牌完了。あなたのツモまで自動で進めます。`);
  drawHumanAuto();
}

function drawIntoHand(playerIndex, markDrawn = true) {
  let tile = state.wall.pop();
  while (tile && tile.suit === "f") {
    state.flowers[playerIndex].push(tile);
    addLog(`${players[playerIndex].name}が${label(tile)}を抜いて補充。`);
    tile = state.wall.pop();
  }
  if (!tile) return null;
  state.hands[playerIndex].push(tile);
  if (markDrawn) state.drawnTileId = tile.id;
  return tile;
}

function addLog(message) {
  state.log.unshift(message);
  state.log = state.log.slice(0, 28);
}

function drawHumanAuto() {
  state.turn = 0;
  state.phase = "discard";
  const drawn = drawIntoHand(0, true);
  if (!drawn) {
    endRoundByDraw();
    return;
  }
  if (canWinNow(0, { type: "ツモ", player: 0, tile: drawn })) {
    state.pendingWin = { type: "ツモ", player: 0, tile: drawn };
    addLog(`あなたが${label(drawn)}をツモ。和了できます。`);
  } else if (state.riichi[0]) {
    if (!queueHumanClosedKan("リーチ中です。暗カン可能な面子があります。")) {
      addLog(`リーチ中のため、${label(drawn)}をツモ切りします。`);
      discardDrawnAfterRiichi();
      return;
    }
  } else if (queueHumanClosedKan("暗カン可能な面子があります。候補を選んでください。")) {
    // The call panel presents every available quad before the discard choice.
  } else {
    addLog(`あなたが${label(drawn)}をツモ。捨てる牌を選んでください。`);
  }
  render();
  scheduleHumanAuto();
}

function scheduleAutoAdvance(delay = 360) {
  clearTimeout(autoTimer);
  if (state.phase === "call" || state.phase === "ended" || state.scoreResult) return;
  autoTimer = setTimeout(autoAdvance, delay);
}

function scheduleHumanAuto(delay = 520) {
  if (!state.autoPlay || state.scoreResult || state.phase === "ended") return;
  clearTimeout(autoTimer);
  autoTimer = setTimeout(autoHumanDecision, delay);
}

function revealDoraPair() {
  const index = state.dora.length;
  const visible = state.deadWall?.doraIndicators?.[index] || null;
  const hidden = state.deadWall?.uraIndicators?.[index] || null;
  if (visible) state.dora.push(visible);
  if (hidden) state.uraDora.push(hidden);
}

function drawRinshanIntoHand(playerIndex, markDrawn = true) {
  const tile = state.deadWall?.rinshan?.pop() || null;
  if (!tile) return null;
  const deadTileIndex = state.deadWall.tiles.findIndex((item) => item.id === tile.id);
  if (deadTileIndex >= 0) state.deadWall.tiles.splice(deadTileIndex, 1);
  const replenished = state.wall.pop();
  if (replenished) {
    state.deadWall.replenished.push(replenished);
    state.deadWall.tiles.push(replenished);
  }
  state.hands[playerIndex].push(tile);
  if (markDrawn) state.drawnTileId = tile.id;
  return tile;
}

function resumeCpuTurnAfterAutoStop() {
  if (state.turn === 0 || state.phase !== "auto" || state.scoreResult) return;
  const playerIndex = state.turn;
  const needsDiscardAfterCall = state.hands[state.turn].length % 3 === 2;
  if (needsDiscardAfterCall) {
    autoTimer = setTimeout(() => cpuDiscardAfterCall(playerIndex), 180);
  } else {
    scheduleAutoAdvance(180);
  }
}

function autoHumanDecision() {
  if (!state.autoPlay || state.scoreResult || state.phase === "ended") return;
  if (state.pendingWin?.player === 0) {
    completeWin(state.pendingWin);
    return;
  }
  if (state.pendingCall) {
    addLog("オート進行: 鳴きをスキップします。");
    skipHumanCall();
    return;
  }
  if (state.pendingKan) {
    if (state.pendingKan.options.length && state.riichi[0]) {
      chooseHumanKan(0);
    } else {
      state.pendingKan = null;
      state.phase = "discard";
      render();
      scheduleHumanAuto(180);
    }
    return;
  }
  if (state.turn !== 0 || state.phase !== "discard" || state.hands[0].length % 3 !== 2) return;
  if (!state.riichi[0] && canRiichi(0) && Math.random() < 0.12) declareRiichi(0);
  const discardIndex = state.riichi[0]
    ? state.hands[0].findIndex((tile) => tile.id === state.drawnTileId)
    : chooseCpuDiscard(state.hands[0], 0);
  const discard = state.hands[0][discardIndex >= 0 ? discardIndex : chooseCpuDiscard(state.hands[0], 0)];
  addLog(`オート進行: ${label(discard)}を選択。`);
  discardHuman(discard.id);
}

function autoAdvance() {
  if (state.turn === 0 || state.phase !== "auto") return;
  const playerIndex = state.turn;
  const drawn = drawIntoHand(playerIndex, true);
  if (!drawn) {
    endRoundByDraw();
    return;
  }
  const cpuTsumoWin = { type: "ツモ", player: playerIndex, tile: drawn, auto: true };
  if (canWinNow(playerIndex, cpuTsumoWin)) {
    completeWin(cpuTsumoWin);
    return;
  }
  if (!state.riichi[playerIndex] && canRiichi(playerIndex) && Math.random() < 0.16) {
    declareRiichi(playerIndex);
  }
  if (state.riichi[playerIndex]) {
    const discardIndex = state.hands[playerIndex].findIndex((tile) => tile.id === state.drawnTileId);
    const discard = discardFrom(playerIndex, discardIndex >= 0 ? discardIndex : chooseCpuDiscard(state.hands[playerIndex], playerIndex));
    addLog(`${players[playerIndex].name}はリーチ中。${label(discard)}をツモ切り。`);
    render();
    handleAfterDiscard(playerIndex, discard);
    return;
  }
  const discard = discardFrom(playerIndex, chooseCpuDiscard(state.hands[playerIndex], playerIndex));
  addLog(`${players[playerIndex].name}が${label(drawn)}をツモ、${label(discard)}を打牌。`);
  render();
  handleAfterDiscard(playerIndex, discard);
}

function discardFrom(playerIndex, tileIndex) {
  const [tile] = state.hands[playerIndex].splice(tileIndex, 1);
  const isRiichiDeclaration = state.riichiPendingDiscard[playerIndex];
  const riverTile = { ...tile, riichiDiscard: isRiichiDeclaration, houteiDiscard: state.wall.length === 0 };
  state.rivers[playerIndex].push(riverTile);
  state.discardCounts[playerIndex] += 1;
  state.drawnTileId = null;
  if (isRiichiDeclaration) {
    state.riichiPendingDiscard[playerIndex] = false;
  } else if (state.riichiIppatsu[playerIndex]) {
    state.riichiIppatsu[playerIndex] = false;
  }
  return riverTile;
}

function discardHuman(tileId) {
  if (state.turn !== 0 || state.phase !== "discard" || state.hands[0].length % 3 !== 2) return;
  const index = state.hands[0].findIndex((tile) => tile.id === tileId);
  if (index < 0) return;
  state.pendingWin = null;
  const discard = discardFrom(0, index);
  addLog(`あなたが${label(discard)}を打牌。`);
  render();
  handleAfterDiscard(0, discard);
}

function handleAfterDiscard(discarder, tile) {
  if (discarder !== 0 && canWinWithDiscard(0, tile)) {
    state.pendingWin = { type: "ロン", player: 0, discarder, tile };
    state.phase = "win";
    addLog(`${label(tile)}でロンできます。`);
    render();
    scheduleHumanAuto();
    return;
  }
  const humanOptions = discarder !== 0 ? callOptionsFor(0, discarder, tile) : [];
  if (humanOptions.length) {
    state.pendingCall = { discarder, tile, options: humanOptions };
    state.phase = "call";
    addLog(`${label(tile)}を鳴けます。鳴くか、スキップしてください。`);
    render();
    scheduleHumanAuto();
    return;
  }

  const cpuCall = findCpuCall(discarder, tile);
  if (cpuCall) {
    applyCall(cpuCall.player, discarder, tile, cpuCall.option);
    addLog(`${players[cpuCall.player].name}が${label(tile)}を${cpuCall.option.type}。`);
    state.turn = cpuCall.player;
    state.phase = "auto";
    render();
    autoTimer = setTimeout(() => cpuDiscardAfterCall(cpuCall.player), 420);
    return;
  }

  advanceToNextDraw(discarder);
}

function advanceToNextDraw(discarder) {
  const next = (discarder + 1) % 4;
  if (next === 0) {
    drawHumanAuto();
  } else {
    state.turn = next;
    state.phase = "auto";
    render();
    scheduleAutoAdvance();
  }
}

function cpuDiscardAfterCall(playerIndex) {
  if (state.phase !== "auto" || state.turn !== playerIndex) return;
  const discard = discardFrom(playerIndex, chooseCpuDiscard(state.hands[playerIndex], playerIndex));
  addLog(`${players[playerIndex].name}が副露後、${label(discard)}を打牌。`);
  render();
  handleAfterDiscard(playerIndex, discard);
}

function callOptionsFor(playerIndex, discarder, tile) {
  if (state.riichi[playerIndex]) return [];
  const hand = state.hands[playerIndex];
  const options = [];
  const same = hand.filter((item) => keyOf(item) === keyOf(tile));
  if (same.length >= 2) {
    options.push({ type: "ポン", consume: [same[0].id, same[1].id], tiles: [tile, same[0], same[1]] });
  }
  if (isKamichaDiscardForChi(playerIndex, discarder) && ["m", "p", "s"].includes(tile.suit)) {
    for (const seq of chiSequences(tile)) {
      const need = seq.filter((value) => value !== tile.value);
      const picked = [];
      for (const value of need) {
        const found = hand.find((item) => item.suit === tile.suit && item.value === value && !picked.some((p) => p.id === item.id));
        if (found) picked.push(found);
      }
      if (picked.length === 2) {
        options.push({ type: "チー", consume: picked.map((item) => item.id), tiles: [tile, ...picked] });
      }
    }
  }
  return options;
}

function isKamichaDiscardForChi(playerIndex, discarder) {
  return discarder === (playerIndex + 1) % 4;
}

function chiSequences(tile) {
  const seqs = [];
  for (let start = 1; start <= 7; start += 1) {
    const seq = [start, start + 1, start + 2];
    if (seq.includes(tile.value)) seqs.push(seq);
  }
  if (state.settings.cosmic) {
    for (const seq of [[8, 9, 1], [9, 1, 2]]) {
      if (seq.includes(tile.value)) seqs.push(seq);
    }
  }
  return seqs;
}

function findCpuCall(discarder, tile) {
  for (let offset = 1; offset < 4; offset += 1) {
    const player = (discarder + offset) % 4;
    if (player === 0) continue;
    const pon = callOptionsFor(player, discarder, tile).find((option) => option.type === "ポン");
    if (pon && shouldCpuCall(player, pon)) return { player, option: pon };
  }
  const chiPlayer = (discarder + 3) % 4;
  if (chiPlayer !== 0) {
    const chi = callOptionsFor(chiPlayer, discarder, tile).find((option) => option.type === "チー");
    if (chi && shouldCpuCall(chiPlayer, chi)) return { player: chiPlayer, option: chi };
  }
  return null;
}

function shouldCpuCall(playerIndex, option) {
  return Math.random() < cpuCallProbability(playerIndex, option);
}

function isValueHonorTile(tile, playerIndex) {
  return tile?.suit === "z" && [5, 6, 7, roundWindValue(), seatWindValue(playerIndex)].includes(tile.value);
}

function cpuCallProbability(playerIndex, option) {
  const base = option.type === "ポン" ? 0.28 : 0.18;
  const calledTile = option.tiles[0];
  const handCounts = countMap(state.hands[playerIndex]);
  const specialPlan = cpuSpecialPlanProfile(state.hands[playerIndex], playerIndex);
  if (specialPlan.shanten <= 1) return 0;
  const closedReadiness = cpuClosedReadiness(playerIndex);
  if (closedReadiness === 0) return 0;
  const valueHonorCall = option.type === "ポン" && isValueHonorTile(calledTile, playerIndex);

  let probability = valueHonorCall ? 0.98 : base;
  const pairCandidates = Object.values(handCounts).filter((count) => count >= 2).length;
  if (option.type === "ポン" && pairCandidates >= 2) probability += Math.min(0.24, (pairCandidates - 1) * 0.08);

  const profile = flushPlanProfile(state.hands[playerIndex], playerIndex);
  const supportsFlush = calledTile.suit === profile.dominantSuit || calledTile.suit === "z";
  if (profile.effectiveFlushCount >= 7 && supportsFlush) {
    probability += profile.effectiveFlushCount >= 10 ? 0.55 : profile.effectiveFlushCount >= 8 ? 0.3 : 0.15;
    if (profile.valueHonorPairs > 0) probability += 0.12;
  } else if (profile.effectiveFlushCount >= 10 && calledTile.suit !== "z") {
    probability = 0.02;
  }
  if (closedReadiness === 1) {
    const createsTenpai = cpuCallCreatesTenpai(playerIndex, option);
    const cap = createsTenpai ? (valueHonorCall ? 0.22 : 0.12) : 0.04;
    probability = Math.min(probability, cap);
  }
  return Math.max(0.02, Math.min(0.95, probability));
}

function isTenpaiTileSetForPlayer(playerIndex, tiles) {
  if (tiles.length % 3 !== 1) return false;
  return allPrototypeTiles().some((draw) => isWinningHandWithTiles(playerIndex, [...tiles, draw]));
}

function cpuClosedReadiness(playerIndex) {
  if (state.melds[playerIndex].length > 0) return 2;
  const hand = state.hands[playerIndex];
  if (isTenpaiTileSetForPlayer(playerIndex, hand)) return 0;
  for (const draw of allPrototypeTiles()) {
    const expanded = [...hand, draw];
    const checkedDiscards = new Set();
    for (let index = 0; index < expanded.length; index += 1) {
      const discardKey = keyOf(expanded[index]);
      if (checkedDiscards.has(discardKey)) continue;
      checkedDiscards.add(discardKey);
      const afterDiscard = expanded.filter((_, tileIndex) => tileIndex !== index);
      if (isTenpaiTileSetForPlayer(playerIndex, afterDiscard)) return 1;
    }
  }
  return 2;
}

function cpuCallCreatesTenpai(playerIndex, option) {
  const previousMelds = state.melds;
  const remaining = state.hands[playerIndex].filter((tile) => !option.consume.includes(tile.id));
  try {
    state.melds[playerIndex] = [...previousMelds, { type: option.type, tiles: option.tiles }];
    const checkedDiscards = new Set();
    return remaining.some((tile, index) => {
      const discardKey = keyOf(tile);
      if (checkedDiscards.has(discardKey)) return false;
      checkedDiscards.add(discardKey);
      return isTenpaiTileSetForPlayer(playerIndex, remaining.filter((_, tileIndex) => tileIndex !== index));
    });
  } finally {
    state.melds[playerIndex] = previousMelds;
  }
}

function applyCall(playerIndex, discarder, tile, option) {
  const river = state.rivers[discarder];
  const discardIndex = river.findIndex((item) => item.id === tile.id);
  const calledDiscard = discardIndex >= 0 ? river[discardIndex] : null;
  if (discardIndex >= 0) river.splice(discardIndex, 1);
  if (calledDiscard?.riichiDiscard) {
    state.riichiPendingDiscard[discarder] = true;
  }
  state.callMade = true;
  for (const tileId of option.consume) {
    const handIndex = state.hands[playerIndex].findIndex((item) => item.id === tileId);
    if (handIndex >= 0) state.hands[playerIndex].splice(handIndex, 1);
  }
  state.melds[playerIndex].push({
    type: option.type,
    from: discarder,
    calledTileId: tile.id,
    tiles: meldDisplayTiles(playerIndex, discarder, tile, option.tiles)
  });
  state.drawnTileId = null;
  state.riichiIppatsu = state.riichiIppatsu.map(() => false);
}

function meldDisplayTiles(playerIndex, discarder, calledTile, tiles) {
  const owned = sortTiles(tiles.filter((item) => item.id !== calledTile.id));
  const relative = (discarder - playerIndex + 4) % 4;
  if (relative === 3) return [calledTile, ...owned];
  if (relative === 2) {
    const copy = [...owned];
    copy.splice(Math.min(1, copy.length), 0, calledTile);
    return copy;
  }
  return [...owned, calledTile];
}

function chooseHumanCall(index) {
  if (!state.pendingCall) return;
  const option = state.pendingCall.options[Number(index)];
  if (!option) return;
  applyCall(0, state.pendingCall.discarder, state.pendingCall.tile, option);
  addLog(`あなたが${label(state.pendingCall.tile)}を${option.type}。捨てる牌を選んでください。`);
  state.pendingCall = null;
  state.turn = 0;
  state.phase = "discard";
  render();
}

function skipHumanCall() {
  if (!state.pendingCall) return;
  const { discarder } = state.pendingCall;
  state.pendingCall = null;
  advanceToNextDraw(discarder);
}

function discardDrawnAfterRiichi() {
  const index = state.hands[0].findIndex((tile) => tile.id === state.drawnTileId);
  const discard = discardFrom(0, index >= 0 ? index : state.hands[0].length - 1);
  render();
  handleAfterDiscard(0, discard);
}

function closedKanOptions(playerIndex) {
  const counts = {};
  for (const tile of state.hands[playerIndex]) {
    const key = keyOf(tile);
    if (!counts[key]) counts[key] = [];
    counts[key].push(tile);
  }
  return Object.values(counts)
    .filter((tiles) => tiles.length >= 4)
    .map((tiles) => ({ type: "暗カン", consume: tiles.slice(0, 4).map((tile) => tile.id), tiles: tiles.slice(0, 4) }));
}

function queueHumanClosedKan(message) {
  const options = closedKanOptions(0);
  if (!options.length) return false;
  state.pendingKan = { player: 0, options };
  state.phase = "kan";
  addLog(message);
  return true;
}

function chooseHumanKan(index) {
  if (!state.pendingKan) return;
  const option = state.pendingKan.options[Number(index)];
  if (!option) return;
  for (const tileId of option.consume) {
    const handIndex = state.hands[0].findIndex((tile) => tile.id === tileId);
    if (handIndex >= 0) state.hands[0].splice(handIndex, 1);
  }
  state.melds[0].push({ type: "暗カン", from: 0, tiles: option.tiles });
  state.pendingKan = null;
  revealDoraPair();
  const drawn = drawRinshanIntoHand(0, true);
  addLog(`あなたが${label(option.tiles[0])}を暗カン。補充牌${drawn ? label(drawn) : "なし"}。`);
  state.phase = "discard";
  if (drawn && canWinNow(0, { type: "ツモ", player: 0, tile: drawn, rinshan: true })) {
    state.pendingWin = { type: "ツモ", player: 0, tile: drawn, rinshan: true };
  } else if (drawn && queueHumanClosedKan("嶺上牌の後も暗カン可能です。候補を選んでください。")) {
    // Consecutive closed kans are legal before discarding the replacement tile.
  } else if (state.riichi[0]) {
    discardDrawnAfterRiichi();
    return;
  }
  render();
  scheduleHumanAuto();
}

function allPrototypeTiles() {
  const tiles = [];
  for (const suit of ["m", "p", "s"]) {
    for (let value = 1; value <= 9; value += 1) tiles.push(makeTile(suit, value, 99));
  }
  for (let value = 1; value <= 7; value += 1) tiles.push(makeTile("z", value, 99));
  return tiles;
}

function debugTileFromKey(key) {
  const suit = key[0];
  const value = Number(key.slice(1));
  return makeTile(suit, value, Date.now() + Math.floor(Math.random() * 1000));
}

function addDebugRiverTile(riichiDiscard = false) {
  const tile = debugTileFromKey(state.debugTileKey);
  state.rivers[state.debugSeat].push({ ...tile, riichiDiscard });
  addLog(`表示確認: ${players[state.debugSeat].name}の河に${label(tile)}を追加しました。`);
  render();
}

function clearDebugRiver() {
  state.rivers[state.debugSeat] = [];
  addLog(`表示確認: ${players[state.debugSeat].name}の河をクリアしました。`);
  render();
}

function toggleDebugRiichiStick() {
  state.riichi[state.debugSeat] = !state.riichi[state.debugSeat];
  if (!state.riichi[state.debugSeat]) {
    state.riichiIppatsu[state.debugSeat] = false;
    state.riichiPendingDiscard[state.debugSeat] = false;
  }
  addLog(`表示確認: ${players[state.debugSeat].name}のリーチ棒を${state.riichi[state.debugSeat] ? "表示" : "非表示"}にしました。`);
  render();
}

function makeDebugTiles(keys, serialBase = Date.now()) {
  return keys.map((key, index) => makeTile(key[0], Number(key.slice(1)), serialBase + index));
}

function setupChankanScenario() {
  clearTimeout(autoTimer);
  state.hands[0] = makeDebugTiles(["m2", "m3", "m5", "m6", "m7", "p2", "p3", "p4", "s3", "s4", "s5", "z5", "z5"], 81000);
  state.hands[1] = makeDebugTiles(["m4", "p1", "p9", "s1", "s9", "z1", "z2", "z3", "z4", "z5", "z6"], 82000);
  state.hands[2] = makeDebugTiles(["m1", "m9", "p1", "p9", "s1", "s9", "z1", "z2", "z3", "z4", "z5", "z6", "z7"], 83000);
  state.hands[3] = makeDebugTiles(["m1", "m9", "p1", "p9", "s1", "s9", "z1", "z2", "z3", "z4", "z5", "z6", "z7"], 84000);
  const ponTiles = makeDebugTiles(["m4", "m4", "m4"], 85000);
  const addedTile = makeTile("m", 4, 86000);
  state.melds = [[], [{ type: "ポン", from: 0, calledTileId: ponTiles[0].id, tiles: ponTiles }], [], []];
  state.rivers = [[], [], [], []];
  state.flowers = [[], [], [], []];
  state.riichi = [false, false, false, false];
  state.riichiIppatsu = [false, false, false, false];
  state.riichiPendingDiscard = [false, false, false, false];
  state.pendingCall = null;
  state.pendingKan = null;
  state.scoreResult = null;
  state.drawnTileId = null;
  state.turn = 1;
  state.phase = "win";
  state.pendingWin = { type: "ロン", player: 0, discarder: 1, tile: addedTile, chankan: true };
  addLog(`${players[1].name}が${label(addedTile)}を加カンしようとしています。槍槓でロンできます。`);
  render();
}

const debugAgariScenarios = {
  greater_knitted: { label: "七星不靠", hand: ["m1", "m4", "s2", "s8", "p3", "p6", "p9", "z1", "z2", "z3", "z4", "z5", "z6"], win: "z7" },
  lesser_knitted: { label: "全不靠", hand: ["s1", "s4", "s7", "m2", "m8", "p3", "p6", "p9", "z1", "z2", "z3", "z4", "z5"], win: "z7" },
  lesser_with_straight: { label: "全不靠＋組合龍", hand: ["p1", "p4", "p7", "s2", "s5", "s8", "m3", "m6", "m9", "z2", "z3", "z4", "z5"], win: "z7" },
  knitted_edge: { label: "組合龍 7m", hand: ["m1", "m4", "m7", "s2", "s5", "s8", "p3", "p6", "p9", "m8", "m9", "s9", "s9"], win: "m7" },
  knitted_closed: { label: "組合龍 5s", hand: ["m1", "m4", "m7", "s2", "s5", "s8", "p3", "p6", "p9", "s4", "s6", "s5", "s5"], win: "s5" },
  knitted_single: { label: "組合龍 西単騎", hand: ["m1", "m4", "m7", "s2", "s5", "s8", "p3", "p6", "p9", "z7", "z7", "z7", "z3"], win: "z3" },
  edge_wait: { label: "辺張 3m", hand: ["m1", "m2", "p1", "p2", "p3", "s1", "s2", "s3", "m4", "m5", "m6", "z1", "z1"], win: "m3" },
  closed_wait: { label: "嵌張 5m", hand: ["m4", "m6", "p1", "p2", "p3", "s1", "s2", "s3", "m7", "m8", "m9", "z1", "z1"], win: "m5" },
  single_wait: { label: "単釣将 東", hand: ["m1", "m2", "m3", "p1", "p2", "p3", "s1", "s2", "s3", "m4", "m5", "m6", "z1"], win: "z1" }
};

const debugCpuSpecialScenarios = {
  greater_knitted_iishanten: {
    label: "CPU 七星不靠1向聴",
    hand: ["z1", "z2", "z3", "z4", "z5", "z6", "m1", "m4", "m7", "s2", "s5", "p3", "p2", "p2"]
  },
  lesser_knitted_iishanten: {
    label: "CPU 全不靠1向聴",
    hand: ["z1", "z3", "z5", "z7", "m1", "m4", "m7", "s2", "s5", "s8", "p3", "p6", "p2", "p2"]
  },
  knitted_straight_iishanten: {
    label: "CPU 組合龍1向聴",
    hand: ["m1", "m4", "m7", "s2", "s5", "s8", "p3", "m2", "m3", "m4", "z1", "z1", "z5", "z6"]
  }
};

function setupAgariDebugScenario(scenarioId) {
  const scenario = debugAgariScenarios[scenarioId];
  if (!scenario) return;
  clearTimeout(autoTimer);
  state.autoPlay = false;
  state.settings = { ...state.settings, china: true, cosmic: false };
  state.presetId = "custom";
  state.hands[0] = makeDebugTiles(scenario.hand, 87000);
  const winningTile = makeTile(scenario.win[0], Number(scenario.win.slice(1)), 87999);
  state.hands[0].push(winningTile);
  state.melds = [[], [], [], []];
  state.rivers = [[], [], [], []];
  state.flowers = [[], [], [], []];
  state.dora = [];
  state.uraDora = [];
  state.wall = makeDebugTiles(Array.from({ length: 24 }, () => "p1"), 88000);
  state.deadWall = createDeadWall(makeDebugTiles(["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "p1", "p2", "p3", "p4", "p5"], 88500));
  state.riichi = [false, false, false, false];
  state.riichiIppatsu = [false, false, false, false];
  state.riichiPendingDiscard = [false, false, false, false];
  state.doubleRiichi = [false, false, false, false];
  state.callMade = false;
  state.discardCounts = [1, 1, 1, 1];
  state.pendingCall = null;
  state.pendingKan = null;
  state.scoreResult = null;
  state.drawnTileId = winningTile.id;
  state.turn = 0;
  state.phase = "win";
  const win = { type: "ツモ", player: 0, tile: winningTile, debugScenario: scenarioId };
  state.pendingWin = canWinNow(0, win) ? win : null;
  state.debugMode = "view";
  state.selectedDebugSeat = null;
  state.selectedDebugTile = null;
  addLog(state.pendingWin
    ? `状況再現「${scenario.label}」: ${label(winningTile)}をツモ。和了ボタンで点数を確認できます。`
    : `状況再現「${scenario.label}」の和了判定に失敗しました。`);
  render();
}

function setupCpuSpecialDebugScenario(scenarioId) {
  const scenario = debugCpuSpecialScenarios[scenarioId];
  if (!scenario) return;
  clearTimeout(autoTimer);
  state.autoPlay = true;
  state.settings = { ...state.settings, china: true, cosmic: false, flowers: false, whiteStorm: false, whiteCount: 4 };
  state.presetId = "custom";
  const scenarioWallState = makeWallState(state.settings);
  const scenarioWall = scenarioWallState.liveWall;
  state.deadWall = scenarioWallState.deadWall;
  state.dora = [];
  state.uraDora = [];
  revealDoraPair();
  state.hands = [[], [], [], []];
  scenario.hand.forEach((code) => {
    const wallIndex = scenarioWall.findIndex((tile) => keyOf(tile) === code);
    if (wallIndex >= 0) state.hands[0].push(scenarioWall.splice(wallIndex, 1)[0]);
  });
  for (let count = 0; count < 13; count += 1) {
    for (let playerIndex = 1; playerIndex < 4; playerIndex += 1) {
      state.hands[playerIndex].push(scenarioWall.pop());
    }
  }
  state.wall = scenarioWall;
  state.melds = [[], [], [], []];
  state.rivers = [[], [], [], []];
  state.flowers = [[], [], [], []];
  state.riichi = [false, false, false, false];
  state.riichiIppatsu = [false, false, false, false];
  state.riichiPendingDiscard = [false, false, false, false];
  state.doubleRiichi = [false, false, false, false];
  state.callMade = false;
  state.discardCounts = [0, 0, 0, 0];
  state.pendingCall = null;
  state.pendingKan = null;
  state.pendingWin = null;
  state.scoreResult = null;
  state.turn = 0;
  state.phase = "discard";
  state.drawnTileId = state.hands[0][state.hands[0].length - 1]?.id || null;
  const discardIndex = chooseCpuDiscard(state.hands[0], 0);
  const discarded = discardFrom(0, discardIndex);
  const special = cpuSpecialPlanProfile(state.hands[0], 0);
  state.debugMode = "view";
  state.selectedDebugSeat = null;
  state.selectedDebugTile = null;
  addLog(`CPU思考再現「${scenario.label}」をオート観戦します。${label(discarded)}を捨て、${special.label} ${special.shanten}向聴を維持しました。`);
  render();
  handleAfterDiscard(0, discarded);
}

function knittedAssignments() {
  const groups = [[1, 4, 7], [2, 5, 8], [3, 6, 9]];
  const permutations = [
    [0, 1, 2], [0, 2, 1], [1, 0, 2],
    [1, 2, 0], [2, 0, 1], [2, 1, 0]
  ];
  return permutations.map((permutation) => {
    const bySuit = Object.fromEntries(["m", "p", "s"].map((suit, index) => [suit, groups[permutation[index]]]));
    const requiredKeys = Object.entries(bySuit).flatMap(([suit, values]) => values.map((value) => `${suit}${value}`));
    return { bySuit, requiredKeys, requiredKeySet: new Set(requiredKeys) };
  });
}

function honorsKnittedInfo(playerIndex, tiles) {
  if (!state.settings.china || state.melds[playerIndex].length || tiles.length !== 14) return null;
  const counts = countMap(tiles);
  if (Object.values(counts).some((count) => count !== 1)) return null;
  for (const assignment of knittedAssignments()) {
    const valid = tiles.every((tile) => tile.suit === "z" || assignment.requiredKeySet.has(keyOf(tile)));
    if (!valid) continue;
    const honorCount = tiles.filter((tile) => tile.suit === "z").length;
    const numberCount = tiles.length - honorCount;
    return { ...assignment, honorCount, numberCount, greater: honorCount === 7 && numberCount === 7 };
  }
  return null;
}

function isGreaterHonorsKnitted(playerIndex, tiles) {
  return !!honorsKnittedInfo(playerIndex, tiles)?.greater;
}

function isLesserHonorsKnitted(playerIndex, tiles) {
  const info = honorsKnittedInfo(playerIndex, tiles);
  return !!info && !info.greater;
}

function knittedRemainderShape(playerIndex, tiles, assignment) {
  if (state.melds[playerIndex].length > 1) return null;
  const counts = countMap(tiles);
  for (const key of assignment.requiredKeys) {
    if (!counts[key]) return null;
    counts[key] -= 1;
  }
  const remainingKeys = Object.entries(counts).flatMap(([key, count]) => Array.from({ length: count }, () => key));
  if (state.melds[playerIndex].length === 1) {
    if (remainingKeys.length !== 2 || remainingKeys[0] !== remainingKeys[1]) return null;
    return { pair: remainingKeys[0], melds: [] };
  }
  if (remainingKeys.length !== 5) return null;
  for (const pair of [...new Set(remainingKeys)]) {
    if ((counts[pair] || 0) < 2) continue;
    const restCounts = { ...counts, [pair]: counts[pair] - 2 };
    const meldKeys = Object.entries(restCounts).flatMap(([key, count]) => Array.from({ length: count }, () => key));
    if (meldKeys.length !== 3) continue;
    if (meldKeys.every((key) => key === meldKeys[0])) return { pair, melds: [{ type: "triplet", keys: meldKeys }] };
    if (chineseSequenceSignature(meldKeys)) return { pair, melds: [{ type: "sequence", keys: meldKeys }] };
  }
  return null;
}

function knittedPatternInfos(tiles) {
  const counts = countMap(tiles);
  return knittedAssignments().filter((assignment) => assignment.requiredKeys.every((key) => (counts[key] || 0) >= 1));
}

function findKnittedPatternInfo(tiles) {
  return knittedPatternInfos(tiles)[0] || null;
}

function findKnittedStraightInfo(playerIndex, tiles) {
  if (!state.settings.china) return null;
  for (const assignment of knittedPatternInfos(tiles)) {
    const remainderShape = knittedRemainderShape(playerIndex, tiles, assignment);
    if (remainderShape) return { ...assignment, remainderShape };
  }
  return null;
}

function tilesBeforeWin(tiles, win) {
  if (!win?.tile) return null;
  const exactIndex = tiles.findIndex((tile) => tile.id === win.tile.id);
  const fallbackIndex = tiles.map(keyOf).lastIndexOf(keyOf(win.tile));
  const removeIndex = exactIndex >= 0 ? exactIndex : fallbackIndex;
  return removeIndex >= 0 ? tiles.filter((_, index) => index !== removeIndex) : null;
}

function winningTileKeysForBase(playerIndex, baseTiles) {
  return allPrototypeTiles()
    .filter((draw) => isWinningHandWithTiles(playerIndex, [...baseTiles, draw]))
    .map(keyOf);
}

function cosmicHonorWaitType(meld, winKey) {
  if (!state.settings.cosmic || meld.type !== "sequence" || !meld.keys.includes(winKey)) return null;
  const keys = new Set(meld.keys);
  if (keys.size !== 3) return null;
  if (["z5", "z6", "z7"].every((key) => keys.has(key))) return "edge";
  if (![...keys].every((key) => ["z1", "z2", "z3", "z4"].includes(key))) return null;
  const tatsu = [...keys].filter((key) => key !== winKey).sort().join("");
  return ["z1z3", "z2z4"].includes(tatsu) ? "closed" : "ryanmen";
}

function waitYakuForHand(playerIndex, tiles, win, knittedInfo = null) {
  const baseTiles = tilesBeforeWin(tiles, win);
  if (!baseTiles) return null;
  if (isGreaterHonorsKnitted(playerIndex, tiles) || isLesserHonorsKnitted(playerIndex, tiles)) return null;
  const winKey = keyOf(win.tile);
  if (knittedInfo?.requiredKeySet.has(winKey)) return null;
  const shapes = standardShapes(tiles, state.settings);
  if (knittedInfo?.remainderShape) shapes.push(knittedInfo.remainderShape);
  const cosmicHonorTypes = new Set(shapes.flatMap((shape) => shape.melds.map((meld) => cosmicHonorWaitType(meld, winKey))).filter(Boolean));
  if (cosmicHonorTypes.has("edge")) {
    return { id: "mcr_edge_wait", name: "辺張", point: 1, note: "宇宙麻雀の三元牌順子を完成させる辺張。" };
  }
  if (cosmicHonorTypes.has("closed")) {
    return { id: "mcr_closed_wait", name: "嵌張", point: 1, note: "宇宙麻雀の向かい合う風牌ターツを完成させる嵌張。" };
  }
  if (new Set(winningTileKeysForBase(playerIndex, baseTiles)).size !== 1) return null;
  if (shapes.some((shape) => shape.pair === winKey)) {
    return { id: "mcr_single_wait", name: "単釣将", point: 1, note: "四面子一雀頭の単騎1種待ち。" };
  }
  for (const shape of shapes) {
    for (const meld of shape.melds) {
      if (meld.type !== "sequence" || !meld.keys.includes(winKey) || !["m", "p", "s"].includes(winKey[0])) continue;
      const values = meld.keys.map((key) => Number(key.slice(1))).sort((a, b) => a - b);
      if (!(values[1] === values[0] + 1 && values[2] === values[1] + 1)) continue;
      const winValue = Number(winKey.slice(1));
      if (winValue === values[1]) return { id: "mcr_closed_wait", name: "嵌張", point: 1, note: "嵌張の1種待ち。" };
      if (!state.settings.cosmic && ((values[0] === 1 && winValue === 3) || (values[0] === 7 && winValue === 7))) {
        return { id: "mcr_edge_wait", name: "辺張", point: 1, note: "辺張の1種待ち。" };
      }
    }
  }
  return null;
}

function isWinningHand(playerIndex, extraTile = null) {
  const hand = extraTile ? [...state.hands[playerIndex], extraTile] : state.hands[playerIndex];
  return isWinningHandWithTiles(playerIndex, hand);
}

function canWinNow(playerIndex, win) {
  const tiles = scoringTilesForWin(win);
  return isWinningHandWithTiles(playerIndex, tiles) && hasRequiredYaku(playerIndex, tiles, win);
}

function hasRequiredYaku(playerIndex, tiles, win) {
  if (allowsYakuelessWin(playerIndex)) return true;
  const yaku = yakuList(tiles, state.settings, state.flowers[playerIndex], playerIndex, { win });
  if (state.settings.china) return hybridScoreBreakdown(yaku).totalPoint >= 2;
  return yaku.some((item) => isRealAgariYaku(item));
}

function isRealAgariYaku(yaku) {
  const id = yaku.id || yaku.name;
  return !["dora", "aka_dora", "ura_dora", "flower", "bonus"].includes(id);
}

function allowsYakuelessWin(playerIndex) {
  return false;
}

function isWinningHandWithTiles(playerIndex, tiles) {
  return isStandardWinForPlayer(playerIndex, tiles, state.settings) ||
    isChiitoiForPlayer(playerIndex, tiles) ||
    isChineseSevenPairsForPlayer(playerIndex, tiles) ||
    isKokushiForPlayer(playerIndex, tiles) ||
    (state.settings.china && (
      isGreaterHonorsKnitted(playerIndex, tiles) ||
      isLesserHonorsKnitted(playerIndex, tiles) ||
      !!findKnittedStraightInfo(playerIndex, tiles)
    ));
}

function canWinWithDiscard(playerIndex, tile) {
  return canWinNow(playerIndex, { type: "ロン", player: playerIndex, discarder: state.turn, tile });
}

function winningTilesFor(playerIndex) {
  if (state.hands[playerIndex].length % 3 !== 1) return [];
  return allPrototypeTiles().filter((tile) => canWinNow(playerIndex, { type: "ロン", player: playerIndex, tile }));
}

function isTenpaiAfterDiscard(playerIndex, discardId) {
  const base = state.hands[playerIndex].filter((tile) => tile.id !== discardId);
  return allPrototypeTiles().some((draw) => isWinningHandWithTiles(playerIndex, [...base, draw]));
}

function isTenpaiNow(playerIndex) {
  if (state.hands[playerIndex].length % 3 !== 1) return false;
  return allPrototypeTiles().some((draw) => isWinningHandWithTiles(playerIndex, [...state.hands[playerIndex], draw]));
}

function canRiichi(playerIndex) {
  return !state.riichi[playerIndex] &&
    players[playerIndex].score >= 1000 &&
    state.melds[playerIndex].length === 0 &&
    state.hands[playerIndex].length % 3 === 2 &&
    state.hands[playerIndex].some((tile) => isTenpaiAfterDiscard(playerIndex, tile.id));
}

function declareRiichi(playerIndex) {
  if (!canRiichi(playerIndex)) return false;
  state.riichi[playerIndex] = true;
  state.riichiIppatsu[playerIndex] = true;
  state.riichiPendingDiscard[playerIndex] = true;
  state.doubleRiichi[playerIndex] = state.discardCounts[playerIndex] === 0 && !state.callMade;
  players[playerIndex].score -= 1000;
  matchState.riichiPot += 1;
  addLog(`${players[playerIndex].name}がリーチ。1000点棒を供託しました。`);
  render();
  return true;
}

function completeWin(win) {
  if (!canWinNow(win.player, win)) {
    addLog("和了形ですが、役がないため和了できません。");
    state.pendingWin = null;
    render();
    return;
  }
  state.pendingWin = null;
  state.phase = "scoring";
  state.scoreResult = calculateScore(win);
  addLog(`${players[win.player].name}の${win.type}。点数計算へ移ります。`);
  render();
}

function skipPendingWin() {
  if (!state.pendingWin || state.pendingWin.player !== 0) return;
  const skipped = state.pendingWin;
  state.pendingWin = null;
  if (skipped.type === "ツモ") {
    addLog(`${label(skipped.tile)}のツモ和了を見逃しました。`);
    if (state.riichi[0]) {
      discardDrawnAfterRiichi();
    } else {
      state.phase = "discard";
      render();
    }
    return;
  }
  addLog(`${label(skipped.tile)}のロンを見逃しました。`);
  continueAfterRonSkip(skipped.discarder, skipped.tile);
}

function continueAfterRonSkip(discarder, tile) {
  const humanOptions = discarder !== 0 ? callOptionsFor(0, discarder, tile) : [];
  if (humanOptions.length) {
    state.pendingCall = { discarder, tile, options: humanOptions };
    state.phase = "call";
    addLog(`${label(tile)}を鳴けます。鳴くか、スキップしてください。`);
    render();
    return;
  }
  const cpuCall = findCpuCall(discarder, tile);
  if (cpuCall) {
    applyCall(cpuCall.player, discarder, tile, cpuCall.option);
    addLog(`${players[cpuCall.player].name}が${label(tile)}を${cpuCall.option.type}。`);
    state.turn = cpuCall.player;
    state.phase = "auto";
    render();
    autoTimer = setTimeout(() => cpuDiscardAfterCall(cpuCall.player), 420);
    return;
  }
  advanceToNextDraw(discarder);
}

function endRoundByDraw() {
  state.phase = "scoring";
  state.scoreResult = calculateDrawScore();
  addLog("山がなくなりました。流局の点数計算へ移ります。");
  render();
}

function ceil100(value) {
  return Math.ceil(value / 100) * 100;
}

function ceil1000(value) {
  return Math.ceil(value / 1000) * 1000;
}

function riichiHanToChinaPoint(han) {
  const table = { 0: 0, 1: 2, 2: 6, 3: 12, 4: 16, 5: 24, 6: 32, 7: 40, 8: 48, 9: 53, 10: 58, 11: 64, 12: 76 };
  if (han >= 13) return Math.floor(han / 13) * 88 + (table[han % 13] || 0);
  return table[Math.max(0, Math.min(12, han))] || 0;
}

function isChinaPointYaku(yaku) {
  return !yaku.id || yaku.source === "china" || yaku.id === "flower";
}

function hybridScoreBreakdown(yaku) {
  const riichiHan = yaku
    .filter((item) => !isChinaPointYaku(item))
    .reduce((sum, item) => sum + Math.max(0, item.point || 0), 0);
  const riichiPoint = riichiHanToChinaPoint(riichiHan);
  const chinaPoint = yaku
    .filter(isChinaPointYaku)
    .reduce((sum, item) => sum + Math.max(0, item.point || 0), 0);
  return {
    riichiHan,
    riichiPoint,
    chinaPoint,
    totalPoint: riichiPoint + chinaPoint,
    minWinPoint: 2
  };
}

function hybridChildRonPayment(totalPoint) {
  if (totalPoint >= 88) return (totalPoint / 88) * 32000;
  const anchors = [
    { point: 2, payment: 1000 },
    { point: 6, payment: 2000 },
    { point: 12, payment: 3900 },
    { point: 16, payment: 8000 },
    { point: 32, payment: 12000 },
    { point: 48, payment: 16000 },
    { point: 64, payment: 24000 },
    { point: 88, payment: 32000 }
  ];
  if (totalPoint <= 2) return 1000;
  for (let index = 1; index < anchors.length; index += 1) {
    const prev = anchors[index - 1];
    const next = anchors[index];
    if (totalPoint <= next.point) {
      const ratio = (totalPoint - prev.point) / (next.point - prev.point);
      return prev.payment + (next.payment - prev.payment) * ratio;
    }
  }
  return 32000;
}

function hybridRoundPayment(value, totalPoint) {
  return totalPoint >= 16 ? ceil1000(value) : ceil100(value);
}

function hybridLimitName(totalPoint) {
  if (totalPoint >= 88) {
    const count = Math.max(1, Math.floor(totalPoint / 88));
    return count === 1 ? "役満" : count === 2 ? "ダブル役満" : count === 3 ? "トリプル役満" : `${count}倍役満`;
  }
  if (totalPoint >= 64) return "三倍満";
  if (totalPoint >= 48) return "倍満";
  if (totalPoint >= 32) return "跳満";
  if (totalPoint >= 16) return "満貫";
  if (totalPoint >= 12) return "3翻相当";
  if (totalPoint >= 6) return "2翻相当";
  if (totalPoint >= 2) return "1翻相当";
  return "役なし";
}

function calculateHybridScore(win, displayType, yaku, breakdown, doraBreakdown) {
  const winner = win.player;
  const dealer = state.roundIndex % 4;
  const isDealer = winner === dealer;
  const totalPoint = breakdown.totalPoint;
  const childRon = hybridChildRonPayment(totalPoint);
  const movements = [0, 0, 0, 0];
  const rows = [
    `混合点: 日本翻${breakdown.riichiPoint}点 + 中国役${breakdown.chinaPoint}点 = ${totalPoint}点`
  ];
  if (win.discarder !== undefined) {
    const basePayment = childRon * (isDealer ? 1.5 : 1);
    const payment = hybridRoundPayment(basePayment, totalPoint) + matchState.honba * 300;
    movements[winner] += payment;
    movements[win.discarder] -= payment;
    rows.push(`${players[win.discarder].name} -> ${players[winner].name}: ${payment.toLocaleString()}点`);
  } else {
    for (let player = 0; player < 4; player += 1) {
      if (player === winner) continue;
      const basePayment = isDealer ? childRon / 2 : childRon * (player === dealer ? 0.5 : 0.25);
      const payment = hybridRoundPayment(basePayment, totalPoint) + matchState.honba * 100;
      movements[winner] += payment;
      movements[player] -= payment;
      rows.push(`${players[player].name} -> ${players[winner].name}: ${payment.toLocaleString()}点`);
    }
  }
  const pot = matchState.riichiPot * 1000;
  if (pot) {
    movements[winner] += pot;
    rows.push(`供託リーチ棒 -> ${players[winner].name}: ${pot.toLocaleString()}点`);
  }
  return {
    type: displayType,
    winner,
    discarder: win.discarder,
    agariShape: agariShapeSnapshot(win),
    doraBreakdown,
    yaku,
    han: breakdown.riichiHan,
    fu: 0,
    hybrid: breakdown,
    honba: matchState.honba,
    riichiPot: matchState.riichiPot,
    limitName: hybridLimitName(totalPoint),
    rows,
    movements,
    nextHonba: winner === dealer ? matchState.honba + 1 : 0,
    clearRiichiPot: true
  };
}

function calculateScore(win) {
  const displayType = win.type;
  if (win.discarder !== undefined) win = { ...win, type: "繝ｭ繝ｳ" };
  const winner = win.player;
  const dealer = state.roundIndex % 4;
  const isDealer = winner === dealer;
  const scoringHand = scoringTilesForWin(win);
  const scoringAllTiles = [...scoringHand, ...state.melds[winner].flatMap((meld) => meld.tiles)];
  const doraBreakdown = doraBreakdownForTiles(winner, scoringAllTiles);
  const yaku = yakuList(scoringHand, state.settings, state.flowers[winner], winner, { win });
  if (state.settings.china) {
    return calculateHybridScore(win, displayType, yaku, hybridScoreBreakdown(yaku), doraBreakdown);
  }
  const han = Math.max(1, yaku.reduce((sum, item) => sum + Math.max(0, item.point || 0), 0));
  const fu = calculateFu(win, scoringHand, yaku);
  const base = fu * (2 ** (han + 2));
  const limited = limitBase(base, han);
  const movements = [0, 0, 0, 0];
  const rows = [];
  if (win.discarder !== undefined) {
    const payment = ceil100(limited.base * (isDealer ? 6 : 4)) + matchState.honba * 300;
    movements[winner] += payment;
    movements[win.discarder] -= payment;
    rows.push(`${players[win.discarder].name} -> ${players[winner].name}: ${payment.toLocaleString()}点`);
    const pot = matchState.riichiPot * 1000;
    if (pot) {
      movements[winner] += pot;
      rows.push(`供託リーチ棒 -> ${players[winner].name}: ${pot.toLocaleString()}点`);
    }
    return {
      type: displayType,
      winner,
      discarder: win.discarder,
      agariShape: agariShapeSnapshot(win),
      doraBreakdown,
      yaku,
      han,
      fu,
      honba: matchState.honba,
      riichiPot: matchState.riichiPot,
      limitName: limited.name,
      rows,
      movements,
      nextHonba: winner === dealer ? matchState.honba + 1 : 0,
      clearRiichiPot: true
    };
  }
  if (win.type === "ロン" && win.discarder !== undefined) {
    const payment = ceil100(limited.base * (isDealer ? 6 : 4)) + matchState.honba * 300;
    movements[winner] += payment;
    movements[win.discarder] -= payment;
    rows.push(`${players[win.discarder].name} -> ${players[winner].name}: ${payment.toLocaleString()}点`);
  } else {
    for (let player = 0; player < 4; player += 1) {
      if (player === winner) continue;
      const payment = ceil100(limited.base * (isDealer || player === dealer ? 2 : 1)) + matchState.honba * 100;
      movements[winner] += payment;
      movements[player] -= payment;
      rows.push(`${players[player].name} -> ${players[winner].name}: ${payment.toLocaleString()}点`);
    }
  }
  const pot = matchState.riichiPot * 1000;
  if (pot) {
    movements[winner] += pot;
    rows.push(`供託リーチ棒 -> ${players[winner].name}: ${pot.toLocaleString()}点`);
  }
  return {
    type: displayType,
    winner,
    discarder: win.discarder,
    agariShape: agariShapeSnapshot(win),
    doraBreakdown,
    yaku,
    han,
    fu,
    honba: matchState.honba,
    riichiPot: matchState.riichiPot,
    limitName: limited.name,
    rows,
    movements,
    nextHonba: winner === dealer ? matchState.honba + 1 : 0,
    clearRiichiPot: true
  };
}

function scoringTilesForWin(win) {
  const hand = [...state.hands[win.player]];
  if (win.tile && !hand.some((tile) => tile.id === win.tile.id)) hand.push(win.tile);
  return hand;
}

function agariShapeSnapshot(win) {
  const winner = win.player;
  const winTileId = win.tile?.id || null;
  const tsumo = win.discarder === undefined && !isRonWin(win);
  const concealed = [...state.hands[winner]]
    .filter((tile) => tsumo || tile.id !== winTileId)
    .map((tile) => ({ ...tile, highlight: tsumo && tile.id === winTileId }));
  return {
    concealed,
    melds: state.melds[winner].map((meld) => ({
      type: meld.type,
      tiles: meld.tiles.map((tile) => ({ ...tile, called: tile.id === meld.calledTileId }))
    })),
    ronTile: !tsumo && win.tile ? { ...win.tile, highlight: true } : null
  };
}

function calculateFu(win, tiles, yaku) {
  const winner = win.player;
  const yakuIds = new Set(yaku.map((item) => item.id || item.name));
  if (yakuIds.has("chiitoi")) return 25;
  if (yakuIds.has("pinfu")) return isTsumoWin(win) ? 20 : 30;
  const handShape = bestStandardShape(winner, tiles, state.settings, win);
  let fu = 20;
  if (isTsumoWin(win)) fu += 2;
  if (isRonWin(win) && isClosedHand(winner)) fu += 10;
  if (handShape) {
    if (isValuePair(handShape.pair, winner)) fu += 2;
    if (win?.tile && !isRyanmenWait(handShape, win)) fu += 2;
    for (const meld of handShape.melds) {
      if (meld.type !== "triplet") continue;
      const key = meld.keys[0];
      const terminalOrHonor = key[0] === "z" || [1, 9].includes(Number(key.slice(1)));
      fu += terminalOrHonor ? 8 : 4;
    }
  }
  return Math.max(30, Math.ceil(fu / 10) * 10);
}

function isTsumoWin(win) {
  if (win?.type === "ツモ") return true;
  return ["ツモ", "繝・Δ"].includes(win?.type);
}

function isRonWin(win) {
  if (win?.type === "ロン") return true;
  return ["ロン", "繝ｭ繝ｳ"].includes(win?.type);
}

function totalDiscards() {
  return (state.discardCounts || [0, 0, 0, 0]).reduce((sum, count) => sum + count, 0);
}

function isClosedHand(playerIndex) {
  return state.melds[playerIndex].every((meld) => meld.type === "暗カン");
}

function openAwareHan(playerIndex, closedHan, openHan = closedHan) {
  return isClosedHand(playerIndex) ? closedHan : openHan;
}

function roundWindValue() {
  return Math.floor((state.roundIndex || 0) / 4) === 0 ? 1 : 2;
}

function seatWindValue(playerIndex) {
  return { 東: 1, 南: 2, 西: 3, 北: 4 }[players[playerIndex]?.wind] || 1;
}

function isValuePair(key, playerIndex = 0) {
  if (["z5", "z6", "z7"].includes(key)) return true;
  if (key === `z${roundWindValue()}`) return true;
  return key === `z${seatWindValue(playerIndex)}`;
}

function isTerminalOrHonorTile(tile) {
  return tile.suit === "z" || (["m", "p", "s"].includes(tile.suit) && [1, 9].includes(tile.value));
}

function isTerminalTileKey(key) {
  return ["m", "p", "s"].includes(key[0]) && [1, 9].includes(Number(key.slice(1)));
}

function analysisTilesForPlayer(playerIndex) {
  const hand = sortTiles(state.hands[playerIndex]);
  const winTile = state.pendingWin?.player === playerIndex ? state.pendingWin.tile : null;
  if (winTile && !hand.some((tile) => tile.id === winTile.id)) return sortTiles([...hand, winTile]);
  return hand;
}

function limitBase(base, han) {
  if (han >= 13) {
    const count = Math.max(1, Math.floor(han / 13));
    const name = count === 1 ? "役満" : count === 2 ? "ダブル役満" : count === 3 ? "トリプル役満" : `${count}倍役満`;
    return { base: 8000 * count, name };
  }
  if (han >= 11) return { base: 6000, name: "三倍満" };
  if (han >= 8) return { base: 4000, name: "倍満" };
  if (han >= 6) return { base: 3000, name: "跳満" };
  if (han >= 5 || base >= 2000) return { base: 2000, name: "満貫" };
  return { base, name: "通常" };
}

function calculateDrawScore() {
  const tenpai = [0, 1, 2, 3].map((player) => isTenpaiNow(player));
  const tenpaiCount = tenpai.filter(Boolean).length;
  const movements = [0, 0, 0, 0];
  const rows = [];
  if (tenpaiCount > 0 && tenpaiCount < 4) {
    const receive = Math.floor(3000 / tenpaiCount);
    const pay = Math.floor(3000 / (4 - tenpaiCount));
    tenpai.forEach((ready, player) => {
      movements[player] += ready ? receive : -pay;
      rows.push(`${players[player].name}: ${ready ? `聴牌 +${receive}` : `ノーテン -${pay}`}点`);
    });
  } else {
    rows.push(tenpaiCount === 4 ? "全員聴牌: 点数移動なし" : "全員ノーテン: 点数移動なし");
  }
  return {
    type: "流局",
    tenpai,
    han: 0,
    fu: 0,
    honba: matchState.honba,
    riichiPot: matchState.riichiPot,
    rows,
    movements,
    nextHonba: matchState.honba + 1,
    clearRiichiPot: false
  };
}

function confirmScore() {
  if (!state.scoreResult) return;
  state.scoreResult.movements.forEach((delta, player) => {
    players[player].score += delta;
  });
  matchState.honba = state.scoreResult.nextHonba;
  if (state.scoreResult.clearRiichiPot) matchState.riichiPot = 0;
  const nextRound = state.roundIndex + 1;
  state.scoreResult = null;
  startRound(state.settings, state.presetId, nextRound);
}

function chooseCpuDiscard(hand, playerIndex = state.turn) {
  let bestIndex = 0;
  let bestScore = -Infinity;
  const meldPenaltyWeight = completedMeldPenaltyWeight(hand);
  hand.forEach((tile, index) => {
    const remaining = hand.filter((_, tileIndex) => tileIndex !== index);
    let score = cpuHandPlanScore(remaining, tile, playerIndex);
    score -= completedMeldLoss(hand, tile) * meldPenaltyWeight;
    if (tile.id === state.drawnTileId) score += 0.35;
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });
  return bestIndex;
}

function completedMeldPenaltyWeight(hand) {
  const pairCount = Object.values(countMap(hand)).filter((count) => count >= 2).length;
  if (pairCount >= 5) return 0;
  if (pairCount === 4) return 3.5;
  return 7;
}

function completedMeldLoss(hand, discardedTile) {
  const before = countMap(hand);
  const after = { ...before, [keyOf(discardedTile)]: (before[keyOf(discardedTile)] || 0) - 1 };
  const completeCount = (counts) => {
    let total = Object.values(counts).reduce((sum, count) => sum + Math.floor(count / 3), 0);
    for (const suit of ["m", "p", "s"]) {
      total += numericSequencePatterns(state.settings.cosmic)
        .filter((pattern) => pattern.every((value) => (counts[`${suit}${value}`] || 0) > 0)).length;
    }
    if (state.settings.cosmic) {
      const honorPatterns = [[5, 6, 7], [1, 2, 3], [2, 3, 4], [3, 4, 1], [4, 1, 2]];
      total += honorPatterns
        .filter((pattern) => pattern.every((value) => (counts[`z${value}`] || 0) > 0)).length;
    }
    return total;
  };
  return Math.max(0, completeCount(before) - completeCount(after));
}

function cpuHandPlanScore(tiles, discardedTile, playerIndex = state.turn) {
  const standard = standardPlanScore(tiles);
  const closed = state.melds[playerIndex].length === 0;
  const chiitoi = closed ? chiitoiPlanScore(tiles) : -Infinity;
  const kokushi = closed ? kokushiPlanScore(tiles) : -Infinity;
  const special = closed && state.settings.china ? cpuSpecialPlanProfile(tiles, playerIndex).score : -Infinity;
  const pairCount = Object.values(countMap(tiles)).filter((count) => count >= 2).length;
  const chiitoiCommitBonus = pairCount >= 5 ? 16 : pairCount === 4 ? 4 : 0;
  let score = Math.max(standard, chiitoi + chiitoiCommitBonus, kokushi, special) + flushPlanScore(tiles, playerIndex);
  score -= honorDiscardRetention(tiles, discardedTile, playerIndex);
  return score;
}

function specialShantenScore(shanten, base) {
  if (shanten <= 0) return base + 24;
  if (shanten === 1) return base;
  if (shanten === 2) return base - 24;
  if (shanten === 3) return base - 42;
  return -Infinity;
}

let knittedStraightPlanTargetsCache = null;

function knittedStraightPlanTargets() {
  if (knittedStraightPlanTargetsCache) return knittedStraightPlanTargetsCache;
  const tileKeys = ["m", "p", "s"].flatMap((suit) => Array.from({ length: 9 }, (_, index) => `${suit}${index + 1}`))
    .concat(Array.from({ length: 7 }, (_, index) => `z${index + 1}`));
  const meldPatterns = tileKeys.map((key) => [key, key, key]);
  ["m", "p", "s"].forEach((suit) => {
    numericSequencePatterns(false).forEach((sequence) => meldPatterns.push(sequence.map((value) => `${suit}${value}`)));
  });
  knittedStraightPlanTargetsCache = knittedAssignments().flatMap((assignment) => tileKeys.flatMap((pairKey) => meldPatterns.map((meldKeys) => {
    const counts = {};
    assignment.requiredKeys.forEach((key) => counts[key] = (counts[key] || 0) + 1);
    counts[pairKey] = (counts[pairKey] || 0) + 2;
    meldKeys.forEach((key) => counts[key] = (counts[key] || 0) + 1);
    return Object.entries(counts);
  })));
  return knittedStraightPlanTargetsCache;
}

function honorsKnittedPlanProfile(tiles) {
  const counts = countMap(tiles);
  const honorUnique = [1, 2, 3, 4, 5, 6, 7].filter((value) => counts[`z${value}`]).length;
  let best = { label: "全不靠", shanten: 99, score: -Infinity };
  knittedAssignments().forEach((assignment) => {
    const numberUnique = assignment.requiredKeys.filter((key) => counts[key]).length;
    const greaterMissing = (7 - honorUnique) + Math.max(0, 7 - numberUnique);
    const lesserMissing = Math.max(0, 14 - honorUnique - numberUnique);
    const greaterShanten = Math.max(0, greaterMissing - 1);
    const lesserShanten = Math.max(0, lesserMissing - 1);
    const greaterScore = specialShantenScore(greaterShanten, 52);
    const lesserScore = specialShantenScore(lesserShanten, 48);
    const candidate = greaterScore >= lesserScore
      ? { label: "七星不靠", shanten: greaterShanten, score: greaterScore }
      : { label: "全不靠", shanten: lesserShanten, score: lesserScore };
    if (candidate.score > best.score) best = candidate;
  });
  return best;
}

function knittedStraightPlanProfile(tiles) {
  const counts = countMap(tiles);
  let best = { label: "組合龍", shanten: 99, score: -Infinity };
  knittedStraightPlanTargets().forEach((targetEntries) => {
    const overlap = targetEntries.reduce((sum, [key, count]) => sum + Math.min(count, counts[key] || 0), 0);
    const shanten = Math.max(0, 13 - overlap);
    const score = specialShantenScore(shanten, 44);
    if (score > best.score) best = { label: "組合龍", shanten, score };
  });
  return best;
}

function cpuSpecialPlanProfile(tiles, playerIndex = state.turn) {
  if (!state.settings.china || state.melds[playerIndex].length) {
    return { label: "中国特殊形なし", shanten: 99, score: -Infinity };
  }
  const candidates = [honorsKnittedPlanProfile(tiles), knittedStraightPlanProfile(tiles)];
  return candidates.sort((a, b) => b.score - a.score)[0];
}

function visibleTileCount(key) {
  return [
    ...state.rivers.flat(),
    ...state.melds.flatMap((melds) => melds.flatMap((meld) => meld.tiles)),
    ...state.dora
  ].filter((tile) => keyOf(tile) === key).length;
}

function lastTileExposedCount(key, win) {
  const riverTiles = state.rivers.flat().filter((tile) => keyOf(tile) === key);
  if (isRonWin(win) && win?.tile) {
    const exactIndex = riverTiles.findIndex((tile) => tile.id === win.tile.id);
    if (exactIndex >= 0) riverTiles.splice(exactIndex, 1);
    else if (riverTiles.length) riverTiles.pop();
  }
  const meldCount = state.melds
    .flatMap((melds) => melds.flatMap((meld) => meld.tiles))
    .filter((tile) => keyOf(tile) === key).length;
  const baseDoraCount = state.dora?.[0] && keyOf(state.dora[0]) === key ? 1 : 0;
  return riverTiles.length + meldCount + baseDoraCount;
}

function isLastTileYaku(win) {
  if (!win?.tile) return false;
  const key = keyOf(win.tile);
  const exposed = lastTileExposedCount(key, win);
  if (key === "z5" && Number(state.settings.whiteCount) >= 5) {
    return Number(state.settings.whiteCount) - exposed === 1;
  }
  return exposed === 3;
}

function honorSupplyInfo(key, heldTiles) {
  const maxCopies = key === "z5" ? state.settings.whiteCount : 4;
  const visible = visibleTileCount(key);
  const held = heldTiles.filter((tile) => keyOf(tile) === key).length;
  const drawable = Math.max(0, maxCopies - visible - held);
  return { maxCopies, visible, held, drawable };
}

function honorDiscardRetention(remainingTiles, discardedTile, playerIndex) {
  if (discardedTile?.suit !== "z") return 0;
  const key = keyOf(discardedTile);
  const heldBefore = [...remainingTiles, discardedTile];
  const supply = honorSupplyInfo(key, heldBefore);
  const possibleOutside = Math.max(1, supply.maxCopies - supply.held);
  const availability = Math.min(1, supply.drawable / possibleOutside);
  if (key === "z5" && state.settings.whiteStorm) {
    return (4 + Math.min(4, supply.held) * 2) * (0.2 + availability * 0.8);
  }
  if (state.settings.cosmic) {
    const valueBonus = isValueHonorTile(discardedTile, playerIndex) ? 1.2 : 0;
    return (1.5 + valueBonus + Math.min(2, supply.held) * 0.8) * (0.2 + availability * 0.8);
  }
  return 0;
}

function flushPlanProfile(tiles, playerIndex) {
  const allTiles = [...tiles, ...state.melds[playerIndex].flatMap((meld) => meld.tiles)].filter(Boolean);
  const suitCounts = Object.fromEntries(["m", "p", "s"].map((suit) => [suit, allTiles.filter((tile) => tile.suit === suit).length]));
  const dominantSuit = ["m", "p", "s"].sort((a, b) => suitCounts[b] - suitCounts[a])[0];
  const dominantCount = suitCounts[dominantSuit];
  const offSuitCount = Object.entries(suitCounts).filter(([suit]) => suit !== dominantSuit).reduce((sum, [, count]) => sum + count, 0);
  const counts = countMap(allTiles);
  const valueHonorPairs = [5, 6, 7, roundWindValue(), seatWindValue(playerIndex)]
    .filter((value, index, values) => values.indexOf(value) === index)
    .filter((value) => (counts[`z${value}`] || 0) >= 2).length;
  const honorCount = allTiles.filter((tile) => tile.suit === "z").length;
  const cosmicHonorAssist = state.settings.cosmic ? Math.max(0, honorCount - 2) * 0.75 : 0;
  return { dominantSuit, dominantCount, effectiveFlushCount: dominantCount + cosmicHonorAssist, offSuitCount, honorCount, valueHonorPairs };
}

function flushPlanScore(tiles, playerIndex) {
  const profile = flushPlanProfile(tiles, playerIndex);
  if (profile.effectiveFlushCount < 7) return 0;
  const stage = profile.effectiveFlushCount >= 10 ? 26 + (profile.effectiveFlushCount - 10) * 4
    : profile.effectiveFlushCount >= 9 ? 14
      : profile.effectiveFlushCount >= 8 ? 8
        : 4;
  const offSuitPenalty = profile.offSuitCount * (profile.effectiveFlushCount >= 10 ? 4.5 : profile.effectiveFlushCount >= 8 ? 1.5 : 0.75);
  const honorSupport = profile.valueHonorPairs * (profile.effectiveFlushCount >= 10 ? 4 : 2);
  const cleanFlushBonus = profile.honorCount === 0 ? profile.dominantCount - 6 : 0;
  return Math.max(0, stage - offSuitPenalty + honorSupport + cleanFlushBonus);
}

function standardPlanScore(tiles) {
  const counts = countMap(tiles);
  let score = 0;
  for (const suit of ["m", "p", "s"]) {
    const values = Array(10).fill(0);
    for (let value = 1; value <= 9; value += 1) values[value] = counts[`${suit}${value}`] || 0;
    score += suitShapeScore(values, state.settings.cosmic);
  }
  if (state.settings.cosmic) score += honorSequencePlanScore(counts);
  for (let value = 1; value <= 7; value += 1) {
    const count = counts[`z${value}`] || 0;
    if (count >= 3) score += 15;
    else if (count === 2) score += [5, 6, 7].includes(value) ? 8 : 6;
    else if (count === 1) score -= state.settings.cosmic ? 0.5 : ([5, 6, 7].includes(value) ? 1 : 3);
  }
  return score;
}

function suitShapeScore(values, cosmic = false) {
  const sequencePatterns = numericSequencePatterns(cosmic);
  const memo = new Map();
  const solve = (counts) => {
    const key = counts.slice(1).join("");
    if (memo.has(key)) return memo.get(key);
    const value = counts.findIndex((count, index) => index > 0 && count > 0);
    if (value < 0) return 0;
    let best = isolatedSuitPenalty(value) + solve(decrementCounts(counts, [value]));
    if (counts[value] >= 3) best = Math.max(best, 15 + solve(decrementCounts(counts, [value, value, value])));
    sequencePatterns
      .filter((seq) => seq.includes(value) && seq.every((n) => counts[n] > 0))
      .forEach((seq) => {
        best = Math.max(best, 16 + solve(decrementCounts(counts, seq)));
      });
    if (counts[value] >= 2) best = Math.max(best, 6 + solve(decrementCounts(counts, [value, value])));
    sequencePairsFor(value, sequencePatterns).forEach(({ pair, waitCount }) => {
      if (pair.every((n) => counts[n] > 0)) {
        best = Math.max(best, (4.8 + waitCount * 1.6) + solve(decrementCounts(counts, pair)));
      }
    });
    memo.set(key, best);
    return best;
  };
  return solve(values);
}

function numericSequencePatterns(cosmic = false) {
  const patterns = [];
  for (let start = 1; start <= 7; start += 1) patterns.push([start, start + 1, start + 2]);
  if (cosmic) patterns.push([8, 9, 1], [9, 1, 2]);
  return patterns;
}

function sequencePairsFor(value, patterns) {
  const pairMap = new Map();
  patterns.filter((seq) => seq.includes(value)).forEach((seq) => {
    seq.forEach((other) => {
      if (other === value) return;
      const pair = [value, other];
      const id = [...pair].sort((a, b) => a - b).join("-");
      const waits = pairMap.get(id) || new Set();
      seq.filter((n) => !pair.includes(n)).forEach((n) => waits.add(n));
      pairMap.set(id, waits);
    });
  });
  return [...pairMap.entries()].map(([id, waits]) => ({
    pair: id.split("-").map(Number),
    waitCount: waits.size
  }));
}

function honorSequencePlanScore(counts) {
  const patterns = [[5, 6, 7], [6, 7, 5], [7, 5, 6], [1, 2, 3], [2, 3, 4], [3, 4, 1], [4, 1, 2]];
  let score = 0;
  patterns.forEach((seq) => {
    const present = seq.filter((value) => counts[`z${value}`] > 0);
    if (present.length === 3) score += 8;
    else if (present.length === 2) {
      const waits = new Set(
        patterns
          .filter((pattern) => present.every((value) => pattern.includes(value)))
          .flatMap((pattern) => pattern.filter((value) => !present.includes(value)))
      );
      score += 4 + waits.size * 1.4;
    }
  });
  return score;
}

function decrementCounts(counts, values) {
  const next = [...counts];
  values.forEach((value) => next[value] -= 1);
  return next;
}

function isolatedSuitPenalty(value) {
  if ([1, 9].includes(value)) return -5;
  if ([2, 8].includes(value)) return -2;
  return -1;
}

function chiitoiPlanScore(tiles) {
  const counts = Object.values(countMap(tiles));
  const pairs = counts.filter((count) => count >= 2).length;
  const unique = counts.length;
  if (pairs <= 2) return -18 + pairs * 6 + unique * 0.2;
  if (pairs === 3) return 18 + Math.min(unique, 7) * 0.4;
  if (pairs === 4) return 34 + Math.min(unique, 7) * 0.6;
  return pairs * 10 + Math.min(unique, 7);
}

function kokushiPlanScore(tiles) {
  const terminalKeys = ["m1", "m9", "p1", "p9", "s1", "s9", "z1", "z2", "z3", "z4", "z5", "z6", "z7"];
  const terminalSet = new Set(terminalKeys);
  const counts = countMap(tiles);
  const unique = terminalKeys.filter((key) => counts[key]).length;
  const hasPair = terminalKeys.some((key) => counts[key] >= 2);
  const nonTerminals = tiles.filter((tile) => !terminalSet.has(keyOf(tile))).length;
  if (unique < 9) return -30 + unique * 2 - nonTerminals * 4;
  return unique * 7 + (hasPair ? 10 : 0) - nonTerminals * 7;
}

function countMap(tiles) {
  const map = {};
  for (const tile of tiles) map[keyOf(tile)] = (map[keyOf(tile)] || 0) + 1;
  return map;
}

function isStandardWin(tiles, settings) {
  return isStandardWinForPlayer(0, tiles, settings);
}

function isStandardWinForPlayer(playerIndex, tiles, settings) {
  const concealedNeed = 14 - state.melds[playerIndex].length * 3;
  if (tiles.length !== concealedNeed && tiles.length % 3 !== 2) return false;
  const counts = countMap(tiles);
  for (const key of Object.keys(counts)) {
    if (counts[key] >= 2) {
      counts[key] -= 2;
      if (canMakeMelds(counts, settings)) {
        counts[key] += 2;
        return true;
      }
      counts[key] += 2;
    }
  }
  return false;
}

function canMakeMelds(counts, settings) {
  const key = Object.keys(counts).find((item) => counts[item] > 0);
  if (!key) return true;
  const suit = key[0];
  const value = Number(key.slice(1));
  if (counts[key] >= 3) {
    counts[key] -= 3;
    if (canMakeMelds(counts, settings)) {
      counts[key] += 3;
      return true;
    }
    counts[key] += 3;
  }
  for (const seq of sequencesFor(suit, value, settings)) {
    if (seq.every((item) => counts[item] > 0)) {
      seq.forEach((item) => counts[item] -= 1);
      if (canMakeMelds(counts, settings)) {
        seq.forEach((item) => counts[item] += 1);
        return true;
      }
      seq.forEach((item) => counts[item] += 1);
    }
  }
  return false;
}

function standardShapes(tiles, settings) {
  if (tiles.length % 3 !== 2) return [];
  const counts = countMap(tiles);
  const shapes = [];
  for (const key of Object.keys(counts)) {
    if (counts[key] < 2) continue;
    counts[key] -= 2;
    for (const melds of meldShapeOptions(counts, settings)) {
      shapes.push({ pair: key, melds });
      if (shapes.length > 64) break;
    }
    counts[key] += 2;
  }
  return shapes;
}

function meldShapeOptions(counts, settings) {
  const key = Object.keys(counts).find((item) => counts[item] > 0);
  if (!key) return [[]];
  const options = [];
  if (counts[key] >= 3) {
    counts[key] -= 3;
    for (const rest of meldShapeOptions(counts, settings)) {
      options.push([{ type: "triplet", keys: [key, key, key] }, ...rest]);
      if (options.length > 64) break;
    }
    counts[key] += 3;
  }
  for (const seq of sequencesFor(key[0], Number(key.slice(1)), settings)) {
    if (!seq.every((item) => counts[item] > 0)) continue;
    seq.forEach((item) => counts[item] -= 1);
    for (const rest of meldShapeOptions(counts, settings)) {
      options.push([{ type: "sequence", keys: seq }, ...rest]);
      if (options.length > 64) break;
    }
    seq.forEach((item) => counts[item] += 1);
  }
  return options;
}

function bestStandardShape(playerIndex, tiles, settings, win = null) {
  const shapes = standardShapes(tiles, settings);
  if (!shapes.length) return null;
  return shapes
    .map((shape) => ({ shape, score: standardShapeScore(shape, playerIndex, win) }))
    .sort((a, b) => b.score - a.score)[0].shape;
}

function standardShapeScore(shape, playerIndex, win = null) {
  let score = 0;
  if (hasRyanpeikouShape(shape)) score += 20;
  if (isPinfuShape(shape, playerIndex, win)) score += 10;
  if (shape.melds.every((meld) => meld.type === "sequence")) score += 4;
  if (!isValuePair(shape.pair)) score += 1;
  return score;
}

function isPinfuShape(shape, playerIndex, win = null) {
  return isClosedHand(playerIndex) &&
    shape.melds.every((meld) => meld.type === "sequence") &&
    !isValuePair(shape.pair, playerIndex) &&
    isRyanmenWait(shape, win);
}

function isRyanmenWait(shape, win = null) {
  if (!win?.tile) return true;
  const winKey = keyOf(win.tile);
  return shape.melds.some((meld) => {
    if (meld.type !== "sequence" || !meld.keys.includes(winKey)) return false;
    const suit = meld.keys[0][0];
    if (suit === "z" && state.settings.cosmic) {
      const waitType = cosmicHonorWaitType(meld, winKey);
      return waitType === "ryanmen" || waitType === "edge";
    }
    if (!["m", "p", "s"].includes(suit)) return false;
    const values = meld.keys.map((key) => Number(key.slice(1))).sort((a, b) => a - b);
    if (values[1] !== values[0] + 1 || values[2] !== values[0] + 2) return true;
    const start = values[0];
    const winValue = Number(winKey.slice(1));
    return (winValue === start && start <= 6) || (winValue === start + 2 && start >= 2);
  });
}

function hasIipeikouShape(shape) {
  const sequences = shape.melds
    .filter((meld) => meld.type === "sequence")
    .map((meld) => meld.keys.join(""));
  return sequences.some((seq, index) => sequences.indexOf(seq) !== index);
}

function hasRyanpeikouShape(shape) {
  const sequences = shape.melds
    .filter((meld) => meld.type === "sequence")
    .map((meld) => meld.keys.join(""));
  if (sequences.length !== 4) return false;
  const counts = sequences.reduce((map, seq) => {
    map[seq] = (map[seq] || 0) + 1;
    return map;
  }, {});
  const pairs = Object.values(counts).filter((count) => count === 2).length;
  return Object.keys(counts).length === 2 && pairs === 2;
}

function numericSequenceStart(keys) {
  if (keys.length !== 3 || !["m", "p", "s"].includes(keys[0]?.[0]) || !keys.every((key) => key[0] === keys[0][0])) return null;
  const values = keys.map((key) => Number(key.slice(1))).sort((a, b) => a - b);
  const lastStart = state.settings.cosmic ? 9 : 7;
  for (let start = 1; start <= lastStart; start += 1) {
    const candidate = [0, 1, 2].map((offset) => ((start - 1 + offset) % 9) + 1).sort((a, b) => a - b);
    if (candidate.every((value, index) => value === values[index])) return start;
  }
  return null;
}

function sequenceStarts(playerIndex, shape) {
  const melds = [
    ...shape.melds.filter((meld) => meld.type === "sequence").map((meld) => meld.keys),
    ...state.melds[playerIndex].map((meld) => meld.tiles.map(keyOf))
  ];
  return melds.flatMap((keys) => {
    const start = numericSequenceStart(keys);
    return start ? [{ suit: keys[0][0], start }] : [];
  });
}

function sequencePatterns(shape) {
  return shape.melds
    .filter((meld) => meld.type === "sequence")
    .map((meld) => ({
      suit: meld.keys[0][0],
      pattern: meld.keys.map((key) => Number(key.slice(1))).join("-")
    }));
}

function hasSanshokuDoujunShape(shape) {
  const patterns = sequencePatterns(shape).filter((seq) => ["m", "p", "s"].includes(seq.suit));
  const uniquePatterns = [...new Set(patterns.map((seq) => seq.pattern))];
  return uniquePatterns.some((pattern) =>
    ["m", "p", "s"].every((suit) => patterns.some((seq) => seq.suit === suit && seq.pattern === pattern))
  );
}

function hasSanshokuDoukouShape(shape) {
  const triplets = shape.melds
    .filter((meld) => meld.type === "triplet" && ["m", "p", "s"].includes(meld.keys[0][0]))
    .map((meld) => ({ suit: meld.keys[0][0], value: Number(meld.keys[0].slice(1)) }));
  return [1, 2, 3, 4, 5, 6, 7, 8, 9].some((value) =>
    ["m", "p", "s"].every((suit) => triplets.some((triplet) => triplet.suit === suit && triplet.value === value))
  );
}

function hasIkkitsuukanShape(playerIndex, shape) {
  const starts = sequenceStarts(playerIndex, shape);
  const bases = state.settings.cosmic ? [1, 2, 3] : [1];
  return ["m", "p", "s"].some((suit) => bases.some((base) =>
    [0, 3, 6].map((offset) => ((base - 1 + offset) % 9) + 1)
      .every((start) => starts.some((seq) => seq.suit === suit && seq.start === start))
  ));
}

function hasMixedStraightShape(playerIndex, shape) {
  if (!shape) return false;
  const starts = sequenceStarts(playerIndex, shape);
  const suitOrders = [
    ["m", "p", "s"], ["m", "s", "p"], ["p", "m", "s"],
    ["p", "s", "m"], ["s", "m", "p"], ["s", "p", "m"]
  ];
  const bases = state.settings.cosmic ? [1, 2, 3] : [1];
  return bases.some((base) => {
    const requiredStarts = [0, 3, 6].map((offset) => ((base - 1 + offset) % 9) + 1);
    return suitOrders.some((suits) => requiredStarts.every((start, index) => (
      starts.some((sequence) => sequence.suit === suits[index] && sequence.start === start)
    )));
  });
}

function hasThreeWindPungs(playerIndex, shape) {
  if (!shape) return false;
  return ["z1", "z2", "z3", "z4"].filter((key) => hasInterpretedTriplet(playerIndex, shape, key)).length >= 3;
}

function hasMixedShiftedPungsShape(playerIndex, shape) {
  if (!shape) return false;
  const triplets = [...shape.melds, ...state.melds[playerIndex].map(meldShapeFromCalledMeld)]
    .filter((meld) => meld.type === "triplet" && ["m", "p", "s"].includes(meld.keys[0]?.[0]))
    .map((meld) => ({ suit: meld.keys[0][0], value: Number(meld.keys[0].slice(1)) }));
  return numericSequencePatterns(state.settings.cosmic).some((values) => {
    const choices = values.map((value) => triplets.filter((triplet) => triplet.value === value));
    if (choices.some((items) => items.length === 0)) return false;
    return choices[0].some((first) => choices[1].some((second) => choices[2].some((third) => (
      new Set([first.suit, second.suit, third.suit]).size >= 2
    ))));
  });
}

function hasMixedShiftedChowsShape(playerIndex, shape) {
  if (!shape) return false;
  const entries = [];
  chineseSequenceCounts(playerIndex, shape).forEach((count, signature) => {
    chineseSequenceStartOptions(signature)
      .filter((option) => ["m", "p", "s"].includes(option.suit))
      .forEach((option) => {
        for (let index = 0; index < count; index += 1) entries.push(option);
      });
  });
  const follows = (left, right) => state.settings.cosmic
    ? right.start === (left.start + 1) % 9
    : right.start === left.start + 1;
  return entries.some((first) => entries.some((second) => entries.some((third) => (
    new Set([first.suit, second.suit, third.suit]).size === 3 &&
    follows(first, second) && follows(second, third)
  ))));
}

function concealedPungCount(shape, win = null) {
  if (!shape) return 0;
  const winKey = win?.tile ? keyOf(win.tile) : null;
  return shape.melds.filter((meld) => {
    if (meld.type !== "triplet") return false;
    return !(isRonWin(win) && winKey && meld.keys.includes(winKey));
  }).length;
}

function concealedKongCount(playerIndex) {
  return state.melds[playerIndex].filter((meld) => meld.type === "暗カン").length;
}

function isMeldedHandWin(playerIndex, shape, win) {
  return !!shape &&
    isRonWin(win) &&
    shape.melds.length === 0 &&
    state.melds[playerIndex].length === 4 &&
    state.melds[playerIndex].every((meld) => meld.type !== "暗カン");
}

function isReversibleTiles(allTiles) {
  const reversible = {
    p: new Set([1, 2, 3, 4, 5, 8, 9]),
    s: new Set([2, 4, 5, 6, 8, 9]),
    z: new Set([5])
  };
  return allTiles.length > 0 && allTiles.every((tile) => reversible[tile.suit]?.has(tile.value));
}

function isToitoiShape(playerIndex, shape) {
  const concealedTriplets = shape.melds.every((meld) => meld.type === "triplet");
  const calledTriplets = state.melds[playerIndex].every((meld) => new Set(meld.tiles.map(keyOf)).size === 1);
  return concealedTriplets && calledTriplets;
}

function hasInterpretedTriplet(playerIndex, shape, key) {
  return interpretedTripletCount(playerIndex, shape, key) > 0;
}

function interpretedTripletCount(playerIndex, shape, key) {
  const concealedTriplets = shape?.melds.filter((meld) => meld.type === "triplet" && meld.keys.every((item) => item === key)).length || 0;
  const calledTriplets = state.melds[playerIndex].filter((meld) =>
    meld.tiles.filter((tile) => keyOf(tile) === key).length >= 3
  ).length;
  return concealedTriplets + calledTriplets;
}

function meldShapeFromCalledMeld(meld) {
  const keys = meld.tiles.map(keyOf);
  const type = new Set(keys).size === 1 ? "triplet" : "sequence";
  return { type, keys };
}

function isChantaShape(playerIndex, shape, requireNoHonors = false) {
  const pairOk = requireNoHonors ? isTerminalTileKey(shape.pair) : shape.pair[0] === "z" || isTerminalTileKey(shape.pair);
  const melds = [...shape.melds, ...state.melds[playerIndex].map(meldShapeFromCalledMeld)];
  return pairOk && melds.some((meld) => meld.type === "sequence") && melds.every((meld) => {
    if (meld.type === "triplet") return requireNoHonors ? isTerminalTileKey(meld.keys[0]) : meld.keys[0][0] === "z" || isTerminalTileKey(meld.keys[0]);
    if (requireNoHonors) return meld.keys.every((key) => key[0] !== "z") && meld.keys.some(isTerminalTileKey);
    return meld.keys.some((key) => key[0] === "z" || isTerminalTileKey(key));
  });
}

function dragonPairCount(allCounts) {
  return ["z5", "z6", "z7"].filter((key) => (allCounts[key] || 0) >= 2).length;
}

function concealedTripletCount(playerIndex, shape, win = null) {
  if (!shape) return 0;
  const concealedKans = state.melds[playerIndex].filter((meld) => meld.type === "暗カン").length;
  const winKey = win?.tile ? keyOf(win.tile) : null;
  const triplets = shape.melds.filter((meld) => {
    if (meld.type !== "triplet") return false;
    if (isRonWin(win) && winKey && meld.keys.includes(winKey)) return false;
    return true;
  }).length;
  return concealedKans + triplets;
}

function isSuuankou(playerIndex, shape, win = null) {
  const hasOpenMeld = state.melds[playerIndex].some((meld) => meld.type !== "暗カン");
  return !hasOpenMeld && concealedTripletCount(playerIndex, shape, win) >= 4;
}

function windTripletCount(allCounts) {
  return ["z1", "z2", "z3", "z4"].filter((key) => (allCounts[key] || 0) >= 3).length;
}

function windPairCount(allCounts) {
  return ["z1", "z2", "z3", "z4"].filter((key) => (allCounts[key] || 0) >= 2).length;
}

function isTsuuiisou(allTiles) {
  return allTiles.length > 0 && allTiles.every((tile) => tile.suit === "z");
}

function isRyuuiisou(allTiles) {
  const green = new Set(["s2", "s3", "s4", "s6", "s8", "z6"]);
  return allTiles.length > 0 && allTiles.every((tile) => green.has(keyOf(tile)));
}

function isChinroutou(allTiles) {
  return allTiles.length > 0 && allTiles.every((tile) => ["m", "p", "s"].includes(tile.suit) && [1, 9].includes(tile.value));
}

function kanCount(playerIndex) {
  return state.melds[playerIndex].filter((meld) => meld.type.includes("カン")).length;
}

function isChuuren(playerIndex, allTiles) {
  if (!isClosedHand(playerIndex) || allTiles.length !== 14) return false;
  const suits = new Set(allTiles.map((tile) => tile.suit));
  if (suits.size !== 1) return false;
  const suit = allTiles[0]?.suit;
  if (!["m", "p", "s"].includes(suit)) return false;
  const counts = countMap(allTiles);
  const required = { 1: 3, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 3 };
  return Object.entries(required).every(([value, need]) => (counts[`${suit}${value}`] || 0) >= need);
}

function isPureChuuren(playerIndex, allTiles, win) {
  if (!isChuuren(playerIndex, allTiles) || !win?.tile) return false;
  const suit = allTiles[0]?.suit;
  if (keyOf(win.tile)[0] !== suit) return false;
  const counts = countMap(allTiles);
  counts[keyOf(win.tile)] -= 1;
  const required = { 1: 3, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 3 };
  return Object.entries(required).every(([value, need]) => (counts[`${suit}${value}`] || 0) === need) &&
    Object.values(counts).reduce((sum, count) => sum + count, 0) === 13;
}

function sequencesFor(suit, value, settings) {
  const seqs = [];
  if (["m", "p", "s"].includes(suit)) {
    for (let start = 1; start <= 7; start += 1) {
      const seq = [start, start + 1, start + 2];
      if (seq.includes(value)) seqs.push(seq.map((n) => `${suit}${n}`));
    }
    if (settings.cosmic) {
      for (const seq of [[8, 9, 1], [9, 1, 2]]) {
        if (seq.includes(value)) seqs.push(seq.map((n) => `${suit}${n}`));
      }
    }
  }
  if (settings.cosmic && suit === "z") {
    for (const seq of [[5, 6, 7], [6, 7, 5], [7, 5, 6], [1, 2, 3], [2, 3, 4], [3, 4, 1], [4, 1, 2]]) {
      if (seq.includes(value)) seqs.push(seq.map((n) => `z${n}`));
    }
  }
  return seqs;
}

function isChiitoi(tiles) {
  return isChiitoiForPlayer(0, tiles);
}

function isChiitoiForPlayer(playerIndex, tiles) {
  if (state.melds[playerIndex].length || tiles.length !== 14) return false;
  const values = Object.values(countMap(tiles));
  return values.length === 7 && values.every((n) => n === 2);
}

function isChineseSevenPairsForPlayer(playerIndex, tiles) {
  if (!state.settings.china || state.melds[playerIndex].length || tiles.length !== 14) return false;
  const values = Object.values(countMap(tiles));
  return values.every((count) => count === 2 || count === 4) && values.reduce((pairs, count) => pairs + count / 2, 0) === 7;
}

function isKokushi(tiles) {
  return isKokushiForPlayer(0, tiles);
}

function isKokushiForPlayer(playerIndex, tiles) {
  if (state.melds[playerIndex].length) return false;
  const terminals = new Set(["m1", "m9", "p1", "p9", "s1", "s9", "z1", "z2", "z3", "z4", "z5", "z6", "z7"]);
  const counts = countMap(tiles);
  return [...terminals].every((key) => counts[key]) && [...terminals].some((key) => counts[key] >= 2);
}

function isPureKokushiForPlayer(playerIndex, tiles, win) {
  if (!isKokushiForPlayer(playerIndex, tiles) || !win?.tile) return false;
  const terminals = ["m1", "m9", "p1", "p9", "s1", "s9", "z1", "z2", "z3", "z4", "z5", "z6", "z7"];
  const winKey = keyOf(win.tile);
  if (!terminals.includes(winKey)) return false;
  const counts = countMap(tiles);
  counts[winKey] -= 1;
  return terminals.every((key) => counts[key] === 1) && Object.values(counts).reduce((sum, count) => sum + count, 0) === 13;
}

function isDaichisei(playerIndex, tiles) {
  return isChiitoiForPlayer(playerIndex, tiles) && tiles.every((tile) => tile.suit === "z");
}

function isTankiCompletion(shape, win) {
  return !!(shape?.pair && win?.tile && keyOf(win.tile) === shape.pair);
}

function yakuList(tiles, settings, flowers, playerIndex = 0, context = {}) {
  const counts = countMap(tiles);
  const yaku = [];
  const allTiles = [...tiles, ...state.melds[playerIndex].flatMap((meld) => meld.tiles)];
  const allCounts = countMap(allTiles);
  const suits = new Set(allTiles.filter((tile) => ["m", "p", "s"].includes(tile.suit)).map((tile) => tile.suit));
  const hasHonor = allTiles.some((tile) => tile.suit === "z");
  const allSimple = allTiles.every((tile) => ["m", "p", "s"].includes(tile.suit) && tile.value >= 2 && tile.value <= 8);
  const allTerminalOrHonor = allTiles.every(isTerminalOrHonorTile);
  const whiteCount = allCounts.z5 || 0;
  const roundWindKey = `z${roundWindValue()}`;
  const seatWindKey = `z${seatWindValue(playerIndex)}`;

  const greaterHonorsKnitted = settings.china && isGreaterHonorsKnitted(playerIndex, tiles);
  const lesserHonorsKnitted = settings.china && !greaterHonorsKnitted && isLesserHonorsKnitted(playerIndex, tiles);
  const knittedStraightInfo = settings.china ? findKnittedStraightInfo(playerIndex, tiles) : null;
  const winningShape = isStandardWinForPlayer(playerIndex, tiles, settings) || isChiitoiForPlayer(playerIndex, tiles) ||
    isChineseSevenPairsForPlayer(playerIndex, tiles) || isKokushiForPlayer(playerIndex, tiles) ||
    greaterHonorsKnitted || lesserHonorsKnitted || !!knittedStraightInfo;
  const standardShape = isStandardWinForPlayer(playerIndex, tiles, settings) ? bestStandardShape(playerIndex, tiles, settings, context.win) : null;
  const interpretedShape = standardShape || knittedStraightInfo?.remainderShape || null;
  const dragonTriplets = [
    { key: "z5", name: "白" },
    { key: "z6", name: "發" },
    { key: "z7", name: "中" }
  ].map((dragon) => ({ ...dragon, count: interpretedTripletCount(playerIndex, interpretedShape, dragon.key) }))
    .filter((dragon) => dragon.count > 0);
  const windTripletKeys = ["z1", "z2", "z3", "z4"].filter((key) => hasInterpretedTriplet(playerIndex, interpretedShape, key));
  const windPair = ["z1", "z2", "z3", "z4"].includes(interpretedShape?.pair) ? interpretedShape.pair : null;
  const dragonPair = ["z5", "z6", "z7"].includes(interpretedShape?.pair) ? interpretedShape.pair : null;
  const daichisei = isDaichisei(playerIndex, tiles);
  const suuankou = standardShape && isSuuankou(playerIndex, standardShape, context.win);
  const pureChuuren = isPureChuuren(playerIndex, allTiles, context.win);
  const pureKokushi = isPureKokushiForPlayer(playerIndex, tiles, context.win);
  if (winningShape && state.doubleRiichi?.[playerIndex]) yaku.push({ id: "double_riichi", name: "ダブル立直", point: 2, note: "鳴きのない一巡目にリーチ宣言。" });
  else if (winningShape && state.riichi[playerIndex]) yaku.push({ id: "riichi", name: "立直", point: 1, note: "門前でリーチ宣言済み。" });
  if (winningShape && state.riichi[playerIndex] && state.riichiIppatsu[playerIndex]) yaku.push({ id: "ippatsu", name: "一発", point: 1, note: "リーチ後、鳴きで途切れる前の最初の和了。" });
  if (winningShape && isTsumoWin(context.win) && isClosedHand(playerIndex)) yaku.push({ id: "menzen_tsumo", name: "門前清自摸和", point: 1, note: "鳴きなしのツモ和了。" });
  if (winningShape && context.win?.chankan) yaku.push({ id: "chankan", name: "槍槓", point: 1, note: "他家の加カン成立前に、その加カン牌でロン。" });
  if (winningShape && context.win?.rinshan) yaku.push({ id: "rinshan", name: "嶺上開花", point: 1, note: "カンの補充牌でツモ和了。" });
  if (winningShape && isTsumoWin(context.win) && state.wall.length === 0 && !context.win?.rinshan) yaku.push({ id: "haitei", name: "海底摸月", point: 1, note: "山の最後の牌でツモ和了。" });
  if (winningShape && isRonWin(context.win) && context.win?.tile?.houteiDiscard) yaku.push({ id: "houtei", name: "河底撈魚", point: 1, note: "最後の打牌でロン和了。" });
  if (winningShape && isTsumoWin(context.win) && playerIndex === 0 && totalDiscards() === 0 && !state.callMade) yaku.push({ id: "tenhou", name: "天和", point: 13, note: "親の配牌直後の第一ツモ和了。" });
  if (winningShape && isTsumoWin(context.win) && playerIndex !== 0 && totalDiscards() === 0 && !state.callMade) yaku.push({ id: "chiihou", name: "地和", point: 13, note: "子の第一ツモで、鳴きのない和了。" });
  if (standardShape && isPinfuShape(standardShape, playerIndex, context.win)) yaku.push({ id: "pinfu", name: "平和", point: 1, note: "全て順子、役牌でない雀頭、両面待ち。" });
  const ryanpeikou = standardShape && isClosedHand(playerIndex) && hasRyanpeikouShape(standardShape);
  if (ryanpeikou) yaku.push({ id: "ryanpeikou", name: "二盃口", point: 3, note: "同じ順子2組が2セットある門前役。一盃口・七対子とは複合しません。" });
  else if (standardShape && isClosedHand(playerIndex) && hasIipeikouShape(standardShape)) yaku.push({ id: "iipeikou", name: "一盃口", point: 1, note: "同じ順子が2組ある門前役。" });
  if (standardShape && isToitoiShape(playerIndex, standardShape)) yaku.push({ id: "toitoi", name: "対々和", point: 2, note: "4面子すべて刻子。" });
  if (standardShape && concealedTripletCount(playerIndex, standardShape, context.win) >= 3) yaku.push({ id: "sanankou", name: "三暗刻", point: 2, note: "暗刻または暗カンが3組。ロンで完成した刻子は明刻扱い。" });
  if (standardShape && hasSanshokuDoukouShape(standardShape)) yaku.push({ id: "sanshoku_doukou", name: "三色同刻", point: 2, note: "萬子・筒子・索子で同じ数字の刻子をそろえる。" });
  if (standardShape && hasSanshokuDoujunShape(standardShape)) yaku.push({ id: "sanshoku_doujun", name: "三色同順", point: openAwareHan(playerIndex, 2, 1), note: "萬子・筒子・索子で同じ順子。" });
  if (standardShape && hasIkkitsuukanShape(playerIndex, standardShape)) yaku.push({ id: "ikkitsuukan", name: "一気通貫", point: openAwareHan(playerIndex, 2, 1), note: state.settings.cosmic ? "同一色で数牌1周分を3順子に分ける。" : "同一色で123・456・789。" });
  if (standardShape && isChantaShape(playerIndex, standardShape, true)) yaku.push({ id: "junchan", name: "純全帯么九", point: openAwareHan(playerIndex, 3, 2), note: "全ての面子と雀頭に老頭牌を含み、字牌なし。" });
  else if (standardShape && isChantaShape(playerIndex, standardShape, false)) yaku.push({ id: "chanta", name: "混全帯么九", point: openAwareHan(playerIndex, 2, 1), note: "全ての面子と雀頭に么九牌を含む。" });
  if (suuankou && isTankiCompletion(standardShape, context.win)) yaku.push({ id: "suuankou_tanki", name: "四暗刻単騎", point: 26, note: "4暗刻を完成させ、雀頭の単騎待ちで和了。" });
  else if (suuankou) yaku.push({ id: "suuankou", name: "四暗刻", point: 13, note: "暗刻または暗カンが4組。シャボ待ちロンの和了牌側は明刻扱い。" });
  if (dragonTriplets.length === 3) yaku.push({ id: "daisangen", name: "大三元", point: 13, note: "白・發・中をすべて刻子でそろえた役満。" });
  if (windTripletKeys.length === 4) yaku.push({ id: "daisuushii", name: "大四喜", point: 26, note: "東・南・西・北すべてを刻子でそろえたダブル役満。" });
  else if (windTripletKeys.length === 3 && windPair) yaku.push({ id: "shousuushii", name: "小四喜", point: 13, note: "風牌3刻子と風牌雀頭。" });
  if (daichisei) yaku.push({ id: "daichisei", name: "大七星", point: 26, note: "7種の字牌をすべて対子にしたダブル役満。" });
  else if (isTsuuiisou(allTiles)) yaku.push({ id: "tsuuiisou", name: "字一色", point: 13, note: "字牌のみで構成。" });
  if (isRyuuiisou(allTiles)) yaku.push({ id: "ryuuiisou", name: "緑一色", point: 13, note: "緑牌のみで構成。" });
  if (isChinroutou(allTiles)) yaku.push({ id: "chinroutou", name: "清老頭", point: 13, note: "一九牌のみで構成。" });
  if (kanCount(playerIndex) >= 4) yaku.push({ id: "suukantsu", name: "四槓子", point: 13, note: "カンが4組。" });
  else if (kanCount(playerIndex) >= 3) yaku.push({ id: "sankantsu", name: "三槓子", point: 2, note: "カンが3組。" });
  if (pureChuuren) yaku.push({ id: "junsei_chuuren", name: "純正九蓮宝燈", point: 26, note: "1112345678999の9面待ちから和了。" });
  else if (isChuuren(playerIndex, allTiles)) yaku.push({ id: "chuuren", name: "九蓮宝燈", point: 13, note: "門前清一色で1112345678999+同色1枚。" });
  if (dragonTriplets.length === 2 && dragonPair) yaku.push({ id: "shousangen", name: "小三元", point: 2, note: "三元牌2刻子と三元牌の雀頭。" });
  if (!standardShape && isChiitoiForPlayer(playerIndex, tiles) && !daichisei) yaku.push({ id: "chiitoi", name: "七対子", point: 2, note: "7組の対子。" });
  if (pureKokushi) yaku.push({ id: "kokushi_13men", name: "国士無双十三面待ち", point: 26, note: "么九牌13種を1枚ずつ持つ13面待ちから和了。" });
  else if (isKokushiForPlayer(playerIndex, tiles)) yaku.push({ id: "kokushi", name: "国士無双", point: 13, note: "么九牌13種。" });
  if (allSimple) yaku.push({ id: "tanyao", name: "断么九", point: 1, note: "2から8だけで構成。" });
  if (allTerminalOrHonor) yaku.push({ id: "honroutou", name: "混老頭", point: 2, note: "老頭牌と字牌のみ。" });
  if (suits.size === 1 && !hasHonor) yaku.push({ id: "chinitsu", name: "清一色", point: openAwareHan(playerIndex, 6, 5), note: "数牌1色のみ。" });
  if (suits.size === 1 && hasHonor) yaku.push({ id: "honitsu", name: "混一色", point: openAwareHan(playerIndex, 3, 2), note: "数牌1色と字牌。" });
  dragonTriplets.forEach((dragon) => {
    const roleCount = dragon.key === "z5" && settings.whiteStorm ? dragon.count : 1;
    for (let index = 0; index < roleCount; index += 1) {
      yaku.push({ id: `yakuhai_${dragon.key}`, name: `役牌 ${dragon.name}`, point: 1, note: roleCount > 1 ? `${dragon.name}の刻子${index + 1}組目。` : `${dragon.name}${allCounts[dragon.key]}枚。` });
    }
  });
  if (hasInterpretedTriplet(playerIndex, standardShape, roundWindKey)) yaku.push({ id: "yakuhai_bakaze", name: `役牌 場風${tileNames.z[roundWindValue()]}`, point: 1, note: `${roundNames[state.roundIndex % roundNames.length]}の場風牌。` });
  if (hasInterpretedTriplet(playerIndex, standardShape, seatWindKey)) yaku.push({ id: "yakuhai_jikaze", name: `役牌 自風${players[playerIndex].wind}`, point: 1, note: `${players[playerIndex].name}の自風牌。` });
  if (settings.whiteStorm && whiteCount >= 8) yaku.push({ id: "white_horizon", source: "china", name: "白色地平線", point: 88, note: "白が8枚以上ある88点役。白刻子の役牌翻は別途加算。" });
  if (flowers.length > 0) yaku.push({ name: "花牌", point: flowers.length, note: `${flowers.length}枚抜き。` });
  if (winningShape) {
    const bonusDora = doraBreakdownForTiles(playerIndex, allTiles);
    if (bonusDora.doraHan > 0) yaku.push({ id: "dora", name: "ドラ", point: bonusDora.doraHan, note: `ドラ・カンドラ合計${bonusDora.doraHan}翻。` });
    if (bonusDora.uraDoraHan > 0) yaku.push({ id: "ura_dora", name: "裏ドラ", point: bonusDora.uraDoraHan, note: `裏ドラ・カン裏ドラ合計${bonusDora.uraDoraHan}翻。` });
  }
  let consecutiveTriplets = standardShape ? consecutiveTripletYakuForTiles(playerIndex, tiles) : null;
  if (settings.china && consecutiveTriplets === "sanrenkou") {
    const repeatedChowCount = Math.max(0, ...bestChineseSequenceCounts(playerIndex, tiles, standardShape).values());
    if (repeatedChowCount >= 4) consecutiveTriplets = null;
  }
  if (consecutiveTriplets === "suurenkou") yaku.push({ id: "suurenkou", name: "四連刻", point: 13, note: state.settings.cosmic ? "同色で宇宙的に連続する4刻子。" : "同色で連続する4刻子。" });
  else if (consecutiveTriplets === "sanrenkou") yaku.push({ id: "sanrenkou", name: "三連刻", point: 2, note: state.settings.cosmic ? "同色で宇宙的に連続する3刻子。" : "同色で連続する3刻子。" });
  if (settings.china) {
    const existingYakuIds = new Set(yaku.map((item) => item.id));
    const chinaYaku = [
      ...chinaStyleYakuV2(allTiles, playerIndex, standardShape, existingYakuIds),
      ...chinaAdvancedYaku(tiles, allTiles, playerIndex, standardShape, existingYakuIds, context)
    ];
    if (chinaYaku.some((item) => item.id === "mcr_pure_terminal_chows")) {
      removeYakuIds(yaku, ["chinitsu", "pinfu", "iipeikou", "ryanpeikou"]);
    }
    if (chinaYaku.some((item) => item.id === "mcr_three_suited_terminal_chows")) {
      removeYakuIds(yaku, ["pinfu"]);
      removeYakuIds(chinaYaku, ["mcr_two_terminal_chows", "mcr_mixed_double_chow"]);
    }
    if (chinaYaku.some((item) => item.id === "mcr_all_fives")) {
      removeYakuIds(yaku, ["tanyao"]);
    }
    if (chinaYaku.some((item) => item.id === "mcr_four_pure_shifted_chows")) {
      removeYakuIds(chinaYaku, ["mcr_pure_shifted_chows", "mcr_short_straight", "mcr_two_terminal_chows"]);
    }
    if (chinaYaku.some((item) => item.id === "mcr_all_even_pungs")) {
      removeYakuIds(yaku, ["toitoi", "tanyao"]);
      removeYakuIds(chinaYaku, ["mcr_all_pungs"]);
    }
    if (chinaYaku.some((item) => item.id === "mcr_reversible_tiles")) {
      removeYakuIds(chinaYaku, ["mcr_one_voided_suit"]);
    }
    if (yaku.some((item) => item.id === "honitsu")) {
      removeYakuIds(chinaYaku, ["mcr_one_voided_suit"]);
    }
    if (chinaYaku.some((item) => ["mcr_greater_honors_knitted", "mcr_lesser_honors_knitted"].includes(item.id))) {
      removeYakuIds(chinaYaku, ["mcr_all_types", "mcr_concealed_hand", "mcr_single_wait"]);
    }
    if (chinaYaku.some((item) => item.id === "mcr_knitted_straight")) {
      removeYakuIds(yaku, ["pinfu"]);
    }
    yaku.push(...chinaYaku);
  }
  if (isDaisharin(allTiles, playerIndex)) yaku.push({ id: "daisharin", name: "大車輪", point: 13, note: "門前の筒子22334455667788。" });
  const finalYakuIds = new Set(yaku.map((item) => item.id));
  if (finalYakuIds.has("suuankou") || finalYakuIds.has("suuankou_tanki")) {
    removeYakuIds(yaku, ["toitoi", "sanankou"]);
  }
  if (finalYakuIds.has("tsuuiisou")) {
    removeYakuIds(yaku, ["chanta", "junchan", "honroutou"]);
  } else if (finalYakuIds.has("chinroutou")) {
    removeYakuIds(yaku, ["honroutou"]);
  }
  const nonBonusYaku = yaku.filter((item) => {
    const id = item.id || item.name;
    return !["dora", "aka_dora", "ura_dora", "flower", "bonus", "花牌"].includes(id);
  });
  if (settings.china && winningShape && isRonWin(context.win) && nonBonusYaku.length === 0) {
    yaku.push({ id: "mcr_chicken_hand", source: "china", name: "無番和", point: 8, note: "ロン和了で、ドラ・花牌以外の日本役と中国役が一切ない手。" });
  }
  const yakuman = yaku.filter((item) => item.source !== "china" && item.point >= 13);
  return yakuman.length ? (settings.china ? yaku : yakuman) : yaku;
}

function chinaStyleYaku(tiles) {
  const yaku = [];
  const counts = countMap(tiles);
  const hasDragonSet = [5, 6, 7].every((n) => counts[`z${n}`]);
  const terminalHeavy = tiles.filter((tile) => ["m", "p", "s"].includes(tile.suit) && [1, 9].includes(tile.value)).length;
  const highTiles = tiles.filter((tile) => ["m", "p", "s"].includes(tile.suit) && tile.value >= 6).length;
  const lowTiles = tiles.filter((tile) => ["m", "p", "s"].includes(tile.suit) && tile.value <= 4).length;
  if (hasDragonSet) yaku.push({ name: "三元連環", point: 3, note: "中国役ミックス: 白發中を連続要素として採用。" });
  if (terminalHeavy >= 8) yaku.push({ name: "全帯幺候補", point: 2, note: "端牌の密度が高い構成。" });
  if (highTiles >= 10) yaku.push({ name: "大於五", point: 3, note: "6以上の数牌中心。" });
  if (lowTiles >= 10) yaku.push({ name: "小於五", point: 3, note: "4以下の数牌中心。" });
  return yaku;
}

function removeYakuIds(yaku, ids) {
  const targets = new Set(ids);
  for (let index = yaku.length - 1; index >= 0; index -= 1) {
    if (targets.has(yaku[index].id)) yaku.splice(index, 1);
  }
}

function chinaStyleYakuV2(allTiles, playerIndex, standardShape, existingYakuIds = new Set()) {
  const yaku = [];
  const counts = countMap(allTiles);
  const numberTiles = allTiles.filter((tile) => ["m", "p", "s"].includes(tile.suit));
  const suits = new Set(numberTiles.map((tile) => tile.suit));
  const hasHonor = allTiles.some((tile) => tile.suit === "z");
  const hasWind = [1, 2, 3, 4].some((value) => counts[`z${value}`]);
  const hasDragon = [5, 6, 7].some((value) => counts[`z${value}`]);
  const allNumbered = allTiles.length > 0 && numberTiles.length === allTiles.length;
  const allValuesIn = (values) => allNumbered && numberTiles.every((tile) => values.includes(tile.value));

  const add = (id, name, point, note) => yaku.push({ id, source: "china", name, point, note });

  const upperTiles = allValuesIn([7, 8, 9]);
  const middleTiles = allValuesIn([4, 5, 6]);
  const lowerTiles = allValuesIn([1, 2, 3]);
  const upperFour = allValuesIn([6, 7, 8, 9]);
  const lowerFour = allValuesIn([1, 2, 3, 4]);

  if (upperTiles) add("mcr_upper_tiles", "全大", 24, "全ての牌が7・8・9の数牌。");
  else if (middleTiles) add("mcr_middle_tiles", "全中", 24, "全ての牌が4・5・6の数牌。");
  else if (lowerTiles) add("mcr_lower_tiles", "全小", 24, "全ての牌が1・2・3の数牌。");
  else if (upperFour) add("mcr_upper_four", "大於五", 12, "全ての牌が6以上の数牌。");
  else if (lowerFour) add("mcr_lower_four", "小於五", 12, "全ての牌が4以下の数牌。");

  if (suits.size === 3 && hasWind && hasDragon) add("mcr_all_types", "五門斉", 6, "萬子・筒子・索子・風牌・三元牌を全て含む。");
  if (suits.size === 2 && !existingYakuIds.has("honitsu")) add("mcr_one_voided_suit", "缺一門", 1, "数牌3色のうち1色を欠く。字牌を含んでもよい。");
  if (isReversibleTiles(allTiles)) add("mcr_reversible_tiles", "推不倒", 8, "点対称の牌画を持つ1234589筒・245689索・白だけで構成。");
  if (!hasHonor && !upperTiles && !middleTiles && !lowerTiles && !upperFour && !lowerFour) add("mcr_no_honors", "無字", 1, "字牌を含まない。");

  return yaku;
}

function isDaisharin(allTiles, playerIndex) {
  if (state.melds[playerIndex].length || allTiles.length !== 14) return false;
  const counts = countMap(allTiles);
  return allTiles.every((tile) => tile.suit === "p") &&
    [2, 3, 4, 5, 6, 7, 8].every((value) => counts[`p${value}`] === 2) &&
    Object.keys(counts).length === 7;
}

function isSevenShiftedPairs(allTiles, playerIndex) {
  if (state.melds[playerIndex].length || allTiles.length !== 14 || isDaisharin(allTiles, playerIndex)) return false;
  const suit = allTiles[0]?.suit;
  if (!["m", "p", "s"].includes(suit) || !allTiles.every((tile) => tile.suit === suit)) return false;
  const counts = countMap(allTiles);
  const values = [...new Set(allTiles.map((tile) => tile.value))].sort((a, b) => a - b);
  if (values.length !== 7 || !values.every((value) => counts[`${suit}${value}`] === 2)) return false;
  if (!state.settings.cosmic) return values.every((value, index) => index === 0 || value === values[index - 1] + 1);
  return Array.from({ length: 9 }, (_, index) => index + 1).some((start) => {
    const expected = Array.from({ length: 7 }, (_, offset) => ((start - 1 + offset) % 9) + 1).sort((a, b) => a - b);
    return expected.every((value, index) => value === values[index]);
  });
}

function isPureTerminalChows(allTiles) {
  if (allTiles.length !== 14) return false;
  const suit = allTiles[0]?.suit;
  if (!["m", "p", "s"].includes(suit) || !allTiles.every((tile) => tile.suit === suit)) return false;
  const counts = countMap(allTiles);
  return [1, 2, 3, 5, 7, 8, 9].every((value) => counts[`${suit}${value}`] === 2) && Object.keys(counts).length === 7;
}

function chineseSequenceSignature(keys) {
  if (keys.length !== 3) return null;
  const suit = keys[0]?.[0];
  if (!["m", "p", "s", "z"].includes(suit) || !keys.every((key) => key[0] === suit)) return null;
  const values = keys.map((key) => Number(key.slice(1))).sort((a, b) => a - b);
  if (new Set(values).size !== 3) return null;
  const validSequence = sequencesFor(suit, values[0], state.settings).some((sequence) => {
    const candidate = sequence.map((key) => Number(key.slice(1))).sort((a, b) => a - b);
    return candidate.every((value, index) => value === values[index]);
  });
  if (!validSequence) return null;
  return `${suit}:${values.join(",")}`;
}

function chineseSequenceCounts(playerIndex, standardShape) {
  const counts = new Map();
  const addKeys = (keys) => {
    const signature = chineseSequenceSignature(keys);
    if (signature) counts.set(signature, (counts.get(signature) || 0) + 1);
  };
  standardShape?.melds.filter((meld) => meld.type === "sequence").forEach((meld) => addKeys(meld.keys));
  state.melds[playerIndex].forEach((meld) => addKeys(meld.tiles.map(keyOf)));
  return counts;
}

function chineseTripletValues(playerIndex, standardShape) {
  const bySuit = new Map([["m", new Set()], ["p", new Set()], ["s", new Set()]]);
  const addKey = (key) => {
    const suit = key?.[0];
    if (bySuit.has(suit)) bySuit.get(suit).add(Number(key.slice(1)));
  };
  standardShape?.melds.filter((meld) => meld.type === "triplet").forEach((meld) => addKey(meld.keys[0]));
  state.melds[playerIndex].forEach((meld) => {
    const keys = meld.tiles.map(keyOf);
    if (keys.length >= 3 && keys.every((key) => key === keys[0])) addKey(keys[0]);
  });
  return bySuit;
}

function hasNumberRun(values, length, cosmic = false) {
  const valueSet = new Set(values);
  const starts = cosmic ? Array.from({ length: 9 }, (_, index) => index + 1) : Array.from({ length: 10 - length }, (_, index) => index + 1);
  return starts.some((start) => Array.from({ length }, (_, offset) => cosmic ? ((start - 1 + offset) % 9) + 1 : start + offset)
    .every((value) => valueSet.has(value)));
}

function consecutiveTripletYaku(playerIndex, standardShape) {
  const bySuit = chineseTripletValues(playerIndex, standardShape);
  if ([...bySuit.values()].some((values) => hasNumberRun(values, 4, state.settings.cosmic))) return "suurenkou";
  if ([...bySuit.values()].some((values) => hasNumberRun(values, 3, state.settings.cosmic))) return "sanrenkou";
  return null;
}

function consecutiveTripletYakuForTiles(playerIndex, tiles) {
  let foundThree = false;
  for (const shape of standardShapes(tiles, state.settings)) {
    const result = consecutiveTripletYaku(playerIndex, shape);
    if (result === "suurenkou") return result;
    if (result === "sanrenkou") foundThree = true;
  }
  return foundThree ? "sanrenkou" : null;
}

function bestChineseSequenceCounts(playerIndex, concealedTiles, fallbackShape = null) {
  const shapes = standardShapes(concealedTiles, state.settings);
  if (!shapes.length && fallbackShape) shapes.push(fallbackShape);
  let best = new Map();
  let bestScore = -1;
  for (const shape of shapes) {
    const counts = chineseSequenceCounts(playerIndex, shape);
    const multiplicities = [...counts.values()];
    const score = (Math.max(0, ...multiplicities) * 100) + multiplicities.reduce((sum, count) => sum + Math.floor(count / 2), 0);
    if (score > bestScore) {
      best = counts;
      bestScore = score;
    }
  }
  return best;
}

function chineseCandidateShapes(concealedTiles, fallbackShape = null) {
  const shapes = standardShapes(concealedTiles, state.settings);
  if (!shapes.length && fallbackShape) shapes.push(fallbackShape);
  return shapes;
}

function hasThreeSuitedTerminalChows(playerIndex, shape) {
  if (!shape || !["m", "p", "s"].includes(shape.pair?.[0]) || Number(shape.pair.slice(1)) !== 5) return false;
  const counts = chineseSequenceCounts(playerIndex, shape);
  const totalSequences = [...counts.values()].reduce((sum, count) => sum + count, 0);
  if (totalSequences !== 4) return false;
  const terminalSuits = ["m", "p", "s"].filter((suit) => (
    (counts.get(`${suit}:1,2,3`) || 0) > 0 && (counts.get(`${suit}:7,8,9`) || 0) > 0
  ));
  return terminalSuits.length === 2 && !terminalSuits.includes(shape.pair[0]);
}

function chineseSequenceStartOptions(signature) {
  const [suit, valuesText] = signature.split(":");
  const target = valuesText.split(",").map(Number);
  const sameValues = (values) => [...values].sort((a, b) => a - b).every((value, index) => value === target[index]);
  if (["m", "p", "s"].includes(suit)) {
    return numericSequencePatterns(state.settings.cosmic)
      .map((values) => ({ suit, group: suit, start: values[0] - 1, cycle: state.settings.cosmic ? 9 : null, values }))
      .filter((option) => sameValues(option.values));
  }
  if (suit !== "z" || !state.settings.cosmic) return [];
  const honorPatterns = [
    { values: [1, 2, 3], start: 0, group: "winds", cycle: 4 },
    { values: [2, 3, 4], start: 1, group: "winds", cycle: 4 },
    { values: [3, 4, 1], start: 2, group: "winds", cycle: 4 },
    { values: [4, 1, 2], start: 3, group: "winds", cycle: 4 },
    { values: [5, 6, 7], start: 0, group: "dragons", cycle: 3 },
    { values: [6, 7, 5], start: 1, group: "dragons", cycle: 3 },
    { values: [7, 5, 6], start: 2, group: "dragons", cycle: 3 }
  ];
  return honorPatterns
    .filter((option) => sameValues(option.values))
    .map((option) => ({ ...option, suit }));
}

function maximumDisjointPairs(entries, compatible) {
  if (entries.length < 2) return 0;
  let best = maximumDisjointPairs(entries.slice(1), compatible);
  for (let index = 1; index < entries.length; index += 1) {
    if (!compatible(entries[0], entries[index])) continue;
    const rest = entries.filter((_, entryIndex) => entryIndex !== 0 && entryIndex !== index);
    best = Math.max(best, 1 + maximumDisjointPairs(rest, compatible));
  }
  return best;
}

function mixedDoubleChowCount(playerIndex, shape) {
  if (!shape) return 0;
  const byValues = new Map();
  chineseSequenceCounts(playerIndex, shape).forEach((count, signature) => {
    const [suit, values] = signature.split(":");
    if (!["m", "p", "s"].includes(suit)) return;
    if (!byValues.has(values)) byValues.set(values, []);
    for (let index = 0; index < count; index += 1) byValues.get(values).push(suit);
  });
  return [...byValues.values()].reduce((sum, suits) => (
    sum + maximumDisjointPairs(suits, (left, right) => left !== right)
  ), 0);
}

function shortStraightCount(playerIndex, shape) {
  if (!shape) return 0;
  const entries = [];
  chineseSequenceCounts(playerIndex, shape).forEach((count, signature) => {
    const options = chineseSequenceStartOptions(signature)
      .filter((option) => ["m", "p", "s"].includes(option.suit) || option.group === "winds");
    if (!options.length) return;
    for (let index = 0; index < count; index += 1) entries.push(options[0]);
  });
  return maximumDisjointPairs(entries, (left, right) => {
    if (left.suit !== right.suit || left.group !== right.group) return false;
    if (left.group === "winds") {
      const distance = Math.abs(left.start - right.start);
      return distance === 1 || distance === 3;
    }
    const distance = Math.abs(left.start - right.start);
    return state.settings.cosmic ? distance === 3 || distance === 6 : distance === 3;
  });
}

function doublePungCount(playerIndex, shape) {
  const bySuit = chineseTripletValues(playerIndex, shape);
  return Array.from({ length: 9 }, (_, index) => index + 1).reduce((sum, value) => {
    const suitCount = ["m", "p", "s"].filter((suit) => bySuit.get(suit)?.has(value)).length;
    return sum + (suitCount === 2 ? 1 : 0);
  }, 0);
}

function terminalHonorPungCount(playerIndex, shape) {
  const terminalKeys = ["m1", "m9", "p1", "p9", "s1", "s9"];
  const valueWindKeys = new Set([`z${roundWindValue()}`, `z${seatWindValue(playerIndex)}`]);
  const guestWindKeys = ["z1", "z2", "z3", "z4"].filter((key) => !valueWindKeys.has(key));
  return [...terminalKeys, ...guestWindKeys]
    .reduce((sum, key) => sum + interpretedTripletCount(playerIndex, shape, key), 0);
}

function meldedKongCounts(playerIndex) {
  const kongs = state.melds[playerIndex].filter((meld) => meld.type.includes("カン"));
  const concealed = kongs.filter((meld) => meld.type === "暗カン").length;
  return { concealed, exposed: kongs.length - concealed };
}

function hasPureShiftedChows(playerIndex, shape, requiredCount = 3) {
  if (!shape) return false;
  const entries = [];
  chineseSequenceCounts(playerIndex, shape).forEach((count, signature) => {
    for (let index = 0; index < count; index += 1) entries.push(chineseSequenceStartOptions(signature));
  });
  if (entries.length < requiredCount) return false;
  const follows = (left, right, step) => {
    if (left.suit !== right.suit || left.group !== right.group || left.cycle !== right.cycle) return false;
    return left.cycle
      ? right.start === (left.start + step) % left.cycle
      : right.start === left.start + step;
  };
  const extend = (last, step, used, depth) => {
    if (depth >= requiredCount) return true;
    return entries.some((options, index) => !used.has(index) && options.some((option) => {
      if (!follows(last, option, step)) return false;
      const nextUsed = new Set(used);
      nextUsed.add(index);
      return extend(option, step, nextUsed, depth + 1);
    }));
  };
  return entries.some((options, index) => options.some((first) => (
    [1, 2].some((step) => extend(first, step, new Set([index]), 1))
  )));
}

function isAllFivesShape(playerIndex, shape) {
  if (!shape || !["m", "p", "s"].includes(shape.pair?.[0]) || Number(shape.pair.slice(1)) !== 5) return false;
  const melds = [...shape.melds, ...state.melds[playerIndex].map(meldShapeFromCalledMeld)];
  return melds.length === 4 && melds.every((meld) => (
    meld.keys.every((key) => ["m", "p", "s"].includes(key[0])) && meld.keys.some((key) => Number(key.slice(1)) === 5)
  ));
}

function isAllEvenPungsShape(playerIndex, shape) {
  if (!shape || !["m", "p", "s"].includes(shape.pair?.[0]) || Number(shape.pair.slice(1)) % 2 !== 0) return false;
  const melds = [...shape.melds, ...state.melds[playerIndex].map(meldShapeFromCalledMeld)];
  return melds.length === 4 && melds.every((meld) => (
    meld.type === "triplet" &&
    meld.keys.every((key) => ["m", "p", "s"].includes(key[0])) &&
    Number(meld.keys[0].slice(1)) % 2 === 0
  ));
}

function chineseTileHogCount(allTiles, playerIndex) {
  const kongKeys = new Set(state.melds[playerIndex]
    .filter((meld) => meld.tiles.length >= 4 && meld.tiles.every((tile) => keyOf(tile) === keyOf(meld.tiles[0])))
    .map((meld) => keyOf(meld.tiles[0])));
  return Object.entries(countMap(allTiles)).filter(([key, count]) => count === 4 && !kongKeys.has(key)).length;
}

function chinaAdvancedYaku(concealedTiles, allTiles, playerIndex, standardShape, existingYakuIds = new Set(), context = {}) {
  const yaku = [];
  const add = (id, name, point, note) => yaku.push({ id, source: "china", name, point, note });
  const greaterHonorsKnitted = isGreaterHonorsKnitted(playerIndex, concealedTiles);
  const lesserHonorsKnitted = !greaterHonorsKnitted && isLesserHonorsKnitted(playerIndex, concealedTiles);
  const knittedStraightInfo = findKnittedStraightInfo(playerIndex, concealedTiles);
  const knittedPatternInfo = findKnittedPatternInfo(concealedTiles);
  if (greaterHonorsKnitted) add("mcr_greater_honors_knitted", "七星不靠", 24, "字牌7種各1枚と、色分けした147・258・369から7枚を使う門前特殊形。");
  else if (lesserHonorsKnitted) add("mcr_lesser_honors_knitted", "全不靠", 12, "字牌と、色分けした147・258・369からなる14枚すべて異なる門前特殊形。");
  if (knittedStraightInfo || (lesserHonorsKnitted && knittedPatternInfo)) add("mcr_knitted_straight", "組合龍", 12, "3色に割り当てた147・258・369の9枚を含む特殊形。");
  if (isSevenShiftedPairs(allTiles, playerIndex)) {
    add("mcr_seven_shifted_pairs", "連七対", 88, state.settings.cosmic ? "同色の連続する7対子。9-1境界も連続として扱う。" : "同色の連続する7対子。");
    return yaku;
  }
  if (isPureTerminalChows(allTiles)) {
    add("mcr_pure_terminal_chows", "一色双龍会", 64, "同色の123を2組、789を2組、5を雀頭とする。清一色・平和・一盃口系を置換。" );
    return yaku;
  }
  const chineseSevenPairs = !standardShape && isChineseSevenPairsForPlayer(playerIndex, allTiles) && !isChiitoiForPlayer(playerIndex, allTiles);
  if (chineseSevenPairs) {
    add("mcr_seven_pairs", "七対", 24, "4枚使いを2対子として数える中国式七対。" );
    const tileHogs = chineseTileHogCount(allTiles, playerIndex);
    if (tileHogs > 0) add("mcr_tile_hog", "四帰一", tileHogs * 2, `槓子にせず4枚使った牌が${tileHogs}種。`);
    return yaku;
  }
  const sequenceCounts = bestChineseSequenceCounts(playerIndex, concealedTiles, standardShape);
  const candidateShapes = chineseCandidateShapes(concealedTiles, standardShape);
  const threeSuitedTerminalChows = candidateShapes.some((shape) => hasThreeSuitedTerminalChows(playerIndex, shape));
  const fourPureShiftedChows = candidateShapes.some((shape) => hasPureShiftedChows(playerIndex, shape, 4));
  const pureShiftedChows = !fourPureShiftedChows && candidateShapes.some((shape) => hasPureShiftedChows(playerIndex, shape, 3));
  const allFives = candidateShapes.some((shape) => isAllFivesShape(playerIndex, shape));
  const allEvenPungs = candidateShapes.some((shape) => isAllEvenPungsShape(playerIndex, shape));
  const mixedStraight = candidateShapes.some((shape) => hasMixedStraightShape(playerIndex, shape));
  const threeWindPungs = hasThreeWindPungs(playerIndex, standardShape);
  const mixedShiftedPungs = candidateShapes.some((shape) => hasMixedShiftedPungsShape(playerIndex, shape));
  const mixedShiftedChows = candidateShapes.some((shape) => hasMixedShiftedChowsShape(playerIndex, shape));
  const meldedHand = isMeldedHandWin(playerIndex, standardShape, context.win);
  const concealedKongs = concealedKongCount(playerIndex);
  const concealedPungs = concealedPungCount(standardShape, context.win);
  const dragonPungs = ["z5", "z6", "z7"].filter((key) => hasInterpretedTriplet(playerIndex, standardShape, key)).length;
  const kongCounts = meldedKongCounts(playerIndex);
  const hasTwoMeldedKongs = kongCounts.exposed >= 2 || (kongCounts.exposed >= 1 && kongCounts.concealed >= 1);
  const doublePungs = existingYakuIds.has("sanshoku_doukou") ? 0 : doublePungCount(playerIndex, standardShape);
  const mixedDoubleChows = existingYakuIds.has("sanshoku_doujun") ? 0 : mixedDoubleChowCount(playerIndex, standardShape);
  const shortStraights = existingYakuIds.has("ikkitsuukan") ? 0 : shortStraightCount(playerIndex, standardShape);
  const terminalHonorPungs = terminalHonorPungCount(playerIndex, standardShape);
  if (threeSuitedTerminalChows) {
    add("mcr_three_suited_terminal_chows", "三色双龍会", 16, "2色で123・789を各1組作り、残る色の5を雀頭とする。");
  }
  if (fourPureShiftedChows) {
    add("mcr_four_pure_shifted_chows", "一色四歩高", 32, state.settings.cosmic ? "同色の順子4組を1または2ずつ宇宙的にずらす。字牌順子にも対応。" : "同色の順子4組を1または2ずつずらす。");
  } else if (pureShiftedChows) {
    add("mcr_pure_shifted_chows", "一色三歩高", 16, state.settings.cosmic ? "同色の順子3組を1または2ずつ宇宙的にずらす。字牌順子にも対応。" : "同色の順子3組を1または2ずつずらす。");
  }
  if (allFives) add("mcr_all_fives", "全帯五", 16, "全ての面子と雀頭に数牌の5を含む。");
  if (allEvenPungs) add("mcr_all_even_pungs", "全双刻", 24, "偶数の数牌だけで4刻子1雀頭を作る。");
  if (threeWindPungs) add("mcr_big_three_winds", "三風刻", 12, "風牌3種を刻子または槓子でそろえる。字牌順子は刻子に数えない。");
  if (mixedStraight) add("mcr_mixed_straight", "花龍", 8, state.settings.cosmic ? "3色で数牌1周分の3順子を作る。9-1境界をまたぐ宇宙順子にも対応。" : "3色で123・456・789の3順子を作る。");
  if (mixedShiftedPungs) add("mcr_mixed_shifted_pungs", "三色三節高", 8, state.settings.cosmic ? "複数色で宇宙的に連続する3刻子。9-1境界にも対応。" : "複数色で数字が連続する3刻子。");
  if (mixedShiftedChows) add("mcr_mixed_shifted_chows", "三色三歩高", 6, state.settings.cosmic ? "3色の順子を1ずつ宇宙的にずらす。9-1境界にも対応。" : "3色の順子を1ずつずらす。");
  if (meldedHand) add("mcr_melded_hand", "全求人", 6, "4面子すべてを副露し、裸単騎でロン和了。");
  if (concealedKongs >= 2) add("mcr_two_concealed_kongs", "双暗槓", 6, `暗槓を${concealedKongs}組含む。暗槓・双暗刻とは複合しない。`);
  else {
    if (concealedKongs === 1) add("mcr_concealed_kong", "暗槓", 2, "暗槓を1組含む。");
    if (concealedPungs >= 2 && !["sanankou", "suuankou", "suuankou_tanki"].some((id) => existingYakuIds.has(id))) {
      add("mcr_two_concealed_pungs", "双暗刻", 2, `暗刻を${concealedPungs}組含む。`);
    }
  }
  if (dragonPungs >= 2 && !existingYakuIds.has("shousangen") && !existingYakuIds.has("daisangen")) {
    add("mcr_two_dragon_pungs", "双箭刻", 2, "三元牌の刻子2組に対する追加ボーナス。役牌2組は日本側で別途計上。");
  }
  if (hasTwoMeldedKongs) {
    add("mcr_two_melded_kongs", "双明槓", 4, "明槓2組、または明槓と暗槓を1組ずつ含む。");
  } else if (kongCounts.exposed === 1) {
    add("mcr_melded_kong", "明槓", 1, "明槓を1組含む。");
  }
  if (doublePungs > 0) add("mcr_double_pung", "双同刻", doublePungs * 2, `異なる色の同数刻子を${doublePungs}組。`);
  if (mixedDoubleChows > 0) add("mcr_mixed_double_chow", "喜相逢", mixedDoubleChows, `異なる色の同数順子を${mixedDoubleChows}組。`);
  if (shortStraights > 0) add("mcr_short_straight", "連六", shortStraights, state.settings.cosmic
    ? `同色の宇宙順子、または連続する風牌順子の組を${shortStraights}組。`
    : `同色で3つ離れた順子の組を${shortStraights}組。`);
  if (terminalHonorPungs > 0) add("mcr_terminal_honor_pung", "么九刻", terminalHonorPungs, `老頭牌または客風牌の刻子・槓子を${terminalHonorPungs}組。`);
  const quadrupleChows = [...sequenceCounts.values()].filter((count) => count >= 4).length;
  const tripleChows = [...sequenceCounts.values()].filter((count) => count === 3).length;
  if (!existingYakuIds.has("suurenkou") && !existingYakuIds.has("sanrenkou") && quadrupleChows > 0) {
    add("mcr_quadruple_chow", "一色四同順", 48, "同色同順の順子を4組。" );
  } else if (!existingYakuIds.has("suurenkou") && !existingYakuIds.has("sanrenkou") && tripleChows > 0) {
    add("mcr_pure_triple_chow", "一色三同順", 24, "同色同順の順子を3組。" );
  } else if (!existingYakuIds.has("suurenkou") && !existingYakuIds.has("sanrenkou") &&
    !existingYakuIds.has("iipeikou") && !existingYakuIds.has("ryanpeikou")) {
    const pureDoubleChows = [...sequenceCounts.values()].reduce((sum, count) => sum + Math.floor(count / 2), 0);
    if (pureDoubleChows > 0) add("mcr_pure_double_chow", "一般高", pureDoubleChows, `同色同順の組を${pureDoubleChows}組。`);
  }
  const terminalChowPairs = ["m", "p", "s"].reduce((sum, suit) => {
    const low = sequenceCounts.get(`${suit}:1,2,3`) || 0;
    const high = sequenceCounts.get(`${suit}:7,8,9`) || 0;
    return sum + Math.min(low, high);
  }, 0);
  if (terminalChowPairs > 0 && !threeSuitedTerminalChows && !fourPureShiftedChows) add("mcr_two_terminal_chows", "老少副", terminalChowPairs, `同色の123と789の組を${terminalChowPairs}組。`);
  if (quadrupleChows === 0 && !existingYakuIds.has("suurenkou")) {
    const tileHogs = chineseTileHogCount(allTiles, playerIndex);
    if (tileHogs > 0) add("mcr_tile_hog", "四帰一", tileHogs * 2, `槓子にせず4枚使った牌が${tileHogs}種。`);
  }

  const concealedHandExclusions = new Set([
    "mcr_seven_shifted_pairs",
    "daisharin",
    "kokushi",
    "kokushi_13men",
    "suuankou",
    "suuankou_tanki",
    "daichisei",
    "junsei_chuuren",
    "chiitoi",
    "mcr_seven_pairs",
    "mcr_greater_honors_knitted",
    "mcr_lesser_honors_knitted"
  ]);
  const combinedYakuIds = new Set([...existingYakuIds, ...yaku.map((item) => item.id)]);
  const canAddConcealedHand = standardShape &&
    isRonWin(context.win) &&
    isClosedHand(playerIndex) &&
    !isDaisharin(allTiles, playerIndex) &&
    ![...concealedHandExclusions].some((id) => combinedYakuIds.has(id));
  if (canAddConcealedHand) {
    add("mcr_concealed_hand", "門前清", 2, "ポン・チー・明槓をせず、4面子1雀頭の形でロン和了。");
  }
  if (isTsumoWin(context.win) && !existingYakuIds.has("menzen_tsumo")) {
    add("mcr_self_drawn", "自摸", 1, "鳴いた手のツモ和了。門前清自摸和とは複合しません。");
  }
  if (isLastTileYaku(context.win)) {
    const exposed = lastTileExposedCount(keyOf(context.win.tile), context.win);
    add("mcr_last_tile", "和絶張", 4, `和了牌と同種の牌が河・副露・最初のドラ表示牌に${exposed}枚公開済み。`);
  }
  const waitYaku = meldedHand ? null : waitYakuForHand(playerIndex, concealedTiles, context.win, knittedStraightInfo);
  if (waitYaku) add(waitYaku.id, waitYaku.name, waitYaku.point, waitYaku.note);
  return yaku;
}

function debugChinesePattern(codes, options = {}) {
  const playerIndex = 0;
  const previousSettings = state.settings;
  const previousMelds = state.melds;
  const previousDiscardCounts = state.discardCounts;
  const previousDora = state.dora;
  const previousUraDora = state.uraDora;
  const previousRiichi = state.riichi[playerIndex];
  const previousRivers = state.rivers;
  try {
    state.settings = { ...state.settings, cosmic: !!options.cosmic, china: options.china !== false, whiteStorm: !!options.whiteStorm, whiteCount: Number(options.whiteCount ?? (options.whiteStorm ? 12 : 4)) };
    state.discardCounts = [1, 0, 0, 0];
    state.dora = (options.dora || []).map((code, index) => makeTile(code[0], Number(code.slice(1)), 976000 + index));
    state.uraDora = (options.uraDora || []).map((code, index) => makeTile(code[0], Number(code.slice(1)), 977000 + index));
    state.rivers = (options.rivers || [[], [], [], []]).map((codes, riverIndex) => codes.map((code, index) => makeTile(code[0], Number(code.slice(1)), 978000 + riverIndex * 100 + index)));
    state.riichi[playerIndex] = false;
    state.melds = [0, 1, 2, 3].map((seat) => {
      const seatMelds = seat === playerIndex ? (options.melds || []) : (options.tableMelds?.[seat] || []);
      return seatMelds.map((meldCodes, meldIndex) => ({
        type: seat === playerIndex ? (options.meldTypes?.[meldIndex] || "debug-meld") : "debug-meld",
        from: seat === playerIndex ? 1 : seat,
        tiles: meldCodes.map((code, index) => makeTile(code[0], Number(code.slice(1)), 980000 + seat * 100 + meldIndex * 10 + index))
      }));
    });
    const tiles = codes.map((code, index) => makeTile(code[0], Number(code.slice(1)), 990000 + index));
    const debugWin = options.win ? {
      ...options.win,
      tile: options.win.tileCode
        ? makeTile(options.win.tileCode[0], Number(options.win.tileCode.slice(1)), 995000)
        : options.win.tile
    } : null;
    if (options.includeWinningDiscard && debugWin?.tile && debugWin.discarder !== undefined) {
      state.rivers[debugWin.discarder].push(debugWin.tile);
    }
    const shape = bestStandardShape(playerIndex, tiles, state.settings, debugWin);
    const allTiles = [...tiles, ...state.melds[playerIndex].flatMap((meld) => meld.tiles)];
    const existing = new Set(options.existingYakuIds || []);
    let localConsecutive = consecutiveTripletYakuForTiles(playerIndex, tiles);
    if (state.settings.china && localConsecutive === "sanrenkou") {
      const repeatedChowCount = Math.max(0, ...bestChineseSequenceCounts(playerIndex, tiles, shape).values());
      if (repeatedChowCount >= 4) localConsecutive = null;
    }
    if (localConsecutive) existing.add(localConsecutive);
    return {
      daisharin: isDaisharin(allTiles, playerIndex),
      japaneseChiitoi: isChiitoiForPlayer(playerIndex, allTiles),
      chineseSevenPairs: isChineseSevenPairsForPlayer(playerIndex, allTiles),
      winningShape: isWinningHandWithTiles(playerIndex, tiles),
      consecutiveTriplets: localConsecutive,
      yaku: state.settings.china ? chinaAdvancedYaku(tiles, allTiles, playerIndex, shape, existing, { win: debugWin }) : [],
      fullYaku: yakuList(tiles, state.settings, [], playerIndex, { win: debugWin })
    };
  } finally {
    state.settings = previousSettings;
    state.melds = previousMelds;
    state.discardCounts = previousDiscardCounts;
    state.dora = previousDora;
    state.uraDora = previousUraDora;
    state.riichi[playerIndex] = previousRiichi;
    state.rivers = previousRivers;
  }
}

function debugCpuDiscard(codes, options = {}) {
  const previousSettings = state.settings;
  const previousDrawnTileId = state.drawnTileId;
  const previousRivers = state.rivers;
  const previousDora = state.dora;
  try {
    state.settings = {
      ...state.settings,
      china: !!options.china,
      cosmic: !!options.cosmic,
      whiteStorm: !!options.whiteStorm,
      whiteCount: options.whiteCount || (options.whiteStorm ? 12 : 4)
    };
    state.rivers = [[], (options.visibleCodes || []).map((code, index) => makeTile(code[0], Number(code.slice(1)), 940000 + index)), [], []];
    state.dora = [];
    const hand = codes.map((code, index) => makeTile(code[0], Number(code.slice(1)), 970000 + index));
    state.drawnTileId = hand[options.drawnIndex ?? hand.length - 1]?.id || null;
    const candidates = hand.map((tile, index) => {
      const remaining = hand.filter((_, tileIndex) => tileIndex !== index);
      const meldLoss = completedMeldLoss(hand, tile);
      const score = cpuHandPlanScore(remaining, tile, 0) - meldLoss * completedMeldPenaltyWeight(hand) + (tile.id === state.drawnTileId ? 0.35 : 0);
      return { tile: tileCode(tile), score, meldLoss };
    });
    const chosenIndex = chooseCpuDiscard(hand, 0);
    const remaining = hand.filter((_, index) => index !== chosenIndex);
    return { chosen: tileCode(hand[chosenIndex]), special: cpuSpecialPlanProfile(remaining, 0), flush: flushPlanProfile(hand, 0), whiteSupply: honorSupplyInfo("z5", hand), candidates };
  } finally {
    state.settings = previousSettings;
    state.drawnTileId = previousDrawnTileId;
    state.rivers = previousRivers;
    state.dora = previousDora;
  }
}

function debugCpuCallProbability(handCodes, optionCodes, type, options = {}) {
  const previousSettings = state.settings;
  const previousHand = state.hands[0];
  const previousMelds = state.melds[0];
  try {
    state.settings = { ...state.settings, china: !!options.china, cosmic: !!options.cosmic };
    state.hands[0] = handCodes.map((code, index) => makeTile(code[0], Number(code.slice(1)), 960000 + index));
    state.melds[0] = [];
    const tiles = optionCodes.map((code, index) => makeTile(code[0], Number(code.slice(1)), 950000 + index));
    const usedIds = new Set();
    const consume = tiles.slice(1).map((tile) => {
      const found = state.hands[0].find((handTile) => (
        handTile.suit === tile.suit && handTile.value === tile.value && !usedIds.has(handTile.id)
      ));
      if (found) usedIds.add(found.id);
      return found?.id;
    }).filter(Boolean);
    const option = { type, tiles, consume };
    return {
      probability: cpuCallProbability(0, option),
      closedReadiness: cpuClosedReadiness(0),
      createsTenpai: cpuCallCreatesTenpai(0, option),
      flush: flushPlanProfile(state.hands[0], 0)
    };
  } finally {
    state.settings = previousSettings;
    state.hands[0] = previousHand;
    state.melds[0] = previousMelds;
  }
}

function debugClosedKanOptions(codes) {
  const previousHand = state.hands[0];
  try {
    state.hands[0] = codes.map((code, index) => makeTile(code[0], Number(code.slice(1)), 990000 + index));
    return closedKanOptions(0).map((option) => option.tiles.map(tileCode));
  } finally {
    state.hands[0] = previousHand;
  }
}

window.mizuharaMahjongDebug = { debugChinesePattern, debugCpuDiscard, debugCpuCallProbability, debugClosedKanOptions };

function tileSvgData(tile) {
  const color = suitColor[tile.suit];
  const main = tile.suit === "z" || tile.suit === "f" ? label(tile) : String(tile.value);
  const sub = tile.suit === "z" ? "" : suitMark[tile.suit];
  const dots = tile.suit === "p" ? pipPattern(tile.value) : "";
  const bamboo = tile.suit === "s" ? bambooPattern(tile.value) : "";
  const wan = tile.suit === "m" ? `<text x="32" y="51" text-anchor="middle" font-size="20" font-weight="900" fill="${color}">萬</text>` : "";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 88">
      <defs>
        <linearGradient id="face" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="#fffdf5"/>
          <stop offset="1" stop-color="#efe1c8"/>
        </linearGradient>
      </defs>
      <rect x="4" y="3" width="56" height="80" rx="7" fill="#c8a465"/>
      <rect x="4" y="3" width="54" height="75" rx="7" fill="url(#face)" stroke="#bba98f" stroke-width="1.5"/>
      <text x="10" y="17" font-size="10" font-weight="900" fill="${color}">${label(tile)}</text>
      ${tile.suit === "p" ? dots : ""}
      ${tile.suit === "s" ? bamboo : ""}
      ${tile.suit === "m" ? `<text x="32" y="38" text-anchor="middle" font-size="30" font-weight="950" fill="${color}">${main}</text>${wan}` : ""}
      ${tile.suit === "z" ? `<text x="32" y="54" text-anchor="middle" font-size="34" font-weight="950" fill="${color}">${main}</text>` : ""}
      ${tile.suit === "f" ? `<text x="32" y="52" text-anchor="middle" font-size="30" font-weight="950" fill="${color}">${main}</text><text x="32" y="70" text-anchor="middle" font-size="15" fill="${color}">${sub}</text>` : ""}
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function pipPattern(value) {
  const positions = {
    1: [[32, 43]], 2: [[23, 31], [41, 55]], 3: [[22, 29], [32, 43], [42, 57]],
    4: [[22, 30], [42, 30], [22, 56], [42, 56]], 5: [[22, 30], [42, 30], [32, 43], [22, 56], [42, 56]],
    6: [[22, 28], [42, 28], [22, 43], [42, 43], [22, 58], [42, 58]],
    7: [[22, 25], [42, 25], [32, 37], [22, 49], [42, 49], [22, 62], [42, 62]],
    8: [[22, 24], [42, 24], [22, 37], [42, 37], [22, 50], [42, 50], [22, 63], [42, 63]],
    9: [[22, 23], [42, 23], [22, 36], [42, 36], [32, 43], [22, 50], [42, 50], [22, 63], [42, 63]]
  };
  return positions[value].map(([x, y], index) => `<circle cx="${x}" cy="${y}" r="5.2" fill="${index % 3 === 1 ? "#bf2638" : "#1b1f26"}"/>`).join("");
}

function bambooPattern(value) {
  const xs = [21, 32, 43];
  const ys = [29, 45, 61];
  const total = Array.from({ length: value }, (_, i) => {
    const x = xs[i % 3];
    const y = ys[Math.floor(i / 3)];
    return `<text x="${x}" y="${y}" text-anchor="middle" font-size="18" font-weight="900" fill="#158057">♣</text>`;
  });
  return total.join("");
}

function tileImageSrc(tile, variant = "hand") {
  if (variant === "field-sideway") return fieldTileImageSrc(tile, 3);
  if (variant.startsWith("field-face-")) return fieldTileImageSrc(tile, Number(variant.slice("field-face-".length)) || 2);
  if (variant === "field") return fieldTileImageSrc(tile);
  if (tile.suit === "m") return `assets/card_src/manzu_all/p_ms${tile.value}_0.gif`;
  if (tile.suit === "p") return `assets/card_src/pinzu_all/p_ps${tile.value}_0.gif`;
  if (tile.suit === "s") return `assets/card_src/sozu_all/p_ss${tile.value}_0.gif`;
  if (tile.suit === "z") {
    const code = { 1: "e", 2: "s", 3: "w", 4: "n", 5: "no", 6: "h", 7: "c" }[tile.value];
    if (code === "no") return "assets/card_src/tupai_all/p_no_0.gif";
    return `assets/card_src/tupai_all/p_ji_${code}_0.gif`;
  }
  return tileSvgData(tile);
}

function fieldTileImageSrc(tile, face = 2) {
  if (tile.suit === "m") return `assets/card2_src/p_ms${tile.value}_${face}.gif`;
  if (tile.suit === "p") return `assets/card2_src/p_ps${tile.value}_${face}.gif`;
  if (tile.suit === "s") return `assets/card2_src/p_ss${tile.value}_${face}.gif`;
  if (tile.suit === "z") {
    const code = { 1: "e", 2: "s", 3: "w", 4: "n", 5: "no", 6: "h", 7: "c" }[tile.value];
    if (code === "no") return `assets/card2_src/p_no_${face}.gif`;
    if (code) return `assets/card2_src/p_ji_${code}_${face}.gif`;
  }
  return tileImageSrc(tile, "hand");
}

function tileImg(tile, small = false, extraClass = "", variant = "hand") {
  const src = tileImageSrc(tile, variant);
  const fallback = tileImageSrc(tile, "hand");
  const faceMatch = variant.match(/^field-face-(\d)$/);
  const fieldClass = variant === "field" || variant === "field-sideway" || faceMatch ? `field ${faceMatch ? `face-${faceMatch[1]}` : ""}` : "";
  const onerror = src !== fallback ? ` onerror="this.onerror=null;this.src='${fallback}'"` : "";
  return `<img class="tile-img ${small ? "small" : ""} ${fieldClass} ${extraClass}" src="${src}"${onerror} alt="${label(tile)}" title="${label(tile)}">`;
}

function meldFaceFor(playerIndex, isCalled) {
  const faces = [
    { own: 1, called: 4 },
    { own: 4, called: 2 },
    { own: 2, called: 3 },
    { own: 3, called: 1 }
  ][playerIndex];
  return isCalled ? faces.called : faces.own;
}

function render() {
  renderSeats();
  renderPlayerStatus();
  renderTableMelds();
  renderRiichiSticks();
  renderWalls();
  renderRivers();
  renderCenter();
  renderHand();
  renderCallPanel();
  renderDebugPanel();
  renderPresets();
  renderControls();
  renderAnalysis();
  renderYakuLab();
  renderLog();
}

function renderSeats() {
  players.forEach((player, index) => {
    el.seats[index].className = `seat seat-${["bottom", "left", "top", "right"][index]} ${player.img} ${index === state.turn ? "active" : ""}`;
    el.seats[index].innerHTML = `
      <div class="portrait"></div>
    `;
  });
}

function renderRiichiSticks() {
  const seats = ["bottom", "left", "top", "right"];
  el.riichiSticks.innerHTML = players.map((player, index) => {
    if (!state.riichi[index]) return "";
    const stick = index % 2 ? "b_1_1.gif" : "b_1_2.gif";
    return `<img class="riichi-stick riichi-${seats[index]}" src="assets/card_src/ms_all/${stick}" alt="リーチ棒" title="${player.name} リーチ">`;
  }).join("");
}

function renderPlayerStatus() {
  el.playerStatus.innerHTML = players.map((player, index) => `
    <article class="status-card ${player.img} ${index === state.turn ? "active" : ""}">
      <div class="portrait"></div>
      <div>
        <p class="status-name">${player.wind} ${player.name}</p>
        <p class="status-meta">${player.score.toLocaleString()}点 / 手牌${state.hands[index].length} / 副露${state.melds[index].length} / 花${state.flowers[index].length}</p>
        <p class="status-quote">${player.quote}</p>
      </div>
    </article>
  `).join("");
}

function renderTableMelds() {
  state.melds.forEach((melds, playerIndex) => {
    el.tableMelds[playerIndex].innerHTML = melds.map((meld, meldIndex) => `
      <div class="meld-set meld-${meldIndex + 1} ${meld.type === "暗カン" ? "closed-kan" : ""}">
        ${meld.tiles.map((tile) => {
          const isCalled = tile.id === meld.calledTileId;
          const face = meldFaceFor(playerIndex, isCalled);
          return tileImg(tile, true, "", `field-face-${face}`);
        }).join("")}
      </div>
    `).join("");
  });
}

function renderWalls() {
  const count = Math.max(0, Math.min(14, Math.ceil(state.wall.length / 4)));
  const wallHtml = Array.from({ length: count }, () => `<img class="wall-tile" src="assets/card_src/ms_all/p_bk_0.gif" alt="">`).join("");
  [el.wallTop, el.wallRight, el.wallBottom, el.wallLeft].forEach((wall) => { wall.innerHTML = wallHtml; });
}

function renderRivers() {
  state.rivers.forEach((river, index) => {
    el.rivers[index].innerHTML = river.map((tile) => {
      const winning = state.pendingWin?.tile?.id === tile.id ? "winning" : "";
      const riichi = tile.riichiDiscard ? "riichi-discard" : "";
      return tileImg(tile, true, `river-tile ${riichi} ${winning}`, tile.riichiDiscard ? "field-sideway" : "field");
    }).join("");
  });
}

function renderCenter() {
  const rule = presets.find((preset) => preset.id === state.presetId);
  el.roundName.textContent = roundNames[state.roundIndex % roundNames.length];
  el.wallCount.textContent = `山 ${state.wall.length}`;
  el.ruleName.textContent = rule ? rule.name : "カスタム";
  el.doraTiles.innerHTML = state.dora.map((tile) => tileImg(tile, true)).join("");
}

function renderHand() {
  el.flowers.innerHTML = state.flowers[0].length ? state.flowers[0].map((tile) => tileImg(tile, true)).join("") : `<span class="label">なし</span>`;
  el.hand.innerHTML = sortTiles(state.hands[0]).map((tile) => `
    <button class="tilebutton ${tile.id === state.drawnTileId ? "drawn" : ""} ${state.pendingWin?.tile?.id === tile.id ? "winning" : ""} ${state.selectedDebugSeat === 0 && state.selectedDebugTile === tile.id ? "selected-debug" : ""}" data-discard="${tile.id}" data-debug-tile="${tile.id}" title="${label(tile)}を捨てる">
      ${tileImg(tile, false, state.pendingWin?.tile?.id === tile.id ? "winning" : "")}
    </button>
  `).join("");
}

function renderCallPanel() {
  renderScoreOverlay();
  const canTsumo = state.pendingWin && state.pendingWin.player === 0;
  const canReach = state.turn === 0 && state.phase === "discard" && canRiichi(0);
  if (!state.pendingCall && !state.pendingKan && !canTsumo && !canReach) {
    el.callPanel.hidden = true;
    el.callPanel.innerHTML = "";
    return;
  }
  el.callPanel.hidden = false;
  const parts = [];
  if (canTsumo) {
    parts.push(`<button class="win-button" data-win="complete">和了</button>`);
    parts.push(`<button data-win="skip">見逃し</button>`);
  }
  if (canReach) {
    parts.push(`<button data-reach="1">リーチ</button>`);
  }
  if (state.pendingKan) {
    parts.push(`<strong>暗カンできます</strong>`);
    parts.push(...state.pendingKan.options.map((option, index) => `
      <button class="call-choice" data-kan="${index}">
        <span>${option.type}</span>
        <span class="call-tiles">${option.tiles.map((tile) => tileImg(tile, true)).join("")}</span>
      </button>
    `));
    parts.push(`<button data-kan="skip">スキップ</button>`);
  }
  if (state.pendingCall) {
    parts.push(`<strong>${label(state.pendingCall.tile)}を鳴けます</strong>`);
    parts.push(...state.pendingCall.options.map((option, index) => `
      <button class="call-choice" data-call="${index}">
        <span>${option.type}</span>
        <span class="call-tiles">${option.tiles.map((tile) => tileImg(tile, true)).join("")}</span>
      </button>
    `));
    parts.push(`<button data-call="skip">スキップ</button>`);
  }
  el.callPanel.innerHTML = parts.join("");
}

function renderScoreOverlay() {
  if (!el.scoreOverlay) return;
  if (!state.scoreResult) {
    el.scoreOverlay.hidden = true;
    el.scoreOverlay.innerHTML = "";
    return;
  }
  el.scoreOverlay.hidden = false;
  el.scoreOverlay.innerHTML = cleanScorePanelHtml(state.scoreResult);
}

function cleanScorePanelHtml(result) {
  const isDraw = result.type === "流局" || result.winner === undefined || result.winner === null;
  const movementRows = result.movements.map((delta, index) => `
    <div class="score-move ${delta >= 0 ? "plus" : "minus"}">
      <span>${players[index].name}</span>
      <strong>${delta >= 0 ? "+" : ""}${delta.toLocaleString()}点</strong>
    </div>
  `).join("");
  const yakuRows = result.yaku?.length
    ? result.yaku.map((item) => {
      const unit = result.hybrid && isChinaPointYaku(item) ? "点" : "翻";
      return `<span class="score-tag">${item.name} ${item.point}${unit}</span>`;
    }).join("")
    : `<span class="score-tag">${isDraw ? "流局" : "役なし"}</span>`;
  const doraRows = scoreDoraHtml(result);
  const agariShape = agariShapeHtml(result);
  const title = isDraw ? "流局 点数計算" : `${players[result.winner].name} ${result.type} 和了`;
  const firstLabel = result.hybrid ? "混合点" : "符";
  const firstValue = result.hybrid ? `${result.hybrid.totalPoint}点` : `${result.fu || "-"}${result.fu ? "符" : ""}`;
  const hanValue = result.hybrid ? `${result.hybrid.riichiHan || 0}翻` : `${result.han || "-"}${result.han ? "翻" : ""}`;
  return `
    <section class="score-panel">
      <div class="score-head">
        <strong>${title}</strong>
        <span>${roundNames[state.roundIndex % roundNames.length]}</span>
      </div>
      <div class="score-breakdown">
        <div><span>${firstLabel}</span><strong>${firstValue}</strong></div>
        <div><span>翻</span><strong>${hanValue}</strong></div>
        <div><span>区分</span><strong>${result.limitName || (isDraw ? "流局" : "通常")}</strong></div>
        <div><span>本場</span><strong>${result.honba}本場</strong></div>
        <div><span>供託</span><strong>${result.riichiPot}本</strong></div>
      </div>
      ${result.hybrid ? `<div class="score-tags">
        <span class="score-tag">日本翻 ${result.hybrid.riichiHan}翻 = ${result.hybrid.riichiPoint}点</span>
        <span class="score-tag">中国追加 ${result.hybrid.chinaPoint}点</span>
        <span class="score-tag">最低和了 ${result.hybrid.minWinPoint}点</span>
      </div>` : ""}
      <div class="score-tags">${yakuRows}</div>
      ${doraRows}
      <div class="score-lines">${result.rows.map((row) => `<p>${row}</p>`).join("")}</div>
      <div class="score-moves">${movementRows}</div>
      ${agariShape}
      <button class="primary" data-score-confirm="1">点数を確定して次局へ</button>
    </section>
  `;
}

function scorePanelHtml(result) {
  const movementRows = result.movements.map((delta, index) => `
    <div class="score-move ${delta >= 0 ? "plus" : "minus"}">
      <span>${players[index].name}</span>
      <strong>${delta >= 0 ? "+" : ""}${delta.toLocaleString()}点</strong>
    </div>
  `).join("");
  const yakuRows = result.yaku?.length ? result.yaku.map((item) => `<span class="score-tag">${item.name} ${item.point}翻</span>`).join("") : `<span class="score-tag">流局</span>`;
  const doraRows = scoreDoraHtml(result);
  const agariShape = agariShapeHtml(result);
  return `
    <section class="score-panel">
      <div class="score-head">
        <strong>${result.type === "流局" ? "流局 点数計算" : `${players[result.winner].name} ${result.type} 和了`}</strong>
        <span>${roundNames[state.roundIndex % roundNames.length]}</span>
      </div>
      <div class="score-breakdown">
        <div><span>符</span><strong>${result.fu || "-"}${result.fu ? "符" : ""}</strong></div>
        <div><span>翻</span><strong>${result.han || "-"}${result.han ? "翻" : ""}</strong></div>
        <div><span>区分</span><strong>${result.limitName || "流局"}</strong></div>
        <div><span>本場</span><strong>${result.honba}本場</strong></div>
        <div><span>供託</span><strong>${result.riichiPot}本</strong></div>
      </div>
      <div class="score-tags">${yakuRows}</div>
      ${doraRows}
      <div class="score-lines">${result.rows.map((row) => `<p>${row}</p>`).join("")}</div>
      <div class="score-moves">${movementRows}</div>
      ${agariShape}
      <button class="primary" data-score-confirm="1">点数を確定して次局へ</button>
    </section>
  `;
}

function scoreDoraHtml(result) {
  const breakdown = result.doraBreakdown;
  if (!breakdown) return "";
  const indicatorTiles = (tiles) => tiles.length
    ? tiles.map((tile) => tileImg(tile, true)).join("")
    : `<span class="score-dora-empty">なし</span>`;
  const kanDoraCount = Math.max(0, breakdown.visibleIndicators.length - 1);
  const kanUraCount = Math.max(0, breakdown.uraIndicators.length - 1);
  return `
    <div class="score-dora">
      <div class="score-dora-head">ドラ表示</div>
      <div class="score-dora-row">
        <span>ドラ＋カンドラ <small>通常1＋槓${kanDoraCount}</small></span>
        <div class="score-dora-tiles">${indicatorTiles(breakdown.visibleIndicators)}</div>
        <strong>${breakdown.doraHan}翻</strong>
      </div>
      <div class="score-dora-row">
        <span>裏ドラ＋カン裏ドラ <small>${breakdown.riichi ? `通常1＋槓${kanUraCount}` : "リーチなし"}</small></span>
        <div class="score-dora-tiles">${breakdown.riichi ? indicatorTiles(breakdown.uraIndicators) : `<span class="score-dora-empty">非公開</span>`}</div>
        <strong>${breakdown.uraDoraHan}翻</strong>
      </div>
    </div>
  `;
}

function agariShapeHtml(result) {
  if (!result.agariShape) return "";
  const shape = result.agariShape;
  const concealed = sortTiles(shape.concealed).map((tile) => tileImg(tile, true, tile.highlight ? "agari-highlight" : "", "field-face-1")).join("");
  const melds = shape.melds.map((meld) => `
    <span class="agari-meld" title="${meld.type}">
      ${meld.tiles.map((tile) => tileImg(tile, true, tile.called ? "called" : "", `field-face-${tile.called ? 4 : 1}`)).join("")}
    </span>
  `).join("");
  const ronTile = shape.ronTile ? `<span class="agari-ron">${tileImg(shape.ronTile, true, "agari-highlight", "field-face-4")}</span>` : "";
  return `
    <div class="agari-shape">
      <div class="agari-shape-head">アガリ形</div>
      <div class="agari-shape-row">
        <span class="agari-concealed">${concealed}</span>
        ${melds}
        ${ronTile}
      </div>
    </div>
  `;
}

function debugHandPanelsHtml() {
  return `
    <div class="debug-hand-grid">
      ${players.map((player, playerIndex) => `
        <section class="debug-hand-card ${state.turn === playerIndex ? "active-turn" : ""}">
          <div class="debug-hand-head">
            <strong>${player.wind} ${player.name}</strong>
            <span>${state.hands[playerIndex].length}枚 / 副露${state.melds[playerIndex].length}</span>
          </div>
          <div class="debug-hand-tiles">
            ${sortTiles(state.hands[playerIndex]).map((tile) => `
              <button class="debug-hand-tile ${state.selectedDebugSeat === playerIndex && state.selectedDebugTile === tile.id ? "selected-debug" : ""}" data-debug-hand-seat="${playerIndex}" data-debug-tile="${tile.id}" title="${player.name} ${label(tile)}">
                ${tileImg(tile, true)}
              </button>
            `).join("")}
          </div>
        </section>
      `).join("")}
    </div>
  `;
}

function renderDebugPanel() {
  const panel = document.getElementById("debugPanel");
  if (!panel) return;
  if (!state.debug) {
    panel.hidden = true;
    panel.innerHTML = "";
    return;
  }
  panel.hidden = false;
  const palette = allPrototypeTiles();
  const selectedTile = debugTileFromKey(state.debugTileKey);
  const selectedSeat = players[state.debugSeat];
  const selectedHandSeat = state.selectedDebugSeat === null ? null : players[state.selectedDebugSeat];
  panel.innerHTML = `
    <div class="debug-head">
      <strong>デバッグ</strong>
      <span>${state.debugMode === "view" ? "河・リーチ棒の表示確認" : state.selectedDebugTile && selectedHandSeat ? `${selectedHandSeat.name}の牌を置換できます` : "全員の手牌を観察できます"}</span>
    </div>
    <div class="debug-tabs">
      <button class="${state.debugMode === "view" ? "active" : ""}" data-debug-mode="view">表示確認</button>
      <button class="${state.debugMode === "hand" ? "active" : ""}" data-debug-mode="hand">手牌編集</button>
    </div>
    ${state.debugMode === "view" ? `
      <div class="debug-view-grid">
        <div>
          <span class="label">対象</span>
          <div class="debug-seat-buttons">
            ${players.map((player, index) => `<button class="${state.debugSeat === index ? "active" : ""}" data-debug-seat="${index}">${player.wind} ${player.name}</button>`).join("")}
          </div>
        </div>
        <div>
          <span class="label">選択牌</span>
          <div class="debug-selected-tile">${tileImg(selectedTile, true, "", "field")}</div>
        </div>
        <div>
          <span class="label">操作</span>
          <div class="debug-actions">
            <button data-debug-river="normal">捨て牌を置く</button>
            <button data-debug-river="riichi">リーチ表示牌を置く</button>
            <button data-debug-riichi="toggle">${state.riichi[state.debugSeat] ? "リーチ棒を消す" : "リーチ棒を置く"}</button>
            <button data-debug-scenario="chankan">槍槓テスト</button>
            <button data-debug-river="clear">河をクリア</button>
          </div>
        </div>
      </div>
      <div class="debug-scenario-section">
        <span class="label">特殊和了の状況再現</span>
        <div class="debug-scenario-buttons">
          ${Object.entries(debugAgariScenarios).map(([id, scenario]) => `<button data-debug-agari-scenario="${id}">${scenario.label}</button>`).join("")}
        </div>
      </div>
      <div class="debug-scenario-section">
        <span class="label">CPU中国特殊形の打牌から終局まで観戦</span>
        <div class="debug-scenario-buttons">
          ${Object.entries(debugCpuSpecialScenarios).map(([id, scenario]) => `<button data-debug-cpu-special-scenario="${id}">${scenario.label}</button>`).join("")}
        </div>
      </div>
      <div class="debug-palette">
        ${palette.map((tile) => {
          const key = `${tile.suit}${tile.value}`;
          return `<button class="${state.debugTileKey === key ? "active" : ""}" data-debug-view-tile="${key}" title="${label(tile)}">${tileImg(tile, true, "", "field")}</button>`;
        }).join("")}
      </div>
      <p class="debug-note">${selectedSeat.wind} ${selectedSeat.name} / 河 ${state.rivers[state.debugSeat].length}枚 / リーチ棒 ${state.riichi[state.debugSeat] ? "表示中" : "なし"}</p>
    ` : `
      ${debugHandPanelsHtml()}
      <div class="debug-palette">
        ${palette.map((tile) => `<button data-debug-set="${tile.suit}${tile.value}" title="${label(tile)}">${tileImg(tile, true)}</button>`).join("")}
      </div>
      <p class="debug-note">${state.selectedDebugTile && selectedHandSeat ? `${selectedHandSeat.wind} ${selectedHandSeat.name}の選択牌を置換します。` : "牌を選ぶと、下のパレットで任意の牌に置換できます。"}</p>
    `}
  `;
}

function renderControls() {
  el.flowersToggle.checked = state.settings.flowers;
  el.whiteStormToggle.checked = state.settings.whiteStorm;
  el.cosmicToggle.checked = state.settings.cosmic;
  el.chinaToggle.checked = state.settings.china;
  el.whiteCountInput.value = state.settings.whiteCount;
  el.tsumoBtn.disabled = state.hands[0].length % 3 !== 2 || state.phase === "call";
  el.autoPlayBtn.classList.toggle("active", state.autoPlay);
  el.autoPlayBtn.textContent = state.autoPlay ? "オート停止" : "オート進行";
  el.debugBtn.classList.toggle("active", state.debug);
  el.turnStatus.textContent = statusText();
}

function statusText() {
  const auto = state.autoPlay ? " / オート観戦中" : "";
  if (state.phase === "call") return "鳴き選択中";
  if (state.phase === "kan") return "暗カン選択中";
  if (state.pendingWin?.player === 0) return `${state.pendingWin.type}できます`;
  if (state.phase === "ended") return "流局";
  if (state.turn === 0 && state.phase === "discard") return `捨て牌を選択してください${auto}`;
  return `${players[state.turn].name} 思考中`;
}

function renderPresets() {
  el.presets.innerHTML = presets.map((preset) => `
    <button class="${preset.id === state.presetId ? "active" : ""}" data-preset="${preset.id}">
      ${preset.name}<br><span class="label">${preset.description}</span>
    </button>
  `).join("");
}

function renderAnalysis() {
  const baseHand = state.hands[0];
  const hand = analysisTilesForPlayer(0);
  const waits = winningTilesFor(0);
  const yaku = hand.length % 3 === 2 ? yakuList(hand, state.settings, state.flowers[0]) : [];
  const total = yaku.reduce((sum, item) => sum + Math.max(0, item.point), 0);
  const counts = countMap([...hand, ...state.melds[0].flatMap((meld) => meld.tiles)]);
  const white = counts.z5 || 0;
  const possible = hand.length % 3 === 2 && isWinningHandWithTiles(0, hand);
  const waitText = waits.length ? waits.map(label).join(" / ") : "なし";
  el.analysis.innerHTML = `
    <div class="analysis-card">
      <strong>${possible ? "和了形候補あり" : "手牌解析"}</strong>
      <p>手牌${baseHand.length}枚、解析${hand.length}枚、副露${state.melds[0].length}、白${white}枚、花${state.flowers[0].length}枚、推定${total}pt、待ち${waitText}。</p>
      <div class="tagrow">
        <span class="tag">${state.settings.cosmic ? "宇宙順子ON" : "通常順子"}</span>
        <span class="tag">${state.settings.china ? "中国役ON" : "日本役中心"}</span>
        <span class="tag">白${state.settings.whiteCount}枚山</span>
      </div>
    </div>
    ${yaku.length ? yaku.map((item) => `
      <div class="analysis-card"><strong>${item.name} / ${item.point}pt</strong><p>${item.note}</p></div>
    `).join("") : `
      <div class="analysis-card"><strong>役プラグイン待機中</strong><p>14枚または副露後の打牌待ちで、通常形、七対子、国士、白色地平線、中国役ミックスを判定します。宇宙順子ONでは順子の定義を広げて通常役へ反映します。</p></div>
    `}
  `;
}

function tileCode(tile) {
  if (!tile) return null;
  return `${tile.suit}${tile.value}`;
}

function yakuSummaryForTiles(playerIndex, tiles) {
  const yaku = yakuList(tiles, state.settings, state.flowers[playerIndex], playerIndex);
  return {
    winningShape: isWinningHandWithTiles(playerIndex, tiles),
    yaku: yaku.map((item) => ({ id: item.id || item.name, name: item.name, han: item.point, note: item.note })),
    han: yaku.reduce((sum, item) => sum + Math.max(0, Math.min(item.point, 13)), 0)
  };
}

function agariSnapshot(playerIndex = 0) {
  const hand = sortTiles(state.hands[playerIndex]);
  const pendingWinTile = state.pendingWin?.player === playerIndex ? state.pendingWin.tile : null;
  const analysisHand = pendingWinTile && !hand.some((tile) => tile.id === pendingWinTile.id)
    ? sortTiles([...hand, pendingWinTile])
    : hand;
  const waits = winningTilesFor(playerIndex);
  const yaku = analysisHand.length % 3 === 2
    ? yakuList(analysisHand, state.settings, state.flowers[playerIndex], playerIndex, { win: state.pendingWin })
    : [];
  const waitResults = waits.map((tile) => ({
    tile: tileCode(tile),
    ...yakuSummaryForTiles(playerIndex, sortTiles([...hand, tile]))
  }));
  const possible = analysisHand.length % 3 === 2 && isWinningHandWithTiles(playerIndex, analysisHand);
  return {
    format: "mizuhara-mahjong-agari-v1",
    player: players[playerIndex].name,
    round: roundNames[state.roundIndex % roundNames.length],
    honba: matchState.honba,
    riichiPot: matchState.riichiPot,
    ruleSet: {
      presetId: state.presetId,
      flowers: state.settings.flowers,
      whiteStorm: state.settings.whiteStorm,
      cosmic: state.settings.cosmic,
      china: state.settings.china,
      whiteCount: state.settings.whiteCount
    },
    hand: hand.map(tileCode),
    drawnTile: state.drawnTileId ? tileCode(state.hands[playerIndex].find((tile) => tile.id === state.drawnTileId) || hand[hand.length - 1]) : null,
    winningTile: pendingWinTile ? tileCode(pendingWinTile) : null,
    chankan: !!state.pendingWin?.chankan,
    rinshan: !!state.pendingWin?.rinshan,
    haitei: !!(state.pendingWin && isTsumoWin(state.pendingWin) && state.wall.length === 0 && !state.pendingWin.rinshan),
    houtei: !!state.pendingWin?.tile?.houteiDiscard,
    doubleRiichi: !!state.doubleRiichi[playerIndex],
    firstTurn: totalDiscards() === 0 && !state.callMade,
    waits: waits.map(tileCode),
    waitResults,
    melds: state.melds[playerIndex].map((meld) => ({
      type: meld.type,
      from: meld.from,
      fromName: meld.from === playerIndex ? "self" : players[meld.from]?.name,
      calledTile: meld.calledTileId ? tileCode(meld.tiles.find((tile) => tile.id === meld.calledTileId)) : null,
      tiles: meld.tiles.map(tileCode)
    })),
    dora: state.dora.map(tileCode),
    uraDora: state.riichi[playerIndex] ? (state.uraDora || []).map(tileCode) : [],
    flowers: state.flowers[playerIndex].map(tileCode),
    riichi: state.riichi[playerIndex],
    riichiIppatsu: state.riichiIppatsu[playerIndex],
    result: {
      winningShape: possible,
      yaku: yaku.map((item) => ({ id: item.id || item.name, name: item.name, han: item.point, note: item.note })),
      han: yaku.reduce((sum, item) => sum + Math.max(0, Math.min(item.point, 13)), 0)
    },
    expected: {
      yaku: []
    }
  };
}

function renderYakuLab() {
  if (!el.agariData || !el.labResult) return;
  const snapshot = agariSnapshot(0);
  const waitText = snapshot.waits?.length ? `待ち: ${snapshot.waits.join(" / ")}` : "";
  const waitYakuText = snapshot.waitResults?.length
    ? snapshot.waitResults.map((item) => {
      const names = item.yaku.length ? item.yaku.map((yaku) => yaku.name).join("+") : "役なし";
      return `${item.tile}: ${names} ${item.han}翻`;
    }).join(" / ")
    : "";
  const yakuText = snapshot.result.yaku.length
    ? snapshot.result.yaku.map((item) => `${item.name} ${item.han}翻`).join(" / ")
    : waitYakuText || waitText || "役なし、または14枚待ち";
  el.labResult.innerHTML = `
    <div class="lab-summary">
      <strong>${snapshot.result.winningShape ? "和了形候補あり" : snapshot.waits?.length ? "聴牌候補あり" : "検証中"}</strong>
      <span>${yakuText}</span>
    </div>
    ${yakuCatalogHtml()}
  `;
  el.agariData.value = JSON.stringify(snapshot, null, 2);
}

function yakuCatalogHtml() {
  const implemented = riichiYakuCatalog.filter((item) => item.status === "implemented").length;
  return `
    <div class="yaku-catalog">
      <div class="catalog-head">
        <strong>日本リーチ麻雀 役リスト</strong>
        <span>実装 ${implemented}/${riichiYakuCatalog.length}</span>
      </div>
      <div class="catalog-grid">
        ${riichiYakuCatalog.map((item) => `
          <span class="catalog-yaku ${item.status}">
            <b>${item.name}</b>
            <small>${item.han}翻 / ${item.status === "implemented" ? "実装済み" : "未実装"}</small>
          </span>
        `).join("")}
      </div>
    </div>
    ${chineseFanCatalogHtml()}
  `;
}

function chineseFanToRiichiTier(fan) {
  if (fan >= 88) return "13翻 / 役満";
  if (fan >= 64) return "11翻 / 三倍満";
  if (fan >= 48) return "8翻 / 倍満";
  if (fan >= 32) return "6翻 / 跳満";
  if (fan >= 24) return "5翻 / 満貫";
  if (fan >= 16) return "4翻";
  if (fan >= 8) return "3翻";
  if (fan >= 4) return "2翻";
  return "1翻";
}

function chineseFanCatalogHtml() {
  const groups = [...new Set(chineseFanCatalog.map((item) => item.fan))].sort((a, b) => b - a);
  const mapRows = groups.map((fan) => `${fan}点→${chineseFanToRiichiTier(fan)}`).join(" / ");
  const implementedCount = chineseFanCatalog.filter((item) => implementedChineseFanIds.has(item.id)).length;
  const excludedCount = chineseFanCatalog.filter((item) => excludedChineseFanIds.has(item.id)).length;
  const plannedCount = chineseFanCatalog.length - implementedCount - excludedCount;
  return `
    <div class="yaku-catalog mcr-catalog">
      <div class="catalog-head">
        <strong>中国麻将 MCR 81番種</strong>
        <span>実装 ${implementedCount} / 日本役優先 ${excludedCount} / 未実装 ${plannedCount}</span>
      </div>
      <p class="catalog-note catalog-progress-legend"><span class="implemented">実装済み</span><span class="planned">未実装</span><span class="excluded">日本役優先</span></p>
      <p class="catalog-note">点数はMCRの番、右側は水原麻雀で日本式点数へ混ぜるための暫定写像です。</p>
      <p class="catalog-note">${mapRows}</p>
      <div class="catalog-grid mcr-grid">
        ${chineseFanCatalog.map((item) => {
          const status = excludedChineseFanIds.has(item.id) ? "excluded" : implementedChineseFanIds.has(item.id) ? "implemented" : "planned";
          const statusLabel = status === "excluded" ? "日本役優先 / 中国追加点なし" : status === "implemented" ? "実装済み" : "未実装";
          return `
          <span class="catalog-yaku mcr-fan fan-${item.fan} ${status}">
            <b>${item.name}</b>
            <small>${item.fan}点 / ${chineseFanToRiichiTier(item.fan)}</small>
            <small class="catalog-status">${statusLabel}</small>
            <small>${item.english}</small>
          </span>
        `; }).join("")}
      </div>
    </div>
  `;
}

function renderLog() {
  el.log.innerHTML = state.log.map((message) => `<div class="log-entry">${message}</div>`).join("");
}

function checkWin() {
  const hand = state.hands[0];
  const win = { type: "ツモ", player: 0, tile: state.hands[0].find((tile) => tile.id === state.drawnTileId) };
  if (canWinNow(0, win)) {
    completeWin(win);
  } else {
    const possible = isWinningHandWithTiles(0, hand);
    addLog(possible ? "和了形ですが、役がないため和了できません。" : "まだ和了形ではありません。捨て牌選択で続行してください。");
    render();
  }
}

function applySettingsPatch(patch) {
  const next = { ...state.settings, ...patch };
  if (patch.whiteStorm === true && patch.whiteCount === undefined && next.whiteCount < 12) next.whiteCount = 12;
  if (patch.whiteStorm === false && patch.whiteCount === undefined) next.whiteCount = 4;
  startRound(next, "custom");
}

el.hand.addEventListener("click", (event) => {
  if (state.debug && state.debugMode === "hand") {
    const debugButton = event.target.closest("[data-debug-tile]");
    if (debugButton) {
      state.selectedDebugSeat = 0;
      state.selectedDebugTile = debugButton.dataset.debugTile;
      render();
    }
    return;
  }
  const button = event.target.closest("[data-discard]");
  if (button) discardHuman(button.dataset.discard);
});

el.callPanel.addEventListener("click", (event) => {
  const winButton = event.target.closest("[data-win]");
  if (winButton && state.pendingWin) {
    if (winButton.dataset.win === "skip") skipPendingWin();
    else completeWin(state.pendingWin);
    return;
  }
  const reachButton = event.target.closest("[data-reach]");
  if (reachButton) {
    declareRiichi(0);
    return;
  }
  const kanButton = event.target.closest("[data-kan]");
  if (kanButton) {
    if (kanButton.dataset.kan === "skip") {
      state.pendingKan = null;
      if (state.riichi[0]) discardDrawnAfterRiichi();
      else {
        state.phase = "discard";
        render();
      }
    } else {
      chooseHumanKan(kanButton.dataset.kan);
    }
    return;
  }
  const button = event.target.closest("[data-call]");
  if (!button) return;
  if (button.dataset.call === "skip") skipHumanCall();
  else chooseHumanCall(button.dataset.call);
});

el.scoreOverlay?.addEventListener("click", (event) => {
  const scoreButton = event.target.closest("[data-score-confirm]");
  if (scoreButton) confirmScore();
});

document.getElementById("debugPanel").addEventListener("click", (event) => {
  const modeButton = event.target.closest("[data-debug-mode]");
  if (modeButton) {
    state.debugMode = modeButton.dataset.debugMode;
    state.selectedDebugSeat = null;
    state.selectedDebugTile = null;
    render();
    return;
  }
  const handTileButton = event.target.closest("[data-debug-hand-seat][data-debug-tile]");
  if (handTileButton) {
    state.selectedDebugSeat = Number(handTileButton.dataset.debugHandSeat);
    state.selectedDebugTile = handTileButton.dataset.debugTile;
    render();
    return;
  }
  const seatButton = event.target.closest("[data-debug-seat]");
  if (seatButton) {
    state.debugSeat = Number(seatButton.dataset.debugSeat);
    renderDebugPanel();
    return;
  }
  const viewTileButton = event.target.closest("[data-debug-view-tile]");
  if (viewTileButton) {
    state.debugTileKey = viewTileButton.dataset.debugViewTile;
    renderDebugPanel();
    return;
  }
  const riverButton = event.target.closest("[data-debug-river]");
  if (riverButton) {
    if (riverButton.dataset.debugRiver === "clear") clearDebugRiver();
    else addDebugRiverTile(riverButton.dataset.debugRiver === "riichi");
    return;
  }
  const riichiButton = event.target.closest("[data-debug-riichi]");
  if (riichiButton) {
    toggleDebugRiichiStick();
    return;
  }
  const scenarioButton = event.target.closest("[data-debug-scenario]");
  if (scenarioButton) {
    if (scenarioButton.dataset.debugScenario === "chankan") setupChankanScenario();
    return;
  }
  const agariScenarioButton = event.target.closest("[data-debug-agari-scenario]");
  if (agariScenarioButton) {
    setupAgariDebugScenario(agariScenarioButton.dataset.debugAgariScenario);
    return;
  }
  const cpuSpecialScenarioButton = event.target.closest("[data-debug-cpu-special-scenario]");
  if (cpuSpecialScenarioButton) {
    setupCpuSpecialDebugScenario(cpuSpecialScenarioButton.dataset.debugCpuSpecialScenario);
    return;
  }
  const button = event.target.closest("[data-debug-set]");
  if (!button || !state.selectedDebugTile) return;
  const suit = button.dataset.debugSet[0];
  const value = Number(button.dataset.debugSet.slice(1));
  const targetSeat = state.selectedDebugSeat ?? 0;
  const index = state.hands[targetSeat].findIndex((tile) => tile.id === state.selectedDebugTile);
  if (index >= 0) {
    state.hands[targetSeat][index] = makeTile(suit, value, Date.now() + targetSeat * 100 + index);
    const replaced = state.hands[targetSeat][index];
    const targetName = players[targetSeat].name;
    state.selectedDebugSeat = null;
    state.selectedDebugTile = null;
    state.pendingWin = null;
    addLog(`デバッグ: ${targetName}の手牌を${label(replaced)}に変更しました。`);
    render();
  }
});

el.presets.addEventListener("click", (event) => {
  const button = event.target.closest("[data-preset]");
  if (!button) return;
  const preset = presets.find((item) => item.id === button.dataset.preset);
  startRound(preset.settings, preset.id);
});

el.tsumoBtn.addEventListener("click", checkWin);
el.autoPlayBtn.addEventListener("click", () => {
  state.autoPlay = !state.autoPlay;
  addLog(state.autoPlay ? "オート進行を開始しました。水原一彌も自動で打牌します。" : "オート進行を停止しました。");
  render();
  if (state.autoPlay) {
    if (state.turn === 0 || state.pendingCall || state.pendingWin || state.pendingKan) scheduleHumanAuto(180);
    else scheduleAutoAdvance(180);
  } else {
    clearTimeout(autoTimer);
    resumeCpuTurnAfterAutoStop();
  }
});
el.debugBtn.addEventListener("click", () => {
  state.debug = !state.debug;
  state.selectedDebugSeat = null;
  state.selectedDebugTile = null;
  render();
});
el.refreshLabBtn.addEventListener("click", renderYakuLab);
el.copyAgariBtn.addEventListener("click", async () => {
  renderYakuLab();
  el.agariData.focus();
  el.agariData.select();
  try {
    await navigator.clipboard.writeText(el.agariData.value);
    addLog("アガリデータをクリップボードへコピーしました。");
  } catch {
    addLog("コピー権限がないため、アガリデータ欄を選択しました。");
  }
  renderLog();
});
el.newRoundBtn.addEventListener("click", () => startRound(state.settings, state.presetId));
el.flowersToggle.addEventListener("change", (event) => applySettingsPatch({ flowers: event.target.checked }));
el.whiteStormToggle.addEventListener("change", (event) => applySettingsPatch({ whiteStorm: event.target.checked }));
el.cosmicToggle.addEventListener("change", (event) => applySettingsPatch({ cosmic: event.target.checked }));
el.chinaToggle.addEventListener("change", (event) => applySettingsPatch({ china: event.target.checked }));
function commitWhiteCountInput(event) {
  const whiteCount = Math.max(4, Math.min(24, Number(event.target.value) || 4));
  if (whiteCount === state.settings.whiteCount) return;
  applySettingsPatch({ whiteCount, whiteStorm: whiteCount > 4 });
}
el.whiteCountInput.addEventListener("change", commitWhiteCountInput);
el.whiteCountInput.addEventListener("blur", commitWhiteCountInput);

function updateTableScale() {
  if (!el.tableViewport) return;
  const size = Math.max(1, el.tableViewport.getBoundingClientRect().width);
  el.tableViewport.style.setProperty("--table-scale", String(size / 800));
}

if (el.tableViewport && "ResizeObserver" in window) {
  new ResizeObserver(updateTableScale).observe(el.tableViewport);
}
window.addEventListener("resize", updateTableScale);
updateTableScale();

function debugDoraRules() {
  const previous = {
    settings: state.settings,
    melds: state.melds[0],
    dora: state.dora,
    uraDora: state.uraDora,
    deadWall: state.deadWall,
    riichi: state.riichi[0],
    discardCounts: state.discardCounts,
    wall: state.wall,
    hand: state.hands[0],
    drawnTileId: state.drawnTileId
  };
  try {
    const generated = makeWallState(presets[0].settings);
    const generatedSlots = {
      live: generated.liveWall.length,
      dead: generated.deadWall.tiles.length,
      rinshan: generated.deadWall.rinshan.length,
      dora: generated.deadWall.doraIndicators.length,
      ura: generated.deadWall.uraIndicators.length
    };
    state.settings = { ...presets[0].settings };
    state.melds[0] = [];
    state.deadWall = generated.deadWall;
    state.dora = [makeTile("m", 2, 910001), makeTile("m", 2, 910002)];
    state.uraDora = [makeTile("p", 2, 910003)];
    state.riichi[0] = true;
    state.discardCounts = [1, 0, 0, 0];
    const tiles = ["m1", "m2", "m3", "p1", "p2", "p3", "s1", "s2", "s3", "m4", "m5", "m6", "z1", "z1"]
      .map((code, index) => makeTile(code[0], Number(code.slice(1)), 911000 + index));
    const win = { type: "ツモ", player: 0, tile: tiles[tiles.length - 1] };
    const yaku = yakuList(tiles, state.settings, [], 0, { win });
    const breakdown = doraBreakdownForTiles(0, tiles);
    const panel = scoreDoraHtml({ doraBreakdown: breakdown });
    state.riichi[0] = false;
    const noRiichiBreakdown = doraBreakdownForTiles(0, tiles);
    state.deadWall = generated.deadWall;
    state.wall = [...generated.liveWall];
    state.hands[0] = [];
    state.dora = [];
    state.uraDora = [];
    revealDoraPair();
    revealDoraPair();
    const expectedRinshanId = state.deadWall.rinshan[state.deadWall.rinshan.length - 1].id;
    const liveBeforeRinshan = state.wall.length;
    const rinshanTile = drawRinshanIntoHand(0, true);
    const deadWallEquivalent = state.deadWall.rinshan.length + state.deadWall.doraIndicators.length + state.deadWall.uraIndicators.length + state.deadWall.replenished.length;
    return {
      generatedLiveWall: generatedSlots.live,
      generatedDeadWall: generatedSlots.dead,
      rinshanSlots: generatedSlots.rinshan,
      doraSlots: generatedSlots.dora,
      uraSlots: generatedSlots.ura,
      doraCycles: [doraKeyFromIndicator(makeTile("m", 9, 1)), doraKeyFromIndicator(makeTile("z", 4, 1)), doraKeyFromIndicator(makeTile("z", 7, 1))],
      doraHan: breakdown.doraHan,
      uraDoraHan: breakdown.uraDoraHan,
      winningShape: isWinningHandWithTiles(0, tiles),
      allYaku: yaku.map((item) => ({ id: item.id || item.name, point: item.point })),
      yaku: yaku.filter((item) => ["dora", "ura_dora"].includes(item.id)).map((item) => ({ id: item.id, point: item.point })),
      noRiichiUraIndicators: noRiichiBreakdown.uraIndicators.length,
      noRiichiUraHan: noRiichiBreakdown.uraDoraHan,
      kanVisibleIndicators: state.dora.length,
      kanHiddenIndicators: state.uraDora.length,
      rinshanFromDeadWall: rinshanTile?.id === expectedRinshanId,
      liveWallDecrement: liveBeforeRinshan - state.wall.length,
      deadWallEquivalent,
      deadWallTilesAfterKan: state.deadWall.tiles.length,
      panelHasVisible: panel.includes("ドラ＋カンドラ"),
      panelHasUra: panel.includes("裏ドラ＋カン裏ドラ")
    };
  } finally {
    state.settings = previous.settings;
    state.melds[0] = previous.melds;
    state.dora = previous.dora;
    state.uraDora = previous.uraDora;
    state.deadWall = previous.deadWall;
    state.riichi[0] = previous.riichi;
    state.discardCounts = previous.discardCounts;
    state.wall = previous.wall;
    state.hands[0] = previous.hand;
    state.drawnTileId = previous.drawnTileId;
  }
}

startRound(presets[0].settings, "standard");

const repeatDebugPairs = (suit, values) => values.flatMap((value) => [`${suit}${value}`, `${suit}${value}`]);
const chineseRuleSelfTests = {
  shifted_11_77: debugChinesePattern(repeatDebugPairs("m", [1, 2, 3, 4, 5, 6, 7])),
  shifted_33_99: debugChinesePattern(repeatDebugPairs("s", [3, 4, 5, 6, 7, 8, 9])),
  shifted_cosmic: debugChinesePattern(repeatDebugPairs("m", [5, 6, 7, 8, 9, 1, 2]), { cosmic: true }),
  daisharin_excluded: debugChinesePattern(repeatDebugPairs("p", [2, 3, 4, 5, 6, 7, 8]), { win: { type: "ロン", player: 0, discarder: 1 } }),
  pure_terminal_chows: debugChinesePattern(["m1", "m2", "m3", "m1", "m2", "m3", "m5", "m5", "m7", "m8", "m9", "m7", "m8", "m9"]),
  two_pure_double_chows: debugChinesePattern(["m6", "m7", "m8", "m6", "m7", "m8", "p7", "p8", "p9", "p7", "p8", "p9", "s6", "s6"]),
  cosmic_double_chow: debugChinesePattern(["m8", "m9", "m1", "m8", "m9", "m1", "p3", "p4", "p5", "s3", "s4", "s5", "z5", "z5"], { cosmic: true }),
  cosmic_honor_double_chow: debugChinesePattern(["z1", "z2", "z3", "z1", "z2", "z3", "m1", "m2", "m3", "p1", "p2", "p3", "s5", "s5"], { cosmic: true }),
  two_terminal_pairs: debugChinesePattern(["m1", "m2", "m3", "m7", "m8", "m9", "s1", "s2", "s3", "s7", "s8", "s9", "p9", "p9"]),
  quadruple_chow: debugChinesePattern(["p1", "p2", "p3", "p1", "p2", "p3", "p1", "p2", "p3", "p1", "p2", "p3", "s4", "s4"]),
  quadruple_chow_open: debugChinesePattern(["p1", "p2", "p3", "s4", "s4"], { melds: [["p1", "p2", "p3"], ["p1", "p2", "p3"], ["p1", "p2", "p3"]] }),
  quadruple_chow_cosmic: debugChinesePattern(["m8", "m9", "m1", "m8", "m9", "m1", "m8", "m9", "m1", "m8", "m9", "m1", "s4", "s4"], { cosmic: true }),
  triple_chow_open: debugChinesePattern(["p3", "p4", "p5", "m1", "m2", "m3", "s5", "s5"], { melds: [["p3", "p4", "p5"], ["p3", "p4", "p5"]] }),
  triple_chow_cosmic_open: debugChinesePattern(["m8", "m9", "m1", "p3", "p4", "p5", "s5", "s5"], { cosmic: true, melds: [["m8", "m9", "m1"], ["m8", "m9", "m1"]] }),
  sanrenkou: debugChinesePattern(["s3", "s3", "s3", "s4", "s4", "s4", "s5", "s5", "s5", "m6", "m7", "m8", "p8", "p8"]),
  suurenkou: debugChinesePattern(["s6", "s6", "s6", "s7", "s7", "s7", "s8", "s8", "s8", "s9", "s9", "s9", "m3", "m3"]),
  suurenkou_cosmic: debugChinesePattern(["m8", "m8", "m8", "m9", "m9", "m9", "m1", "m1", "m1", "m2", "m2", "m2", "s2", "s2"], { cosmic: true }),
  tile_hog_two: debugChinesePattern(["m4", "m5", "m6", "m6", "m7", "m8", "m6", "m6", "p4", "p4", "p4", "p4", "p5", "p6"]),
  chinese_seven_pairs: debugChinesePattern(["m1", "m1", "m1", "m1", "p5", "p5", "p5", "p5", "s9", "s9", "s9", "s9", "z4", "z4"]),
  chinese_seven_pairs_tsumo: debugChinesePattern(["m1", "m1", "m1", "m1", "p5", "p5", "p5", "p5", "s9", "s9", "s9", "s9", "z4", "z4"], { win: { type: "ツモ", player: 0 } }),
  chinese_seven_pairs_off: debugChinesePattern(["m1", "m1", "m1", "m1", "p5", "p5", "p5", "p5", "s9", "s9", "s9", "s9", "z4", "z4"], { china: false }),
  japanese_seven_pairs: debugChinesePattern(["m1", "m1", "m2", "m2", "p3", "p3", "p4", "p4", "s5", "s5", "s6", "s6", "z4", "z4"], { win: { type: "ツモ", player: 0 } }),
  concealed_hand_ron: debugChinesePattern(["m1", "m2", "m3", "p1", "p2", "p3", "s1", "s2", "s3", "s4", "s5", "s6", "z1", "z1"], { win: { type: "ロン", player: 0, discarder: 1 } }),
  closed_self_draw: debugChinesePattern(["m1", "m2", "m3", "p1", "p2", "p3", "s1", "s2", "s3", "s4", "s5", "s6", "z1", "z1"], { win: { type: "ツモ", player: 0 } }),
  open_self_draw: debugChinesePattern(["p1", "p2", "p3", "s1", "s2", "s3", "s4", "s5", "s6", "z1", "z1"], { melds: [["m1", "m2", "m3"]], win: { type: "ツモ", player: 0 } }),
  cosmic_open_chanta: debugChinesePattern(["p1", "p2", "p9", "s7", "s8", "s9", "z1", "z2", "z3", "z5", "z5"], { cosmic: true, melds: [["m1", "m8", "m9"]], win: { type: "ツモ", player: 0 } }),
  cosmic_open_junchan: debugChinesePattern(["p1", "p2", "p9", "s7", "s8", "s9", "m1", "m2", "m3", "p1", "p1"], { cosmic: true, melds: [["m1", "m2", "m9"]], win: { type: "ツモ", player: 0 } }),
  cosmic_honor_sequence_honroutou: debugChinesePattern(["p1", "p1", "p1", "p9", "p9", "p9", "m1", "m1", "m1", "z3", "z3"], { cosmic: true, melds: [["z4", "z1", "z2"]], win: { type: "ツモ", player: 0 } }),
  cosmic_open_honitsu: debugChinesePattern(["p1", "p2", "p3", "p3", "p4", "p5", "p9", "p9"], { cosmic: true, melds: [["z1", "z2", "z3"], ["z5", "z5", "z5"]], win: { type: "ツモ", player: 0 } }),
  cosmic_open_chinitsu: debugChinesePattern(["s5", "s6", "s7", "s3", "s3", "s3", "s4", "s4"], { cosmic: true, melds: [["s9", "s1", "s2"], ["s2", "s2", "s2"]], win: { type: "ツモ", player: 0 } }),
  cosmic_open_ikkitsuukan: debugChinesePattern(["m3", "m3", "m3", "s5", "s6", "s7", "p4", "p4"], { cosmic: true, melds: [["s2", "s3", "s4"], ["s8", "s9", "s1"]], win: { type: "ツモ", player: 0 } }),
  cosmic_three_concealed_with_honor_sequence_tsumo: debugChinesePattern(["m2", "m2", "m2", "p4", "p4", "p4", "z4", "z4", "z4", "z5", "z6", "z7", "s5", "s5"], { cosmic: true, china: false, win: { type: "ツモ", player: 0 } }),
  cosmic_three_concealed_with_honor_sequence_ron: debugChinesePattern(["m2", "m2", "m2", "p4", "p4", "p4", "z4", "z4", "z4", "z5", "z6", "z7", "s5", "s5"], { cosmic: true, china: false, win: { type: "ロン", player: 0, discarder: 1 } }),
  cosmic_two_concealed_two_honor_sequences: debugChinesePattern(["m2", "m2", "m2", "p4", "p4", "p4", "z5", "z6", "z7", "z1", "z2", "z3", "s5", "s5"], { cosmic: true, china: false, win: { type: "ツモ", player: 0 } }),
  china_honor_quadruple_chow: debugChinesePattern(["z1", "z2", "z3", "z1", "z2", "z3", "z1", "z2", "z3", "s5", "s5"], { cosmic: true, melds: [["z1", "z2", "z3"]], win: { type: "ツモ", player: 0 } }),
  china_dragon_triple_chow: debugChinesePattern(["z5", "z6", "z7", "z5", "z6", "z7", "s5", "s5", "s5", "m6", "m6"], { cosmic: true, melds: [["z5", "z6", "z7"]], win: { type: "ツモ", player: 0 } }),
  china_dragon_general_high: debugChinesePattern(["z5", "z6", "z7", "s5", "s5", "s5", "m6", "m6", "m6", "z7", "z7"], { cosmic: true, melds: [["z5", "z6", "z7"]], win: { type: "ツモ", player: 0 } }),
  china_honor_triple_chow_shifted: debugChinesePattern(["z1", "z2", "z3", "z1", "z2", "z3", "s5", "s5"], { cosmic: true, melds: [["z1", "z2", "z3"], ["z2", "z3", "z4"]], win: { type: "ツモ", player: 0 } }),
  china_two_general_high: debugChinesePattern(["z1", "z2", "z3", "p3", "p4", "p5", "p3", "p4", "p5", "m6", "m6"], { cosmic: true, melds: [["z1", "z2", "z3"]], win: { type: "ツモ", player: 0 } }),
  white_storm_double_yakuhai: debugChinesePattern(["z5", "z5", "z5", "z5", "z5", "z5", "m1", "m2", "m3", "p1", "p2", "p3", "z1", "z1"], { china: false, whiteStorm: true, win: { type: "ツモ", player: 0 } }),
  white_horizon_honitsu: debugChinesePattern(["m3", "m4", "m5", "z5", "z5", "z5", "z7", "z7"], { whiteStorm: true, melds: [["z5", "z5", "z5"], ["z5", "z5", "z5"]], win: { type: "ツモ", player: 0 } }),
  all_white_overlap: debugChinesePattern(["z5", "z5", "z5", "z5", "z5", "z5", "z5", "z5", "z5", "z5", "z5", "z5", "z5", "z5"], { whiteStorm: true, cosmic: true, win: { type: "ツモ", player: 0, tileCode: "z5" } }),
  cosmic_tsuuiisou_excludes_chanta: debugChinesePattern(["z2", "z3", "z4", "z5", "z5"], { whiteStorm: true, cosmic: true, melds: [["z5", "z5", "z5"], ["z5", "z5", "z5"], ["z5", "z5", "z5"]], win: { type: "ツモ", player: 0, tileCode: "z5" } }),
  three_suited_terminal_chows: debugChinesePattern(["m1", "m2", "m3", "m7", "m8", "m9", "p1", "p2", "p3", "p7", "p8", "p9", "s5", "s5"], { win: { type: "ツモ", player: 0, tileCode: "s5" } }),
  pure_shifted_chows_numeric: debugChinesePattern(["s1", "s2", "s3", "s2", "s3", "s4", "s3", "s4", "s5", "z3", "z3", "z3", "m3", "m3"], { win: { type: "ツモ", player: 0, tileCode: "m3" } }),
  pure_shifted_chows_cosmic: debugChinesePattern(["s6", "s7", "s8", "s7", "s8", "s9", "s8", "s9", "s1", "z7", "z7", "z7", "p5", "p5"], { cosmic: true, win: { type: "ツモ", player: 0, tileCode: "p5" } }),
  pure_shifted_chows_winds: debugChinesePattern(["z1", "z2", "z3", "z2", "z3", "z4", "z3", "z4", "z1", "p5", "p5", "p5", "m3", "m3"], { cosmic: true, win: { type: "ツモ", player: 0, tileCode: "m3" } }),
  pure_shifted_chows_dragons_open: debugChinesePattern(["z5", "z6", "z7", "m3", "m3", "m3", "p2", "p2"], { cosmic: true, melds: [["z6", "z7", "z5"], ["z7", "z5", "z6"]], win: { type: "ツモ", player: 0, tileCode: "p2" } }),
  all_fives_open: debugChinesePattern(["m4", "m5", "m6", "p4", "p5", "p6", "s4", "s5", "s6", "m5", "m5"], { melds: [["s4", "s5", "s6"]], win: { type: "ツモ", player: 0, tileCode: "m5" } }),
  four_shifted_chows_step_one: debugChinesePattern(["m2", "m3", "m4", "m3", "m4", "m5", "m4", "m5", "m6", "m5", "m6", "m7", "p6", "p6"], { win: { type: "ツモ", player: 0, tileCode: "p6" } }),
  four_shifted_chows_step_two: debugChinesePattern(["m1", "m2", "m3", "m3", "m4", "m5", "m5", "m6", "m7", "m7", "m8", "m9", "p5", "p5"], { win: { type: "ツモ", player: 0, tileCode: "p5" } }),
  four_shifted_chows_cosmic_one: debugChinesePattern(["m8", "m9", "m1", "m9", "m1", "m2", "m1", "m2", "m3", "m2", "m3", "m4", "m7", "m7"], { cosmic: true, win: { type: "ツモ", player: 0, tileCode: "m7" } }),
  four_shifted_chows_cosmic_two: debugChinesePattern(["m7", "m8", "m9", "m9", "m1", "m2", "m2", "m3", "m4", "m4", "m5", "m6", "p5", "p5"], { cosmic: true, win: { type: "ツモ", player: 0, tileCode: "p5" } }),
  four_shifted_chows_winds_one: debugChinesePattern(["z1", "z2", "z3", "z2", "z3", "z4", "z3", "z4", "z1", "z4", "z1", "z2", "p5", "p5"], { cosmic: true, win: { type: "ツモ", player: 0, tileCode: "p5" } }),
  four_shifted_chows_winds_two_open: debugChinesePattern(["z1", "z2", "z3", "z3", "z4", "z1", "p5", "p5"], { cosmic: true, melds: [["z1", "z2", "z3"], ["z3", "z4", "z1"]], win: { type: "ツモ", player: 0, tileCode: "p5" } }),
  all_even_pungs_open: debugChinesePattern(["m2", "m2", "m2", "p4", "p4", "p4", "s6", "s6", "s6", "p2", "p2"], { melds: [["m8", "m8", "m8"]], win: { type: "ツモ", player: 0, tileCode: "p2" } }),
  big_three_winds: debugChinesePattern(["z1", "z1", "z1", "z2", "z2", "z2", "z3", "z3", "z3", "m1", "m2", "m3", "p5", "p5"], { win: { type: "ツモ", player: 0, tileCode: "p5" } }),
  honor_sequences_not_three_winds: debugChinesePattern(["z1", "z2", "z3", "z2", "z3", "z4", "z3", "z4", "z1", "m1", "m2", "m3", "p5", "p5"], { cosmic: true, win: { type: "ツモ", player: 0, tileCode: "p5" } }),
  mixed_straight: debugChinesePattern(["m1", "m2", "m3", "p4", "p5", "p6", "s7", "s8", "s9", "z5", "z5", "z5", "z1", "z1"], { win: { type: "ツモ", player: 0, tileCode: "z1" } }),
  mixed_straight_cosmic: debugChinesePattern(["s2", "s3", "s4", "m5", "m6", "m7", "p8", "p9", "p1", "z5", "z5", "z5", "z1", "z1"], { cosmic: true, win: { type: "ツモ", player: 0, tileCode: "z1" } }),
  reversible_tiles: debugChinesePattern(["p1", "p2", "p3", "p3", "p4", "p5", "s4", "s5", "s6", "z5", "z5", "z5", "p8", "p8"], { win: { type: "ツモ", player: 0, tileCode: "p8" } }),
  one_voided_suit_with_honors: debugChinesePattern(["m1", "m2", "m3", "m4", "m5", "m6", "p7", "p8", "p9", "z5", "z5", "z5", "z1", "z1"], { win: { type: "ツモ", player: 0, tileCode: "z1" } }),
  mixed_shifted_pungs: debugChinesePattern(["m7", "m7", "m7", "p8", "p8", "p8", "s4", "s5", "s6", "p9", "p9"], { melds: [["s9", "s9", "s9"]], win: { type: "ツモ", player: 0, tileCode: "p9" } }),
  mixed_shifted_pungs_cosmic: debugChinesePattern(["s9", "s9", "s9", "m1", "m1", "m1", "s5", "s6", "s7", "z3", "z3"], { cosmic: true, melds: [["s2", "s2", "s2"]], win: { type: "ツモ", player: 0, tileCode: "z3" } }),
  mixed_shifted_chows: debugChinesePattern(["m3", "m4", "m5", "p4", "p5", "p6", "s5", "s6", "s7", "m5", "m5", "m5", "z4", "z4"], { win: { type: "ツモ", player: 0, tileCode: "z4" } }),
  mixed_shifted_chows_cosmic: debugChinesePattern(["m7", "m8", "m9", "p8", "p9", "p1", "s9", "s1", "s2", "m5", "m5", "m5", "z4", "z4"], { cosmic: true, win: { type: "ツモ", player: 0, tileCode: "z4" } }),
  mixed_shifted_chows_step_two_rejected: debugChinesePattern(["m1", "m2", "m3", "p3", "p4", "p5", "s5", "s6", "s7", "m5", "m5", "m5", "z4", "z4"], { win: { type: "ツモ", player: 0, tileCode: "z4" } }),
  melded_hand_ron: debugChinesePattern(["m1", "m1"], { melds: [["m1", "m2", "m3"], ["s4", "s5", "s6"], ["s7", "s7", "s7"], ["p6", "p6", "p6", "p6"]], meldTypes: ["チー", "チー", "ポン", "明カン"], win: { type: "ロン", player: 0, discarder: 1, tileCode: "m1" } }),
  melded_hand_tsumo_rejected: debugChinesePattern(["m1", "m1"], { melds: [["m1", "m2", "m3"], ["s4", "s5", "s6"], ["s7", "s7", "s7"], ["p6", "p6", "p6", "p6"]], meldTypes: ["チー", "チー", "ポン", "明カン"], win: { type: "ツモ", player: 0, tileCode: "m1" } }),
  concealed_kong: debugChinesePattern(["m1", "m2", "m3", "p4", "p5", "p6", "s7", "s8", "s9", "z1", "z1"], { melds: [["z5", "z5", "z5", "z5"]], meldTypes: ["暗カン"], win: { type: "ツモ", player: 0, tileCode: "z1" } }),
  two_concealed_kongs: debugChinesePattern(["m1", "m2", "m3", "p4", "p5", "p6", "z1", "z1"], { melds: [["z5", "z5", "z5", "z5"], ["s9", "s9", "s9", "s9"]], meldTypes: ["暗カン", "暗カン"], win: { type: "ツモ", player: 0, tileCode: "z1" } }),
  two_concealed_kongs_with_sanankou: debugChinesePattern(["m1", "m1", "m1", "p4", "p5", "p6", "z1", "z1"], { melds: [["z5", "z5", "z5", "z5"], ["s9", "s9", "s9", "s9"]], meldTypes: ["暗カン", "暗カン"], win: { type: "ツモ", player: 0, tileCode: "z1" } }),
  two_concealed_pungs: debugChinesePattern(["m1", "m1", "m1", "p2", "p2", "p2", "s3", "s4", "s5", "s6", "s7", "s8", "z1", "z1"], { win: { type: "ツモ", player: 0, tileCode: "z1" } }),
  two_concealed_pungs_three_concealed_rejected: debugChinesePattern(["m1", "m1", "m1", "p2", "p2", "p2", "s3", "s3", "s3", "m4", "m5", "m6", "z1", "z1"], { win: { type: "ツモ", player: 0, tileCode: "z1" } }),
  two_dragon_pungs_bonus: debugChinesePattern(["z5", "z5", "z5", "z6", "z6", "z6", "m1", "m2", "m3", "p4", "p5", "p6", "s5", "s5"], { win: { type: "ツモ", player: 0, tileCode: "s5" } }),
  two_dragon_pungs_small_three_rejected: debugChinesePattern(["z5", "z5", "z5", "z6", "z6", "z6", "z7", "z7", "m1", "m2", "m3", "p4", "p5", "p6"], { win: { type: "ツモ", player: 0, tileCode: "z7" } }),
  two_dragon_pungs_big_three_rejected: debugChinesePattern(["z5", "z5", "z5", "z6", "z6", "z6", "z7", "z7", "z7", "m1", "m2", "m3", "p5", "p5"], { win: { type: "ツモ", player: 0, tileCode: "p5" } }),
  two_melded_kongs: debugChinesePattern(["m1", "m2", "m3", "p4", "p5", "p6", "z1", "z1"], { melds: [["s7", "s7", "s7", "s7"], ["m9", "m9", "m9", "m9"]], meldTypes: ["明カン", "明カン"], win: { type: "ツモ", player: 0, tileCode: "z1" } }),
  mixed_melded_concealed_kongs: debugChinesePattern(["m1", "m2", "m3", "p4", "p5", "p6", "z1", "z1"], { melds: [["s7", "s7", "s7", "s7"], ["m9", "m9", "m9", "m9"]], meldTypes: ["明カン", "暗カン"], win: { type: "ツモ", player: 0, tileCode: "z1" } }),
  double_pung_once: debugChinesePattern(["m3", "m3", "m3", "p3", "p3", "p3", "s4", "s5", "s6", "m7", "m8", "m9", "z3", "z3"], { win: { type: "ツモ", player: 0, tileCode: "z3" } }),
  double_pung_twice: debugChinesePattern(["m3", "m3", "m3", "p3", "p3", "p3", "p7", "p7", "p7", "s7", "s7", "s7", "z3", "z3"], { win: { type: "ツモ", player: 0, tileCode: "z3" } }),
  double_pung_triple_pung_rejected: debugChinesePattern(["m3", "m3", "m3", "p3", "p3", "p3", "s3", "s3", "s3", "m4", "m5", "m6", "z3", "z3"], { win: { type: "ツモ", player: 0, tileCode: "z3" } }),
  mixed_double_chow_once: debugChinesePattern(["m2", "m3", "m4", "p2", "p3", "p4", "p4", "p4", "p4", "s4", "s5", "s6", "z2", "z2"], { win: { type: "ツモ", player: 0, tileCode: "z2" } }),
  mixed_double_chow_twice: debugChinesePattern(["m2", "m3", "m4", "p2", "p3", "p4", "p4", "p5", "p6", "s4", "s5", "s6", "z4", "z4"], { win: { type: "ツモ", player: 0, tileCode: "z4" } }),
  mixed_double_chow_cosmic_once: debugChinesePattern(["m9", "m1", "m2", "p9", "p1", "p2", "p4", "p4", "p4", "s4", "s5", "s6", "z2", "z2"], { cosmic: true, win: { type: "ツモ", player: 0, tileCode: "z2" } }),
  mixed_double_chow_cosmic_twice: debugChinesePattern(["m9", "m1", "m2", "p9", "p1", "p2", "p4", "p5", "p6", "s4", "s5", "s6", "z2", "z2"], { cosmic: true, win: { type: "ツモ", player: 0, tileCode: "z2" } }),
  mixed_double_chow_triple_chow_rejected: debugChinesePattern(["m2", "m3", "m4", "p2", "p3", "p4", "s2", "s3", "s4", "m6", "m7", "m8", "z2", "z2"], { win: { type: "ツモ", player: 0, tileCode: "z2" } }),
  short_straight_once: debugChinesePattern(["m2", "m3", "m4", "m5", "m6", "m7", "p4", "p4", "p4", "s4", "s5", "s6", "z3", "z3"], { win: { type: "ツモ", player: 0, tileCode: "z3" } }),
  short_straight_twice: debugChinesePattern(["m2", "m3", "m4", "m5", "m6", "m7", "p4", "p5", "p6", "p7", "p8", "p9", "z3", "z3"], { win: { type: "ツモ", player: 0, tileCode: "z3" } }),
  short_straight_cosmic_once: debugChinesePattern(["p6", "p7", "p8", "p9", "p1", "p2", "m4", "m4", "m4", "s4", "s5", "s6", "z3", "z3"], { cosmic: true, win: { type: "ツモ", player: 0, tileCode: "z3" } }),
  short_straight_cosmic_twice: debugChinesePattern(["p6", "p7", "p8", "p9", "p1", "p2", "s8", "s9", "s1", "s2", "s3", "s4", "z3", "z3"], { cosmic: true, win: { type: "ツモ", player: 0, tileCode: "z3" } }),
  short_straight_winds_east: debugChinesePattern(["z1", "z2", "z3", "z4", "z1", "z2", "s4", "s4", "s4", "p2", "p3", "p4", "z5", "z5"], { cosmic: true, win: { type: "ツモ", player: 0, tileCode: "z5" } }),
  short_straight_winds_south: debugChinesePattern(["z2", "z3", "z4", "z1", "z2", "z3", "s4", "s4", "s4", "p2", "p3", "p4", "z5", "z5"], { cosmic: true, win: { type: "ツモ", player: 0, tileCode: "z5" } }),
  short_straight_winds_west: debugChinesePattern(["z3", "z4", "z1", "z2", "z3", "z4", "s4", "s4", "s4", "p2", "p3", "p4", "z5", "z5"], { cosmic: true, win: { type: "ツモ", player: 0, tileCode: "z5" } }),
  short_straight_winds_north: debugChinesePattern(["z4", "z1", "z2", "z3", "z4", "z1", "s4", "s4", "s4", "p2", "p3", "p4", "z5", "z5"], { cosmic: true, win: { type: "ツモ", player: 0, tileCode: "z5" } }),
  short_straight_dragons_rejected: debugChinesePattern(["z5", "z6", "z7", "z5", "z6", "z7", "s4", "s4", "s4", "p2", "p3", "p4", "z1", "z1"], { cosmic: true, win: { type: "ツモ", player: 0, tileCode: "z1" } }),
  short_straight_ikkitsuukan_rejected: debugChinesePattern(["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "p4", "p4", "p4", "z3", "z3"], { win: { type: "ツモ", player: 0, tileCode: "z3" } }),
  last_tile_three_river: debugChinesePattern(["m1", "m2", "m3", "p1", "p2", "p3", "s1", "s2", "s3", "m4", "m5", "m6", "z1", "z1"], { rivers: [["m3"], ["m3"], ["m3"], []], win: { type: "ツモ", player: 0, tileCode: "m3" } }),
  last_tile_ron_excludes_winning_discard: debugChinesePattern(["m1", "m2", "m3", "p1", "p2", "p3", "s1", "s2", "s3", "m4", "m5", "m6", "z1", "z1"], { rivers: [["m3"], ["m3"], ["m3"], []], includeWinningDiscard: true, win: { type: "ロン", player: 0, discarder: 1, tileCode: "m3" } }),
  last_tile_other_meld: debugChinesePattern(["m1", "m2", "m3", "p1", "p2", "p3", "s1", "s2", "s3", "m4", "m5", "m6", "z1", "z1"], { tableMelds: { 1: [["m3", "m3", "m3"]] }, win: { type: "ツモ", player: 0, tileCode: "m3" } }),
  last_tile_base_dora: debugChinesePattern(["m1", "m2", "m3", "p1", "p2", "p3", "s1", "s2", "s3", "m4", "m5", "m6", "z1", "z1"], { rivers: [["m3"], ["m3"], [], []], dora: ["m3"], win: { type: "ツモ", player: 0, tileCode: "m3" } }),
  last_tile_kandora_rejected: debugChinesePattern(["m1", "m2", "m3", "p1", "p2", "p3", "s1", "s2", "s3", "m4", "m5", "m6", "z1", "z1"], { rivers: [["m3"], ["m3"], [], []], dora: ["p9", "m3"], win: { type: "ツモ", player: 0, tileCode: "m3" } }),
  last_tile_uradora_rejected: debugChinesePattern(["m1", "m2", "m3", "p1", "p2", "p3", "s1", "s2", "s3", "m4", "m5", "m6", "z1", "z1"], { rivers: [["m3"], ["m3"], [], []], dora: ["p9"], uraDora: ["m3"], win: { type: "ツモ", player: 0, tileCode: "m3" } }),
  last_tile_white_storm_remaining_one: debugChinesePattern(["m1", "m2", "m3", "p1", "p2", "p3", "s1", "s2", "s3", "z5", "z6", "z7", "m5", "m5"], { cosmic: true, whiteStorm: true, whiteCount: 12, rivers: [["z5", "z5", "z5"], ["z5", "z5", "z5"], ["z5", "z5", "z5"], ["z5", "z5"]], win: { type: "ツモ", player: 0, tileCode: "z5" } }),
  last_tile_white_storm_two_remaining_rejected: debugChinesePattern(["m1", "m2", "m3", "p1", "p2", "p3", "s1", "s2", "s3", "z5", "z6", "z7", "m5", "m5"], { cosmic: true, whiteStorm: true, whiteCount: 12, rivers: [["z5", "z5", "z5"], ["z5", "z5", "z5"], ["z5", "z5"], ["z5", "z5"]], win: { type: "ツモ", player: 0, tileCode: "z5" } }),
  terminal_honor_pung_once: debugChinesePattern(["m1", "m1", "m1", "p3", "p4", "p5", "s5", "s6", "s7", "s4", "s5", "s6", "z3", "z3"], { win: { type: "ツモ", player: 0, tileCode: "z3" } }),
  terminal_honor_pung_three: debugChinesePattern(["m1", "m1", "m1", "s4", "s5", "s6", "z4", "z4"], { melds: [["p9", "p9", "p9"], ["z3", "z3", "z3"]], meldTypes: ["ポン", "ポン"], win: { type: "ツモ", player: 0, tileCode: "z4" } }),
  terminal_honor_pung_value_wind_rejected: debugChinesePattern(["z1", "z1", "z1", "p3", "p4", "p5", "s5", "s6", "s7", "m4", "m5", "m6", "p2", "p2"], { win: { type: "ツモ", player: 0, tileCode: "p2" } }),
  terminal_honor_pung_dragon_rejected: debugChinesePattern(["z5", "z5", "z5", "p3", "p4", "p5", "s5", "s6", "s7", "m4", "m5", "m6", "p2", "p2"], { win: { type: "ツモ", player: 0, tileCode: "p2" } }),
  terminal_honor_pung_cosmic_sequence_rejected: debugChinesePattern(["z1", "z2", "z3", "p3", "p4", "p5", "s5", "s6", "s7", "m4", "m5", "m6", "p2", "p2"], { cosmic: true, win: { type: "ツモ", player: 0, tileCode: "p2" } }),
  melded_kong_once: debugChinesePattern(["m1", "m2", "m3", "p4", "p5", "p6", "s7", "s8", "s9", "z1", "z1"], { melds: [["m5", "m5", "m5", "m5"]], meldTypes: ["明カン"], win: { type: "ツモ", player: 0, tileCode: "z1" } }),
  chicken_hand_ron: debugChinesePattern(["p2", "p3", "p4", "s4", "s5", "s6", "m6", "m7", "m8", "z3", "z3"], { melds: [["m1", "m2", "m3"]], win: { type: "ロン", player: 0, tileCode: "p4" } }),
  chicken_hand_tsumo_rejected: debugChinesePattern(["p2", "p3", "p4", "s4", "s5", "s6", "m6", "m7", "m8", "z3", "z3"], { melds: [["m1", "m2", "m3"]], win: { type: "ツモ", player: 0, tileCode: "p4" } }),
  greater_honors_knitted: debugChinesePattern(["m1", "m4", "s2", "s8", "p3", "p6", "p9", "z1", "z2", "z3", "z4", "z5", "z6", "z7"], { win: { type: "ツモ", player: 0, tileCode: "z7" } }),
  lesser_honors_knitted: debugChinesePattern(["s1", "s4", "s7", "m2", "m8", "p3", "p6", "p9", "z1", "z2", "z3", "z4", "z5", "z7"], { win: { type: "ツモ", player: 0, tileCode: "z7" } }),
  lesser_honors_knitted_with_straight: debugChinesePattern(["p1", "p4", "p7", "s2", "s5", "s8", "m3", "m6", "m9", "z2", "z3", "z4", "z5", "z7"], { win: { type: "ツモ", player: 0, tileCode: "z7" } }),
  greater_honors_knitted_open_rejected: debugChinesePattern(["m1", "m4", "s2", "s8", "p3", "p6", "p9", "z1", "z2", "z3", "z4"], { melds: [["z5", "z6", "z7"]], win: { type: "ツモ", player: 0, tileCode: "z4" } }),
  lesser_honors_knitted_open_rejected: debugChinesePattern(["s1", "s4", "s7", "m2", "m8", "p3", "p6", "p9", "z1", "z2", "z3"], { melds: [["z4", "z5", "z7"]], win: { type: "ツモ", player: 0, tileCode: "z3" } }),
  knitted_straight_suppresses_edge: debugChinesePattern(["m1", "m4", "m7", "s2", "s5", "s8", "p3", "p6", "p9", "m7", "m8", "m9", "s9", "s9"], { win: { type: "ツモ", player: 0, tileCode: "m7" } }),
  knitted_straight_suppresses_closed_single: debugChinesePattern(["m1", "m4", "m7", "s2", "s5", "s8", "p3", "p6", "p9", "s4", "s6", "s5", "s5", "s5"], { win: { type: "ツモ", player: 0, tileCode: "s5" } }),
  knitted_straight_single_wait: debugChinesePattern(["m1", "m4", "m7", "s2", "s5", "s8", "p3", "p6", "p9", "z7", "z7", "z7", "z3", "z3"], { win: { type: "ツモ", player: 0, tileCode: "z3" } }),
  edge_wait_single: debugChinesePattern(["m1", "m2", "m3", "p1", "p2", "p3", "s1", "s2", "s3", "m4", "m5", "m6", "z1", "z1"], { win: { type: "ツモ", player: 0, tileCode: "m3" } }),
  closed_wait_single: debugChinesePattern(["m4", "m5", "m6", "p1", "p2", "p3", "s1", "s2", "s3", "m7", "m8", "m9", "z1", "z1"], { win: { type: "ツモ", player: 0, tileCode: "m5" } }),
  single_wait_standard: debugChinesePattern(["m1", "m2", "m3", "p1", "p2", "p3", "s1", "s2", "s3", "m4", "m5", "m6", "z1", "z1"], { win: { type: "ツモ", player: 0, tileCode: "z1" } }),
  single_wait_nobetan_rejected: debugChinesePattern(["p1", "p2", "p3", "s1", "s2", "s3", "z5", "z5", "z5", "m1", "m1", "m2", "m3", "m4"], { win: { type: "ツモ", player: 0, tileCode: "m1" } }),
  edge_wait_cosmic_rejected: debugChinesePattern(["m1", "m2", "m3", "p1", "p2", "p3", "s1", "s2", "s3", "m4", "m5", "m6", "z1", "z1"], { cosmic: true, win: { type: "ツモ", player: 0, tileCode: "m3" } }),
  cosmic_dragon_white_edge_pinfu: debugChinesePattern(["m1", "m2", "m3", "p1", "p2", "p3", "s1", "s2", "s3", "m5", "m5", "z5", "z6", "z7"], { cosmic: true, win: { type: "ロン", player: 0, discarder: 1, tileCode: "z5" } }),
  cosmic_dragon_green_edge_pinfu: debugChinesePattern(["m1", "m2", "m3", "p1", "p2", "p3", "s1", "s2", "s3", "m5", "m5", "z5", "z6", "z7"], { cosmic: true, win: { type: "ロン", player: 0, discarder: 1, tileCode: "z6" } }),
  cosmic_dragon_red_edge_pinfu: debugChinesePattern(["m1", "m2", "m3", "p1", "p2", "p3", "s1", "s2", "s3", "m5", "m5", "z5", "z6", "z7"], { cosmic: true, win: { type: "ロン", player: 0, discarder: 1, tileCode: "z7" } }),
  cosmic_wind_east_west_south_closed: debugChinesePattern(["m1", "m2", "m3", "p1", "p2", "p3", "s1", "s2", "s3", "m5", "m5", "z1", "z2", "z3"], { cosmic: true, win: { type: "ロン", player: 0, discarder: 1, tileCode: "z2" } }),
  cosmic_wind_east_west_north_closed: debugChinesePattern(["m1", "m2", "m3", "p1", "p2", "p3", "s1", "s2", "s3", "m5", "m5", "z1", "z3", "z4"], { cosmic: true, win: { type: "ロン", player: 0, discarder: 1, tileCode: "z4" } }),
  cosmic_wind_south_north_west_closed: debugChinesePattern(["m1", "m2", "m3", "p1", "p2", "p3", "s1", "s2", "s3", "m5", "m5", "z2", "z3", "z4"], { cosmic: true, win: { type: "ロン", player: 0, discarder: 1, tileCode: "z3" } }),
  cosmic_wind_south_north_east_closed: debugChinesePattern(["m1", "m2", "m3", "p1", "p2", "p3", "s1", "s2", "s3", "m5", "m5", "z1", "z2", "z4"], { cosmic: true, win: { type: "ロン", player: 0, discarder: 1, tileCode: "z1" } }),
  cosmic_wind_east_south_west_ryanmen: debugChinesePattern(["m1", "m2", "m3", "p1", "p2", "p3", "s1", "s2", "s3", "m5", "m5", "z1", "z2", "z3"], { cosmic: true, win: { type: "ロン", player: 0, discarder: 1, tileCode: "z3" } }),
  cosmic_wind_east_south_north_ryanmen: debugChinesePattern(["m1", "m2", "m3", "p1", "p2", "p3", "s1", "s2", "s3", "m5", "m5", "z1", "z2", "z4"], { cosmic: true, win: { type: "ロン", player: 0, discarder: 1, tileCode: "z4" } }),
  cosmic_wind_south_west_north_ryanmen: debugChinesePattern(["m1", "m2", "m3", "p1", "p2", "p3", "s1", "s2", "s3", "m5", "m5", "z2", "z3", "z4"], { cosmic: true, win: { type: "ロン", player: 0, discarder: 1, tileCode: "z4" } }),
  cosmic_wind_south_west_east_ryanmen: debugChinesePattern(["m1", "m2", "m3", "p1", "p2", "p3", "s1", "s2", "s3", "m5", "m5", "z1", "z2", "z3"], { cosmic: true, win: { type: "ロン", player: 0, discarder: 1, tileCode: "z1" } }),
  cosmic_wind_west_north_east_ryanmen: debugChinesePattern(["m1", "m2", "m3", "p1", "p2", "p3", "s1", "s2", "s3", "m5", "m5", "z1", "z3", "z4"], { cosmic: true, win: { type: "ロン", player: 0, discarder: 1, tileCode: "z1" } }),
  cosmic_wind_west_north_south_ryanmen: debugChinesePattern(["m1", "m2", "m3", "p1", "p2", "p3", "s1", "s2", "s3", "m5", "m5", "z2", "z3", "z4"], { cosmic: true, win: { type: "ロン", player: 0, discarder: 1, tileCode: "z2" } }),
  cosmic_wind_north_east_south_ryanmen: debugChinesePattern(["m1", "m2", "m3", "p1", "p2", "p3", "s1", "s2", "s3", "m5", "m5", "z1", "z2", "z4"], { cosmic: true, win: { type: "ロン", player: 0, discarder: 1, tileCode: "z2" } }),
  cosmic_wind_north_east_west_ryanmen: debugChinesePattern(["m1", "m2", "m3", "p1", "p2", "p3", "s1", "s2", "s3", "m5", "m5", "z1", "z3", "z4"], { cosmic: true, win: { type: "ロン", player: 0, discarder: 1, tileCode: "z3" } }),
  daichisei: debugChinesePattern(["z1", "z1", "z2", "z2", "z3", "z3", "z4", "z4", "z5", "z5", "z6", "z6", "z7", "z7"], { china: false, win: { type: "ツモ", player: 0, tileCode: "z7" } }),
  suuankou_tanki: debugChinesePattern(["m1", "m1", "m1", "m2", "m2", "m2", "p3", "p3", "p3", "s4", "s4", "s4", "z5", "z5"], { china: false, win: { type: "ツモ", player: 0, tileCode: "z5" } }),
  junsei_chuuren: debugChinesePattern(["m1", "m1", "m1", "m2", "m3", "m4", "m5", "m5", "m6", "m7", "m8", "m9", "m9", "m9"], { china: false, win: { type: "ツモ", player: 0, tileCode: "m5" } }),
  kokushi_13men: debugChinesePattern(["m1", "m9", "p1", "p9", "s1", "s9", "z1", "z1", "z2", "z3", "z4", "z5", "z6", "z7"], { china: false, win: { type: "ツモ", player: 0, tileCode: "z1" } }),
  triple_yakuman_overlap: debugChinesePattern(["z5", "z5", "z5", "z6", "z6", "z6", "z7", "z7", "z7", "m1", "m1", "m1", "z1", "z1"], { china: false, win: { type: "ツモ", player: 0, tileCode: "z1" } }),
  yakuman_with_han_china: debugChinesePattern(["z5", "z5", "z5", "z6", "z6", "z6", "z7", "z7", "z7", "m1", "m1", "m1", "z1", "z1"], { win: { type: "ツモ", player: 0, tileCode: "z1" } })
};
document.documentElement.dataset.chinaYakuSelfTests = JSON.stringify(chineseRuleSelfTests);
document.documentElement.dataset.hybridYakumanSelfTests = JSON.stringify({
  point24ChildRon: hybridRoundPayment(hybridChildRonPayment(24), 24),
  point24Limit: hybridLimitName(24),
  point31Limit: hybridLimitName(31),
  point32ChildRon: hybridRoundPayment(hybridChildRonPayment(32), 32),
  point32Limit: hybridLimitName(32),
  han13: riichiHanToChinaPoint(13),
  han17: riichiHanToChinaPoint(17),
  han26: riichiHanToChinaPoint(26),
  han39: riichiHanToChinaPoint(39),
  limit39: limitBase(0, 39)
});
document.documentElement.dataset.doraSelfTests = JSON.stringify(debugDoraRules());
document.documentElement.dataset.cpuSelfTests = JSON.stringify({
  mcr_greater_knitted_iishanten: debugCpuDiscard(["z1", "z2", "z3", "z4", "z5", "z6", "m1", "m4", "m7", "s2", "s5", "p3", "p2", "p2"], { china: true }),
  mcr_lesser_knitted_iishanten: debugCpuDiscard(["z1", "z3", "z5", "z7", "m1", "m4", "m7", "s2", "s5", "s8", "p3", "p6", "p2", "p2"], { china: true }),
  mcr_knitted_straight_iishanten: debugCpuDiscard(["m1", "m4", "m7", "s2", "s5", "s8", "p3", "m2", "m3", "m4", "z1", "z1", "z5", "z6"], { china: true }),
  mcr_special_iishanten_rejects_pon: debugCpuCallProbability(["z1", "z2", "z3", "z4", "z5", "z5", "z6", "m1", "m4", "m7", "s2", "s5", "p3"], ["z5", "z5", "z5"], "ポン", { china: true }),
  cosmic_19_draw_2_three_pairs: debugCpuDiscard(["p1", "p9", "m1", "m1", "m4", "m4", "z5", "z5", "s3", "s4", "p6", "p7", "z2", "p2"], { cosmic: true }),
  cosmic_19_draw_2_five_pairs: debugCpuDiscard(["p1", "p9", "m1", "m1", "m4", "m4", "s4", "s4", "z5", "z5", "z6", "z6", "m9", "p2"], { cosmic: true }),
  standard_19_draw_2_three_pairs: debugCpuDiscard(["p1", "p9", "m1", "m1", "m4", "m4", "z5", "z5", "s3", "s4", "p6", "p7", "z2", "p2"], { cosmic: false }),
  flush_seven: debugCpuDiscard(["p1", "p2", "p3", "p4", "p5", "p6", "p7", "z5", "z5", "m1", "m2", "m3", "s4", "z1"], {}),
  flush_ten: debugCpuDiscard(["p1", "p2", "p3", "p4", "p5", "p5", "p6", "p7", "p8", "p9", "z5", "z5", "m2", "s7"], {}),
  value_honor_pon: debugCpuCallProbability(["p1", "p2", "p3", "p4", "p5", "p6", "p7", "z5", "z5", "m2", "m3", "s7", "s8"], ["z5", "z5", "z5"], "ポン"),
  flush_ten_chi: debugCpuCallProbability(["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9", "p9", "z5", "z5", "m2"], ["p3", "p4", "p5"], "チー"),
  flush_ten_offsuit_chi: debugCpuCallProbability(["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9", "p9", "z5", "z5", "m2"], ["m2", "m3", "m4"], "チー"),
  closed_tenpai_value_honor_pon: debugCpuCallProbability(["m1", "m2", "m3", "p1", "p2", "p3", "s1", "s2", "s3", "m7", "m8", "z5", "z5"], ["z5", "z5", "z5"], "ポン"),
  closed_iishanten_value_honor_pon: debugCpuCallProbability(["m1", "m2", "m3", "p1", "p2", "p3", "s1", "s2", "s3", "z1", "m9", "z5", "z5"], ["z5", "z5", "z5"], "ポン"),
  closed_iishanten_unhelpful_pon: debugCpuCallProbability(["m1", "m2", "m3", "p1", "p2", "p3", "s1", "s2", "m4", "m5", "p7", "z5", "z5"], ["z5", "z5", "z5"], "ポン"),
  distant_value_honor_pon: debugCpuCallProbability(["m1", "m4", "m7", "p2", "p5", "p8", "s1", "s4", "s7", "z1", "z2", "z5", "z5"], ["z5", "z5", "z5"], "ポン"),
  cosmic_honor_flush: debugCpuDiscard(["p1", "p2", "p3", "p4", "p5", "z1", "z2", "z3", "z5", "z5", "m1", "m2", "m3", "s7"], { cosmic: true }),
  white_supply_open: debugCpuDiscard(["m1", "m2", "m3", "p1", "p2", "p3", "s1", "s2", "s3", "m5", "m6", "p8", "s8", "z5"], { whiteStorm: true, whiteCount: 12 }),
  white_supply_blocked: debugCpuDiscard(["m1", "m2", "m3", "p1", "p2", "p3", "s1", "s2", "s3", "m5", "m6", "p8", "s8", "z5"], { whiteStorm: true, whiteCount: 12, visibleCodes: ["z5", "z5", "z5", "z5", "z5", "z5", "z5", "z5", "z5", "z5"] })
});
document.documentElement.dataset.closedKanSelfTests = JSON.stringify({
  single: debugClosedKanOptions(["m1", "m1", "m1", "m1", "p2", "p3", "p4", "s2", "s3", "s4", "z1", "z1", "m7", "m8"]),
  multiple: debugClosedKanOptions(["m1", "m1", "m1", "m1", "p9", "p9", "p9", "p9", "s2", "s3", "s4", "z1", "z1", "m7"])
});
