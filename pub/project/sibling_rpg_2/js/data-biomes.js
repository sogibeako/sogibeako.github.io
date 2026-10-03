const DIFFICULTY_PRESETS = [
      { id: "picnic", label: "遠足", icon: "🌼", center: 3, spread: 2, desc: "平和なお散歩" },
      { id: "quest", label: "冒険", icon: "⚔️", center: 30, spread: 8, desc: "本格的な冒険" },
      { id: "peril", label: "死線", icon: "💀", center: 75, spread: 14, desc: "生還は保証されない" }
    ];

// ─── DATA: BASE BIOMES ─────────────────────────────────────────────
    const BIOMES = [
      { id: "grassland", name: "草原", icon: "🌾" },
      { id: "road", name: "街道", icon: "🛤️" },
      { id: "coast", name: "海岸", icon: "🏖️" },
      { id: "volcano", name: "火山", icon: "🌋" },
      { id: "desert", name: "砂漠", icon: "🏜️" },
      { id: "ice", name: "氷原", icon: "❄️" },
      { id: "ocean", name: "海洋", icon: "🌊" },
      { id: "forest", name: "深森", icon: "🌲" },
      { id: "swamp", name: "沼地", icon: "🐸" },
      { id: "mountain", name: "山岳", icon: "⛰️" },
      { id: "canyon", name: "峡谷", icon: "🏜️" },
      { id: "cave", name: "洞窟", icon: "🕳️" },
      { id: "ruins", name: "遺跡", icon: "🏛️" },
      { id: "sky", name: "天空", icon: "☁️" },
      { id: "abyss", name: "深淵", icon: "🕳️" },
      { id: "crystal", name: "水晶地帯", icon: "💎" },
      { id: "fungus", name: "菌糸原野", icon: "🍄" },
      { id: "void", name: "虚無", icon: "⬛" },
      { id: "cosmos", name: "宇宙", icon: "🌌" },
      { id: "garden", name: "庭園", icon: "🌸" },
      { id: "undergroundLake", name: "地底湖", icon: "🚣" },
      { id: "cyber", name: "電子領域", icon: "💾" }
    ];

    const getLevelTier = (lv) => {
      if (lv <= 5) return { tier: "peaceful", label: "穏やかな", desc: "幼い女の子でも安心して歩ける" };
      if (lv <= 15) return { tier: "easy", label: "のどかな", desc: "旅商人が行き交う" };
      if (lv <= 30) return { tier: "moderate", label: "険しい", desc: "熟練冒険者向けの" };
      if (lv <= 50) return { tier: "hard", label: "危険な", desc: "歴戦の戦士でも油断できない" };
      if (lv <= 70) return { tier: "extreme", label: "禁忌の", desc: "古龍が徘徊する" };
      if (lv <= 100) return { tier: "mythic", label: "神域の", desc: "神話に語られる" };
      if (lv <= 150) return { tier: "transcendent", label: "超越した", desc: "存在そのものが歪む" };
      return { tier: "incomprehensible", label: "理解不能の", desc: "認識することすら許されない" };
    };