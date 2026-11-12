(function () {
  "use strict";

  const STORAGE_KEY = "mizuharaMahjong.learningData.v1";
  const VERSION = 1;
  const CHARACTER_IDS = ["kazuya", "ichino", "nanayo", "mayoi"];
  const CHARACTER_NAMES = ["水原一彌", "水原一埜", "夕畑目ななよ", "沖中真宵"];
  const FEATURE_KEYS = [
    "baseShape",
    "keepsPair",
    "keepsTriplet",
    "keepsDora",
    "keepsValueHonor",
    "keepsWhite",
    "keepsTerminal",
    "discardSafe",
    "discardOffSuitForFlush",
    "keepsFlushSuit",
    "rareRoute",
    "callAggression",
    "defense",
    "fastTenpai",
    "flexibleYakuRoute",
    "highValueRoute",
    "dealInRisk",
    "oracleKeep",
    "oracleUkeire",
    "oracleTempo",
    "oracleDanger"
  ];

  const CHARACTER_PRESETS = {
    kazuya: {
      style: "standard",
      weights: {
        baseShape: 0.16,
        keepsPair: 0.55,
        keepsTriplet: 0.7,
        keepsDora: 1.5,
        keepsValueHonor: 0.9,
        keepsWhite: 0.35,
        keepsTerminal: 0.05,
        discardSafe: 0.2,
        discardOffSuitForFlush: 0.3,
        keepsFlushSuit: 0.35,
        rareRoute: 0.15,
        callAggression: 0.15,
        defense: 0.25,
        fastTenpai: 0.75,
        flexibleYakuRoute: 0.55,
        highValueRoute: 0.45,
        dealInRisk: 0.45,
        oracleKeep: 0.4,
        oracleUkeire: 0.25,
        oracleTempo: 0.15,
        oracleDanger: 0.25
      }
    },
    ichino: {
      style: "intuition",
      weights: {
        baseShape: 0.12,
        keepsPair: 0.6,
        keepsTriplet: 0.85,
        keepsDora: 1.35,
        keepsValueHonor: 1.35,
        keepsWhite: 1.4,
        keepsTerminal: 0.35,
        discardSafe: 0.1,
        discardOffSuitForFlush: 0.45,
        keepsFlushSuit: 0.55,
        rareRoute: 0.35,
        callAggression: 0.35,
        defense: 0.1,
        fastTenpai: 0.65,
        flexibleYakuRoute: 0.5,
        highValueRoute: 0.6,
        dealInRisk: 0.25,
        oracleKeep: 1.25,
        oracleUkeire: 0.85,
        oracleTempo: 0.45,
        oracleDanger: 0.35
      }
    },
    nanayo: {
      style: "rare_yaku",
      weights: {
        baseShape: 0.1,
        keepsPair: 0.75,
        keepsTriplet: 0.65,
        keepsDora: 1.75,
        keepsValueHonor: 0.9,
        keepsWhite: 0.45,
        keepsTerminal: 0.55,
        discardSafe: 0.25,
        discardOffSuitForFlush: 0.55,
        keepsFlushSuit: 0.75,
        rareRoute: 1.35,
        callAggression: 0.1,
        defense: 0.35,
        fastTenpai: 0.45,
        flexibleYakuRoute: 0.85,
        highValueRoute: 1.25,
        dealInRisk: 0.55,
        oracleKeep: 0.8,
        oracleUkeire: 0.55,
        oracleTempo: 0.25,
        oracleDanger: 0.65
      }
    },
    mayoi: {
      style: "score_race",
      weights: {
        baseShape: 0.2,
        keepsPair: 0.45,
        keepsTriplet: 0.55,
        keepsDora: 1.55,
        keepsValueHonor: 0.75,
        keepsWhite: 0.35,
        keepsTerminal: -0.05,
        discardSafe: 0.45,
        discardOffSuitForFlush: 0.35,
        keepsFlushSuit: 0.45,
        rareRoute: 0.25,
        callAggression: 0.45,
        defense: 0.55,
        fastTenpai: 1.05,
        flexibleYakuRoute: 0.5,
        highValueRoute: 0.55,
        dealInRisk: 0.8,
        oracleKeep: 0.95,
        oracleUkeire: 0.65,
        oracleTempo: 0.9,
        oracleDanger: 0.45
      }
    }
  };

  const DEFAULT_ORACLE_ASSIGNMENTS = {
    kazuya: "kazuya_initial_hands",
    ichino: "ichino_wall_and_hands",
    nanayo: "nanayo_leader_hand",
    mayoi: "mayoi_wall_order"
  };

  const ORACLE_ABILITIES = {
    kazuya_initial_hands: { timing: "round_start", reliability: 0.5 },
    ichino_wall_and_hands: { timing: "after_draw", reliability: 0.55 },
    nanayo_leader_hand: { timing: "after_draw", reliability: 0.6 },
    mayoi_wall_order: { timing: "sixth_draw", reliability: 0.55 }
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function keyOf(tile) {
    return tile ? `${tile.suit}${tile.value}` : "";
  }

  function allTileKeys(settings = {}) {
    const keys = ["m", "p", "s"].flatMap((suit) => Array.from({ length: 9 }, (_, index) => `${suit}${index + 1}`));
    return keys.concat(Array.from({ length: 7 }, (_, index) => `z${index + 1}`));
  }

  function countMap(tiles) {
    return tiles.reduce((map, tile) => {
      const key = keyOf(tile);
      map[key] = (map[key] || 0) + 1;
      return map;
    }, {});
  }

  function countMapByKey(tiles) {
    return (tiles || []).reduce((map, tile) => {
      const key = keyOf(tile);
      if (key) map[key] = (map[key] || 0) + 1;
      return map;
    }, {});
  }

  function doraKeyFromIndicator(tile) {
    if (!tile) return "";
    if (["m", "p", "s"].includes(tile.suit)) return `${tile.suit}${tile.value === 9 ? 1 : tile.value + 1}`;
    if (tile.suit !== "z") return "";
    if (tile.value <= 4) return `z${tile.value === 4 ? 1 : tile.value + 1}`;
    return `z${tile.value === 7 ? 5 : tile.value + 1}`;
  }

  function isTerminal(tile) {
    return ["m", "p", "s"].includes(tile.suit) && (tile.value === 1 || tile.value === 9);
  }

  function isHonor(tile) {
    return tile?.suit === "z";
  }

  function isValueHonor(tile, playerIndex, roundWind = 1, seatWind = 1) {
    if (!tile || tile.suit !== "z") return false;
    return tile.value >= 5 || tile.value === roundWind || tile.value === seatWind || playerIndex === undefined && tile.value <= 4;
  }

  function oracleAssignmentKey(assignments = DEFAULT_ORACLE_ASSIGNMENTS) {
    return CHARACTER_IDS.map((id) => `${id}:${oracleAbilityFor(id, assignments)}`).join(",");
  }

  function ruleKey(settings = {}, oracleEnabled = false, oracleAssignments = DEFAULT_ORACLE_ASSIGNMENTS) {
    const parts = [
      settings.presetId || "custom",
      settings.flowers ? "flowers" : "noflowers",
      settings.whiteStorm ? `white${settings.whiteCount || 12}` : "white4",
      settings.cosmic ? "cosmic" : "normal",
      settings.china ? "china" : "riichi",
      oracleEnabled ? `oracle(${oracleAssignmentKey(oracleAssignments)})` : "fair"
    ];
    return parts.join("|");
  }

  function defaultLearningData() {
    return {
      format: "mizuhara-mahjong-ai-learning-v1",
      version: VERSION,
      updatedAt: new Date().toISOString(),
      profiles: {}
    };
  }

  function ensureProfile(data, key, characterId) {
    const safeData = data || defaultLearningData();
    safeData.profiles ||= {};
    safeData.profiles[key] ||= {};
    if (!safeData.profiles[key][characterId]) {
      safeData.profiles[key][characterId] = {
        games: 0,
        updates: 0,
        weights: {},
        stats: { wins: 0, averageReward: 0 }
      };
    }
    return safeData.profiles[key][characterId];
  }

  function mergedWeights(data, key, characterId, useLearning = true) {
    const preset = CHARACTER_PRESETS[characterId] || CHARACTER_PRESETS.kazuya;
    const base = clone(preset.weights);
    if (!useLearning) return base;
    const learned = data?.profiles?.[key]?.[characterId]?.weights || {};
    FEATURE_KEYS.forEach((feature) => {
      base[feature] = (base[feature] || 0) + (learned[feature] || 0);
    });
    return base;
  }

  function visibleCount(state, tileKey) {
    const rivers = state?.rivers?.flat?.() || [];
    const meldTiles = state?.melds?.flatMap?.((melds) => melds.flatMap((meld) => meld.tiles || [])) || [];
    const dora = state?.dora || [];
    return [...rivers, ...meldTiles, ...dora].filter((tile) => keyOf(tile) === tileKey).length;
  }

  function dominantSuitInfo(tiles, meldTiles = []) {
    const all = [...tiles, ...meldTiles].filter(Boolean);
    const suitCounts = Object.fromEntries(["m", "p", "s"].map((suit) => [suit, all.filter((tile) => tile.suit === suit).length]));
    const dominantSuit = ["m", "p", "s"].sort((a, b) => suitCounts[b] - suitCounts[a])[0];
    return {
      dominantSuit,
      dominantCount: suitCounts[dominantSuit],
      offSuitCount: Object.entries(suitCounts).filter(([suit]) => suit !== dominantSuit).reduce((sum, [, count]) => sum + count, 0),
      honorCount: all.filter((tile) => tile.suit === "z").length
    };
  }

  function neighborShapeScore(tiles) {
    const counts = countMap(tiles);
    let score = 0;
    for (const suit of ["m", "p", "s"]) {
      for (let value = 1; value <= 9; value += 1) {
        const count = counts[`${suit}${value}`] || 0;
        if (!count) continue;
        if (counts[`${suit}${value - 1}`]) score += 0.35 * count;
        if (counts[`${suit}${value + 1}`]) score += 0.35 * count;
        if (counts[`${suit}${value - 2}`]) score += 0.15 * count;
        if (counts[`${suit}${value + 2}`]) score += 0.15 * count;
      }
    }
    return score;
  }

  function rareRouteScore(tiles, settings = {}) {
    const counts = countMap(tiles);
    const pairCount = Object.values(counts).filter((count) => count >= 2).length;
    const terminalHonorUnique = Object.keys(counts).filter((key) => {
      const suit = key[0];
      const value = Number(key.slice(1));
      return suit === "z" || value === 1 || value === 9;
    }).length;
    const flush = dominantSuitInfo(tiles);
    let score = 0;
    if (pairCount >= 4) score += pairCount * 0.8;
    if (terminalHonorUnique >= 8) score += (terminalHonorUnique - 7) * 0.65;
    if (flush.dominantCount >= 8) score += (flush.dominantCount - 7) * 0.55;
    if (settings.china && terminalHonorUnique >= 9) score += 1.2;
    return score;
  }

  function routePressureInfo(tiles, discardedTile, state, settings = {}, playerIndex = 0) {
    const counts = countMap(tiles);
    const pairCount = Object.values(counts).filter((count) => count >= 2).length;
    const tripletCount = Object.values(counts).filter((count) => count >= 3).length;
    const shape = neighborShapeScore(tiles);
    const flush = dominantSuitInfo(tiles, state?.melds?.[playerIndex]?.flatMap?.((meld) => meld.tiles || []) || []);
    const doraKeys = new Set((state?.dora || []).map(doraKeyFromIndicator));
    const doraCount = tiles.filter((tile) => doraKeys.has(keyOf(tile))).length;
    const valueHonorPairs = Object.entries(counts).filter(([key, count]) => {
      if (count < 2 || key[0] !== "z") return false;
      const value = Number(key.slice(1));
      return value >= 5 || value <= 4;
    }).length;
    const rare = rareRouteScore(tiles, settings);
    const readiness = Math.min(5, shape * 0.32 + pairCount * 0.55 + tripletCount * 0.9);
    const flushRoute = flush.dominantCount >= 7 ? (flush.dominantCount - 6) * 0.65 + Math.max(0, 2 - flush.offSuitCount) * 0.3 : 0;
    const yakuHints = Math.min(5, rare * 0.45 + flushRoute + doraCount * 0.45 + valueHonorPairs * 0.7 + tripletCount * 0.25);
    const flexible = readiness >= 2.2 ? Math.min(4, readiness * 0.35 + Math.min(3, yakuHints)) : 0;
    const highValue = Math.min(6, yakuHints + doraCount * 0.35 + (flush.dominantCount >= 10 ? 1.5 : 0));
    const wallCount = state?.wall?.length ?? 70;
    const dangerStage = wallCount < 42 ? (wallCount < 24 ? 1 : 0.55) : 0;
    const discardedKey = keyOf(discardedTile);
    const maxCopies = maxCopiesForKey(discardedKey, settings);
    const visible = Math.min(maxCopies, visibleCount(state, discardedKey));
    const unseenRatio = maxCopies ? Math.max(0, (maxCopies - visible) / maxCopies) : 0;
    const terminalHonorRisk = isTerminal(discardedTile) || isHonor(discardedTile) ? 0.78 : 1;
    return {
      readiness,
      flexible,
      highValue,
      dealInRisk: -dangerStage * unseenRatio * terminalHonorRisk
    };
  }

  function oracleAbilityFor(characterId, assignments = DEFAULT_ORACLE_ASSIGNMENTS) {
    return assignments?.[characterId] || DEFAULT_ORACLE_ASSIGNMENTS[characterId] || "kazuya_initial_hands";
  }

  function oracleShouldTrigger(abilityId, timing, state, playerIndex) {
    const ability = ORACLE_ABILITIES[abilityId] || ORACLE_ABILITIES.kazuya_initial_hands;
    if (ability.timing === "round_start") return timing === "round_start";
    if (ability.timing === "before_discard") return timing === "before_discard";
    if (ability.timing === "after_draw") return timing === "after_draw";
    if (ability.timing === "sixth_draw") {
      const draws = Number(state?.drawCounts?.[playerIndex] || 0);
      return timing === "after_draw" && draws > 0 && draws % 6 === 0;
    }
    return false;
  }

  function randomSymptom(rng) {
    const roll = rng();
    if (roll < 1 / 3) return "blank";
    if (roll < 2 / 3) return "wrong";
    return "noise";
  }

  function getOracleHint(options = {}) {
    const characterId = options.characterId || CHARACTER_IDS[options.playerIndex] || "kazuya";
    const playerIndex = options.playerIndex ?? CHARACTER_IDS.indexOf(characterId);
    const settings = options.settings || options.state?.settings || {};
    const assignments = options.assignments || DEFAULT_ORACLE_ASSIGNMENTS;
    const abilityId = oracleAbilityFor(characterId, assignments);
    const ability = ORACLE_ABILITIES[abilityId] || ORACLE_ABILITIES.kazuya_initial_hands;
    const timing = options.timing || "before_discard";
    const rng = options.rng || Math.random;
    if (!options.oracleEnabled || !oracleShouldTrigger(abilityId, timing, options.state, playerIndex)) {
      return { active: false, characterId, abilityId, timing, reliability: ability.reliability, scoreByKey: {}, observations: {} };
    }
    if (abilityId === "mayoi_wall_order") {
      const keys = allTileKeys(settings).filter(key => key[0] !== "f");
      const sequence = (options.state?.wall || []).slice(-18).reverse().map((tile, offset) => {
        const key = keyOf(tile);
        if (rng() < ability.reliability) return { offset, key };
        const symptom = randomSymptom(rng);
        if (symptom === "blank") return { offset, key: null };
        if (symptom === "wrong") return { offset, key: keys[Math.floor(rng() * keys.length)] };
        return rng() < 0.5 ? { offset, suit: tile.suit } : { offset, value: tile.value };
      });
      return { active: true, characterId, abilityId, timing, reliability: ability.reliability,
        wallCount: options.state?.wall?.length || 0, drawCount: options.state?.drawCounts?.[playerIndex] || 0,
        sequence, scoreByKey: {}, observations: {} };
    }
    const state = options.state || {};
    const opponents = [0, 1, 2, 3].filter(seat => seat !== playerIndex);
    const targetSeat = opponents.slice().sort((a, b) =>
      (state.players?.[b]?.score || 0) - (state.players?.[a]?.score || 0))[0];
    const seats = abilityId === "nanayo_leader_hand" ? [targetSeat] : opponents;
    const sources = seats.map(seat => ({ source: "hand", seat,
      observations: observeOracleTiles(state.hands?.[seat] || [], ability.reliability, settings, rng) }));
    if (abilityId === "ichino_wall_and_hands") sources.push({ source: "wall",
      observations: observeOracleTiles(state.wall || [], ability.reliability, settings, rng) });
    const hint = { active: true, characterId, abilityId, timing, reliability: ability.reliability,
      wallCount: state.wall?.length || 0, drawCount: state.drawCounts?.[playerIndex] || 0,
      sources, targetSeat: abilityId === "nanayo_leader_hand" ? targetSeat : null,
      publicCounts: oraclePublicCounts(state), scoreByKey: {}, observations: {} };
    if (abilityId === "kazuya_initial_hands") {
      const own = countMapByKey(state.hands?.[playerIndex] || []);
      const seen = oracleObservedCounts(sources, settings);
      const ranks = ["m", "p", "s"].map(suit => ({ suit, value: allTileKeys(settings)
        .filter(key => key[0] === suit).reduce((sum, key) => sum +
          (own[key] || 0) * 2 + Math.max(0, maxCopiesForKey(key, settings) - (own[key] || 0) - (seen[key] || 0)) * 0.15, 0) }));
      ranks.sort((a, b) => b.value - a.value);
      hint.initialPlan = { suit: ranks[0].suit, kind: "suit_affinity", scores: ranks };
    }
    return hint;
  }

  function observeOracleTiles(tiles, reliability, settings, rng) {
    const keys = allTileKeys(settings);
    const observations = tiles.map(tile => {
      if (rng() < reliability) return { key: keyOf(tile) };
      const symptom = randomSymptom(rng);
      if (symptom === "blank") return { key: null };
      if (symptom === "wrong") return { key: keys[Math.floor(rng() * keys.length)] };
      return rng() < 0.5 ? { suit: tile.suit } : { value: tile.value };
    });
    // These abilities see counts, not hidden hand order or wall order (unlike Mayoi).
    return observations.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  }

  function oraclePublicCounts(state) {
    const seen = new Set();
    const tiles = [...(state?.rivers || []).flat(), ...(state?.melds || [])
      .flatMap(melds => melds.flatMap(meld => meld.tiles || [])), ...(state?.dora || [])];
    return countMapByKey(tiles.filter(tile => {
      if (tile.id == null) return true;
      if (seen.has(tile.id)) return false;
      seen.add(tile.id);
      return true;
    }));
  }

  function oracleObservedCounts(sources, settings) {
    const counts = {};
    const keys = allTileKeys(settings);
    sources.forEach(source => source.observations.forEach(observation => {
      const candidates = observation.key ? [observation.key] : keys.filter(key =>
        (observation.suit && key[0] === observation.suit) ||
        (observation.value !== undefined && Number(key.slice(1)) === observation.value));
      candidates.forEach(key => { counts[key] = (counts[key] || 0) + 1 / candidates.length; });
    }));
    return counts;
  }

  function countOracleHint(context, snapshot) {
    const settings = context.settings || context.state?.settings || {};
    const publicCounts = oraclePublicCounts(context.state);
    const own = countMapByKey(context.hand || context.state?.hands?.[context.playerIndex] || []);
    const hands = oracleObservedCounts(snapshot.sources.filter(source => source.source === "hand"), settings);
    const wall = oracleObservedCounts(snapshot.sources.filter(source => source.source === "wall"), settings);
    const evidence = {}, scoreByKey = {}, availabilityByKey = {}, dangerByKey = {}, spillByKey = {};
    const age = Math.max(0.15, Math.min(1, (context.state?.wall?.length ?? snapshot.wallCount) / Math.max(1, snapshot.wallCount)));
    allTileKeys(settings).forEach(key => {
      const available = Math.max(0, maxCopiesForKey(key, settings) - (publicCounts[key] || 0) - (own[key] || 0));
      const newlyPublic = Math.max(0, (publicCounts[key] || 0) - (snapshot.publicCounts?.[key] || 0));
      const observed = (hands[key] || 0) + (wall[key] || 0);
      const factor = Math.min(1, available / Math.max(1, observed));
      const remainingObserved = Math.max(0, observed - newlyPublic);
      const publicFactor = observed ? remainingObserved / observed : 1;
      const confidence = snapshot.reliability * factor * publicFactor * age;
      const opponentCount = (hands[key] || 0) * confidence;
      const supply = snapshot.abilityId === "ichino_wall_and_hands"
        ? (wall[key] || 0) * confidence
        : Math.max(0, available - opponentCount) * snapshot.reliability * age * 0.35;
      availabilityByKey[key] = supply;
      dangerByKey[key] = Math.min(2, opponentCount * 0.35);
      // Isolated observed leader tiles are plausible future discards, not certain discards.
      const numeric = ["m", "p", "s"].includes(key[0]);
      const value = Number(key.slice(1));
      const nearby = numeric && [-2, -1, 1, 2].some(delta => {
        const next = settings.cosmic ? wrappedNumber(value + delta) : value + delta;
        return (hands[`${key[0]}${next}`] || 0) >= 0.75;
      });
      spillByKey[key] = snapshot.abilityId === "nanayo_leader_hand" && numeric &&
        (hands[key] || 0) > 0 && hands[key] < 1.5 && !nearby ? confidence * 0.7 : 0;
      const affinity = snapshot.initialPlan?.suit === key[0] && available > 0 ? 0.2 * age : 0;
      scoreByKey[key] = -Math.min(3, supply * 0.55 + spillByKey[key] + affinity);
      evidence[key] = { available, observed, newlyPublic, confidence, factor, publicFactor };
    });
    return { ...snapshot, evidence, scoreByKey, availabilityByKey, dangerByKey, spillByKey };
  }

  function oracleFeature(context, discardedTile) {
    if (!context.oracleEnabled) return 0;
    const key = keyOf(discardedTile);
    const hint = oracleHintForContext(context);
    return riverAdjustedOracleSignal(context, hint, key);
  }

  function oracleHintForContext(context) {
    if (!context.oracleEnabled) return { active: false, scoreByKey: {} };
    const current = context.oracleHint || getOracleHint({
      state: context.state,
      settings: context.settings,
      playerIndex: context.playerIndex,
      oracleEnabled: context.oracleEnabled,
      assignments: context.oracleAssignments,
      timing: context.oracleTiming || "before_discard"
    });
    const countSnapshots = [...(context.oracleHistory || []), current].filter(hint => hint?.active && hint.sources &&
      (!current?.abilityId || hint.abilityId === current.abilityId));
    if (countSnapshots.length) {
      const unique = countSnapshots.filter((hint, index, list) => index === list.findIndex(other =>
        other.abilityId === hint.abilityId && other.drawCount === hint.drawCount && other.wallCount === hint.wallCount));
      const latest = unique.at(-1);
      const matching = unique.filter(hint => hint.abilityId === latest.abilityId && hint.targetSeat === latest.targetSeat);
      const inferred = matching.map(hint => countOracleHint(context, hint));
      const result = { ...inferred.at(-1), historyCount: inferred.length };
      for (const field of ["scoreByKey", "availabilityByKey", "dangerByKey", "spillByKey"]) {
        const totalWeight = inferred.reduce((sum, _, i) => sum + Math.pow(0.72, inferred.length - 1 - i), 0);
        result[field] = Object.fromEntries(allTileKeys(context.settings || {}).map(key => [key,
          inferred.reduce((sum, hint, i) => sum + (hint[field][key] || 0) * Math.pow(0.72, inferred.length - 1 - i), 0) / totalWeight]));
      }
      return result;
    }
    const combined = combineOracleHistory(current, context.oracleHistory);
    if (combined?.abilityId === "mayoi_wall_order") {
      const snapshots = [...(context.oracleHistory || []), current].filter(hint => hint?.active && hint.sequence);
      const latest = snapshots.at(-1);
      if (latest) return orderedWallHint(context, latest);
    }
    return combined;
  }

  function orderedWallHint(context, snapshot) {
    const consumed = Math.max(0, snapshot.wallCount - (context.state?.wall?.length ?? snapshot.wallCount));
    const scoreByKey = {};
    const predictions = [];
    const settings = context.settings || context.state?.settings || {};
    const keys = allTileKeys(settings);
    const remainingObservations = snapshot.sequence.filter(item => item.offset >= consumed);
    const observedCounts = countMapByKey(remainingObservations.filter(item => item.key).map(item => ({
      suit: item.key[0], value: Number(item.key.slice(1))
    })));
    const ownHand = context.hand || context.state?.hands?.[context.playerIndex] || [];
    const publicTiles = [
      ...(context.state?.rivers || []).flat(),
      ...(context.state?.melds || []).flatMap(melds => melds.flatMap(meld => meld.tiles || [])),
      ...(context.state?.dora || [])
    ];
    // A called discard may briefly exist in both UI collections; count its physical ID once.
    const seenIds = new Set();
    const knownCounts = countMapByKey([...publicTiles, ...ownHand].filter(tile => {
      if (tile.id == null) return true;
      if (seenIds.has(tile.id)) return false;
      seenIds.add(tile.id);
      return true;
    }));
    const evidence = {};
    const confidenceFor = key => {
      const maximum = maxCopiesForKey(key, settings);
      const known = knownCounts[key] || 0;
      const available = Math.max(0, maximum - known);
      const observed = observedCounts[key] || 0;
      const factor = Math.min(1, available / Math.max(1, observed));
      evidence[key] = { maximum, known, available, observed, factor,
        reason: available === 0 ? "all_copies_known" : factor < 1 ? "observations_exceed_available" : "consistent" };
      return factor;
    };
    // Inference reads saved observations, public tiles and our own hand, never opponents' hands.
    for (const observation of snapshot.sequence) {
      const distance = observation.offset - consumed;
      if (distance < 0) continue;
      const seat = ((context.state?.turn ?? context.playerIndex) + 3 * (distance + 1)) % 4;
      if (seat !== context.playerIndex) continue;
      const candidates = observation.key ? [observation.key] : keys.filter(key =>
        (observation.suit && key[0] === observation.suit) ||
        (observation.value !== undefined && Number(key.slice(1)) === observation.value));
      const weight = 2.4 / (1 + distance / 4) / Math.max(1, candidates.length);
      const candidateConfidence = candidates.map(key => ({ key, factor: confidenceFor(key) }));
      candidateConfidence.forEach(({ key, factor }) => {
        scoreByKey[key] = (scoreByKey[key] || 0) - weight * factor;
      });
      predictions.push({ distance, seat, candidates: candidates.filter(key => evidence[key].factor > 0),
        candidateConfidence, confidence: Number(snapshot.reliability || 0.55) *
          candidateConfidence.reduce((sum, item) => sum + item.factor, 0) / Math.max(1, candidates.length) });
    }
    return { ...snapshot, scoreByKey, predictions, consumed, evidence };
  }

  function combineOracleHistory(current, history = []) {
    const activeHistory = (history || []).filter((hint) => hint?.active);
    if (!current?.active && !activeHistory.length) return current;
    const merged = current?.active ? clone(current) : clone(activeHistory[activeHistory.length - 1]);
    merged.historyCount = activeHistory.length;
    merged.historyApplied = activeHistory.length > 1 || (activeHistory.length === 1 && activeHistory[0] !== current);
    const weighted = {};
    const weights = {};
    activeHistory.slice().reverse().forEach((hint, index) => {
      const weight = Math.pow(0.72, index + 1) * Number(hint.reliability || 0.5);
      Object.entries(hint.scoreByKey || {}).forEach(([key, value]) => {
        weighted[key] = (weighted[key] || 0) + Number(value || 0) * weight;
        weights[key] = (weights[key] || 0) + weight;
      });
    });
    if (current?.active) {
      const weight = 1.15 * Number(current.reliability || 0.5);
      Object.entries(current.scoreByKey || {}).forEach(([key, value]) => {
        weighted[key] = (weighted[key] || 0) + Number(value || 0) * weight;
        weights[key] = (weights[key] || 0) + weight;
      });
    }
    merged.scoreByKey = Object.fromEntries(Object.keys(weights).map((key) => [key, weighted[key] / weights[key]]));
    merged.rawCurrentScoreByKey = current?.scoreByKey || {};
    return merged;
  }

  function maxCopiesForKey(key, settings = {}) {
    if (!key) return 4;
    if (key === "z5") return Number(settings.whiteCount || 4);
    if (key[0] === "f") return 1;
    return 4;
  }

  function riverAdjustedOracleSignal(context, hint, key) {
    if (!hint?.active || !key) return 0;
    const raw = Number(hint.scoreByKey?.[key] || 0);
    if (!raw) return 0;
    const settings = context.settings || context.state?.settings || {};
    const maxCopies = Math.max(1, maxCopiesForKey(key, settings));
    const visible = Math.max(0, Math.min(maxCopies, visibleCount(context.state, key)));
    const remainingRatio = Math.max(0, (maxCopies - visible) / maxCopies);
    const staleWall = Number(hint.wallCount || context.state?.wall?.length || 0);
    const currentWall = Number(context.state?.wall?.length || staleWall);
    const ageRatio = staleWall > 0 ? Math.max(0.35, Math.min(1, currentWall / staleWall)) : 1;
    if (raw < 0) return raw * (0.25 + remainingRatio * 0.75) * ageRatio;
    return raw * (0.35 + (1 - remainingRatio) * 0.45 + remainingRatio * 0.2) * ageRatio;
  }

  function wrappedNumber(value) {
    return ((value - 1 + 9) % 9) + 1;
  }

  function addUsefulNumericKeys(keys, suit, value, settings) {
    const add = (nextValue) => {
      if (settings.cosmic) keys.add(`${suit}${wrappedNumber(nextValue)}`);
      else if (nextValue >= 1 && nextValue <= 9) keys.add(`${suit}${nextValue}`);
    };
    [-2, -1, 1, 2].forEach((delta) => add(value + delta));
  }

  function usefulTileKeys(tiles, settings = {}) {
    const keys = new Set();
    const counts = countMap(tiles);
    Object.keys(counts).forEach((key) => {
      const suit = key[0];
      const value = Number(key.slice(1));
      const count = counts[key] || 0;
      if (count <= 2) keys.add(key);
      if (["m", "p", "s"].includes(suit)) {
        addUsefulNumericKeys(keys, suit, value, settings);
      } else if (settings.cosmic && suit === "z") {
        if (value <= 4) [1, 2, 3, 4].forEach((item) => keys.add(`z${item}`));
        else [5, 6, 7].forEach((item) => keys.add(`z${item}`));
      }
    });
    return [...keys].filter((key) => key && key[0] !== "f");
  }

  function oracleUkeireFeatures(context, remaining) {
    if (!context.oracleEnabled) return { oracleUkeire: 0, oracleTempo: 0, oracleDanger: 0 };
    const hint = oracleHintForContext(context);
    if (!hint?.active) return { oracleUkeire: 0, oracleTempo: 0, oracleDanger: 0 };
    const useful = usefulTileKeys(remaining, context.settings || context.state?.settings || {});
    if (!useful.length) return { oracleUkeire: 0, oracleTempo: 0, oracleDanger: 0 };
    const usefulSignals = useful.map((key) => hint.availabilityByKey
      ? (hint.availabilityByKey[key] || 0) + (hint.spillByKey?.[key] || 0)
      : -riverAdjustedOracleSignal(context, hint, key));
    const positiveUseful = usefulSignals.filter((value) => value > 0);
    const oracleUkeire = Math.min(4, positiveUseful.reduce((sum, value) => sum + value, 0) / Math.max(3, useful.length));
    const oracleTempo = Math.min(3, Math.max(0, ...usefulSignals));
    const dangerStage = (context.state?.wall?.length || 70) < 30 ? 1 : 0;
    const discardSignal = riverAdjustedOracleSignal(context, hint, keyOf(context.discardedTile));
    const dangerPressure = hint.dangerByKey ? (hint.dangerByKey[keyOf(context.discardedTile)] || 0)
      : discardSignal < 0 ? Math.abs(discardSignal) : Math.abs(discardSignal) * 0.55;
    const oracleDanger = dangerStage ? -Math.min(3, dangerPressure) : 0;
    return { oracleUkeire, oracleTempo, oracleDanger };
  }

  function leaderSeat(state) {
    const scores = state?.players?.map?.((player) => player.score) || [];
    if (!scores.length && state?.hands) return 0;
    let best = 0;
    for (let i = 1; i < scores.length; i += 1) if (scores[i] > scores[best]) best = i;
    return best;
  }

  function extractFeatures(context) {
    const remaining = context.remainingTiles || [];
    const before = context.hand || [...remaining, context.discardedTile].filter(Boolean);
    const discarded = context.discardedTile;
    const settings = context.settings || context.state?.settings || {};
    const playerIndex = context.playerIndex || 0;
    const counts = countMap(remaining);
    const beforeCounts = countMap(before);
    const meldTiles = context.state?.melds?.[playerIndex]?.flatMap?.((meld) => meld.tiles || []) || [];
    const flush = dominantSuitInfo(remaining, meldTiles);
    const doraKeys = new Set((context.state?.dora || []).map(doraKeyFromIndicator));
    const key = keyOf(discarded);
    const roundWind = context.roundWind || 1;
    const seatWind = context.seatWind || 1;
    const visible = context.visibleCount !== undefined ? context.visibleCount : visibleCount(context.state, key);
    const maxCopies = key === "z5" ? Number(settings.whiteCount || 4) : 4;
    const beforeCount = beforeCounts[key] || 0;
    const afterCount = counts[key] || 0;
    const keepsPair = afterCount >= 2 ? 1 : 0;
    const keepsTriplet = afterCount >= 3 ? 1 : 0;
    const valueHonor = isValueHonor(discarded, playerIndex, roundWind, seatWind) ? 1 : 0;
    const discardedOffSuit = discarded && ["m", "p", "s"].includes(discarded.suit) && discarded.suit !== flush.dominantSuit ? 1 : 0;
    const keepsFlushSuit = discarded && discarded.suit === flush.dominantSuit ? -1 : 0;
    const dangerStage = (context.state?.wall?.length || 70) < 30 ? 1 : 0;
    const oracleFeatures = oracleUkeireFeatures(context, remaining);
    const route = routePressureInfo(remaining, discarded, context.state, settings, playerIndex);
    return {
      baseShape: neighborShapeScore(remaining),
      keepsPair,
      keepsTriplet,
      keepsDora: doraKeys.has(key) ? -1 : 0,
      keepsValueHonor: valueHonor ? -1 : 0,
      keepsWhite: key === "z5" && settings.whiteStorm ? -Math.min(3, beforeCount) : 0,
      keepsTerminal: (isTerminal(discarded) || isHonor(discarded)) ? -0.25 : 0,
      discardSafe: Math.min(1, visible / Math.max(1, maxCopies - 1)),
      discardOffSuitForFlush: flush.dominantCount >= 7 ? discardedOffSuit : 0,
      keepsFlushSuit: flush.dominantCount >= 7 ? keepsFlushSuit : 0,
      rareRoute: rareRouteScore(remaining, settings),
      callAggression: context.state?.melds?.[playerIndex]?.length ? 1 : 0,
      defense: dangerStage * Math.min(1, visible / 3),
      fastTenpai: route.readiness,
      flexibleYakuRoute: route.flexible,
      highValueRoute: route.highValue,
      dealInRisk: route.dealInRisk,
      oracleKeep: oracleFeature(context, discarded),
      oracleUkeire: oracleFeatures.oracleUkeire,
      oracleTempo: oracleFeatures.oracleTempo,
      oracleDanger: oracleFeatures.oracleDanger
    };
  }

  function dot(weights, features) {
    return FEATURE_KEYS.reduce((sum, key) => sum + (weights[key] || 0) * (features[key] || 0), 0);
  }

  function mayoiStrategy(context) {
    const playerIndex = context.playerIndex;
    const scores = context.state?.players?.map((player) => player.score) || [];
    const ownScore = scores[playerIndex];
    const deficit = Number.isFinite(ownScore) ? Math.max(0, Math.max(...scores) - ownScore) : 0;
    const comeback = Math.min(1, Math.max(0, (deficit - 4000) / 12000));
    const hand = context.hand || [...(context.remainingTiles || []), context.discardedTile].filter(Boolean);
    const meldTiles = (context.state?.melds?.[playerIndex] || []).flatMap((meld) => meld.tiles || []);
    const flush = dominantSuitInfo(hand, meldTiles);
    const compatible = meldTiles.every((tile) => tile.suit === "z" || tile.suit === flush.dominantSuit);
    // Use the pre-discard hand so every candidate shares the same strategic weights.
    const concentration = flush.dominantCount + Math.min(3, flush.honorCount);
    const flushCommitment = compatible && flush.dominantCount >= 7
      ? Math.min(1, Math.max(0, (concentration - 7) / 4)) : 0;
    return { comeback, flushCommitment };
  }

  function scoreDiscard(context) {
    const characterId = CHARACTER_IDS[context.playerIndex] || "kazuya";
    const key = context.ruleKey || ruleKey(context.settings || context.state?.settings || {}, !!context.oracleEnabled, context.oracleAssignments);
    const weights = { ...mergedWeights(context.learningData, key, characterId, context.useLearning) };
    const strategy = characterId === "mayoi" ? mayoiStrategy(context) : null;
    if (strategy) {
      const ambition = Math.max(strategy.comeback, strategy.flushCommitment);
      weights.fastTenpai *= 1 - ambition * 0.6;
      weights.highValueRoute += ambition * 1.5;
      weights.keepsDora += strategy.comeback * 0.8;
      weights.discardOffSuitForFlush += strategy.flushCommitment * 2;
      weights.keepsFlushSuit += strategy.flushCommitment * 2;
    }
    const features = extractFeatures(context);
    const strength = Math.max(1, Math.min(5, Number(context.strength || 3)));
    const score = dot(weights, features) * (0.45 + strength * 0.22);
    const tags = thinkingTags(features, characterId, context.oracleEnabled);
    if (strategy?.flushCommitment >= 0.5) tags.unshift("committed_flush");
    else if (strategy?.comeback >= 0.5) tags.unshift("comeback_value");
    return { score, features, tags, weights, strategy };
  }

  function thinkingTags(features, characterId, oracleEnabled) {
    const tags = [];
    if (features.discardOffSuitForFlush > 0 || features.keepsFlushSuit < 0) tags.push("flush_route");
    if (features.rareRoute > 2.5) tags.push("rare_yaku_route");
    if (features.highValueRoute > 3.2) tags.push("high_value_route");
    if (features.fastTenpai > 3.2 && features.flexibleYakuRoute > 1.6) tags.push("fast_ready_route");
    if (features.defense > 0.35 || features.discardSafe > 0.75) tags.push("defending");
    if (features.keepsValueHonor < 0 || features.keepsWhite < 0) tags.push("value_honor_hold");
    if (features.callAggression > 0) tags.push("open_hand");
    if (!tags.length) tags.push(characterId === "kazuya" ? "balanced" : "shaping");
    return tags;
  }

  function thoughtLine(characterId, tags = []) {
    const catalog = {
      kazuya: {
        balanced: "まずは普通に……！",
        flush_route: "ふむ、このまとまりは少し見ておきたい。",
        rare_yaku_route: "珍しい形だが、まだ理にはかなっている。",
        high_value_route: "打点は見える。けれど遠回りしすぎないように。",
        fast_ready_route: "まずテンパイ速度を落とさずにまとめよう。",
        defending: "ここは通りやすさも見ておこう。",
        value_honor_hold: "役牌は急いで手放さない方が良さそうだ。",
        oracle_noise: "最初に見えた完成形から、少し外れないように。"
      },
      ichino: {
        shaping: "んー、この牌はまだ声がするかも。",
        flush_route: "この色、寄せたら気持ちよさそう！",
        rare_yaku_route: "変な形だけど、嫌いじゃないよ。",
        high_value_route: "高い方へ寄せても、まだ間に合いそう！",
        fast_ready_route: "早く形にできるなら、それもいいよね。",
        defending: "危なそうなら、ちょっと引くね。",
        value_honor_hold: "白や字牌は、まだ寝かせておきたいな。",
        oracle_noise: "今、ちらっと見えた気がした。半分だけ信じるね。"
      },
      nanayo: {
        shaping: "安くまとめるより、もう少し飾りたいな！",
        flush_route: "染める筋、かなり綺麗に見えるよ。",
        rare_yaku_route: "この局、レア役の匂いがする！",
        high_value_route: "打点の飾りつけ、かなりいい感じ！",
        fast_ready_route: "高く見ながら、まとまったらすぐ決めたいね。",
        defending: "勝っている相手の河は、よく見ておくよ！",
        value_honor_hold: "役牌を軸に、打点を育てたいところだね。",
        oracle_noise: "一位の手、少しだけ輪郭が見えたかも。"
      },
      mayoi: {
        committed_flush: "ここまで色が集まったなら、大きく仕上げたいね。",
        comeback_value: "この点差なら、速さだけでなく打点も育てたい。",
        shaping: "序盤なら、速度を少し優先したいかな。",
        flush_route: "点になるなら、寄せる価値はあるね。",
        rare_yaku_route: "高いけど遠い。点棒状況次第だね。",
        high_value_route: "この打点なら、少し押す価値はありそう。",
        fast_ready_route: "速度を保てる形は大事にしたい。",
        defending: "今は失点を抑える方が大事そう。",
        value_honor_hold: "鳴ける役牌なら、早く決めたい。",
        oracle_noise: "次のツモの近さだけ、少し気になる。"
      }
    };
    const table = catalog[characterId] || catalog.kazuya;
    const tag = tags.find((item) => table[item]) || "shaping";
    return table[tag] || table.shaping || "";
  }

  function loadLearningData(storage = window.localStorage) {
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return defaultLearningData();
      const parsed = JSON.parse(raw);
      return parsed?.format === "mizuhara-mahjong-ai-learning-v1" ? parsed : defaultLearningData();
    } catch {
      return defaultLearningData();
    }
  }

  function saveLearningData(data, storage = window.localStorage) {
    const next = data || defaultLearningData();
    next.updatedAt = new Date().toISOString();
    storage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  }

  function randomTileBag(settings = {}) {
    const bag = [];
    let serial = 0;
    for (const suit of ["m", "p", "s"]) {
      for (let value = 1; value <= 9; value += 1) {
        for (let copy = 0; copy < 4; copy += 1) bag.push({ suit, value, id: `${suit}${value}-${serial++}` });
      }
    }
    for (let value = 1; value <= 7; value += 1) {
      const copies = value === 5 ? Number(settings.whiteCount || 4) : 4;
      for (let copy = 0; copy < copies; copy += 1) bag.push({ suit: "z", value, id: `z${value}-${serial++}` });
    }
    return bag;
  }

  function shuffle(items, rng = Math.random) {
    const arr = items.slice();
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function heuristicDiscardScore(context) {
    const features = extractFeatures(context);
    return features.baseShape * 0.3
      + features.keepsPair * 1.4
      + features.keepsTriplet * 1.3
      + features.keepsDora * 2.2
      + features.keepsValueHonor * 1.3
      + features.keepsWhite * 0.9
      + features.discardOffSuitForFlush * 1.4
      + features.keepsFlushSuit * 1.3
      + features.rareRoute * 0.75
      + features.discardSafe * 0.45
      + features.fastTenpai * 0.95
      + features.flexibleYakuRoute * 0.7
      + features.highValueRoute * 0.85
      + features.dealInRisk * 1.15
      + features.oracleUkeire * 0.55
      + features.oracleTempo * 0.45
      + features.oracleDanger * 0.55;
  }

  function trainLearningData(data, options = {}) {
    const next = data || defaultLearningData();
    const settings = options.settings || {};
    const oracleEnabled = !!options.oracleEnabled;
    const oracleAssignments = options.oracleAssignments || DEFAULT_ORACLE_ASSIGNMENTS;
    const key = options.ruleKey || ruleKey(settings, oracleEnabled, oracleAssignments);
    const characterId = options.characterId || "kazuya";
    const profile = ensureProfile(next, key, characterId);
    const iterations = Math.max(1, Number(options.iterations || 1000));
    const lr = Number(options.learningRate || 0.012);
    let changed = 0;
    let rewardTotal = 0;
    for (let step = 0; step < iterations; step += 1) {
      const bag = shuffle(randomTileBag(settings));
      const hand = bag.slice(0, 14);
      const playerIndex = CHARACTER_IDS.indexOf(characterId);
      let offset = 14;
      const hands = CHARACTER_IDS.map((_, seat) => {
        if (seat === playerIndex) return hand;
        const otherHand = bag.slice(offset, offset + 13);
        offset += 13;
        return otherHand;
      });
      const mockState = {
        settings,
        rivers: [bag.slice(53, 57), bag.slice(57, 61), bag.slice(61, 65), bag.slice(65, 69)],
        melds: [[], [], [], []],
        dora: [bag[69]],
        wall: bag.slice(70),
        hands,
        turn: playerIndex,
        drawCounts: [6, 6, 6, 6],
        players: CHARACTER_NAMES.map((name, index) => ({ name, score: 25000 + (index === 2 ? 1000 : 0) }))
      };
      const oracleHint = getOracleHint({
        state: mockState,
        settings,
        playerIndex,
        characterId,
        oracleEnabled,
        timing: oracleAbilityFor(characterId, oracleAssignments) === "kazuya_initial_hands" ? "round_start" : "after_draw",
        assignments: oracleAssignments
      });
      const candidates = hand.map((tile, index) => {
        const remainingTiles = hand.filter((_, tileIndex) => tileIndex !== index);
        const context = { state: mockState, settings, hand, remainingTiles, discardedTile: tile, playerIndex, learningData: next, ruleKey: key, useLearning: true, oracleEnabled, oracleAssignments, oracleHint };
        return {
          tile,
          features: extractFeatures(context),
          learned: scoreDiscard(context).score,
          target: heuristicDiscardScore(context)
        };
      });
      const chosen = candidates.slice().sort((a, b) => b.learned - a.learned)[0];
      const target = candidates.slice().sort((a, b) => b.target - a.target)[0];
      const reward = target.target - chosen.target;
      rewardTotal += reward;
      if (target !== chosen) {
        FEATURE_KEYS.forEach((feature) => {
          const delta = (target.features[feature] || 0) - (chosen.features[feature] || 0);
          profile.weights[feature] = Math.max(-6, Math.min(6, (profile.weights[feature] || 0) + delta * lr));
        });
        changed += 1;
      }
    }
    profile.games += iterations;
    profile.updates += changed;
    profile.stats.averageReward = ((profile.stats.averageReward || 0) + rewardTotal / iterations) / 2;
    next.updatedAt = new Date().toISOString();
    return { data: next, stats: { iterations, changed, key, characterId, averageReward: rewardTotal / iterations } };
  }

  window.MizuharaAI = {
    STORAGE_KEY,
    VERSION,
    CHARACTER_IDS,
    CHARACTER_NAMES,
    FEATURE_KEYS,
    CHARACTER_PRESETS,
    DEFAULT_ORACLE_ASSIGNMENTS,
    ORACLE_ABILITIES,
    defaultLearningData,
    ensureProfile,
    ruleKey,
    mergedWeights,
    extractFeatures,
    getOracleHint,
    orderedWallHint,
    countOracleHint,
    oracleHintForContext,
    scoreDiscard,
    thoughtLine,
    loadLearningData,
    saveLearningData,
    trainLearningData
  };
}());
