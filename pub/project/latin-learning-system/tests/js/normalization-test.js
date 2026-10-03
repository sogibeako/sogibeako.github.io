"use strict";
const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..", "..");
require(path.join(root, "drills", "src", "normalization.js"));
const profileData = JSON.parse(fs.readFileSync(path.join(root, "standards", "normalization-profiles.json"), "utf8"));
const vectors = JSON.parse(fs.readFileSync(path.join(root, "tests", "normalization-vectors.json"), "utf8"));
const profiles = Object.fromEntries(profileData.profiles.map((p) => [p.id, p]));
let failed = 0;
for (const vector of vectors.cases) {
  const actual = DrillNormalizer.comparisonKey(vector.input, profiles[vector.profile]);
  const expected = typeof vector.expected === "string" ? vector.expected : JSON.stringify(Object.fromEntries(Object.entries(vector.expected).sort()));
  if (actual !== expected) { console.error(`JS_NORMALIZATION_MISMATCH ${vector.id}: ${actual} != ${expected}`); failed += 1; }
}
for (const vector of vectors.inequality_cases) {
  const left = DrillNormalizer.comparisonKey(vector.left, profiles[vector.profile]);
  const right = DrillNormalizer.comparisonKey(vector.right, profiles[vector.profile]);
  if (left === right) { console.error(`JS_NORMALIZATION_FALSE_EQUAL ${vector.id}`); failed += 1; }
}
if (failed) process.exit(1);
console.log(`JavaScript normalization: ${vectors.cases.length + vectors.inequality_cases.length} vectors passed.`);
