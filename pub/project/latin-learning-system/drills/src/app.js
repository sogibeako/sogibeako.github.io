(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const readEmbedded = (id) => JSON.parse($(id).textContent);
  const memory = new Map();
  let storageKey = "latin-learning-system:m4-demo:v1";
  let storageMode = "localStorage";
  let data, profiles, state;

  function storage() {
    const forced = new URLSearchParams(location.search).get("storage") === "fail";
    try {
      if (forced) throw new Error("forced test failure");
      const probe = storageKey + ":probe";
      localStorage.setItem(probe, "1"); localStorage.removeItem(probe);
      return {get:(k) => localStorage.getItem(k), set:(k,v) => localStorage.setItem(k,v), remove:(k) => localStorage.removeItem(k)};
    } catch (_) {
      storageMode = "memory";
      return {get:(k) => memory.get(k) || null, set:(k,v) => memory.set(k,v), remove:(k) => memory.delete(k)};
    }
  }
  const store = storage();

  function defaultState() { return {schema_version:data.schema_version, content_version:data.content_version, unit_id:data.units[0].id, index:0, correct:0, answered:false}; }
  function loadState() {
    try {
      const saved = JSON.parse(store.get(storageKey));
      if (!saved || saved.schema_version !== data.schema_version || saved.content_version !== data.content_version || !data.units.some((u) => u.id === saved.unit_id)) return defaultState();
      return Object.assign(defaultState(), saved);
    } catch (_) { store.remove(storageKey); return defaultState(); }
  }
  function save() { try { store.set(storageKey, JSON.stringify(state)); } catch (_) { storageMode = "memory"; memory.set(storageKey, JSON.stringify(state)); updateStorageStatus(); } }
  function updateStorageStatus() { $("storage-status").textContent = storageMode === "memory" ? "端末保存を利用できないため、この画面を閉じるまでメモリに保持します。" : "進捗はこの端末内に保存されます。"; }
  function unit() { return data.units.find((u) => u.id === state.unit_id); }
  function question() { return unit().questions[state.index]; }

  function addText(parent, tag, text, attrs) {
    const node = document.createElement(tag); node.textContent = text;
    Object.entries(attrs || {}).forEach(([key,value]) => node.setAttribute(key,value)); parent.appendChild(node); return node;
  }
  function renderControls(q) {
    const host = $("answer-controls"); host.replaceChildren();
    if (q.type === "selected-response") {
      q.choices.forEach((choice) => {
        const row = addText(host,"div",""); const input=document.createElement("input"); input.type="radio"; input.name="answer"; input.id="choice-"+choice.id; input.value=choice.id; row.appendChild(input); addText(row,"label",choice.text,{for:input.id});
      });
    } else if (q.type === "short-input") {
      addText(host,"label","回答",{for:"short-answer"}); const input=document.createElement("input"); input.id="short-answer"; input.name="answer"; input.autocomplete="off"; host.appendChild(input);
    } else if (q.type === "feature-identification") {
      q.fields.forEach((field) => { const label=addText(host,"label",field.label,{for:"field-"+field.id}); const select=document.createElement("select"); select.id="field-"+field.id; select.name=field.id; field.options.forEach((option) => addText(select,"option",option,{value:option})); host.append(label,select); });
    } else if (q.type === "self-assessed-pronunciation") {
      (q.checklist || []).forEach((item,index) => { const row=addText(host,"div",""); const input=document.createElement("input"); input.type="checkbox"; input.id="self-check-"+index; input.name="self-check"; row.appendChild(input); addText(row,"label",item,{for:input.id}); });
      addText(host,"p",q.model_note || "音声による自動判定は行いません。",{"class":"self-note"});
    } else throw new Error("未対応の問題形式: " + q.type);
  }
  function render(focus) {
    const q=question(); $("prompt").textContent=q.prompt; $("result").textContent=""; $("result").className="result"; $("retry-button").hidden=true; $("next-button").hidden=true; $("submit-button").disabled=false; renderControls(q);
    $("progress").textContent=`${state.index+1} / ${unit().questions.length} 問（正答 ${state.correct}）`;
    if (focus) $("question-heading").focus();
  }
  function answerValue(q) {
    if (q.type === "selected-response") { const checked=document.querySelector('input[name="answer"]:checked'); return checked ? checked.value : null; }
    if (q.type === "short-input") return $("short-answer").value;
    if (q.type === "feature-identification") return Object.fromEntries(q.fields.map((field) => [field.id,$("field-"+field.id).value]));
    if (q.type === "self-assessed-pronunciation") return Array.from(document.querySelectorAll('input[name="self-check"]')).every((input)=>input.checked) ? "self-checked" : null;
    throw new Error("未対応の問題形式: " + q.type);
  }
  function submit(event) {
    event.preventDefault(); if (state.answered) return;
    const q=question(), answer=answerValue(q); if (answer === null || answer === "") { $("result").textContent="回答を入力してください。"; return; }
    const selfAssessed=q.type === "self-assessed-pronunciation"; const profile=profiles[q.normalization_profile_id]; const key=selfAssessed ? "self-checked" : DrillNormalizer.comparisonKey(answer,profile); const accepted=selfAssessed ? ["self-checked"] : q.accepted_answers.map((x)=>DrillNormalizer.comparisonKey(x,profile)); const correct=accepted.includes(key);
    state.answered=true; if(correct && !selfAssessed) state.correct += 1; save();
    $("result").textContent=selfAssessed ? "自己確認を記録しました。 "+q.feedback.correct : (correct ? "正解です。 " : "不正解です。 ") + (correct ? q.feedback.correct : q.feedback.incorrect); $("result").className="result "+(selfAssessed?"is-self-assessed":correct?"is-correct":"is-incorrect");
    $("submit-button").disabled=true; $("retry-button").hidden=correct; $("next-button").hidden=false; $("progress").textContent=`${state.index+1} / ${unit().questions.length} 問（正答 ${state.correct}）`; $("result").focus();
  }
  function retry() { state.answered=false; save(); render(true); }
  function next() { state.index=(state.index+1)%unit().questions.length; state.answered=false; save(); render(true); }
  function resetAsk() { $("reset-confirmation").hidden=false; $("reset-confirm-button").focus(); }
  function resetCancel() { $("reset-confirmation").hidden=true; $("reset-button").focus(); }
  function resetConfirm() { store.remove(storageKey); memory.delete(storageKey); state=defaultState(); $("unit-select").value=state.unit_id; $("reset-confirmation").hidden=true; render(true); }
  function runVectors(vectors) {
    const failures=[];
    vectors.cases.forEach((v)=>{ const actual=DrillNormalizer.comparisonKey(v.input,profiles[v.profile]); const expected=typeof v.expected === "string" ? v.expected : JSON.stringify(Object.fromEntries(Object.entries(v.expected).sort())); if(actual!==expected) failures.push(v.id); });
    vectors.inequality_cases.forEach((v)=>{ if(DrillNormalizer.comparisonKey(v.left,profiles[v.profile])===DrillNormalizer.comparisonKey(v.right,profiles[v.profile])) failures.push(v.id); });
    return failures;
  }
  function fatal(error) { $("question-panel").hidden=true; $("fatal-error").hidden=false; $("fatal-message").textContent="安全のため動作を停止しました: "+error.message; }
  try {
    data=readEmbedded("drill-data"); const profileData=readEmbedded("normalization-profiles"); profiles=Object.fromEntries(profileData.profiles.map((p)=>[p.id,p])); const vectors=readEmbedded("normalization-vectors");
    if(!Array.isArray(data.units) || !data.units.length) throw new Error("ドリルデータの形式が不正です");
    storageKey=data.storage_key || storageKey; $("demo-notice").textContent=data.notice; data.units.forEach((u)=>addText($("unit-select"),"option",u.title,{value:u.id})); state=loadState(); $("unit-select").value=state.unit_id; updateStorageStatus();
    $("unit-select").addEventListener("change",(e)=>{ state=defaultState(); state.unit_id=e.target.value; save(); render(true); }); $("answer-form").addEventListener("submit",submit); $("retry-button").addEventListener("click",retry); $("next-button").addEventListener("click",next); $("reset-button").addEventListener("click",resetAsk); $("reset-confirm-button").addEventListener("click",resetConfirm); $("reset-cancel-button").addEventListener("click",resetCancel);
    const vectorFailures=runVectors(vectors); const testApi={ready:true,normalizationFailures:vectorFailures,storageMode:()=>storageMode,state:()=>({...state})}; globalThis.__M4_TEST__=testApi; globalThis.__M5_TEST__=testApi; if(vectorFailures.length) throw new Error("JavaScript正規化fixtureが不一致です: "+vectorFailures.join(", ")); render(false);
  } catch (error) { console.error(error); globalThis.__M4_TEST__={ready:false,error:String(error)}; fatal(error); }
}());
