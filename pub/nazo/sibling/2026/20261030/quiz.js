"use strict";

// The article is complete without JavaScript; these two experiments are optional.
(() => {
    const datasets = {
        basis: ["1000", "0100", "0010", "0001"],
        balanced: ["1100", "1010", "0101", "0011"],
        biased: ["1100", "1010", "1001", "0110"],
        "with-f": ["1000", "0100", "0010", "0001", "1010"]
    };
    const distance = (a, b) => [...a].reduce((sum, bit, i) => sum + Number(bit !== b[i]), 0);
    const dataset = document.getElementById("dataset");
    const medianResult = document.getElementById("median-result");
    function showMedian() {
        const points = datasets[dataset.value];
        const candidates = Array.from({ length: 16 }, (_, i) => {
            const bits = i.toString(2).padStart(4, "0");
            return { bits, sum: points.reduce((sum, p) => sum + distance(bits, p), 0) };
        });
        const minimum = Math.min(...candidates.map(p => p.sum));
        const medians = candidates.filter(p => p.sum === minimum);
        medianResult.replaceChildren();
        const result = document.createElement("p");
        result.className = "result";
        result.textContent = `距離の合計の最小値：${minimum} ／ 中央値：${medians.length}個`;
        medianResult.append(result);
        const list = document.createElement("p");
        medians.forEach(({ bits }) => {
            const tag = document.createElement("span");
            tag.className = "bit";
            tag.textContent = bits;
            list.append(tag, " ");
        });
        medianResult.append(list);
    }
    if (dataset && medianResult && document.getElementById("median-experiment")) {
        dataset.addEventListener("change", showMedian);
        showMedian();
        document.getElementById("median-experiment").hidden = false;
    }

    const pair = document.getElementById("column-pair");
    const pairResult = document.getElementById("pair-result");
    const matrix = document.getElementById("oa-table");
    const rows = matrix ? [...matrix.tBodies[0].rows].map(row => [...row.cells].slice(1).map(cell => Number(cell.textContent))) : [];
    function showPair() {
        const [a, b] = pair.value.split(",").map(Number);
        const counts = Array.from({ length: 3 }, () => Array(3).fill(0));
        rows.forEach(row => counts[row[a]][row[b]]++);
        [...matrix.rows].forEach(row => [...row.cells].forEach((cell, i) => {
            cell.classList.toggle("selected", i === a + 1 || i === b + 1);
        }));
        const table = document.createElement("table");
        table.className = "matrix";
        const caption = table.createCaption();
        caption.textContent = `列${a + 1}の値（縦）× 列${b + 1}の値（横）：各組の出現回数`;
        const head = table.createTHead().insertRow();
        ["値", "0", "1", "2"].forEach(label => {
            const th = document.createElement("th");
            th.scope = "col";
            th.textContent = label;
            head.append(th);
        });
        const body = table.createTBody();
        counts.forEach((values, i) => {
            const row = body.insertRow();
            const th = document.createElement("th");
            th.scope = "row";
            th.textContent = String(i);
            row.append(th);
            values.forEach(count => { row.insertCell().textContent = String(count); });
        });
        const status = document.createElement("p");
        status.className = "result";
        status.textContent = counts.flat().every(count => count === 1) ? "全9通りが1回ずつ出現します。" : "出現回数に偏りがあります。";
        pairResult.replaceChildren(table, status);
    }
    if (pair && pairResult && matrix && document.getElementById("oa-experiment")) {
        pair.addEventListener("change", showPair);
        showPair();
        document.getElementById("oa-experiment").hidden = false;
    }
})();

// 20261030: Apply the manuscript's classification to explicitly specified tails.
// This neither decides an unknown infinite word nor computes ordinal magnitudes.
(() => {
    const prefixInput = document.getElementById("source-prefix");
    const tailInput = document.getElementById("source-tail");
    const spectrumResult = document.getElementById("spectrum-result");
    const fiberInput = document.getElementById("fiber-j");
    const fiberResult = document.getElementById("fiber-result");
    const subscript = value => String(value).replace(/\d/g, digit => "₀₁₂₃₄₅₆₇₈₉"[Number(digit)]);
    const addParagraph = (parent, content, className = "") => {
        const p = document.createElement("p");
        p.textContent = content;
        if (className) p.className = className;
        parent.append(p);
    };

    function showSpectrum() {
        const prefix = prefixInput.value.replace(/\s/g, "").replace(/＋/g, "+").replace(/[−－]/g, "-");
        spectrumResult.replaceChildren();
        if (!/^[+-]*$/.test(prefix) || prefix.length > 24) {
            prefixInput.setAttribute("aria-invalid", "true");
            addParagraph(spectrumResult, "＋と−だけを、24文字以内で入力してください。空欄も使えます。", "result");
            return;
        }
        prefixInput.removeAttribute("aria-invalid");
        const tail = tailInput.value;
        const forSign = sign => {
            if (tail === "alternating" || (tail === "plus" && sign === "+") || (tail === "minus" && sign === "-")) {
                return { value: "Λ", reason: `${sign === "+" ? "＋" : "−"}が無限回現れる` };
            }
            const last = prefix.lastIndexOf(sign);
            if (last >= 0) return { value: `E${subscript(last)}`, reason: `最後の${sign === "+" ? "＋" : "−"}は位置${last}（${last + 1}文字目）` };
            return { value: sign === "+" ? "ωᴸ" : "L", reason: `${sign === "+" ? "＋" : "−"}が一度も現れない` };
        };
        const right = forSign("+");
        const left = forSign("-");
        const suffix = tail === "alternating" ? "(＋−)を無限反復" : `${tail === "plus" ? "＋" : "−"}を無限反復`;
        addParagraph(spectrumResult, `source：${prefix ? [...prefix].map(c => c === "+" ? "＋" : "−").join("") : "（空の先頭）"} ｜ ${suffix}`);
        addParagraph(spectrumResult, `F(s) ＝ (${right.value}, ${left.value})`, "result");
        addParagraph(spectrumResult, `右：${right.reason}。左：${left.reason}。`);
        addParagraph(spectrumResult, `birthday：Rₛ(−1) は ${left.value}、Rₛ(0) は q、Rₛ(1) は ${right.value}。`);
        addParagraph(spectrumResult, tail === "alternating" ? "このsourceではFは連続です。" : "このsourceではFは不連続です。", "result");
    }

    function showFiber() {
        const j = Number(fiberInput.value);
        if (!Number.isInteger(j) || j < 0 || j > 5) return;
        fiberResult.replaceChildren();
        addParagraph(fiberResult, `F(s) ＝ (Λ, E${subscript(j)}) のファイバー：2^${j} ＝ ${2 ** j} 通り`, "result");
        addParagraph(fiberResult, `先頭${j}文字は自由。位置${j}を−にし、それ以降はすべて＋にします。`);
        const list = document.createElement("ul");
        list.className = "fiber-list";
        for (let i = 0; i < 2 ** j; i++) {
            const prefix = j === 0 ? "" : i.toString(2).padStart(j, "0").replace(/0/g, "−").replace(/1/g, "＋");
            const item = document.createElement("li");
            const code = document.createElement("code");
            code.textContent = `${prefix || "（空）"} ｜ − ｜ ＋＋＋…`;
            item.append(code);
            list.append(item);
        }
        fiberResult.append(list);
    }

    if (prefixInput && tailInput && spectrumResult) {
        prefixInput.addEventListener("input", showSpectrum);
        tailInput.addEventListener("change", showSpectrum);
        showSpectrum();
        document.getElementById("spectrum-experiment").hidden = false;
    }
    if (fiberInput && fiberResult) {
        fiberInput.addEventListener("change", showFiber);
        showFiber();
        document.getElementById("fiber-experiment").hidden = false;
    }
})();
