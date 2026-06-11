#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const CONTENT_DIR = path.join(ROOT, "content", "source", "carousel");
const REQUIRED_VISUAL_INTENT_FROM_ID = 28;
const HASHTAG_MIN = 20;
const HASHTAG_MAX = 25;

const errors = [];
const warnings = [];

function readCarouselFiles() {
  if (!fs.existsSync(CONTENT_DIR)) {
    errors.push(`Missing carousel source directory: ${path.relative(ROOT, CONTENT_DIR)}`);
    return [];
  }

  return fs
    .readdirSync(CONTENT_DIR)
    .filter((file) => file.endsWith(".md"))
    .sort()
    .map((file) => path.join(CONTENT_DIR, file));
}

function parseJsonBlock(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const match = raw.match(/```json\s*([\s\S]*?)```/);
  if (!match) {
    throw new Error("JSON code block not found");
  }
  return JSON.parse(match[1]);
}

function countHashtags(value) {
  if (!value || typeof value !== "string") return 0;
  return (value.match(/#[^\s#]+/g) || []).length;
}

function charLength(value) {
  return typeof value === "string" ? [...value].length : 0;
}

function validateVisualIntent(fileName, data, numericId) {
  if (!data.visual_intent) {
    const message = `${fileName}: visual_intent is missing`;
    if (numericId >= REQUIRED_VISUAL_INTENT_FROM_ID) errors.push(message);
    else warnings.push(`${message} (legacy schema before DEC-028)`);
    return;
  }

  for (const key of ["hook_type", "emotion", "scene", "focus", "avoid"]) {
    if (data.visual_intent[key] === undefined || data.visual_intent[key] === "") {
      errors.push(`${fileName}: visual_intent.${key} is required`);
    }
  }

  if (!Array.isArray(data.visual_intent.avoid)) {
    errors.push(`${fileName}: visual_intent.avoid must be an array`);
  }

  if (charLength(data.visual_intent.scene) < 40) {
    warnings.push(`${fileName}: visual_intent.scene is very short`);
  }
}

function validateSlides(fileName, data) {
  if (!Array.isArray(data.slides)) {
    errors.push(`${fileName}: slides must be an array`);
    return;
  }

  if (typeof data.total_slides === "number" && data.total_slides !== data.slides.length) {
    errors.push(`${fileName}: total_slides=${data.total_slides}, slides.length=${data.slides.length}`);
  }

  if (data.slides.length < 6 || data.slides.length > 8) {
    warnings.push(`${fileName}: unusual slide count (${data.slides.length})`);
  }

  const first = data.slides[0];
  const last = data.slides[data.slides.length - 1];
  if (!first || first.type !== "cover") {
    errors.push(`${fileName}: first slide must be type=cover`);
  }

  const hasCta = data.slides.some((slide) => slide.type === "cta");
  if (!hasCta) {
    errors.push(`${fileName}: CTA slide is missing`);
  }

  if (!last || last.type !== "caption_card") {
    if (data.caption_card === false) {
      warnings.push(`${fileName}: caption_card intentionally disabled`);
    } else {
      errors.push(`${fileName}: last slide should be type=caption_card`);
    }
  }

  for (const slide of data.slides) {
    if (slide.body && charLength(slide.body) > 120) {
      warnings.push(`${fileName}: slide ${slide.slide} body exceeds 120 chars`);
    }
    if (slide.tip && charLength(slide.tip) > 45) {
      warnings.push(`${fileName}: slide ${slide.slide} tip exceeds 45 chars`);
    }
    if (slide.hook && charLength(slide.hook) > 45) {
      warnings.push(`${fileName}: slide ${slide.slide} hook exceeds 45 chars`);
    }
  }
}

function validateHashtags(fileName, data) {
  let hashtags = data.hashtags;
  const captionSlide = Array.isArray(data.slides)
    ? data.slides.find((slide) => slide.type === "caption_card")
    : null;

  if (!hashtags && captionSlide) {
    hashtags = captionSlide.hashtags;
  }

  const count = countHashtags(hashtags);
  if (count === 0) {
    errors.push(`${fileName}: hashtags are missing`);
    return;
  }

  if (count < HASHTAG_MIN || count > HASHTAG_MAX) {
    warnings.push(`${fileName}: hashtag count is ${count}, expected ${HASHTAG_MIN}-${HASHTAG_MAX}`);
  }

  for (const tag of ["#문장군", "#문장군중문", "#문장군시공"]) {
    if (!hashtags.includes(tag)) {
      warnings.push(`${fileName}: brand hashtag missing: ${tag}`);
    }
  }
}

function validateFile(filePath, seenIds) {
  const fileName = path.basename(filePath);
  let data;

  try {
    data = parseJsonBlock(filePath);
  } catch (error) {
    errors.push(`${fileName}: ${error.message}`);
    return;
  }

  if (!data.id) {
    errors.push(`${fileName}: id is required`);
  } else if (seenIds.has(data.id)) {
    warnings.push(`${fileName}: duplicate id ${data.id}`);
  } else {
    seenIds.add(data.id);
  }

  if (data.format !== "carousel") {
    errors.push(`${fileName}: format must be carousel`);
  }

  const numericId = Number.parseInt(String(data.id), 10);
  if (Number.isNaN(numericId)) {
    errors.push(`${fileName}: id must start with a number`);
  }

  validateVisualIntent(fileName, data, numericId);
  validateSlides(fileName, data);
  validateHashtags(fileName, data);
}

function main() {
  const files = readCarouselFiles();
  const seenIds = new Set();
  files.forEach((file) => validateFile(file, seenIds));

  console.log(`Checked ${files.length} carousel source files.`);
  console.log(`Warnings: ${warnings.length}`);
  warnings.forEach((warning) => console.log(`  WARN ${warning}`));
  console.log(`Errors: ${errors.length}`);
  errors.forEach((error) => console.log(`  ERROR ${error}`));

  process.exit(errors.length > 0 ? 1 : 0);
}

main();
