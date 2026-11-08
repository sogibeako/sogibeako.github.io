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
    dataset.addEventListener("change", showMedian);
    showMedian();
    document.getElementById("median-experiment").hidden = false;

    const pair = document.getElementById("column-pair");
    const pairResult = document.getElementById("pair-result");
    const matrix = document.getElementById("oa-table");
    const rows = [...matrix.tBodies[0].rows].map(row => [...row.cells].slice(1).map(cell => Number(cell.textContent)));
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
    pair.addEventListener("change", showPair);
    showPair();
    document.getElementById("oa-experiment").hidden = false;
})();
