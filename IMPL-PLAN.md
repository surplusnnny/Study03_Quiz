<!-- 생성: 2026-10-06 15:25 KST -->

# 상식 퀴즈 웹 앱 구현 계획서

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PRD.md의 4지선다 상식 퀴즈(카테고리 4개 × 10문제, 연습·스피드·힌트 모드, 순위표)를 3단계로 나눠 만들고, 단계마다 GitHub Pages에 배포한다.

**Architecture:** 코드 파일은 `index.html`, `style.css`, `script.js`, `questions.js` 4개뿐이다. `index.html`에 화면을 `<section>`으로 미리 적어 두고 `script.js`가 상태 객체 하나로 보일 화면과 바뀌는 글자만 채운다. `script.js` 앞부분에는 DOM을 쓰지 않는 순수 함수(섞기, 채점, 검사, 순위 계산)를 모아 두어 Node.js로 자동 검사하고, 뒷부분의 화면 코드는 브라우저에서 직접 확인한다.

**Tech Stack:** HTML, CSS, 순수 JavaScript(외부 라이브러리 없음), localStorage, GitHub Pages. 개발 중 검사에만 Node.js 24의 내장 테스트 도구 `node:test`를 쓴다(설치할 패키지 없음).

**Spec:** [PRD.md](PRD.md)

## 단계 한눈에 보기

| 단계 | 만들 것 | 작업 | 교재 절 |
|---|---|---|---|
| 1단계 | 연습 모드와 점수, 40문항, 문항 데이터 검사, Pages 배포 | Task 1~5 | 5.3 |
| (사이) | 사람이 40문항 확인, `CLAUDE.md` 문항 작성 규칙 10개 | 이 계획 밖 | 5.4 |
| 2단계 | 모드 선택, 힌트 모드, 스피드 모드, 틀린 문제 다시 풀기 | Task 6~9 | 5.5 |
| 3단계 | 점수 저장과 순위표 | Task 10~13 | 5.6 |

각 단계는 배포하고 브라우저 확인을 마친 뒤에 다음 단계로 넘어간다(PRD 9장).

## Global Constraints

- 코드 파일은 `index.html`, `style.css`, `script.js`, `questions.js` 4개뿐이다. 외부 라이브러리를 쓰지 않는다.
- `fetch()`와 ES 모듈을 쓰지 않는다. `index.html`이 `<script src="questions.js">`, `<script src="script.js">` 순서로 불러온다.
- `questions.js`에는 `CATEGORIES`, `QUESTIONS` 전역 상수만 둔다.
- 화면 전환은 `<section>`의 `hidden`을 켜고 끄는 방식이다. 한 번에 한 화면만 보인다.
- 새 파일 맨 위(HTML은 `<!DOCTYPE html>` 다음 줄)에 `생성: YYYY-MM-DD HH:MM KST` 주석을 단다. 시각은 짐작하지 말고 `TZ=KST-9 date '+%Y-%m-%d %H:%M'`(Bash) 또는 `[TimeZoneInfo]::ConvertTimeBySystemTimeZoneId([DateTime]::UtcNow, 'Korea Standard Time').ToString('yyyy-MM-dd HH:mm')`(PowerShell)로 확인한다. 고치는 파일의 생성 시각은 바꾸지 않는다.
- 점수는 결과 화면에만 `점수 / 10점`으로 보여 준다. 정수면 `.0`을 붙이지 않는다(`8 / 10점`, `7.5 / 10점`).
- 출처 링크는 `target="_blank" rel="noopener"`로 연다.
- localStorage 키는 `study03-quiz:leaderboard` 하나다. 표 키는 `모드|카테고리`, 모드는 `speed`, `hint`.
- 사용자가 입력한 이름과 문항 글자는 모두 `textContent`로 넣는다. `innerHTML`을 쓰지 않는다.
- 화면 문구는 PRD 그대로 쓴다: "순위표에 기록되지 않음", "정답입니다", "오답입니다", "시간 초과", "문항 데이터 오류", "이 브라우저에서는 기록을 저장할 수 없음", "아직 기록 없음", "다시 푼 문제 n개 중 m개 맞힘", 버튼 [다음], [결과 보기], [처음으로], [힌트], [틀린 문제 다시 풀기], [저장], [순위표].
- 커밋 메시지 끝에 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` 줄을 붙인다(아래 커밋 명령에서는 줄였다).
- 커밋 작성자는 이 저장소에만 설정한 깃허브 사용자 이름과 noreply 주소(`숫자ID+사용자이름@users.noreply.github.com`)를 쓴다.
- 단계마다 `stage-1`, `stage-2`, `stage-3` 브랜치를 `main`에서 만들어 그 브랜치에 태스크마다 커밋한다. `main`에서 바로 구현하지 않는다. 브라우저 확인을 마치면 `git merge --no-ff`로 병합 기록을 남기며 `main`에 합치고, `main`을 올려 Pages를 갱신한다.
- 태스크마다 `node --test`가 통과한 뒤 그 태스크에서 바꾼 파일만 커밋한다.
- `.claude/` 폴더(화면 확인용 서버 설정 등 이 컴퓨터에서만 쓰는 설정)는 `.gitignore`로 저장소에 올리지 않는다.

## Review Focus

자동 검사가 닿지 않지만 사용자가 실제로 겪기 쉬운 상황이다. 각 줄의 확인은 해당 작업에 넣어 두었다.

1. **스피드 모드에서 다른 탭에 오래 있다가 돌아와 바로 보기를 누름:** 마감 시각이 지났으면 고른 보기와 상관없이 "시간 초과"(0점)로 처리해야 한다. → Task 7 `answer()`의 마감 확인, Task 7 브라우저 확인 4번
2. **보기·[다음]·[저장]을 빠르게 두 번 누름:** 한 문항의 결과가 두 번 기록되거나 같은 기록이 두 번 저장되면 안 된다. → Task 4 `state.answered`, Task 12 `state.saved`, 각 작업의 브라우저 확인
3. **`questions.js`가 없거나 문법 오류로 `QUESTIONS`가 정의되지 않음:** 빈 화면이 아니라 "문항 데이터 오류"가 보여야 한다. → Task 2의 `validateQuestions(undefined, undefined)` 테스트, Task 4 `init()`의 `typeof` 확인
4. **localStorage에 접근하는 것만으로 오류가 남(쿠키 차단, 일부 사생활 보호 모드):** `window.localStorage`를 읽는 순간 예외가 나도 게임은 계속되고 경고 문구가 나와야 한다. → Task 11 `readBoard(null)`·예외 저장소 테스트, Task 12 `getStorage()`
5. **한 판이 끝나고 [처음으로]로 돌아가 다른 모드·카테고리로 시작:** 이전 판의 힌트 사용 여부, 다시 풀기 상태, 저장 폼, 타이머가 남으면 안 된다. → Task 6~8 `startRound()`·`renderQuestion()`의 초기화, Task 12 `showResult()`의 폼 초기화, Task 9·13 브라우저 확인

---

## 파일 구조

| 파일 | 맡은 일 | 만드는 작업 |
|---|---|---|
| `index.html` | 화면 4개(시작, 문제, 결과, 순위표)의 뼈대 | Task 4, 고침: 6·7·8·12 |
| `style.css` | 화면 모양 | Task 4, 고침: 6·7·12 |
| `script.js` | 앞부분: 순수 함수 / 뒷부분: 상태, 화면 전환, 채점, 타이머, 순위표 저장 | Task 1, 고침: 2·4·6·7·8·10·11·12 |
| `questions.js` | `CATEGORIES`, `QUESTIONS` | Task 3 |
| `tests/load.js` | 테스트용 도우미: `script.js`·`questions.js`를 Node에서 실행, 가짜 문항 | Task 1 |
| `tests/logic.test.js` | 순수 함수 검사 | Task 1, 고침: 2·6·7·8·10·11 |
| `tests/questions.test.js` | 실제 40문항 검사 | Task 3 |
| `.nojekyll` | Pages가 파일을 그대로 내보내게 하는 빈 파일 | Task 5 |
| `.gitignore` | `.claude/`를 저장소에서 뺌 | Task 5 |

`tests/`는 앱 코드가 아니라 개발할 때만 쓰는 검사 파일이다. 브라우저는 이 파일을 불러오지 않는다.

**자동 검사 실행:** 저장소 맨 위 폴더에서 `node --test`. Node가 `*.test.js` 파일을 찾아 모두 실행한다.

---

# 1단계: 연습 모드와 점수 (교재 5.3)

**만들 것**
- 시작 화면: 카테고리 버튼 4개, 연습 모드 설명과 "순위표에 기록되지 않음"
- 문제 화면: 카테고리·모드·진행 상황, 보기 4개, 정답 여부·해설·출처, [다음]/[결과 보기]
- 결과 화면: `점수 / 10점`, 맞힌 개수, "순위표에 기록되지 않음", [처음으로]
- 40문항(출처를 열어 확인), 문항 데이터 검사(PRD 8장 첫 줄)
- GitHub 저장소와 Pages 배포

**완료 기준 (PRD 9장)**
- [ ] 40문항을 모두 쓰고 출처 페이지에서 정답을 확인했다.
- [ ] 시작 화면에서 카테고리를 고르면 연습 모드 10문제를 섞어서 푼다.
- [ ] 답마다 정답 여부, 해설, 출처가 나온다.
- [ ] 결과 화면에 점수와 "순위표에 기록되지 않음"이 나온다.
- [ ] 문항 데이터가 규칙에 어긋나면 "문항 데이터 오류"와 `id`가 나오고 게임이 시작되지 않는다.
- [ ] `node --test`가 모두 통과한다.
- [ ] GitHub Pages 주소에서 동작한다.

**내가 브라우저에서 직접 확인할 항목** (`index.html`을 더블클릭해 연 `file://` 화면과 Pages 주소에서 모두)
1. 시작 화면에 카테고리 버튼 4개(한국사, 세계지리, 과학, 예술과 문화)와 연습 모드 설명, "순위표에 기록되지 않음"이 보인다.
2. 카테고리를 누르면 문제 화면 위쪽에 카테고리, "연습", `1 / 10`이 보이고 점수는 보이지 않는다.
3. 정답을 고르면 그 보기가 초록색과 ✓로 바뀌고 "정답입니다"가 나온다.
4. 오답을 고르면 고른 보기는 빨간색과 ✗, 정답 보기는 초록색과 ✓로 바뀌고 "오답입니다"가 나온다.
5. 답을 고른 뒤에는 다른 보기를 눌러도 아무 일도 일어나지 않는다. 보기를 빠르게 두 번 눌러도 결과 화면의 맞힌 개수가 10을 넘지 않는다.
6. 해설 한 줄과 출처(기관명과 주소)가 나오고, 출처 링크를 누르면 새 탭에서 열린다.
7. 1~9번째 문항은 [다음], 10번째 문항은 [결과 보기]가 나온다.
8. 결과 화면이 `8 / 10점`처럼 나오고(`8.0` 아님), "10문제 중 8개 맞힘"과 "순위표에 기록되지 않음"이 보인다. 모두 맞히면 `10 / 10점`, 모두 틀리면 `0 / 10점`이다.
9. [처음으로]를 눌러 같은 카테고리를 다시 시작하면 문항 순서와 보기 순서가 지난 판과 다르다.
10. `questions.js`에서 `history-01`의 `answer`를 보기에 없는 글자로 잠시 바꾸고 새로고침하면, 시작 화면에 "문항 데이터 오류: history-01"이 나오고 카테고리 버튼이 없다. F12 콘솔에 이유가 적혀 있다. 되돌리고 새로고침하면 정상으로 돌아온다.

---

### Task 1: 저장소, 테스트 도우미, 섞기와 채점 함수

**Files:**
- Create: `script.js`
- Create: `tests/load.js`
- Create: `tests/logic.test.js`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `MODE_LABELS: { practice: "연습", speed: "스피드", hint: "힌트" }`
  - `ID_PREFIX: { "한국사": "history", "세계지리": "geography", "과학": "science", "예술과 문화": "arts" }`
  - `QUESTIONS_PER_CATEGORY = 10`
  - `shuffle(array, random = Math.random) → 새 배열` (원본을 바꾸지 않음)
  - `questionsOf(questions, category) → 그 카테고리 문항 배열`
  - `buildRound(questions, random = Math.random) → [{ question, choices }]` (문항 순서와 각 문항의 보기 순서를 섞음, `question`은 원래 문항 객체)
  - `scoreFor(correct: boolean, usedHint: boolean) → 0 | 0.5 | 1`
  - `totalScore(results: [{ correct, usedHint }]) → number`
  - `formatScore(score: number) → string`
  - 테스트: `loadApp(files) → (name) => 값`, `plain(value)`, `makeQuestions()`, `FIXTURE_CATEGORIES`

- [ ] **Step 1: 첫 커밋과 1단계 브랜치** (`git init -b main`은 계획서 작성 직후에 했다)

```bash
git config user.name "<깃허브 사용자 이름>"
git config user.email "<숫자ID>+<깃허브 사용자 이름>@users.noreply.github.com"
git add PRD.md IMPL-PLAN.md
git commit -m "docs: PRD와 구현 계획서"
git switch -c stage-1
```

- [ ] **Step 2: 테스트 도우미 `tests/load.js` 만들기**

```js
// 생성: YYYY-MM-DD HH:MM KST
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.join(__dirname, "..");

// 브라우저처럼 파일들을 한 전역 공간에서 차례로 실행하고,
// 그 안의 상수·함수를 이름으로 꺼내는 함수를 돌려준다.
function loadApp(files = ["questions.js", "script.js"]) {
  const context = vm.createContext({ console });
  for (const file of files) {
    const code = fs.readFileSync(path.join(ROOT, file), "utf8");
    vm.runInContext(code, context, { filename: file });
  }
  return (name) => vm.runInContext(name, context);
}

// vm 안에서 만든 배열·객체는 프로토타입이 달라 deepEqual이 실패하므로 JSON으로 옮겨 비교한다.
const plain = (value) => JSON.parse(JSON.stringify(value));

const FIXTURE_CATEGORIES = ["한국사", "세계지리", "과학", "예술과 문화"];

// 규칙에 맞는 가짜 40문항. 순서: 0~9 history, 10~19 geography, 20~29 science, 30~39 arts
function makeQuestions() {
  const prefixes = { "한국사": "history", "세계지리": "geography", "과학": "science", "예술과 문화": "arts" };
  const list = [];
  for (const [category, prefix] of Object.entries(prefixes)) {
    for (let n = 1; n <= 10; n++) {
      list.push({
        id: `${prefix}-${String(n).padStart(2, "0")}`,
        category,
        question: `${category} 문제 ${n}`,
        choices: ["가", "나", "다", "라"],
        answer: "나",
        explanation: "한 줄 해설",
        source: { name: "기관 「항목」", url: "https://example.org/" },
      });
    }
  }
  return list;
}

module.exports = { loadApp, plain, makeQuestions, FIXTURE_CATEGORIES };
```

- [ ] **Step 3: 실패하는 테스트 `tests/logic.test.js` 쓰기**

```js
// 생성: YYYY-MM-DD HH:MM KST
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
```

- [ ] **Step 4: 테스트가 실패하는지 확인**

Run: `node --test`
Expected: FAIL — `script.js`가 없어 `ENOENT: no such file or directory ... script.js`

- [ ] **Step 5: `script.js` 앞부분 쓰기**

```js
// 생성: YYYY-MM-DD HH:MM KST

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
```

- [ ] **Step 6: 테스트가 통과하는지 확인**

Run: `node --test`
Expected: PASS — 테스트 8개 통과, 실패 0

- [ ] **Step 7: 커밋**

```bash
git add script.js tests/load.js tests/logic.test.js
git commit -m "feat: 섞기와 채점 함수, 테스트 도우미"
```

---

### Task 2: 문항 데이터 검사 `validateQuestions`

**Files:**
- Modify: `script.js` (`formatScore` 아래에 추가)
- Modify: `tests/logic.test.js` (끝에 추가)

**Interfaces:**
- Consumes: `ID_PREFIX`, `QUESTIONS_PER_CATEGORY` (Task 1)
- Produces: `validateQuestions(categories, questions) → [{ id: string, message: string }]` — 빈 배열이면 문제 없음. 개별 문항 문제는 그 문항의 `id`(없으면 `(n번째 문항)`), 전체 문제는 `(전체)`

- [ ] **Step 1: 실패하는 테스트를 `tests/logic.test.js` 끝에 추가**

```js
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
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `node --test`
Expected: FAIL — `ReferenceError: validateQuestions is not defined` (새 테스트 5개 실패)

- [ ] **Step 3: `script.js`의 `formatScore` 아래에 추가**

```js
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
```

- [ ] **Step 4: 테스트가 통과하는지 확인**

Run: `node --test`
Expected: PASS — 테스트 13개 통과, 실패 0

- [ ] **Step 5: 커밋**

```bash
git add script.js tests/logic.test.js
git commit -m "feat: 문항 데이터 검사"
```

---

### Task 3: 40문항 `questions.js`

이 작업의 결과물은 코드가 아니라 **조사해서 확인한 데이터**다. 문항을 미리 이 계획서에 적지 않는 이유는, 출처 페이지를 실제로 열어 정답을 확인하는 일(PRD 6.2 규칙 2)이 이 작업 안에서 이루어져야 하기 때문이다.

**Files:**
- Create: `questions.js`
- Create: `tests/questions.test.js`

**Interfaces:**
- Consumes: `validateQuestions` (Task 2)
- Produces: 전역 상수 `CATEGORIES = ["한국사", "세계지리", "과학", "예술과 문화"]`, `QUESTIONS` (40개, 구조는 PRD 6.1)

- [ ] **Step 1: 실패하는 테스트 `tests/questions.test.js` 쓰기**

```js
// 생성: YYYY-MM-DD HH:MM KST
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
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `node --test`
Expected: FAIL — `questions.js`가 없어 `ENOENT`

- [ ] **Step 3: 카테고리마다 10문항씩 쓰고 출처를 연다**

카테고리 하나(10문항)를 끝낼 때마다 아래를 지킨다.

1. 문제 문장과 보기 4개, 정답, 한 줄 해설을 쓴다.
2. 출처 후보 페이지를 WebFetch로 **실제로 열어** 정답과 해설 내용이 그 페이지에 있는지 확인한다. 열리지 않거나 내용이 없으면 그 출처를 쓰지 않고 다른 페이지를 찾는다. 출처 후보: 국사편찬위원회 우리역사넷, 한국학중앙연구원 한국민족문화대백과사전, 국가유산청, 국립중앙박물관, 국립현대미술관, CIA The World Factbook, NASA, 브리태니커.
3. 다른 보기도 기준에 따라 정답이 될 수 있는지 따져 보고, 그렇다면 문제 문장을 고쳐 정답을 하나로 좁힌다(규칙 1).
4. "가장 ~한" 같은 최상급 표현에는 기준과 시점을 문제에 적는다(예: "2024년 기준, 면적으로 따져서 가장 넓은 나라는?")(규칙 3).
5. `source.name`은 `기관명 「항목명」`, `source.url`은 확인한 페이지의 `https://` 주소 그대로 적는다.

파일 모양(첫 문항만 예로 든 형식이며, 실제 내용은 위 절차로 채운다):

```js
// 생성: YYYY-MM-DD HH:MM KST

const CATEGORIES = ["한국사", "세계지리", "과학", "예술과 문화"];

const QUESTIONS = [
  // ----- 한국사 (history-01 ~ history-10) -----
  {
    id: "history-01",
    category: "한국사",
    question: "문제 문장",
    choices: ["보기1", "보기2", "보기3", "보기4"],
    answer: "보기2",
    explanation: "한 줄 해설",
    source: { name: "기관명 「항목명」", url: "https://..." },
  },
  // ----- 세계지리 (geography-01 ~ geography-10) -----
  // ----- 과학 (science-01 ~ science-10) -----
  // ----- 예술과 문화 (arts-01 ~ arts-10) -----
];
```

- [ ] **Step 4: 테스트가 통과하는지 확인**

Run: `node --test`
Expected: PASS — 테스트 18개 통과, 실패 0

- [ ] **Step 5: 확인 목록을 사용자에게 보여 준다**

40문항을 `id | 문제 | 정답 | 출처 주소` 표로 대화에 보여 준다. 사람이 출처를 열어 최종 확인하는 일은 1단계 배포 뒤 교재 5.4에서 한다.

- [ ] **Step 6: 커밋**

```bash
git add questions.js tests/questions.test.js
git commit -m "feat: 40문항과 출처"
```

---

### Task 4: 연습 모드 화면 (시작 → 문제 → 결과)

**Files:**
- Create: `index.html`
- Create: `style.css`
- Modify: `script.js` (끝에 화면 코드 추가)

**Interfaces:**
- Consumes: Task 1~3의 모든 순수 함수, `CATEGORIES`, `QUESTIONS`
- Produces (Task 6~12가 고치는 화면 코드):
  - `state = { mode, category, items, index, results, answered }` — `results`는 `[{ id, correct, usedHint }]`
  - `$(id)`, `showScreen(name)` (`name`: `"start" | "quiz" | "result"`, 3단계에서 `"board"` 추가)
  - `init()`, `renderCategoryButtons(categories)`, `startRound(category)`, `renderQuestion()`, `answer(choice)`, `revealAnswer(chosen, verdict)`, `nextQuestion()`, `showResult()`
  - HTML id: `screen-start`, `data-error`, `start-body`, `category-buttons`, `screen-quiz`, `quiz-category`, `quiz-mode`, `quiz-progress`, `quiz-question`, `choices`, `feedback`, `feedback-verdict`, `feedback-explanation`, `feedback-source`, `next-button`, `screen-result`, `result-score`, `result-correct`, `result-practice-note`, `home-button`
  - 보기 버튼: `class="choice"`, `data-choice="보기 글자"`, 표시 클래스 `correct`, `wrong`

- [ ] **Step 1: `index.html` 쓰기**

```html
<!DOCTYPE html>
<!-- 생성: YYYY-MM-DD HH:MM KST -->
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>상식 퀴즈</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main>
    <section id="screen-start">
      <h1>상식 퀴즈</h1>
      <p id="data-error" class="error" hidden></p>
      <div id="start-body">
        <p class="mode-desc"><strong>연습 모드</strong> — 시간 제한과 힌트 없이 풀고, 맞히면 1점입니다. <span class="note">순위표에 기록되지 않음</span></p>
        <h2>카테고리</h2>
        <div id="category-buttons" class="button-grid"></div>
      </div>
    </section>

    <section id="screen-quiz" hidden>
      <header class="quiz-header">
        <span id="quiz-category"></span>
        <span id="quiz-mode"></span>
        <span id="quiz-progress"></span>
      </header>
      <h2 id="quiz-question"></h2>
      <div id="choices" class="choices"></div>
      <div id="feedback" hidden>
        <p id="feedback-verdict" class="verdict"></p>
        <p id="feedback-explanation"></p>
        <p class="source">출처: <a id="feedback-source" target="_blank" rel="noopener"></a></p>
        <button id="next-button" type="button">다음</button>
      </div>
    </section>

    <section id="screen-result" hidden>
      <h2>결과</h2>
      <p id="result-score" class="score"></p>
      <p id="result-correct"></p>
      <p id="result-practice-note" class="note">순위표에 기록되지 않음</p>
      <div class="actions">
        <button id="home-button" type="button">처음으로</button>
      </div>
    </section>
  </main>
  <script src="questions.js"></script>
  <script src="script.js"></script>
</body>
</html>
```

- [ ] **Step 2: `style.css` 쓰기**

```css
/* 생성: YYYY-MM-DD HH:MM KST */

/* display를 지정한 요소도 hidden이면 반드시 숨긴다 */
[hidden] { display: none !important; }

:root {
  --bg: #f7f7f5;
  --fg: #1d1d1f;
  --muted: #5f6368;
  --line: #d0d0d0;
  --accent: #2457c5;
  --ok: #1e7b34;
  --ok-bg: #e3f4e7;
  --bad: #b3261e;
  --bad-bg: #fbe7e5;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--bg);
  color: var(--fg);
  font-family: system-ui, "Malgun Gothic", "Apple SD Gothic Neo", sans-serif;
  line-height: 1.6;
}

main { max-width: 640px; margin: 0 auto; padding: 24px 16px; }

button {
  font: inherit;
  padding: 10px 16px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fff;
  color: var(--fg);
  cursor: pointer;
}
button:disabled { cursor: default; }

.button-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }

.quiz-header { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; color: var(--muted); }

.choices { display: grid; gap: 8px; margin: 16px 0; }
.choice { text-align: left; }
.choice:disabled { color: var(--fg); }
.choice.correct { background: var(--ok-bg); border-color: var(--ok); color: var(--ok); font-weight: bold; }
.choice.wrong { background: var(--bad-bg); border-color: var(--bad); color: var(--bad); }

.verdict { font-weight: bold; font-size: 1.1em; }
.source { word-break: break-all; }
.score { font-size: 2em; font-weight: bold; margin: 8px 0; }
.note { color: var(--muted); }
.error { color: var(--bad); font-weight: bold; }
```

- [ ] **Step 3: `script.js` 끝에 화면 코드 추가**

```js
// ===== 화면: 브라우저에서만 실행된다 =====

const state = {
  mode: "practice",
  category: null,
  items: [],      // 이번 판 문항: [{ question, choices }]
  index: 0,
  results: [],    // 푼 문항: [{ id, correct, usedHint }]
  answered: false,
};

const $ = (id) => document.getElementById(id);

function showScreen(name) {
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
  state.category = category;
  state.items = buildRound(questionsOf(QUESTIONS, category));
  state.index = 0;
  state.results = [];
  showScreen("quiz");
  renderQuestion();
}

function renderQuestion() {
  const item = state.items[state.index];
  state.answered = false;
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
}

function answer(choice) {
  if (state.answered) return; // 빠르게 두 번 눌러도 한 번만 기록
  state.answered = true;
  const item = state.items[state.index];
  const correct = choice === item.question.answer;
  state.results.push({ id: item.question.id, correct, usedHint: false });
  revealAnswer(choice, correct ? "정답입니다" : "오답입니다");
}

// chosen이 null이면(시간 초과) 정답만 표시한다
function revealAnswer(chosen, verdict) {
  const item = state.items[state.index];
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
```

- [ ] **Step 4: 자동 검사가 그대로 통과하는지 확인**

Run: `node --test`
Expected: PASS — 테스트 18개 통과 (화면 코드가 Node에서 실행되지 않음을 확인)

- [ ] **Step 5: 브라우저 확인**

`index.html`을 더블클릭해 열고, 1단계 "내가 브라우저에서 직접 확인할 항목" 1~10을 확인한다(이 시점에는 `file://`만).

- [ ] **Step 6: 커밋**

```bash
git add index.html style.css script.js
git commit -m "feat: 연습 모드 화면과 결과"
```

---

### Task 5: GitHub Pages 배포 (1단계 마무리)

GitHub에 **공개 저장소** `Study03_Quiz`를 만든다(교재 5.3.3.1). 같은 이름의 저장소가 이미 있으면 덮어쓰지 말고 멈춘다(교재 5.3.3.4).

**Files:**
- Create: `.nojekyll` (빈 파일. Pages의 Jekyll 변환을 끄면 `.md`의 `{{` 같은 글자 때문에 빌드가 실패하는 일이 없고 파일이 그대로 나간다. 주석을 넣을 수 없는 빈 표시 파일이다)
- Create: `.gitignore` (`.claude/`)

**Interfaces:**
- Consumes: Task 1~4의 모든 파일
- Produces: Pages 주소 `https://<계정>.github.io/Study03_Quiz/`

- [ ] **Step 1: `stage-1`을 `main`에 병합 기록을 남기며 합치기**

```bash
git switch main
git merge --no-ff stage-1 -m "merge: 구현 1단계(연습 모드와 점수)"
```

- [ ] **Step 2: `.nojekyll`, `.gitignore` 만들고 커밋** (아래 명령은 Bash 기준)

```bash
touch .nojekyll
printf '# 생성: YYYY-MM-DD HH:MM KST\n.claude/\n' > .gitignore
git add .nojekyll .gitignore
git commit -m "chore: Pages에서 Jekyll 끄기, .claude 제외"
```

- [ ] **Step 3: 저장소를 만들고 올리기**

```bash
gh repo create Study03_Quiz --public --source . --push
```

- [ ] **Step 4: Pages 켜기**

```bash
gh api -X POST "repos/$(gh api user --jq .login)/Study03_Quiz/pages" -f "source[branch]=main" -f "source[path]=/"
```

- [ ] **Step 5: 빌드가 끝났는지 확인**

Run: `gh api "repos/$(gh api user --jq .login)/Study03_Quiz/pages/builds/latest" --jq .status`
Expected: `built` (처음에는 `building`일 수 있으니 1분쯤 뒤에 다시 실행)

Run: `gh api "repos/$(gh api user --jq .login)/Study03_Quiz/pages" --jq .html_url`
Expected: `https://<계정>.github.io/Study03_Quiz/`

- [ ] **Step 6: Pages 주소에서 브라우저 확인**

Pages 주소에서 1단계 확인 항목 1~9를 다시 확인한다. 1단계 완료 기준을 모두 체크한다.

- [ ] **Step 7: 다음은 교재 5.4**

사용자가 40문항의 출처를 열어 확인하고 `CLAUDE.md`에 문항 작성 규칙을 정리한다(이 계획 밖). 그 뒤 2단계로 넘어간다.

---

# 2단계: 스피드 모드, 힌트 모드, 틀린 문제 다시 풀기 (교재 5.5)

**만들 것**
- 시작 화면: 위쪽에 모드 3개(연습, 스피드, 힌트)와 규칙 한 줄씩, 연습을 고르면 "순위표에 기록되지 않음", 아래쪽에 카테고리
- 힌트 모드: 문항마다 [힌트] 한 번, 오답 2개를 자리를 비운 채 지움, 힌트 쓰고 맞히면 0.5점
- 스피드 모드: 문항마다 15초, 마감 시각 기준 계산, 해설 중 멈춤, 0초면 "시간 초과"와 정답 표시, [다음]에서 다시 15초, 문제 화면을 벗어나면 멈춤
- 연습 모드 결과 화면: [틀린 문제 다시 풀기], "다시 푼 문제 n개 중 m개 맞힘", 점수는 처음 10문제 그대로

**완료 기준 (PRD 9장)**
- [ ] PRD 5장의 규칙이 모두 동작한다.
- [ ] 시작 화면에서 모드와 카테고리를 고른다.
- [ ] 연습 모드 결과 화면에서 틀린 문제를 다 맞힐 때까지 다시 풀 수 있다.
- [ ] `node --test`가 모두 통과한다.
- [ ] Pages 주소에 배포했다.

**내가 브라우저에서 직접 확인할 항목** (`file://`와 Pages 주소 모두)
1. 시작 화면 위쪽에 모드 3개와 규칙 한 줄씩이 있고, 연습을 고르면 "순위표에 기록되지 않음"이 보이며 스피드·힌트를 고르면 사라진다.
2. 고른 모드 이름이 문제 화면 위쪽에 나온다. 어느 모드든 문제 화면에 점수는 없다.
3. **힌트:** [힌트]를 누르면 오답 2개만 사라지고 정답과 오답 1개가 원래 자리에 남는다. 지운 자리는 비어 있다.
4. **힌트:** [힌트]는 한 문항에 한 번만 눌린다. 답을 고른 뒤에도 눌리지 않는다. 다음 문항에서는 다시 눌린다.
5. **힌트:** 힌트 없이 다 맞히면 `10 / 10점`, 10문제를 다 맞히되 그중 3문제에 힌트를 썼으면 `8.5 / 10점`이다. 힌트를 쓰고 틀린 문항은 0점이다.
6. **스피드:** 문제 화면에 남은 초가 15부터 줄어든다.
7. **스피드:** 답을 고르면 남은 초가 멈추고, 해설을 읽는 동안 그대로다.
8. **스피드:** 15초 동안 아무것도 안 고르면 "시간 초과"가 나오고 정답 보기가 ✓로 표시되며, 그 문항은 0점이다.
9. **스피드:** [다음]을 누르면 다음 문항이 다시 15부터 센다.
10. **스피드:** 문항 도중 다른 탭에 10초 있다가 돌아오면 남은 초가 10초쯤 줄어 있다(밀리지 않음). 20초 있다가 돌아와 보기를 누르면 "시간 초과"로 처리된다.
11. **다시 풀기:** 연습 모드에서 틀린 문항이 있으면 결과 화면에 [틀린 문제 다시 풀기]가 나오고, 모두 맞히면 나오지 않는다.
12. **다시 풀기:** 누르면 틀린 문항만 섞인 순서로 나오고 진행 상황이 `1 / (틀린 개수)`다.
13. **다시 풀기:** 다시 푼 판의 결과 화면에 "다시 푼 문제 n개 중 m개 맞힘"이 나오고, 점수 칸은 처음 10문제 점수 그대로다.
14. **다시 풀기:** 다시 푼 판에서도 틀리면 버튼이 또 나오고, 그 판에서 틀린 문항만 나온다. 모두 맞히면 버튼이 사라진다.
15. 스피드·힌트 모드 결과 화면에는 [틀린 문제 다시 풀기]와 "순위표에 기록되지 않음"이 없다.
16. 힌트 모드로 한 판 끝내고 [처음으로] → 연습 모드로 시작하면 [힌트] 버튼도 타이머도 보이지 않는다.

---

### Task 6: 모드 선택과 힌트 모드

시작 전: `main`에서 `git switch -c stage-2`로 이 단계의 브랜치를 만들고, 어느 브랜치에서 만드는지 사용자에게 먼저 알린다(교재 5.5.1.3 d.1).

**Files:**
- Modify: `index.html` (`start-body` 안, `quiz-header` 안)
- Modify: `style.css` (끝에 추가)
- Modify: `script.js` (순수 함수 1개 추가, 화면 함수 고침)
- Modify: `tests/logic.test.js` (끝에 추가)

**Interfaces:**
- Consumes: `shuffle` (Task 1), Task 4의 화면 함수
- Produces:
  - `pickHintRemovals(choices, answer, random = Math.random) → 지울 오답 글자 2개 배열`
  - `state.usedHint: boolean`
  - `selectedMode() → "practice" | "speed" | "hint"`, `updatePracticeNote()`, `useHint()`, `recordResult(correct)`
  - HTML id: `mode-select`(라디오 `name="mode"`), `practice-note`, `hint-button`
  - 보기 버튼 클래스 `removed`

- [ ] **Step 1: 실패하는 테스트를 `tests/logic.test.js` 끝에 추가**

```js
// ----- 2단계: 힌트 -----

test("pickHintRemovals: 정답이 아닌 서로 다른 보기 2개를 고른다", () => {
  const pick = app("pickHintRemovals");
  const choices = ["가", "나", "다", "라"];
  for (let i = 0; i < 100; i++) {
    const removed = plain(pick(choices, "나"));
    assert.equal(removed.length, 2);
    assert.equal(new Set(removed).size, 2);
    assert.ok(!removed.includes("나"));
    assert.ok(removed.every((c) => choices.includes(c)));
  }
});

test("pickHintRemovals: 오답 3개가 모두 남겨질 수 있다(무작위)", () => {
  const pick = app("pickHintRemovals");
  const kept = new Set();
  for (let i = 0; i < 200; i++) {
    const removed = pick(["가", "나", "다", "라"], "나");
    for (const wrong of ["가", "다", "라"]) if (!removed.includes(wrong)) kept.add(wrong);
  }
  assert.deepEqual([...kept].sort(), ["가", "다", "라"]);
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `node --test`
Expected: FAIL — `ReferenceError: pickHintRemovals is not defined`

- [ ] **Step 3: `script.js`의 `validateQuestions` 아래(순수 함수 구역 끝)에 추가**

```js
// 오답 3개 중 무작위로 2개를 고른다
function pickHintRemovals(choices, answer, random = Math.random) {
  const wrong = choices.filter((c) => c !== answer);
  return shuffle(wrong, random).slice(0, 2);
}
```

- [ ] **Step 4: 테스트가 통과하는지 확인**

Run: `node --test`
Expected: PASS — 테스트 20개 통과

- [ ] **Step 5: `index.html`의 시작 화면 바꾸기**

이 부분을 찾아서:

```html
        <p class="mode-desc"><strong>연습 모드</strong> — 시간 제한과 힌트 없이 풀고, 맞히면 1점입니다. <span class="note">순위표에 기록되지 않음</span></p>
        <h2>카테고리</h2>
```

이렇게 바꾼다:

```html
        <h2>모드</h2>
        <div id="mode-select" class="mode-list">
          <label><input type="radio" name="mode" value="practice" checked> <strong>연습</strong> — 시간 제한과 힌트 없이 풀고, 맞히면 1점</label>
          <label><input type="radio" name="mode" value="speed"> <strong>스피드</strong> — 문항마다 15초, 시간이 다 되면 오답</label>
          <label><input type="radio" name="mode" value="hint"> <strong>힌트</strong> — 문항마다 한 번 오답 2개를 지움, 힌트를 쓰고 맞히면 0.5점</label>
        </div>
        <p id="practice-note" class="note">순위표에 기록되지 않음</p>
        <h2>카테고리</h2>
```

- [ ] **Step 6: `index.html`의 문제 화면 머리에 [힌트] 추가**

이 줄을 찾아서:

```html
        <span id="quiz-progress"></span>
```

아래에 한 줄을 더한다:

```html
        <span id="quiz-progress"></span>
        <button id="hint-button" type="button" hidden>힌트</button>
```

- [ ] **Step 7: `style.css` 끝에 추가**

```css
.mode-list { display: grid; gap: 6px; }
.mode-list label {
  padding: 8px 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
}
#hint-button { margin-left: auto; padding: 4px 14px; }

/* 힌트로 지운 보기: 자리는 남기고 보이지 않게 한다 */
.choice.removed { visibility: hidden; }
```

- [ ] **Step 8: `script.js` 화면 코드 고치기**

`state`에 `usedHint: false,`를 `answered: false,` 아래에 더한다:

```js
  answered: false,
  usedHint: false,
```

`init()`에서 `$("next-button").addEventListener(...)` 줄 앞에 다음을 더한다:

```js
  $("mode-select").addEventListener("change", updatePracticeNote);
  $("hint-button").addEventListener("click", useHint);
  updatePracticeNote();
```

`startRound` 함수 전체를 아래로 바꾸고, 바로 아래에 `selectedMode`, `updatePracticeNote`를 더한다:

```js
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
```

`renderQuestion()`의 `state.answered = false;` 아래에 다음을 더한다:

```js
  state.usedHint = false;
  $("hint-button").hidden = state.mode !== "hint";
  $("hint-button").disabled = false;
```

`answer` 함수 전체를 아래로 바꾸고, 바로 아래에 `recordResult`, `useHint`를 더한다:

```js
function answer(choice) {
  if (state.answered) return; // 빠르게 두 번 눌러도 한 번만 기록
  state.answered = true;
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
```

`revealAnswer()`의 `for` 문 앞에 한 줄을 더한다(답을 고른 뒤 [힌트] 비활성화):

```js
  $("hint-button").disabled = true;
```

- [ ] **Step 9: 자동 검사 확인**

Run: `node --test`
Expected: PASS — 테스트 20개 통과

- [ ] **Step 10: 브라우저 확인**

2단계 확인 항목 1~5, 16(힌트 부분)을 `file://`에서 확인한다.

- [ ] **Step 11: 커밋**

```bash
git add index.html style.css script.js tests/logic.test.js
git commit -m "feat: 모드 선택과 힌트 모드"
```

---

### Task 7: 스피드 모드 타이머

**Files:**
- Modify: `index.html` (`quiz-header` 안)
- Modify: `style.css` (끝에 추가)
- Modify: `script.js`
- Modify: `tests/logic.test.js` (끝에 추가)

**Interfaces:**
- Consumes: Task 6의 `answer`, `recordResult`, `revealAnswer`, `renderQuestion`
- Produces:
  - `SPEED_SECONDS = 15`
  - `remainingSeconds(deadline: number, now: number) → 0 이상의 정수(올림)`
  - `state.deadline: number`, `state.timerId: number | null`
  - `startTimer()`, `stopTimer()`, `tick()`, `timeUp()`
  - HTML id: `quiz-timer`

- [ ] **Step 1: 실패하는 테스트를 `tests/logic.test.js` 끝에 추가**

```js
// ----- 2단계: 스피드 -----

test("remainingSeconds: 마감까지 남은 시간을 올림한 정수 초로 돌려준다", () => {
  const remaining = app("remainingSeconds");
  const now = 1_000_000;
  assert.equal(remaining(now + 15000, now), 15);
  assert.equal(remaining(now + 14001, now), 15);
  assert.equal(remaining(now + 14000, now), 14);
  assert.equal(remaining(now + 1, now), 1);
  assert.equal(remaining(now, now), 0);
  assert.equal(remaining(now - 5000, now), 0); // 다른 탭에 오래 있다 돌아온 경우
});

test("SPEED_SECONDS는 15초다", () => {
  assert.equal(app("SPEED_SECONDS"), 15);
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `node --test`
Expected: FAIL — `ReferenceError: remainingSeconds is not defined`

- [ ] **Step 3: `script.js`의 `QUESTIONS_PER_CATEGORY` 줄 아래에 상수, `pickHintRemovals` 아래에 함수 추가**

```js
const SPEED_SECONDS = 15;
```

```js
// 1초마다 빼서 세지 않고 마감 시각과 현재 시각의 차이로 계산한다(탭이 멈춰도 밀리지 않음)
function remainingSeconds(deadline, now) {
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}
```

- [ ] **Step 4: 테스트가 통과하는지 확인**

Run: `node --test`
Expected: PASS — 테스트 22개 통과

- [ ] **Step 5: `index.html`에 남은 초 표시 추가**

이 줄을 찾아서:

```html
        <button id="hint-button" type="button" hidden>힌트</button>
```

바로 앞에 한 줄을 더한다:

```html
        <span id="quiz-timer" class="timer" hidden></span>
        <button id="hint-button" type="button" hidden>힌트</button>
```

- [ ] **Step 6: `style.css` 끝에 추가**

```css
.timer { font-weight: bold; color: var(--accent); }
```

- [ ] **Step 7: `script.js` 화면 코드 고치기**

`state`의 `usedHint: false,` 아래에 더한다:

```js
  usedHint: false,
  deadline: 0,
  timerId: null,
```

`showScreen` 함수 전체를 아래로 바꾼다(문제 화면을 벗어나면 타이머 정지):

```js
function showScreen(name) {
  if (name !== "quiz") stopTimer();
  for (const section of document.querySelectorAll("main > section")) {
    section.hidden = section.id !== `screen-${name}`;
  }
}
```

`init()`의 `updatePracticeNote();` 아래에 더한다(탭으로 돌아오면 바로 다시 계산):

```js
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && state.timerId !== null) tick();
  });
```

`renderQuestion()`의 끝(`$("feedback").hidden = true;` 아래)에 더한다:

```js
  $("quiz-timer").hidden = state.mode !== "speed";
  if (state.mode === "speed") startTimer();
```

`answer` 함수 전체를 아래로 바꾼다:

```js
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
```

`useHint` 아래에 타이머 함수들을 더한다:

```js
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
```

- [ ] **Step 8: 자동 검사 확인**

Run: `node --test`
Expected: PASS — 테스트 22개 통과

- [ ] **Step 9: 브라우저 확인**

2단계 확인 항목 6~10, 16(타이머 부분)을 `file://`에서 확인한다.

- [ ] **Step 10: 커밋**

```bash
git add index.html style.css script.js tests/logic.test.js
git commit -m "feat: 스피드 모드 타이머"
```

---

### Task 8: 틀린 문제 다시 풀기 (연습 모드)

**Files:**
- Modify: `index.html` (`screen-result` 안)
- Modify: `script.js`
- Modify: `tests/logic.test.js` (끝에 추가)

**Interfaces:**
- Consumes: Task 7까지의 화면 함수
- Produces:
  - `wrongQuestions(items: [{ question }], results: [{ id, correct }]) → 틀린 문항 객체 배열`
  - `state.round: "first" | "retry"`, `state.firstResult: { score, correct, total } | null`, `state.lastWrong: 문항 객체 배열`
  - `beginRound(questions, round)`, `startRetry()`
  - HTML id: `retry-summary`, `retry-button`

- [ ] **Step 1: 실패하는 테스트를 `tests/logic.test.js` 끝에 추가**

```js
// ----- 2단계: 다시 풀기 -----

test("wrongQuestions: 틀린 문항 객체만 돌려준다", () => {
  const wrongQuestions = app("wrongQuestions");
  const qs = makeQuestions().slice(0, 3);
  const items = qs.map((question) => ({ question, choices: question.choices }));
  const results = [
    { id: "history-01", correct: true, usedHint: false },
    { id: "history-02", correct: false, usedHint: false },
    { id: "history-03", correct: false, usedHint: false },
  ];
  assert.deepEqual(plain(wrongQuestions(items, results).map((q) => q.id)), ["history-02", "history-03"]);
});

test("wrongQuestions: 모두 맞히면 빈 배열", () => {
  const wrongQuestions = app("wrongQuestions");
  const qs = makeQuestions().slice(0, 2);
  const items = qs.map((question) => ({ question, choices: question.choices }));
  const results = qs.map((q) => ({ id: q.id, correct: true, usedHint: false }));
  assert.equal(wrongQuestions(items, results).length, 0);
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `node --test`
Expected: FAIL — `ReferenceError: wrongQuestions is not defined`

- [ ] **Step 3: `script.js`의 `remainingSeconds` 아래에 추가**

```js
function wrongQuestions(items, results) {
  const wrongIds = new Set(results.filter((r) => !r.correct).map((r) => r.id));
  return items.map((item) => item.question).filter((q) => wrongIds.has(q.id));
}
```

- [ ] **Step 4: 테스트가 통과하는지 확인**

Run: `node --test`
Expected: PASS — 테스트 24개 통과

- [ ] **Step 5: `index.html`의 결과 화면 고치기**

이 부분을 찾아서:

```html
      <p id="result-practice-note" class="note">순위표에 기록되지 않음</p>
      <div class="actions">
        <button id="home-button" type="button">처음으로</button>
```

이렇게 바꾼다:

```html
      <p id="result-practice-note" class="note">순위표에 기록되지 않음</p>
      <p id="retry-summary" hidden></p>
      <div class="actions">
        <button id="retry-button" type="button" hidden>틀린 문제 다시 풀기</button>
        <button id="home-button" type="button">처음으로</button>
```

- [ ] **Step 6: `script.js` 화면 코드 고치기**

`state`의 `mode: "practice",` 아래에 더한다:

```js
  mode: "practice",
  round: "first",       // "first" | "retry"
  firstResult: null,    // 처음 10문제 결과 { score, correct, total }
  lastWrong: [],        // 직전 판에서 틀린 문항 객체
```

`init()`의 `$("hint-button").addEventListener(...)` 아래에 더한다:

```js
  $("retry-button").addEventListener("click", startRetry);
```

`startRound` 함수 전체를 아래로 바꾸고, 바로 아래에 `startRetry`, `beginRound`를 더한다:

```js
function startRound(category) {
  state.mode = selectedMode();
  state.category = category;
  state.firstResult = null;
  beginRound(questionsOf(QUESTIONS, category), "first");
}

function startRetry() {
  beginRound(state.lastWrong, "retry");
}

function beginRound(questions, round) {
  state.round = round;
  state.items = buildRound(questions);
  state.index = 0;
  state.results = [];
  showScreen("quiz");
  renderQuestion();
}
```

`showResult` 함수 전체를 아래로 바꾼다:

```js
function showResult() {
  const correctCount = state.results.filter((r) => r.correct).length;
  if (state.round === "first") {
    state.firstResult = { score: totalScore(state.results), correct: correctCount, total: state.items.length };
  }
  state.lastWrong = wrongQuestions(state.items, state.results);
  const first = state.firstResult; // 다시 푼 판의 결과는 점수에 반영하지 않는다
  $("result-score").textContent = `${formatScore(first.score)} / ${QUESTIONS_PER_CATEGORY}점`;
  $("result-correct").textContent = `${first.total}문제 중 ${first.correct}개 맞힘`;
  $("result-practice-note").hidden = state.mode !== "practice";
  $("retry-summary").hidden = state.round !== "retry";
  $("retry-summary").textContent = `다시 푼 문제 ${state.items.length}개 중 ${correctCount}개 맞힘`;
  $("retry-button").hidden = !(state.mode === "practice" && state.lastWrong.length > 0);
  showScreen("result");
}
```

- [ ] **Step 7: 자동 검사 확인**

Run: `node --test`
Expected: PASS — 테스트 24개 통과

- [ ] **Step 8: 브라우저 확인**

2단계 확인 항목 11~15를 `file://`에서 확인한다.

- [ ] **Step 9: 커밋**

```bash
git add index.html script.js tests/logic.test.js
git commit -m "feat: 연습 모드 틀린 문제 다시 풀기"
```

---

### Task 9: 2단계 배포와 확인

**Files:** 없음 (배포만)

- [ ] **Step 1: 전체 자동 검사**

Run: `node --test`
Expected: PASS — 테스트 24개 통과, 실패 0

- [ ] **Step 2: 병합하고 올리기** (브라우저 확인을 마친 뒤)

```bash
git switch main
git merge --no-ff stage-2 -m "merge: 구현 2단계(스피드·힌트 모드, 틀린 문제 다시 풀기)"
git push
```

- [ ] **Step 3: Pages 빌드 확인**

Run: `gh api "repos/$(gh api user --jq .login)/Study03_Quiz/pages/builds/latest" --jq .status`
Expected: `built`

- [ ] **Step 4: Pages 주소에서 2단계 확인 항목 1~16을 모두 확인하고, 1단계 항목 3~9도 연습 모드로 다시 확인한다.**

2단계 완료 기준을 모두 체크한다.

---

# 3단계: 점수 저장과 순위표 (교재 5.6)

**만들 것**
- 스피드·힌트 모드 결과 화면: 이름 입력칸과 [저장], 저장 뒤 해당 모드·카테고리 상위 5건 표, 방금 기록이 5위 안이면 그 줄 강조
- 순위표 화면: 스피드·힌트 × 카테고리 4개 = 8개 표, 줄마다 순위·이름·점수·날짜, 기록 없으면 "아직 기록 없음", [처음으로]
- 시작 화면과 결과 화면의 [순위표] 버튼
- localStorage 저장(`study03-quiz:leaderboard`), 저장 실패·값 깨짐 처리(PRD 8장)

**완료 기준 (PRD 9장)**
- [ ] 스피드·힌트 모드가 끝나면 이름을 입력해 저장한다.
- [ ] 8개 표에 상위 5건이 동점 규칙대로 나온다.
- [ ] localStorage를 쓸 수 없을 때도 게임이 된다.
- [ ] `node --test`가 모두 통과한다.
- [ ] Pages 주소에 배포했다.

**내가 브라우저에서 직접 확인할 항목** (`file://`와 Pages 주소 모두. 두 곳의 순위표는 따로 쌓인다 — PRD 11장)
1. 시작 화면에 [순위표]가 있고, 누르면 8개 표가 나오며 기록이 없는 표에는 "아직 기록 없음"이 보인다.
2. 연습 모드 결과 화면에는 이름 입력칸이 없다.
3. 스피드·힌트 모드 결과 화면에 이름 입력칸과 [저장]이 있다. 비어 있거나 공백만 있으면 [저장]이 눌리지 않고, 11자 이상이어도 눌리지 않는다.
4. 이름을 넣고 [저장](또는 Enter)을 누르면 입력칸이 사라지고 그 모드·카테고리의 상위 5건 표가 나오며, 방금 기록한 줄이 강조된다.
5. [저장]이나 Enter를 빠르게 여러 번 눌러도 기록은 한 건만 생긴다.
6. 같은 모드·카테고리로 6판 이상 저장하면 표에 5건만 남고 점수 높은 순이다. 5위 점수보다 낮은 기록은 표에 들어가지 않고 강조되는 줄도 없다.
7. 같은 점수를 두 번 저장하면 먼저 저장한 기록이 위에 있다.
8. 이름에 `<b>굵게</b>`를 넣으면 굵은 글씨가 아니라 그 글자 그대로 보인다.
9. 날짜가 오늘 날짜 `YYYY-MM-DD`로, 힌트 모드 점수는 `7.5점`처럼 나온다.
10. 결과 화면 [순위표] → 8개 표 → [처음으로] → 시작 화면으로 돌아온다.
11. F12 콘솔에서 `localStorage.setItem("study03-quiz:leaderboard", "{깨짐")`을 실행하고 [순위표]를 열면 모든 표가 "아직 기록 없음"이고, 다음 저장 때 정상으로 다시 쌓인다.
12. 브라우저 설정에서 이 사이트의 쿠키·사이트 데이터를 차단하고 새로고침하면, 스피드·힌트 결과 화면과 순위표 화면에 "이 브라우저에서는 기록을 저장할 수 없음"이 나오고 게임은 그대로 할 수 있다. 확인 뒤 설정을 되돌린다.
13. 저장한 뒤 [처음으로] → 다른 판을 끝내면 이름 입력칸이 빈 채로 다시 나온다.

---

### Task 10: 순위 계산 함수

시작 전: `main`에서 `git switch -c stage-3`로 이 단계의 브랜치를 만들고, 어느 브랜치에서 만드는지 사용자에게 먼저 알린다(교재 5.5.1.3 d.1).

**Files:**
- Modify: `script.js` (순수 함수 구역 끝에 추가)
- Modify: `tests/logic.test.js` (끝에 추가)

**Interfaces:**
- Consumes: 없음
- Produces:
  - `STORAGE_KEY = "study03-quiz:leaderboard"`, `BOARD_SIZE = 5`, `RANKED_MODES = ["speed", "hint"]`
  - `boardKey(mode, category) → "speed|한국사"`
  - `normalizeName(raw) → 앞뒤 공백을 지운 이름 | null` (1~10자가 아니면 `null`, 글자 수는 코드 포인트 기준)
  - `formatDate(date: Date) → "YYYY-MM-DD"` (사용자 컴퓨터 시간대)
  - `insertRecord(list, record) → { list: 새 배열(최대 5건), rank: 넣은 위치 0~4 | -1 }`

- [ ] **Step 1: 실패하는 테스트를 `tests/logic.test.js` 끝에 추가**

```js
// ----- 3단계: 순위 계산 -----

const rec = (name, score) => ({ name, score, date: "2026-10-06" });
const names = (list) => plain(list).map((r) => r.name);

test("상수: 저장 키, 표 크기, 기록하는 모드", () => {
  assert.equal(app("STORAGE_KEY"), "study03-quiz:leaderboard");
  assert.equal(app("BOARD_SIZE"), 5);
  assert.deepEqual(plain(app("RANKED_MODES")), ["speed", "hint"]);
});

test("boardKey: 모드|카테고리", () => {
  assert.equal(app("boardKey")("speed", "한국사"), "speed|한국사");
  assert.equal(app("boardKey")("hint", "예술과 문화"), "hint|예술과 문화");
});

test("normalizeName: 앞뒤 공백을 지우고 1~10자만 받는다", () => {
  const normalize = app("normalizeName");
  assert.equal(normalize("  별명 "), "별명");
  assert.equal(normalize(""), null);
  assert.equal(normalize("    "), null);
  assert.equal(normalize("가나다라마바사아자차"), "가나다라마바사아자차");
  assert.equal(normalize("가나다라마바사아자차카"), null);
  assert.equal(normalize("<b>굵게</b>"), "<b>굵게</b>"); // 10자, 글자 그대로 저장
  assert.equal(normalize("😀😀"), "😀😀"); // 이모지는 한 글자로 센다
});

test("formatDate: 사용자 컴퓨터 기준 YYYY-MM-DD", () => {
  const formatDate = app("formatDate");
  assert.equal(formatDate(new Date(2026, 0, 5)), "2026-01-05");
  assert.equal(formatDate(new Date(2026, 11, 31, 23, 59)), "2026-12-31");
});

test("insertRecord: 빈 표에 넣으면 1위", () => {
  const { list, rank } = app("insertRecord")([], rec("가", 7));
  assert.deepEqual(plain(list), [rec("가", 7)]);
  assert.equal(rank, 0);
});

test("insertRecord: 점수가 높은 순으로 넣는다", () => {
  const { list, rank } = app("insertRecord")([rec("가", 9), rec("나", 5)], rec("다", 7));
  assert.deepEqual(names(list), ["가", "다", "나"]);
  assert.equal(rank, 1);
});

test("insertRecord: 동점이면 먼저 세운 기록 아래에 넣는다", () => {
  const { list, rank } = app("insertRecord")([rec("가", 8), rec("나", 8), rec("다", 6)], rec("라", 8));
  assert.deepEqual(names(list), ["가", "나", "라", "다"]);
  assert.equal(rank, 2);
});

test("insertRecord: 5건을 넘으면 버리고, 밖으로 밀리면 rank는 -1", () => {
  const insert = app("insertRecord");
  const full = [rec("a", 10), rec("b", 9), rec("c", 8), rec("d", 7), rec("e", 6)];
  const tie = insert(full, rec("새", 6)); // 5위와 동점 → 그 아래 6위 → 버림
  assert.deepEqual(names(tie.list), ["a", "b", "c", "d", "e"]);
  assert.equal(tie.rank, -1);
  const mid = insert(full, rec("새", 8.5));
  assert.deepEqual(names(mid.list), ["a", "b", "새", "c", "d"]);
  assert.equal(mid.rank, 2);
  assert.equal(full.length, 5); // 원본은 그대로
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `node --test`
Expected: FAIL — `ReferenceError: STORAGE_KEY is not defined` 등 새 테스트 8개 실패

- [ ] **Step 3: `script.js`의 `SPEED_SECONDS` 줄 아래에 상수, `wrongQuestions` 아래에 함수 추가**

```js
const STORAGE_KEY = "study03-quiz:leaderboard";
const BOARD_SIZE = 5;
const RANKED_MODES = ["speed", "hint"];
```

```js
function boardKey(mode, category) {
  return `${mode}|${category}`;
}

// 앞뒤 공백을 지운 뒤 1~10자면 그 이름, 아니면 null
function normalizeName(raw) {
  const name = String(raw).trim();
  const length = Array.from(name).length;
  return length >= 1 && length <= 10 ? name : null;
}

function formatDate(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// 점수가 더 낮은 첫 기록 앞에 넣는다 → 동점이면 기존 기록 아래로 들어간다
function insertRecord(list, record) {
  let index = list.findIndex((r) => r.score < record.score);
  if (index === -1) index = list.length;
  const next = [...list.slice(0, index), record, ...list.slice(index)].slice(0, BOARD_SIZE);
  return { list: next, rank: index < BOARD_SIZE ? index : -1 };
}
```

- [ ] **Step 4: 테스트가 통과하는지 확인**

Run: `node --test`
Expected: PASS — 테스트 32개 통과

- [ ] **Step 5: 커밋**

```bash
git add script.js tests/logic.test.js
git commit -m "feat: 순위 계산 함수"
```

---

### Task 11: 순위표 읽기·쓰기와 예외 처리

**Files:**
- Modify: `script.js` (`insertRecord` 아래에 추가)
- Modify: `tests/logic.test.js` (끝에 추가)

**Interfaces:**
- Consumes: `STORAGE_KEY`, `BOARD_SIZE` (Task 10)
- Produces:
  - `parseBoard(text: string) → 순위표 객체` (깨졌거나 형식이 다르면 `{}`)
  - `readBoard(storage) → { board, available: boolean }` (`storage`가 `null`이거나 예외를 던지면 `available: false`)
  - `writeBoard(storage, board) → boolean`

- [ ] **Step 1: 실패하는 테스트를 `tests/logic.test.js` 끝에 추가**

```js
// ----- 3단계: 순위표 읽기·쓰기 -----

function memoryStorage(initial = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (key) => (Object.hasOwn(data, key) ? data[key] : null),
    setItem: (key, value) => { data[key] = String(value); },
  };
}
const blockedStorage = {
  getItem() { throw new Error("SecurityError"); },
  setItem() { throw new Error("QuotaExceededError"); },
};
const KEY = "study03-quiz:leaderboard";
const sample = { "speed|한국사": [rec("가", 9)], "hint|과학": [rec("나", 7.5)] };

test("parseBoard: 올바른 값은 그대로 읽는다", () => {
  assert.deepEqual(plain(app("parseBoard")(JSON.stringify(sample))), sample);
});

test("parseBoard: 깨졌거나 형식이 다르면 빈 순위표", () => {
  const parse = app("parseBoard");
  const broken = [
    "{깨짐",
    "null",
    "[]",
    '"글자"',
    '{"speed|한국사":"x"}',
    '{"speed|한국사":[{"name":"가","date":"2026-10-06"}]}',
    '{"speed|한국사":[{"name":"가","score":"9","date":"2026-10-06"}]}',
    JSON.stringify({ "speed|한국사": [1, 2, 3, 4, 5, 6].map((n) => rec(`p${n}`, n)) }),
  ];
  for (const text of broken) assert.deepEqual(plain(parse(text)), {}, text);
});

test("readBoard: 저장된 값이 없으면 빈 순위표, 저장 가능", () => {
  assert.deepEqual(plain(app("readBoard")(memoryStorage())), { board: {}, available: true });
});

test("readBoard: 저장된 값을 읽는다", () => {
  const storage = memoryStorage({ [KEY]: JSON.stringify(sample) });
  assert.deepEqual(plain(app("readBoard")(storage)), { board: sample, available: true });
});

test("readBoard: 값이 깨졌으면 빈 순위표지만 저장은 가능", () => {
  const storage = memoryStorage({ [KEY]: "{깨짐" });
  assert.deepEqual(plain(app("readBoard")(storage)), { board: {}, available: true });
});

test("readBoard: 저장소가 막혔거나 없으면 저장 불가", () => {
  const read = app("readBoard");
  assert.deepEqual(plain(read(blockedStorage)), { board: {}, available: false });
  assert.deepEqual(plain(read(null)), { board: {}, available: false });
});

test("writeBoard: 저장하고 다시 읽으면 같다", () => {
  const storage = memoryStorage();
  assert.equal(app("writeBoard")(storage, sample), true);
  assert.equal(storage.data[KEY], JSON.stringify(sample));
  assert.deepEqual(plain(app("readBoard")(storage).board), sample);
});

test("writeBoard: 저장소가 막혔으면 false", () => {
  assert.equal(app("writeBoard")(blockedStorage, sample), false);
  assert.equal(app("writeBoard")(null, sample), false);
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `node --test`
Expected: FAIL — `ReferenceError: parseBoard is not defined` 등 새 테스트 8개 실패

- [ ] **Step 3: `script.js`의 `insertRecord` 아래에 추가**

```js
function isRecord(r) {
  return r !== null && typeof r === "object"
    && typeof r.name === "string"
    && typeof r.score === "number" && Number.isFinite(r.score)
    && typeof r.date === "string";
}

// 저장된 글자를 순위표로 읽는다. 깨졌거나 형식이 다르면 빈 순위표로 본다(PRD 8장)
function parseBoard(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return {};
  }
  if (data === null || typeof data !== "object" || Array.isArray(data)) return {};
  for (const list of Object.values(data)) {
    if (!Array.isArray(list) || list.length > BOARD_SIZE || !list.every(isRecord)) return {};
  }
  return data;
}

// storage가 null이어도 try 안에서 오류가 나므로 같은 길로 처리된다
function readBoard(storage) {
  try {
    const text = storage.getItem(STORAGE_KEY);
    return { board: text === null ? {} : parseBoard(text), available: true };
  } catch (error) {
    console.warn("순위표를 읽을 수 없음:", error);
    return { board: {}, available: false };
  }
}

function writeBoard(storage, board) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(board));
    return true;
  } catch (error) {
    console.warn("순위표를 저장할 수 없음:", error);
    return false;
  }
}
```

- [ ] **Step 4: 테스트가 통과하는지 확인**

Run: `node --test`
Expected: PASS — 테스트 40개 통과 (막힌 저장소 테스트에서 콘솔 경고가 찍히는 것은 정상)

- [ ] **Step 5: 커밋**

```bash
git add script.js tests/logic.test.js
git commit -m "feat: 순위표 읽기·쓰기와 예외 처리"
```

---

### Task 12: 저장 폼과 순위표 화면

**Files:**
- Modify: `index.html` (`start-body`, `screen-result`, 새 `screen-board`)
- Modify: `style.css` (끝에 추가)
- Modify: `script.js` (화면 코드)

**Interfaces:**
- Consumes: Task 10~11의 순위표 함수, Task 8의 `state.firstResult`
- Produces:
  - `state.saved: boolean`
  - `getStorage() → Storage | null`, `onNameInput()`, `saveRecord(event)`, `renderBoardTable(list, highlight = -1) → HTMLElement`, `boardHeading(mode, category) → HTMLElement`, `showBoard()`
  - `showScreen("board")`
  - HTML id: `board-button-start`, `save-form`, `name-input`, `save-button`, `result-storage-warning`, `result-board`, `board-button-result`, `screen-board`, `board-storage-warning`, `board-tables`, `board-home-button`

- [ ] **Step 1: `index.html` 시작 화면에 [순위표] 추가**

이 줄을 찾아서:

```html
        <div id="category-buttons" class="button-grid"></div>
```

아래에 더한다:

```html
        <div id="category-buttons" class="button-grid"></div>
        <div class="actions">
          <button id="board-button-start" type="button">순위표</button>
        </div>
```

- [ ] **Step 2: `index.html` 결과 화면에 저장 폼과 [순위표] 추가**

이 부분을 찾아서:

```html
      <p id="retry-summary" hidden></p>
      <div class="actions">
        <button id="retry-button" type="button" hidden>틀린 문제 다시 풀기</button>
        <button id="home-button" type="button">처음으로</button>
      </div>
```

이렇게 바꾼다:

```html
      <p id="retry-summary" hidden></p>
      <form id="save-form" class="save-form" hidden>
        <label for="name-input">이름(1~10자)</label>
        <input id="name-input" type="text" autocomplete="off">
        <button id="save-button" type="submit" disabled>저장</button>
      </form>
      <p id="result-storage-warning" class="error" hidden>이 브라우저에서는 기록을 저장할 수 없음</p>
      <div id="result-board"></div>
      <div class="actions">
        <button id="retry-button" type="button" hidden>틀린 문제 다시 풀기</button>
        <button id="home-button" type="button">처음으로</button>
        <button id="board-button-result" type="button">순위표</button>
      </div>
```

- [ ] **Step 3: `index.html`에 순위표 화면 추가**

`</main>` 바로 앞에 더한다:

```html
    <section id="screen-board" hidden>
      <h2>순위표</h2>
      <p id="board-storage-warning" class="error" hidden>이 브라우저에서는 기록을 저장할 수 없음</p>
      <div id="board-tables"></div>
      <div class="actions">
        <button id="board-home-button" type="button">처음으로</button>
      </div>
    </section>
```

- [ ] **Step 4: `style.css` 끝에 추가**

```css
.save-form { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 16px 0; }
.save-form input { font: inherit; padding: 8px 10px; border: 1px solid var(--line); border-radius: 8px; }

table { width: 100%; border-collapse: collapse; margin: 8px 0 16px; background: #fff; }
th, td { padding: 6px 10px; border-bottom: 1px solid var(--line); text-align: left; word-break: break-all; }
th { color: var(--muted); font-weight: normal; }
tr.highlight td { background: #fff4c2; font-weight: bold; }
h3 { margin: 16px 0 4px; }
```

- [ ] **Step 5: `script.js` 화면 코드 고치기**

`state`의 `timerId: null,` 아래에 더한다:

```js
  timerId: null,
  saved: false,         // 이번 결과를 이미 저장했는지(두 번 저장 방지)
```

`init()`의 `$("home-button").addEventListener(...)` 아래에 더한다:

```js
  $("name-input").addEventListener("input", onNameInput);
  $("save-form").addEventListener("submit", saveRecord);
  $("board-button-start").addEventListener("click", showBoard);
  $("board-button-result").addEventListener("click", showBoard);
  $("board-home-button").addEventListener("click", () => showScreen("start"));
```

`showResult()`의 마지막 줄 `showScreen("result");` 바로 앞에 더한다:

```js
  const ranked = RANKED_MODES.includes(state.mode);
  const { available } = readBoard(getStorage());
  state.saved = false;
  $("name-input").value = "";
  $("save-button").disabled = true;
  $("result-board").replaceChildren();
  $("save-form").hidden = !ranked || !available;
  $("result-storage-warning").hidden = !ranked || available;
```

`timeUp` 아래에 순위표 함수들을 더한다:

```js
// window.localStorage는 읽는 것만으로 예외가 날 수 있다(쿠키 차단 등)
function getStorage() {
  try {
    return window.localStorage;
  } catch (error) {
    return null;
  }
}

function onNameInput() {
  $("save-button").disabled = normalizeName($("name-input").value) === null;
}

function saveRecord(event) {
  event.preventDefault();
  if (state.saved) return; // Enter·클릭을 여러 번 해도 한 번만 저장
  const name = normalizeName($("name-input").value);
  if (name === null) return;
  const storage = getStorage();
  const { board, available } = readBoard(storage); // 저장 직전에 새로 읽는다
  const key = boardKey(state.mode, state.category);
  const current = Object.hasOwn(board, key) ? board[key] : [];
  const { list, rank } = insertRecord(current, { name, score: state.firstResult.score, date: formatDate(new Date()) });
  board[key] = list;
  $("save-form").hidden = true;
  if (!available || !writeBoard(storage, board)) {
    $("result-storage-warning").hidden = false;
    return;
  }
  state.saved = true;
  $("result-board").replaceChildren(boardHeading(state.mode, state.category), renderBoardTable(list, rank));
}

function boardHeading(mode, category) {
  const heading = document.createElement("h3");
  heading.textContent = `${MODE_LABELS[mode]} · ${category}`;
  return heading;
}

// 이름은 textContent로 넣어 <b> 같은 글자가 HTML로 해석되지 않게 한다
function renderBoardTable(list, highlight = -1) {
  if (list.length === 0) {
    const empty = document.createElement("p");
    empty.className = "note";
    empty.textContent = "아직 기록 없음";
    return empty;
  }
  const table = document.createElement("table");
  const head = table.createTHead().insertRow();
  for (const label of ["순위", "이름", "점수", "날짜"]) {
    const th = document.createElement("th");
    th.textContent = label;
    head.append(th);
  }
  const body = table.createTBody();
  list.forEach((record, i) => {
    const row = body.insertRow();
    if (i === highlight) row.className = "highlight";
    for (const text of [`${i + 1}`, record.name, `${formatScore(record.score)}점`, record.date]) {
      row.insertCell().textContent = text;
    }
  });
  return table;
}

function showBoard() {
  const { board, available } = readBoard(getStorage());
  $("board-storage-warning").hidden = available;
  const box = $("board-tables");
  box.replaceChildren();
  for (const mode of RANKED_MODES) {
    for (const category of CATEGORIES) {
      const key = boardKey(mode, category);
      box.append(boardHeading(mode, category), renderBoardTable(Object.hasOwn(board, key) ? board[key] : []));
    }
  }
  showScreen("board");
}
```

- [ ] **Step 6: 자동 검사 확인**

Run: `node --test`
Expected: PASS — 테스트 40개 통과

- [ ] **Step 7: 브라우저 확인**

3단계 확인 항목 1~13을 `file://`에서 확인한다.

- [ ] **Step 8: 커밋**

```bash
git add index.html style.css script.js
git commit -m "feat: 점수 저장과 순위표 화면"
```

---

### Task 13: 3단계 배포와 전체 확인

**Files:** 없음 (배포만)

- [ ] **Step 1: 전체 자동 검사**

Run: `node --test`
Expected: PASS — 테스트 40개 통과, 실패 0

- [ ] **Step 2: 병합하고 올리기** (브라우저 확인을 마친 뒤)

```bash
git switch main
git merge --no-ff stage-3 -m "merge: 구현 3단계(점수 저장과 순위표)"
git push
```

- [ ] **Step 3: Pages 빌드 확인**

Run: `gh api "repos/$(gh api user --jq .login)/Study03_Quiz/pages/builds/latest" --jq .status`
Expected: `built`

- [ ] **Step 4: Pages 주소에서 3단계 확인 항목 1~13을 확인하고, 2단계 항목 3·8·11·13·16을 다시 확인한다.**

3단계 완료 기준을 모두 체크한다. 다음은 교재 5.7(점검 명령 `/quiz-validate`, `/quiz-add`, `/quiz-daily`)이다.

---

## 교재 5.0.2와 대조

| 교재 항목 | 계획에서 맡은 곳 |
|---|---|
| 코드 파일 4개, 4개 카테고리 × 10문제 | Global Constraints, Task 3·4 |
| GitHub Pages 배포 | Task 5·9·13 |
| 문항과 정답은 Claude가 만들고 출처 확인 | Task 3 Step 3, 사람 확인은 5.4 |
| 연습: 시간·힌트 없음, 1점, 순위표 기록 안 함, 점수는 결과 화면에만, 시작·결과 화면에 "순위표에 기록되지 않음" | Task 4, Task 6(시작 화면 문구) |
| 연습에서만 틀린 문제 다시 풀기 | Task 8 |
| 스피드: 15초, 해설 중 정지, [다음]에서 15초부터 | Task 7 |
| 힌트: 한 번, 오답 2개 지움, 0.5점 | Task 6 |
| 틀리면 모든 모드 0점 | Task 1 `scoreFor` |
| 진행 순서 5.3 → 5.4 → 5.5 → 5.6 → 5.7 | 단계 한눈에 보기, Task 5·13 마지막 단계 |

## 이 계획에서 새로 정한 것 (교재·PRD에 없음)

| 결정 | 이유 |
|---|---|
| 개발용 검사 파일 `tests/` 3개와 `node --test` (Node.js 필요, 설치할 패키지 없음) | 섞기·채점·순위·저장 규칙을 매번 손으로 확인하지 않고 자동으로 확인한다. 앱 코드 파일 4개에는 포함되지 않고 브라우저가 불러오지 않는다 |
| `script.js`를 순수 함수 구역과 화면 구역으로 나누고, 끝에서 `typeof document` 확인 뒤 `init()` | Node에서 순수 함수만 불러와 검사할 수 있다 |
| `.nojekyll` 빈 파일 | Pages가 `.md` 파일을 변환하다 빌드에 실패하는 일을 막는다 |
| 기본 브랜치 이름 `main` | 교재 화면의 `master`와 이름만 다르고 쓰임은 같다 |
| 타이머 화면 갱신 간격 0.2초, 탭으로 돌아오면 즉시 갱신, 마감이 지난 뒤 누른 보기는 시간 초과 | 남은 시간은 마감 시각으로 계산하되(PRD 5.3) 표시가 늦게 바뀌거나 늦게 누른 답이 인정되는 일을 막는다 |
| 출처 링크 글자를 `기관명 (주소)`로 표시 | PRD 성공 기준 2의 "기관명과 주소가 보인다" |
| 저장할 수 없다는 경고는 스피드·힌트 결과 화면에만 | 연습 모드는 원래 저장하지 않으므로 경고가 필요 없다 |
