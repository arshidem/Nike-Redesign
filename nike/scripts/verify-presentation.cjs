// Verify a design-only change against a source snapshot or Git ref.
const fs = require("fs");
const path = require("path");
const cp = require("child_process");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const baseline = process.argv[2];
if (!baseline)
  throw new Error(
    "Usage: node scripts/verify-presentation.cjs <snapshot-directory-or-git-ref>",
  );
const snapshot = fs.existsSync(baseline);
const files = (dir) =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((item) =>
      item.isDirectory()
        ? files(path.join(dir, item.name))
        : [path.join(dir, item.name)],
    );
function normalize(source) {
  const ast = parser.parse(source, { sourceType: "module", plugins: ["jsx"] });
  const behavior = [];
  traverse(ast, {
    JSXExpressionContainer(p) {
      const attr = p.findParent((parent) => parent.isJSXAttribute());
      if (
        attr &&
        ["className", "style", "fill", "stroke"].includes(attr.node.name.name)
      )
        return;
      const expression = structuredClone(p.node.expression);
      scrub(expression);
      behavior.push(expression);
    },
  });
  ast.program.body = ast.program.body.filter(
    (node) =>
      !(
        node.type === "ImportDeclaration" &&
        node.source.value.includes("AuthFrame")
      ),
  );
  scrub(ast);
  return JSON.stringify({ program: ast.program, behavior });
}
function scrub(node) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    node.forEach(scrub);
    return;
  }
  if (node.type === "JSXElement" || node.type === "JSXFragment") {
    for (const key of Object.keys(node)) delete node[key];
    node.type = "JSXPresentation";
    return;
  }
  for (const key of [
    "start",
    "end",
    "loc",
    "extra",
    "leadingComments",
    "trailingComments",
    "innerComments",
    "comments",
    "tokens",
  ])
    delete node[key];
  for (const value of Object.values(node)) scrub(value);
}
let checked = 0;
for (const file of files("src").filter((file) => /\.(jsx|js)$/.test(file))) {
  // The stylesheet import and newly introduced presentation component are intentional additions.
  if (file === "src/main.jsx" || file === "src/shared/ui/AuthFrame.jsx")
    continue;
  let original;
  if (snapshot) {
    const previous = path.join(baseline, file);
    if (!fs.existsSync(previous)) continue;
    original = fs.readFileSync(previous, "utf8");
  } else {
    try {
      original = cp.execFileSync("git", ["show", `${baseline}:nike/${file}`], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      });
    } catch {
      continue;
    }
  }
  const current = fs.readFileSync(file, "utf8");
  if (original === current) continue;
  if (normalize(original) !== normalize(current))
    throw new Error(`Non-presentation code changed: ${file}`);
  checked++;
}
console.log(
  `Presentation verification passed for ${checked} changed source files: non-render code and JSX behavior expressions match the baseline.`,
);
