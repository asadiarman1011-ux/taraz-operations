import { describe, expect, it } from "vitest";
import { hasPermission } from "./_core/trpc";

describe("grouped inventory permissions", () => {
  const viewOnly = { role: "user", permissionsJson: JSON.stringify({ "انبار": "view" }) } as any;
  const editor = { role: "user", permissionsJson: JSON.stringify({ "انبار": "edit" }) } as any;
  const denied = { role: "user", permissionsJson: JSON.stringify({ "انبار": "none" }) } as any;

  it("allows every inventory read while denying every inventory edit in view-only mode", () => {
    expect(hasPermission(viewOnly, "inventory.view", "view")).toBe(true);
    expect(hasPermission(viewOnly, "inventory.history", "view")).toBe(true);
    expect(hasPermission(viewOnly, "inventory.edit", "edit")).toBe(false);
    expect(hasPermission(viewOnly, "inventory.movements", "edit")).toBe(false);
  });

  it("allows all inventory operations for edit mode", () => {
    expect(hasPermission(editor, "inventory.view", "view")).toBe(true);
    expect(hasPermission(editor, "inventory.edit", "edit")).toBe(true);
    expect(hasPermission(editor, "inventory.movements", "edit")).toBe(true);
  });

  it("blocks all inventory reads and writes without access", () => {
    expect(hasPermission(denied, "inventory.view", "view")).toBe(false);
    expect(hasPermission(denied, "inventory.movements", "edit")).toBe(false);
  });
});
