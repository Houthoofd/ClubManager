/**
 * @fileoverview Result Monad
 * @module @clubmanager/types/shared/Result
 *
 * Functional error handling with Result pattern (Either monad).
 * Replaces throw/catch with explicit, type-safe error handling.
 *
 * @example
 * ```typescript
 * function parseUser(data: unknown): Result<User, ValidationError> {
 *   const result = createUserSchema.safeParse(data);
 *   if (!result.success) {
 *     return Result.fail(new ValidationError(result.error));
 *   }
 *   return Result.ok(result.data as User);
 * }
 *
 * const userResult = parseUser(rawData);
 * if (userResult.isSuccess()) {
 *   console.log('User:', userResult.value);
 * } else {
 *   console.error('Error:', userResult.error);
 * }
 * ```
 */

/**
 * Success result containing a value
 */
export class Success<T> {
  readonly _tag = "Success" as const;
  readonly isOk = true as const;
  readonly isErr = false as const;

  constructor(readonly value: T) {}

  /**
   * Type guard to check if result is Success
   */
  isSuccess(): this is Success<T> {
    return true;
  }

  /**
   * Type guard to check if result is Failure
   */
  isFailure(): this is Failure<never> {
    return false;
  }

  /**
   * Map the success value to another value
   */
  map<U>(fn: (value: T) => U): Result<U, never> {
    return new Success(fn(this.value));
  }

  /**
   * Map the success value to another Result
   * (flatMap/bind/chain in other languages)
   */
  flatMap<U, E>(fn: (value: T) => Result<U, E>): Result<U, E> {
    return fn(this.value);
  }

  /**
   * Map the error (no-op for Success)
   */
  mapError<F>(_fn: (error: never) => F): Result<T, F> {
    return this as any;
  }

  /**
   * Unwrap the value or throw if Failure
   * WARNING: Use only when you're certain it's a success
   */
  unwrap(): T {
    return this.value;
  }

  /**
   * Unwrap the value or return default
   */
  unwrapOr(_defaultValue: T): T {
    return this.value;
  }

  /**
   * Unwrap the value or compute default from error
   */
  unwrapOrElse(_fn: (error: never) => T): T {
    return this.value;
  }

  /**
   * Match pattern for Result
   */
  match<U>(patterns: { ok: (value: T) => U; err: (error: never) => U }): U {
    return patterns.ok(this.value);
  }

  /**
   * Tap into success value without transforming it (for side effects)
   */
  tap(fn: (value: T) => void): Result<T, never> {
    fn(this.value);
    return this;
  }

  /**
   * Tap into error (no-op for Success)
   */
  tapError(_fn: (error: never) => void): Result<T, never> {
    return this;
  }
}

/**
 * Failure result containing an error
 */
export class Failure<E> {
  readonly _tag = "Failure" as const;
  readonly isOk = false as const;
  readonly isErr = true as const;

  constructor(readonly error: E) {}

  /**
   * Type guard to check if result is Success
   */
  isSuccess(): this is Success<never> {
    return false;
  }

  /**
   * Type guard to check if result is Failure
   */
  isFailure(): this is Failure<E> {
    return true;
  }

  /**
   * Map the success value (no-op for Failure)
   */
  map<U>(_fn: (value: never) => U): Result<U, E> {
    return this as any;
  }

  /**
   * Map the success value to another Result (no-op for Failure)
   */
  flatMap<U, F>(_fn: (value: never) => Result<U, F>): Result<U, E | F> {
    return this as any;
  }

  /**
   * Map the error to another error type
   */
  mapError<F>(fn: (error: E) => F): Result<never, F> {
    return new Failure(fn(this.error));
  }

  /**
   * Unwrap the value or throw if Failure
   * WARNING: Will throw the error
   */
  unwrap(): never {
    throw this.error;
  }

  /**
   * Unwrap the value or return default
   */
  unwrapOr<T>(defaultValue: T): T {
    return defaultValue;
  }

  /**
   * Unwrap the value or compute default from error
   */
  unwrapOrElse<T>(fn: (error: E) => T): T {
    return fn(this.error);
  }

  /**
   * Match pattern for Result
   */
  match<U>(patterns: { ok: (value: never) => U; err: (error: E) => U }): U {
    return patterns.err(this.error);
  }

  /**
   * Tap into success value (no-op for Failure)
   */
  tap<T>(_fn: (value: T) => void): Result<T, E> {
    return this as any;
  }

  /**
   * Tap into error without transforming it (for side effects like logging)
   */
  tapError(fn: (error: E) => void): Result<never, E> {
    fn(this.error);
    return this;
  }
}

/**
 * Result type - either Success or Failure
 */
export type Result<T, E = Error> = Success<T> | Failure<E>;

/**
 * Helper object for creating Results
 */
export const Result = {
  /**
   * Create a successful result
   */
  ok: <T>(value: T): Success<T> => new Success(value),

  /**
   * Create a failed result
   */
  fail: <E>(error: E): Failure<E> => new Failure(error),

  /**
   * Wrap a function that might throw into a Result
   */
  fromThrowable: <T, E = Error>(
    fn: () => T,
    errorHandler?: (error: unknown) => E,
  ): Result<T, E> => {
    try {
      return Result.ok(fn());
    } catch (error) {
      if (errorHandler) {
        return Result.fail(errorHandler(error));
      }
      return Result.fail(error as E);
    }
  },

  /**
   * Wrap an async function that might throw into a Result
   */
  fromPromise: async <T, E = Error>(
    promise: Promise<T>,
    errorHandler?: (error: unknown) => E,
  ): Promise<Result<T, E>> => {
    try {
      const value = await promise;
      return Result.ok(value);
    } catch (error) {
      if (errorHandler) {
        return Result.fail(errorHandler(error));
      }
      return Result.fail(error as E);
    }
  },

  /**
   * Combine multiple Results into one
   * Returns Success with array of values if all succeed
   * Returns first Failure if any fail
   */
  combine: <T, E>(results: Result<T, E>[]): Result<T[], E> => {
    const values: T[] = [];
    for (const result of results) {
      if (result.isFailure()) {
        return result as any;
      }
      values.push(result.value);
    }
    return Result.ok(values);
  },

  /**
   * Combine multiple Results with different types
   * All must succeed or returns first failure
   */
  combineAll: <Results extends Result<any, any>[]>(
    ...results: Results
  ): Result<
    { [K in keyof Results]: Results[K] extends Result<infer T, any> ? T : never },
    Results[number] extends Result<any, infer E> ? E : never
  > => {
    const values: any[] = [];
    for (const result of results) {
      if (result.isFailure()) {
        return result as any;
      }
      values.push(result.value);
    }
    return Result.ok(values as any);
  },

  /**
   * Check if value is a Result
   */
  isResult: <T = any, E = any>(value: unknown): value is Result<T, E> => {
    return (
      value instanceof Success ||
      value instanceof Failure ||
      (typeof value === "object" &&
        value !== null &&
        ("_tag" in value && (value._tag === "Success" || value._tag === "Failure")))
    );
  },
};

/**
 * Type helper to extract success type from Result
 */
export type ResultValue<R> = R extends Result<infer T, any> ? T : never;

/**
 * Type helper to extract error type from Result
 */
export type ResultError<R> = R extends Result<any, infer E> ? E : never;
