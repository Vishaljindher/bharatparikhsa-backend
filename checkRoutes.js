const fs = require("fs");
const path = require("path");

function scan(dir) {
  let results = [];
  const list = fs.readdirSync(dir);

  list.forEach((file) => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);

    if (stat && stat.isDirectory()) {
      results = results.concat(scan(file));
    } else if (file.endsWith(".js")) {
      results.push(file);
    }
  });

  return results;
}

const files = scan("./");

console.log("🔎 Scanning routes for invalid patterns...\n");

const routePattern = /router\.(get|post|put|delete)\(([^)]+)\)/g;

files.forEach((file) => {
  const content = fs.readFileSync(file, "utf8");

  let match;
  while ((match = routePattern.exec(content)) !== null) {
    const route = match[2];

    // INVALID if:
    //  - Contains "::"
    //  - Contains ":/" without param
    //  - Contains "/:"
    //  - Contains accidental characters
    if (
      /::/.test(route) ||
      /:\s*['"]/.test(route) ||
      /['"]\s*:/.test(route) ||
      /[^\w\/\-\:\.'", ]/.test(route)
    ) {
      console.log("❌ Invalid route found in:", file);
      console.log("   →", route);
      console.log("-------------------------------");
    }
  }
});
