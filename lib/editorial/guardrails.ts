export type EditorialIssue = { rule: string; index: number; excerpt: string };

export function editorialIssues(text: string): EditorialIssue[] {
  const issues: EditorialIssue[] = [];
  const add = (rule: string, token: string) => {
    let index = text.indexOf(token);
    while (index >= 0) {
      issues.push({ rule, index, excerpt: text.slice(Math.max(0, index - 36), index + token.length + 36) });
      index = text.indexOf(token, index + token.length);
    }
  };
  add("no-em-dash", "—");
  add("no-buzzword-revolutionary", "revolutionary");
  add("no-buzzword-game-changing", "game-changing");
  add("no-buzzword-empower", "empower");
  return issues;
}

export function assertEditorialRules(text: string, source = "editorial text") {
  const issues = editorialIssues(text);
  if (issues.length) throw new Error(`${source} violates editorial rules: ${issues.map((issue) => issue.rule).join(", ")}`);
}
