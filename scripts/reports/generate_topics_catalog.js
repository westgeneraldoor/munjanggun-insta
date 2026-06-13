#!/usr/bin/env node
const path = require("path");
const { ROOT, writeTopicCatalog } = require("../lib/topic_catalog");

const outputPath = path.join(ROOT, "data", "topics", "topics.json");
const catalog = writeTopicCatalog(outputPath);
const counts = catalog.topics.reduce((acc, topic) => {
  acc[topic.state] = (acc[topic.state] || 0) + 1;
  return acc;
}, {});

console.log(`Topic catalog written: ${path.relative(ROOT, outputPath).replace(/\\/g, "/")}`);
console.log(`Topics: ${catalog.topics.length}`);
console.log(
  catalog.state_machine
    .map((state) => `${state}=${counts[state] || 0}`)
    .join(", "),
);
