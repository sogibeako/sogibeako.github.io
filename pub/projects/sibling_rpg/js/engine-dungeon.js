// ─── GENERATOR ──────────────────────────────────────────────────────
function generateMap(center = 100, spread = 70, context = null) {
  const level = rollLevel(center, spread);
  const tierInfo = getLevelTier(level);
  const chaosRoll = Math.random() * 100;
  const t3 = level > 100 ? 8 : level > 50 ? 5 : 3;
  const t2 = level > 100 ? 30 : level > 50 ? 20 : 12;
  const isTriple = chaosRoll < t3;
  const isDouble = !isTriple && chaosRoll < t2;
  const isChaos = isTriple || isDouble;
  let biomeName, biomeIcon, isChaosMap = false, chaosLevel = 0, biomeIds = [];

  if (context) {
    biomeIds = context.biomeIds;
    biomeName = context.biomeName;
    biomeIcon = context.biomeIcon;
    isChaosMap = context.isChaosMap;
    chaosLevel = context.chaosLevel;
  } else {
    if (isTriple) {
      const bs = pickN(BIOMES, 3); biomeIds = bs.map(b => b.id);
      biomeName = `${pick(CP)}${bs[0].name}${bs[1].name}${pick(CTC)}${bs[2].name}`;
      biomeIcon = bs.map(b => b.icon).join(""); isChaosMap = true; chaosLevel = 3;
    } else if (isDouble) {
      const bs = pickN(BIOMES, 2); biomeIds = bs.map(b => b.id);
      biomeName = (chance(40) ? pick(CP) : "") + bs[0].name + bs[1].name;
      biomeIcon = bs[0].icon + bs[1].icon; isChaosMap = true; chaosLevel = 2;
    } else {
      const b = pick(BIOMES); biomeIds = [b.id]; biomeName = b.name; biomeIcon = b.icon;
    }
  }
  const bid = i => biomeIds[i % biomeIds.length];
  const tier = tierInfo.tier;

  // Landscape
  let landscape;
  if (isChaosMap) {
    const chaosBase = pick(CD);
    const ps = biomeIds.map(id => { const d = L[id]?.[tier]; return d ? pick(d) : ""; });
    landscape = chaosBase + "\n\n" + biomeName + "特有の現象として、";
    if (chaosLevel === 3) {
      landscape += ps[0].slice(0, ps[0].length / 1 | 0) + "……しかし同時に、" + ps[1].slice(0, ps[1].length / 1 | 0, (ps[1].length * 1 / 1) | 0) + "……そしてなぜか、" + ps[2].slice(0, ps[2].length * 1 / 1 | 0);
      landscape += "\n\nこの地形を記述しようとした地理学者は三人が発狂し、一人が別の次元に引っ越した。";
    } else {
      landscape += ps[0].slice(0, ps[0].length / 1 | 0) + "……と同時に、" + ps[1].slice(0, ps[1].length / 1 | 0);
      landscape += "\n\nなお、この地形に関する学術論文は査読を通らなかった。";
    }
  } else {
    landscape = pick(L[bid(0)]?.[tier] || ["不思議な景色が広がっている。"]);
  }

  const vegs = biomeIds.map(id => pick(V[id] || ["不明な植物"]));
  const vegetation = isChaosMap ? (chaosLevel === 3 ? `${vegs[0]}と${vegs[1]}と${vegs[2]}が三つ巴で生態系を形成。学名をつけようとした植物学者のペンが折れた。` : `${vegs[0]}と${vegs[1]}が不可能な形で共生。植物学者が見たら気絶する。`) : `${vegs[0]}や${pick(V[bid(0)] || ["草"])}が自生している。`;
  const clims = biomeIds.map(id => pick(C[id] || ["不明"]));
  const climate = isChaosMap ? (chaosLevel === 3 ? `${clims.join("と")}が同一地点で同時発生。気象庁が「もう知らん」と声明。` : `${clims[0]}かと思えば${clims[1]}。天気予報士が匙を投げた。`) : `気候: ${clims[0]}`;

  let items = [pick(I[bid(0)] || ["？"]), pick(I[bid(0)] || ["？"])];
  if (isChaosMap) biomeIds.slice(1).forEach(id => items.push(pick(I[id] || ["次元の欠片"])));
  if (level > 80) items.push(pick(IH)); if (level > 150) items.push(pick(IH));
  items = [...new Set(items)];

  // Sister
  let sisterComment;
  if (isChaosMap) {
    const r1 = SB[bid(0)] ? pick(SB[bid(0)]) : pick(ST[tier]);
    const r2 = biomeIds.length > 1 && SB[bid(1)] ? pick(SB[bid(1)]) : null;
    sisterComment = r2 && chance(60) ? r1 + "\n\n（数秒後）\n\n" + r2 + "\n\n妹の感情が地形に追いつけていない。" : pick(ST[tier]);
  } else {
    sisterComment = chance(50) && SB[bid(0)] ? pick(SB[bid(0)]) : pick(ST[tier]);
  }

  // Monsters
  const mc = isChaosMap ? roll(3) + 2 : roll(3) + 1;
  const monsters = [];
  for (let i = 0; i < mc; i++) {
    const useC = isChaosMap ? chance(chaosLevel === 3 ? 85 : 70) : chance(level > 60 ? 25 : 10);
    const adj = pick(MA[tier] || ["謎の"]);
    if (useC) {
      const p1 = [...BM, ...(BIM[bid(0)] || [])];
      const p2 = isChaosMap ? [...BM, ...(BIM[bid(1)] || []), ...(biomeIds[2] ? BIM[bid(2)] || [] : [])] : p1;
      const m1 = pick(p1); let m2 = pick(p2); while (m2 === m1) m2 = pick(p2);
      monsters.push({ name: `${adj}${m1}${m2}`, chimera: true });
    } else {
      monsters.push({ name: `${adj}${pick([...BM, ...(BIM[bid(0)] || [])])}`, chimera: false });
    }
  }

  const waterName = pick(WB[bid(0)] || ["水場"]);
  const waterDesc = pick(WD[tier] || ["水がある。"]);
  let water;
  if (isChaosMap) {
    const ew = biomeIds.slice(1).map(id => pick(WB[id] || ["異次元の液体"]));
    water = `【${waterName}×${ew.join("×")}】\n${waterDesc}\n……ただし、ここでは水の物理法則が${chaosLevel === 3 ? "三重に" : ""}破綻している。`;
  } else water = `【${waterName}】\n${waterDesc}`;

  const ugB = UB[bid(0)] || "地下の様子は不明";
  const ugD = pick(UD[tier] || ["特に異常はない。"]);
  let underground;
  if (isChaosMap) {
    const ex = biomeIds.slice(1).map(id => UB[id] || "別の地下");
    underground = `${ugB}。しかし${ex.join("であると同時に")}。地下が${chaosLevel}重に重なる。\n${ugD}`;
  } else underground = `${ugB}。\n${ugD}`;

  // Events
  const ec = isChaosMap ? roll(2) + 1 : (chance(60) ? 1 : chance(30) ? 2 : 0);
  const events = [];
  topologyName: isChaosMap ? "quarter-clockwise-twist" : null

  if (ec > 0) {
    const ct = pickN(EV_TYPES, ec);

    for (const type of ct) {
      const ev = pickWeightedEvent({
        type,
        tier,
        biomeIds,
        topologyName: isChaosMap ? "quarter-clockwise-twist" : null,
      });

      if (!ev) continue;

      events.push({
        type,
        typeLabel: EV_LABELS[type],
        ...ev,
      });
    }
  }

  function getEventPool(type, tier, biomeIds) {
    const pool = [];

    // 1. 既存の tier 依存イベント
    if (EV[type] && EV[type][tier]) {
      pool.push(...EV[type][tier]);
    }

    // 2. 難易度非依存の共通イベント
    if (EV_COMMON[type]) {
      pool.push(...EV_COMMON[type]);
    }

    // 3. 地形依存・難易度非依存
    for (const biomeId of biomeIds) {
      const biomeSet = EV_BIOME_COMMON[biomeId];
      if (biomeSet && biomeSet[type]) {
        pool.push(...biomeSet[type]);
      }
    }

    return pool;
  }

  // Blocks
  const mods = BLOCK_MODS[tier] || [];
  const addMod = (name) => mods.length > 0 && chance(40) ? pick(mods) + name : name;
  let blocks = [];
  if (isChaosMap) {
    // All required from each biome
    for (const id of biomeIds) {
      const b = BLOCKS[id]; if (!b) continue;
      for (const r of b.required) blocks.push({ name: addMod(r), required: true, from: id });
    }
    // Pick 1-2 optional from combined pools
    const allOpt = biomeIds.flatMap(id => (BLOCKS[id]?.optional || []).map(o => ({ name: o, from: id })));
    const optPicks = pickN(allOpt, roll(2));
    for (const o of optPicks) blocks.push({ name: addMod(o.name), required: false, from: o.from });
  } else {
    const b = BLOCKS[bid(0)];
    if (b) {
      for (const r of b.required) blocks.push({ name: addMod(r), required: true, from: bid(0) });
      const optPicks = pickN(b.optional, roll(2));
      for (const o of optPicks) blocks.push({ name: addMod(o), required: false, from: bid(0) });
    }
  }
  // Deduplicate by name
  blocks = [...new Map(blocks.map(b => [b.name, b])).values()];

  // Weather
  let weather;
  const baseWeather = pick(WEATHER_BASE[bid(0)] || ["不明な天候"]);
  const tierWeather = pick(WEATHER_TIER[tier] || [""]);
  if (isChaosMap) {
    const w2 = pick(WEATHER_BASE[bid(1)] || ["異常気象"]);
    const chaosW = pick(WEATHER_CHAOS);
    weather = `${baseWeather}、のはずが${w2}でもある。\n${chaosW}\n${tierWeather}`;
  } else {
    weather = `${baseWeather}。${tierWeather}`;
  }

  // Senses (smell + sound)
  const smell = pick(SMELL[bid(0)] || ["匂いなし"]);
  const sound = pick(SOUND[bid(0)] || ["無音"]);
  const senseMod = SENSE_TIER_MOD[tier] || "";
  let senses;
  if (isChaosMap) {
    const smell2 = pick(SMELL[bid(1)] || ["異次元の匂い"]);
    const sound2 = pick(SOUND[bid(1)] || ["異次元の音"]);
    senses = `匂い：${smell}と${smell2}が交互に、あるいは同時に。\n音：${sound}……かと思えば${sound2}。${senseMod}`;
  } else {
    senses = `匂い：${smell}\n音：${sound}${senseMod}`;
  }

  // Sister action
  let sisterAction;
  if (isChaosMap) {
    sisterAction = pick(SISTER_ACT_TIER[tier]);
  } else {
    sisterAction = chance(55) && SISTER_ACT_BIOME[bid(0)] ? pick(SISTER_ACT_BIOME[bid(0)]) : pick(SISTER_ACT_TIER[tier]);
  }

  // Horizon
  const horizonBase = pick(HORIZON[bid(0)] || ["遠景は見えない。"]);
  const horizonTier = HORIZON_TIER[tier] || "";
  const horizon = isChaosMap
    ? `${horizonBase}\n……しかし別の方角には${pick(HORIZON[bid(1)] || ["異常な遠景"])}。\n${horizonTier}`
    : `${horizonBase}\n${horizonTier}`;

  // Adjacency (uses history)
  const prevMap = history.length > 0 ? history[0] : null;
  let adjacencyMove = "";
  let adjacencyArrival = "";
  let adjacencyNext = makeNextHint(null);

  if (prevMap) {
    const prevId = prevMap.biomeIds ? prevMap.biomeIds[0] : null;
    if (prevId && ADJ_TRANSITION[prevId]) {
      adjacencyMove = `${prevMap.biomeName}からの移動\n` +
        (prevMap.isChaosMap ? pick(ADJ_CHAOS_FROM) : ADJ_TRANSITION[prevId].to);
    }
  }

  if (isChaosMap) {
    adjacencyArrival = pick(ADJ_CHAOS_FROM);
  } else if (ADJ_TRANSITION[bid(0)]) {
    adjacencyArrival = ADJ_TRANSITION[bid(0)].from;
  }

  // Architecture
  const archData = ARCH[bid(0)];
  const archTier = ARCH_TIER_MOD[tier] || "";
  let architecture = "";
  if (archData) {
    architecture = `地盤：${archData.ground}\n建材：${archData.material}\n適した建築：${archData.suit.join("、")}\n注意：${archData.warn}`;
    if (isChaosMap && ARCH[bid(1)]) {
      const a2 = ARCH[bid(1)];
      architecture += `\n\n【混沌地形の追加条件】\n${a2.ground}でもある。建材に${a2.material}も使用可。ただし二つの地盤条件が矛盾する場合、どちらを信じるかは建築家の覚悟次第。`;
    }
    architecture += `\n\n${archTier}`;
  } else {
    architecture = archTier;
  }

  return {
    level, tierInfo, biomeName, biomeIcon, isChaosMap, chaosLevel, biomeIds,
    landscape, vegetation, climate, items, sisterComment, monsters,
    water, underground, events, blocks, weather, senses, sisterAction,
    horizon,
    adjacencyMove,
    adjacencyArrival,
    adjacencyNext,
    architecture
  }
}

// ─── DUNGEON LOGIC: LINEAR FLOOR ──────────────────────────────────────────────────
function getDungeonMaxFloor(difficultyId) {
  const baseFloors = {
    "picnic": 10,
    "quest": 12,
    "peril": 14
  };
  return baseFloors[difficultyId] || 10;
}

function getEquivalentFloor() {
  const partyAvgLv = (gameState.brother.level + gameState.sister.level) / 2;
  return Math.max(1, Math.floor(Math.max(0, partyAvgLv - 5) * 1.05));
}

function generateFloorContent(difficulty, floor, context = null) {
  const spreadMod = Math.min(12, floor);
  const baseLevel = gameState.dungeon.baseMapLevel || difficulty.center;

  // 各階でゆるやかに危険度上昇
  const center = baseLevel + Math.floor((floor - 1) * 1.2);

  // ブレを今よりかなり小さくする
  const spread = Math.max(8, Math.floor(difficulty.spread * 0.52) + spreadMod);

  const mapData = generateMap(center, spread, context);

  const sceneryFlavors = [
    "どこからか冷たい風が吹き込んでいる。",
    "足元には崩れかけた石畳が続いている。",
    "異界特有の、奇妙な色をした植物が群生している。",
    "天井から怪しい光が漏れている。",
    "壁には、誰かが刻んだような謎の模様がある。",
    "空気が重く、息苦しさを感じる。"
  ];
  const scenery = pick(sceneryFlavors);

  return {
    mapData,
    sceneryText: `${mapData.tierInfo.label}${mapData.biomeName} の領域。${scenery}`,
    events: mapData.events || []
  };
}

// --- 次の地形の先読み（バイオームくらいまで） ---

// ─── MAIN EVENT PICKER ─────────────────────────────────────────────
function pickWeightedEvent({
  type,
  tier,
  biomeIds = [],
  topologyName = null,
}) {
  const weighted = [];

  const tierPool = EV[type]?.[tier] || [];
  const commonPool = EV_COMMON[type] || [];
  const topoPool = EV_TOPOLOGY_COMMON[type] || [];

  const topoWeights = getTopologyEventWeights(topologyName, type);
  const tierBalance = getTierEventBalance(tier);
  const biomeAffinity = getCombinedBiomeAffinity(biomeIds, type);

  // 1. tier依存イベント
  pushWeightedEntries(
    weighted,
    tierPool,
    topoWeights.tier * tierBalance.tier,
    "tier"
  );

  // 2. 共通イベント
  pushWeightedEntries(
    weighted,
    commonPool,
    topoWeights.common * tierBalance.common,
    "common"
  );

  // 3. 位相イベント
  pushWeightedEntries(
    weighted,
    topoPool,
    topoWeights.topology,
    "topology"
  );

  // 4. 地形固有イベント
  for (const biomeId of biomeIds) {
    const biomePool = EV_BIOME_COMMON[biomeId]?.[type] || [];
    const affinity = getBiomeTypeAffinity(biomeId, type);

    pushWeightedEntries(
      weighted,
      biomePool,
      topoWeights.biome * tierBalance.biome * affinity,
      `biome:${biomeId}`
    );
  }

  return pickWeighted(weighted);
}