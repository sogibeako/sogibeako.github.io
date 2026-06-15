(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const els = {
    badge: $("sessionBadge"),
    integrity: $("statIntegrity"),
    core: $("statCore"),
    accounts: $("statAccounts"),
    trust: $("statTrust"),
    panic: $("statPanic"),
    focus: $("statFocus"),
    alerts: $("alertsView"),
    logs: $("logView"),
    output: $("output"),
    form: $("commandForm"),
    input: $("commandInput"),
  };

  const difficultyTable = {
    1: { name: "お茶つき保守", spawn: 15, damage: 0.55, focusRegen: 2.2, falsePositive: 0.08, combo: 0.04, panic: 5 },
    2: { name: "夜間当番", spawn: 12, damage: 0.75, focusRegen: 1.8, falsePositive: 0.11, combo: 0.07, panic: 8 },
    3: { name: "研究室防衛", spawn: 10, damage: 1.0, focusRegen: 1.45, falsePositive: 0.15, combo: 0.11, panic: 12 },
    4: { name: "炎上メンテ", spawn: 8, damage: 1.25, focusRegen: 1.15, falsePositive: 0.18, combo: 0.16, panic: 18 },
    5: { name: "人間型ゼロデイ", spawn: 6, damage: 1.55, focusRegen: 0.9, falsePositive: 0.22, combo: 0.24, panic: 26 },
  };

  const targets = {
    auth: ["fail", "mfa", "login", "lock", "ip"],
    app: ["error", "timeout", "ok", "config", "edge"],
    mail: ["urgent", "sender", "official", "lure", "link"],
    edge: ["traffic", "burst", "ip", "drop", "latency"],
    config: ["public", "private", "rollback", "token", "diff"],
  };

  const eventTypes = [
    {
      type: "phishing",
      label: "phishing",
      target: "mail",
      detail: "件名が焦らせに来ている。公式経路で確認してから送信元を止める。",
      resolve: ["verify sender", "block sender"],
      partial: ["inspect", "logs mail", "grep urgent mail", "grep lure mail", "verify official", "train user", "tea"],
      harm: { accounts: 2.2, panic: 1.8, trust: -0.6 },
      solved: "送信元を検証し、誘導メールを隔離しました。",
    },
    {
      type: "brute_force",
      label: "brute_force",
      target: "auth",
      detail: "ログイン失敗が偏っている。IP単位で見て、認証面を固める。",
      resolve: ["rate-limit login", "enable mfa"],
      partial: ["grep fail auth", "uniq ip", "sort ip", "lock account", "block ip", "inspect"],
      harm: { accounts: 2.0, panic: 0.9, integrity: -0.4 },
      solved: "ログイン試行を絞り、MFAでアカウント面を固めました。",
    },
    {
      type: "suspicious_log",
      label: "suspicious_log",
      target: "app",
      detail: "ログに不自然な連鎖がある。errorだけでなく前後関係を追う。",
      resolve: ["trace", "patch app"],
      partial: ["logs app", "grep error app", "count error app", "sort time", "inspect"],
      harm: { core: 1.5, panic: 0.8, integrity: -0.8 },
      solved: "ログの連鎖を追跡し、アプリ側の弱い設定を修正しました。",
    },
    {
      type: "overload",
      label: "overload",
      target: "edge",
      detail: "トラフィックが跳ねている。遮断より先に絞ると信頼を落としにくい。",
      resolve: ["rate-limit edge", "throttle traffic"],
      partial: ["status", "logs edge", "grep burst edge", "block ip", "restart edge", "inspect"],
      harm: { integrity: -2.5, trust: -1.3, panic: 0.9 },
      solved: "入口の流量を絞り、サービス停止を避けました。",
    },
    {
      type: "misconfig",
      label: "misconfig",
      target: "config",
      detail: "設定差分が怪しい。公開範囲と認証設定を疑う。",
      resolve: ["audit config", "patch config"],
      partial: ["logs config", "grep public config", "verify config", "rollback config", "inspect"],
      harm: { core: 2.4, trust: -0.9, panic: 0.7 },
      solved: "設定差分を監査し、公開範囲を閉じました。",
    },
    {
      type: "social_pressure",
      label: "social_pressure",
      target: "human",
      detail: "急がせる文面が多い。焦りを落として、公式経路で確認する。",
      resolve: ["tea", "verify official"],
      partial: ["inspect", "ignore lure", "train user"],
      harm: { panic: 3.1, trust: -0.4 },
      solved: "一呼吸置いて、誘導ではなく公式経路で確認しました。",
    },
  ];

  const help = {
    help: "help [command]\n  コマンド一覧または個別ヘルプを表示します。",
    start: "start [1-5] [minutes]\n  難易度を指定して開始します。例: start 3\n  テスト用に minutes を指定できます。例: start 3 2",
    status: "status\n  現在のサーバー状態を表示します。Cost: 0",
    alerts: "alerts\n  未対応アラート一覧を表示します。Cost: 0",
    inspect: "inspect <id>\n  アラート詳細を見る。例: inspect A03\n  Good for: 全イベント Cost: 1 focus",
    logs: "logs <target>\n  対象ログを見る。例: logs auth\n  Targets: auth, app, mail, edge, config Cost: 1 focus",
    grep: "grep <word> <target>\n  語を含むログ行を拾います。例: grep fail auth Cost: 1 focus",
    count: "count <word> <target>\n  語の出現回数を数えます。例: count error app Cost: 1 focus",
    sort: "sort <field>\n  ログを並べる調査。例: sort ip / sort time Cost: 1 focus",
    uniq: "uniq <field>\n  同じ要素を数えます。例: uniq ip Cost: 1 focus",
    trace: "trace <id>\n  関連イベントの流れを追います。suspicious_log に有効。Cost: 2 focus",
    verify: "verify <target>\n  公式経路・送信元・設定差分を検証。例: verify sender Cost: 2 focus",
    block: "block <ip|sender>\n  怪しい送信元を遮断。確認不足だと信頼が下がります。Cost: 2 focus",
    "rate-limit": "rate-limit <service>\n  login や edge を絞ります。Cost: 2 focus",
    throttle: "throttle traffic\n  過負荷を抑えます。Cost: 2 focus",
    "enable mfa": "enable mfa\n  2段階認証を有効化。brute_force に強い。Cost: 3 focus",
    lock: "lock <account>\n  アカウントを一時ロック。Cost: 2 focus",
    patch: "patch <target>\n  config や app を修正。Cost: 3 focus",
    audit: "audit config\n  設定差分を監査。misconfig に有効。Cost: 2 focus",
    rollback: "rollback <target>\n  直近変更を戻す。誤ると integrity が落ちます。Cost: 2 focus",
    isolate: "isolate <service>\n  被害拡大を止める強い手。trust に少し影響。Cost: 4 focus",
    restart: "restart <service>\n  サービスを再起動。overload の応急処置。Cost: 2 focus",
    "train user": "train user\n  フィッシング耐性を上げます。Cost: 2 focus",
    tea: "tea\n  焦燥を下げます。焦燥は最大のバックドア。Cost: 0 / cooldownあり",
    memo: "memo <text>\n  終了時に表示するメモを残します。",
    quit: "quit\n  セッションを終了します。",
  };

  const tutorialSteps = [
    {
      title: "Step 1: Look at the board",
      text: "Type: status\nFirst, learn what you are protecting. integrity and trust should stay high; core, accounts, and panic should stay low.",
      match: (cmd) => cmd === "status",
    },
    {
      title: "Step 2: List incidents",
      text: "Type: alerts\nActive alerts are the incidents waiting for your attention.",
      match: (cmd) => cmd === "alerts",
    },
    {
      title: "Step 3: Read the alert",
      text: "Type: inspect T01\nDo not block first. Read the shape of the problem.",
      match: (cmd) => cmd === "inspect t01",
    },
    {
      title: "Step 4: Read the mail log",
      text: "Type: logs mail\nLogs are the river. You are learning what is flowing through it.",
      match: (cmd) => cmd === "logs mail",
    },
    {
      title: "Step 5: Filter the clue",
      text: "Type: grep urgent mail\ngrep narrows the river to the line you care about.",
      match: (cmd) => cmd === "grep urgent mail",
    },
    {
      title: "Step 6: Verify before acting",
      text: "Type: verify sender\nA defender checks the sender before taking a strong action.",
      match: (cmd) => cmd === "verify sender",
    },
    {
      title: "Step 7: Block the lure",
      text: "Type: block sender\nNow you have enough evidence. Stop the phishing sender.",
      match: (cmd) => cmd === "block sender",
    },
    {
      title: "Step 8: Patch the human server",
      text: "Type: tea\nLower panic. 焦燥は最大のバックドアです。",
      match: (cmd) => cmd === "tea",
    },
  ];

  help.tutorial = "tutorial\n  Starts a guided first mission.\n  Practice: status -> alerts -> inspect -> logs -> grep -> verify -> block -> tea.";

  const state = {
    running: false,
    ended: false,
    difficulty: 3,
    config: difficultyTable[3],
    totalSeconds: 600,
    elapsed: 0,
    nextSpawn: 3,
    focusFloat: 10,
    maxFocus: 10,
    stats: {},
    alerts: [],
    logs: [],
    output: [],
    history: [],
    historyIndex: -1,
    memos: [],
    score: 0,
    solved: 0,
    mistakes: 0,
    idCounter: 1,
    tickHandle: null,
    teaCooldown: 0,
    mode: "idle",
    tutorialStep: 0,
    rng: Math.random,
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function formatTime(seconds) {
    const remaining = Math.max(0, seconds);
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    return `${pad(m)}:${pad(s)}`;
  }

  function addOutput(text, kind = "system") {
    const line = { text, kind };
    state.output.push(line);
    if (state.output.length > 140) state.output.shift();
    renderOutput();
  }

  function addLog(text, source = "system") {
    const stamped = `${formatTime(state.elapsed)} ${source} ${text}`;
    state.logs.push(stamped);
    if (state.logs.length > 80) state.logs.shift();
  }

  function renderOutput() {
    els.output.innerHTML = state.output
      .map((line) => `<div class="line-${line.kind}">${escapeHtml(line.text)}</div>`)
      .join("");
    els.output.scrollTop = els.output.scrollHeight;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function render() {
    const remaining = state.running ? state.totalSeconds - state.elapsed : state.totalSeconds;
    els.badge.textContent = state.running
      ? `D${state.difficulty} ${formatTime(remaining)}`
      : state.ended
        ? "ended"
        : "idle";
    els.integrity.textContent = Math.round(state.stats.integrity ?? 100);
    els.core.textContent = Math.round(state.stats.core ?? 0);
    els.accounts.textContent = Math.round(state.stats.accounts ?? 0);
    els.trust.textContent = Math.round(state.stats.trust ?? 100);
    els.panic.textContent = Math.round(state.stats.panic ?? state.config.panic);
    els.focus.textContent = `${Math.floor(state.focusFloat)}/${state.maxFocus}`;
    renderAlerts();
    renderLogs();
  }

  function renderAlerts() {
    if (!state.alerts.length) {
      els.alerts.textContent = "no active alerts\n盤面は静かです。静かな時ほど設定を疑う余裕があります。";
      return;
    }
    els.alerts.innerHTML = state.alerts
      .map((alert) => {
        const age = state.elapsed - alert.createdAt;
        const sevClass = alert.severity >= 3 ? "sev-high" : alert.severity === 2 ? "sev-mid" : "sev-low";
        return `<div><span class="${sevClass}">${alert.id}</span> ${alert.label.padEnd(15)} age:${pad(age)}s ${escapeHtml(alert.title)}</div>`;
      })
      .join("");
  }

  function renderLogs() {
    els.logs.textContent = state.logs.slice(-9).join("\n") || "ログはまだ流れていません。";
  }

  function resetGame(difficulty, minutes) {
    const config = difficultyTable[difficulty] || difficultyTable[3];
    state.running = true;
    state.ended = false;
    state.mode = "normal";
    state.tutorialStep = 0;
    state.difficulty = difficulty;
    state.config = config;
    state.totalSeconds = Math.max(60, Math.min(20 * 60, Math.round((minutes || 10) * 60)));
    state.elapsed = 0;
    state.nextSpawn = 2;
    state.focusFloat = 10;
    state.stats = {
      integrity: 100,
      core: 0,
      accounts: 0,
      trust: 100,
      panic: config.panic,
    };
    state.alerts = [];
    state.logs = [];
    state.output = [];
    state.memos = [];
    state.score = 0;
    state.solved = 0;
    state.mistakes = 0;
    state.idCounter = 1;
    state.teaCooldown = 0;
    if (state.tickHandle) clearInterval(state.tickHandle);
    state.tickHandle = setInterval(tick, 1000);
    addOutput(`Human Patch Defender started: difficulty ${difficulty} (${config.name})`, "good");
    addOutput("help でコマンド一覧。まずは alerts / inspect <id> / logs <target> あたりから。", "info");
    addOutput("焦ったら tea。焦燥は最大のバックドアです。", "system");
    spawnEvent();
    render();
  }

  function startTutorial() {
    state.running = true;
    state.ended = false;
    state.mode = "tutorial";
    state.tutorialStep = 0;
    state.difficulty = 1;
    state.config = difficultyTable[1];
    state.totalSeconds = 300;
    state.elapsed = 0;
    state.nextSpawn = 999;
    state.focusFloat = 10;
    state.stats = {
      integrity: 100,
      core: 0,
      accounts: 4,
      trust: 100,
      panic: 18,
    };
    state.alerts = [];
    state.logs = [];
    state.output = [];
    state.memos = [];
    state.score = 0;
    state.solved = 0;
    state.mistakes = 0;
    state.idCounter = 1;
    state.teaCooldown = 0;
    if (state.tickHandle) clearInterval(state.tickHandle);
    const alert = {
      id: "T01",
      type: "phishing",
      label: "tutorial_mail",
      target: "mail",
      title: "urgent account warning from fake sender",
      detail: "This is a guided phishing drill. The message is trying to create panic. Read it, filter the mail log, verify the sender, then block it.",
      resolve: ["verify sender", "block sender"],
      partial: ["inspect", "logs mail", "grep urgent mail", "verify sender", "block sender", "tea"],
      harm: { accounts: 0, panic: 0, trust: 0 },
      severity: 1,
      heat: 0,
      createdAt: 0,
      falsePositive: false,
      investigated: false,
      progress: new Set(),
      solved: "Tutorial sender blocked. You verified first, then acted.",
    };
    state.alerts.push(alert);
    addLog("T01 tutorial_mail urgent account warning sender=notice.example.fake", "mail");
    addLog("mail clue urgent link asks for immediate account check", "mail");
    addOutput("Tutorial started: Human Patch Drill", "good");
    addOutput("This mode is safe and does not spawn random incidents.", "info");
    showTutorialStep();
    render();
  }

  function tick() {
    if (!state.running) return;
    state.elapsed += 1;
    state.nextSpawn -= 1;
    state.teaCooldown = Math.max(0, state.teaCooldown - 1);
    state.focusFloat = clamp(state.focusFloat + state.config.focusRegen / 5, 0, state.maxFocus);
    applyAlertDamage();
    if (state.nextSpawn <= 0) {
      spawnEvent();
      state.nextSpawn = Math.max(4, Math.round(state.config.spawn + randInt(-2, 3)));
    }
    if (state.elapsed >= state.totalSeconds) finish(true, "10分間の防衛に成功しました。");
    checkFailure();
    render();
  }

  function applyAlertDamage() {
    for (const alert of state.alerts) {
      alert.heat += 1;
      const scale = state.config.damage * (1 + alert.severity * 0.12);
      for (const [key, delta] of Object.entries(alert.harm)) {
        state.stats[key] = clamp(state.stats[key] + (delta * scale) / 8, 0, 100);
      }
      if (alert.heat % 12 === 0) {
        addLog(`${alert.id} still active; heat=${alert.heat}`, alert.target);
      }
    }
    if (state.alerts.length >= 5) {
      state.stats.panic = clamp(state.stats.panic + 0.55, 0, 100);
      state.stats.trust = clamp(state.stats.trust - 0.35, 0, 100);
    }
  }

  function checkFailure() {
    if (!state.running) return;
    if (state.stats.core >= 100) finish(false, "core が侵害度100に到達しました。");
    else if (state.stats.accounts >= 100) finish(false, "accounts の漏洩度が100に到達しました。");
    else if (state.stats.trust <= 0) finish(false, "trust が0になりました。");
    else if (state.stats.panic >= 100) finish(false, "panic が100に到達しました。");
  }

  function finish(won, reason) {
    if (!state.running && state.ended) return;
    state.running = false;
    state.ended = true;
    if (state.tickHandle) clearInterval(state.tickHandle);
    const survival = state.elapsed * 8;
    const defense = Math.round(state.stats.integrity + state.stats.trust + (100 - state.stats.core) + (100 - state.stats.accounts) + (100 - state.stats.panic));
    state.score = Math.max(0, survival + defense + state.solved * 180 - state.mistakes * 90 + (won ? 1200 : 0));
    const rank = getRank();
    addOutput("", "system");
    addOutput(won ? "MISSION CLEAR" : "MISSION FAILED", won ? "good" : "bad");
    addOutput(reason, won ? "good" : "bad");
    addOutput(`score ${state.score} / solved ${state.solved} / mistakes ${state.mistakes} / title ${rank}`, "info");
    if (state.memos.length) addOutput(`memo: ${state.memos.join(" / ")}`, "system");
    addOutput(getAdvice(), "system");
    render();
  }

  function getRank() {
    if (state.score >= 6500) return "研究者型ディフェンダー";
    if (state.score >= 5200) return "自分サーバー保守者";
    if (state.score >= 3900) return "ログを読む人";
    if (state.score >= 2600) return "正面玄関卒業";
    return "アップデート可能";
  }

  function getAdvice() {
    const worst = Object.entries({
      core: state.stats.core,
      accounts: state.stats.accounts,
      panic: state.stats.panic,
      lostTrust: 100 - state.stats.trust,
      lostIntegrity: 100 - state.stats.integrity,
    }).sort((a, b) => b[1] - a[1])[0][0];
    const map = {
      core: "改善メモ: core が危なかったので、misconfig は audit config から疑うと安定します。",
      accounts: "改善メモ: accounts が危なかったので、brute_force には rate-limit login と enable mfa が強いです。",
      panic: "改善メモ: panic が危なかったので、tea と verify official で人間系トラップを切るのが大事です。",
      lostTrust: "改善メモ: trust が削れています。block や isolate の前に inspect / verify を挟むと誤対応を減らせます。",
      lostIntegrity: "改善メモ: integrity が削れています。overload には throttle traffic と rate-limit edge が効きます。",
    };
    return map[worst];
  }

  function spawnEvent() {
    const base = eventTypes[randInt(0, eventTypes.length - 1)];
    const isFalsePositive = state.rng() < state.config.falsePositive;
    const severity = clamp(randInt(1, 3) + (state.rng() < state.config.combo ? 1 : 0), 1, 4);
    const id = `A${String(state.idCounter++).padStart(2, "0")}`;
    const title = makeTitle(base.type, isFalsePositive, severity);
    const alert = {
      id,
      type: base.type,
      label: isFalsePositive ? "maybe_false" : base.label,
      target: base.target,
      title,
      detail: isFalsePositive ? "誤検知の可能性がある。いきなり遮断せず、まず検証する。" : base.detail,
      resolve: isFalsePositive ? ["inspect", "verify"] : base.resolve,
      partial: base.partial,
      harm: isFalsePositive ? { panic: 0.8, trust: -0.15 } : base.harm,
      severity,
      heat: 0,
      createdAt: state.elapsed,
      falsePositive: isFalsePositive,
      investigated: false,
      progress: new Set(),
    };
    state.alerts.push(alert);
    addLog(`${id} ${alert.label} ${title}`, alert.target);
    if (state.alerts.length > 7) {
      state.stats.panic = clamp(state.stats.panic + 5, 0, 100);
      addOutput("未対応アラートが積み上がっています。盤面を疑う前に深呼吸。", "warn");
    }
    render();
  }

  function makeTitle(type, falsePositive, severity) {
    if (falsePositive) return `noisy alert looks worse than it is sev=${severity}`;
    const titles = {
      phishing: ["Important notice: account anomaly", "今だけ限定 security reward", "urgent mail asks for account check"],
      brute_force: ["auth failures from 203.0.113.42", "login storm against shared account", "password reuse signal detected"],
      suspicious_log: ["app error chain after config touch", "unknown token appears in app log", "strange 500 pattern near midnight"],
      overload: ["edge latency spike", "traffic burst on public endpoint", "queue length rising"],
      misconfig: ["public flag changed in config", "auth rule differs from baseline", "debug endpoint exposed in diff"],
      social_pressure: ["manager says click now", "countdown banner triggers panic", "official-looking lure escalates urgency"],
    };
    return titles[type][randInt(0, titles[type].length - 1)];
  }

  function randInt(min, max) {
    return Math.floor(state.rng() * (max - min + 1)) + min;
  }

  function commandCost(command) {
    if (["help", "status", "alerts", "memo", "quit", "start", "tutorial", "tea"].includes(command)) return 0;
    if (["inspect", "logs", "grep", "count", "sort", "uniq"].includes(command)) return 1;
    if (["trace", "verify", "block", "rate-limit", "throttle", "lock", "audit", "rollback", "restart", "train", "ignore"].includes(command)) return 2;
    if (["enable", "patch"].includes(command)) return 3;
    if (command === "isolate") return 4;
    return 1;
  }

  function spendFocus(cost) {
    if (state.focusFloat < cost) {
      addOutput(`focus が足りません。必要:${cost} 現在:${Math.floor(state.focusFloat)}`, "warn");
      return false;
    }
    state.focusFloat -= cost;
    return true;
  }

  function normalizeCommand(raw) {
    return raw.trim().replace(/\s+/g, " ").toLowerCase();
  }

  function handleCommand(raw) {
    const input = normalizeCommand(raw);
    if (!input) return;
    state.history.push(raw);
    state.historyIndex = state.history.length;
    addOutput(`> ${raw}`, "command");
    const [head, ...parts] = input.split(" ");
    const fullTwo = `${head} ${parts[0] || ""}`.trim();
    const cost = commandCost(head);

    if (head === "start") {
      const difficulty = clamp(Number(parts[0]) || 3, 1, 5);
      const minutes = Number(parts[1]) || 10;
      resetGame(difficulty, minutes);
      return;
    }

    if (head === "tutorial") {
      startTutorial();
      return;
    }

    if (head === "help") {
      printHelp(parts.join(" "));
      return;
    }

    if (head === "quit") {
      finish(false, "手動でセッションを終了しました。");
      return;
    }

    if (!state.running) {
      addOutput("まだ開始していません。start 3 で開始できます。", "warn");
      return;
    }

    if (!spendFocus(cost)) return;

    if (head === "status") printStatus();
    else if (head === "alerts") printAlerts();
    else if (head === "inspect") inspectAlert(parts[0]);
    else if (head === "logs") showLogs(parts[0]);
    else if (head === "grep") grepLogs(parts[0], parts[1]);
    else if (head === "count") countLogs(parts[0], parts[1]);
    else if (head === "sort") investigate(fullTwo);
    else if (head === "uniq") investigate(fullTwo);
    else if (head === "trace") investigate(head, parts[0]);
    else if (head === "verify") investigate(fullTwo);
    else if (head === "block") investigate(`${head} ${parts[0] || ""}`.trim());
    else if (head === "rate-limit") investigate(fullTwo);
    else if (head === "throttle") investigate(fullTwo);
    else if (head === "enable" && parts[0] === "mfa") investigate("enable mfa");
    else if (head === "lock") investigate("lock account");
    else if (head === "patch") investigate(fullTwo);
    else if (head === "audit") investigate(fullTwo);
    else if (head === "rollback") investigate(fullTwo);
    else if (head === "isolate") investigate(fullTwo);
    else if (head === "restart") investigate(fullTwo);
    else if (head === "train" && parts[0] === "user") investigate("train user");
    else if (head === "ignore" && parts[0] === "lure") investigate("ignore lure");
    else if (head === "tea") drinkTea();
    else if (head === "memo") addMemo(raw.slice(5).trim());
    else addOutput(`unknown command: ${head}. help を見てください。`, "warn");
    render();
    advanceTutorial(input);
  }

  function printHelp(topic) {
    if (topic) {
      const key = help[topic] ? topic : Object.keys(help).find((name) => name === topic || name.startsWith(topic));
      addOutput(help[key] || `help: ${topic} は見つかりません。`, key ? "info" : "warn");
      return;
    }
    addOutput(
      [
        "Commands:",
        "  tutorial           guided first mission",
        "  start [1-5]        begin session",
        "  status             show server state",
        "  alerts             list active incidents",
        "  inspect <id>       read incident detail",
        "  logs <target>      show recent logs",
        "  grep <word> <log>  filter log lines",
        "  count <word> <log> count keyword",
        "  sort <field>       group clues",
        "  uniq <field>       count repeated fields",
        "  trace <id>         follow related events",
        "  verify <target>    check sender/config/official route",
        "  block <target>     block ip or sender",
        "  rate-limit <svc>   slow login or edge flood",
        "  enable mfa         harden accounts",
        "  patch <target>     fix app/config",
        "  tea                lower panic",
        "  help <command>     command detail",
      ].join("\n"),
      "info",
    );
  }

  function printStatus() {
    addOutput(
      `time ${formatTime(state.totalSeconds - state.elapsed)} | integrity ${Math.round(state.stats.integrity)} | core ${Math.round(state.stats.core)} | accounts ${Math.round(state.stats.accounts)} | trust ${Math.round(state.stats.trust)} | panic ${Math.round(state.stats.panic)} | focus ${Math.floor(state.focusFloat)}/${state.maxFocus}`,
      "info",
    );
  }

  function printAlerts() {
    if (!state.alerts.length) {
      addOutput("active alerts: none", "good");
      return;
    }
    addOutput(
      state.alerts.map((a) => `${a.id} ${a.label} target=${a.target} sev=${a.severity} ${a.title}`).join("\n"),
      "info",
    );
  }

  function inspectAlert(id) {
    const alert = findAlert(id);
    if (!alert) return;
    alert.investigated = true;
    alert.progress.add("inspect");
    addOutput(`${alert.id} ${alert.label}\n${alert.detail}\nHint: ${makeHint(alert)}`, "info");
    maybeResolve(alert, "inspect");
  }

  function findAlert(id) {
    if (!id) {
      addOutput("alert id を指定してください。例: inspect A01", "warn");
      return null;
    }
    const normalized = id.toUpperCase();
    const alert = state.alerts.find((item) => item.id === normalized);
    if (!alert) addOutput(`alert not found: ${normalized}`, "warn");
    return alert;
  }

  function showLogs(target) {
    if (!target || !targets[target]) {
      addOutput(`target を指定してください: ${Object.keys(targets).join(", ")}`, "warn");
      return;
    }
    const lines = state.logs.filter((line) => line.includes(` ${target} `)).slice(-8);
    addOutput(lines.join("\n") || `${target} log is quiet`, "info");
    markRelevant(`logs ${target}`);
  }

  function grepLogs(word, target) {
    if (!word || !target) {
      addOutput("使い方: grep <word> <target>", "warn");
      return;
    }
    const lines = state.logs.filter((line) => line.includes(target) && line.includes(word)).slice(-8);
    addOutput(lines.join("\n") || `no match: ${word} in ${target}`, lines.length ? "info" : "warn");
    markRelevant(`grep ${word} ${target}`);
  }

  function countLogs(word, target) {
    if (!word || !target) {
      addOutput("使い方: count <word> <target>", "warn");
      return;
    }
    const count = state.logs.filter((line) => line.includes(target) && line.includes(word)).length;
    addOutput(`${word} in ${target}: ${count}`, "info");
    markRelevant(`count ${word} ${target}`);
  }

  function investigate(action, id) {
    const alert = pickAlertForAction(action, id);
    if (!alert) {
      applyMistake(action);
      return;
    }
    alert.progress.add(action);
    if (alert.partial.includes(action) || alert.resolve.some((needed) => action.startsWith(needed))) {
      addOutput(`${alert.id}: ${action} -> 手応えあり`, "good");
      if (action.includes("verify") || action.includes("audit") || action.includes("trace")) alert.investigated = true;
      maybeResolve(alert, action);
    } else {
      applyMistake(action, alert);
    }
  }

  function markRelevant(action) {
    const alert = pickAlertForAction(action);
    if (!alert) return;
    alert.progress.add(action);
    addOutput(`${alert.id}: ${action} で材料が増えました。`, "good");
    maybeResolve(alert, action);
  }

  function pickAlertForAction(action, id) {
    if (id) return findAlert(id);
    return state.alerts.find((alert) => {
      if (alert.resolve.some((needed) => action.startsWith(needed))) return true;
      return alert.partial.some((part) => action.startsWith(part));
    });
  }

  function maybeResolve(alert, action) {
    const resolveCount = alert.resolve.filter((needed) => {
      if (needed === "verify") return [...alert.progress].some((done) => done.startsWith("verify"));
      if (needed === "trace") return [...alert.progress].some((done) => done.startsWith("trace"));
      return [...alert.progress].some((done) => done.startsWith(needed));
    }).length;
    const investigatedBonus = alert.investigated || alert.falsePositive;
    if (resolveCount >= alert.resolve.length && investigatedBonus) {
      solveAlert(alert, action);
    } else if (alert.resolve.some((needed) => action.startsWith(needed)) && !investigatedBonus) {
      addOutput("対処は近いですが、先に inspect / verify / trace で確認すると安全です。", "warn");
    }
  }

  function solveAlert(alert) {
    state.alerts = state.alerts.filter((item) => item !== alert);
    state.solved += 1;
    state.stats.panic = clamp(state.stats.panic - 4 - alert.severity, 0, 100);
    state.stats.trust = clamp(state.stats.trust + 1.5, 0, 100);
    state.stats.integrity = clamp(state.stats.integrity + 1, 0, 100);
    addLog(`${alert.id} resolved`, alert.target);
    const message = alert.solved || "誤検知として整理し、過剰対応を避けました。";
    addOutput(`${alert.id} resolved: ${message}`, "good");
  }

  function applyMistake(action, alert) {
    state.mistakes += 1;
    state.stats.panic = clamp(state.stats.panic + 3, 0, 100);
    state.stats.trust = clamp(state.stats.trust - 2.5, 0, 100);
    if (action.startsWith("block") || action.startsWith("isolate") || action.startsWith("rollback")) {
      state.stats.integrity = clamp(state.stats.integrity - 2.5, 0, 100);
    }
    const target = alert ? `${alert.id}: ` : "";
    addOutput(`${target}${action} は今の盤面に刺さりませんでした。まず inspect / logs / verify で疑いましょう。`, "warn");
  }

  function drinkTea() {
    if (state.teaCooldown > 0) {
      addOutput(`tea cooldown: ${state.teaCooldown}s`, "warn");
      return;
    }
    state.teaCooldown = 20;
    state.stats.panic = clamp(state.stats.panic - 12, 0, 100);
    state.focusFloat = clamp(state.focusFloat + 1, 0, state.maxFocus);
    markRelevant("tea");
    addOutput("お茶を飲みました。panic -12 / focus +1", "good");
  }

  function addMemo(text) {
    if (!text) {
      addOutput("memo に残す内容を入力してください。", "warn");
      return;
    }
    state.memos.push(text.slice(0, 80));
    addOutput("memo saved", "good");
  }

  function makeHint(alert) {
    if (alert.falsePositive) return "誤検知かも。verify を挟むと信頼を守れます。";
    const hints = {
      phishing: "verify sender -> block sender",
      brute_force: "grep fail auth -> rate-limit login -> enable mfa",
      suspicious_log: "grep error app -> trace Axx -> patch app",
      overload: "logs edge -> rate-limit edge または throttle traffic",
      misconfig: "audit config -> patch config",
      social_pressure: "tea -> verify official",
    };
    return hints[alert.type] || "inspect と logs から始める。";
  }

  function showTutorialStep() {
    const step = tutorialSteps[state.tutorialStep];
    if (!step) {
      addOutput("Tutorial complete. Try: start 3", "good");
      finish(true, "Tutorial completed.");
      return;
    }
    addOutput(`${step.title}\n${step.text}`, "info");
  }

  function advanceTutorial(command) {
    if (state.mode !== "tutorial" || !state.running) return;
    const step = tutorialSteps[state.tutorialStep];
    if (!step) return;
    if (!step.match(command)) {
      const expected = step.text.split("\n")[0].replace("Type: ", "");
      addOutput(`Tutorial hint: next command is "${expected}"`, "warn");
      return;
    }
    state.tutorialStep += 1;
    if (state.tutorialStep >= tutorialSteps.length) {
      state.stats.panic = clamp(state.stats.panic - 8, 0, 100);
      addOutput("Tutorial clear: you read, filtered, verified, acted, and cooled down.", "good");
      finish(true, "Tutorial completed.");
      return;
    }
    showTutorialStep();
  }

  function boot() {
    state.stats = {
      integrity: 100,
      core: 0,
      accounts: 0,
      trust: 100,
      panic: state.config.panic,
    };
    addOutput("Human Patch Defender", "good");
    addOutput("Type tutorial for a guided first mission.", "info");
    addOutput("start 3 で開始。help でコマンド一覧。テスト時は start 3 2 のように分数指定できます。", "info");
    addOutput("実在ネットワークにはアクセスしない、防衛シミュレーション専用CLIです。", "system");
    render();
    els.input.focus();
  }

  els.form.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = els.input.value;
    els.input.value = "";
    handleCommand(value);
  });

  els.input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const value = els.input.value;
      els.input.value = "";
      handleCommand(value);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      state.historyIndex = clamp(state.historyIndex - 1, 0, state.history.length);
      els.input.value = state.history[state.historyIndex] || "";
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      state.historyIndex = clamp(state.historyIndex + 1, 0, state.history.length);
      els.input.value = state.history[state.historyIndex] || "";
    }
  });

  boot();
})();
