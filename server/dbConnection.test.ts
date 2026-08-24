import { describe, expect, it } from "vitest";
import { createDatabasePoolOptions } from "./db";

describe("database pool policy", () => {
  it("uses a bounded reusable connection policy with UTC timestamp handling", () => {
    expect(createDatabasePoolOptions("mysql://user:pass@db.example.test:3306/ecosphere")).toMatchObject({
      uri: "mysql://user:pass@db.example.test:3306/ecosphere",
      connectionLimit: 5,
      waitForConnections: true,
      queueLimit: 0,
      enableKeepAlive: true,
      timezone: "Z",
    });
  });
});
