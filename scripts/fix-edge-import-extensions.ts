/**
 * Ensures every relative import in edge-reachable packages uses an explicit `.ts`
 * extension so Supabase's deploy bundler and Deno resolve without sloppy-imports.
 * Apps enable `allowImportingTsExtensions` in tsconfig for tsc compatibility.
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");

export const EDGE_PACKAGES = [
  "core",
  "agents",
  "integrations",
  "events",
  "db",
  "analytics",
  "handlers",
  "intelligence",
] as const;

const RELATIVE_IMPORT =
  /((?:from|export\s+\*?\s*from)\s+["'])(\.[^"']+)(["'])/g;

function targetExtension(spec: string): string {
  if (/\.(ts|tsx|js|jsx|mjs|cjs|json)$/.test(spec)) {
    return spec.replace(/\.(js|jsx)$/, ".ts").replace(/\.tsx$/, ".ts");
  }
  return `${spec}.ts`;
}

function needsExtension(spec: string): boolean {
  if (/\.json$/.test(spec)) return false;
  if (/\.tsx?$/.test(spec)) return false;
  if (/\.(js|jsx|mjs|cjs)$/.test(spec)) return true;
  return true;
}

function addExtensions(source: string): { next: string; changed: boolean } {
  let changed = false;
  const next = source.replace(RELATIVE_IMPORT, (_match, prefix, spec, suffix) => {
    const nextSpec = targetExtension(spec);
    if (nextSpec === spec) return `${prefix}${spec}${suffix}`;
    changed = true;
    return `${prefix}${nextSpec}${suffix}`;
  });
  return { next, changed };
}

async function walkTsFiles(dir: string, out: string[] = []): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walkTsFiles(path, out);
    else if (entry.name.endsWith(".ts")) out.push(path);
  }
  return out;
}

export async function fixEdgeImportExtensions(options?: { dryRun?: boolean }): Promise<number> {
  let filesChanged = 0;

  for (const pkg of EDGE_PACKAGES) {
    const srcDir = join(ROOT, "packages", pkg, "src");
    const files = await walkTsFiles(srcDir);

    for (const file of files) {
      const source = await readFile(file, "utf8");
      const { next, changed } = addExtensions(source);
      if (!changed) continue;
      filesChanged += 1;
      if (!options?.dryRun) {
        await writeFile(file, next, "utf8");
      }
      console.log(`${options?.dryRun ? "[dry-run] " : ""}${file}`);
    }
  }

  return filesChanged;
}

export async function findExtensionlessImports(): Promise<Array<{ file: string; spec: string }>> {
  const violations: Array<{ file: string; spec: string }> = [];

  for (const pkg of EDGE_PACKAGES) {
    const srcDir = join(ROOT, "packages", pkg, "src");
    const files = await walkTsFiles(srcDir);

    for (const file of files) {
      const source = await readFile(file, "utf8");
      for (const match of source.matchAll(RELATIVE_IMPORT)) {
        const spec = match[2]!;
        if (needsExtension(spec)) {
          violations.push({ file, spec });
        }
      }
    }
  }

  return violations;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const check = process.argv.includes("--check");

  if (check) {
    const violations = await findExtensionlessImports();
    if (violations.length === 0) {
      console.log("✓ All edge-package relative imports have explicit extensions.");
      return;
    }
    console.error("Extensionless relative imports in edge packages (deploy will fail):\n");
    for (const v of violations) {
      console.error(`  ${v.file}: "${v.spec}"`);
    }
    process.exit(1);
  }

  const count = await fixEdgeImportExtensions({ dryRun });
  console.log(
    dryRun
      ? `Would update ${count} file(s). Run without --dry-run to apply.`
      : `Updated ${count} file(s).`,
  );
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("fix-edge-import-extensions.ts")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
