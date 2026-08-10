import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createSkillMarkdown, SKILL_DESCRIPTION } from "../src/skill.js";

describe("createSkillMarkdown", () => {
  it("matches the committed skills/pypi-axi/SKILL.md", () => {
    const committed = readFileSync(
      new URL("../skills/pypi-axi/SKILL.md", import.meta.url),
      "utf8"
    );
    expect(committed).toBe(createSkillMarkdown());
  });

  it("starts with valid frontmatter naming the skill and marking it not user-invocable", () => {
    const markdown = createSkillMarkdown();
    expect(markdown.startsWith("---\nname: pypi-axi\n")).toBe(true);
    expect(markdown).toContain(
      `description: ${JSON.stringify(SKILL_DESCRIPTION)}`
    );
    expect(markdown).toContain("user-invocable: false");
  });

  it("teaches npx invocation instead of assuming a global install", () => {
    expect(createSkillMarkdown()).toContain("npx -y pypi-axi");
  });

  it("documents that pypi-axi is read-only and needs no auth", () => {
    const markdown = createSkillMarkdown();
    expect(markdown).toContain("read-only");
    expect(markdown).toContain("no authentication");
  });

  it("includes the command list from the shared top-level help", () => {
    const markdown = createSkillMarkdown();
    expect(markdown).toContain("view <pkg>");
    expect(markdown).toContain("deps <pkg>");
    expect(markdown).toContain("downloads <pkg>");
  });
});
