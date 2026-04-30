import { formatIssue, readTaskSources, summarizeIssues } from './task-bank.mjs';

const { issues } = readTaskSources();
const { errors, warnings } = summarizeIssues(issues);
const maxWarningsToPrint = 50;

for (const issue of errors) {
  console.log(formatIssue(issue));
}

for (const issue of warnings.slice(0, maxWarningsToPrint)) {
  console.log(formatIssue(issue));
}

if (warnings.length > maxWarningsToPrint) {
  console.log(`[WARNING] ... ${warnings.length - maxWarningsToPrint} more warning(s) hidden.`);
}

if (errors.length > 0) {
  console.error(`Task bank check failed: ${errors.length} error(s), ${warnings.length} warning(s).`);
  process.exit(1);
}

console.log(`Task bank check passed: ${warnings.length} warning(s).`);
