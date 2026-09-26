/**
 * Renders Jest's `json-summary` coverage report as a Markdown table in the
 * GitHub Actions job summary (#1097).
 *
 * Coverage used to be inspectable only by rerunning the suite locally. This
 * script reads `coverage/coverage-summary.json` (produced by
 * `jest --coverageReporters=json-summary`) and writes a compact table to the
 * file named by `$GITHUB_STEP_SUMMARY`, falling back to stdout so the same
 * command is useful locally.
 *
 * Exits 0 even when coverage is missing: a missing report must not turn a
 * green test run into a red CI run, it should just say so.
 */
import fs from "fs";
import path from "path";

const projectRoot = process.cwd();
const summaryPath = path.join(projectRoot, "coverage", "coverage-summary.json");

const METRICS = ["lines", "statements", "branches", "functions"];

const percent = (value) =>
  typeof value === "number" && Number.isFinite(value) ? `${value.toFixed(2)}%` : "n/a";

/**
 * Splits `coverage/coverage-summary.json` into the aggregate `total` row and
 * the per-file rows, sorted by ascending line coverage so the weakest files
 * are the ones a reviewer looks at first.
 */
const readSummary = () => {
  if (!fs.existsSync(summaryPath)) return null;

  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
  } catch {
    return null;
  }

  const total = parsed.total;
  if (!total) return null;

  const files = Object.entries(parsed)
    .filter(([key]) => key !== "total")
    .map(([file, metrics]) => ({
      file: path.relative(projectRoot, file) || file,
      lines: metrics.lines?.pct,
    }))
    .sort((a, b) => (a.lines ?? 101) - (b.lines ?? 101));

  return { total, files };
};

/** Renders the Markdown table body shared by the summary and stdout fallbacks. */
const renderTable = (total) => {
  const header = "| Metric | Covered | Total | % |\n| --- | ---: | ---: | ---: |";
  const rows = METRICS.map((metric) => {
    const data = total[metric] ?? {};
    return `| ${metric} | ${data.covered ?? "n/a"} | ${data.total ?? "n/a"} | ${percent(data.pct)} |`;
  });

  return [header, ...rows].join("\n");
};

const summary = readSummary();

if (!summary) {
  const message =
    "_No coverage summary found at `coverage/coverage-summary.json`. " +
    "Run `npm run test:ci` locally to reproduce._";
  console.log(message);
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${message}\n`);
  }
  process.exit(0);
}

const weakest = summary.files.slice(0, 10);

const sections = [
  "### Test coverage",
  "",
  renderTable(summary.total),
];

if (weakest.length > 0) {
  sections.push(
    "",
    "<details><summary>Least-covered files (by line %)</summary>",
    "",
    "| File | Lines |",
    "| --- | ---: |",
    ...weakest.map((file) => `| \`${file.file}\` | ${percent(file.lines)} |`),
    "",
    "</details>",
  );
}

sections.push(
  "",
  `Full report: download the \`coverage\` artifact from this workflow run.`,
);
const markdown = sections.join("\n");

if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`);
  console.log("Coverage summary written to $GITHUB_STEP_SUMMARY");
} else {
  console.log(markdown);
}
