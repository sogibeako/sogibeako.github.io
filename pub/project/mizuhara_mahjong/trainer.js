(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const ai = window.MizuharaAI;
  let learningData = ai.loadLearningData();

  const el = {
    character: $("trainerCharacter"),
    strength: $("trainerStrength"),
    flowers: $("trainerFlowers"),
    whiteStorm: $("trainerWhiteStorm"),
    cosmic: $("trainerCosmic"),
    china: $("trainerChina"),
    oracle: $("trainerOracle"),
    oraclePreset: $("trainerOraclePreset"),
    oracleSelects: {
      kazuya: $("oracleKazuya"),
      ichino: $("oracleIchino"),
      nanayo: $("oracleNanayo"),
      mayoi: $("oracleMayoi")
    },
    whiteCount: $("trainerWhiteCount"),
    iterations: $("trainerIterations"),
    trainOnce: $("trainOnceBtn"),
    trainAll: $("trainAllBtn"),
    exportLearning: $("exportLearningBtn"),
    importLearning: $("importLearningInput"),
    resetLearning: $("resetLearningBtn"),
    status: $("trainerStatus"),
    weights: $("trainerWeights")
  };

  const ABILITY_LABELS = {
    kazuya_initial_hands: "一彌型: 局開始に配牌の輪郭",
    ichino_wall_and_hands: "一埜型: ツモ番ごとに山と他家枚数",
    nanayo_leader_hand: "ななよ型: 一位の手牌",
    mayoi_wall_order: "真宵型: 6ツモごとに山順"
  };

  const localDev = ["127.0.0.1", "localhost", ""].includes(location.hostname);
  if (!localDev) {
    [el.trainOnce, el.trainAll, el.exportLearning, el.importLearning, el.resetLearning].forEach((node) => {
      if (node) node.disabled = true;
    });
  }

  function fillOracleSelects() {
    const options = Object.entries(ABILITY_LABELS)
      .map(([value, label]) => `<option value="${value}">${label}</option>`)
      .join("");
    Object.values(el.oracleSelects).forEach((select) => {
      select.innerHTML = options;
    });
  }

  function applyOraclePreset() {
    const preset = el.oraclePreset.value;
    let assignments = { ...ai.DEFAULT_ORACLE_ASSIGNMENTS };
    const allMap = {
      all_kazuya: "kazuya_initial_hands",
      all_ichino: "ichino_wall_and_hands",
      all_nanayo: "nanayo_leader_hand",
      all_mayoi: "mayoi_wall_order"
    };
    if (allMap[preset]) {
      assignments = Object.fromEntries(ai.CHARACTER_IDS.map((id) => [id, allMap[preset]]));
    }
    if (preset !== "custom") {
      ai.CHARACTER_IDS.forEach((id) => {
        el.oracleSelects[id].value = assignments[id] || ai.DEFAULT_ORACLE_ASSIGNMENTS[id];
      });
    }
    renderStatus();
  }

  function oracleAssignments() {
    return Object.fromEntries(ai.CHARACTER_IDS.map((id) => [
      id,
      el.oracleSelects[id]?.value || ai.DEFAULT_ORACLE_ASSIGNMENTS[id]
    ]));
  }

  function settings() {
    const whiteStorm = el.whiteStorm.checked;
    return {
      presetId: "trainer",
      flowers: el.flowers.checked,
      whiteStorm,
      cosmic: el.cosmic.checked,
      china: el.china.checked,
      whiteCount: whiteStorm ? Math.max(5, Number(el.whiteCount.value || 12)) : Number(el.whiteCount.value || 4)
    };
  }

  function currentRuleKey() {
    return ai.ruleKey(settings(), el.oracle.checked, oracleAssignments());
  }

  function assignmentSummary() {
    const assignments = oracleAssignments();
    return ai.CHARACTER_IDS
      .map((id) => `${ai.CHARACTER_NAMES[ai.CHARACTER_IDS.indexOf(id)]}: ${ABILITY_LABELS[assignments[id]] || assignments[id]}`)
      .join(" / ");
  }

  function renderStatus(lastStats = null) {
    const rule = currentRuleKey();
    const character = el.character.value;
    const profile = ai.ensureProfile(learningData, rule, character);
    const merged = ai.mergedWeights(learningData, rule, character, true);
    const learnedProfiles = Object.keys(learningData?.profiles?.[rule] || {}).length;
    el.status.innerHTML = `
      <div class="trainer-summary">
        ${localDev ? "" : "<strong>この学習ラボはローカル環境専用です。</strong>"}
        <strong>${ai.CHARACTER_NAMES[ai.CHARACTER_IDS.indexOf(character)]}</strong>
        <span>ルール: ${rule}</span>
        <span>強さ Lv${el.strength.value}</span>
        <span>学習済みキャラ: ${learnedProfiles}人</span>
        <span>選択キャラ局面: ${profile.games.toLocaleString()}</span>
        <span>選択キャラ更新: ${profile.updates.toLocaleString()}</span>
        <span>オラクル: ${el.oracle.checked ? assignmentSummary() : "OFF"}</span>
        ${lastStats ? `<span>今回: ${lastStats.iterations.toLocaleString()}局面 / 更新 ${lastStats.changed.toLocaleString()}${lastStats.characterId ? ` / ${lastStats.characterId}` : ""}</span>` : ""}
      </div>
    `;
    el.weights.textContent = JSON.stringify({
      profile,
      effectiveWeights: merged,
      oracleAssignments: oracleAssignments(),
      profilesForRule: learningData?.profiles?.[rule] || {}
    }, null, 2);
  }

  function trainCharacter(characterId) {
    return ai.trainLearningData(learningData, {
      settings: settings(),
      oracleEnabled: el.oracle.checked,
      oracleAssignments: oracleAssignments(),
      characterId,
      iterations: Number(el.iterations.value || 5000),
      strength: Number(el.strength.value || 3)
    });
  }

  function setTrainingBusy(busy, all = false) {
    el.trainOnce.disabled = busy || !localDev;
    el.trainAll.disabled = busy || !localDev;
    el.trainOnce.textContent = busy && !all ? "学習中..." : "学習を回す";
    el.trainAll.textContent = busy && all ? "全員学習中..." : "全員まとめて学習";
  }

  el.trainOnce.addEventListener("click", () => {
    setTrainingBusy(true);
    setTimeout(() => {
      const result = trainCharacter(el.character.value);
      learningData = ai.saveLearningData(result.data);
      setTrainingBusy(false);
      renderStatus(result.stats);
    }, 20);
  });

  el.trainAll.addEventListener("click", () => {
    setTrainingBusy(true, true);
    setTimeout(() => {
      let lastStats = null;
      for (const characterId of ai.CHARACTER_IDS) {
        const result = trainCharacter(characterId);
        learningData = result.data;
        lastStats = result.stats;
      }
      learningData = ai.saveLearningData(learningData);
      setTrainingBusy(false, true);
      renderStatus(lastStats);
    }, 20);
  });

  el.exportLearning.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(learningData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mizuhara-ai-learning-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  el.importLearning.addEventListener("change", async () => {
    const file = el.importLearning.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (parsed.format !== "mizuhara-mahjong-ai-learning-v1") {
      alert("水原麻雀AI学習データではありません。");
      return;
    }
    learningData = ai.saveLearningData(parsed);
    renderStatus();
  });

  el.resetLearning.addEventListener("click", () => {
    learningData = ai.saveLearningData(ai.defaultLearningData());
    renderStatus();
  });

  [el.character, el.strength, el.flowers, el.whiteStorm, el.cosmic, el.china, el.oracle, el.whiteCount].forEach((node) => {
    node.addEventListener("input", () => renderStatus());
    node.addEventListener("change", () => renderStatus());
  });

  el.oraclePreset.addEventListener("change", applyOraclePreset);
  Object.values(el.oracleSelects).forEach((select) => {
    select.addEventListener("change", () => {
      el.oraclePreset.value = "custom";
      renderStatus();
    });
  });

  fillOracleSelects();
  applyOraclePreset();
}());
