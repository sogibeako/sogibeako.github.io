// 敗北名言の編集用。A〜E・defaultの [ ] 内へ同じ形の { } を追加できます。
// 原文は実在作品の引用、日本語は本ゲーム用訳。出典も合わせて編集してください。
const ARIADNE_DEFEAT_QUOTES = {
  "A": [
    {
      "label": "まだ、旅のはじまり",
      "ja": "鼠も人も、念入りに立てた計画が、しばしば思わぬ方へそれる。",
      "en": "The best laid schemes o’ Mice an’ Men / Gang aft agley,",
      "credit": "ロバート・バーンズ『To a Mouse』",
      "url": "https://www.poetryfoundation.org/poems/43816/to-a-mouse-56d222ab36e33"
    },
    {
      "label": "まだ、旅のはじまり",
      "ja": "臆病者は死ぬ前に何度も死ぬ。勇者が死を味わうのは一度だけだ。",
      "en": "Cowards die many times before their deaths; The valiant never taste of death but once.",
      "credit": "シェイクスピア『ジュリアス・シーザー』第2幕第2場（シーザー）",
      "url": "https://www.folger.edu/explore/shakespeares-works/julius-caesar/read/2/2/"
    },
    {
      "label": "まだ、旅のはじまり",
      "ja": "生まれぬことが最善。だが生まれてしまったなら、できるだけ早く元の場所へ帰るのが次善である。",
      "en": "Not to be born is, beyond all estimation, best;",
      "credit": "ソポクレス『コロノスのオイディプス』1224行付近、コロスの歌。",
      "url": "https://beta.perseus.tufts.edu/urn%3Acts%3AgreekLit%3Atlg0011.tlg007.perseus-eng2%3A1211-1245/"
    },
    {
      "label": "まだ、旅のはじまり",
      "ja": "ようやく日の光を見たというのに、早くも来た道を引き返す。",
      "en": "Having just seen the light of day, one must already return.",
      "credit": "ChatGPT（着想元：ソポクレス）",
      "url": "https://chatgpt.com/"
    },
    {
      "label": "まだ、旅のはじまり",
      "ja": "我々を脅かすものは、実際に苦しめるものより多い。",
      "en": "Plura sunt, Lucili, quae nos terrent, quam quae premunt.",
      "credit": "セネカ『倫理書簡』第13書簡4節",
      "url": "https://reader.humanitext.ai/en/read/urn%3Acts%3AlatinLit%3Aphi1017.phi015.humanitext-lat2%3A13.1-13.8"
    },
    {
      "label": "まだ、旅のはじまり",
      "ja": "火が黄金を試すように、不幸は強い人間を試す。",
      "en": "Ignis aurum probat, miseria fortes viros.",
      "credit": "プラトン『ソクラテスの弁明』38a",
      "url": "https://www.latin.it/autore/seneca/de_providentia/05.lat"
    },
    {
      "label": "まだ、旅のはじまり",
      "ja": "経験とは、誰もが自分の失敗につける名前である。",
      "en": "Experience is the name every one gives to their mistakes.",
      "credit": "オスカー・ワイルド『ウィンダミア卿夫人の扇』第3幕、ダンビーの台詞。",
      "url": "https://www.gutenberg.org/files/790/790-h/790-h"
    },
    {
      "label": "まだ、旅のはじまり",
      "ja": "いかなる戦術も眼前の敵には無力だ。",
      "en": "No battle plan survives contact with the enemy.",
      "credit": "コリン・パウエル",
      "url": "https://www.brainyquote.com/quotes/colin_powell_377805"
    },
    {
      "label": "まだ、旅のはじまり",
      "ja": "不条理とは基本的概念であり最初の真実なのだ。",
      "en": "The absurd is the essential concept and the first truth.",
      "credit": "アルベール・カミュ",
      "url": "https://www.google.com/search?q=The+absurd+is+the+essential+concept+and+the+first+truth.&sca_esv=54a73f9e2ca843da&sxsrf=AKL5yDhcOwPCL7pXtiqFbizhbqBHmF9SxA%3A1793328200257&source=hp&ei=SATkavmmDdOj0PEPjeSTmAI&iflsig=AHSINFcAAAAAauQSWPOv3DkziAmjCuA7ciZu3BGAylMK&ved=2ahUKEwj56tuS3OCXAxXTETQIHQ3yBCMQ4dUDegQIABAq&uact=5&oq=The+absurd+is+the+essential+concept+and+the+first+truth.&gs_lp=Egdnd3Mtd2l6IjhUaGUgYWJzdXJkIGlzIHRoZSBlc3NlbnRpYWwgY29uY2VwdCBhbmQgdGhlIGZpcnN0IHRydXRoLjIEEAAYHjIEEAAYHjIEEAAYHjIFEAAY7wUyBRAAGO8FMgUQABjvBTIFEAAY7wVIwgNQAFgAcAB4AJABAJgBiQGgAYkBqgEDMC4xuAEDyAEA-AEC-AEBmAIBoAKQAZgDAJIHAzAuMaAH3AOyBwMwLjG4B5ABwgcDMi0xyAcEgAgB&sclient=gws-wiz"
    },
    {
      "label": "まだ、旅のはじまり",
      "ja": "ここに入る者は、一切の希望を捨てよ。",
      "en": "Lasciate ogne speranza, voi ch'intrate.",
      "credit": "『神曲』地獄篇 第3歌9行",
      "url": "https://it.wikisource.org/wiki/Divina_Commedia/Inferno/Canto_III?utm_source=chatgpt.com"
    },
    {
      "label": "まだ、旅のはじまり",
      "ja": "何れ程夜が永くとも　何れ朝は訪れる",
      "en": "No matter how long the night may be, morning shall eventually arrive.",
      "credit": "Sound Horizon『焔』",
      "url": "https://sound-horizon-lyrics.fandom.com/wiki/Flame#English"
    },
  ],
  "B": [
    {
      "label": "使い切った切り札",
      "ja": "過去は、序章にすぎない。",
      "en": "what’s past is prologue",
      "credit": "シェイクスピア『テンペスト』第2幕第1場（アントーニオ）",
      "url": "https://shakespeare.mit.edu/tempest/tempest.2.1.html"
    },
    {
      "label": "使い切った切り札",
      "ja": "人間とは、つまるところ運命に翻弄される存在なのだ。",
      "en": "Man is altogether a creature of accident.",
      "credit": "ヘロドトス『歴史』第1巻32節、ソロンの言葉",
      "url": "https://lexundria.com/hdt/1.32.1/mcly"
    },
    {
      "label": "使い切った切り札",
      "ja": "最後の日を迎えるまで、己の幸運を信じてはならない。",
      "en": "Let no man presume upon his good fortune until his final day.",
      "credit": "ソポクレス『オイディプス王』1524〜1530行付近、コロスの言葉を短く意訳",
      "url": "hhttps://www.arkansassymphony.org/wp-content/uploads/2026/02/Carmina-Burana-TEXT_FINAL3.pdf"
    },
    {
      "label": "使い切った切り札",
      "ja": "おお、運命よ。月のように、汝は絶えず満ち欠けする。",
      "en": "O Fortuna, velut luna, statu variabilis",
      "credit": "『カルミナ・ブラーナ』「O Fortuna」冒頭。",
      "url": "https://www.lieder.net/lieder/assemble_texts.html?SongCycleId=7237"
    },
    {
      "label": "使い切った切り札",
      "ja": "敗者に残された唯一の救いは、救いを望まぬことだ。",
      "en": "Una salus victis, nullam sperare salutem.",
      "credit": "ウェルギリウス『アエネーイス』第2巻354行",
      "url": "https://aeneid.co/text/book-2/336-354"
    },
    {
      "label": "使い切った切り札",
      "ja": "たとえ敗れても、大胆に挑んだ末の敗北なのだ。",
      "en": "if he fails, at least fails while daring greatly",
      "credit": "セオドア・ルーズベルト、1910年の演説「共和国の市民」",
      "url": "https://www.theodorerooseveltcenter.org/encyclopedia/culture-and-society/man-in-the-arena/"
    },
    {
      "label": "使い切った切り札",
      "ja": "人間が最善を尽くせば、他に何が必要だろう？ ",
      "en": "If a man does his best, what else is there?",
      "credit": "ジョージ・S・パットン将軍",
      "url": "https://thehosk.medium.com/keep-advancing-like-general-patton-4a9d6126aee6"
    },
    {
      "label": "使い切った切り札",
      "ja": "そして私は千の家々の傍らで住む所も無くたたずみ、千の食卓の傍らで食べ物を探し求めた。",
      "en": "And homeless near a thousand homes I stood, and near a thousand tables pined and wanted food.",
      "credit": "ウィリアム・ワーズワース『Guilt and Sorrow』",
      "url": "https://en.wikisource.org/wiki/Page:Poems_by_William_Wordsworth_(1815)_Volume_1.djvu/147"
    },
    {
      "label": "使い切った切り札",
      "ja": "人の知恵をもってしても、運命に抗うことはできない。",
      "en": "Vostro saver non ha contasto a lei",
      "credit": "ダンテ『神曲』地獄篇 第7歌85〜87行",
      "url": "https://it.wikisource.org/wiki/Divina_Commedia/Inferno/Canto_VII"
    },
    {
      "label": "使い切った切り札",
      "ja": "不幸のさなかに幸福だった日々を思い出すことほど、大きな悲しみはない。",
      "en": "Nessun maggior dolore che ricordarsi del tempo felice",
      "credit": "ダンテ『神曲』地獄篇 第5歌121〜123行",
      "url": "https://dante.princeton.edu/cgi-bin/dante/DispPoemByTitle.pl?LINE=121-129&SECT=v.&TITLE=Inf."
    },
    {
      "label": "使い切った切り札",
      "ja": "もがいているの？ 苦しんでいるの？ ここで終わらせてあげる…",
      "en": "And homeless near a thousand homes I stood, and near a thousand tables pined and wanted food.",
      "credit": "Sound Horizon『壊れたマリオネット』",
      "url": "https://w.atwiki.jp/soundpontata/pages/39.html"
    },
    {
      "label": "使い切った切り札",
      "ja": "例え、気高く美しき薔薇でさえ…花である以上、枯れてしまった花には及ばない…",
      "en": "Even a noble and beautiful rose...Being a flower itself, cannot match up to a withered one...",
      "credit": "Sound Horizon『詩人バラッドの悲劇』",
      "url": "https://sound-horizon-lyrics.fandom.com/wiki/The_Tragedy_of_the_Poet_Ballad#English",
    },
    {
      "label": "使い切った切り札",
      "ja": "豪奢な廃墟に転がり　冷たい雨に怯える",
      "en": "Tumbling within a luxurious abandoned mansion, he shivered in the cold rain",
      "credit": "Sound Horizon『澪音の世界』",
      "url": "https://sound-horizon-lyrics.fandom.com/wiki/The_World_of_Rein#English",
    },
    {
      "label": "使い切った切り札",
      "ja": "そんな気紛れなひと時を　永遠だと信じたりして　そんな不確かなものを　運命だと信じたりして",
      "en": "Believing those capricious instants of time to be eternity, Believing such unstable things to be destiny",
      "credit": "Sound Horizon『StarDust』",
      "url": "https://w.atwiki.jp/benohito/pages/22.html"
    }
  ],
  "C": [
    {
      "label": "残された切り札",
      "ja": "知ってのとおり、油断こそ人間の最大の敵。",
      "en": "And you all know, security / Is mortals' chiefest enemy.",
      "credit": "シェイクスピア『マクベス』第3幕第5場（ヘカテ）",
      "url": "https://shakespeare.mit.edu/macbeth/macbeth.3.5.html"
    },
    {
      "label": "残された切り札",
      "ja": "こうして思慮は、われわれを皆、臆病者にしてしまう。",
      "en": "Thus conscience does make cowards of us all,",
      "credit": "シェイクスピア『ハムレット』第3幕第1場（ハムレット）",
      "url": "https://www.folger.edu/explore/shakespeares-works/hamlet/read/3/1/"
    },
    {
      "label": "残された切り札",
      "ja": "人を動揺させるのは出来事ではない。出来事についての判断である。",
      "en": "Men are disturbed not by things, but by their opinions about things.",
      "credit": "エピクテトス『提要』第5章",
      "url": "https://epictetus-enchiridion.org/en/read/"
    },
    {
      "label": "残された切り札",
      "ja": "馬を！ 馬をくれ！ 馬一頭に我が王国をくれてやる！",
      "en": "A horse, a horse, my kingdom for a horse!",
      "credit": "シェイクスピア『リチャード三世』第5幕第4場",
      "url": "https://www.folger.edu/explore/shakespeares-works/richard-iii/read/",
    },
    {
      "label": "残された切り札",
      "ja": "足の速い者が競走に勝つとは限らず、強い者が戦いに勝つとも限らない。",
      "en": "the race is not to the swift, nor the battle to the strong",
      "credit": "『コヘレトの言葉（伝道の書）』9章11節",
      "url": "https://www.biblegateway.com/verse/en/Ecclesiastes9%3A11",
    },
    {
      "label": "残された切り札",
      "ja": "我が命は賽の一振りに賭けた。いかなる目が出ようとも受けて立つ。",
      "en": "I have set my life upon a cast",
      "credit": "シェイクスピア『リチャード三世』第5幕第4場",
      "url": "https://www.folger.edu/explore/shakespeares-works/richard-iii/read/",
    },
    {
      "label": "残された切り札",
      "ja": "不信と用心が安全の両親である。",
      "en": "Distrust and caution are the parents of security.",
      "credit": "ベンジャミン・フランクリン",
      "url": "https://founders.archives.gov/documents/Franklin/01-01-02-0093",
    },
    {
      "label": "残された切り札",
      "ja": "二兎を追うもの一兎も得ず",
      "en": "If you chase two rabbits, you will lose them both.",
      "credit": "アメリカ先住民の諺",
      "url": "https://www.google.com/search?q=If+you+chase+two+rabbits%2C+you+will+lose+them+both.&sca_esv=54a73f9e2ca843da&sxsrf=AKL5yDikI3SKKDTC2LWqkyhGNRzIFyozdw%3A1793328084251&ei=1APkaozsDtfX1e8P7_ejuQw&biw=1064&bih=1011&uact=5&oq=If+you+chase+two+rabbits%2C+you+will+lose+them+both.&gs_lp=Egxnd3Mtd2l6LXNlcnAiMklmIHlvdSBjaGFzZSB0d28gcmFiYml0cywgeW91IHdpbGwgbG9zZSB0aGVtIGJvdGguMgQQABgeMgQQABgeMgQQABgeMgQQABgeMgQQABgeMgUQABjvBTIFEAAY7wVIugRQAFgAcAB4AZABAJgBfqABfqoBAzAuMbgBA8gBAPgBAvgBAZgCAaAClwGYAwCSBwMwLjGgB5wEsgcDMC4xuAeXAcIHAzMtMcgHCYAIAQ&sclient=gws-wiz-serp",
    },
    {
      "label": "残された切り札",
      "ja": "全て失くすまで気付かない　度し難い自我の下僕",
      "en": "the hopeless servant of ego, failing to notice till everything’s been lost...",
      "credit": "アメリカ先住民の諺",
      "url": "https://sound-horizon-lyrics.fandom.com/wiki/The_World_of_Rein#English",
    },
    {
      "label": "残された切り札",
      "ja": "古びた金貨　握りしめたまま",
      "en": "Grasping an old and battered coin, the man smiled even as he crawled on.",
      "credit": "Sound Horizon『エルの楽園 [→ Side：E →]』",
      "url": "https://sound-horizon-lyrics.fandom.com/wiki/El%E2%80%99s_Paradise%EF%BC%BB%E2%86%92_side:E_%E2%86%92%EF%BC%BD",
    },
  ],
  "D": [
    {
      "label": "初めて知る衝撃",
      "ja": "一羽の雀が落ちることにも、特別な摂理がある。",
      "en": "there's a special providence in the fall of a sparrow.",
      "credit": "シェイクスピア『ハムレット』第5幕第2場（ハムレット）",
      "url": "https://shakespeare.mit.edu/hamlet/hamlet.5.2.html"
    },
    {
      "label": "初めて知る衝撃",
      "ja": "死ぬべき時が今なら、後には来ない。今でなければ、いずれ来る。",
      "en": "If it be now, ’tis not to come; if it be not to come, it will be now; if it be not now, yet it will come.",
      "credit": "シェイクスピア『ハムレット』第5幕第2場（ハムレット）",
      "url": "https://shakespeare.mit.edu/hamlet/hamlet.5.2.html"
    },
    {
      "label": "初めて知る衝撃",
      "ja": "人の世代も、木の葉の世代と同じ。",
      "en": "The generations of men are like the generations of leaves.",
      "credit": "ホメロス『イリアス』第6歌146行付近",
      "url": "https://wist.info/homer/43262/"
    },
    {
      "label": "初めて知る衝撃",
      "ja": "高い塔ほど、激しく倒れる。",
      "en": "et celsae graviore casu decidunt turres",
      "credit": "ホラティウス『歌集』第2巻第10歌",
      "url": "https://lectito.app/horace/odes/2-10/"
    },
    {
      "label": "初めて知る衝撃",
      "ja": "消えろ、消えろ、束の間の灯火よ！",
      "en": "Out, out, brief candle!",
      "credit": "シェイクスピア『マクベス』第5幕第5場",
      "url": "https://www.folger.edu/blogs/shakespeare-and-beyond/famous-quotes-from-macbeth/"
    },
  ],
  "E": [
    {
      "label": "あの分かれ道で",
      "ja": "賢く、ゆっくりと。急いで走る者は、つまずく。",
      "en": "Wisely and slow; they stumble that run fast.",
      "credit": "シェイクスピア『ロミオとジュリエット』第2幕第3場（ロレンス修道士）",
      "url": "https://shakespeare.mit.edu/romeo_juliet/romeo_juliet.2.3.html"
    },
    {
      "label": "あの分かれ道で",
      "ja": "吟味されない人生は、人間にとって生きるに値しない。",
      "en": "The unexamined life is not worth living.",
      "credit": "プラトン『ソクラテスの弁明』38a",
      "url": "https://platolibrary.com/en/dialogue/apology?search=%E1%BC%80%CE%B3%CE%B1%CE%B8"
    },
    {
      "label": "あの分かれ道で",
      "ja": "なされたことは、取り消せない。",
      "en": "What's done cannot be undone.",
      "credit": "シェイクスピア『マクベス』第5幕第1場、マクベス夫人の台詞。",
      "url": "https://www.folger.edu/blogs/shakespeare-and-beyond/famous-quotes-from-macbeth/"
    },
    {
      "label": "あの分かれ道で",
      "ja": "この世で大切なことは、今、自分がどこにいるかではなく、どこに向かって進んでいるかということだと思う。",
      "en": "I find the great thing in this world is not so much where we stand, as in what direction we are moving...",
      "credit": "オリバー・ウェンデル・ホームズ・シニア『朝食テーブルの独裁者』",
      "url": "https://www.google.com/search?q=I+find+the+great+thing+in+this+world+is+not+so+much+where+we+stand%2C+as+in+what+direction+we+are+moving...&sca_esv=54a73f9e2ca843da&sxsrf=AKL5yDj0GTM1XuOC7abk0kGi5wz_uq-iWw%3A1793328201598&ei=SQTkauCBJPqk1e8P-prNkAM&uact=5&oq=I+find+the+great+thing+in+this+world+is+not+so+much+where+we+stand%2C+as+in+what+direction+we+are+moving...&gs_lp=Egxnd3Mtd2l6LXNlcnAiaUkgZmluZCB0aGUgZ3JlYXQgdGhpbmcgaW4gdGhpcyB3b3JsZCBpcyBub3Qgc28gbXVjaCB3aGVyZSB3ZSBzdGFuZCwgYXMgaW4gd2hhdCBkaXJlY3Rpb24gd2UgYXJlIG1vdmluZy4uLjIHEAAYHhiwAzIHEAAYHhiwAzIHEAAYHhiwAzIIEAAY7wUYsAMyCBAAGO8FGLADMggQABjvBRiwAzIIEAAY7wUYsANIqgZQkgJYkgJwAXgAkAEAmAF_oAF_qgEDMC4xuAEDyAEA-AEC-AEBmAIBoAIOmAMAiAYBkAYHkgcBMaAH4QOyBwC4BwDCBwMyLTHIBweACAE&sclient=gws-wiz-serp"
    },
    {
      "label": "あの分かれ道で",
      "ja": "気がつけば暗い森の中にいた。正しい道を見失っていたのだ。",
      "en": "mi ritrovai per una selva oscura",
      "credit": "『神曲』地獄篇 第1歌1〜3行",
      "url": "https://it.wikisource.org/wiki/Divina_Commedia/Inferno/Canto_I"
    },
    {
      "label": "あの分かれ道で",
      "ja": "道を作った当人でさえ、入口へ戻るのがやっとだった。それほどに、この建物は人を欺いた。",
      "en": "innumeras errore vias vixque ipse reverti ad limen potuit: tanta est fallacia tecti.",
      "credit": "オウィディウス『変身物語』第8巻166〜168行",
      "url": "https://thelatinlibrary.com/ovid/ovid.met8.shtml"
    },
  ],
  "default": [
    {
      "label": "次の冒険へ",
      "ja": "備えが、すべてだ。",
      "en": "the readiness is all",
      "credit": "シェイクスピア『ハムレット』第5幕第2場（ハムレット）",
      "url": "https://shakespeare.mit.edu/hamlet/hamlet.5.2.html"
    },
    {
      "label": "次の冒険へ",
      "ja": "私は憎しみを分かち合うためではなく、愛を分かち合うために生まれた。",
      "en": "I was born to share in love, not in hatred.",
      "credit": "ソポクレス『アンティゴネー』523行",
      "url": "https://chs.harvard.edu/primary-source/sophocles-antigone/"
    },
    {
      "label": "次の冒険へ",
      "ja": "いつか、この苦難さえ懐かしく思い出す日が来るだろう。",
      "en": "Forsan et haec olim meminisse iuvabit.",
      "credit": "ウェルギリウス『アエネーイス』第1巻203行",
      "url": "https://classics.fas.harvard.edu/publications/virgil-aeneid-1195-207-read-latin-wendell-clausen"
    },
    {
      "label": "次の冒険へ",
      "ja": "人生とは、失敗がなければひどく退屈なものだろう。",
      "en": "Life would be very dull without them.",
      "credit": "オスカー・ワイルド『ウィンダミア卿夫人の扇』第3幕",
      "url": "https://www.gutenberg.org/files/790/790-h/790-h"
    },
    {
      "label": "次の冒険へ",
      "ja": "心は、行く手を阻むものさえ、次に取り組むべきものへ変える。",
      "en": "The mind turns every obstacle into the next task.",
      "credit": "マルクス・アウレリウス『自省録』第5巻20節。",
      "url": "https://marcusaurelius-meditations.org/en/quotes/to-kolyma-pro-ergou/"
    },
    {
      "label": "次の冒険へ",
      "ja": "蒼白い顔した死神は、乞食の門も王の宮殿も平等に敲く。",
      "en": "Pale Death beats equally at the poor man's gate and at the palaces of kings.",
      "credit": "ホラティウス『歌集』第1巻第4歌",
      "url": "https://www.literarymatters.org/11-1-horace-ode-i-4/"
    },
    {
      "label": "次の冒険へ",
      "ja": "蝋燭が消えれば　渡れない川がある",
      "en": "Once the candle disappears, there’ll be a river that cannot be crossed",
      "credit": "Sound Horizon『エルの絵本 [魔女とラフレンツェ]』",
      "url": "https://sound-horizon-lyrics.fandom.com/wiki/The_Witch_and_Lafrenze%EF%BC%BBPico_Magic_ver.%EF%BC%BD#English"
    },
    {
      "label": "次の冒険へ",
      "ja": "ひらひら　椿の散華",
      "en": "Fluttering down, the fallen camellia petals.",
      "credit": "あさき『この子の七つのお祝いに』",
      "url": "https://remywiki.com/Kono_ko_no_nanatsu_no_oiwai_ni"
    },
    {
      "label": "次の冒険へ",
      "ja": "結びの目　駆け足で　解けていく　思い思い",
      "en": "The eye of the knot comes untied in a rush as it pleases…",
      "credit": "あさき『予後の音』",
      "url": "https://releska.com/2019/12/16/sounds-of-convalescence/"
    }
  ]
};
function pickDefeatQuote(category, random = Math.random) {
  const valid = list => Array.isArray(list) ? list.filter(q => q && typeof q.ja === 'string' && q.ja.trim()) : [];
  const choices = valid(ARIADNE_DEFEAT_QUOTES[category]); const pool = choices.length ? choices : valid(ARIADNE_DEFEAT_QUOTES.default);
  return pool.length ? pool[Math.floor(random() * pool.length)] : null;
}
if (typeof module !== "undefined") module.exports = { quotes: ARIADNE_DEFEAT_QUOTES, pickDefeatQuote };
