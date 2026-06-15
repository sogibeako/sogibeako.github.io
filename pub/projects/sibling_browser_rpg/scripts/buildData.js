const fs = require('fs');
const path = require('path');

// 読み込み元と出力先のパス
const SRC_DIR = path.join(__dirname, '../data_src');
const OUT_DIR = path.join(__dirname, '../data');

// 簡易CSVパーサー（ダブルクォートで囲まれたカンマに対応し、数値や真偽値を自動変換）
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1).map(line => {
    let inQuotes = false;
    let currentStr = "";
    let cols = [];
    
    // 1文字ずつ読んでカンマとクォートを解析
    for (let i = 0; i < line.length; i++) {
        let char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            cols.push(currentStr);
            currentStr = "";
        } else {
            currentStr += char;
        }
    }
    cols.push(currentStr); // 最後の列を追加

    const row = {};
    headers.forEach((h, i) => {
      let val = cols[i] !== undefined ? cols[i].trim() : "";
      
      // 自動型変換: 数値化できるものは数値に、"true"/"false" は真偽値に
      if (val !== "" && !isNaN(Number(val))) {
        val = Number(val);
      } else if (val.toLowerCase() === "true") {
        val = true;
      } else if (val.toLowerCase() === "false") {
        val = false;
      }
      
      // tags のようなカンマ区切りの文字列は配列にしておくと便利
      // （※このスクリプトでは汎用的に全て処理していますが、本来は列名で判定するのがより安全です）
      if (typeof val === 'string' && val.includes(',') && !h.includes('note')) {
         // ダブルクォート内から取り出したカンマ区切りを配列にする
         // val = val.split(',').map(s => s.trim());
      }
      
      row[h] = val;
    });
    return row;
  });
}

function build() {
    console.log("=== データのビルドを開始します ===");
    
    // 出力先フォルダがなければ作成
    if (!fs.existsSync(OUT_DIR)) {
        fs.mkdirSync(OUT_DIR, { recursive: true });
    }

    const gameData = {};
    const files = fs.readdirSync(SRC_DIR).filter(file => file.endsWith('.csv'));

    for (const file of files) {
        const filePath = path.join(SRC_DIR, file);
        const text = fs.readFileSync(filePath, 'utf8');
        const tableName = file.replace('.csv', '');
        
        try {
            const parsedArray = parseCSV(text);
            
            // 例外その1: id や xxxxId がある場合、配列ではなくIDをキーにしたオブジェクト(Map)に変換すると使いやすい
            // （ここではシンプルに変換しています）
            let dataObject = {};
            let useArray = false;
            
            // ルール系の表（同じIDが複数回登場するもの）は配列配列のままか、MonsterId等でグループ化する
            if (tableName === 'monster_action_rules' || tableName === 'skill_sets') {
                useArray = true; 
            }
            
            if (useArray) {
                gameData[tableName] = parsedArray;
            } else {
                // 先頭の列名が 'id' など固有キーっぽければObjectマップにする
                const firstKey = Object.keys(parsedArray[0] || {})[0];
                parsedArray.forEach(row => {
                   if (row[firstKey]) {
                       dataObject[row[firstKey]] = row;
                   }
                });
                gameData[tableName] = dataObject;
            }
            
            console.log(`[OK] ${file} -> ${parsedArray.length}行 読み込み完了`);
        } catch(e) {
            console.error(`[Error] ${file} の解析中にエラーが発生しました:`, e);
        }
    }

    // 1つの大きなJSONファイルとして出力
    const outPath = path.join(OUT_DIR, 'gameData.json');
    fs.writeFileSync(outPath, JSON.stringify(gameData, null, 2), 'utf8');
    
    console.log("=== ビルド完了: data/gameData.json を出力しました ===");
    console.log("このJSONを fetch('data/gameData.json') などでゲームから読み込むことができます！");
}

build();
