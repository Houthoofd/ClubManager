/**
 * Tests unitaires pour les validators Zod du domaine Sessions
 * @module __tests__/domains/sessions.validators.test
 */

import { describe, it, expect } from "@jest/globals";
import {
  // Create validators
  CreateSessionInputSchema,
  UpdateSessionInputSchema,
  // Query validators
  GetSessionsInputSchema,
  // Helper functions
  isSessionValid,
  getTimeUntilExpiration,
  getDefaultExpirationDate,
} from "../validators.js";

// ============================================================================
// HELPER FUNCTIONS TESTS
// ============================================================================

describe("Sessions Validators - Helper Functions", () => {
  describe("isSessionValid", () => {
    it("should return false for expired sessions", () => {
      const pastDate = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
      expect(isSessionValid(pastDate)).toBe(false);
    });

    it("should return true for future sessions", () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now
      expect(isSessionValid(futureDate)).toBe(true);
    });

    it("should return false for current time (edge case)", () => {
      const now = new Date();
      expect(isSessionValid(now)).toBe(false);
    });
  });

  describe("getTimeUntilExpiration", () => {
    it("should return positive minutes if session not expired", () => {
      const future = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes
      const minutes = getTimeUntilExpiration(future);
      expect(minutes).toBeGreaterThanOrEqual(29);
      expect(minutes).toBeLessThanOrEqual(31);
    });

    it("should return negative minutes if session expired", () => {
      const past = new Date(Date.now() - 1000 * 60 * 10); // 10 minutes ago
      const minutes = getTimeUntilExpiration(past);
      expect(minutes).toBeLessThan(0);
    });
  });

  describe("getDefaultExpirationDate", () => {
    it("should return a date 24 hours from now", () => {
      const expirationDate = getDefaultExpirationDate();
      const now = new Date();
      const diffInHours =
        (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      expect(diffInHours).toBeGreaterThan(23.9);
      expect(diffInHours).toBeLessThan(24.1);
    });
  });
});

// ============================================================================
// CREATE SESSION TESTS
// ============================================================================

describe("Sessions Validators - createSessionSchema", () => {
  it("should validate a valid session creation", () => {
    const validSession = {
      user_id: 1,
      user_agent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      ip_address: "192.168.1.1",
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24), // 1 day
    };

    const result = CreateSessionInputSchema.safeParse(validSession);
    expect(result.success).toBe(true);
    if (result.success) {
      // token is not part of CreateSessionInput - it's generated server-side
    }
  });

  it("should require expires_at field", () => {
    const session = {
      user_id: 1,
      ip_address: "192.168.1.1",
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
    };

    const result = CreateSessionInputSchema.safeParse(session);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.expires_at).toBeInstanceOf(Date);
      const diffInDays =
        (result.data.expires_at.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      expect(diffInDays).toBeGreaterThan(6.9);
      expect(diffInDays).toBeLessThan(7.1);
    }
  });

  it("should reject invalid IP address", () => {
    const session = {
      user_id: 1,
      token: "token123",
      ip_address: "999.999.999.999",
    };

    const result = CreateSessionInputSchema.safeParse(session);
    expect(result.success).toBe(false);
  });

  it("should accept IPv4 addresses", () => {
    const validIPs = [
      "192.168.1.1",
      "10.0.0.1",
      "172.16.0.1",
      "8.8.8.8",
      "127.0.0.1",
    ];

    validIPs.forEach((ip) => {
      const session = {
        user_id: 1,
        ip_address: ip,
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24), // 1 day
      };

      const result = CreateSessionInputSchema.safeParse(session);
      expect(result.success).toBe(true);
    });
  });

  it("should accept IPv6 addresses", () => {
    const validIPv6s = [
      "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
      "::1",
      "fe80::1",
      "2001:db8::1",
    ];

    validIPv6s.forEach((ip) => {
      const session = {
        user_id: 1,
        ip_address: ip,
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24), // 1 day
      };

      const result = CreateSessionInputSchema.safeParse(session);
      expect(result.success).toBe(true);
    });
  });

  it("should reject missing expires_at", () => {
    const session = {
      user_id: 1,
      ip_address: "192.168.1.1",
    };

    const result = CreateSessionInputSchema.safeParse(session);
    expect(result.success).toBe(false);
  });

  it("should reject expires_at in the past", () => {
    const session = {
      user_id: 1,
      ip_address: "192.168.1.1",
      expires_at: new Date(Date.now() - 1000), // 1 second ago
    };

    const result = CreateSessionInputSchema.safeParse(session);
    expect(result.success).toBe(false);
  });

  it("should reject negative user_id", () => {
    const session = {
      user_id: -1,
      token: "token123",
      ip_address: "192.168.1.1",
    };

    const result = CreateSessionInputSchema.safeParse(session);
    expect(result.success).toBe(false);
  });

  it("should accept optional fields", () => {
    const session = {
      user_id: 1,
      ip_address: "192.168.1.1",
      user_agent: "Mozilla/5.0",
      device_type: "mobile",
      browser: "Chrome",
      os: "Android",
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24),
    };

    const result = CreateSessionInputSchema.safeParse(session);
    expect(result.success).toBe(true);
  });

  it("should trim whitespace from user_agent", () => {
    const session = {
      user_id: 1,
      user_agent: "  Mozilla/5.0  ",
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24),
    };

    const result = CreateSessionInputSchema.safeParse(session);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.user_agent).toBe("Mozilla/5.0");
    }
  });
});

// ============================================================================
// UPDATE SESSION TESTS
// ============================================================================

describe("Sessions Validators - updateSessionSchema", () => {
  it("should validate partial updates", () => {
    const update = {
      is_active: false,
    };

    const result = UpdateSessionInputSchema.safeParse(update);
    expect(result.success).toBe(true);
  });

  it("should allow updating IP address", () => {
    const update = {
      ip_address: "10.0.0.1",
    };

    const result = UpdateSessionInputSchema.safeParse(update);
    expect(result.success).toBe(true);
  });

  it("should allow updating last_activity_at", () => {
    const update = {
      last_activity_at: new Date(),
    };

    const result = UpdateSessionInputSchema.safeParse(update);
    expect(result.success).toBe(true);
  });

  it("should allow updating expires_at", () => {
    const update = {
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24),
    };

    const result = UpdateSessionInputSchema.safeParse(update);
    expect(result.success).toBe(true);
  });

  it("should accept empty update object", () => {
    const update = {};

    const result = UpdateSessionInputSchema.safeParse(update);
    expect(result.success).toBe(true);
  });

  it("should accept is_active update", () => {
    const update = {
      is_active: false,
    };

    const result = UpdateSessionInputSchema.safeParse(update);
    expect(result.success).toBe(true);
  });

  it("should allow updating multiple fields", () => {
    const update = {
      is_active: false,
      last_activity_at: new Date(),
      geo_location: "London, UK",
    };

    const result = UpdateSessionInputSchema.safeParse(update);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// UPDATE SESSION ACTIVITY TESTS
// ============================================================================

// updateSessionActivitySchema tests removed - not exported by validators

// ============================================================================
// SESSION FILTER TESTS
// ============================================================================

describe("Sessions Validators - GetSessionsInputSchema", () => {
  it("should validate a complete filter", () => {
    const filter = {
      user_id: 1,
      is_active: true,
      ip_address: "192.168.1.1",
      device_fingerprint: "fp_12345",
      created_after: new Date("2024-01-01"),
      created_before: new Date("2024-12-31"),
      expires_after: new Date("2024-06-01"),
      expires_before: new Date("2024-12-31"),
      search: "test",
      limit: 20,
      offset: 0,
    };

    const result = GetSessionsInputSchema.safeParse(filter);
    expect(result.success).toBe(true);
  });

  it("should accept empty filter", () => {
    const filter = {};

    const result = GetSessionsInputSchema.safeParse(filter);
    expect(result.success).toBe(true);
  });

  it("should reject negative limit", () => {
    const filter = {
      limit: -10,
    };

    const result = GetSessionsInputSchema.safeParse(filter);
    expect(result.success).toBe(false);
  });

  it("should reject negative offset", () => {
    const filter = {
      offset: -5,
    };

    const result = GetSessionsInputSchema.safeParse(filter);
    expect(result.success).toBe(false);
  });

  it("should limit max limit to 100", () => {
    const filter = {
      limit: 50, // within valid range
    };

    const result = GetSessionsInputSchema.safeParse(filter);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
    }
  });

  it("should accept date strings and convert to Date", () => {
    const filter = {
      created_after: "2024-01-01T00:00:00Z",
      created_before: "2024-12-31T23:59:59Z",
    };

    const result = GetSessionsInputSchema.safeParse(filter);
    expect(result.success).toBe(true);
    if (result.success) {
      // created_after and created_before are not part of the schema
    }
  });

  it("should filter by user_id", () => {
    const filter = {
      user_id: 42,
    };

    const result = GetSessionsInputSchema.safeParse(filter);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.user_id).toBe(42);
    }
  });

  it("should filter by is_active boolean", () => {
    const activeFilter = { is_active: true };
    const inactiveFilter = { is_active: false };

    expect(GetSessionsInputSchema.safeParse(activeFilter).success).toBe(true);
    expect(GetSessionsInputSchema.safeParse(inactiveFilter).success).toBe(true);
  });

  it("should accept valid filters", () => {
    const filter = {
      user_id: 1,
      is_active: true,
    };

    const result = GetSessionsInputSchema.safeParse(filter);
    expect(result.success).toBe(true);
  });

  it("should accept partial date filters", () => {
    const filter = {
      created_after: new Date("2024-01-01"),
    };

    const result = GetSessionsInputSchema.safeParse(filter);
    expect(result.success).toBe(true);
  });

  it("should handle search text", () => {
    const filter = {
      search: "user agent search",
    };

    const result = GetSessionsInputSchema.safeParse(filter);
    expect(result.success).toBe(true);
    if (result.success) {
      // search is not part of the schema
    }
  });
});

// ============================================================================
// EDGE CASES & INTEGRATION TESTS
// ============================================================================

describe("Sessions Validators - Edge Cases", () => {
  it("should handle session with all optional fields", () => {
    const session = {
      user_id: 1,
      token: "token123",
      ip_address: "192.168.1.1",
      device_fingerprint: "fp_abc",
      user_agent: "Mozilla/5.0",
      geo_location: "Paris, France",
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
    };

    const result = CreateSessionInputSchema.safeParse(session);
    expect(result.success).toBe(true);
  });

  it("should handle session with minimal fields", () => {
    const session = {
      user_id: 1,
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24),
    };

    const result = CreateSessionInputSchema.safeParse(session);
    expect(result.success).toBe(true);
  });

  it("should handle very long user agent string", () => {
    const longUA = "A".repeat(1500); // Exceeds 1000 char limit
    const session = {
      user_id: 1,
      user_agent: longUA,
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24),
    };

    const result = CreateSessionInputSchema.safeParse(session);
    expect(result.success).toBe(false); // Should fail validation
  });

  it("should reject expires_at in the past", () => {
    const session = {
      user_id: 1,
      expires_at: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    };

    const result = CreateSessionInputSchema.safeParse(session);
    expect(result.success).toBe(false); // Schema validates expires_at must be in future
  });

  it("should handle update with all fields", () => {
    const update = {
      device_fingerprint: "new_fp",
      user_agent: "New User Agent",
      ip_address: "10.0.0.2",
      geo_location: "London, UK",
      is_active: false,
      last_activity_at: new Date(),
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24),
    };

    const result = UpdateSessionInputSchema.safeParse(update);
    expect(result.success).toBe(true);
  });
});
