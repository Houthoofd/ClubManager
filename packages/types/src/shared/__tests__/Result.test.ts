/**
 * @fileoverview Result Monad Tests
 * @module @clubmanager/types/shared/__tests__/Result
 */

import { Result, Success, Failure } from "../Result.js";

describe("Result Monad", () => {
  describe("Success", () => {
    it("should create a successful result", () => {
      const result = Result.ok(42);

      expect(result.isSuccess()).toBe(true);
      expect(result.isFailure()).toBe(false);
      expect(result._tag).toBe("Success");
      expect(result.value).toBe(42);
    });

    it("should map success value", () => {
      const result = Result.ok(10).map((x) => x * 2);

      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        expect(result.value).toBe(20);
      }
    });

    it("should flatMap to another Result", () => {
      const result = Result.ok(10).flatMap((x) =>
        x > 5 ? Result.ok(x * 2) : Result.fail("Too small"),
      );

      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        expect(result.value).toBe(20);
      }
    });

    it("should unwrap value", () => {
      const result = Result.ok(42);
      expect(result.unwrap()).toBe(42);
    });

    it("should unwrapOr return value", () => {
      const result = Result.ok(42);
      expect(result.unwrapOr(0)).toBe(42);
    });

    it("should unwrapOrElse return value", () => {
      const result = Result.ok(42);
      expect(result.unwrapOrElse(() => 0)).toBe(42);
    });

    it("should match with ok pattern", () => {
      const result = Result.ok(42);
      const output = result.match({
        ok: (value) => `Success: ${value}`,
        err: (error) => `Error: ${error}`,
      });

      expect(output).toBe("Success: 42");
    });

    it("should tap into value without modifying", () => {
      let sideEffect = 0;
      const result = Result.ok(42).tap((value) => {
        sideEffect = value;
      });

      expect(result.isSuccess()).toBe(true);
      expect(sideEffect).toBe(42);
      if (result.isSuccess()) {
        expect(result.value).toBe(42);
      }
    });

    it("should not call tapError for Success", () => {
      let called = false;
      const result = Result.ok(42).tapError(() => {
        called = true;
      });

      expect(called).toBe(false);
      expect(result.isSuccess()).toBe(true);
    });

    it("should chain multiple operations", () => {
      const result = Result.ok(5)
        .map((x) => x + 5)
        .map((x) => x * 2)
        .flatMap((x) => (x > 15 ? Result.ok(x) : Result.fail("Too small")));

      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        expect(result.value).toBe(20);
      }
    });
  });

  describe("Failure", () => {
    it("should create a failed result", () => {
      const result = Result.fail("Something went wrong");

      expect(result.isSuccess()).toBe(false);
      expect(result.isFailure()).toBe(true);
      expect(result._tag).toBe("Failure");
      expect(result.error).toBe("Something went wrong");
    });

    it("should not map failure", () => {
      const result = Result.fail<string>("error").map((x) => x * 2);

      expect(result.isFailure()).toBe(true);
      if (result.isFailure()) {
        expect(result.error).toBe("error");
      }
    });

    it("should mapError to transform error", () => {
      const result = Result.fail("error").mapError((e) => `Wrapped: ${e}`);

      expect(result.isFailure()).toBe(true);
      if (result.isFailure()) {
        expect(result.error).toBe("Wrapped: error");
      }
    });

    it("should not flatMap failure", () => {
      const result = Result.fail<string>("error").flatMap((x) =>
        Result.ok(x * 2),
      );

      expect(result.isFailure()).toBe(true);
      if (result.isFailure()) {
        expect(result.error).toBe("error");
      }
    });

    it("should throw on unwrap", () => {
      const result = Result.fail("error");
      expect(() => result.unwrap()).toThrow("error");
    });

    it("should unwrapOr return default", () => {
      const result = Result.fail("error");
      expect(result.unwrapOr(0)).toBe(0);
    });

    it("should unwrapOrElse compute from error", () => {
      const result = Result.fail("error");
      expect(result.unwrapOrElse((e) => (e as string).length)).toBe(5);
    });

    it("should match with err pattern", () => {
      const result = Result.fail("Something went wrong");
      const output = result.match({
        ok: (value) => `Success: ${value}`,
        err: (error) => `Error: ${error}`,
      });

      expect(output).toBe("Error: Something went wrong");
    });

    it("should not call tap for Failure", () => {
      let called = false;
      const result = Result.fail("error").tap(() => {
        called = true;
      });

      expect(called).toBe(false);
      expect(result.isFailure()).toBe(true);
    });

    it("should tapError into error without modifying", () => {
      let sideEffect = "";
      const result = Result.fail("error").tapError((error) => {
        sideEffect = error;
      });

      expect(result.isFailure()).toBe(true);
      expect(sideEffect).toBe("error");
      if (result.isFailure()) {
        expect(result.error).toBe("error");
      }
    });

    it("should short-circuit on first failure in chain", () => {
      const result = Result.ok(5)
        .flatMap(() => Result.fail("First error"))
        .flatMap(() => Result.fail("Second error"));

      expect(result.isFailure()).toBe(true);
      if (result.isFailure()) {
        expect(result.error).toBe("First error");
      }
    });
  });

  describe("Result.fromThrowable", () => {
    it("should catch thrown errors", () => {
      const result = Result.fromThrowable(() => {
        throw new Error("Oops");
      });

      expect(result.isFailure()).toBe(true);
      if (result.isFailure()) {
        expect(result.error).toBeInstanceOf(Error);
        expect((result.error as Error).message).toBe("Oops");
      }
    });

    it("should return success if no error thrown", () => {
      const result = Result.fromThrowable(() => 42);

      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        expect(result.value).toBe(42);
      }
    });

    it("should use custom error handler", () => {
      const result = Result.fromThrowable(
        () => {
          throw new Error("Original");
        },
        (error) => `Custom: ${(error as Error).message}`,
      );

      expect(result.isFailure()).toBe(true);
      if (result.isFailure()) {
        expect(result.error).toBe("Custom: Original");
      }
    });

    it("should handle JSON.parse errors", () => {
      const result = Result.fromThrowable<any, string>(
        () => JSON.parse("invalid json"),
        (error) => (error as Error).message,
      );

      expect(result.isFailure()).toBe(true);
    });
  });

  describe("Result.fromPromise", () => {
    it("should handle resolved promises", async () => {
      const result = await Result.fromPromise(Promise.resolve(42));

      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        expect(result.value).toBe(42);
      }
    });

    it("should handle rejected promises", async () => {
      const result = await Result.fromPromise(
        Promise.reject(new Error("Failed")),
      );

      expect(result.isFailure()).toBe(true);
      if (result.isFailure()) {
        expect((result.error as Error).message).toBe("Failed");
      }
    });

    it("should use custom error handler for promises", async () => {
      const result = await Result.fromPromise(
        Promise.reject(new Error("Failed")),
        (error) => `Custom: ${(error as Error).message}`,
      );

      expect(result.isFailure()).toBe(true);
      if (result.isFailure()) {
        expect(result.error).toBe("Custom: Failed");
      }
    });

    it("should handle async operations", async () => {
      const fetchData = async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { id: 1, name: "Test" };
      };

      const result = await Result.fromPromise(fetchData());

      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        expect(result.value).toEqual({ id: 1, name: "Test" });
      }
    });
  });

  describe("Result.combine", () => {
    it("should combine multiple successful results", () => {
      const results = [Result.ok(1), Result.ok(2), Result.ok(3)];
      const combined = Result.combine(results);

      expect(combined.isSuccess()).toBe(true);
      if (combined.isSuccess()) {
        expect(combined.value).toEqual([1, 2, 3]);
      }
    });

    it("should return first failure", () => {
      const results = [
        Result.ok(1),
        Result.fail("Error 1"),
        Result.fail("Error 2"),
      ];
      const combined = Result.combine(results);

      expect(combined.isFailure()).toBe(true);
      if (combined.isFailure()) {
        expect(combined.error).toBe("Error 1");
      }
    });

    it("should handle empty array", () => {
      const combined = Result.combine([]);

      expect(combined.isSuccess()).toBe(true);
      if (combined.isSuccess()) {
        expect(combined.value).toEqual([]);
      }
    });
  });

  describe("Result.combineAll", () => {
    it("should combine results of different types", () => {
      const combined = Result.combineAll(
        Result.ok(42),
        Result.ok("hello"),
        Result.ok(true),
      );

      expect(combined.isSuccess()).toBe(true);
      if (combined.isSuccess()) {
        expect(combined.value).toEqual([42, "hello", true]);
      }
    });

    it("should return first failure in combineAll", () => {
      const combined = Result.combineAll(
        Result.ok(42),
        Result.fail("Error!"),
        Result.ok(true),
      );

      expect(combined.isFailure()).toBe(true);
      if (combined.isFailure()) {
        expect(combined.error).toBe("Error!");
      }
    });
  });

  describe("Result.isResult", () => {
    it("should identify Success as Result", () => {
      const result = Result.ok(42);
      expect(Result.isResult(result)).toBe(true);
    });

    it("should identify Failure as Result", () => {
      const result = Result.fail("error");
      expect(Result.isResult(result)).toBe(true);
    });

    it("should reject non-Result values", () => {
      expect(Result.isResult(42)).toBe(false);
      expect(Result.isResult("string")).toBe(false);
      expect(Result.isResult(null)).toBe(false);
      expect(Result.isResult(undefined)).toBe(false);
      expect(Result.isResult({})).toBe(false);
    });
  });

  describe("Type inference", () => {
    it("should infer correct types for Success", () => {
      const result: Result<number, string> = Result.ok(42);

      if (result.isSuccess()) {
        const value: number = result.value;
        expect(value).toBe(42);
      }
    });

    it("should infer correct types for Failure", () => {
      const result: Result<number, string> = Result.fail("error");

      if (result.isFailure()) {
        const error: string = result.error;
        expect(error).toBe("error");
      }
    });

    it("should work with type narrowing", () => {
      function processResult(result: Result<number, string>): string {
        if (result.isSuccess()) {
          return `Value: ${result.value}`;
        } else {
          return `Error: ${result.error}`;
        }
      }

      expect(processResult(Result.ok(42))).toBe("Value: 42");
      expect(processResult(Result.fail("oops"))).toBe("Error: oops");
    });
  });

  describe("Real-world usage examples", () => {
    it("should handle user validation flow", () => {
      interface User {
        email: string;
        age: number;
      }

      function validateEmail(email: string): Result<string, string> {
        return email.includes("@")
          ? Result.ok(email)
          : Result.fail("Invalid email format");
      }

      function validateAge(age: number): Result<number, string> {
        return age >= 18 ? Result.ok(age) : Result.fail("Must be 18 or older");
      }

      function createUser(email: string, age: number): Result<User, string> {
        const emailResult = validateEmail(email);
        if (emailResult.isFailure()) return emailResult as any;

        const ageResult = validateAge(age);
        if (ageResult.isFailure()) return ageResult as any;

        return Result.ok({ email: emailResult.value, age: ageResult.value });
      }

      const validUser = createUser("john@example.com", 25);
      expect(validUser.isSuccess()).toBe(true);

      const invalidEmail = createUser("invalid", 25);
      expect(invalidEmail.isFailure()).toBe(true);

      const tooYoung = createUser("john@example.com", 15);
      expect(tooYoung.isFailure()).toBe(true);
    });

    it("should handle database operations", async () => {
      async function findUserById(id: number): Promise<Result<any, string>> {
        if (id === 1) {
          return Result.ok({ id: 1, name: "John" });
        }
        return Result.fail("User not found");
      }

      const found = await findUserById(1);
      expect(found.isSuccess()).toBe(true);

      const notFound = await findUserById(999);
      expect(notFound.isFailure()).toBe(true);
    });

    it("should handle sequential operations with flatMap", () => {
      function divide(a: number, b: number): Result<number, string> {
        return b === 0 ? Result.fail("Division by zero") : Result.ok(a / b);
      }

      const result = divide(10, 2)
        .flatMap((x) => divide(x, 5))
        .map((x) => x * 100);

      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        expect(result.value).toBe(100);
      }

      const errorResult = divide(10, 0).flatMap((x) => divide(x, 5));
      expect(errorResult.isFailure()).toBe(true);
    });
  });
});
