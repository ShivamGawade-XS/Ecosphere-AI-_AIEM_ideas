import { describe, expect, it } from "vitest";
import { isExplicitPublicStorageKey, organizationIdFromStorageKey } from "./storageProxy";

describe("managed storage authorization helpers", () => {
  it("allows only the explicit public application-asset allowlist", () => {
    expect(isExplicitPublicStorageKey("ecosphere-field-marker_4829d44d.png")).toBe(true);
    expect(isExplicitPublicStorageKey("organizations/8/actions/71/evidence.pdf")).toBe(false);
    expect(isExplicitPublicStorageKey("generated/untrusted.png")).toBe(false);
  });

  it("extracts a tenant scope only from canonical organization storage keys", () => {
    expect(organizationIdFromStorageKey("organizations/8/actions/71/evidence.pdf")).toBe(8);
    expect(organizationIdFromStorageKey("organizations/08/actions/71/evidence.pdf")).toBeUndefined();
    expect(organizationIdFromStorageKey("../../organizations/8/evidence.pdf")).toBeUndefined();
  });
});
