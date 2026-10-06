// 생성: 2026-10-06 16:00 KST

// ===== 순수 함수: DOM을 쓰지 않으며 tests/에서 Node로 검사한다 =====

const MODE_LABELS = { practice: "연습", speed: "스피드", hint: "힌트" };
const ID_PREFIX = { "한국사": "history", "세계지리": "geography", "과학": "science", "예술과 문화": "arts" };
const QUESTIONS_PER_CATEGORY = 10;

function shuffle(array, random = Math.random) {
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function questionsOf(questions, category) {
  return questions.filter((q) => q.category === category);
}

function buildRound(questions, random = Math.random) {
  return shuffle(questions, random).map((question) => ({
    question,
    choices: shuffle(question.choices, random),
  }));
}

function scoreFor(correct, usedHint) {
  if (!correct) return 0;
  return usedHint ? 0.5 : 1;
}

function totalScore(results) {
  return results.reduce((sum, r) => sum + scoreFor(r.correct, r.usedHint), 0);
}

// 점수는 1과 0.5의 합이라 소수 오차가 없다. String(8)은 "8", String(7.5)는 "7.5"
function formatScore(score) {
  return String(score);
}
