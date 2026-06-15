const easyQuestions = [
  // 単音問題
  {
    type: "sound",
    prompt: "ㄱ",
    answer: "ㄱ",
    roman: "g / k",
    description: "軽いカ行・ガ行系の音",
    keys: ["R"]
  },
  {
    type: "sound",
    prompt: "ㄴ",
    answer: "ㄴ",
    roman: "n",
    description: "ナ行の音",
    keys: ["S"]
  },
  {
    type: "sound",
    prompt: "ㄷ",
    answer: "ㄷ",
    roman: "d / t",
    description: "軽いタ行・ダ行系の音",
    keys: ["E"]
  },
  {
    type: "sound",
    prompt: "ㄹ",
    answer: "ㄹ",
    roman: "r / l",
    description: "ラ行の音",
    keys: ["F"]
  },
  {
    type: "sound",
    prompt: "ㅁ",
    answer: "ㅁ",
    roman: "m",
    description: "マ行の音",
    keys: ["A"]
  },
  {
    type: "sound",
    prompt: "ㅂ",
    answer: "ㅂ",
    roman: "b / p",
    description: "軽いパ行・バ行系の音",
    keys: ["Q"]
  },
  {
    type: "sound",
    prompt: "ㅅ",
    answer: "ㅅ",
    roman: "s",
    description: "サ行の音",
    keys: ["T"]
  },
  {
    type: "sound",
    prompt: "ㅇ",
    answer: "ㅇ",
    roman: "ng / (無音)",
    description: "初声では無音、終声では「ン」",
    keys: ["D"]
  },
  {
    type: "sound",
    prompt: "ㅈ",
    answer: "ㅈ",
    roman: "j / ch",
    description: "チャ行・ジャ行系の音",
    keys: ["W"]
  },
  {
    type: "sound",
    prompt: "ㅎ",
    answer: "ㅎ",
    roman: "h",
    description: "ハ行の音",
    keys: ["G"]
  },
  {
    type: "sound",
    prompt: "ㅋ",
    answer: "ㅋ",
    roman: "k",
    description: "激音のカ行",
    keys: ["Z"]
  },
  {
    type: "sound",
    prompt: "ㅌ",
    answer: "ㅌ",
    roman: "t",
    description: "激音のタ行",
    keys: ["X"]
  },
  {
    type: "sound",
    prompt: "ㅍ",
    answer: "ㅍ",
    roman: "p",
    description: "激音のパ行",
    keys: ["V"]
  },
  {
    type: "sound",
    prompt: "ㅊ",
    answer: "ㅊ",
    roman: "ch",
    description: "激音のチャ行",
    keys: ["C"]
  },
  {
    type: "sound",
    prompt: "ㄲ",
    answer: "ㄲ",
    roman: "kk",
    description: "強く詰まったカ行系の音（濃音）",
    keys: ["Shift", "R"]
  },
  {
    type: "sound",
    prompt: "ㄸ",
    answer: "ㄸ",
    roman: "tt",
    description: "強く詰まったタ行系の音（濃音）",
    keys: ["Shift", "E"]
  },
  {
    type: "sound",
    prompt: "ㅃ",
    answer: "ㅃ",
    roman: "pp",
    description: "強く詰まったパ行系の音（濃音）",
    keys: ["Shift", "Q"]
  },
  {
    type: "sound",
    prompt: "ㅆ",
    answer: "ㅆ",
    roman: "ss",
    description: "強く詰まったサ行系の音（濃音）",
    keys: ["Shift", "T"]
  },
  {
    type: "sound",
    prompt: "ㅉ",
    answer: "ㅉ",
    roman: "jj",
    description: "強く詰まったチャ行系の音（濃音）",
    keys: ["Shift", "W"]
  },
  {
    type: "sound",
    prompt: "ㅏ",
    answer: "ㅏ",
    roman: "a",
    description: "ア",
    keys: ["K"]
  },
  {
    type: "sound",
    prompt: "ㅓ",
    answer: "ㅓ",
    roman: "eo",
    description: "口を丸め過ぎないオ",
    keys: ["J"]
  },
  {
    type: "sound",
    prompt: "ㅗ",
    answer: "ㅗ",
    roman: "o",
    description: "口を丸めたオ",
    keys: ["H"]
  },
  {
    type: "sound",
    prompt: "ㅜ",
    answer: "ㅜ",
    roman: "u",
    description: "口を突き出したウ",
    keys: ["N"]
  },
  {
    type: "sound",
    prompt: "ㅡ",
    answer: "ㅡ",
    roman: "eu",
    description: "口を横に引いたウ",
    keys: ["M"]
  },
  {
    type: "sound",
    prompt: "ㅣ",
    answer: "ㅣ",
    roman: "i",
    description: "イ",
    keys: ["L"]
  },
  {
    type: "sound",
    prompt: "ㅐ",
    answer: "ㅐ",
    roman: "ae",
    description: "エに近い母音",
    keys: ["O"]
  },
  {
    type: "sound",
    prompt: "ㅔ",
    answer: "ㅔ",
    roman: "e",
    description: "エに近い母音",
    keys: ["P"]
  },
  {
    type: "sound",
    prompt: "ㅑ",
    answer: "ㅑ",
    roman: "ya",
    description: "ヤ",
    keys: ["I"]
  },
  {
    type: "sound",
    prompt: "ㅕ",
    answer: "ㅕ",
    roman: "yeo",
    description: "ヨ寄りだが、口を丸めすぎない音",
    keys: ["U"]
  },
  {
    type: "sound",
    prompt: "ㅛ",
    answer: "ㅛ",
    roman: "yo",
    description: "ヨ",
    keys: ["Y"]
  },
  {
    type: "sound",
    prompt: "ㅠ",
    answer: "ㅠ",
    roman: "yu",
    description: "ユ",
    keys: ["B"]
  },
  // 単語問題
  {
    type: "word",
    prompt: "나",
    answer: "나",
    roman: "na",
    meaning: "私",
    keys: ["S", "K"]
  },
  {
    type: "word",
    prompt: "너",
    answer: "너",
    roman: "neo",
    meaning: "君",
    keys: ["S", "J"]
  },
  {
    type: "word",
    prompt: "눈",
    answer: "눈",
    roman: "nun",
    meaning: "目 / 雪",
    keys: ["S", "N", "S"]
  },
  {
    type: "word",
    prompt: "문",
    answer: "문",
    roman: "mun",
    meaning: "ドア",
    keys: ["A", "N", "S"]
  },
  {
    type: "word",
    prompt: "가",
    answer: "가",
    roman: "ga / ka",
    meaning: "行く、または音節練習用の「ガ/カ」",
    keys: ["R", "K"]
  },
  {
    type: "word",
    prompt: "고",
    answer: "고",
    roman: "go / ko",
    meaning: "音節練習用の「ゴ/コ」",
    keys: ["R", "H"]
  },
  {
    type: "word",
    prompt: "구",
    answer: "구",
    roman: "gu / ku",
    meaning: "区 / 九などで使う音",
    keys: ["R", "N"]
  },
  {
    type: "word",
    prompt: "마",
    answer: "마",
    roman: "ma",
    meaning: "マ",
    keys: ["A", "K"]
  },
  {
    type: "word",
    prompt: "모",
    answer: "모",
    roman: "mo",
    meaning: "母 / 某などで使う音",
    keys: ["A", "H"]
  },
  {
    type: "word",
    prompt: "미",
    answer: "미",
    roman: "mi",
    meaning: "美 / 味などで使う音",
    keys: ["A", "L"]
  },
  {
    type: "word",
    prompt: "소",
    answer: "소",
    roman: "so",
    meaning: "牛 / 小",
    keys: ["T", "H"]
  },
  {
    type: "word",
    prompt: "아",
    answer: "아",
    roman: "a",
    meaning: "ああ、感嘆など",
    keys: ["D", "K"]
  },
  {
    type: "word",
    prompt: "오",
    answer: "오",
    roman: "o",
    meaning: "五 / 感嘆のオ",
    keys: ["D", "H"]
  },
  {
    type: "word",
    prompt: "이",
    answer: "이",
    roman: "i",
    meaning: "この / 二 / 歯など",
    keys: ["D", "L"]
  },
  {
    type: "word",
    prompt: "물",
    answer: "물",
    roman: "mul",
    meaning: "水",
    keys: ["A", "N", "F"]
  },
  {
    type: "word",
    prompt: "밥",
    answer: "밥",
    roman: "bap",
    meaning: "ごはん",
    keys: ["Q", "K", "Q"]
  },
  {
    type: "word",
    prompt: "떡",
    answer: "떡",
    roman: "tteok",
    meaning: "餅",
    keys: ["Shift", "E", "J", "R"]
  },
  {
    type: "word",
    prompt: "차",
    answer: "차",
    roman: "cha",
    meaning: "お茶 / 車",
    keys: ["C", "K"]
  },
  {
    type: "word",
    prompt: "김",
    answer: "김",
    roman: "kim / gim",
    meaning: "海苔 / キム(姓)",
    keys: ["R", "L", "A"]
  },
  {
    type: "word",
    prompt: "개",
    answer: "개",
    roman: "gae",
    meaning: "犬",
    keys: ["R", "O"]
  },
  {
    type: "word",
    prompt: "산",
    answer: "산",
    roman: "san",
    meaning: "山",
    keys: ["T", "K", "S"]
  },
  {
    type: "word",
    prompt: "손",
    answer: "손",
    roman: "son",
    meaning: "手",
    keys: ["T", "H", "S"]
  },
  {
    type: "word",
    prompt: "달",
    answer: "달",
    roman: "dal / tal",
    meaning: "月",
    keys: ["E", "K", "F"]
  },
  {
    type: "word",
    prompt: "길",
    answer: "길",
    roman: "gil / kil",
    meaning: "道",
    keys: ["R", "L", "F"]
  },
  {
    type: "word",
    prompt: "밤",
    answer: "밤",
    roman: "bam / pam",
    meaning: "夜 / 栗",
    keys: ["Q", "K", "A"]
  },
  {
    type: "word",
    prompt: "불",
    answer: "불",
    roman: "bul / pul",
    meaning: "火",
    keys: ["Q", "N", "F"]
  },
  {
    type: "word",
    prompt: "입",
    answer: "입",
    roman: "ip",
    meaning: "口",
    keys: ["D", "L", "Q"]
  },
  {
    type: "word",
    prompt: "집",
    answer: "집",
    roman: "jip / chip",
    meaning: "家",
    keys: ["W", "L", "Q"]
  },
  {
    type: "word",
    prompt: "꼬",
    answer: "꼬",
    roman: "kko",
    meaning: "濃音 ㄲ の練習用音節",
    keys: ["Shift", "R", "H"]
  },
  {
    type: "word",
    prompt: "또",
    answer: "또",
    roman: "tto",
    meaning: "また",
    keys: ["Shift", "E", "H"]
  },
  {
    type: "word",
    prompt: "씨",
    answer: "씨",
    roman: "ssi",
    meaning: "〜さん / 種",
    keys: ["Shift", "T", "L"]
  },
  {
    type: "word",
    prompt: "코",
    answer: "코",
    roman: "ko",
    meaning: "鼻",
    keys: ["Z", "H"]
  },
  {
    type: "word",
    prompt: "피",
    answer: "피",
    roman: "pi",
    meaning: "血",
    keys: ["V", "L"]
  },
  {
    type: "word",
    prompt: "키",
    answer: "키",
    roman: "ki",
    meaning: "背 / キー",
    keys: ["Z", "L"]
  },
  {
    type: "word",
    prompt: "꼬",
    answer: "꼬",
    roman: "kko",
    meaning: "濃音 ㄲ の練習用音節",
    keys: ["Shift", "R", "H"]
  },
  {
    type: "word",
    prompt: "또",
    answer: "또",
    roman: "tto",
    meaning: "また",
    keys: ["Shift", "E", "H"]
  },
  {
    type: "word",
    prompt: "씨",
    answer: "씨",
    roman: "ssi",
    meaning: "〜さん / 種",
    keys: ["Shift", "T", "L"]
  },
  {
    type: "word",
    prompt: "코",
    answer: "코",
    roman: "ko",
    meaning: "鼻",
    keys: ["Z", "H"]
  },
  {
    type: "word",
    prompt: "피",
    answer: "피",
    roman: "pi",
    meaning: "血",
    keys: ["V", "L"]
  },
  {
    type: "word",
    prompt: "키",
    answer: "키",
    roman: "ki",
    meaning: "背 / キー",
    keys: ["Z", "L"]
  },
  {
    type: "word",
    prompt: "아이",
    answer: "아이",
    roman: "ai",
    meaning: "子ども",
    keys: ["D", "K", "D", "L"]
  },
  {
    type: "word",
    prompt: "우유",
    answer: "우유",
    roman: "uyu",
    meaning: "牛乳",
    keys: ["D", "N", "D", "B"]
  },
  {
    type: "word",
    prompt: "오이",
    answer: "오이",
    roman: "oi",
    meaning: "きゅうり",
    keys: ["D", "H", "D", "L"]
  },
  {
    type: "word",
    prompt: "나무",
    answer: "나무",
    roman: "namu",
    meaning: "木",
    keys: ["S", "K", "A", "N"]
  },
  {
    type: "word",
    prompt: "바다",
    answer: "바다",
    roman: "bada / pada",
    meaning: "海",
    keys: ["Q", "K", "E", "K"]
  },
  {
    type: "word",
    prompt: "고기",
    answer: "고기",
    roman: "gogi / kogi",
    meaning: "肉 / 魚肉",
    keys: ["R", "H", "R", "L"]
  },
  // 家族・人
  {
    type: "word",
    prompt: "엄마",
    answer: "엄마",
    roman: "eomma",
    meaning: "お母さん / ママ",
    keys: ["D", "J", "A", "A", "K"]
  },
  {
    type: "word",
    prompt: "아빠",
    answer: "아빠",
    roman: "appa",
    meaning: "お父さん / パパ",
    keys: ["D", "K", "Shift", "Q", "K"]
  },
  {
    type: "word",
    prompt: "형",
    answer: "형",
    roman: "hyeong",
    meaning: "兄 / お兄さん ※男性から見た兄",
    keys: ["G", "U", "D"]
  },
  {
    type: "word",
    prompt: "누나",
    answer: "누나",
    roman: "nuna",
    meaning: "姉 / お姉さん ※男性から見た姉",
    keys: ["S", "N", "S", "K"]
  },
  {
    type: "word",
    prompt: "언니",
    answer: "언니",
    roman: "eonni",
    meaning: "姉 / お姉さん ※女性から見た姉",
    keys: ["D", "J", "S", "S", "L"]
  },
  {
    type: "word",
    prompt: "오빠",
    answer: "오빠",
    roman: "oppa",
    meaning: "兄 / お兄さん ※女性から見た兄",
    keys: ["D", "H", "Shift", "Q", "K"]
  },
  {
    type: "word",
    prompt: "동생",
    answer: "동생",
    roman: "dongsaeng",
    meaning: "弟 / 妹 / 年下のきょうだい",
    keys: ["E", "H", "D", "T", "O", "D"]
  },
  {
    type: "word",
    prompt: "아이",
    answer: "아이",
    roman: "ai",
    meaning: "子ども",
    keys: ["D", "K", "D", "L"]
  },

  // 食べ物・飲み物
  {
    type: "word",
    prompt: "밥",
    answer: "밥",
    roman: "bap",
    meaning: "ごはん",
    keys: ["Q", "K", "Q"]
  },
  {
    type: "word",
    prompt: "빵",
    answer: "빵",
    roman: "ppang",
    meaning: "パン",
    keys: ["Shift", "Q", "K", "D"]
  },
  {
    type: "word",
    prompt: "물",
    answer: "물",
    roman: "mul",
    meaning: "水",
    keys: ["A", "N", "F"]
  },
  {
    type: "word",
    prompt: "우유",
    answer: "우유",
    roman: "uyu",
    meaning: "牛乳",
    keys: ["D", "N", "D", "B"]
  },
  {
    type: "word",
    prompt: "차",
    answer: "차",
    roman: "cha",
    meaning: "お茶 / 車",
    keys: ["C", "K"]
  },
  {
    type: "word",
    prompt: "고기",
    answer: "고기",
    roman: "gogi / kogi",
    meaning: "肉",
    keys: ["R", "H", "R", "L"]
  },
  {
    type: "word",
    prompt: "생선",
    answer: "생선",
    roman: "saengseon",
    meaning: "魚",
    keys: ["T", "O", "D", "T", "J", "S"]
  },
  {
    type: "word",
    prompt: "계란",
    answer: "계란",
    roman: "gyeran",
    meaning: "卵",
    keys: ["R", "P", "F", "K", "S"]
  },
  {
    type: "word",
    prompt: "사과",
    answer: "사과",
    roman: "sagwa",
    meaning: "りんご",
    keys: ["T", "K", "R", "H", "K"]
  },
  {
    type: "word",
    prompt: "오이",
    answer: "오이",
    roman: "oi",
    meaning: "きゅうり",
    keys: ["D", "H", "D", "L"]
  },
  {
    type: "word",
    prompt: "김치",
    answer: "김치",
    roman: "gimchi / kimchi",
    meaning: "キムチ",
    keys: ["R", "L", "A", "C", "L"]
  },
  {
    type: "word",
    prompt: "라면",
    answer: "라면",
    roman: "ramyeon",
    meaning: "ラーメン / インスタント麺",
    keys: ["F", "K", "A", "U", "S"]
  },

  // 天気・気象
  {
    type: "word",
    prompt: "비",
    answer: "비",
    roman: "bi / pi",
    meaning: "雨",
    keys: ["Q", "L"]
  },
  {
    type: "word",
    prompt: "눈",
    answer: "눈",
    roman: "nun",
    meaning: "雪 / 目",
    keys: ["S", "N", "S"]
  },
  {
    type: "word",
    prompt: "바람",
    answer: "바람",
    roman: "baram / param",
    meaning: "風",
    keys: ["Q", "K", "F", "K", "A"]
  },
  {
    type: "word",
    prompt: "하늘",
    answer: "하늘",
    roman: "haneul",
    meaning: "空",
    keys: ["G", "K", "S", "M", "F"]
  },
  {
    type: "word",
    prompt: "구름",
    answer: "구름",
    roman: "gureum / kureum",
    meaning: "雲",
    keys: ["R", "N", "F", "M", "A"]
  },
  {
    type: "word",
    prompt: "해",
    answer: "해",
    roman: "hae",
    meaning: "太陽 / 年",
    keys: ["G", "O"]
  },
  {
    type: "word",
    prompt: "달",
    answer: "달",
    roman: "dal / tal",
    meaning: "月",
    keys: ["E", "K", "F"]
  },
  {
    type: "word",
    prompt: "날씨",
    answer: "날씨",
    roman: "nalssi",
    meaning: "天気",
    keys: ["S", "K", "F", "Shift", "T", "L"]
  },
  {
    type: "word",
    prompt: "덥다",
    answer: "덥다",
    roman: "deopda / teopda",
    meaning: "暑い",
    keys: ["E", "J", "Q", "E", "K"]
  },
  {
    type: "word",
    prompt: "춥다",
    answer: "춥다",
    roman: "chupda",
    meaning: "寒い",
    keys: ["C", "N", "Q", "E", "K"]
  },

  // 簡単な動詞・形容詞
  {
    type: "word",
    prompt: "가다",
    answer: "가다",
    roman: "gada / kada",
    meaning: "行く",
    keys: ["R", "K", "E", "K"]
  },
  {
    type: "word",
    prompt: "오다",
    answer: "오다",
    roman: "oda",
    meaning: "来る",
    keys: ["D", "H", "E", "K"]
  },
  {
    type: "word",
    prompt: "보다",
    answer: "보다",
    roman: "boda / poda",
    meaning: "見る",
    keys: ["Q", "H", "E", "K"]
  },
  {
    type: "word",
    prompt: "먹다",
    answer: "먹다",
    roman: "meokda / meokta",
    meaning: "食べる",
    keys: ["A", "J", "R", "E", "K"]
  },
  {
    type: "word",
    prompt: "마시다",
    answer: "마시다",
    roman: "masida",
    meaning: "飲む",
    keys: ["A", "K", "T", "L", "E", "K"]
  },
  {
    type: "word",
    prompt: "자다",
    answer: "자다",
    roman: "jada / chada",
    meaning: "寝る",
    keys: ["W", "K", "E", "K"]
  },
  {
    type: "word",
    prompt: "읽다",
    answer: "읽다",
    roman: "ilkda / iktta",
    meaning: "読む",
    keys: ["D", "L", "F", "R", "E", "K"]
  },
  {
    type: "word",
    prompt: "쓰다",
    answer: "쓰다",
    roman: "sseuda",
    meaning: "書く / 使う",
    keys: ["Shift", "T", "M", "E", "K"]
  },
  {
    type: "word",
    prompt: "좋다",
    answer: "좋다",
    roman: "jota / chota",
    meaning: "良い",
    keys: ["W", "H", "G", "E", "K"]
  },
  {
    type: "word",
    prompt: "싫다",
    answer: "싫다",
    roman: "silta",
    meaning: "嫌いだ / 嫌だ",
    keys: ["Shift", "T", "L", "F", "G", "E", "K"]
  },

  // 日常のもの・場所
  {
    type: "word",
    prompt: "집",
    answer: "집",
    roman: "jip / chip",
    meaning: "家",
    keys: ["W", "L", "Q"]
  },
  {
    type: "word",
    prompt: "방",
    answer: "방",
    roman: "bang / pang",
    meaning: "部屋",
    keys: ["Q", "K", "D"]
  },
  {
    type: "word",
    prompt: "문",
    answer: "문",
    roman: "mun",
    meaning: "ドア",
    keys: ["A", "N", "S"]
  },
  {
    type: "word",
    prompt: "책",
    answer: "책",
    roman: "chaek",
    meaning: "本",
    keys: ["C", "O", "R"]
  },
  {
    type: "word",
    prompt: "학교",
    answer: "학교",
    roman: "hakgyo",
    meaning: "学校",
    keys: ["G", "K", "R", "R", "Y"]
  },
  {
    type: "word",
    prompt: "길",
    answer: "길",
    roman: "gil / kil",
    meaning: "道",
    keys: ["R", "L", "F"]
  },
  {
    type: "word",
    prompt: "산",
    answer: "산",
    roman: "san",
    meaning: "山",
    keys: ["T", "K", "S"]
  },
  {
    type: "word",
    prompt: "바다",
    answer: "바다",
    roman: "bada / pada",
    meaning: "海",
    keys: ["Q", "K", "E", "K"]
  },
  {
    type: "word",
    prompt: "나무",
    answer: "나무",
    roman: "namu",
    meaning: "木",
    keys: ["S", "K", "A", "N"]
  },
  {
    type: "word",
    prompt: "꽃",
    answer: "꽃",
    roman: "kkot",
    meaning: "花",
    keys: ["Shift", "R", "H", "Shift", "T"]
  },
  {
    type: "phrase",
    prompt: "안녕",
    answer: "안녕",
    roman: "annyeong",
    meaning: "こんにちは / やあ / バイバイ",
    keys: ["D", "K", "S", "S", "U", "D"]
  },
  {
    type: "phrase",
    prompt: "고마워",
    answer: "고마워",
    roman: "gomawo",
    meaning: "ありがとう",
    keys: ["R", "H", "A", "K", "D", "N", "J"]
  },
  {
    type: "phrase",
    prompt: "미안",
    answer: "미안",
    roman: "mian",
    meaning: "ごめん",
    keys: ["A", "L", "D", "K", "S"]
  },
  {
    type: "phrase",
    prompt: "좋아",
    answer: "좋아",
    roman: "joa / choa",
    meaning: "いいね / 好き",
    keys: ["W", "H", "G", "D", "K"]
  },

  // かわいい短文
  {
    type: "phrase",
    prompt: "나 가",
    answer: "나 가",
    roman: "na ga",
    meaning: "私、行く",
    keys: ["S", "K", "Space", "R", "K"]
  },
  {
    type: "phrase",
    prompt: "너 와",
    answer: "너 와",
    roman: "neo wa",
    meaning: "君、来て",
    keys: ["S", "J", "Space", "D", "H", "K"]
  },
  {
    type: "phrase",
    prompt: "물 줘",
    answer: "물 줘",
    roman: "mul jwo",
    meaning: "水ちょうだい",
    keys: ["A", "N", "F", "Space", "W", "N", "J"]
  },
  {
    type: "phrase",
    prompt: "밥 줘",
    answer: "밥 줘",
    roman: "bap jwo",
    meaning: "ごはんちょうだい",
    keys: ["Q", "K", "Q", "Space", "W", "N", "J"]
  },
  {
    type: "phrase",
    prompt: "떡 줘",
    answer: "떡 줘",
    roman: "tteok jwo",
    meaning: "餅ちょうだい",
    keys: ["Shift", "E", "J", "R", "Space", "W", "N", "J"]
  },

  // 食べ物系
  {
    type: "phrase",
    prompt: "사과 먹어",
    answer: "사과 먹어",
    roman: "sagwa meogeo",
    meaning: "りんごを食べて",
    keys: ["T", "K", "R", "H", "K", "Space", "A", "J", "R", "D", "J"]
  },
  {
    type: "phrase",
    prompt: "물 마셔",
    answer: "물 마셔",
    roman: "mul masyeo",
    meaning: "水を飲んで",
    keys: ["A", "N", "F", "Space", "A", "K", "T", "U", "J"]
  },
  {
    type: "phrase",
    prompt: "밥 먹어",
    answer: "밥 먹어",
    roman: "bap meogeo",
    meaning: "ごはん食べて",
    keys: ["Q", "K", "Q", "Space", "A", "J", "R", "D", "J"]
  },
  {
    type: "phrase",
    prompt: "우유 마셔",
    answer: "우유 마셔",
    roman: "uyu masyeo",
    meaning: "牛乳を飲んで",
    keys: ["D", "N", "D", "B", "Space", "A", "K", "T", "U", "J"]
  },

  // 天気系
  {
    type: "phrase",
    prompt: "비 와",
    answer: "비 와",
    roman: "bi wa",
    meaning: "雨が降る",
    keys: ["Q", "L", "Space", "D", "H", "K"]
  },
  {
    type: "phrase",
    prompt: "눈 와",
    answer: "눈 와",
    roman: "nun wa",
    meaning: "雪が降る",
    keys: ["S", "N", "S", "Space", "D", "H", "K"]
  },
  {
    type: "phrase",
    prompt: "날씨 좋아",
    answer: "날씨 좋아",
    roman: "nalssi joa",
    meaning: "天気がいい",
    keys: ["S", "K", "F", "Shift", "T", "L", "Space", "W", "H", "G", "D", "K"]
  },
  {
    type: "phrase",
    prompt: "하늘 봐",
    answer: "하늘 봐",
    roman: "haneul bwa",
    meaning: "空を見て",
    keys: ["G", "K", "S", "M", "F", "Space", "Q", "H", "K"]
  },

  // 家族・日常
  {
    type: "phrase",
    prompt: "엄마 와",
    answer: "엄마 와",
    roman: "eomma wa",
    meaning: "ママが来る / ママ来て",
    keys: ["D", "J", "A", "A", "K", "Space", "D", "H", "K"]
  },
  {
    type: "phrase",
    prompt: "아빠 가",
    answer: "아빠 가",
    roman: "appa ga",
    meaning: "パパが行く",
    keys: ["D", "K", "Shift", "Q", "K", "Space", "R", "K"]
  },
  {
    type: "phrase",
    prompt: "집 가",
    answer: "집 가",
    roman: "jip ga",
    meaning: "家に帰る / 家に行く",
    keys: ["W", "L", "Q", "Space", "R", "K"]
  },
  {
    type: "phrase",
    prompt: "문 열어",
    answer: "문 열어",
    roman: "mun yeoreo",
    meaning: "ドアを開けて",
    keys: ["A", "N", "S", "Space", "D", "U", "F", "D", "J"]
  },

  // かんたん会話
  {
    type: "phrase",
    prompt: "나 좋아",
    answer: "나 좋아",
    roman: "na joa",
    meaning: "私は好き / 私、いいよ",
    keys: ["S", "K", "Space", "W", "H", "G", "D", "K"]
  },
  {
    type: "phrase",
    prompt: "너 좋아",
    answer: "너 좋아",
    roman: "neo joa",
    meaning: "君が好き / 君、いいね",
    keys: ["S", "J", "Space", "W", "H", "G", "D", "K"]
  },
  {
    type: "phrase",
    prompt: "이거 뭐야",
    answer: "이거 뭐야",
    roman: "igeo mwoya",
    meaning: "これ何？",
    keys: ["D", "L", "R", "J", "Space", "A", "N", "J", "D", "I"]
  },
  {
    type: "phrase",
    prompt: "나도 가",
    answer: "나도 가",
    roman: "nado ga",
    meaning: "私も行く",
    keys: ["S", "K", "E", "H", "Space", "R", "K"]
  },
  // あいさつ・基本
  {
    type: "phrase",
    prompt: "안녕하세요",
    answer: "안녕하세요",
    roman: "annyeonghaseyo",
    meaning: "こんにちは",
    keys: ["D", "K", "S", "S", "U", "D", "G", "K", "T", "P", "D", "Y"]
  },
  {
    type: "phrase",
    prompt: "감사합니다",
    answer: "감사합니다",
    roman: "gamsahamnida",
    meaning: "ありがとうございます",
    keys: ["R", "K", "A", "T", "K", "G", "K", "Q", "S", "L", "E", "K"]
  },
  {
    type: "phrase",
    prompt: "고맙습니다",
    answer: "고맙습니다",
    roman: "gomapseumnida",
    meaning: "ありがとうございます",
    keys: ["R", "H", "A", "K", "Q", "T", "M", "Q", "S", "L", "E", "K"]
  },
  {
    type: "phrase",
    prompt: "죄송합니다",
    answer: "죄송합니다",
    roman: "joesonghamnida",
    meaning: "申し訳ありません",
    keys: ["W", "H", "L", "T", "H", "D", "G", "K", "Q", "S", "L", "E", "K"]
  },
  {
    type: "phrase",
    prompt: "괜찮아요",
    answer: "괜찮아요",
    roman: "gwaenchanayo",
    meaning: "大丈夫です",
    keys: ["R", "H", "K", "O", "S", "C", "K", "S", "D", "K", "D", "Y"]
  },
  {
    type: "phrase",
    prompt: "네",
    answer: "네",
    roman: "ne",
    meaning: "はい",
    keys: ["S", "P"]
  },
  {
    type: "phrase",
    prompt: "아니요",
    answer: "아니요",
    roman: "aniyo",
    meaning: "いいえ",
    keys: ["D", "K", "S", "L", "D", "Y"]
  },

  // お願い・依頼
  {
    type: "phrase",
    prompt: "주세요",
    answer: "주세요",
    roman: "juseyo",
    meaning: "ください",
    keys: ["W", "N", "T", "P", "D", "Y"]
  },
  {
    type: "phrase",
    prompt: "물 주세요",
    answer: "물 주세요",
    roman: "mul juseyo",
    meaning: "水をください",
    keys: ["A", "N", "F", "Space", "W", "N", "T", "P", "D", "Y"]
  },
  {
    type: "phrase",
    prompt: "메뉴 주세요",
    answer: "메뉴 주세요",
    roman: "menyu juseyo",
    meaning: "メニューをください",
    keys: ["A", "P", "S", "B", "Space", "W", "N", "T", "P", "D", "Y"]
  },
  {
    type: "phrase",
    prompt: "이거 주세요",
    answer: "이거 주세요",
    roman: "igeo juseyo",
    meaning: "これをください",
    keys: ["D", "L", "R", "J", "Space", "W", "N", "T", "P", "D", "Y"]
  },
  {
    type: "phrase",
    prompt: "잠시만요",
    answer: "잠시만요",
    roman: "jamsimanyo",
    meaning: "少々お待ちください / ちょっとすみません",
    keys: ["W", "K", "A", "T", "L", "A", "K", "S", "D", "Y"]
  },

  // 場所を聞く
  {
    type: "phrase",
    prompt: "화장실 어디예요",
    answer: "화장실 어디예요",
    roman: "hwajangsil eodiyeyo",
    meaning: "トイレはどこですか",
    keys: ["G", "H", "K", "W", "K", "D", "T", "L", "F", "Space", "D", "J", "E", "L", "D", "P", "D", "Y"]
  },
  {
    type: "phrase",
    prompt: "역 어디예요",
    answer: "역 어디예요",
    roman: "yeok eodiyeyo",
    meaning: "駅はどこですか",
    keys: ["D", "U", "R", "Space", "D", "J", "E", "L", "D", "P", "D", "Y"]
  },
  {
    type: "phrase",
    prompt: "여기 어디예요",
    answer: "여기 어디예요",
    roman: "yeogi eodiyeyo",
    meaning: "ここはどこですか",
    keys: ["D", "U", "R", "L", "Space", "D", "J", "E", "L", "D", "P", "D", "Y"]
  },
  {
    type: "phrase",
    prompt: "어디예요",
    answer: "어디예요",
    roman: "eodiyeyo",
    meaning: "どこですか",
    keys: ["D", "J", "E", "L", "D", "P", "D", "Y"]
  },

  // 買い物・会計
  {
    type: "phrase",
    prompt: "얼마예요",
    answer: "얼마예요",
    roman: "eolmayeyo",
    meaning: "いくらですか",
    keys: ["D", "J", "F", "A", "K", "D", "P", "D", "Y"]
  },
  {
    type: "phrase",
    prompt: "카드 돼요",
    answer: "카드 돼요",
    roman: "kadeu dwaeyo",
    meaning: "カードは使えますか",
    keys: ["Z", "K", "E", "M", "Space", "E", "H", "O", "D", "Y"]
  },
  {
    type: "phrase",
    prompt: "영수증 주세요",
    answer: "영수증 주세요",
    roman: "yeongsujeung juseyo",
    meaning: "レシートをください",
    keys: ["D", "U", "D", "T", "N", "W", "M", "D", "Space", "W", "N", "T", "P", "D", "Y"]
  },
  {
    type: "phrase",
    prompt: "봉투 주세요",
    answer: "봉투 주세요",
    roman: "bongtu juseyo",
    meaning: "袋をください",
    keys: ["Q", "H", "D", "X", "N", "Space", "W", "N", "T", "P", "D", "Y"]
  },
  {
    type: "phrase",
    prompt: "계산해 주세요",
    answer: "계산해 주세요",
    roman: "gyesanhae juseyo",
    meaning: "お会計お願いします",
    keys: ["R", "P", "T", "K", "S", "G", "O", "Space", "W", "N", "T", "P", "D", "Y"]
  },

  // 食事・注文
  {
    type: "phrase",
    prompt: "맛있어요",
    answer: "맛있어요",
    roman: "masisseoyo",
    meaning: "おいしいです",
    keys: ["A", "K", "T", "D", "L", "T", "T", "D", "J", "D", "Y"]
  },
  {
    type: "phrase",
    prompt: "잘 먹겠습니다",
    answer: "잘 먹겠습니다",
    roman: "jal meokgesseumnida",
    meaning: "いただきます",
    keys: ["W", "K", "F", "Space", "A", "J", "R", "R", "P", "T", "T", "M", "Q", "S", "L", "E", "K"]
  },
  {
    type: "phrase",
    prompt: "잘 먹었습니다",
    answer: "잘 먹었습니다",
    roman: "jal meogeosseumnida",
    meaning: "ごちそうさまでした",
    keys: ["W", "K", "F", "Space", "A", "J", "R", "D", "J", "T", "T", "M", "Q", "S", "L", "E", "K"]
  },
  {
    type: "phrase",
    prompt: "덜 맵게 해 주세요",
    answer: "덜 맵게 해 주세요",
    roman: "deol maepge hae juseyo",
    meaning: "辛さ控えめにしてください",
    keys: ["E", "J", "F", "Space", "A", "O", "Q", "R", "P", "Space", "G", "O", "Space", "W", "N", "T", "P", "D", "Y"]
  },

  // 交通・移動
  {
    type: "phrase",
    prompt: "여기로 가 주세요",
    answer: "여기로 가 주세요",
    roman: "yeogiro ga juseyo",
    meaning: "ここへ行ってください",
    keys: ["D", "U", "R", "L", "F", "H", "Space", "R", "K", "Space", "W", "N", "T", "P", "D", "Y"]
  },
  {
    type: "phrase",
    prompt: "천천히 가 주세요",
    answer: "천천히 가 주세요",
    roman: "cheoncheonhi ga juseyo",
    meaning: "ゆっくり行ってください",
    keys: ["C", "J", "S", "C", "J", "S", "G", "L", "Space", "R", "K", "Space", "W", "N", "T", "P", "D", "Y"]
  },
  {
    type: "phrase",
    prompt: "내려 주세요",
    answer: "내려 주세요",
    roman: "naeryeo juseyo",
    meaning: "降ろしてください",
    keys: ["S", "O", "F", "U", "Space", "W", "N", "T", "P", "D", "Y"]
  },

  // 困った時
  {
    type: "phrase",
    prompt: "도와주세요",
    answer: "도와주세요",
    roman: "dowajuseyo",
    meaning: "助けてください",
    keys: ["E", "H", "D", "H", "K", "W", "N", "T", "P", "D", "Y"]
  },
  {
    type: "phrase",
    prompt: "잘 모르겠어요",
    answer: "잘 모르겠어요",
    roman: "jal moreugesseoyo",
    meaning: "よくわかりません",
    keys: ["W", "K", "F", "Space", "A", "H", "F", "M", "R", "P", "T", "T", "D", "J", "D", "Y"]
  },
  {
    type: "phrase",
    prompt: "한국어 못해요",
    answer: "한국어 못해요",
    roman: "hangugeo mothaeyo",
    meaning: "韓国語はできません",
    keys: ["G", "K", "S", "R", "N", "R", "D", "J", "Space", "A", "H", "T", "G", "O", "D", "Y"]
  },
  {
    type: "phrase",
    prompt: "일본어 돼요",
    answer: "일본어 돼요",
    roman: "ilboneo dwaeyo",
    meaning: "日本語は通じますか / 日本語できますか",
    keys: ["D", "L", "F", "Q", "H", "S", "D", "J", "Space", "E", "H", "O", "D", "Y"]
  },
  {
    type: "phrase",
    prompt: "다시 말해 주세요",
    answer: "다시 말해 주세요",
    roman: "dasi malhae juseyo",
    meaning: "もう一度言ってください",
    keys: ["E", "K", "T", "L", "Space", "A", "K", "F", "G", "O", "Space", "W", "N", "T", "P", "D", "Y"]
  },
  {
    type: "phrase",
    prompt: "천천히 말해 주세요",
    answer: "천천히 말해 주세요",
    roman: "cheoncheonhi malhae juseyo",
    meaning: "ゆっくり話してください",
    keys: ["C", "J", "S", "C", "J", "S", "G", "L", "Space", "A", "K", "F", "G", "O", "Space", "W", "N", "T", "P", "D", "Y"]
  }
];
