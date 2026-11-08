// Used by CI with the actual Pages URL; also supports moving this source to a project site.
import { parse } from "stdlib/yaml";
let value = Deno.args[0];
if (!value) {
  const result = new Deno.Command("git", { args: ["remote", "get-url", "origin"], stdout: "piped" }).outputSync();
  if (!result.success) throw new Error("Cannot read origin; supply the full published HTTPS URL.");
  const remote = new TextDecoder().decode(result.stdout).trim();
  const match = remote.match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/i);
  if (!match) throw new Error("Not a GitHub remote; supply the published HTTPS URL.");
  const [, owner, repo] = match;
  value = `https://${owner.toLowerCase()}.github.io/${repo.toLowerCase() === `${owner.toLowerCase()}.github.io` ? '' : repo + '/'}`;
}
const url = new URL(value);
if (url.protocol !== "https:" || url.search || url.hash || url.username || url.password) throw new Error("Expected a public HTTPS base URL.");
if (!url.pathname.endsWith("/")) url.pathname += "/";
let yaml = Deno.readTextFileSync("_quarto.yml");
yaml = yaml.replace(/^  site-url:.*$/m, `  site-url: "${url.href}"`);
if ((parse(yaml) as any).website["site-url"] !== url.href) throw new Error("Could not safely update website.site-url.");
Deno.writeTextFileSync("_quarto.yml", yaml);
console.log(`Configured website URL: ${url.href}`);
