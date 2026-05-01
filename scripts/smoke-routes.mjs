const baseUrl = process.env.SMOKE_BASE_URL || "http://localhost:3000";
const routes = [
  "/",
  "/providers",
  "/providers/spark-ai-automation",
  "/cases",
  "/cases/b2b-consulting-rag-system",
  "/services",
  "/services/ai-automation",
  "/industries/ecommerce",
  "/diagnosis",
  "/login",
  "/register",
  "/account",
  "/status",
  "/post-demand",
  "/join",
  "/sla",
  "/terms",
  "/privacy",
  "/provider-agreement"
];

const failures = [];

for (const route of routes) {
  const response = await fetch(`${baseUrl}${route}`, { redirect: "follow" });
  const text = await response.text();
  console.log(`${route.padEnd(36)} ${response.status} ${text.length} bytes`);
  if (response.status !== 200) failures.push(`${route} returned ${response.status}`);
  if (text.includes("Application error")) failures.push(`${route} contains Application error`);
}

for (const route of ["/providers/bad-slug", "/cases/bad-slug", "/services/bad-slug", "/industries/bad-slug"]) {
  const response = await fetch(`${baseUrl}${route}`, { redirect: "follow" });
  console.log(`${route.padEnd(36)} ${response.status}`);
  if (response.status !== 404) failures.push(`${route} expected 404, got ${response.status}`);
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}
