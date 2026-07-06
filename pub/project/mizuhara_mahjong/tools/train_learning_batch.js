#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const projectDir = path.resolve(__dirname, "..");
const aiCorePath = path.join(projectDir, "ai_core.js");
const outputDirDefault = path.join(projectDir, "learning-data");

const ORACLE_ASSIGNMENTS = {
  kazuya: "kazuya_initial_hands",
  ichino: "ichino_wall_and_hands",
  nanayo: "nanayo_leader_hand",
  mayoi: "mayoi_wall_order"
};

const RULES = [
  rule("basic", "標準リーチ", "mizuhara-ai-learning-basic", {}, false),
  rule("basic-oracle", "標準リーチ + オラクル", "mizuhara-ai-learning-oracle", {}, true),
  rule("white12", "白12", "mizuhara-ai-learning-white12", { whiteStorm: true, whiteCount: 12 }, false),
  rule("white12-oracle", "白12 + オラクル", "mizuhara-ai-learning-white12-oracle", { whiteStorm: true, whiteCount: 12 }, true),
  rule("chinese", "中国麻将役", "mizuhara-ai-learning-chinese", { china: true }, false),
  rule("chinese-oracle", "中国麻将役 + オラクル", "mizuhara-ai-learning-chinese-oracle", { china: true }, true),
  rule("cosmic", "宇宙麻雀", "mizuhara-ai-learning-cosmic", { cosmic: true }, false),
  rule("cosmic-oracle", "宇宙麻雀 + オラクル", "mizuhara-ai-learning-cosmic-oracle", { cosmic: true }, true),
  rule("flower", "花牌", "mizuhara-ai-learning-flower", { flowers: true }, false),
  rule("flower-oracle", "花牌 + オラクル", "mizuhara-ai-learning-flower-oracle", { flowers: true }, true),
  rule("flower-chinese", "花牌 + 中国麻将役", "mizuhara-ai-learning-flower-chinese", { flowers: true, china: true }, false),
  rule("flower-chinese-oracle", "花牌 + 中国麻将役 + オラクル", "mizuhara-ai-learning-flower-chinese-oracle", { flowers: true, china: true }, true),
  rule("flower-chinese-cosmic-white12", "花牌 + 中国麻将役 + 宇宙麻雀 + 白12", "mizuhara-ai-learning-flower-chinese-cosmic-white12", { flowers: true, china: true, cosmic: true, whiteStorm: true, whiteCount: 12 }, false),
  rule("flower-chinese-cosmic-white12-oracle", "花牌 + 中国麻将役 + 宇宙麻雀 + 白12 + オラクル", "mizuhara-ai-learning-flower-chinese-cosmic-white12-oracle", { flowers: true, china: true, cosmic: true, whiteStorm: true, whiteCount: 12 }, true),
  rule("flower-chinese-cosmic-white24", "花牌 + 中国麻将役 + 宇宙麻雀 + 白24", "mizuhara-ai-learning-flower-chinese-cosmic-white24", { flowers: true, china: true, cosmic: true, whiteStorm: true, whiteCount: 24 }, false),
  rule("flower-chinese-cosmic-white24-oracle", "花牌 + 中国麻将役 + 宇宙麻雀 + 白24 + オラクル", "mizuhara-ai-learning-flower-chinese-cosmic-white24-oracle", { flowers: true, china: true, cosmic: true, whiteStorm: true, whiteCount: 24 }, true)
];

function rule(id, title, slug, patch = {}, oracle = false) {
  const settings = {
    presetId: "trainer",
    flowers: false,
    whiteStorm: false,
    cosmic: false,
    china: false,
    whiteCount: 4,
    ...patch
  };
  if (settings.whiteStorm && settings.whiteCount < 5) settings.whiteCount = 12;
  if (!settings.whiteStorm) settings.whiteCount = 4;
  return { id, title, slug, settings, oracle };
}

function parseArgs(argv) {
  const args = {
    iterations: 50000,
    strength: 5,
    learningRate: 0.012,
    outputDir: outputDirDefault,
    rules: null,
    dryRun: false,
    noCatalog: false,
    list: false
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => argv[++index];
    if (arg === "--iterations" || arg === "-n") args.iterations = Number(next());
    else if (arg === "--strength") args.strength = Number(next());
    else if (arg === "--learning-rate") args.learningRate = Number(next());
    else if (arg === "--output-dir") args.outputDir = path.resolve(next());
    else if (arg === "--rules") args.rules = next().split(",").map((item) => item.trim()).filter(Boolean);
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--no-catalog") args.noCatalog = true;
    else if (arg === "--list") args.list = true;
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  if (!Number.isFinite(args.iterations) || args.iterations < 1) throw new Error("--iterations must be a positive number");
  if (!Number.isFinite(args.strength) || args.strength < 1 || args.strength > 5) throw new Error("--strength must be 1..5");
  return args;
}

function printHelp() {
  console.log(`Mizuhara Mahjong batch trainer

Usage:
  node tools/train_learning_batch.js [options]

Options:
  --iterations, -n <num>    Iterations per character per rule. Default: 50000
  --strength <1..5>         Label and training strength value. Default: 5
  --learning-rate <num>     Weight update rate. Default: 0.012
  --rules <ids>             Comma-separated rule ids. Use --list to see ids.
  --output-dir <path>       Output directory. Default: ../learning-data
  --dry-run                 Show planned files without writing.
  --no-catalog              Do not update learning-data/catalog.js.
  --list                    Print available rule ids.
`);
}

function loadAiCore() {
  const localStorage = {
    data: new Map(),
    getItem(key) {
      return this.data.has(key) ? this.data.get(key) : null;
    },
    setItem(key, value) {
      this.data.set(key, String(value));
    }
  };
  const sandbox = {
    window: { localStorage },
    localStorage,
    console,
    Math,
    Date,
    JSON,
    setTimeout,
    clearTimeout
  };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(aiCorePath, "utf8"), sandbox, { filename: aiCorePath });
  return sandbox.window.MizuharaAI;
}

function selectedRules(args) {
  if (!args.rules) return RULES;
  const byId = new Map(RULES.map((item) => [item.id, item]));
  return args.rules.map((id) => {
    const found = byId.get(id);
    if (!found) throw new Error(`Unknown rule id: ${id}`);
    return found;
  });
}

function prefixFor(ruleItem) {
  return [
    ruleItem.settings.flowers ? "1" : "0",
    ruleItem.settings.cosmic ? "1" : "0",
    ruleItem.settings.china ? "1" : "0",
    ruleItem.oracle ? "1" : "0",
    String(ruleItem.settings.whiteCount).padStart(2, "0")
  ].join("");
}

function fileNameFor(ruleItem, args) {
  return `${prefixFor(ruleItem)}_${ruleItem.slug}-Lv${args.strength}-${args.iterations}.json`;
}

function trainRule(ai, ruleItem, args) {
  let data = ai.defaultLearningData();
  const ruleKey = ai.ruleKey(ruleItem.settings, ruleItem.oracle, ORACLE_ASSIGNMENTS);
  for (const characterId of ai.CHARACTER_IDS) {
    const result = ai.trainLearningData(data, {
      settings: ruleItem.settings,
      oracleEnabled: ruleItem.oracle,
      oracleAssignments: ORACLE_ASSIGNMENTS,
      ruleKey,
      characterId,
      iterations: args.iterations,
      strength: args.strength,
      learningRate: args.learningRate
    });
    data = result.data;
    const profile = data.profiles[ruleKey][characterId];
    console.log(`    ${characterId.padEnd(6)} games=${String(profile.games).padStart(7)} updates=${String(profile.updates).padStart(7)} avgReward=${result.stats.averageReward.toFixed(4)}`);
  }
  data.meta = {
    title: `${ruleItem.title} / Lv${args.strength} / ${args.iterations.toLocaleString()}`,
    ruleId: ruleItem.id,
    generatedAt: new Date().toISOString(),
    settings: ruleItem.settings,
    oracleEnabled: ruleItem.oracle,
    oracleAssignments: ruleItem.oracle ? ORACLE_ASSIGNMENTS : null,
    iterationsPerCharacter: args.iterations,
    strength: args.strength,
    learningRate: args.learningRate
  };
  return data;
}

function writeCatalog(entries, outputDir) {
  const rel = (file) => `learning-data/${path.basename(file)}`;
  const body = `(function () {
  "use strict";

  window.MizuharaLearningCatalog = ${JSON.stringify(entries.map((entry) => ({
    title: entry.title,
    file: rel(entry.file)
  })), null, 2)};
}());
`;
  fs.writeFileSync(path.join(outputDir, "catalog.js"), body, "utf8");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const rules = selectedRules(args);
  if (args.list) {
    RULES.forEach((item) => console.log(`${item.id.padEnd(42)} ${item.title}`));
    return;
  }
  console.log(`Mizuhara Mahjong batch training`);
  console.log(`rules=${rules.length} iterations=${args.iterations} strength=Lv${args.strength} output=${args.outputDir}`);
  if (args.dryRun) console.log("dry-run: no files will be written");
  const ai = loadAiCore();
  if (!args.dryRun) fs.mkdirSync(args.outputDir, { recursive: true });
  const catalogEntries = [];
  const started = Date.now();
  rules.forEach((ruleItem, index) => {
    const file = path.join(args.outputDir, fileNameFor(ruleItem, args));
    const title = `${ruleItem.title} / Lv${args.strength} / ${args.iterations.toLocaleString()}`;
    console.log(`\n[${index + 1}/${rules.length}] ${title}`);
    console.log(`  file=${path.basename(file)}`);
    if (!args.dryRun) {
      const data = trainRule(ai, ruleItem, args);
      fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    }
    catalogEntries.push({ title, file });
  });
  if (!args.noCatalog && !args.dryRun) {
    writeCatalog(catalogEntries, args.outputDir);
    console.log(`\nupdated catalog.js (${catalogEntries.length} entries)`);
  }
  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`done in ${elapsed}s`);
}

try {
  main();
} catch (error) {
  console.error(error.stack || error.message);
  process.exit(1);
}
