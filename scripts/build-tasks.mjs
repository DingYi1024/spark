import { formatIssue, readTaskSources, summarizeIssues, writeTaskDatabase } from './task-bank.mjs';

const { database, issues } = readTaskSources();
const { errors, warnings } = summarizeIssues(issues);

for (const issue of errors) {
  console.log(formatIssue(issue));
}

if (errors.length > 0) {
  console.error(`Task bank build failed: ${errors.length} error(s), ${warnings.length} warning(s).`);
  process.exit(1);
}

writeTaskDatabase(database);
if (warnings.length > 0) {
  console.log(`Task bank generated with ${warnings.length} warning(s). Run "npm run tasks:check" for details.`);
}
console.log(
  process.env.WRITE_LEGACY_DATABASE_JS === '1'
    ? 'Task bank generated: static/database.json and static/database.js.'
    : 'Task bank generated: static/database.json.',
);
