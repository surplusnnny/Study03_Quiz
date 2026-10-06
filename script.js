// 생성: 2026-10-06 16:00 KST

// ===== 순수 함수: DOM을 쓰지 않으며 tests/에서 Node로 검사한다 =====

const MODE_LABELS = { practice: "연습", speed: "스피드", hint: "힌트" };
const ID_PREFIX = { "한국사": "history", "세계지리": "geography", "과학": "science", "예술과 문화": "arts" };
const QUESTIONS_PER_CATEGORY = 10;
const SPEED_SECONDS = 15;

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

// 오답 3개 중 무작위로 2개를 고른다
function pickHintRemovals(choices, answer, random = Math.random) {
  const wrong = choices.filter((c) => c !== answer);
  return shuffle(wrong, random).slice(0, 2);
}

// 1초마다 빼서 세지 않고 마감 시각과 현재 시각의 차이로 계산한다(탭이 멈춰도 밀리지 않음)
function remainingSeconds(deadline, now) {
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

// ===== 화면: 브라우저에서만 실행된다 =====

const state = {
  mode: "practice",
  category: null,
  items: [],      // 이번 판 문항: [{ question, choices }]
  index: 0,
  results: [],    // 푼 문항: [{ id, correct, usedHint }]
  answered: false,
  usedHint: false,
  deadline: 0,
  timerId: null,
};

const $ = (id) => document.getElementById(id);

function showScreen(name) {
  if (name !== "quiz") stopTimer();
  for (const section of document.querySelectorAll("main > section")) {
    section.hidden = section.id !== `screen-${name}`;
  }
}

function init() {
  // questions.js가 없거나 문법 오류면 상수가 정의되지 않으므로 typeof로 확인한다
  const categories = typeof CATEGORIES === "undefined" ? undefined : CATEGORIES;
  const questions = typeof QUESTIONS === "undefined" ? undefined : QUESTIONS;
  const problems = validateQuestions(categories, questions);
  if (problems.length > 0) {
    for (const p of problems) console.error(`[문항 데이터 오류] ${p.id}: ${p.message}`);
    const ids = [...new Set(problems.map((p) => p.id))];
    $("data-error").textContent = `문항 데이터 오류: ${ids.join(", ")}`;
    $("data-error").hidden = false;
    $("start-body").hidden = true;
    showScreen("start");
    return;
  }
  renderCategoryButtons(categories);
  $("mode-select").addEventListener("change", updatePracticeNote);
  $("hint-button").addEventListener("click", useHint);
  updatePracticeNote();
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && state.timerId !== null) tick();
  });
  $("next-button").addEventListener("click", nextQuestion);
  $("home-button").addEventListener("click", () => showScreen("start"));
  showScreen("start");
}

function renderCategoryButtons(categories) {
  const box = $("category-buttons");
  box.replaceChildren();
  for (const category of categories) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = category;
    button.addEventListener("click", () => startRound(category));
    box.append(button);
  }
}

function startRound(category) {
  state.mode = selectedMode();
  state.category = category;
  state.items = buildRound(questionsOf(QUESTIONS, category));
  state.index = 0;
  state.results = [];
  showScreen("quiz");
  renderQuestion();
}

function selectedMode() {
  const checked = document.querySelector('input[name="mode"]:checked');
  return checked ? checked.value : "practice";
}

function updatePracticeNote() {
  $("practice-note").hidden = selectedMode() !== "practice";
}

function renderQuestion() {
  const item = state.items[state.index];
  state.answered = false;
  state.usedHint = false;
  $("hint-button").hidden = state.mode !== "hint";
  $("hint-button").disabled = false;
  $("quiz-category").textContent = state.category;
  $("quiz-mode").textContent = MODE_LABELS[state.mode];
  $("quiz-progress").textContent = `${state.index + 1} / ${state.items.length}`;
  $("quiz-question").textContent = item.question.question;
  const box = $("choices");
  box.replaceChildren();
  for (const choice of item.choices) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice";
    button.textContent = choice;
    button.dataset.choice = choice;
    button.addEventListener("click", () => answer(choice));
    box.append(button);
  }
  $("feedback").hidden = true;
  $("quiz-timer").hidden = state.mode !== "speed";
  if (state.mode === "speed") startTimer();
}

function answer(choice) {
  if (state.answered) return; // 빠르게 두 번 눌러도 한 번만 기록
  // 다른 탭에서 돌아와 아직 tick이 돌기 전에 누른 경우: 이미 마감이 지났으면 시간 초과
  if (state.mode === "speed" && remainingSeconds(state.deadline, Date.now()) === 0) {
    timeUp();
    return;
  }
  state.answered = true;
  stopTimer();
  const item = state.items[state.index];
  const correct = choice === item.question.answer;
  recordResult(correct);
  revealAnswer(choice, correct ? "정답입니다" : "오답입니다");
}

function recordResult(correct) {
  const item = state.items[state.index];
  state.results.push({ id: item.question.id, correct, usedHint: state.usedHint });
}

function useHint() {
  if (state.answered || state.usedHint) return;
  const item = state.items[state.index];
  const removed = pickHintRemovals(item.choices, item.question.answer);
  for (const button of $("choices").children) {
    if (removed.includes(button.dataset.choice)) {
      button.classList.add("removed");
      button.disabled = true;
    }
  }
  state.usedHint = true;
  $("hint-button").disabled = true;
}

function startTimer() {
  stopTimer();
  state.deadline = Date.now() + SPEED_SECONDS * 1000;
  tick();
  state.timerId = setInterval(tick, 200);
}

function stopTimer() {
  if (state.timerId !== null) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
}

function tick() {
  const left = remainingSeconds(state.deadline, Date.now());
  $("quiz-timer").textContent = `남은 시간 ${left}초`;
  if (left === 0) timeUp();
}

function timeUp() {
  if (state.answered) return;
  state.answered = true;
  stopTimer();
  $("quiz-timer").textContent = "남은 시간 0초";
  recordResult(false);
  revealAnswer(null, "시간 초과");
}

// chosen이 null이면(시간 초과) 정답만 표시한다
function revealAnswer(chosen, verdict) {
  const item = state.items[state.index];
  $("hint-button").disabled = true;
  for (const button of $("choices").children) {
    button.disabled = true;
    const value = button.dataset.choice;
    if (value === item.question.answer) {
      button.classList.add("correct");
      button.textContent = `✓ ${value}`;
    } else if (value === chosen) {
      button.classList.add("wrong");
      button.textContent = `✗ ${value}`;
    }
  }
  const { explanation, source } = item.question;
  $("feedback-verdict").textContent = verdict;
  $("feedback-explanation").textContent = explanation;
  $("feedback-source").textContent = `${source.name} (${source.url})`;
  $("feedback-source").href = source.url;
  const last = state.index === state.items.length - 1;
  $("next-button").textContent = last ? "결과 보기" : "다음";
  $("feedback").hidden = false;
}

function nextQuestion() {
  if (state.index < state.items.length - 1) {
    state.index += 1;
    renderQuestion();
  } else {
    showResult();
  }
}

function showResult() {
  const score = totalScore(state.results);
  const correctCount = state.results.filter((r) => r.correct).length;
  $("result-score").textContent = `${formatScore(score)} / ${QUESTIONS_PER_CATEGORY}점`;
  $("result-correct").textContent = `${state.items.length}문제 중 ${correctCount}개 맞힘`;
  $("result-practice-note").hidden = state.mode !== "practice";
  showScreen("result");
}

// Node 테스트에서는 document가 없으므로 실행하지 않는다
if (typeof document !== "undefined") init();
