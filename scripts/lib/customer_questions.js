const fs = require("fs");
const path = require("path");

function readJson(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalizeItemPath(root, itemPath) {
  return path.isAbsolute(itemPath) ? itemPath : path.join(root, itemPath);
}

function loadCustomerQuestionBank(root = path.resolve(__dirname, "..", "..")) {
  const bankPath = path.join(root, "data", "questions", "CUSTOMER_QUESTION_BANK.json");
  const bank = readJson(bankPath, { questions: [], question_index: [] });

  if (Array.isArray(bank.questions)) {
    return { ...bank, questions: bank.questions };
  }

  const questions = [];
  const index = Array.isArray(bank.question_index) ? bank.question_index : [];

  for (const row of index) {
    const itemPath = row.item_path || `data/questions/items/${row.id}.json`;
    const fullPath = normalizeItemPath(root, itemPath);
    const item = readJson(fullPath, {});
    questions.push({
      ...row,
      ...item,
      item_path: itemPath.replace(/\\/g, "/"),
    });
  }

  return { ...bank, questions };
}

module.exports = {
  loadCustomerQuestionBank,
};
