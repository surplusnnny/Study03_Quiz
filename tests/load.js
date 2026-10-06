// 생성: 2026-10-06 15:59 KST
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
