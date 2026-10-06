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

// PRD 6.1의 규칙을 검사한다. 문제가 없으면 빈 배열을 돌려준다.
function validateQuestions(categories, questions) {
  const problems = [];
  const add = (id, message) => problems.push({ id, message });

  if (!Array.isArray(categories) || !Array.isArray(questions)) {
    add("(전체)", "CATEGORIES 또는 QUESTIONS가 없거나 배열이 아님");
    return problems;
  }
  const names = Object.keys(ID_PREFIX);
  if (categories.length !== names.length || !names.every((name) => categories.includes(name))) {
    add("(전체)", `CATEGORIES는 ${names.join(", ")}여야 함`);
  }
  const expectedTotal = names.length * QUESTIONS_PER_CATEGORY;
  if (questions.length !== expectedTotal) {
    add("(전체)", `문항 수가 ${expectedTotal}개가 아님: ${questions.length}개`);
  }

  const seen = new Set();
  questions.forEach((q, i) => {
    const id = q && typeof q.id === "string" ? q.id : `(${i + 1}번째 문항)`;
    if (!q || typeof q !== "object") {
      add(id, "문항이 객체가 아님");
      return;
    }
    if (seen.has(id)) add(id, "id 중복");
    seen.add(id);

    if (!Object.hasOwn(ID_PREFIX, q.category) || !categories.includes(q.category)) {
      add(id, `알 수 없는 카테고리: ${q.category}`);
    } else if (!new RegExp(`^${ID_PREFIX[q.category]}-\\d{2}$`).test(id)) {
      add(id, `id는 ${ID_PREFIX[q.category]}-두자리번호 형식이어야 함`);
    }
    if (typeof q.question !== "string" || q.question.trim() === "") add(id, "question이 비어 있음");
    if (!Array.isArray(q.choices) || q.choices.length !== 4) {
      add(id, "보기가 4개가 아님");
    } else {
      if (new Set(q.choices).size !== 4) add(id, "같은 보기가 두 번 있음");
      if (q.choices.filter((c) => c === q.answer).length !== 1) add(id, "answer가 보기 중 정확히 하나와 같지 않음");
    }
    if (typeof q.explanation !== "string" || q.explanation.trim() === "") add(id, "explanation이 비어 있음");
    const source = q.source;
    if (!source || typeof source.name !== "string" || source.name.trim() === ""
        || typeof source.url !== "string" || !source.url.startsWith("https://")) {
      add(id, "source에 기관명과 https:// 주소가 있어야 함");
    }
  });

  for (const category of names) {
    const count = questions.filter((q) => q && q.category === category).length;
    if (count !== QUESTIONS_PER_CATEGORY) {
      add("(전체)", `${category} 문항 수가 ${QUESTIONS_PER_CATEGORY}개가 아님: ${count}개`);
    }
  }
  return problems;
}
