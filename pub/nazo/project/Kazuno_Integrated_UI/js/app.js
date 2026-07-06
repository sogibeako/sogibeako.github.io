/**
 * Kazuno Integrated UI - フロントエンドアプリケーションコアロジック
 * (スマート・フォールバック機能付き: PHP/DB がない環境では自動的に LocalStorage モードで動作します)
 */

document.addEventListener('DOMContentLoaded', () => {
    // 状態管理
    const AppState = {
        useLocalStorage: false, // サーバー接続失敗時に自動で true になります
        settings: {
            pomo_work_time: 25,
            pomo_short_break: 5,
            pomo_long_break: 15,
            pomo_sequence: 'wrwrwrR',
            last_tab: 'todo',
            default_video_url: '',
            speech_interval: 30 // おしゃべり間隔（秒、デフォルト30秒）
        },
        pomoSequenceIndex: 0,
        todos: [],
        events: [],
        pomoLogs: [],
        vfs: { files: {}, dirs: ['/'] },
        todoFilter: 'all',
        todoSort: 'prio-desc', // 'prio-desc' | 'due-asc' | 'date-desc'
        selectedDate: new Date(),
        activeTab: 'todo'
    };

    let activeBasicInterpreter = null;
    let cliInputResolver = null;

    // ランダムおしゃべりセリフリスト (2026sib.htm から抽出)
    const RANDOM_SPEECHES = [
        { text: "……？ それは？", emotion: "thinking" },
        { text: "水は濃縮しないの！ それじゃ部屋を加湿してるだけだよ！💦", emotion: "sad" },
        { text: "えっ誰！？", emotion: "fun" },
        { text: "あっ", emotion: "neutral" },
        { text: "可哀想でしょ！💢 ホントそういうとこだよ、お兄ちゃん！ だからノンデリだって言われるんだよ！💦", emotion: "angry" },
        { text: "そもそもなんでそんな意地悪なこと言ったの？", emotion: "thinking" },
        { text: "ん？", emotion: "thinking" },
        { text: "お兄ちゃん！💢 この顔を見てよ！ それがお兄ちゃんが『他者の顔』に向ける言葉なの！？💢", emotion: "angry" },
        { text: "……", emotion: "neutral" },
        { text: "……ちょ、ちょっとお兄ちゃん！ 反論してよ！ とんでもない意見が出てきたよ！", emotion: "fun" },
        { text: "（悩む一彌を見て欠伸）……ふわわぁ。なんだか宿題とかやる気がなくなってきたなあ", emotion: "neutral" },
        { text: "どうでもよくない？ こんなの。あーあ、予定とか、そもそも喋ったりするのとか、ぜーんぶ面倒くさくなってきた……大体、なーにが『兄妹小話』なのかなあ。そんなのより、いい感じの棒っこを探しに行きたいな～！", emotion: "fun" },
        { text: "……（ふ～ん、お兄ちゃん、やるじゃん……！）", emotion: "fun" },
        { text: "（じぃぃぃ～……）……ふーん。お兄ちゃん、よかったじゃん", emotion: "fun" },
        { text: "え！！ お兄ちゃん、考えてる間、ずっと火つけっぱなしだったの！？ うわっ、部屋の湿気すごッ！！", emotion: "fun" },
        { text: "え、お兄ちゃんどうしたの！？ 下痢！？", emotion: "fun" },
        { text: "ちょっと！💢", emotion: "angry" },
        { text: "い、いや、その流れなら行くのはトイレでしょ！ なんで？", emotion: "fun" },
        { text: "い、いや、その……", emotion: "neutral" },
        { text: "いやいや！ 野で！？ 野で放つ気なの！？💦", emotion: "sad" },
        { text: "だからちゃんとして！💦（トイレに誘導）", emotion: "sad" },
        { text: "ほら、入る！ 早く入る！（ぐいぐい）", emotion: "fun" },
        { text: "眼鏡……眼鏡が……（ヨタヨタ）", emotion: "neutral" },
        { text: "頬を染めるな！", emotion: "fun" },
        { text: "効果音がしたの！ 妹パンチ！（MISS） ああ当たらない！💢💦", emotion: "angry" },
        { text: "うぅー、私の顔面でクロスワードしてないで、お兄ちゃんも探してよぉ……", emotion: "neutral" },
        { text: "それを言うなら『海千山千』でしょ", emotion: "neutral" },
        { text: "えっ！？", emotion: "fun" },
        { text: "えっ、何々、何の音！？💦 笙！？💦", emotion: "sad" },
        { text: "なんて？", emotion: "thinking" },
        { text: "……っていうか何も見えないんだけど！ ここどこ！💢", emotion: "angry" },
        { text: "何この声！？ 誰！？💦", emotion: "sad" },
        { text: "あっ、ありがと……え、どこにあったの？", emotion: "thinking" },
        { text: "い、意味がわからなさすぎる！💦", emotion: "sad" },
        { text: "妹パンチ！💢（秒間85発、12200J）", emotion: "angry" },
        { text: "うるさいよ！（ダイアモンドを一周しつつ）", emotion: "fun" },
        { text: "えぇー？ そうかなぁー？（てれっ）", emotion: "thinking" },
        { text: "いやーんもう、だめだってばー！（にこにこ）", emotion: "fun" },
        { text: "ななよちゃん！？", emotion: "fun" },
        { text: "だ、大丈夫……？", emotion: "thinking" },
        { text: "なっ！？ え、ななよちゃん、どうしたの！？💦", emotion: "sad" },
        { text: "そのトンチキな技術と喋り方……ま、まさか、お兄ちゃん！？", emotion: "fun" },
        { text: "あ！ ななよちゃん！ しっかりして！", emotion: "fun" },
        { text: "変な状態になってる！💦", emotion: "sad" },
        { text: "そうか、論破すればお兄ちゃんの精神が弱まるんだ！", emotion: "fun" },
        { text: "う、うん", emotion: "neutral" },
        { text: "んー（見守りアプリを起動）……あ", emotion: "neutral" },
        { text: "……カラスにまとわりつれちゃったみたい……", emotion: "neutral" },
        { text: "ただいまー", emotion: "neutral" },
        { text: "すごかったみたいだね。まあ、もう音波で山に返されたみたいだけど……もう、慌てて表出たらダメだよ！", emotion: "fun" },
        { text: "もう、大げさだなぁ。はい（身を乗り出す", emotion: "neutral" },
        { text: "？ どうしたの？（いつもの赤い眼鏡を掛けている）", emotion: "thinking" },
        { text: "もー……（おしぼりを取りに行く）", emotion: "neutral" },
        { text: "お兄ちゃーん（扉を開ける）", emotion: "neutral" },
        { text: "はっ！？", emotion: "fun" },
        { text: "妹パンチ！（ドゴォ！）（秒間85発、計12200J）", emotion: "fun" },
        { text: "もー、反射的にパンチしちゃったじゃん……大丈夫？", emotion: "thinking" },
        { text: "えっ？", emotion: "thinking" },
        { text: "寝ちゃったのかな？ まあ、ゆっくり休んでね……お大事にね", emotion: "thinking" },
        { text: "ごめんね……！", emotion: "fun" },
        { text: "お願いします……！", emotion: "fun" },
        { text: "お兄ちゃーん、東京楽しいね！", emotion: "fun" },
        { text: "流石に私でもGPUではないと思ったよ", emotion: "neutral" },
        { text: "こにゃんに何かあったのかな……？", emotion: "thinking" },
        { text: "ビデオ！ お兄ちゃん、ビデオ通話にしてもらおう！", emotion: "fun" },
        { text: "中畑くんそれトイレの砂だよ！💦", emotion: "sad" },
        { text: "全部ちゃんと入れ替えて！ あ、でもトイレのフードは一回捨ててよ！ それで、洗ってから入れてあげて！💦", emotion: "sad" },
        { text: "え、ど、どしたの……？💦", emotion: "sad" },
        { text: "（ただでさえうるさい）お兄ちゃんが二人！？", emotion: "fun" },
        { text: "このシスコン感……こっちのお兄ちゃんも、間違いなくお兄ちゃんだ……！💦", emotion: "sad" },
        { text: "鏡の中からなんて、なんでまた、そんなところから……？", emotion: "thinking" },
        { text: "だが？", emotion: "thinking" },
        { text: "ぇええええ！？💦", emotion: "sad" },
        { text: "普段いっしょに歯磨きしながら、そんなこと考えてたの！？ 怖っっ！！！💦", emotion: "sad" },
        { text: "……うぅー！ なんかすごいヤダ！ シスコン時空が展開されてるぅ！！💦（赤面）", emotion: "sad" },
        { text: "（顔を手で仰ぎながら）あーもう、恥ずかしい！ えっ（うかつに居間の姿見と手鏡の間に入ってしまい、無数に複製される）", emotion: "fun" },
        { text: "もうやめてぇぇえ！！💦", emotion: "sad" },
        { text: "お兄ちゃん、これ本当に行くの？ 階段の角度半端ない（44度）んだけど……踏み面も狭いし", emotion: "thinking" },
        { text: "やだなぁ", emotion: "neutral" },
        { text: "し、死ぬぅ……やっと階段終わった！ やったー、そろそろ本殿？", emotion: "fun" },
        { text: "うそ！？ え、まさかこのハシゴ上がるの？", emotion: "fun" },
        { text: "……鉄鎖……崖じゃないこれ？", emotion: "thinking" },
        { text: "そんなにして叶えたい願いないよ～。お兄ちゃん行っておいでよ、怖いし……", emotion: "neutral" },
        { text: "落ちて来ても受け止めないからね", emotion: "neutral" },
        { text: "おかえり、お兄ちゃん", emotion: "neutral" },
        { text: "ここでもう十分だよ……帰ろうよ", emotion: "neutral" },
        { text: "え？ 手？ ……つながないよ？", emotion: "thinking" },
        { text: "何を願ったのさ……", emotion: "neutral" },
        { text: "うわあああああ！！！ えっ、ヒグマ！？ え、お兄ちゃん……死ぬんじゃ、私達……！？（蒼白）", emotion: "fun" },
        { text: "お兄ちゃん！？", emotion: "fun" },
        { text: "す、すごい！ ことごとく命中してる！", emotion: "fun" },
        { text: "クマ殺しの兄……（ちょっと引いてる）", emotion: "neutral" },
        { text: "なんか言ってる……", emotion: "neutral" },
        { text: "え、えぇ……？ ……ん？ あれ、お兄ちゃん、なんかいきなり色褪せてない！？", emotion: "fun" },
        { text: "もうやだ！ またクマとエンカウントするよ！ 早く降りようよ～！", emotion: "fun" },
        { text: "お兄ちゃんが前衛やるなら、どっちにしろエンカウントの度にお兄ちゃんは願いパワーを消費するんじゃない？", emotion: "thinking" },
        { text: "ちゃんちゃん♪", emotion: "happy" },
        { text: "はぁ、はぁ、お兄ちゃん……！ うぅー、おぇ……（疲れて空えずき）", emotion: "fun" },
        { text: "疲れたよ～！ もう歩けない～！", emotion: "fun" },
        { text: "中、暗いね。……それに、寒い……", emotion: "neutral" },
        { text: "おー、いい作戦！（……あれ……？）", emotion: "fun" },
        { text: "よ、よーし、頑張ろうね、みんな！", emotion: "fun" },
        { text: "うん！ さて、……ななよちゃんにタッチ！ えへへ、お兄ちゃんによろしくね！", emotion: "fun" },
        { text: "（＊両手の指で四角を作りながら＊ A,B,C,D……A,B,C,D……うぅぅん……？？）", emotion: "thinking" },
        { text: "（びくっ！）……真宵ちゃんだよね？", emotion: "fun" },
        { text: "ううん、なんでもないの。朝まで頑張ろ！", emotion: "sad" },
        { text: "……タッチ、ななよちゃん", emotion: "neutral" },
        { text: "ななよちゃん……やっぱりこれ、おかしい？", emotion: "thinking" },
        { text: "やっぱりそうだよね、でも……ななよちゃん、私怖い……", emotion: "neutral" },
        { text: "（お兄ちゃんが気を利かせて二辺分歩いてる……？）", emotion: "thinking" },
        { text: "（ううん、そうしたら、次はななよちゃんがお兄ちゃんにタッチできないよね……）", emotion: "neutral" },
        { text: "（……誰かが二辺歩いて、次の人にタッチしてから、一辺ぶん戻ってる？）", emotion: "thinking" },
        { text: "（うーん、そんなこと出来るの……？）", emotion: "thinking" },
        { text: "そ、そうだね！ この調子でいこう！", emotion: "fun" },
        { text: "お兄ちゃん、休めてる？", emotion: "thinking" },
        { text: "（本当……？）", emotion: "thinking" },
        { text: "なんとか朝だ～！ あ、ほら見て、窓から看板が見えるよ！ 登山道だって！", emotion: "fun" },
        { text: "それ私も思った……お兄ちゃん、もしかして、二辺ぶんとか歩いてたりした……？", emotion: "thinking" },
        { text: "や、やめてよ～！", emotion: "fun" },
        { text: "ああー、それでか～！ あははは……！", emotion: "fun" },
        { text: "えっ、タンスの形どうなってるの？ 使いづらくない？", emotion: "thinking" },
        { text: "うわああ、絶対増えてる！！ ＊般若心経を詠唱＊", emotion: "fun" },
        { text: "よし、5人目は去った！", emotion: "fun" },
        { text: "え、除霊しない方が良かったパターン！？", emotion: "fun" },
        { text: "お兄ちゃんがやれって言ったんでしょ～！？ もう！", emotion: "fun" },
        { text: "山小屋の扉から出たはずなのに……また山小屋！？", emotion: "fun" },
        { text: "お兄ちゃーん、お腹すいた～……", emotion: "neutral" },
        { text: "え、じゃあ、どっちなの！？", emotion: "fun" },
        { text: "ゲームのダンジョンみたいにおかしくなってる！ お兄ちゃん、結局どういうことなの！？", emotion: "fun" },
        { text: "全然わからない……", emotion: "neutral" },
        { text: "うぅぅ……お腹すいた……あ、あれは……フライドチキン！？", emotion: "fun" },
        { text: "うー、よくわかんないよ！", emotion: "fun" },
        { text: "お兄ちゃん、なにかわかったの！？", emotion: "fun" },
        { text: "ど、どうやって写像するの！？", emotion: "fun" },
        { text: "あっ、お兄ちゃん、出口が見えた！！", emotion: "fun" },
        { text: "やったー！ やっと出られたぁ！！", emotion: "fun" },
        { text: "えへへ、面白いでしょ……！", emotion: "fun" },
        { text: "うーん、結局、山小屋って何だったんだろうね？（ズレた眼鏡を両手で直しながら）", emotion: "thinking" },
        { text: "あはは、そだね……（手伝い）", emotion: "happy" },
        { text: "……とりあえずお経読んどこうかな、位相空間の定義を超えて届くかわかんないけど……なーむー", emotion: "neutral" },
        { text: "だってあんまりしっかり読むと喜ぶし、あの幽霊……", emotion: "neutral" },
        { text: "……あ、いや待って！ もしかして……＊般若心経逆唱＊", emotion: "fun" },
        { text: "やったね！", emotion: "fun" },
        { text: "では……『高天原に神留座す神漏岐神漏美の命以ちて』……", emotion: "neutral" },
        { text: "また層トポス行きになったら可哀想だから！", emotion: "fun" }
    ];

    let randomSpeechTimer = null;

    // 簡易ヘルパー: HTMLエスケープ
    function escapeHtml(string) {
        if (typeof string !== 'string') return string;
        return string.replace(/[&<>"']/g, match => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[match]));
    }

    // API通信ラッパー (失敗時にLocalStorageへフォールバック)
    async function apiRequest(url, options = {}) {
        if (AppState.useLocalStorage) {
            return { fallback: true };
        }
        try {
            const res = await fetch(url, options);
            if (res.status === 401) {
                location.reload();
                return null;
            }
            if (!res.ok) {
                throw new Error(`HTTP Error: ${res.status}`);
            }
            return await res.json();
        } catch (e) {
            if (!AppState.useLocalStorage) {
                AppState.useLocalStorage = true;
                console.warn("API server not responsive. Falling back to LocalStorage mode.", e);
                setTimeout(() => {
                    printCli('【システム】APIサーバーに接続できないため、ローカル保存モード(LocalStorage)で動作しています。データはブラウザに保存されます。', 'warning');
                }, 1000);
            }
            return { fallback: true };
        }
    }

    // 初期化実行
    initClock();
    initTabs();
    initSettings()
        .then(async () => {
            initKazunoSpeech();
            initTodo();
            initCalendar();
            initPomodoro();
            initVideo();
            await initVfs();
            initCLI();
            startRandomSpeechTimer(); // ランダムおしゃべりタイマー始動
        });

    // ログイン画面の挙動
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const password = document.getElementById('passwordInput').value;
            const errorMsg = document.getElementById('loginError');
            errorMsg.textContent = '';
            
            try {
                const res = await fetch('api/auth.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password })
                });
                if (res.ok) {
                    const result = await res.json();
                    if (result.success) {
                        location.reload();
                        return;
                    }
                }
            } catch (err) {
                console.log("Auth API not available, trying local auth simulation...");
            }

            if (password === 'kazuno123') {
                sessionStorage.setItem('kazuno_logged_in', 'true');
                const loginWrapper = document.querySelector('.login-wrapper');
                if (loginWrapper) {
                    loginWrapper.style.display = 'none';
                    const appContainer = document.querySelector('.app-container');
                    if (appContainer) appContainer.style.display = 'flex';
                }
                location.reload();
            } else {
                errorMsg.textContent = 'パスワードが正しくありません';
            }
        });
    }

    // ログアウトボタン
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            sessionStorage.removeItem('kazuno_logged_in');
            try {
                const res = await fetch('api/auth.php?action=logout');
                const data = await res.json();
                if (data.success) {
                    location.reload();
                }
            } catch (e) {
                location.reload();
            }
        });
    }

    /* ==========================================================================
       0. クロック & 基本UI
       ========================================================================== */
    function initClock() {
        const clockEl = document.getElementById('currentClock');
        if (!clockEl) return;
        
        const updateClock = () => {
            const now = new Date();
            const hrs = String(now.getHours()).padStart(2, '0');
            const mins = String(now.getMinutes()).padStart(2, '0');
            const secs = String(now.getSeconds()).padStart(2, '0');
            clockEl.textContent = `${hrs}:${mins}:${secs}`;
        };
        updateClock();
        setInterval(updateClock, 1000);
    }

    function initTabs() {
        const tabTriggers = document.querySelectorAll('.tab-trigger');
        tabTriggers.forEach(trigger => {
            trigger.addEventListener('click', () => {
                const targetTab = trigger.getAttribute('data-tab');
                switchTab(targetTab);
                saveSetting('last_tab', targetTab);
            });
        });
    }

    function switchTab(tabId) {
        const tabTriggers = document.querySelectorAll('.tab-trigger');
        const tabPanels = document.querySelectorAll('.tab-panel');
        
        tabTriggers.forEach(t => {
            if (t.getAttribute('data-tab') === tabId) {
                t.classList.add('active');
                t.setAttribute('aria-selected', 'true');
            } else {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            }
        });

        tabPanels.forEach(p => {
            if (p.getAttribute('id') === `tab-${tabId}`) {
                p.classList.add('active');
            } else {
                p.classList.remove('active');
            }
        });
        
        AppState.activeTab = tabId;

        // CLIタブへ切り替わった場合に入力欄へ自動フォーカス
        if (tabId === 'cli') {
            const cliInput = document.getElementById('cliInput');
            if (cliInput) {
                setTimeout(() => {
                    cliInput.focus();
                }, 100);
            }
        }
    }

    async function initSettings() {
        const data = await apiRequest('api/settings_get.php');
        if (data && !data.fallback) {
            if (data.pomo_work_time) AppState.settings.pomo_work_time = parseInt(data.pomo_work_time);
            if (data.pomo_short_break) AppState.settings.pomo_short_break = parseInt(data.pomo_short_break);
            if (data.pomo_long_break) AppState.settings.pomo_long_break = parseInt(data.pomo_long_break);
            if (data.pomo_sequence) AppState.settings.pomo_sequence = data.pomo_sequence;
            if (data.last_tab) {
                AppState.settings.last_tab = data.last_tab;
                switchTab(data.last_tab);
            }
            if (data.default_video_url) AppState.settings.default_video_url = data.default_video_url;
            if (data.speech_interval) AppState.settings.speech_interval = parseInt(data.speech_interval);
        } else {
            const localSettings = JSON.parse(localStorage.getItem('kazuno_settings') || '{}');
            Object.assign(AppState.settings, localSettings);
            if (AppState.settings.last_tab) {
                switchTab(AppState.settings.last_tab);
            }
        }
        
        // おしゃべり設定UIへの値反映
        const intervalInput = document.getElementById('kazunoSpeechInterval');
        if (intervalInput) {
            intervalInput.value = AppState.settings.speech_interval;
        }
    }

    async function saveSetting(key, value) {
        AppState.settings[key] = value;
        if (!AppState.useLocalStorage) {
            const data = await apiRequest('api/settings_set.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value: String(value) })
            });
            if (data && !data.fallback) return;
        }
        localStorage.setItem('kazuno_settings', JSON.stringify(AppState.settings));
    }

    /* ==========================================================================
       1. 一埜おしゃべりUI (＆ランダム会話タイマー)
       ========================================================================== */
    let speechTimeout = null;
    
    window.say = function(text, emotion = 'neutral', resetRandomTimer = true) {
        const avatar = document.getElementById('kazunoAvatar');
        const speech = document.getElementById('kazunoSpeech');
        if (!avatar || !speech) return;

        avatar.src = `img_src/${emotion}.png`;
        
        const statusText = document.getElementById('kazunoStatusText');
        if (statusText) {
            statusText.textContent = emotion.toUpperCase();
        }

        clearTimeout(speechTimeout);
        speech.textContent = '';
        let i = 0;
        
        function type() {
            if (i < text.length) {
                speech.textContent += text.charAt(i);
                i++;
                speechTimeout = setTimeout(type, 35);
            }
        }
        type();

        // おしゃべりが発生したらランダム会話のタイマーをリセットする
        if (resetRandomTimer) {
            startRandomSpeechTimer();
        }
    };

    function initKazunoSpeech() {
        const now = new Date();
        const hour = now.getHours();
        let greeting = '';
        if (hour >= 5 && hour < 11) {
            greeting = 'おはよう。今日もいっしょにがんばろうね！';
        } else if (hour >= 11 && hour < 17) {
            greeting = 'こんにちは！ お昼の調子はどう？ 作業すすんでる？';
        } else {
            greeting = 'お疲れ様。夜遅いから、無理しないで休むのも大切だよ。';
        }
        window.say(greeting, 'neutral', false);
    }

    // ランダム会話タイマーの起動/再起動
    function startRandomSpeechTimer() {
        clearInterval(randomSpeechTimer);
        
        // 0秒以下の場合は定期おしゃべりを停止
        if (AppState.settings.speech_interval <= 0) return;

        randomSpeechTimer = setInterval(() => {
            // ポモドーロ作業中は話しかけすぎないように別セリフ、またはタイマー優先にする
            if (isTimerRunning && currentTimerType === 'work') {
                const pomoSpeeches = [
                    { text: "がんばれお兄ちゃん。あと少しだよ！", emotion: "happy" },
                    { text: "いっしょに潜ってるよ。息つぎは忘れずにね。", emotion: "thinking" },
                    { text: "集中、集中！ 終わったら美味しいもの食べよう？", emotion: "fun" }
                ];
                const speech = pomoSpeeches[Math.floor(Math.random() * pomoSpeeches.length)];
                window.say(speech.text, speech.emotion, false);
            } else {
                // 通常のおしゃべり
                const speech = RANDOM_SPEECHES[Math.floor(Math.random() * RANDOM_SPEECHES.length)];
                window.say(speech.text, speech.emotion, false);
            }
        }, AppState.settings.speech_interval * 1000);
    }

    /* ==========================================================================
       2. ToDoリスト
       ========================================================================== */
    async function initTodo() {
        const todoForm = document.getElementById('todoForm');
        const btnSortTodo = document.getElementById('btnSortTodo');
        const filters = document.querySelectorAll('.todo-filters button[data-filter]');

        if (!todoForm) return;

        await fetchTodos();

        todoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('todoTitle').value.trim();
            const priority = parseInt(document.getElementById('todoPriority').value);
            const due_date = document.getElementById('todoDueDate').value || null;
            const memo = document.getElementById('todoMemo').value.trim() || null;

            if (!title) return;

            if (!AppState.useLocalStorage) {
                const data = await apiRequest('api/todos_add.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, priority, due_date, memo })
                });
                if (data && !data.fallback) {
                    resetTodoForm();
                    await fetchTodos();
                    window.say('追加したよ。これは逃がさないからね。', 'happy');
                    renderCalendar();
                    return;
                }
            }

            // LocalStorage フォールバック
            const newTodo = {
                id: Date.now(),
                title,
                memo,
                done: 0,
                priority,
                due_date,
                created_at: new Date().toISOString()
            };
            AppState.todos.push(newTodo);
            localStorage.setItem('kazuno_todos', JSON.stringify(AppState.todos));
            resetTodoForm();
            renderTodos();
            window.say('追加したよ。これは逃がさないからね。', 'happy');
            renderCalendar();
        });

        function resetTodoForm() {
            document.getElementById('todoTitle').value = '';
            document.getElementById('todoMemo').value = '';
            document.getElementById('todoDueDate').value = '';
            document.getElementById('todoPriority').value = '0';
        }

        filters.forEach(btn => {
            btn.addEventListener('click', () => {
                filters.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                AppState.todoFilter = btn.getAttribute('data-filter');
                renderTodos();
            });
        });

        btnSortTodo.addEventListener('click', () => {
            if (AppState.todoSort === 'prio-desc') {
                AppState.todoSort = 'due-asc';
                btnSortTodo.innerHTML = '<i class="fa-solid fa-calendar-day"></i> 期限日順';
            } else if (AppState.todoSort === 'due-asc') {
                AppState.todoSort = 'date-desc';
                btnSortTodo.innerHTML = '<i class="fa-solid fa-clock"></i> 作成日順';
            } else {
                AppState.todoSort = 'prio-desc';
                btnSortTodo.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> 優先度順';
            }
            renderTodos();
        });
    }

    async function fetchTodos() {
        const data = await apiRequest('api/todos_list.php');
        if (data && !data.fallback) {
            AppState.todos = data;
        } else {
            AppState.todos = JSON.parse(localStorage.getItem('kazuno_todos') || '[]');
        }
        renderTodos();
    }

    function renderTodos() {
        const todoList = document.getElementById('todoList');
        const todoCount = document.getElementById('todoCount');
        if (!todoList) return;

        todoList.innerHTML = '';

        let filtered = AppState.todos.filter(todo => {
            if (AppState.todoFilter === 'active') return parseInt(todo.done) === 0;
            if (AppState.todoFilter === 'completed') return parseInt(todo.done) === 1;
            return true;
        });

        filtered.sort((a, b) => {
            if (parseInt(a.done) !== parseInt(b.done)) {
                return parseInt(a.done) - parseInt(b.done);
            }
            if (AppState.todoSort === 'prio-desc') {
                return parseInt(b.priority) - parseInt(a.priority);
            } else if (AppState.todoSort === 'due-asc') {
                if (!a.due_date) return 1;
                if (!b.due_date) return -1;
                return new Date(a.due_date) - new Date(b.due_date);
            } else {
                return b.id - a.id;
            }
        });

        todoCount.textContent = `${filtered.length} items`;

        if (filtered.length === 0) {
            todoList.innerHTML = '<li class="empty-state">ToDoはありません。</li>';
            return;
        }

        filtered.forEach(todo => {
            const li = document.createElement('li');
            li.className = `todo-item prio-${todo.priority} ${parseInt(todo.done) === 1 ? 'completed' : ''}`;
            
            const priorityLabel = todo.priority === 2 || todo.priority === '2' ? '高' : todo.priority === 1 || todo.priority === '1' ? '中' : '低';
            
            let dueHtml = '';
            if (todo.due_date) {
                const todayStr = new Date().toISOString().split('T')[0];
                const isOverdue = todo.due_date < todayStr && parseInt(todo.done) === 0;
                dueHtml = `<span class="todo-due-badge ${isOverdue ? 'overdue' : ''}">
                    <i class="fa-regular fa-calendar"></i> ${todo.due_date}${isOverdue ? ' (期限超過)' : ''}
                </span>`;
            }

            li.innerHTML = `
                <div class="todo-item-left">
                    <div class="todo-checkbox-wrapper">
                        <input type="checkbox" class="todo-checkbox" ${parseInt(todo.done) === 1 ? 'checked' : ''}>
                        <div class="todo-checkbox-custom">
                            <i class="fa-solid fa-check"></i>
                        </div>
                    </div>
                    <div class="todo-item-info">
                        <span class="todo-item-title">${escapeHtml(todo.title)}</span>
                        ${todo.memo ? `<span class="todo-item-memo">${escapeHtml(todo.memo)}</span>` : ''}
                        <div class="todo-item-meta">
                            <span class="todo-badge prio-${todo.priority}">優先度: ${priorityLabel}</span>
                            ${dueHtml}
                        </div>
                    </div>
                </div>
                <div class="todo-item-actions">
                    <button class="btn-todo-edit" title="編集">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="btn-todo-delete" title="削除">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            `;

            li.querySelector('.todo-checkbox').addEventListener('change', async (e) => {
                const isDone = e.target.checked ? 1 : 0;
                await toggleTodoDone(todo.id, isDone);
            });

            li.querySelector('.btn-todo-edit').type = 'button';
            li.querySelector('.btn-todo-edit').addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                enterTodoEditMode(li, todo);
            });

            li.querySelector('.btn-todo-delete').type = 'button';
            li.querySelector('.btn-todo-delete').addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (confirm('このToDoを削除してもよろしいですか？')) {
                    await deleteTodo(todo.id);
                }
            });

            todoList.appendChild(li);
        });
    }

    async function toggleTodoDone(id, done) {
        if (!AppState.useLocalStorage) {
            const data = await apiRequest('api/todos_update.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, done })
            });
            if (data && !data.fallback) {
                await fetchTodos();
                window.say(done ? '完了！ えらい、ちゃんと前に進んでる。' : 'あれ？ まだ終わってなかったかな？', done ? 'happy' : 'neutral');
                renderCalendar();
                return;
            }
        }
        const todo = AppState.todos.find(t => String(t.id) === String(id));
        if (todo) {
            todo.done = done;
            localStorage.setItem('kazuno_todos', JSON.stringify(AppState.todos));
            renderTodos();
            window.say(done ? '完了！ えらい、ちゃんと前に進んでる。' : 'あれ？ まだ終わってなかったかな？', done ? 'happy' : 'neutral');
            renderCalendar();
        }
    }

    async function updateTodo(id, fields) {
        if (!AppState.useLocalStorage) {
            const data = await apiRequest('api/todos_update.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...fields })
            });
            if (data && !data.fallback) {
                await fetchTodos();
                renderCalendar();
                window.say('ToDoを更新したよ。', 'neutral');
                return;
            }
        }
        const todo = AppState.todos.find(t => String(t.id) === String(id));
        if (todo) {
            Object.assign(todo, fields);
            localStorage.setItem('kazuno_todos', JSON.stringify(AppState.todos));
            renderTodos();
            renderCalendar();
            window.say('ToDoを更新したよ。', 'neutral');
        }
    }

    function enterTodoEditMode(li, todo) {
        li.innerHTML = `
            <div class="todo-item-edit-form">
                <div class="todo-item-edit-row">
                    <input type="text" class="input-text edit-title" value="${escapeHtml(todo.title)}" placeholder="タイトル" required style="width:100%; box-sizing:border-box;">
                </div>
                <div class="todo-item-edit-row">
                    <select class="input-select edit-priority" title="優先度" style="flex: 1;">
                        <option value="0" ${parseInt(todo.priority) === 0 ? 'selected' : ''}>優先度: 低</option>
                        <option value="1" ${parseInt(todo.priority) === 1 ? 'selected' : ''}>優先度: 中</option>
                        <option value="2" ${parseInt(todo.priority) === 2 ? 'selected' : ''}>優先度: 高</option>
                    </select>
                    <input type="date" class="input-date edit-due-date" value="${todo.due_date || ''}" title="期限日" style="flex: 1;">
                </div>
                <div class="todo-item-edit-row">
                    <textarea class="input-textarea edit-memo" placeholder="メモ・詳細（任意）" style="width: 100%; box-sizing: border-box; height: 50px;">${escapeHtml(todo.memo || '')}</textarea>
                </div>
                <div class="todo-item-edit-actions">
                    <button class="btn btn-secondary btn-cancel-edit" type="button">キャンセル</button>
                    <button class="btn btn-primary btn-save-edit" type="button">保存</button>
                </div>
            </div>
        `;
        
        li.querySelector('.btn-cancel-edit').addEventListener('click', (e) => {
            e.stopPropagation();
            renderTodos();
        });
        
        li.querySelector('.btn-save-edit').addEventListener('click', async (e) => {
            e.stopPropagation();
            const title = li.querySelector('.edit-title').value.trim();
            const priority = parseInt(li.querySelector('.edit-priority').value);
            const due_date = li.querySelector('.edit-due-date').value || null;
            const memo = li.querySelector('.edit-memo').value.trim() || null;
            
            if (!title) {
                alert('タイトルを入力してください。');
                return;
            }
            
            await updateTodo(todo.id, { title, priority, due_date, memo });
        });
    }

    async function deleteTodo(id) {
        if (!AppState.useLocalStorage) {
            const data = await apiRequest('api/todos_delete.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            if (data && !data.fallback) {
                await fetchTodos();
                window.say('消したよ。すっきりしたね。', 'neutral');
                renderCalendar();
                return;
            }
        }
        AppState.todos = AppState.todos.filter(t => String(t.id) !== String(id));
        localStorage.setItem('kazuno_todos', JSON.stringify(AppState.todos));
        renderTodos();
        window.say('消したよ。すっきりしたね。', 'neutral');
        renderCalendar();
    }

    /* ==========================================================================
       3. カレンダー
       ========================================================================== */
    async function initCalendar() {
        const prevBtn = document.getElementById('calPrevMonth');
        const nextBtn = document.getElementById('calNextMonth');
        const calEventForm = document.getElementById('calEventForm');

        if (!prevBtn || !nextBtn) return;

        await fetchEvents();

        prevBtn.addEventListener('click', () => {
            AppState.selectedDate.setMonth(AppState.selectedDate.getMonth() - 1);
            renderCalendar();
        });

        nextBtn.addEventListener('click', () => {
            AppState.selectedDate.setMonth(AppState.selectedDate.getMonth() + 1);
            renderCalendar();
        });

        if (calEventForm) {
            calEventForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const title = document.getElementById('calEventTitle').value.trim();
                const start_time = document.getElementById('calEventStart').value || null;
                const end_time = document.getElementById('calEventEnd').value || null;
                const memo = document.getElementById('calEventMemo').value.trim() || null;
                const event_date = getSelectedDateString();

                if (!title || !event_date) return;

                if (!AppState.useLocalStorage) {
                    const data = await apiRequest('api/events_add.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ title, event_date, start_time, end_time, memo })
                    });
                    if (data && !data.fallback) {
                        resetEventForm();
                        await fetchEvents();
                        window.say('カレンダーに予定を書き込んだよ。忘れないでね！', 'happy');
                        return;
                    }
                }

                const newEvent = {
                    id: Date.now(),
                    title,
                    event_date,
                    start_time,
                    end_time,
                    memo
                };
                AppState.events.push(newEvent);
                localStorage.setItem('kazuno_events', JSON.stringify(AppState.events));
                resetEventForm();
                renderCalendar();
                window.say('カレンダーに予定を書き込んだよ。忘れないでね！', 'happy');
            });
        }

        function resetEventForm() {
            document.getElementById('calEventTitle').value = '';
            document.getElementById('calEventStart').value = '';
            document.getElementById('calEventEnd').value = '';
            document.getElementById('calEventMemo').value = '';
        }
    }

    async function fetchEvents() {
        const data = await apiRequest('api/events_list.php');
        if (data && !data.fallback) {
            AppState.events = data;
        } else {
            AppState.events = JSON.parse(localStorage.getItem('kazuno_events') || '[]');
        }
        renderCalendar();
    }

    function getSelectedDateString() {
        const year = AppState.selectedDate.getFullYear();
        const month = String(AppState.selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(AppState.selectedDate.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function renderCalendar() {
        const titleEl = document.getElementById('calCurrentMonthYear');
        const gridEl = document.getElementById('calendarDays');
        if (!titleEl || !gridEl) return;

        const currentYear = AppState.selectedDate.getFullYear();
        const currentMonth = AppState.selectedDate.getMonth();

        titleEl.textContent = `${currentYear}年 ${String(currentMonth + 1).padStart(2, '0')}月`;
        gridEl.innerHTML = '';

        const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
        const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
        const prevLastDay = new Date(currentYear, currentMonth, 0).getDate();

        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const selectedStr = getSelectedDateString();

        for (let i = firstDayIndex; i > 0; i--) {
            const dayNum = prevLastDay - i + 1;
            const tempDate = new Date(currentYear, currentMonth - 1, dayNum);
            const dateStr = `${tempDate.getFullYear()}-${String(tempDate.getMonth() + 1).padStart(2, '0')}-${String(tempDate.getDate()).padStart(2, '0')}`;
            gridEl.appendChild(createDayCell(dayNum, true, dateStr, todayStr, selectedStr));
        }

        for (let i = 1; i <= lastDay; i++) {
            const tempDate = new Date(currentYear, currentMonth, i);
            const dateStr = `${tempDate.getFullYear()}-${String(tempDate.getMonth() + 1).padStart(2, '0')}-${String(tempDate.getDate()).padStart(2, '0')}`;
            gridEl.appendChild(createDayCell(i, false, dateStr, todayStr, selectedStr));
        }

        const totalCells = gridEl.children.length;
        const nextMonthCells = 42 - totalCells;
        for (let i = 1; i <= nextMonthCells; i++) {
            const tempDate = new Date(currentYear, currentMonth + 1, i);
            const dateStr = `${tempDate.getFullYear()}-${String(tempDate.getMonth() + 1).padStart(2, '0')}-${String(tempDate.getDate()).padStart(2, '0')}`;
            gridEl.appendChild(createDayCell(i, true, dateStr, todayStr, selectedStr));
        }

        updateCalendarDetails();
    }

    function createDayCell(dayNum, isOtherMonth, dateStr, todayStr, selectedStr) {
        const cell = document.createElement('div');
        const dayOfWeek = new Date(dateStr).getDay();
        
        let dayClass = 'calendar-day';
        if (isOtherMonth) dayClass += ' other-month';
        if (dateStr === todayStr) dayClass += ' today';
        if (dateStr === selectedStr) dayClass += ' selected';
        if (dayOfWeek === 0) dayClass += ' sun';
        if (dayOfWeek === 6) dayClass += ' sat';

        cell.className = dayClass;
        cell.dataset.date = dateStr;
        cell.innerHTML = `
            <span class="day-number">${dayNum}</span>
            <div class="day-indicators"></div>
        `;

        const indicators = cell.querySelector('.day-indicators');
        const hasEvent = AppState.events.some(e => e.event_date === dateStr);
        const hasTodo = AppState.todos.some(t => t.due_date === dateStr && parseInt(t.done) === 0);

        if (hasEvent) indicators.innerHTML += '<span class="indicator-dot event"></span>';
        if (hasTodo) indicators.innerHTML += '<span class="indicator-dot todo"></span>';

        cell.addEventListener('click', () => {
            AppState.selectedDate = new Date(dateStr);
            renderCalendar();
        });

        return cell;
    }

    function updateCalendarDetails() {
        const selectedStr = getSelectedDateString();
        const dateTextEl = document.getElementById('calSelectedDateText');
        const listEl = document.getElementById('calDayEventList');
        
        if (!dateTextEl || !listEl) return;

        dateTextEl.textContent = `${AppState.selectedDate.getFullYear()}年 ${AppState.selectedDate.getMonth() + 1}月 ${AppState.selectedDate.getDate()}日の予定`;
        listEl.innerHTML = '';

        const dayEvents = AppState.events.filter(e => e.event_date === selectedStr);
        const dayTodos = AppState.todos.filter(t => t.due_date === selectedStr && parseInt(t.done) === 0);

        if (dayEvents.length === 0 && dayTodos.length === 0) {
            listEl.innerHTML = '<p class="empty-state">この日の予定はありません</p>';
            return;
        }

        dayEvents.forEach(evt => {
            const item = document.createElement('div');
            item.className = 'cal-event-item';
            const timeStr = evt.start_time ? `${evt.start_time.slice(0, 5)}${evt.end_time ? ` 〜 ${evt.end_time.slice(0, 5)}` : ''}` : '終日';
            
            item.innerHTML = `
                <div class="cal-event-info">
                    <span class="cal-event-title">${escapeHtml(evt.title)}</span>
                    <span class="cal-event-time"><i class="fa-regular fa-clock"></i> ${timeStr}</span>
                    ${evt.memo ? `<span class="cal-event-memo">${escapeHtml(evt.memo)}</span>` : ''}
                </div>
                <button class="btn-cal-delete" title="削除"><i class="fa-solid fa-xmark"></i></button>
            `;

            item.querySelector('.btn-cal-delete').addEventListener('click', () => {
                if (confirm('この予定を削除しますか？')) {
                    deleteEvent(evt.id);
                }
            });
            listEl.appendChild(item);
        });

        dayTodos.forEach(todo => {
            const item = document.createElement('div');
            item.className = 'cal-event-item cal-event-todo';
            item.innerHTML = `
                <div class="cal-event-info">
                    <span class="cal-event-title"><i class="fa-solid fa-list-check"></i> [ToDo] ${escapeHtml(todo.title)}</span>
                    <span class="cal-event-time">優先度: ${todo.priority === 2 || todo.priority === '2' ? '高' : todo.priority === 1 || todo.priority === '1' ? '中' : '低'}</span>
                </div>
            `;
            listEl.appendChild(item);
        });
    }

    async function deleteEvent(id) {
        if (!AppState.useLocalStorage) {
            const data = await apiRequest('api/events_delete.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            if (data && !data.fallback) {
                await fetchEvents();
                window.say('予定を削除したよ。', 'neutral');
                return;
            }
        }
        AppState.events = AppState.events.filter(e => e.id !== id);
        localStorage.setItem('kazuno_events', JSON.stringify(AppState.events));
        renderCalendar();
        window.say('予定を削除したよ。', 'neutral');
    }

    /* ==========================================================================
       4. ポモドーロタイマー
       ========================================================================== */
    let timerInterval = null;
    let timeLeft = 25 * 60;
    let currentPresetDuration = 25;
    let currentTimerType = 'work';
    let isTimerRunning = false;
    let timerStartedAt = null;
    let isTimerActive = false;
    let timerEndsAt = null;
    let alarmAudioContext = null;

    function initPomodoro() {
        const startBtn = document.getElementById('pomoStartBtn');
        const pauseBtn = document.getElementById('pomoPauseBtn');
        const resetBtn = document.getElementById('pomoResetBtn');
        const presetBtns = document.querySelectorAll('.pomodoro-presets button');
        
        const seq = AppState.settings.pomo_sequence || '';
        let initialType = 'work';
        if (seq !== '') {
            const firstChar = seq[0];
            if (firstChar === 'r') initialType = 'short_break';
            else if (firstChar === 'R') initialType = 'long_break';
        }
        currentTimerType = initialType;
        
        if (initialType === 'work') {
            currentPresetDuration = AppState.settings.pomo_work_time;
        } else if (initialType === 'short_break') {
            currentPresetDuration = AppState.settings.pomo_short_break;
        } else {
            currentPresetDuration = AppState.settings.pomo_long_break;
        }
        timeLeft = currentPresetDuration * 60;
        
        document.getElementById('pomoTimeWork').value = AppState.settings.pomo_work_time;
        document.getElementById('pomoTimeShort').value = AppState.settings.pomo_short_break;
        document.getElementById('pomoTimeLong').value = AppState.settings.pomo_long_break;
        const sequenceInput = document.getElementById('pomoSequenceInput');
        if (sequenceInput) {
            sequenceInput.value = AppState.settings.pomo_sequence || '';
        }

        // Set active class on preset buttons on init
        presetBtns.forEach(btn => {
            if (btn.getAttribute('data-type') === initialType) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        updateTimerUI();
        renderPomoLogs();

        startBtn.addEventListener('click', startTimer);
        pauseBtn.addEventListener('click', pauseTimer);
        resetBtn.addEventListener('click', resetTimer);

        presetBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                presetBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                changePreset(btn.getAttribute('data-type'));
            });
        });

        document.getElementById('savePomoSettingsBtn').addEventListener('click', async () => {
            const w = parseInt(document.getElementById('pomoTimeWork').value);
            const s = parseInt(document.getElementById('pomoTimeShort').value);
            const l = parseInt(document.getElementById('pomoTimeLong').value);
            const seqInput = document.getElementById('pomoSequenceInput');
            let seq = seqInput ? seqInput.value.trim() : '';

            if (seq !== '') {
                const invalidChars = seq.replace(/[wrR]/g, '');
                if (invalidChars.length > 0) {
                    alert('シークエンス文字列にはw、r、Rのみを含めることができます（w: 作業、r: 小休憩、R: 長休憩）。');
                    return;
                }
            }

            await saveSetting('pomo_work_time', w);
            await saveSetting('pomo_short_break', s);
            await saveSetting('pomo_long_break', l);
            await saveSetting('pomo_sequence', seq);

            AppState.pomoSequenceIndex = 0;

            alert('タイマー設定を保存しました。');
            if (!isTimerRunning) changePreset(currentTimerType);
        });

        // おしゃべり間隔の設定保存処理
        const saveSpeechIntervalBtn = document.getElementById('saveSpeechIntervalBtn');
        if (saveSpeechIntervalBtn) {
            saveSpeechIntervalBtn.addEventListener('click', async () => {
                const interval = parseInt(document.getElementById('kazunoSpeechInterval').value);
                if (isNaN(interval) || interval < 0) {
                    alert('有効な秒数を入力してください。(0で停止)');
                    return;
                }
                await saveSetting('speech_interval', interval);
                startRandomSpeechTimer(); // タイマー再起動
                alert(`おしゃべり間隔を ${interval} 秒に更新しました。`);
            });
        }
    }

    function changePreset(type, isAutoSequenceTransition = false) {
        currentTimerType = type;
        
        const presetBtns = document.querySelectorAll('.pomodoro-presets button');
        presetBtns.forEach(btn => {
            if (btn.getAttribute('data-type') === type) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        if (type === 'work') {
            currentPresetDuration = AppState.settings.pomo_work_time;
            document.getElementById('pomodoroModeLabel').textContent = '作業セッション';
        } else if (type === 'short_break') {
            currentPresetDuration = AppState.settings.pomo_short_break;
            document.getElementById('pomodoroModeLabel').textContent = '小休憩';
        } else {
            currentPresetDuration = AppState.settings.pomo_long_break;
            document.getElementById('pomodoroModeLabel').textContent = '長休憩';
        }
        
        isTimerActive = false;
        pauseTimer();
        timeLeft = currentPresetDuration * 60;

        if (!isAutoSequenceTransition && AppState.settings.pomo_sequence) {
            const seq = AppState.settings.pomo_sequence;
            const targetChar = type === 'work' ? 'w' : (type === 'short_break' ? 'r' : 'R');
            const foundIdx = seq.indexOf(targetChar);
            if (foundIdx !== -1) {
                AppState.pomoSequenceIndex = foundIdx;
            }
        }

        updateTimerUI();
    }

    function startTimer() {
        if (isTimerRunning) return;
        
        isTimerRunning = true;
        isTimerActive = true;
        timerStartedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
        timerEndsAt = Date.now() + (timeLeft * 1000);

        document.getElementById('pomoStartBtn').disabled = true;
        document.getElementById('pomoPauseBtn').disabled = false;
        
        let headerLabel = '作業中';
        if (currentTimerType === 'short_break') headerLabel = '小休憩';
        else if (currentTimerType === 'long_break') headerLabel = '長休憩';
        
        document.getElementById('headerTimerStatus').innerHTML = `<span class="status-dot green"></span><span class="status-label">${headerLabel}</span>`;

        window.say(`${currentPresetDuration}分、いっしょに潜ろう。`, 'thinking');

        updateRunningTimer();
        timerInterval = setInterval(updateRunningTimer, 1000);
    }

    function pauseTimer() {
        if (!isTimerRunning) return;
        
        updateRunningTimer();
        isTimerRunning = false;
        clearInterval(timerInterval);
        timerInterval = null;
        timerEndsAt = null;

        document.getElementById('pomoStartBtn').disabled = false;
        document.getElementById('pomoPauseBtn').disabled = true;
        document.getElementById('headerTimerStatus').innerHTML = '<span class="status-dot green" style="background:#f59e0b;box-shadow:0 0 8px #f59e0b"></span><span class="status-label">一時停止</span>';

        window.say('いったんストップだね。無理しないでね。', 'sad');
        updateTimerUI();
    }

    function resetTimer() {
        isTimerActive = false;
        pauseTimer();
        timerEndsAt = null;
        timeLeft = currentPresetDuration * 60;
        updateTimerUI();
        document.getElementById('headerTimerStatus').innerHTML = '<span class="status-dot green"></span><span class="status-label">Standby</span>';
        window.say('リセットしたよ。準備ができたら始めよう。', 'neutral');
    }

    function updateRunningTimer() {
        if (!isTimerRunning || !timerEndsAt) return;

        timeLeft = Math.max(0, Math.ceil((timerEndsAt - Date.now()) / 1000));
        updateTimerUI();

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            timerEndsAt = null;
            timerFinished();
        }
    }

    function updateTimerUI() {
        const clock = document.getElementById('pomodoroClock');
        if (!clock) return;

        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        clock.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        const circle = document.getElementById('timerProgressCircle');
        if (circle) {
            const totalDuration = currentPresetDuration * 60;
            const progress = timeLeft / totalDuration;
            const offset = 282.7 * (1 - progress);
            circle.style.strokeDashoffset = offset;
        }

        const headerPomo = document.getElementById('headerPomoTimer');
        const headerPomoText = document.getElementById('headerPomoTimerText');
        if (headerPomo && headerPomoText) {
            if (isTimerActive) {
                headerPomo.classList.remove('hide');
                const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                
                let typeLabel = '';
                if (!isTimerRunning) {
                    typeLabel = '停止';
                } else if (currentTimerType === 'work') {
                    typeLabel = '作業';
                } else if (currentTimerType === 'short_break') {
                    typeLabel = '小休';
                } else if (currentTimerType === 'long_break') {
                    typeLabel = '長休';
                }
                headerPomoText.textContent = `[${typeLabel}] ${timeStr}`;
            } else {
                headerPomo.classList.add('hide');
            }
        }
    }

    function playAlarm() {
        const audio = document.getElementById('notificationSound');
        if (audio) {
            audio.currentTime = 0;
            audio.volume = 0.8;
            audio.play().catch(() => playGeneratedAlarm());
            return;
        }
        playGeneratedAlarm();
    }

    function playGeneratedAlarm() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;

            alarmAudioContext = alarmAudioContext || new AudioContext();
            const ctx = alarmAudioContext;
            if (ctx.state === 'suspended') {
                ctx.resume();
            }
            const startAt = ctx.currentTime;

            [0, 0.18, 0.36].forEach((delay) => {
                const oscillator = ctx.createOscillator();
                const gain = ctx.createGain();
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(880, startAt + delay);
                gain.gain.setValueAtTime(0.0001, startAt + delay);
                gain.gain.exponentialRampToValueAtTime(0.18, startAt + delay + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.0001, startAt + delay + 0.12);
                oscillator.connect(gain).connect(ctx.destination);
                oscillator.start(startAt + delay);
                oscillator.stop(startAt + delay + 0.14);
            });
        } catch (e) {
            console.log('Alarm playback failed: ', e);
        }
    }

    async function saveCompletedPomodoro(timerEndedAt, cleanMemo) {
        if (!AppState.useLocalStorage) {
            const data = await apiRequest('api/pomodoro_add.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    started_at: timerStartedAt,
                    ended_at: timerEndedAt,
                    duration_minutes: currentPresetDuration,
                    type: currentTimerType,
                    memo: cleanMemo
                })
            });
            if (data && !data.fallback) {
                addLocalLogUI(timerStartedAt, currentPresetDuration, cleanMemo);
                return;
            }
        }

        const logs = JSON.parse(localStorage.getItem('kazuno_pomo_logs') || '[]');
        logs.unshift({ started_at: timerStartedAt, duration_minutes: currentPresetDuration, memo: cleanMemo });
        localStorage.setItem('kazuno_pomo_logs', JSON.stringify(logs));
        renderPomoLogs();
    }

    async function timerFinished() {
        isTimerRunning = false;
        isTimerActive = false;
        document.getElementById('pomoStartBtn').disabled = false;
        document.getElementById('pomoPauseBtn').disabled = true;
        document.getElementById('headerTimerStatus').innerHTML = '<span class="status-dot green"></span><span class="status-label">Standby</span>';
        updateTimerUI();
        playAlarm();

        {
            const seq = AppState.settings.pomo_sequence || '';
            if (seq !== '') {
                const timerEndedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
                const nextIndex = (AppState.pomoSequenceIndex + 1) % seq.length;
                const nextChar = seq[nextIndex];

                if (currentTimerType === 'work') {
                    window.say('Pomodoro complete. Moving to the next step.', 'happy');
                    await saveCompletedPomodoro(timerEndedAt, 'Pomodoro completed');
                } else {
                    window.say('Break complete. Moving to the next step.', 'fun');
                }

                transitionSequence(nextIndex, nextChar, true);
                return;

                /*
                if (currentTimerType === 'work') {
                    window.say('譎る俣縺繧医ゅ＞縺｣縺溘ｓ豬ｮ荳翫＠繧医▲縺九・, 'happy');
                    await saveCompletedPomodoro(timerEndedAt, 'Pomodoro completed');
                } else {
                    window.say('莨第・縺翫ｏ繧翫よｬ｡縺ｮ菴懈･ｭ縲√＞縺｣縺ｦ縺ｿ繧医≧・・, 'fun');
                }

                transitionSequence(nextIndex, nextChar, true);
                return;
                */
            }
        }

        const timerEndedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const seq = AppState.settings.pomo_sequence || '';

        if (seq !== '') {
            const nextIndex = (AppState.pomoSequenceIndex + 1) % seq.length;
            const nextChar = seq[nextIndex];

            if (currentTimerType === 'work') {
                window.say('時間だよ。いったん浮上しよっか。', 'happy');
                
                setTimeout(async () => {
                    let cleanMemo = '作業完了';
                    
                    if (nextChar === 'R') {
                        const memo = prompt('お疲れ様！ 長休憩に入ります。今回の作業内容をメモに残そう（任意）:');
                        cleanMemo = memo || '作業完了';
                    }

                    if (!AppState.useLocalStorage) {
                        const data = await apiRequest('api/pomodoro_add.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                started_at: timerStartedAt,
                                ended_at: timerEndedAt,
                                duration_minutes: currentPresetDuration,
                                type: 'work',
                                memo: cleanMemo
                            })
                        });
                        if (data && !data.fallback) {
                            addLocalLogUI(timerStartedAt, currentPresetDuration, cleanMemo);
                            transitionSequence(nextIndex, nextChar);
                            return;
                        }
                    }

                    const logs = JSON.parse(localStorage.getItem('kazuno_pomo_logs') || '[]');
                    logs.unshift({ started_at: timerStartedAt, duration_minutes: currentPresetDuration, memo: cleanMemo });
                    localStorage.setItem('kazuno_pomo_logs', JSON.stringify(logs));
                    renderPomoLogs();

                    transitionSequence(nextIndex, nextChar);
                }, 500);
            } else {
                window.say('休憩おわり。次の作業、いってみよう！', 'fun');
                transitionSequence(nextIndex, nextChar);
            }
        } else {
            if (currentTimerType === 'work') {
                window.say('時間だよ。いったん浮上しよっか。', 'happy');
                
                setTimeout(async () => {
                    const memo = prompt('お疲れ様！ 今回の作業内容をメモに残そう（任意）:');
                    const cleanMemo = memo || '作業完了';
                    
                    if (!AppState.useLocalStorage) {
                        const data = await apiRequest('api/pomodoro_add.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                started_at: timerStartedAt,
                                ended_at: timerEndedAt,
                                duration_minutes: currentPresetDuration,
                                type: 'work',
                                memo: cleanMemo
                            })
                        });
                        if (data && !data.fallback) {
                            addLocalLogUI(timerStartedAt, currentPresetDuration, cleanMemo);
                            return;
                        }
                    }

                    const logs = JSON.parse(localStorage.getItem('kazuno_pomo_logs') || '[]');
                    logs.unshift({ started_at: timerStartedAt, duration_minutes: currentPresetDuration, memo: cleanMemo });
                    localStorage.setItem('kazuno_pomo_logs', JSON.stringify(logs));
                    renderPomoLogs();
                }, 500);
            } else {
                window.say('休憩おわり。次の作業、いってみよう！', 'fun');
            }
        }
    }

    function transitionSequence(nextIndex, nextChar, autoStart = false) {
        AppState.pomoSequenceIndex = nextIndex;
        let nextType = 'work';
        if (nextChar === 'r') {
            nextType = 'short_break';
        } else if (nextChar === 'R') {
            nextType = 'long_break';
        }
        changePreset(nextType, true);
        if (autoStart) {
            setTimeout(startTimer, 500);
        }
    }

    function renderPomoLogs() {
        const list = document.getElementById('pomodoroLogList');
        if (!list) return;
        list.innerHTML = '';
        
        let logs = [];
        logs = JSON.parse(localStorage.getItem('kazuno_pomo_logs') || '[]');

        if (logs.length === 0) {
            list.innerHTML = '<li class="empty-state">今日のログはありません。</li>';
            return;
        }

        logs.forEach(log => {
            const li = document.createElement('li');
            li.className = 'pomo-log-item';
            const cleanTime = log.started_at.substring(11, 16);
            li.innerHTML = `
                <span><strong>${cleanTime}</strong> - ${log.duration_minutes}分作業</span>
                <span class="text-muted">${escapeHtml(log.memo)}</span>
            `;
            list.appendChild(li);
        });
    }

    function addLocalLogUI(time, duration, memo) {
        const logs = JSON.parse(localStorage.getItem('kazuno_pomo_logs') || '[]');
        logs.unshift({ started_at: time, duration_minutes: duration, memo: memo });
        localStorage.setItem('kazuno_pomo_logs', JSON.stringify(logs));
        renderPomoLogs();
    }

    /* ==========================================================================
       5. YouTube再生
       ========================================================================== */
    const VIDEO_HISTORY_KEY = 'kazuno_video_history';
    
    function initVideo() {
        const playBtn = document.getElementById('playVideoBtn');
        const urlInput = document.getElementById('videoUrlInput');

        if (!playBtn || !urlInput) return;

        if (AppState.settings.default_video_url) {
            urlInput.value = AppState.settings.default_video_url;
        }

        playBtn.addEventListener('click', () => {
            const url = urlInput.value.trim();
            if (url) playYoutubeVideo(url);
        });

        renderVideoHistory();
    }

    function extractYoutubeId(url) {
        const trimmed = url.trim();
        if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
            return trimmed;
        }
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = trimmed.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    function extractYoutubePlaylistId(url) {
        const trimmed = url.trim();
        // Try matching list=... parameter
        const match = trimmed.match(/[?&]list=([^#\&\?]+)/);
        if (match) {
            return match[1];
        }
        // Match raw playlist IDs (usually starting with PL, UU, LL, FL, RD, WL)
        if (/^(PL|UU|LL|FL|RD|WL)[a-zA-Z0-9_-]{12,}$/.test(trimmed)) {
            return trimmed;
        }
        return null;
    }

    function playYoutubeVideo(url, saveHistory = true) {
        const videoId = extractYoutubeId(url);
        const playlistId = extractYoutubePlaylistId(url);
        const placeholder = document.getElementById('videoPlaceholder');
        const wrapper = document.getElementById('videoIframeWrapper');
        const localLinkHelper = document.getElementById('videoLocalLink');

        if (!videoId && !playlistId) {
            window.say('それは有効なYouTubeのURLじゃないかも……？', 'angry');
            return;
        }

        const isLocalFile = window.location.protocol === 'file:';
        const domain = isLocalFile ? 'https://www.youtube-nocookie.com' : 'https://www.youtube.com';
        
        let embedUrl = '';
        if (videoId && playlistId) {
            embedUrl = `${domain}/embed/${videoId}?list=${playlistId}&autoplay=1&mute=1`;
        } else if (playlistId) {
            embedUrl = `${domain}/embed/videoseries?list=${playlistId}&autoplay=1&mute=1`;
        } else {
            embedUrl = `${domain}/embed/${videoId}?autoplay=1&mute=1`;
        }
        
        if (!isLocalFile) {
            embedUrl += `&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`;
        }

        placeholder.classList.add('hide');
        wrapper.classList.remove('hide');
        wrapper.innerHTML = `
            <iframe src="${embedUrl}" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
            </iframe>
        `;

        if (localLinkHelper) {
            if (isLocalFile) {
                localLinkHelper.classList.remove('hide');
                localLinkHelper.innerHTML = `
                    <i class="fa-solid fa-circle-info"></i> ローカル起動（file://）では動画によって埋め込み再生が制限される場合があります（エラー154など）。再生できない場合は <a href="${url}" target="_blank">YouTubeで直接開く <i class="fa-solid fa-arrow-up-right-from-square"></i></a> をお試しください。
                `;
            } else {
                localLinkHelper.classList.add('hide');
            }
        }

        window.say(playlistId ? '再生リストを読み込んだよ。連続再生できるね！' : '動画を開くね。作業用BGMかな？', 'present');

        if (saveHistory) {
            saveVideoToHistory(url);
            saveSetting('default_video_url', url);
        }
    }

    function saveVideoToHistory(url) {
        let history = JSON.parse(localStorage.getItem(VIDEO_HISTORY_KEY) || '[]');
        history = history.filter(item => item !== url);
        history.unshift(url);
        if (history.length > 10) history.pop();
        localStorage.setItem(VIDEO_HISTORY_KEY, JSON.stringify(history));
        renderVideoHistory();
    }

    function renderVideoHistory() {
        const list = document.getElementById('videoHistoryList');
        if (!list) return;

        list.innerHTML = '';
        const history = JSON.parse(localStorage.getItem(VIDEO_HISTORY_KEY) || '[]');

        if (history.length === 0) {
            list.innerHTML = '<li class="empty-state">再生履歴はありません。</li>';
            return;
        }

        history.forEach(url => {
            const li = document.createElement('li');
            li.className = 'video-history-item';
            li.textContent = url;
            li.title = url;
            li.addEventListener('click', () => {
                document.getElementById('videoUrlInput').value = url;
                playYoutubeVideo(url, false);
            });
            list.appendChild(li);
        });
    }

    /* ==========================================================================
       6. CLIもどき (コマンド端末)
       ========================================================================== */
    const cliHistory = [];
    let cliHistoryIndex = -1;

    function initCLI() {
        const cliInput = document.getElementById('cliInput');
        const cliOutput = document.getElementById('cliOutput');

        if (!cliInput || !cliOutput) return;

        updatePrompt();

        const closeBtn = document.getElementById('closeCanvasBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                const canvasWrapper = document.getElementById('cliCanvasWrapper');
                if (canvasWrapper) canvasWrapper.classList.add('hide');
            });
        }

        // 起動時にショートカット案内を挿入
        printCli('【ヒント】Ctrl + ` (バックティック) または / キーで、いつでもこのCLIタブに飛べます！', 'warning');

        cliInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const val = cliInput.value;
                if (cliInputResolver) {
                    cliInput.value = '';
                    printCli(val, 'bold');
                    const resolver = cliInputResolver;
                    cliInputResolver = null;
                    resolver(val);
                    return;
                }
                const cmd = val.trim();
                if (cmd) {
                    executeCommand(cmd);
                    cliInput.value = '';
                }
            } else if (e.ctrlKey && e.key === 'c') {
                if (activeBasicInterpreter && activeBasicInterpreter.running) {
                    e.preventDefault();
                    activeBasicInterpreter.stop();
                    printCli('\n[Interrupted]', 'danger');
                    window.say('実行を中断したよ！', 'present');
                    if (cliInputResolver) {
                        const resolver = cliInputResolver;
                        cliInputResolver = null;
                        resolver('');
                    }
                }
            } else if (e.key === 'ArrowUp') {
                if (cliHistory.length > 0) {
                    if (cliHistoryIndex === -1) {
                        cliHistoryIndex = cliHistory.length - 1;
                    } else if (cliHistoryIndex > 0) {
                        cliHistoryIndex--;
                    }
                    cliInput.value = cliHistory[cliHistoryIndex];
                }
                e.preventDefault();
            } else if (e.key === 'ArrowDown') {
                if (cliHistoryIndex !== -1) {
                    if (cliHistoryIndex < cliHistory.length - 1) {
                        cliHistoryIndex++;
                        cliInput.value = cliHistory[cliHistoryIndex];
                    } else {
                        cliHistoryIndex = -1;
                        cliInput.value = '';
                    }
                }
                e.preventDefault();
            }
        });

        // グローバルショートカットの登録
        document.addEventListener('keydown', (e) => {
            // Ctrl + ` でCLIへジャンプ
            if (e.ctrlKey && e.key === '`') {
                e.preventDefault();
                switchTab('cli');
                saveSetting('last_tab', 'cli');
            }
            // 入力中以外で / を押した時にCLIへジャンプ
            if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                e.preventDefault();
                switchTab('cli');
                saveSetting('last_tab', 'cli');
            }
        });
    }

    function printCli(text, type = '') {
        const output = document.getElementById('cliOutput');
        if (!output) return;

        const line = document.createElement('div');
        line.className = `cli-line ${type ? `text-${type}` : ''}`;
        line.textContent = text;
        
        output.appendChild(line);
        output.scrollTop = output.scrollHeight;
    }
    window.printCli = printCli;

    async function executeCommand(cmdLine) {
        cliHistory.push(cmdLine);
        cliHistoryIndex = -1;

        printCli(`kazuno:${shellCwd}> ${cmdLine}`, '');

        const args = parseCommandArgs(cmdLine);
        const baseCmd = args[0].toLowerCase();

        switch (baseCmd) {
            case 'help':
                showHelp();
                break;
            case 'clear':
            case 'cls':
                document.getElementById('cliOutput').innerHTML = '';
                const canvas = document.getElementById('cliCanvas');
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(0, 0, 400, 400);
                }
                break;
            case 'todo':
                await handleTodoCommand(args.slice(1));
                break;
            case 'timer':
                handleTimerCommand(args.slice(1));
                break;
            case 'cal':
                await handleCalCommand(args.slice(1));
                break;
            case 'play':
                handlePlayCommand(args.slice(1));
                break;
            case 'open':
                handleOpenCommand(args.slice(1));
                break;
            case 'calc':
                handleCalcCommand(args.slice(1));
                break;
            case 'hcalc':
                handleHcalcCommand();
                break;
            case 'ls':
            case 'files':
                handleLsCommand();
                break;
            case 'cd':
                handleCdCommand(args.slice(1));
                break;
            case 'mkdir':
                handleMkdirCommand(args.slice(1));
                break;
            case 'mv':
                handleMvCommand(args.slice(1));
                break;
            case 'cp':
                handleCpCommand(args.slice(1));
                break;
            case 'head':
                handleHeadCommand(args.slice(1));
                break;
            case 'tail':
                handleTailCommand(args.slice(1));
                break;
            case 'cat':
                handleCatCommand(args.slice(1));
                break;
            case 'rm':
            case 'del':
                handleRmCommand(args.slice(1));
                break;
            case 'export':
                handleExportCommand(args.slice(1));
                break;
            case 'import':
                handleImportCommand();
                break;
            case 'nano':
                handleNanoCommand(args.slice(1));
                break;
            case 'run':
                await handleRunCommand(args.slice(1));
                break;
            case 'kazuno':
                handleKazunoCommand(args.slice(1));
                break;
            case 'oneiro':
            case 'oneirotopia':
                handleOneiroCommand(args.slice(1));
                break;
            default:
                printCli(`エラー: コマンドが見つかりません "${baseCmd}"。 'help' で一覧を表示します。`, 'danger');
                window.say('え？ そのコマンドは知らないよ。helpを見てみて。', 'angry');
        }
    }

    function parseCommandArgs(cmdLine) {
        const matches = cmdLine.match(/("[^"]+"|[^\s"]+)/g);
        if (!matches) return [''];
        return matches.map(m => m.replace(/^"|"$/g, ''));
    }

    function showHelp() {
        printCli('=== コマンド一覧 ===', 'info');
        printCli('help                      - コマンド一覧を表示します。', 'muted');
        printCli('clear                     - ターミナルのログを消去します。', 'muted');
        printCli('todo list                 - ToDo一覧を表示します。', 'muted');
        printCli('todo add <内容> [期限]    - ToDoを追加します。 (例: todo add "原稿を書く" 2026-06-30)', 'muted');
        printCli('todo done <id>            - ToDoを完了します。', 'muted');
        printCli('todo delete <id>          - ToDoを削除します。', 'muted');
        printCli('todo today                - 期限が今日のToDoを表示します。', 'muted');
        printCli('timer <分>                - 指定した時間(分)で作業タイマーを開始します。', 'muted');
        printCli('timer break               - 5分休憩タイマーを開始します。', 'muted');
        printCli('timer stop                - タイマーを停止・リセットします。', 'muted');
        printCli('timer sequence [値]       - タイマーシークエンスを表示または設定します。(例: timer sequence wrwrwR, timer sequence none)', 'muted');
        printCli('cal today                 - 今日の予定を表示します。', 'muted');
        printCli('cal month                 - 当月の予定リストを表示します。', 'muted');
        printCli('cal add <日付> <予定>     - 予定を追加します。 (例: cal add 2026-06-28 請求確認)', 'muted');
        printCli('play <URL>                - YouTubeの動画を再生します。', 'muted');
        printCli('open <URL>                - 指定したURLをブラウザ別タブで開きます。', 'muted');
        printCli('calc [数式]               - 数式を評価して計算します (引数なしで履歴を表示)。', 'muted');
        printCli('hcalc                     - 計算機能(calc)の利用可能演算子・定数・関数のヘルプを表示します。', 'muted');
        printCli('ls                        - 仮想ファイル・フォルダの一覧を表示します。', 'muted');
        printCli('cd [フォルダ]             - フォルダを移動します (指定なしでルートへ)。', 'muted');
        printCli('mkdir <フォルダ名>        - 新規フォルダを作成します。', 'muted');
        printCli('cat <ファイル>            - ファイルの内容を表示します。', 'muted');
        printCli('rm [-r] <対象>            - ファイル・フォルダを削除します (フォルダは -r が必要)。', 'muted');
        printCli('mv <移動元> <移動先>      - ファイル・フォルダの移動・リネームを行います。', 'muted');
        printCli('cp [-r] <コピー元> <先>   - ファイル・フォルダをコピーします。', 'muted');
        printCli('head [-n 行数] <ファイル> - ファイルの最初の数行（デフォルト10行）を表示します。', 'muted');
        printCli('tail [-n 行数] <ファイル> - ファイルの最後の数行（デフォルト10行）を表示します。', 'muted');
        printCli('export <ファイル>         - ファイルをJSON形式でPCにダウンロードします。', 'muted');
        printCli('import                    - PCからファイルをインポートします。', 'muted');
        printCli('nano [ファイル]           - テキストエディタ(nano)を起動し編集します。', 'muted');
        printCli('run <ファイル>            - BASICプログラムファイルを実行します。', 'muted');
        printCli('kazuno <表情>             - 一埜の表情を手動で切り替えます。', 'muted');
        printCli('kazuno interval <秒>      - おしゃべり間隔(秒)を変更します。(0で停止)', 'muted');
        printCli('oneiro <サブコマンド>     - Oneirotopiaの将来用コマンドを実行します。', 'muted');
    }

    async function handleTodoCommand(subArgs) {
        const sub = subArgs[0] ? subArgs[0].toLowerCase() : '';
        if (sub === 'list') {
            printCli('--- ToDoリスト ---', 'info');
            if (AppState.todos.length === 0) {
                printCli('ToDoはありません。');
                return;
            }
            AppState.todos.forEach(t => {
                const check = parseInt(t.done) ? '[x]' : '[ ]';
                const due = t.due_date ? ` (期限: ${t.due_date})` : '';
                printCli(`ID: ${t.id} ${check} ${t.title}${due} [優先度: ${t.priority}]`);
            });
            window.say('ToDoリストを読みだしたよ。', 'present');
        } else if (sub === 'add') {
            const title = subArgs[1];
            const due_date = subArgs[2] || null;
            if (!title) {
                printCli('エラー: ToDoの内容を指定してください。', 'danger');
                return;
            }
            
            if (!AppState.useLocalStorage) {
                const data = await apiRequest('api/todos_add.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, priority: 0, due_date })
                });
                if (data && !data.fallback) {
                    await fetchTodos();
                    printCli(`ToDoを追加しました: "${title}"`, 'success');
                    window.say('追加したよ！ さすが、やる気十分だね。', 'happy');
                    renderCalendar();
                    return;
                }
            }

            const newTodo = {
                id: Date.now(),
                title,
                memo: null,
                done: 0,
                priority: 0,
                due_date,
                created_at: new Date().toISOString()
            };
            AppState.todos.push(newTodo);
            localStorage.setItem('kazuno_todos', JSON.stringify(AppState.todos));
            renderTodos();
            printCli(`ToDoを追加しました (ローカル保存): "${title}"`, 'success');
            window.say('追加したよ！ さすが、やる気十分だね。', 'happy');
            renderCalendar();

        } else if (sub === 'done') {
            const id = parseInt(subArgs[1]);
            if (isNaN(id)) {
                printCli('エラー: 有効なIDを指定してください。', 'danger');
                return;
            }
            await toggleTodoDone(id, 1);
            printCli(`ToDo ID: ${id} を完了にしました。`, 'success');
        } else if (sub === 'delete') {
            const id = parseInt(subArgs[1]);
            if (isNaN(id)) {
                printCli('エラー: 有効なIDを指定してください。', 'danger');
                return;
            }
            await deleteTodo(id);
            printCli(`ToDo ID: ${id} を削除しました。`, 'success');
        } else if (sub === 'today') {
            printCli('--- 今日のToDo期限 ---', 'info');
            const todayStr = new Date().toISOString().split('T')[0];
            const todayTodos = AppState.todos.filter(t => t.due_date === todayStr);
            if (todayTodos.length === 0) {
                printCli('今日が期限のToDoはありません。');
            } else {
                todayTodos.forEach(t => {
                    const check = parseInt(t.done) ? '[x]' : '[ ]';
                    printCli(`ID: ${t.id} ${check} ${t.title}`);
                });
            }
            window.say('今日のToDoをピックアップしたよ。', 'present');
        } else {
            printCli('エラー: 不正なtodoサブコマンドです。 list, add, done, delete, today が使えます。', 'danger');
        }
    }

    function handleTimerCommand(subArgs) {
        const sub = subArgs[0] ? subArgs[0].toLowerCase() : '';
        if (sub === 'sequence' || sub === 'seq') {
            const seqVal = subArgs[1];
            if (seqVal !== undefined) {
                let cleanSeq = seqVal.trim();
                if (cleanSeq === 'none' || cleanSeq === 'null' || cleanSeq === 'clear') {
                    cleanSeq = '';
                }
                if (cleanSeq !== '') {
                    const invalidChars = cleanSeq.replace(/[wrR]/g, '');
                    if (invalidChars.length > 0) {
                        printCli('エラー: シークエンス文字列には w, r, R の用いる文字のみを含めることができます。(w: 作業, r: 小休, R: 長休)', 'danger');
                        return;
                    }
                }
                
                saveSetting('pomo_sequence', cleanSeq);
                AppState.pomoSequenceIndex = 0;
                
                const sequenceInput = document.getElementById('pomoSequenceInput');
                if (sequenceInput) {
                    sequenceInput.value = cleanSeq;
                }
                
                if (cleanSeq === '') {
                    printCli('シークエンスモードを無効化しました。', 'warning');
                    window.say('シークエンスを解除したよ。', 'neutral');
                } else {
                    printCli(`シークエンスを登録・設定しました: ${cleanSeq}`, 'success');
                    window.say(`シークエンスを ${cleanSeq} に設定したよ！`, 'happy');
                }
            } else {
                const currentSeq = AppState.settings.pomo_sequence || '(設定なし)';
                printCli(`現在のタイマーシークエンス: ${currentSeq}`, 'info');
            }
        } else if (sub === 'break') {
            switchTab('pomodoro');
            const btn = document.querySelector('.pomodoro-presets button[data-type="short_break"]');
            if (btn) btn.click();
            startTimer();
            printCli('5分間の小休憩タイマーを開始しました。', 'success');
        } else if (sub === 'stop') {
            resetTimer();
            printCli('タイマーをリセットしました。', 'warning');
        } else {
            const min = parseInt(sub);
            if (!isNaN(min) && min > 0) {
                switchTab('pomodoro');
                pauseTimer();
                timeLeft = min * 60;
                currentPresetDuration = min;
                document.getElementById('pomodoroClock').textContent = `${String(min).padStart(2, '0')}:00`;
                document.getElementById('pomodoroModeLabel').textContent = 'カスタムセッション';
                startTimer();
                printCli(`${min}分間のカスタム作業タイマーを開始しました。`, 'success');
            } else {
                printCli('エラー: タイマー時間を分で指定するか、 break, stop, sequence [値] を指定してください。', 'danger');
            }
        }
    }

    async function handleCalCommand(subArgs) {
        const sub = subArgs[0] ? subArgs[0].toLowerCase() : '';
        if (sub === 'today') {
            printCli('--- 今日の予定 ---', 'info');
            const todayStr = new Date().toISOString().split('T')[0];
            const todayEvents = AppState.events.filter(e => e.event_date === todayStr);
            if (todayEvents.length === 0) {
                printCli('今日の予定はありません。');
            } else {
                todayEvents.forEach(e => {
                    const time = e.start_time ? ` [${e.start_time.slice(0, 5)}]` : ' [終日]';
                    printCli(`${time} ${e.title}`);
                });
            }
            window.say('今日のカレンダーを確認したよ。', 'neutral');
        } else if (sub === 'month') {
            printCli('--- 今月の予定 ---', 'info');
            const currentYearMonth = getSelectedDateString().slice(0, 7);
            const monthEvents = AppState.events.filter(e => e.event_date.startsWith(currentYearMonth));
            if (monthEvents.length === 0) {
                printCli('今月の予定はありません。');
            } else {
                monthEvents.forEach(e => {
                    printCli(`[${e.event_date}] ${e.title}`);
                });
            }
            window.say('今月の予定の一覧だよ。', 'present');
        } else if (sub === 'add') {
            const dateStr = subArgs[1];
            const title = subArgs[2];
            if (!dateStr || !title || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                printCli('エラー: 日付(YYYY-MM-DD)と予定タイトルを指定してください。 (例: cal add 2026-06-28 請求確認)', 'danger');
                return;
            }

            if (!AppState.useLocalStorage) {
                const data = await apiRequest('api/events_add.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, event_date: dateStr })
                });
                if (data && !data.fallback) {
                    await fetchEvents();
                    printCli(`カレンダーに登録しました: [${dateStr}] ${title}`, 'success');
                    window.say('予定を追加したよ！', 'happy');
                    return;
                }
            }

            const newEvent = {
                id: Date.now(),
                title,
                event_date: dateStr,
                start_time: null,
                end_time: null,
                memo: null
            };
            AppState.events.push(newEvent);
            localStorage.setItem('kazuno_events', JSON.stringify(AppState.events));
            renderCalendar();
            printCli(`カレンダーに登録しました (ローカル保存): [${dateStr}] ${title}`, 'success');
            window.say('予定を追加したよ！', 'happy');

        } else {
            printCli('エラー: 不正なcalサブコマンドです。 today, month, add が使えます。', 'danger');
        }
    }

    function handlePlayCommand(subArgs) {
        const input = subArgs[0];
        if (!input) {
            printCli('エラー: 再生するYouTube URL、動画ID、またはプレイリストファイルを指定してください。 (例: play dQw4w9WgXcQ, play playlist.txt)', 'danger');
            return;
        }

        const absPath = resolvePath(input);
        const files = getVfsFiles();
        if (files[absPath]) {
            const content = files[absPath];
            const lines = content.split(/\r?\n/);
            const videoIds = [];
            
            for (let line of lines) {
                line = line.trim();
                if (!line || line.startsWith('#')) continue;
                
                const vid = extractYoutubeId(line);
                if (vid) {
                    videoIds.push(vid);
                } else if (/^[a-zA-Z0-9_-]{11}$/.test(line)) {
                    videoIds.push(line);
                }
            }

            if (videoIds.length === 0) {
                printCli(`エラー: プレイリストファイル "${input}" から有効な動画IDが見つかりませんでした。`, 'danger');
                return;
            }

            printCli(`内部プレイリスト "${input}" から ${videoIds.length} 個の動画を読み込みました。`, 'success');
            
            const firstId = videoIds[0];
            const others = videoIds.slice(1).join(',');
            
            const isLocalFile = window.location.protocol === 'file:';
            const domain = isLocalFile ? 'https://www.youtube-nocookie.com' : 'https://www.youtube.com';
            
            let embedUrl = `${domain}/embed/${firstId}?autoplay=1&mute=1`;
            if (others) {
                embedUrl += `&playlist=${others}`;
            }
            if (!isLocalFile) {
                embedUrl += `&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`;
            }

            const placeholder = document.getElementById('videoPlaceholder');
            const wrapper = document.getElementById('videoIframeWrapper');
            const localLinkHelper = document.getElementById('videoLocalLink');

            if (placeholder && wrapper) {
                placeholder.classList.add('hide');
                wrapper.classList.remove('hide');
                wrapper.innerHTML = `
                    <iframe src="${embedUrl}" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowfullscreen>
                    </iframe>
                `;
            }

            switchTab('video');
            saveSetting('last_tab', 'video');
            window.say(`自作プレイリスト「${input}」から ${videoIds.length} 曲を読み込んで連続再生するね！`, 'happy');
            
            saveVideoToHistory(input);
            saveSetting('default_video_url', input);
        } else {
            switchTab('video');
            saveSetting('last_tab', 'video');
            playYoutubeVideo(input);
            printCli(`動画の埋め込み再生を開始しました: ${input}`, 'success');
        }
    }

    function handleOpenCommand(subArgs) {
        let url = subArgs[0];
        if (!url) {
            printCli('エラー: 開くURLを指定してください。', 'danger');
            return;
        }
        if (!/^https?:\/\//i.test(url)) {
            url = 'https://' + url;
        }
        window.open(url, '_blank');
        printCli(`外部ページを開きます: ${url}`, 'success');
        window.say('ブラウザで新しいページを開くね。行ってらっしゃい。', 'present');
    }

    const CALC_HISTORY_KEY = 'kazuno_calc_history';

    function handleHcalcCommand() {
        printCli('=== Calculator Help (hcalc) ===', 'info');
        printCli('【基本算術演算子】', 'success');
        printCli('  +, -, *, /, % (剰余), ** または ^ (べき乗)', 'muted');
        printCli('【比較演算子 (1:真, 0:偽)】', 'success');
        printCli('  ==, !=, <, >, <=, >=', 'muted');
        printCli('【論理演算子】', 'success');
        printCli('  && (かつ), || (または), ! (否定)', 'muted');
        printCli('【ビット演算子】', 'success');
        printCli('  & (AND), | (OR), ^ (XOR *プログラマー式自動判定時のみ), ~ (NOT), << (左シフト), >> (右シフト)', 'muted');
        printCli('【基数プレフィックス】', 'success');
        printCli('  0x (16進数), 0b (2進数), 0o (8進数)', 'muted');
        printCli('【組み込み定数】', 'success');
        printCli('  pi (円周率), e (ネイピア数), ans または _ (直前の計算結果)', 'muted');
        printCli('【組み込み関数】', 'success');
        printCli('  • 1引数: sqrt(x), sin(x), cos(x), tan(x), abs(x), log(x), log10(x), exp(x), ceil(x), floor(x), round(x), asin(x), acos(x), atan(x)', 'muted');
        printCli('  • 2引数: pow(x,y), max(x,y,...), min(x,y,...), atan2(y,x)', 'muted');
        printCli('  • ビット関数: and(x,y), or(x,y), xor(x,y), not(x), shl(x,y), shr(x,y)', 'muted');
        printCli('【履歴参照】', 'success');
        printCli('  引数なしで \'calc\' を実行すると過去10回の計算履歴を表示します。', 'muted');
        window.say('計算機で使える記号や関数をまとめておいたよ！', 'happy');
    }

    function handleCalcCommand(subArgs) {
        const formula = subArgs.join(' ');
        if (!formula) {
            printCli('--- 計算履歴 (最新10件) ---', 'info');
            const history = JSON.parse(localStorage.getItem(CALC_HISTORY_KEY) || '[]');
            if (history.length === 0) {
                printCli('履歴はありません。', 'muted');
            } else {
                history.forEach((item, index) => {
                    printCli(`[${index + 1}] ${item.formula} = ${item.result}`);
                });
            }
            return;
        }
        try {
            const result = window.CalculatorParser.evaluate(formula);
            printCli(`数式: ${formula}`, 'muted');
            
            // 履歴に追加
            const history = JSON.parse(localStorage.getItem(CALC_HISTORY_KEY) || '[]');
            history.unshift({ formula, result });
            if (history.length > 10) history.pop();
            localStorage.setItem(CALC_HISTORY_KEY, JSON.stringify(history));

            if (typeof result === 'number' && Number.isInteger(result)) {
                printCli(`答え: ${result}`, 'success');
                const u32 = result >>> 0;
                printCli(`  [基数変換] 16進数: 0x${u32.toString(16).toUpperCase()} | 2進数: 0b${u32.toString(2)} | 8進数: 0o${u32.toString(8)}`, 'info');
            } else {
                printCli(`答え: ${result}`, 'success');
            }
            window.say(`計算したよ！ 答えは ${result} だね。`, 'thinking');
        } catch (e) {
            printCli(`計算エラー: ${e.message}`, 'danger');
            window.say('数式が間違っているみたい。もう一度確認してみて。', 'angry');
        }
    }

    function handleKazunoCommand(subArgs) {
        const sub = subArgs[0] ? subArgs[0].toLowerCase() : '';
        if (sub === 'interval') {
            const sec = parseInt(subArgs[1]);
            if (isNaN(sec) || sec < 0) {
                printCli('エラー: おしゃべり間隔(秒)を正の整数で指定してください。(0で停止)', 'danger');
                return;
            }
            saveSetting('speech_interval', sec);
            startRandomSpeechTimer();
            printCli(`一埜のおしゃべり間隔を ${sec} 秒に変更しました。`, 'success');
            window.say(`これからは ${sec} 秒おきにおしゃべりするね！`, 'happy');
            
            const intervalInput = document.getElementById('kazunoSpeechInterval');
            if (intervalInput) intervalInput.value = sec;
        } else {
            const allowedEmotions = ['neutral', 'happy', 'angry', 'sad', 'fun', 'thinking', 'present'];
            if (allowedEmotions.includes(sub)) {
                window.say(`表情を「${sub}」に切り替えたよ。`, sub);
                printCli(`一埜の表情を ${sub} に変更しました。`, 'success');
            } else {
                printCli('エラー: 表情(neutral, happy, etc)か、サブコマンド interval を指定してください。', 'danger');
            }
        }
    }

    function handleOneiroCommand(subArgs) {
        printCli('Oneirotopia システム:', 'info');
        printCli('現在、迷宮コア「Oneirotopia」は工事中です。将来の実装をお楽しみに！', 'warning');
        window.say('Oneirotopiaは、お兄ちゃんといっしょにまだ開発中なんだ。工事が終わるまで待っててね。', 'present');
    }

    // --- Virtual Filesystem (VFS) for BASIC programs ---
    const VFS_KEY = 'kazuno_virtual_files';
    let lastSyncedVfs = null;
    let vfsCacheTimer = null;
    let vfsDbSyncTimer = null;

    function createEmptyVfs() {
        return { files: {}, dirs: ['/'] };
    }

    function cloneVfs(vfs) {
        return {
            files: { ...(vfs && vfs.files ? vfs.files : {}) },
            dirs: Array.isArray(vfs && vfs.dirs) ? [...vfs.dirs] : ['/']
        };
    }

    function normalizeVfs(parsed) {
        const vfs = createEmptyVfs();
        if (!parsed || typeof parsed !== 'object') {
            return vfs;
        }

        if (parsed.files && parsed.dirs) {
            vfs.files = { ...parsed.files };
            vfs.dirs = Array.isArray(parsed.dirs) ? [...parsed.dirs] : ['/'];
        } else {
            for (const name in parsed) {
                const path = name.startsWith('/') ? name : '/' + name;
                vfs.files[path] = parsed[name];
            }
        }

        if (!vfs.dirs.includes('/')) {
            vfs.dirs.unshift('/');
        }
        return vfs;
    }

    function loadVfsFromCache() {
        try {
            return normalizeVfs(JSON.parse(localStorage.getItem(VFS_KEY) || 'null'));
        } catch (err) {
            return createEmptyVfs();
        }
    }

    function scheduleVfsCacheWrite(vfs) {
        clearTimeout(vfsCacheTimer);
        vfsCacheTimer = setTimeout(() => {
            try {
                localStorage.setItem(VFS_KEY, JSON.stringify(vfs));
            } catch (err) {
                console.warn('Failed to cache VFS snapshot', err);
            }
        }, 1000);
    }

    function scheduleVfsDbSync(vfs) {
        if (AppState.useLocalStorage) return;
        clearTimeout(vfsDbSyncTimer);
        const snapshot = cloneVfs(vfs);
        vfsDbSyncTimer = setTimeout(() => {
            syncVfsToDb(snapshot);
        }, 250);
    }

    async function syncVfsToDb(vfs) {
        if (AppState.useLocalStorage) return;
        if (!lastSyncedVfs) {
            lastSyncedVfs = { files: {}, dirs: ['/'] };
        }
        
        try {
            // Diff and save/replace new/modified files
            for (const path in vfs.files) {
                const content = vfs.files[path];
                if (lastSyncedVfs.files[path] !== content) {
                    await apiRequest('api/vfs_save.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ path, content, is_dir: 0 })
                    });
                }
            }
            // Diff and delete removed files
            for (const path in lastSyncedVfs.files) {
                if (!vfs.files.hasOwnProperty(path)) {
                    await apiRequest('api/vfs_delete.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ path, recursive: 0 })
                    });
                }
            }
            // Diff and save new directories
            for (const path of vfs.dirs) {
                if (!lastSyncedVfs.dirs.includes(path)) {
                    await apiRequest('api/vfs_save.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ path, content: null, is_dir: 1 })
                    });
                }
            }
            // Diff and delete removed directories (except root)
            for (const path of lastSyncedVfs.dirs) {
                if (path !== '/' && !vfs.dirs.includes(path)) {
                    await apiRequest('api/vfs_delete.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ path, recursive: 1 })
                    });
                }
            }
            lastSyncedVfs = cloneVfs(vfs);
        } catch (e) {
            console.error('Failed to sync VFS to database', e);
        }
    }

    async function loadVfsFromDb() {
        if (AppState.useLocalStorage) return false;
        try {
            const items = await apiRequest('api/vfs_list.php');
            if (items && Array.isArray(items)) {
                const vfs = createEmptyVfs();
                for (const item of items) {
                    const path = item.path;
                    const isDir = parseInt(item.is_dir) === 1;
                    if (isDir) {
                        if (!vfs.dirs.includes(path)) {
                            vfs.dirs.push(path);
                        }
                    } else {
                        vfs.files[path] = item.content || '';
                    }
                }
                AppState.vfs = vfs;
                lastSyncedVfs = cloneVfs(vfs);
                scheduleVfsCacheWrite(vfs);
                return true;
            }
        } catch (e) {
            console.error('Failed to load VFS from database, using LocalStorage', e);
        }
        return false;
    }

    function getVfs() {
        if (!AppState.vfs || !AppState.vfs.files || !AppState.vfs.dirs) {
            AppState.vfs = createEmptyVfs();
        }
        return AppState.vfs;
    }

    function saveVfs(vfs) {
        AppState.vfs = vfs;
        scheduleVfsDbSync(vfs);
        scheduleVfsCacheWrite(vfs);
    }

    function getVfsFiles() {
        return getVfs().files;
    }

    function saveVfsFile(filename, content) {
        const vfs = getVfs();
        const absPath = resolvePath(filename);
        vfs.files[absPath] = content;
        saveVfs(vfs);
    }

    function deleteVfsFile(filename) {
        const vfs = getVfs();
        const absPath = resolvePath(filename);
        delete vfs.files[absPath];
        saveVfs(vfs);
    }

    async function initVfs() {
        const loadedFromDb = await loadVfsFromDb();
        if (!loadedFromDb) {
            AppState.vfs = loadVfsFromCache();
            lastSyncedVfs = cloneVfs(AppState.vfs);
        }
        const vfs = getVfs();
        let changed = false;
        if (!vfs.files['/guess.bas']) {
            vfs.files['/guess.bas'] = `10 PRINT "=== Guess the Number Game ==="
20 LET N = 42
30 PRINT "I have chosen a number between 1 and 100."
40 PRINT "Can you guess it?"
50 INPUT "Your guess: ", G
60 IF G == N THEN GOTO 100
70 IF G < N THEN PRINT "Too low! Try again."
80 IF G > N THEN PRINT "Too high! Try again."
90 GOTO 50
100 PRINT "Congratulations! You guessed it!"
110 END`;
            changed = true;
        }
        if (!vfs.files['/fib.bas']) {
            vfs.files['/fib.bas'] = `10 PRINT "=== Fibonacci Sequence ==="
20 INPUT "How many terms? ", N
30 LET A = 0
40 LET B = 1
50 PRINT A
60 PRINT B
70 LET I = 2
80 IF I >= N THEN GOTO 150
90 LET C = A + B
100 PRINT C
110 LET A = B
120 LET B = C
130 LET I = I + 1
140 GOTO 80
150 PRINT "Done!"
160 END`;
            changed = true;
        }
        if (!vfs.files['/graph.bas']) {
            vfs.files['/graph.bas'] = `10 CLS
20 PRINT "=== Polar & Cartesian Graph ==="
30 GRAPH init
40 PRINT "Plotting Rose Curve in Cyan: r = 8 * sin(4 * theta)"
50 GRAPH polar "8 * sin(4 * theta)", "cyan"
60 PRINT "Plotting y = x^2 - 4 in Yellow"
70 GRAPH xy "x^2 - 4", "yellow"
80 PRINT "Plotting finished!"
90 END`;
            changed = true;
        }
        if (!vfs.files['/art.bas']) {
            vfs.files['/art.bas'] = `10 CLS
20 PRINT "=== BASIC Drawing Art Demo ==="
30 PRINT "Drawing concentric circles and grid pattern..."
40 FOR I = 20 TO 180 STEP 20
50 CIRCLE 200, 200, I
60 NEXT I
70 LINE 50, 50, 350, 50, "red"
80 LINE 50, 350, 350, 350, "red"
90 LINE 50, 50, 50, 350, "red"
100 LINE 350, 50, 350, 350, "red"
110 PRINT "Finished drawing art!"
120 END`;
            changed = true;
        }
        if (!vfs.files['/playlist.txt']) {
            vfs.files['/playlist.txt'] = `# 一埜のおすすめ作業用プレイリスト
# 再生したいYouTubeのURLや動画IDを1行に1つずつ書いてね！
# ハッシュ記号「#」で始まる行はコメントとして無視されます。

# Rick Astley - Never Gonna Give You Up
dQw4w9WgXcQ

# Lofi sample track
J_QGZopb1zU
`;
            changed = true;
        }
        if (changed) {
            saveVfs(vfs);
        }
    }

    function handleLsCommand() {
        const vfs = getVfs();
        const files = vfs.files;
        const dirs = vfs.dirs;
        
        const currentDir = shellCwd === '/' ? '/' : shellCwd + '/';
        const children = [];
        
        // Find subdirectories
        dirs.forEach(d => {
            if (d === shellCwd) return;
            if (d.startsWith(currentDir)) {
                const rel = d.slice(currentDir.length);
                if (rel && !rel.includes('/')) {
                    children.push({ name: rel + '/', type: 'dir' });
                }
            }
        });
        
        // Find files
        Object.keys(files).forEach(f => {
            if (f.startsWith(currentDir)) {
                const rel = f.slice(currentDir.length);
                if (rel && !rel.includes('/')) {
                    children.push({ name: rel, type: 'file', size: files[f].length });
                }
            }
        });
        
        printCli(`--- ディレクトリ一覧: ${shellCwd} ---`, 'info');
        if (children.length === 0) {
            printCli('このディレクトリは空です。', 'muted');
        } else {
            children.sort((a, b) => a.name.localeCompare(b.name));
            children.forEach(child => {
                if (child.type === 'dir') {
                    printCli(`  ${child.name}`, 'info');
                } else {
                    printCli(`  ${child.name.padEnd(20)} (${child.size} 文字)`, 'success');
                }
            });
        }
        window.say('今いる場所のファイル一覧だよ！', 'happy');
    }

    function handleCatCommand(subArgs) {
        const filename = subArgs[0];
        if (!filename) {
            printCli('エラー: ファイル名を指定してください。 (例: cat guess.bas)', 'danger');
            return;
        }
        const absPath = resolvePath(filename);
        const files = getVfsFiles();
        if (!files[absPath]) {
            printCli(`エラー: ファイル "${filename}" が見つかりません。`, 'danger');
            return;
        }
        printCli(`=== ${filename} ===`, 'info');
        printCli(files[absPath], '');
    }

    function handleRmCommand(subArgs) {
        let recursive = false;
        let target = '';
        if (subArgs[0] === '-r' || subArgs[0] === '-R') {
            recursive = true;
            target = subArgs[1];
        } else {
            target = subArgs[0];
        }

        if (!target) {
            printCli('rm: ファイル名またはディレクトリ名を入力してください。', 'danger');
            return;
        }

        const absPath = resolvePath(target);
        const vfs = getVfs();

        if (vfs.files.hasOwnProperty(absPath)) {
            delete vfs.files[absPath];
            saveVfs(vfs);
            printCli(`ファイル "${absPath}" を削除しました。`, 'success');
            window.say(`「${target}」を消したよ。`, 'present');
        } else if (vfs.dirs.includes(absPath)) {
            if (!recursive) {
                printCli(`rm: '${target}' はディレクトリです。削除するには -r を指定してください。`, 'danger');
                return;
            }
            if (absPath === '/') {
                printCli('rm: ルートディレクトリは削除できません。', 'danger');
                return;
            }
            vfs.dirs = vfs.dirs.filter(d => d !== absPath && !d.startsWith(absPath + '/'));
            for (const f in vfs.files) {
                if (f.startsWith(absPath + '/')) {
                    delete vfs.files[f];
                }
            }
            saveVfs(vfs);
            printCli(`ディレクトリ "${absPath}" を削除しました。`, 'success');
            window.say(`フォルダ「${target}」を消したよ。`, 'present');
        } else {
            printCli(`rm: '${target}': そのようなファイルやディレクトリはありません。`, 'danger');
        }
    }

    function handleExportCommand(subArgs) {
        const filename = subArgs[0];
        if (!filename) {
            printCli('エラー: エクスポートするファイル名を指定してください。 (例: export guess.bas)', 'danger');
            return;
        }
        const absPath = resolvePath(filename);
        const files = getVfsFiles();
        if (!files[absPath]) {
            printCli(`エラー: ファイル "${filename}" が見つかりません。`, 'danger');
            return;
        }
        const content = files[absPath];
        const basename = filename.substring(filename.lastIndexOf('/') + 1);
        
        let exportData, exportName, mimeType;
        if (basename.endsWith('.json')) {
            exportData = content;
            exportName = basename;
            mimeType = 'application/json';
        } else {
            const jsonWrapper = {
                filename: basename,
                content: content,
                exportedAt: new Date().toISOString()
            };
            exportData = JSON.stringify(jsonWrapper, null, 2);
            exportName = basename.replace(/\.bas$/, '') + '.json';
            mimeType = 'application/json';
        }

        const blob = new Blob([exportData], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = exportName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        printCli(`ファイルをエクスポートしました: ${exportName}`, 'success');
        window.say(`「${exportName}」のエクスポートデータを保存したよ！`, 'happy');
    }

    function handleImportCommand() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.bas,.txt';
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = readerEvent => {
                const content = readerEvent.target.result;
                let filename = file.name;
                let fileContent = content;

                if (filename.endsWith('.json')) {
                    try {
                        const parsed = JSON.parse(content);
                        if (parsed.filename && parsed.content !== undefined) {
                            filename = parsed.filename;
                            fileContent = parsed.content;
                        }
                    } catch (err) {
                        // Ignore
                    }
                }
                const absPath = shellCwd === '/' ? '/' + filename : shellCwd + '/' + filename;
                saveVfsFile(absPath, fileContent);
                printCli(`ファイルをインポートしました: ${absPath} (${fileContent.length} 文字)`, 'success');
                window.say(`「${filename}」を読み込んだよ！`, 'happy');
            };
            reader.readAsText(file);
        };
        input.click();
    }

    function handleNanoCommand(subArgs) {
        let filename = subArgs[0] || 'untitled.bas';
        if (!filename.includes('.')) {
            filename += '.bas';
        }

        const files = getVfsFiles();
        const initialContent = files[filename] || '';
        const initialLineCount = initialContent ? initialContent.split('\n').length : 0;

        const cliOutput = document.getElementById('cliOutput');
        const cliInputLine = document.querySelector('.cli-input-line');
        const cliTerminal = document.querySelector('.cli-terminal');

        if (!cliOutput || !cliInputLine || !cliTerminal) {
            printCli('エラー: CLI端末コンテナが見つかりません。', 'danger');
            return;
        }

        cliOutput.classList.add('hide');
        cliInputLine.classList.add('hide');

        const editorDiv = document.createElement('div');
        editorDiv.className = 'cli-editor';
        editorDiv.id = 'cliEditor';
        editorDiv.innerHTML = `
            <div class="editor-header">
                <span class="editor-header-left">  GNU nano 5.09</span>
                <span class="editor-header-center">File: <strong>${filename}</strong></span>
                <span class="editor-header-right" id="editorModified"></span>
            </div>
            <textarea class="editor-textarea" id="editorTextarea" spellcheck="false" placeholder="10 PRINT \\"HELLO\\"\\n20 GOTO 10"></textarea>
            <div class="editor-status-bar" id="editorStatusBar"></div>
            <div class="editor-shortcuts">
                <div class="shortcut-item" id="editorShortcutHelp"><span class="key">^G</span><span class="label">Get Help</span></div>
                <div class="shortcut-item" id="editorShortcutSave"><span class="key">^O</span><span class="label">WriteOut</span></div>
                <div class="shortcut-item" id="editorShortcutRead"><span class="key">^R</span><span class="label">Read File</span></div>
                <div class="shortcut-item" id="editorShortcutPrev"><span class="key">^Y</span><span class="label">Prev Pg</span></div>
                <div class="shortcut-item" id="editorShortcutCut"><span class="key">^K</span><span class="label">Cut Text</span></div>
                <div class="shortcut-item" id="editorShortcutPos"><span class="key">^C</span><span class="label">Cur Pos</span></div>
                <div class="shortcut-item" id="editorShortcutExit"><span class="key">^X</span><span class="label">Exit</span></div>
                <div class="shortcut-item" id="editorShortcutJustify"><span class="key">^J</span><span class="label">Justify</span></div>
                <div class="shortcut-item" id="editorShortcutSearch"><span class="key">^W</span><span class="label">Where Is</span></div>
                <div class="shortcut-item" id="editorShortcutNext"><span class="key">^V</span><span class="label">Next Pg</span></div>
                <div class="shortcut-item" id="editorShortcutPaste"><span class="key">^U</span><span class="label">Paste Text</span></div>
                <div class="shortcut-item" id="editorShortcutSpell"><span class="key">^T</span><span class="label">To Spell</span></div>
            </div>
        `;

        cliTerminal.appendChild(editorDiv);

        const textarea = document.getElementById('editorTextarea');
        textarea.value = initialContent;
        textarea.focus();

        const modifiedEl = document.getElementById('editorModified');
        const statusBarEl = document.getElementById('editorStatusBar');

        if (initialContent) {
            statusBarEl.textContent = `[ Read ${initialLineCount} line${initialLineCount > 1 ? 's' : ''} ]`;
        }

        let savedContent = initialContent;

        // Monitor inputs to display Modified tag
        textarea.addEventListener('input', () => {
            if (textarea.value !== savedContent) {
                modifiedEl.textContent = 'Modified  ';
            } else {
                modifiedEl.textContent = '';
            }
        });

        function saveContent() {
            const currentContent = textarea.value;
            saveVfsFile(filename, currentContent);
            savedContent = currentContent;
            modifiedEl.textContent = '';
            window.say(`「${filename}」を保存したよ！`, 'happy');
            
            const lineCount = currentContent.split('\n').length;
            statusBarEl.textContent = `[ Wrote ${lineCount} line${lineCount > 1 ? 's' : ''} ]`;
            setTimeout(() => {
                if (statusBarEl.textContent.startsWith('[ Wrote ')) {
                    statusBarEl.textContent = '';
                }
            }, 3000);
        }

        function exitEditor() {
            editorDiv.remove();
            cliOutput.classList.remove('hide');
            cliInputLine.classList.remove('hide');
            
            cliOutput.scrollTop = cliOutput.scrollHeight;
            
            const cliInput = document.getElementById('cliInput');
            if (cliInput) {
                cliInput.focus();
            }

            printCli(`nano: ${filename} の編集を終了しました。`, 'info');
        }

        function showUnimplementedMsg(key) {
            statusBarEl.textContent = `[ ショートカット '${key}' は実装されていません ]`;
            setTimeout(() => {
                if (statusBarEl.textContent.includes(`'${key}'`)) {
                    statusBarEl.textContent = '';
                }
            }, 1500);
        }

        // Add action triggers
        document.getElementById('editorShortcutSave').addEventListener('click', saveContent);
        document.getElementById('editorShortcutExit').addEventListener('click', () => {
            if (textarea.value !== savedContent) {
                if (confirm('変更が保存されていません。保存せずに終了しますか？')) {
                    exitEditor();
                }
            } else {
                exitEditor();
            }
        });

        // Dummy actions for other shortcuts
        const dummyShortcuts = [
            { id: 'editorShortcutHelp', name: '^G' },
            { id: 'editorShortcutRead', name: '^R' },
            { id: 'editorShortcutPrev', name: '^Y' },
            { id: 'editorShortcutCut', name: '^K' },
            { id: 'editorShortcutPos', name: '^C' },
            { id: 'editorShortcutJustify', name: '^J' },
            { id: 'editorShortcutSearch', name: '^W' },
            { id: 'editorShortcutNext', name: '^V' },
            { id: 'editorShortcutPaste', name: '^U' },
            { id: 'editorShortcutSpell', name: '^T' }
        ];

        dummyShortcuts.forEach(s => {
            document.getElementById(s.id).addEventListener('click', () => showUnimplementedMsg(s.name));
        });

        textarea.addEventListener('keydown', e => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                saveContent();
            } else if (e.ctrlKey && e.key === 'q') {
                e.preventDefault();
                document.getElementById('editorShortcutExit').click();
            } else if (e.ctrlKey && ['g','r','y','k','c','j','w','v','u','t'].includes(e.key.toLowerCase())) {
                e.preventDefault();
                showUnimplementedMsg('^' + e.key.toUpperCase());
            }
        });
    }

    class BasicInterpreter {
        constructor(code, printFn, readLineFn) {
            this.code = code;
            this.printFn = printFn;
            this.readLineFn = readLineFn;
            this.variables = {};
            this.callStack = [];
            this.forLoops = {};
            this.program = [];
            this.running = false;
            this.pcIndex = 0;
        }

        parse() {
            const lines = this.code.split('\n');
            this.program = [];
            for (let line of lines) {
                line = line.trim();
                if (!line) continue;
                const match = line.match(/^(\d+)\s*(.*)$/);
                if (!match) {
                    throw new Error(`構文エラー: 行番号がありません: "${line}"`);
                }
                const lineNum = parseInt(match[1]);
                const statement = match[2].trim();
                this.program.push({ lineNum, statement });
            }
            this.program.sort((a, b) => a.lineNum - b.lineNum);
        }

        evaluateExpr(expr) {
            expr = expr.trim();
            if (expr.startsWith('"') && expr.endsWith('"')) {
                return expr.slice(1, -1);
            }
            if (/^[a-zA-Z_][a-zA-Z0-9_\$]*\$$/.test(expr)) {
                return this.variables[expr] || "";
            }
            return window.CalculatorParser.evaluate(expr, this.variables);
        }

        parsePrintArgs(argStr) {
            const parts = [];
            let current = '';
            let inQuote = false;
            for (let i = 0; i < argStr.length; i++) {
                const char = argStr[i];
                if (char === '"') {
                    inQuote = !inQuote;
                    current += char;
                } else if ((char === ';' || char === ',') && !inQuote) {
                    if (current.trim()) parts.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            if (current.trim()) parts.push(current.trim());
            return parts;
        }

        parseCommaArgs(argsStr) {
            const result = [];
            let current = '';
            let depth = 0;
            let inQuotes = false;
            
            for (let i = 0; i < argsStr.length; i++) {
                const char = argsStr[i];
                if (char === '"') {
                    inQuotes = !inQuotes;
                    current += char;
                } else if (char === '(' && !inQuotes) {
                    depth++;
                    current += char;
                } else if (char === ')' && !inQuotes) {
                    depth--;
                    current += char;
                } else if (char === ',' && !inQuotes && depth === 0) {
                    result.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            if (current.trim()) {
                result.push(current.trim());
            }
            return result;
        }

        resolveColorArg(argStr) {
            const clean = argStr.replace(/"/g, '').trim();
            if (['red', 'green', 'blue', 'yellow', 'white', 'purple', 'cyan', 'magenta', 'orange', 'pink', 'black', 'grey', 'gray'].includes(clean.toLowerCase()) || clean.startsWith('#')) {
                return clean;
            }
            try {
                const val = this.evaluateExpr(argStr);
                const palette = ['#000000', '#0000ff', '#00ff00', '#00ffff', '#ff0000', '#ff00ff', '#ffff00', '#ffffff'];
                return palette[Math.floor(val) % palette.length] || '#ffffff';
            } catch (e) {
                return clean;
            }
        }

        async run() {
            this.running = true;
            this.pcIndex = 0;
            this.variables = {};
            this.callStack = [];
            this.forLoops = {};

            try {
                this.parse();
            } catch (err) {
                this.printFn(`解析エラー: ${err.message}`, 'danger');
                this.running = false;
                return;
            }

            if (this.program.length === 0) {
                this.printFn('実行可能な行がありません。', 'muted');
                this.running = false;
                return;
            }

            let instructionCount = 0;

            while (this.running && this.pcIndex < this.program.length) {
                const { lineNum, statement } = this.program[this.pcIndex];
                let jumped = false;

                if (statement) {
                    try {
                        const nextPc = await this.executeStatement(statement);
                        if (nextPc !== undefined) {
                            this.pcIndex = nextPc;
                            jumped = true;
                        }
                    } catch (err) {
                        this.printFn(`実行エラー (行 ${lineNum}): ${err.message}`, 'danger');
                        this.running = false;
                        break;
                    }
                }

                if (!jumped) {
                    this.pcIndex++;
                }

                instructionCount++;
                if (instructionCount % 10 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
            }
            this.running = false;
        }

        findLineIndex(lineNum) {
            const index = this.program.findIndex(item => item.lineNum === lineNum);
            if (index === -1) {
                throw new Error(`行番号 ${lineNum} が存在しません。`);
            }
            return index;
        }

        async executeStatement(statement) {
            const firstSpace = statement.indexOf(' ');
            let cmd = firstSpace !== -1 ? statement.slice(0, firstSpace).toUpperCase() : statement.toUpperCase();
            let argsStr = firstSpace !== -1 ? statement.slice(firstSpace + 1).trim() : '';

            if (cmd.includes('=') && !['LET', 'IF', 'FOR'].includes(cmd)) {
                argsStr = statement;
                cmd = 'LET';
            }

            switch (cmd) {
                case 'REM':
                    break;
                case 'LET': {
                    const match = argsStr.match(/^([a-zA-Z_][a-zA-Z0-9_\$]*)\s*=\s*(.*)$/);
                    if (!match) {
                        throw new Error(`LETの構文が無効です: "${argsStr}"`);
                    }
                    const varName = match[1];
                    const expr = match[2];
                    this.variables[varName] = this.evaluateExpr(expr);
                    break;
                }
                case 'PRINT': {
                    const parts = this.parsePrintArgs(argsStr);
                    let outStr = '';
                    for (const part of parts) {
                        outStr += this.evaluateExpr(part);
                    }
                    this.printFn(outStr, 'success');
                    break;
                }
                case 'INPUT': {
                    let prompt = '? ';
                    let varName = argsStr;
                    
                    const match = argsStr.match(/^"(.*?)"\s*[;,]\s*([a-zA-Z_][a-zA-Z0-9_\$]*)$/);
                    if (match) {
                        prompt = match[1];
                        varName = match[2];
                    }

                    this.printFn(prompt, 'info');
                    
                    const inputVal = await this.readLineFn();
                    if (!this.running) return;

                    const val = varName.endsWith('$') ? inputVal : parseFloat(inputVal) || 0;
                    this.variables[varName] = val;
                    break;
                }
                case 'GOTO': {
                    const lineNum = parseInt(this.evaluateExpr(argsStr));
                    return this.findLineIndex(lineNum);
                }
                case 'IF': {
                    const thenIndex = argsStr.search(/\bTHEN\b/i);
                    if (thenIndex === -1) {
                        throw new Error(`IFの構文が無効です（THENがありません）: "${argsStr}"`);
                    }
                    const conditionStr = argsStr.slice(0, thenIndex).trim();
                    const actionStr = argsStr.slice(thenIndex + 4).trim();

                    const condVal = this.evaluateExpr(conditionStr);
                    if (condVal !== 0) {
                        if (/^\d+$/.test(actionStr)) {
                            const lineNum = parseInt(actionStr);
                            return this.findLineIndex(lineNum);
                        } else if (/^GOTO\s+(\d+)$/i.test(actionStr)) {
                            const match = actionStr.match(/^GOTO\s+(\d+)$/i);
                            const lineNum = parseInt(match[1]);
                            return this.findLineIndex(lineNum);
                        } else {
                            return await this.executeStatement(actionStr);
                        }
                    }
                    break;
                }
                case 'GOSUB': {
                    const lineNum = parseInt(this.evaluateExpr(argsStr));
                    this.callStack.push(this.pcIndex + 1);
                    return this.findLineIndex(lineNum);
                }
                case 'RETURN': {
                    if (this.callStack.length === 0) {
                        throw new Error('RETURNに対応するGOSUBがありません。');
                    }
                    return this.callStack.pop();
                }
                case 'FOR': {
                    const match = argsStr.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.*?)\s+TO\s+(.*?)(?:\s+STEP\s+(.*?))?$/i);
                    if (!match) {
                        throw new Error(`FORの構文が無効です: "${argsStr}"`);
                    }
                    const varName = match[1];
                    const startExpr = match[2];
                    const endExpr = match[3];
                    const stepExpr = match[4];

                    const startVal = this.evaluateExpr(startExpr);
                    const endVal = this.evaluateExpr(endExpr);
                    const stepVal = stepExpr ? this.evaluateExpr(stepExpr) : 1;

                    this.variables[varName] = startVal;
                    this.forLoops[varName] = {
                        endVal,
                        stepVal,
                        loopStartPcIndex: this.pcIndex + 1
                    };
                    break;
                }
                case 'NEXT': {
                    const varName = argsStr.trim();
                    const loop = this.forLoops[varName];
                    if (!loop) {
                        throw new Error(`NEXTに対応するFORがありません: "${varName}"`);
                    }
                    
                    const nextVal = (this.variables[varName] || 0) + loop.stepVal;
                    this.variables[varName] = nextVal;

                    if ((loop.stepVal >= 0 && nextVal <= loop.endVal) || 
                        (loop.stepVal < 0 && nextVal >= loop.endVal)) {
                        return loop.loopStartPcIndex;
                    } else {
                        delete this.forLoops[varName];
                    }
                    break;
                }
                case 'CLS': {
                    const output = document.getElementById('cliOutput');
                    if (output) output.innerHTML = '';
                    const canvas = document.getElementById('cliCanvas');
                    if (canvas) {
                        const ctx = canvas.getContext('2d');
                        ctx.fillStyle = '#000000';
                        ctx.fillRect(0, 0, 400, 400);
                    }
                    break;
                }
                case 'LINE': {
                    const args = this.parseCommaArgs(argsStr);
                    if (args.length < 4) {
                        throw new Error(`LINEの引数が足りません: "${argsStr}" (LINE x1, y1, x2, y2[, color])`);
                    }
                    const x1 = this.evaluateExpr(args[0]);
                    const y1 = this.evaluateExpr(args[1]);
                    const x2 = this.evaluateExpr(args[2]);
                    const y2 = this.evaluateExpr(args[3]);
                    let color = '#38bdf8';
                    if (args[4]) {
                        color = this.resolveColorArg(args[4]);
                    }
                    
                    const canvas = document.getElementById('cliCanvas');
                    const canvasWrapper = document.getElementById('cliCanvasWrapper');
                    if (canvasWrapper) canvasWrapper.classList.remove('hide');
                    if (canvas) {
                        const ctx = canvas.getContext('2d');
                        ctx.strokeStyle = color;
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(x1, y1);
                        ctx.lineTo(x2, y2);
                        ctx.stroke();
                    }
                    break;
                }
                case 'CIRCLE': {
                    const args = this.parseCommaArgs(argsStr);
                    if (args.length < 3) {
                        throw new Error(`CIRCLEの引数が足りません: "${argsStr}" (CIRCLE x, y, r[, color])`);
                    }
                    const cx = this.evaluateExpr(args[0]);
                    const cy = this.evaluateExpr(args[1]);
                    const r = this.evaluateExpr(args[2]);
                    let color = '#34d399';
                    if (args[3]) {
                        color = this.resolveColorArg(args[3]);
                    }
                    
                    const canvas = document.getElementById('cliCanvas');
                    const canvasWrapper = document.getElementById('cliCanvasWrapper');
                    if (canvasWrapper) canvasWrapper.classList.remove('hide');
                    if (canvas) {
                        const ctx = canvas.getContext('2d');
                        ctx.strokeStyle = color;
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(cx, cy, r, 0, 2 * Math.PI);
                        ctx.stroke();
                    }
                    break;
                }
                case 'PSET': {
                    const args = this.parseCommaArgs(argsStr);
                    if (args.length < 2) {
                        throw new Error(`PSETの引数が足りません: "${argsStr}" (PSET x, y[, color])`);
                    }
                    const px = this.evaluateExpr(args[0]);
                    const py = this.evaluateExpr(args[1]);
                    let color = '#ffffff';
                    if (args[2]) {
                        color = this.resolveColorArg(args[2]);
                    }
                    
                    const canvas = document.getElementById('cliCanvas');
                    const canvasWrapper = document.getElementById('cliCanvasWrapper');
                    if (canvasWrapper) canvasWrapper.classList.remove('hide');
                    if (canvas) {
                        const ctx = canvas.getContext('2d');
                        ctx.fillStyle = color;
                        ctx.fillRect(px - 1, py - 1, 3, 3);
                    }
                    break;
                }
                case 'GRAPH': {
                    const firstSpace = argsStr.indexOf(' ');
                    const mode = firstSpace !== -1 ? argsStr.slice(0, firstSpace).toLowerCase() : argsStr.toLowerCase();
                    const graphArgsStr = firstSpace !== -1 ? argsStr.slice(firstSpace + 1).trim() : '';
                    
                    const canvas = document.getElementById('cliCanvas');
                    const canvasWrapper = document.getElementById('cliCanvasWrapper');
                    if (canvasWrapper) canvasWrapper.classList.remove('hide');
                    
                    if (mode === 'init') {
                        if (canvas) {
                            const ctx = canvas.getContext('2d');
                            ctx.fillStyle = '#000000';
                            ctx.fillRect(0, 0, 400, 400);
                            
                            // Draw grid lines
                            ctx.strokeStyle = '#1e293b';
                            ctx.lineWidth = 1;
                            for (let i = -10; i <= 10; i++) {
                                if (i === 0) continue;
                                // vertical grids
                                ctx.beginPath();
                                ctx.moveTo(200 + i * 20, 0);
                                ctx.lineTo(200 + i * 20, 400);
                                ctx.stroke();
                                // horizontal grids
                                ctx.beginPath();
                                ctx.moveTo(0, 200 - i * 20);
                                ctx.lineTo(400, 200 - i * 20);
                                ctx.stroke();
                            }
                            
                            // Draw axes
                            ctx.strokeStyle = '#475569';
                            ctx.lineWidth = 2;
                            ctx.beginPath();
                            ctx.moveTo(0, 200);
                            ctx.lineTo(400, 200);
                            ctx.stroke();
                            
                            ctx.beginPath();
                            ctx.moveTo(200, 0);
                            ctx.lineTo(200, 400);
                            ctx.stroke();
                            
                            // Tick labels
                            ctx.fillStyle = '#94a3b8';
                            ctx.font = '10px monospace';
                            ctx.fillText('-10', 5, 195);
                            ctx.fillText('10', 380, 195);
                            ctx.fillText('10', 205, 12);
                            ctx.fillText('-10', 205, 395);
                            ctx.fillText('0', 205, 195);
                        }
                    } else if (mode === 'xy' || mode === 'polar') {
                        const args = this.parseCommaArgs(graphArgsStr);
                        if (args.length < 1) {
                            throw new Error(`GRAPH ${mode} の引数が足りません。数式を指定してください。 (例: GRAPH xy "sin(x)")`);
                        }
                        const expr = args[0].replace(/"/g, '').trim();
                        let color = mode === 'xy' ? '#38bdf8' : '#e11d48';
                        if (args[1]) {
                            color = this.resolveColorArg(args[1]);
                        }
                        
                        if (canvas) {
                            const ctx = canvas.getContext('2d');
                            ctx.strokeStyle = color;
                            ctx.lineWidth = 2;
                            ctx.beginPath();
                            
                            let first = true;
                            if (mode === 'xy') {
                                for (let xVal = -10; xVal <= 10; xVal += 0.05) {
                                    try {
                                        const vars = { ...this.variables, x: xVal };
                                        const yVal = window.CalculatorParser.evaluate(expr, vars);
                                        
                                        const sx = 200 + xVal * 20;
                                        const sy = 200 - yVal * 20;
                                        
                                        if (sx >= 0 && sx <= 400 && sy >= 0 && sy <= 400) {
                                            if (first) {
                                                ctx.moveTo(sx, sy);
                                                first = false;
                                            } else {
                                                ctx.lineTo(sx, sy);
                                            }
                                        } else {
                                            first = true;
                                        }
                                    } catch (e) {
                                        first = true;
                                    }
                                }
                            } else {
                                // Polar: theta from 0 to 12 * PI
                                for (let tVal = 0; tVal <= 12 * Math.PI; tVal += 0.02) {
                                    try {
                                        const vars = { ...this.variables, theta: tVal, t: tVal };
                                        const rVal = window.CalculatorParser.evaluate(expr, vars);
                                        
                                        const xVal = rVal * Math.cos(tVal);
                                        const yVal = rVal * Math.sin(tVal);
                                        
                                        const sx = 200 + xVal * 20;
                                        const sy = 200 - yVal * 20;
                                        
                                        if (sx >= 0 && sx <= 400 && sy >= 0 && sy <= 400) {
                                            if (first) {
                                                ctx.moveTo(sx, sy);
                                                first = false;
                                            } else {
                                                ctx.lineTo(sx, sy);
                                            }
                                        } else {
                                            first = true;
                                        }
                                    } catch (e) {
                                        first = true;
                                    }
                                }
                            }
                            ctx.stroke();
                        }
                    } else {
                        throw new Error(`未知のGRAPHモードです: "${mode}"`);
                    }
                    break;
                }
                case 'END':
                case 'STOP':
                    this.running = false;
                    break;
                default:
                    throw new Error(`未定義のコマンドです: "${cmd}"`);
            }
        }

        stop() {
            this.running = false;
        }
    }

    async function handleRunCommand(subArgs) {
        const filename = subArgs[0];
        if (!filename) {
            printCli('エラー: 実行するBASICファイル名を指定してください。 (例: run guess.bas)', 'danger');
            return;
        }
        const absPath = resolvePath(filename);
        const files = getVfsFiles();
        if (!files[absPath]) {
            printCli(`エラー: ファイル "${filename}" が見つかりません。`, 'danger');
            return;
        }

        printCli(`>>> RUN ${filename} <<<`, 'info');
        window.say(`${filename} を実行するね！`, 'happy');

        activeBasicInterpreter = new BasicInterpreter(
            files[absPath],
            (msg, type) => printCli(msg, type),
            async () => {
                const cliInput = document.getElementById('cliInput');
                if (cliInput) {
                    cliInput.focus();
                }
                return new Promise(resolve => {
                    cliInputResolver = resolve;
                });
            }
        );

        try {
            await activeBasicInterpreter.run();
            printCli('--- プログラムが終了しました ---', 'info');
            window.say('実行が終わったよ！', 'happy');
        } catch (err) {
            printCli(`システムエラー: ${err.message}`, 'danger');
        } finally {
            activeBasicInterpreter = null;
            cliInputResolver = null;
        }
    }

    // --- Directory-Aware VFS Helpers & Shell Utilities ---
    let shellCwd = '/';

    function resolvePath(inputPath) {
        if (!inputPath) return shellCwd;
        let absolute = inputPath.startsWith('/') ? inputPath : (shellCwd === '/' ? '/' + inputPath : shellCwd + '/' + inputPath);
        
        // Normalize path (handle . and ..)
        const parts = absolute.split('/');
        const stack = [];
        for (const part of parts) {
            if (part === '' || part === '.') continue;
            if (part === '..') {
                if (stack.length > 0) stack.pop();
            } else {
                stack.push(part);
            }
        }
        return '/' + stack.join('/');
    }

    function dirExists(path) {
        const vfs = getVfs();
        return vfs.dirs.includes(path);
    }

    function fileExists(path) {
        const vfs = getVfs();
        return vfs.files.hasOwnProperty(path);
    }

    function updatePrompt() {
        const promptEl = document.querySelector('.cli-prompt');
        if (promptEl) {
            promptEl.textContent = `kazuno:${shellCwd}>`;
        }
    }

    function handleCdCommand(subArgs) {
        const target = subArgs[0] || '/';
        const absPath = resolvePath(target);
        if (dirExists(absPath)) {
            shellCwd = absPath;
            updatePrompt();
            printCli(`ディレクトリを移動しました: ${shellCwd}`, 'info');
            window.say(`「${target}」に移動したよ！`, 'happy');
        } else {
            printCli(`cd: ${target}: そのようなディレクトリはありません。`, 'danger');
        }
    }

    function handleMkdirCommand(subArgs) {
        const target = subArgs[0];
        if (!target) {
            printCli('mkdir: ディレクトリ名を入力してください。', 'danger');
            return;
        }
        const absPath = resolvePath(target);
        if (dirExists(absPath) || fileExists(absPath)) {
            printCli(`mkdir: '${target}' を作成できません: ファイルまたはフォルダが存在します。`, 'danger');
            return;
        }
        
        const parent = absPath.substring(0, absPath.lastIndexOf('/')) || '/';
        if (!dirExists(parent)) {
            printCli(`mkdir: '${target}' を作成できません: 親ディレクトリ '${parent}' が存在しません。`, 'danger');
            return;
        }

        const vfs = getVfs();
        vfs.dirs.push(absPath);
        saveVfs(vfs);
        printCli(`ディレクトリ "${absPath}" を作成しました。`, 'success');
        window.say(`フォルダ「${target}」を作ったよ！`, 'happy');
    }

    function handleMvCommand(subArgs) {
        const src = subArgs[0];
        const dest = subArgs[1];
        if (!src || !dest) {
            printCli('mv: 移動元と移動先を入力してください。 (例: mv file.bas sub/file.bas)', 'danger');
            return;
        }

        const srcPath = resolvePath(src);
        const destPath = resolvePath(dest);
        const vfs = getVfs();

        if (vfs.files.hasOwnProperty(srcPath)) {
            let finalDest = destPath;
            if (vfs.dirs.includes(destPath)) {
                const filename = srcPath.substring(srcPath.lastIndexOf('/') + 1);
                finalDest = destPath === '/' ? '/' + filename : destPath + '/' + filename;
            }
            vfs.files[finalDest] = vfs.files[srcPath];
            delete vfs.files[srcPath];
            saveVfs(vfs);
            printCli(`'${srcPath}' を '${finalDest}' に移動しました。`, 'success');
            window.say('ファイルを移動させたよ！', 'happy');
        } else if (vfs.dirs.includes(srcPath)) {
            if (srcPath === '/') {
                printCli('mv: ルートディレクトリは移動できません。', 'danger');
                return;
            }
            let finalDest = destPath;
            if (vfs.dirs.includes(destPath)) {
                const dirname = srcPath.substring(srcPath.lastIndexOf('/') + 1);
                finalDest = destPath === '/' ? '/' + dirname : destPath + '/' + dirname;
            }
            vfs.dirs = vfs.dirs.map(d => {
                if (d === srcPath) return finalDest;
                if (d.startsWith(srcPath + '/')) {
                    return finalDest + d.slice(srcPath.length);
                }
                return d;
            });
            for (const f in vfs.files) {
                if (f.startsWith(srcPath + '/')) {
                    const newF = finalDest + f.slice(srcPath.length);
                    vfs.files[newF] = vfs.files[f];
                    delete vfs.files[f];
                }
            }
            saveVfs(vfs);
            printCli(`ディレクトリ '${srcPath}' を '${finalDest}' に移動しました。`, 'success');
            window.say('フォルダを移動させたよ！', 'happy');
        } else {
            printCli(`mv: '${src}': そのようなファイルやフォルダはありません。`, 'danger');
        }
    }

    function handleCpCommand(subArgs) {
        let recursive = false;
        let src = '';
        let dest = '';

        if (subArgs[0] === '-r' || subArgs[0] === '-R') {
            recursive = true;
            src = subArgs[1];
            dest = subArgs[2];
        } else {
            src = subArgs[0];
            dest = subArgs[1];
        }

        if (!src || !dest) {
            printCli('cp: コピー元とコピー先を入力してください。 (例: cp file.bas copy.bas, cp -r dir sub)', 'danger');
            return;
        }

        const srcPath = resolvePath(src);
        const destPath = resolvePath(dest);
        const vfs = getVfs();

        if (vfs.files.hasOwnProperty(srcPath)) {
            let finalDest = destPath;
            if (vfs.dirs.includes(destPath)) {
                const filename = srcPath.substring(srcPath.lastIndexOf('/') + 1);
                finalDest = destPath === '/' ? '/' + filename : destPath + '/' + filename;
            }
            vfs.files[finalDest] = vfs.files[srcPath];
            saveVfs(vfs);
            printCli(`'${srcPath}' を '${finalDest}' にコピーしました。`, 'success');
            window.say('ファイルをコピーしたよ！', 'happy');
        } else if (vfs.dirs.includes(srcPath)) {
            if (!recursive) {
                printCli(`cp: -r は指定されていません (ディレクトリ '${src}' は無視されます)`, 'danger');
                return;
            }
            if (srcPath === '/') {
                printCli('cp: ルートディレクトリはコピーできません。', 'danger');
                return;
            }
            let finalDest = destPath;
            if (vfs.dirs.includes(destPath)) {
                const dirname = srcPath.substring(srcPath.lastIndexOf('/') + 1);
                finalDest = destPath === '/' ? '/' + dirname : destPath + '/' + dirname;
            }
            
            if (!vfs.dirs.includes(finalDest)) {
                vfs.dirs.push(finalDest);
            }
            vfs.dirs.forEach(d => {
                if (d.startsWith(srcPath + '/')) {
                    const newD = finalDest + d.slice(srcPath.length);
                    if (!vfs.dirs.includes(newD)) vfs.dirs.push(newD);
                }
            });

            for (const f in vfs.files) {
                if (f.startsWith(srcPath + '/')) {
                    const newF = finalDest + f.slice(srcPath.length);
                    vfs.files[newF] = vfs.files[f];
                }
            }
            saveVfs(vfs);
            printCli(`ディレクトリ '${srcPath}' を '${finalDest}' にコピーしました。`, 'success');
            window.say('フォルダをコピーしたよ！', 'happy');
        } else {
            printCli(`cp: '${src}': そのようなファイルやフォルダはありません。`, 'danger');
        }
    }

    function handleHeadCommand(subArgs) {
        let linesCount = 10;
        let filename = '';

        if (subArgs[0] === '-n') {
            linesCount = parseInt(subArgs[1]) || 10;
            filename = subArgs[2];
        } else {
            filename = subArgs[0];
        }

        if (!filename) {
            printCli('head: ファイル名を指定してください。 (例: head -n 5 guess.bas)', 'danger');
            return;
        }

        const absPath = resolvePath(filename);
        const files = getVfsFiles();
        if (!files[absPath]) {
            printCli(`head: '${filename}': そのようなファイルはありません。`, 'danger');
            return;
        }

        const lines = files[absPath].split(/\r?\n/);
        printCli(`=== ${filename} (最初の ${linesCount} 行) ===`, 'info');
        printCli(lines.slice(0, linesCount).join('\n'));
    }

    function handleTailCommand(subArgs) {
        let linesCount = 10;
        let filename = '';

        if (subArgs[0] === '-n') {
            linesCount = parseInt(subArgs[1]) || 10;
            filename = subArgs[2];
        } else {
            filename = subArgs[0];
        }

        if (!filename) {
            printCli('tail: ファイル名を指定してください。 (例: tail -n 5 guess.bas)', 'danger');
            return;
        }

        const absPath = resolvePath(filename);
        const files = getVfsFiles();
        if (!files[absPath]) {
            printCli(`tail: '${filename}': そのようなファイルはありません。`, 'danger');
            return;
        }

        const lines = files[absPath].split(/\r?\n/);
        printCli(`=== ${filename} (最後の ${linesCount} 行) ===`, 'info');
        const start = Math.max(0, lines.length - linesCount);
        printCli(lines.slice(start).join('\n'));
    }
});
