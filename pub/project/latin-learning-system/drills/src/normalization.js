(function (global) {
  "use strict";
  function foldMacrons(value) {
    return value.normalize("NFD").replace(/\u0304/g, "").normalize("NFC");
  }
  function removePunctuation(value) {
    try { return value.replace(/\p{P}/gu, ""); }
    catch (_) { return value.replace(/[.,!?;:'"()\[\]{}\-]/g, ""); }
  }
  function structured(value) {
    if (Array.isArray(value)) return value.map(structured);
    if (value && typeof value === "object") {
      const result = {};
      Object.keys(value).sort().forEach((key) => { result[key] = structured(value[key]); });
      return result;
    }
    if (typeof value === "string") return value.normalize("NFC").trim().toLocaleLowerCase("und");
    return value;
  }
  function normalize(value, profile) {
    if (!profile) throw new Error("Unknown normalization profile");
    if (profile.input_kind === "structured") {
      if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("structured-features requires an object");
      return structured(value);
    }
    if (typeof value !== "string") throw new Error(profile.id + " requires text");
    let result = value;
    profile.ordered_steps.forEach((step) => {
      if (step === "unicode-nfc") result = result.normalize("NFC");
      else if (step === "trim-outer-space") result = result.trim();
      else if (step === "collapse-space") result = result.replace(/\s+/gu, " ");
      else if (step === "case-fold") result = result.toLocaleLowerCase("und");
      else if (step === "filter-nonscored-punctuation") result = removePunctuation(result);
      else if (step === "fold-macrons") result = foldMacrons(result);
      else if (step === "fold-i-j") result = result.replace(/j/g, "i").replace(/J/g, "I");
      else if (step === "fold-u-v") result = result.replace(/v/g, "u").replace(/V/g, "U");
      else if (step !== "preserve-macrons" && step !== "preserve-endings") throw new Error("Unsupported normalization step: " + step);
    });
    return result;
  }
  function comparisonKey(value, profile) {
    const result = normalize(value, profile);
    return typeof result === "string" ? result : JSON.stringify(result);
  }
  global.DrillNormalizer = { normalize, comparisonKey };
}(globalThis));
