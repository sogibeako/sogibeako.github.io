// ui.js - DOM 操作および各モジュール結合

window.JI_UI = {
    currentList: [],
    lastExtractedPoints: [],
    
    log: function(msg, type="normal") {
        let cons = document.getElementById("console_output");
        let d = new Date();
        let time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
        let line = document.createElement("div");
        line.className = `log-${type}`;
        line.textContent = `[${time}] [${type.toUpperCase()}] ${msg}`;
        cons.appendChild(line);
        cons.scrollTop = cons.scrollHeight;
    },
    
    init: function() {
        this.log("JI Explorer initialized.", "info");
    },
    
    getLimitLength: function() {
        let val = document.getElementById("prime_limit").value;
        return window.JI_MONZO.getPrimeLimitLength(val);
    }
};

function ui_analyzeAndSort(mode) {
    let text = document.getElementById("input_intervals").value;
    let limitLength = window.JI_UI.getLimitLength();
    
    let parseRes = window.JI_PARSER.parseInput(text, limitLength);
    for(let e of parseRes.errors) {
        window.JI_UI.log(e, "error");
    }
    
    if(parseRes.list.length === 0) {
        window.JI_UI.log("有効な音程がありません。", "warn");
        return;
    }
    
    let sorted;
    if(mode === 'raw') {
        sorted = window.JI_SORT.sortByRaw(parseRes.list);
        window.JI_UI.log(`生比で ${sorted.length} 音をソートしました。`, "info");
    } else {
        sorted = window.JI_SORT.sortByNormalized(parseRes.list);
        window.JI_UI.log(`正規化比で ${sorted.length} 音をソートしました。`, "info");
    }
    
    window.JI_UI.currentList = sorted;
    
    let tbody = document.querySelector("#result_table tbody");
    tbody.innerHTML = "";
    for(let item of sorted) {
        let tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${item.sourceText}</td>
            <td>${item.normalizedText}</td>
            <td>${window.JI_MONZO.monzoToString(item.monzo)}</td>
            <td>[${item.reducedMonzo.join(" ")}]</td>
            <td>${item.normalizedCents.toFixed(3)}</td>
        `;
        tbody.appendChild(tr);
    }
    
    document.getElementById("section_table").classList.add("visible");
    ui_showReduced();
}

function ui_showReduced() {
    let list = window.JI_UI.currentList;
    if(!list || list.length === 0) return;
    
    let canvas = document.getElementById("plot_canvas");
    let ctx = canvas.getContext("2d");
    ctx.clearRect(0,0,canvas.width, canvas.height);
    
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.beginPath();
    ctx.moveTo(0, canvas.height/2); ctx.lineTo(canvas.width, canvas.height/2);
    ctx.moveTo(canvas.width/2, 0); ctx.lineTo(canvas.width/2, canvas.height);
    ctx.stroke();
    
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText("x: 3-limit (axis 0 of reduced)", 10, canvas.height/2 - 5);
    ctx.fillText("y: 5-limit (axis 1 of reduced)", canvas.width/2 + 5, 20);
    
    let scale = 30; // 1 unit = 30px
    let cx = canvas.width/2;
    let cy = canvas.height/2;
    
    for(let item of list) {
        let rx = item.reducedMonzo[0] || 0;
        let ry = (item.reducedMonzo.length > 1) ? item.reducedMonzo[1] : 0;
        
        let px = cx + rx * scale;
        let py = cy - ry * scale;
        
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI*2);
        ctx.fillStyle = "#60a5fa";
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.fillStyle = "#e2e8f0";
        ctx.font = "11px monospace";
        ctx.fillText(item.sourceText, px+8, py-8);
    }
    
    document.getElementById("section_canvas").classList.add("visible");
    window.JI_UI.log("Reduced空間(2D)の描画を更新しました。", "info");
}

function ui_extractConvex() {
    let text = document.getElementById("input_convex").value;
    let limitLength = window.JI_UI.getLimitLength();
    let parseRes = window.JI_PARSER.parseInput(text, limitLength);
    
    for(let e of parseRes.errors) { window.JI_UI.log(e, "error"); }
    
    let endpoints = parseRes.list;
    if(endpoints.length < 2) {
        window.JI_UI.log("端点が2点以上必要です。", "error");
        return;
    }
    
    let convexRes = window.JI_CONVEX.extractLatticePoints(endpoints);
    for(let info of convexRes.info) { window.JI_UI.log(info, "info"); }
    
    if(convexRes.error) {
        window.JI_UI.log(convexRes.error, "error");
        return;
    }
    
    let points = convexRes.points;
    window.JI_UI.log(`領域内から ${points.length} 個の格子点を抽出しました。`, "success");
    
    window.JI_UI.lastExtractedPoints = points;
}

function ui_addConvexToInput() {
    if(!window.JI_UI.lastExtractedPoints || window.JI_UI.lastExtractedPoints.length === 0) {
        window.JI_UI.log("先に内部格子点を抽出してください。", "warn");
        return;
    }
    
    let doNormalize = document.getElementById("octave_normalize").checked;
    let limitLength = window.JI_UI.getLimitLength();
    
    let addedCount = 0;
    for(let pt of window.JI_UI.lastExtractedPoints) {
        let monzo = window.JI_MONZO.reducedToMonzo(pt, limitLength);
        
        let mStr = "";
        if(doNormalize) {
            let nRes = window.JI_NORMALIZE.normalizeMonzo(monzo);
            mStr = window.JI_MONZO.monzoToString(nRes.monzo);
        } else {
            mStr = window.JI_MONZO.monzoToString(monzo);
        }
        
        let val = document.getElementById("input_intervals").value;
        if(val && !val.endsWith("\n")) val += "\n";
        document.getElementById("input_intervals").value = val + mStr;
        addedCount++;
    }
    
    window.JI_UI.log(`入力欄の末尾に ${addedCount} 個の音程を追加しました。`, "success");
}

function ui_generateScaleWord() {
    let list = window.JI_UI.currentList;
    if(!list || list.length < 2) {
        window.JI_UI.log("音階語を生成するには、2音以上の解析済み音程が必要です。", "warn");
        return;
    }
    
    let tol = parseFloat(document.getElementById("step_tolerance").value) || 0.01;
    let autoClose = document.getElementById("auto_close_octave").checked;
    
    let res = window.JI_SCALEWORD.generateScaleWord(list, tol, autoClose);
    if(!res) return;
    
    document.getElementById("out_scaleword").textContent = res.word;
    
    let tbody = document.querySelector("#step_table tbody");
    tbody.innerHTML = "";
    for(let g of res.groups) {
        let tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong style="color:var(--accent-hover); font-size:1.1rem;">${g.symbol}</strong></td>
            <td>${g.ratioText}</td>
            <td>${g.cents.toFixed(3)}</td>
            <td>${g.count} 回</td>
        `;
        tbody.appendChild(tr);
    }
    
    document.getElementById("section_scaleword").classList.add("visible");
    window.JI_UI.log(`音階語生成完了。 ${res.groups.length} 種のステップを抽出しました。`, "success");
}

window.addEventListener('DOMContentLoaded', () => { window.JI_UI.init(); });
