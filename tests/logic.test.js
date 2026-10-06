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

// ----- 1단계: 문항 데이터 검사 -----

const problemIds = (problems) => plain(problems).map((p) => p.id);

test("validateQuestions: 규칙에 맞는 40문항은 문제 없음", () => {
  const validate = app("validateQuestions");
  assert.deepEqual(plain(validate(FIXTURE_CATEGORIES, makeQuestions())), []);
});

test("validateQuestions: 데이터가 없으면(questions.js 로드 실패) 전체 오류", () => {
  const validate = app("validateQuestions");
  assert.deepEqual(problemIds(validate(undefined, undefined)), ["(전체)"]);
});

test("validateQuestions: 잘못된 문항의 id를 알려 준다", () => {
  const validate = app("validateQuestions");
  const cases = [
    ["id 중복", (qs) => { qs[1].id = "history-01"; }, "history-01"],
    ["보기 3개", (qs) => { qs[5].choices = ["가", "나", "다"]; }, "history-06"],
    ["answer가 보기에 없음", (qs) => { qs[12].answer = "마"; }, "geography-03"],
    ["같은 보기 두 번", (qs) => { qs[20].choices = ["가", "나", "나", "라"]; }, "science-01"],
    ["id 약칭이 카테고리와 다름", (qs) => { qs[35].id = "art-06"; }, "art-06"],
    ["출처가 https가 아님", (qs) => { qs[0].source.url = "http://example.org/"; }, "history-01"],
    ["해설이 비어 있음", (qs) => { qs[3].explanation = ""; }, "history-04"],
    ["문제가 비어 있음", (qs) => { qs[14].question = "  "; }, "geography-05"],
    ["문항이 null", (qs) => { qs[7] = null; }, "(8번째 문항)"],
  ];
  for (const [label, breakIt, expectedId] of cases) {
    const qs = makeQuestions();
    breakIt(qs);
    assert.ok(problemIds(validate(FIXTURE_CATEGORIES, qs)).includes(expectedId), label);
  }
});

test("validateQuestions: 카테고리별 개수와 전체 개수를 검사한다", () => {
  const validate = app("validateQuestions");
  const moved = makeQuestions();
  moved[39].category = "과학"; // 예술과 문화 9개, 과학 11개
  assert.ok(problemIds(validate(FIXTURE_CATEGORIES, moved)).includes("(전체)"));
  const short = makeQuestions().slice(0, 39);
  assert.ok(problemIds(validate(FIXTURE_CATEGORIES, short)).includes("(전체)"));
});

test("validateQuestions: CATEGORIES가 정해진 4개가 아니면 전체 오류", () => {
  const validate = app("validateQuestions");
  assert.ok(problemIds(validate(["한국사", "세계지리", "과학"], makeQuestions())).includes("(전체)"));
});
