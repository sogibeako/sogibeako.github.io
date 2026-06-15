// watch-artists.js
// Node.js 18+ 想定
// 使い方: node watch-artists.js
//
// 目的:
// - Danbooru / e621 の artist 関連URLを複数登録
// - URLから artist 名やIDをなるべく抽出
// - 投稿の新着を監視
// - seen.json に前回状態を保存
//
// 注意:
// - e621 は説明的な User-Agent を付けること
// - URL形式は揺れるので、100%万能ではありません
// - artistページそのものの更新ではなく、主に「そのアーティスト関連の新着投稿」を追う設計です

const fs = require("fs");
const path = require("path");

const STORE_PATH = path.join(__dirname, "seen.json");
const FEED_JSON_PATH = path.join(__dirname, "feed.json");

const CONFIG = {
  intervalMs: 5 * 60 * 1000,
  maxPostsPerTarget: 20,

  // ここに artist ページURLや検索URLを並べる
  artistUrls: [
    // Danbooru 例
    // "https://danbooru.donmai.us/artists/12345",
    // "https://danbooru.donmai.us/artists?search[name]=some_artist",
    // "https://danbooru.donmai.us/posts?tags=some_artist",

    // e621 例
    // "https://e621.net/artists/67890",
    // "https://e621.net/posts?tags=some_artist",
    "https://e621.net/posts?tags=devil-vox",
  ],

  // e621 の User-Agent は説明的に
  userAgent: "KazuWatcher/1.0 (personal watcher; contact yourself@example.com)",
};

function loadJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function saveJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizeArtistTag(tag) {
  return String(tag || "")
    .trim()
    .replace(/\s+/g, "_");
}

function unique(arr) {
  return [...new Set(arr)];
}

function parseUrl(input) {
  try {
    return new URL(input);
  } catch {
    return null;
  }
}

function detectSite(urlObj) {
  const host = urlObj.hostname.toLowerCase();
  if (host.includes("danbooru.donmai.us")) return "danbooru";
  if (host.includes("e621.net")) return "e621";
  return null;
}

function getPathSegments(urlObj) {
  return urlObj.pathname.split("/").filter(Boolean);
}

function extractTagsFromPostsUrl(urlObj) {
  const tags = urlObj.searchParams.get("tags");
  if (!tags) return [];
  return tags
    .split(/\s+/)
    .map(safeDecode)
    .map(normalizeArtistTag)
    .filter(Boolean);
}

function extractArtistCandidatesFromUrl(rawUrl) {
  const urlObj = parseUrl(rawUrl);
  if (!urlObj) {
    return {
      ok: false,
      reason: "Invalid URL",
      site: null,
      sourceUrl: rawUrl,
      candidates: [],
    };
  }

  const site = detectSite(urlObj);
  if (!site) {
    return {
      ok: false,
      reason: "Unsupported host",
      site: null,
      sourceUrl: rawUrl,
      candidates: [],
    };
  }

  const segments = getPathSegments(urlObj);
  const candidates = [];

  // 1. posts?tags=artist_name 形式
  if (segments[0] === "posts") {
    const tags = extractTagsFromPostsUrl(urlObj);
    for (const tag of tags) {
      candidates.push({
        type: "tag",
        value: tag,
        source: "posts-tags",
      });
    }
  }

  // 2. artists?search[name]=artist_name 形式
  if (segments[0] === "artists") {
    const searchName =
      urlObj.searchParams.get("search[name]") ||
      urlObj.searchParams.get("name") ||
      urlObj.searchParams.get("search") ||
      "";

    if (searchName.trim()) {
      candidates.push({
        type: "tag",
        value: normalizeArtistTag(safeDecode(searchName)),
        source: "artist-search-name",
      });
    }

    // 3. /artists/12345 形式
    if (segments[1] && /^\d+$/.test(segments[1])) {
      candidates.push({
        type: "artist_id",
        value: segments[1],
        source: "artist-id-path",
      });
    }

    // 4. /artists/some_name みたいなケースも一応拾う
    if (segments[1] && !/^\d+$/.test(segments[1])) {
      candidates.push({
        type: "tag",
        value: normalizeArtistTag(safeDecode(segments[1])),
        source: "artist-name-path",
      });
    }
  }

  // 重複除去
  const deduped = [];
  const seen = new Set();
  for (const c of candidates) {
    const key = `${c.type}:${c.value}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(c);
    }
  }

  return {
    ok: deduped.length > 0,
    reason: deduped.length > 0 ? null : "No artist candidate found in URL",
    site,
    sourceUrl: rawUrl,
    candidates: deduped,
  };
}

async function fetchJson(url, headers = {}) {
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      ...headers,
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} on ${url}`);
  }

  return res.json();
}

async function resolveDanbooruArtistIdToTag(artistId) {
  // Danbooru の artist レコードJSONを試す
  const url = `https://danbooru.donmai.us/artists/${artistId}.json`;
  const data = await fetchJson(url, {
    "User-Agent": "KazuWatcher/1.0",
  });

  // name があれば最優先
  if (data && data.name) {
    return normalizeArtistTag(data.name);
  }

  // 他の possible names
  if (data && Array.isArray(data.other_names) && data.other_names.length > 0) {
    return normalizeArtistTag(data.other_names[0]);
  }

  throw new Error(`Could not resolve Danbooru artist id ${artistId} to name`);
}

async function resolveE621ArtistIdToTag(artistId, userAgent) {
  // e621 の artist JSON を試す
  const url = `https://e621.net/artists/${artistId}.json`;
  const data = await fetchJson(url, {
    "User-Agent": userAgent,
  });

  if (data && data.name) {
    return normalizeArtistTag(data.name);
  }

  if (data && data.artist && data.artist.name) {
    return normalizeArtistTag(data.artist.name);
  }

  throw new Error(`Could not resolve e621 artist id ${artistId} to name`);
}

async function resolveCandidateToTag(site, candidate, userAgent) {
  if (candidate.type === "tag") {
    return candidate.value;
  }

  if (candidate.type === "artist_id") {
    if (site === "danbooru") {
      return await resolveDanbooruArtistIdToTag(candidate.value);
    }
    if (site === "e621") {
      return await resolveE621ArtistIdToTag(candidate.value, userAgent);
    }
  }

  throw new Error(`Unsupported candidate type: ${candidate.type}`);
}

async function fetchDanbooruPostsByTag(tag, limit) {
  const url =
    `https://danbooru.donmai.us/posts.json?tags=${encodeURIComponent(tag)}&limit=${limit}`;

  const data = await fetchJson(url, {
    "User-Agent": "KazuWatcher/1.0",
  });

  return (Array.isArray(data) ? data : []).map(post => ({
    id: post.id,
    createdAt: post.created_at,
    updatedAt: post.updated_at || post.created_at,
    url: `https://danbooru.donmai.us/posts/${post.id}`,
    site: "danbooru",
    artistTag: tag,
    title: `Danbooru: ${tag} #${post.id}`,
  }));
}

async function fetchE621PostsByTag(tag, limit, userAgent) {
  const url =
    `https://e621.net/posts.json?tags=${encodeURIComponent(tag)}&limit=${limit}`;

  const data = await fetchJson(url, {
    "User-Agent": userAgent,
  });

  const posts = Array.isArray(data?.posts) ? data.posts : [];
  return posts.map(post => ({
    id: post.id,
    createdAt: post.created_at,
    updatedAt: post.updated_at || post.created_at,
    url: `https://e621.net/posts/${post.id}`,
    site: "e621",
    artistTag: tag,
    title: `e621: ${tag} #${post.id}`,
  }));
}

async function fetchPosts(site, artistTag, limit, userAgent) {
  if (site === "danbooru") {
    return fetchDanbooruPostsByTag(artistTag, limit);
  }
  if (site === "e621") {
    return fetchE621PostsByTag(artistTag, limit, userAgent);
  }
  throw new Error(`Unsupported site: ${site}`);
}

function makeTargetKey(site, artistTag) {
  return `${site}:${artistTag}`;
}

function diffNewPosts(previousIds, posts) {
  const oldSet = new Set(previousIds);
  return posts.filter(post => !oldSet.has(post.id));
}

async function buildTargetsFromUrls(artistUrls, userAgent) {
  const targets = [];

  for (const rawUrl of artistUrls) {
    const parsed = extractArtistCandidatesFromUrl(rawUrl);

    if (!parsed.ok) {
      console.warn(`[SKIP] ${rawUrl} -> ${parsed.reason}`);
      continue;
    }

    for (const candidate of parsed.candidates) {
      try {
        const artistTag = await resolveCandidateToTag(parsed.site, candidate, userAgent);
        targets.push({
          site: parsed.site,
          artistTag,
          sourceUrl: rawUrl,
          via: candidate.source,
        });
      } catch (err) {
        console.warn(`[RESOLVE FAILED] ${rawUrl} (${candidate.type}:${candidate.value}) -> ${err.message}`);
      }
    }
  }

  // 重複除去
  const deduped = [];
  const seen = new Set();

  for (const t of targets) {
    const key = `${t.site}:${t.artistTag}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(t);
    }
  }

  return deduped;
}

function sortByCreatedAsc(posts) {
  return posts.slice().sort((a, b) => {
    const ta = new Date(a.createdAt).getTime();
    const tb = new Date(b.createdAt).getTime();
    return ta - tb;
  });
}

function updateFeedJson(feed, newPosts) {
  const combined = [...newPosts, ...feed];
  const seen = new Set();
  const result = [];

  for (const post of combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))) {
    const key = `${post.site}:${post.id}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(post);
    }
  }

  // 最新200件だけ残す
  return result.slice(0, 200);
}

async function checkAll() {
  const store = loadJson(STORE_PATH, {});
  let feed = loadJson(FEED_JSON_PATH, []);

  const targets = await buildTargetsFromUrls(CONFIG.artistUrls, CONFIG.userAgent);

  if (targets.length === 0) {
    console.log("監視対象がありません。CONFIG.artistUrls にURLを入れてください。");
    return;
  }

  console.log(`監視対象: ${targets.length}件`);
  for (const t of targets) {
    console.log(`- [${t.site}] ${t.artistTag} <- ${t.sourceUrl}`);
  }

  const allNewPosts = [];

  for (const target of targets) {
    const key = makeTargetKey(target.site, target.artistTag);
    const previousIds = store[key] || [];

    try {
      const posts = await fetchPosts(
        target.site,
        target.artistTag,
        CONFIG.maxPostsPerTarget,
        CONFIG.userAgent
      );

      const newPosts = diffNewPosts(previousIds, posts);

      if (newPosts.length > 0) {
        console.log(`\n[更新あり] ${target.site} / ${target.artistTag}`);
        for (const post of sortByCreatedAsc(newPosts)) {
          console.log(`- ${post.url}`);
        }
        allNewPosts.push(...newPosts);
      } else {
        console.log(`[変化なし] ${target.site} / ${target.artistTag}`);
      }

      store[key] = posts.map(p => p.id);
    } catch (err) {
      console.error(`[ERROR] ${target.site} / ${target.artistTag}: ${err.message}`);
    }
  }

  if (allNewPosts.length > 0) {
    feed = updateFeedJson(feed, allNewPosts);
    saveJson(FEED_JSON_PATH, feed);
  }

  saveJson(STORE_PATH, store);
}

async function start() {
  await checkAll();
  setInterval(() => {
    checkAll().catch(err => {
      console.error("Loop error:", err);
    });
  }, CONFIG.intervalMs);
}

start().catch(err => {
  console.error(err);
  process.exit(1);
});