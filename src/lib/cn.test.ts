import { describe, it, expect } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("joins plain class names with a single space", () => {
    expect(cn("px-2", "text-cream")).toBe("px-2 text-cream");
  });

  it("drops falsy values from conditional class lists", () => {
    const active = false;
    const result = cn("base", active && "is-active", undefined, null);
    expect(result).toBe("base");
  });

  it("lets a later tailwind utility win over an earlier conflicting one", () => {
    // tailwind-merge should keep only the last padding utility.
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("keeps non-conflicting tailwind utilities side by side", () => {
    expect(cn("px-4", "text-amber")).toBe("px-4 text-amber");
  });

  it("flattens array and object inputs the way clsx does", () => {
    // Only the truthy object key survives, and tailwind-merge collapses the
    // conflicting display utilities (flex vs block) down to the last one.
    expect(cn(["flex", "gap-2"], { hidden: false, block: true })).toBe(
      "gap-2 block"
    );
  });
});
