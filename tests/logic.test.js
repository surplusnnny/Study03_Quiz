// 생성: 2026-10-06 15:59 KST
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadApp, plain, makeQuestions, FIXTURE_CATEGORIES } = require("./load.js");

const app = loadApp(["script.js"]);

// ----- 1단계: 섞기와 채점 -----

test("shuffle: 원본을 바꾸지 않고 같은 원소를 돌려준다", () => {
  const shuffle = app("shuffle");
  const input = [1, 2, 3, 4, 5];
  const output = shuffle(input);
  assert.deepEqual(input, [1, 2, 3, 4, 5]);
  assert.deepEqual(plain(output).sort(), [1, 2, 3, 4, 5]);
});

test("shuffle: 난수를 고정하면 결과가 정해진다(Fisher-Yates)", () => {
  const shuffle = app("shuffle");
  assert.deepEqual(plain(shuffle([1, 2, 3, 4, 5], () => 0)), [2, 3, 4, 5, 1]);
  assert.deepEqual(plain(shuffle([1, 2, 3, 4, 5], () => 0.9999)), [1, 2, 3, 4, 5]);
});

test("shuffle: 여러 번 섞으면 순서가 달라진다", () => {
  const shuffle = app("shuffle");
  const orders = new Set();
  for (let i = 0; i < 50; i++) orders.add(shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).join(","));
  assert.ok(orders.size > 1);
});

test("questionsOf: 카테고리마다 10문항을 고른다", () => {
  const questionsOf = app("questionsOf");
  const questions = makeQuestions();
  for (const category of FIXTURE_CATEGORIES) {
    const picked = questionsOf(questions, category);
    assert.equal(picked.length, 10);
    assert.ok(picked.every((q) => q.category === category));
  }
});

test("buildRound: 같은 10문항을 섞고 각 문항의 보기도 섞는다", () => {
  const buildRound = app("buildRound");
  const questions = makeQuestions().slice(0, 10);
  const round = buildRound(questions);
  assert.equal(round.length, 10);
  assert.deepEqual(plain(round.map((item) => item.question.id)).sort(), questions.map((q) => q.id).sort());
  for (const item of round) {
    assert.deepEqual(plain(item.choices).sort(), [...item.question.choices].sort());
  }
  assert.deepEqual(questions[0].choices, ["가", "나", "다", "라"]); // 원본 보기는 그대로
});

test("scoreFor: 맞히면 1점, 힌트 쓰고 맞히면 0.5점, 틀리면 0점", () => {
  const scoreFor = app("scoreFor");
  assert.equal(scoreFor(true, false), 1);
  assert.equal(scoreFor(true, true), 0.5);
  assert.equal(scoreFor(false, false), 0);
  assert.equal(scoreFor(false, true), 0);
});

test("totalScore: 문항 점수를 더한다", () => {
  const totalScore = app("totalScore");
  assert.equal(totalScore([]), 0);
  assert.equal(totalScore([
    { correct: true, usedHint: false },
    { correct: true, usedHint: true },
    { correct: false, usedHint: false },
  ]), 1.5);
});

test("formatScore: 정수에는 .0을 붙이지 않는다", () => {
  const formatScore = app("formatScore");
  assert.equal(formatScore(8), "8");
  assert.equal(formatScore(7.5), "7.5");
  assert.equal(formatScore(0), "0");
  assert.equal(formatScore(10), "10");
});
