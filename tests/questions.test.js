// 생성: 2026-10-06 16:03 KST
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadApp, plain } = require("./load.js");

const app = loadApp();
const CATEGORIES = app("CATEGORIES");
const QUESTIONS = app("QUESTIONS");

test("CATEGORIES는 PRD의 순서대로 4개다", () => {
  assert.deepEqual(plain(CATEGORIES), ["한국사", "세계지리", "과학", "예술과 문화"]);
});

test("40문항이 PRD 6.1 규칙에 맞는다", () => {
  assert.deepEqual(plain(app("validateQuestions")(CATEGORIES, QUESTIONS)), []);
});

test("해설은 한 줄이다", () => {
  for (const q of QUESTIONS) assert.ok(!/\n/.test(q.explanation), q.id);
});

test("'가장'을 쓴 문제는 기준을 적는다(PRD 6.2 규칙 3)", () => {
  for (const q of QUESTIONS) {
    if (q.question.includes("가장")) assert.match(q.question, /기준/, q.id);
  }
});

test("id 번호는 카테고리마다 01~10이다", () => {
  for (const prefix of ["history", "geography", "science", "arts"]) {
    const numbers = QUESTIONS.filter((q) => q.id.startsWith(`${prefix}-`)).map((q) => q.id.slice(-2)).sort();
    assert.deepEqual(plain(numbers), ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"], prefix);
  }
});
