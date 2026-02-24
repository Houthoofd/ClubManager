/**
 * Tests for message-formatters.ts
 *
 * @file message-formatters.ts
 * @type util
 * @updated Fixed with proper parameters and assertions
 * */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  formatDate,
  formatTime,
  formatDateTime,
  formatRelativeTime,
  normalizeSearchTerm,
  createMessageSearchableString,
  truncateText,
  truncateSubject,
  truncateContent,
  formatSenderName,
  formatRecipientNames,
  formatMessageType,
  isMessageUnread,
  formatUnreadCount,
  groupMessagesByDate,
  sortMessagesByDate,
  formatSearchResultsMessage,
  isValidEmail,
  stripHtml,
} from "../../message-formatters";

describe("formatDate", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(formatDate).toBeDefined();
      expect(typeof formatDate).toBe("function");
    });

    it("should format ISO date string", () => {
      const result = formatDate("2024-01-15");
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it("should format ISO datetime string", () => {
      const result = formatDate("2024-01-15T10:00:00");
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });
  });

  describe("Edge Cases", () => {
    it("should handle invalid date string", () => {
      const result = formatDate("invalid");
      expect(result).toBe("invalid");
    });

    it("should not throw on empty string", () => {
      expect(() => formatDate("")).not.toThrow();
    });
  });
});

describe("formatTime", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(formatTime).toBeDefined();
      expect(typeof formatTime).toBe("function");
    });

    it("should format ISO datetime to time", () => {
      const result = formatTime("2024-01-15T14:30:00");
      expect(result).toMatch(/\d{2}:\d{2}/);
    });

    it("should format another datetime", () => {
      const result = formatTime("2024-01-15T09:15:00");
      expect(result).toMatch(/\d{2}:\d{2}/);
    });
  });

  describe("Edge Cases", () => {
    it("should handle invalid datetime string", () => {
      const result = formatTime("invalid");
      expect(result).toBe("invalid");
    });
  });
});

describe("formatDateTime", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(formatDateTime).toBeDefined();
      expect(typeof formatDateTime).toBe("function");
    });

    it("should format ISO datetime to full format", () => {
      const result = formatDateTime("2024-01-15T14:30:00");
      expect(result).toContain("/");
      expect(result).toContain(":");
    });
  });

  describe("Edge Cases", () => {
    it("should handle invalid datetime string", () => {
      const result = formatDateTime("invalid");
      expect(result).toBe("invalid");
    });
  });
});

describe("formatRelativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(formatRelativeTime).toBeDefined();
      expect(typeof formatRelativeTime).toBe("function");
    });

    it("should format time less than 1 minute", () => {
      const now = new Date("2024-01-15T14:30:00");
      vi.setSystemTime(now);
      const result = formatRelativeTime("2024-01-15T14:29:30");
      expect(result).toBe("À l'instant");
    });

    it("should format time in minutes", () => {
      const now = new Date("2024-01-15T14:30:00");
      vi.setSystemTime(now);
      const result = formatRelativeTime("2024-01-15T14:15:00");
      expect(result).toContain("min");
    });

    it("should format time in hours", () => {
      const now = new Date("2024-01-15T14:30:00");
      vi.setSystemTime(now);
      const result = formatRelativeTime("2024-01-15T12:30:00");
      expect(result).toContain("h");
    });

    it("should format time in days", () => {
      const now = new Date("2024-01-15T14:30:00");
      vi.setSystemTime(now);
      const result = formatRelativeTime("2024-01-13T14:30:00");
      expect(result).toContain("j");
    });

    it("should format old dates with formatDate", () => {
      const now = new Date("2024-01-15T14:30:00");
      vi.setSystemTime(now);
      const result = formatRelativeTime("2024-01-01T14:30:00");
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });
  });
});

describe("normalizeSearchTerm", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(normalizeSearchTerm).toBeDefined();
      expect(typeof normalizeSearchTerm).toBe("function");
    });

    it("should lowercase and trim", () => {
      const result = normalizeSearchTerm("  MESSAGE  ");
      expect(result).toBe("message");
    });

    it("should handle accented characters", () => {
      const result = normalizeSearchTerm("Réunion");
      expect(result).toBe("réunion");
    });
  });
});

describe("createMessageSearchableString", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(createMessageSearchableString).toBeDefined();
      expect(typeof createMessageSearchableString).toBe("function");
    });

    it("should create searchable string from message", () => {
      const result = createMessageSearchableString({
        subject: "Réunion",
        content: "Important meeting",
        senderName: "John Doe",
        type: "info",
      });
      expect(result).toContain("réunion");
      expect(result).toContain("important");
      expect(result).toContain("john");
    });

    it("should handle partial message data", () => {
      const result = createMessageSearchableString({ subject: "Test" });
      expect(result).toContain("test");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty message", () => {
      const result = createMessageSearchableString({});
      expect(result).toBe("   ");
    });
  });
});

describe("truncateText", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(truncateText).toBeDefined();
      expect(typeof truncateText).toBe("function");
    });

    it("should not truncate short text", () => {
      const result = truncateText("Short message", 100);
      expect(result).toBe("Short message");
    });

    it("should truncate long text", () => {
      const longText = "A".repeat(150);
      const result = truncateText(longText);
      expect(result).toContain("...");
      expect(result.length).toBeLessThan(longText.length);
    });

    it("should truncate with custom length", () => {
      const result = truncateText("Long text here", 10);
      expect(result).toContain("...");
      expect(result.length).toBe(13); // 10 + "..."
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty string", () => {
      const result = truncateText("");
      expect(result).toBe("");
    });

    it("should handle null/undefined", () => {
      const result = truncateText(null as any);
      expect(result).toBe("");
    });
  });
});

describe("truncateSubject", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(truncateSubject).toBeDefined();
      expect(typeof truncateSubject).toBe("function");
    });

    it("should truncate subject with default length", () => {
      const longSubject = "A".repeat(60);
      const result = truncateSubject(longSubject);
      expect(result).toContain("...");
    });
  });
});

describe("truncateContent", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(truncateContent).toBeDefined();
      expect(typeof truncateContent).toBe("function");
    });

    it("should truncate content with default length", () => {
      const longContent = "A".repeat(200);
      const result = truncateContent(longContent);
      expect(result).toContain("...");
    });
  });
});

describe("formatSenderName", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(formatSenderName).toBeDefined();
      expect(typeof formatSenderName).toBe("function");
    });

    it("should format sender with English fields", () => {
      const result = formatSenderName({
        first_name: "John",
        last_name: "Doe",
      });
      expect(result).toBe("John Doe");
    });

    it("should format sender with French fields", () => {
      const result = formatSenderName({
        prenom: "Jean",
        nom: "Dupont",
      });
      expect(result).toBe("Jean Dupont");
    });

    it("should fallback to email if no name", () => {
      const result = formatSenderName({
        email: "test@example.com",
      });
      expect(result).toBe("test@example.com");
    });

    it("should return Inconnu for empty sender", () => {
      const result = formatSenderName({});
      expect(result).toBe("Inconnu");
    });
  });
});

describe("formatRecipientNames", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(formatRecipientNames).toBeDefined();
      expect(typeof formatRecipientNames).toBe("function");
    });

    it("should format single recipient", () => {
      const result = formatRecipientNames([{ first_name: "John", last_name: "Doe" }]);
      expect(result).toBe("John Doe");
    });

    it("should format multiple recipients", () => {
      const result = formatRecipientNames([
        { first_name: "John", last_name: "Doe" },
        { first_name: "Jane", last_name: "Smith" },
      ]);
      expect(result).toBe("John Doe, Jane Smith");
    });

    it("should format many recipients with summary", () => {
      const result = formatRecipientNames([
        { first_name: "John", last_name: "Doe" },
        { first_name: "Jane", last_name: "Smith" },
        { first_name: "Bob", last_name: "Martin" },
        { first_name: "Alice", last_name: "Johnson" },
      ]);
      expect(result).toContain("et 2 autres");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty array", () => {
      const result = formatRecipientNames([]);
      expect(result).toBe("Aucun destinataire");
    });

    it("should handle null/undefined", () => {
      const result = formatRecipientNames(null as any);
      expect(result).toBe("Aucun destinataire");
    });
  });
});

describe("formatMessageType", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(formatMessageType).toBeDefined();
      expect(typeof formatMessageType).toBe("function");
    });

    it("should capitalize first letter", () => {
      const result = formatMessageType("info");
      expect(result).toBe("Info");
    });

    it("should handle uppercase type", () => {
      const result = formatMessageType("URGENT");
      expect(result).toBe("Urgent");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty string", () => {
      const result = formatMessageType("");
      expect(result).toBe("");
    });
  });
});

describe("isMessageUnread", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(isMessageUnread).toBeDefined();
      expect(typeof isMessageUnread).toBe("function");
    });

    it("should return true for unread message", () => {
      const result = isMessageUnread({ read: false });
      expect(result).toBe(true);
    });

    it("should return false for read message", () => {
      const result = isMessageUnread({ read: true });
      expect(result).toBe(false);
    });

    it("should handle French field lu", () => {
      const result = isMessageUnread({ lu: false });
      expect(result).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing fields", () => {
      const result = isMessageUnread({});
      expect(result).toBe(true);
    });
  });
});

describe("formatUnreadCount", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(formatUnreadCount).toBeDefined();
      expect(typeof formatUnreadCount).toBe("function");
    });

    it("should return empty string for zero", () => {
      const result = formatUnreadCount(0);
      expect(result).toBe("");
    });

    it("should return count as string", () => {
      const result = formatUnreadCount(5);
      expect(result).toBe("5");
    });

    it("should return 99+ for counts over 99", () => {
      const result = formatUnreadCount(150);
      expect(result).toBe("99+");
    });
  });
});

describe("groupMessagesByDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(groupMessagesByDate).toBeDefined();
      expect(typeof groupMessagesByDate).toBe("function");
    });

    it("should group messages by date", () => {
      const now = new Date("2024-01-15T14:30:00");
      vi.setSystemTime(now);

      const messages = [
        { created_at: "2024-01-15T10:00:00", content: "Today" },
        { created_at: "2024-01-14T10:00:00", content: "Yesterday" },
        { created_at: "2024-01-10T10:00:00", content: "Older" },
      ];

      const result = groupMessagesByDate(messages);
      expect(result.today).toHaveLength(1);
      expect(result.yesterday).toHaveLength(1);
      expect(result.older).toHaveLength(1);
    });

    it("should handle date field instead of created_at", () => {
      const now = new Date("2024-01-15T14:30:00");
      vi.setSystemTime(now);

      const messages = [{ date: "2024-01-15T10:00:00" }];
      const result = groupMessagesByDate(messages);
      expect(result.today).toHaveLength(1);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty array", () => {
      const result = groupMessagesByDate([]);
      expect(result.today).toEqual([]);
      expect(result.yesterday).toEqual([]);
      expect(result.older).toEqual([]);
    });
  });
});

describe("sortMessagesByDate", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(sortMessagesByDate).toBeDefined();
      expect(typeof sortMessagesByDate).toBe("function");
    });

    it("should sort messages newest first", () => {
      const messages = [
        { created_at: "2024-01-10T10:00:00", id: 1 },
        { created_at: "2024-01-15T10:00:00", id: 2 },
        { created_at: "2024-01-12T10:00:00", id: 3 },
      ];

      const result = sortMessagesByDate(messages);
      expect(result[0].id).toBe(2);
      expect(result[1].id).toBe(3);
      expect(result[2].id).toBe(1);
    });

    it("should not mutate original array", () => {
      const messages = [
        { created_at: "2024-01-10T10:00:00" },
        { created_at: "2024-01-15T10:00:00" },
      ];
      const original = [...messages];
      sortMessagesByDate(messages);
      expect(messages).toEqual(original);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty array", () => {
      const result = sortMessagesByDate([]);
      expect(result).toEqual([]);
    });
  });
});

describe("formatSearchResultsMessage", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(formatSearchResultsMessage).toBeDefined();
      expect(typeof formatSearchResultsMessage).toBe("function");
    });

    it("should format singular result", () => {
      const result = formatSearchResultsMessage(1, 10);
      expect(result).toBe("1 message trouvé sur 10");
    });

    it("should format plural results", () => {
      const result = formatSearchResultsMessage(5, 10);
      expect(result).toBe("5 messages trouvés sur 10");
    });

    it("should format zero results", () => {
      const result = formatSearchResultsMessage(0, 10);
      expect(result).toBe("0 message trouvé sur 10");
    });
  });
});

describe("isValidEmail", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(isValidEmail).toBeDefined();
      expect(typeof isValidEmail).toBe("function");
    });

    it("should validate correct email", () => {
      const result = isValidEmail("test@example.com");
      expect(result).toBe(true);
    });

    it("should validate email with subdomain", () => {
      const result = isValidEmail("test@mail.example.com");
      expect(result).toBe(true);
    });

    it("should reject invalid email", () => {
      const result = isValidEmail("invalid-email");
      expect(result).toBe(false);
    });

    it("should reject email without @", () => {
      const result = isValidEmail("testexample.com");
      expect(result).toBe(false);
    });

    it("should reject email without domain", () => {
      const result = isValidEmail("test@");
      expect(result).toBe(false);
    });
  });
});

describe("stripHtml", () => {
  describe("Basic Functionality", () => {
    it("should be defined as a function", () => {
      expect(stripHtml).toBeDefined();
      expect(typeof stripHtml).toBe("function");
    });

    it("should strip HTML tags", () => {
      const result = stripHtml("<p>Hello <strong>world</strong></p>");
      expect(result).toBe("Hello world");
    });

    it("should strip multiple tags", () => {
      const result = stripHtml("<div><p>Text</p><span>More</span></div>");
      expect(result).toBe("TextMore");
    });

    it("should handle plain text", () => {
      const result = stripHtml("Plain text");
      expect(result).toBe("Plain text");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty string", () => {
      const result = stripHtml("");
      expect(result).toBe("");
    });

    it("should handle null/undefined", () => {
      const result = stripHtml(null as any);
      expect(result).toBe("");
    });
  });
});
