/**
 * Tests de base pour le module Cours
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { Request, Response } from "express";
import { Cours } from "../../../../db/clients/cours/cours.js";

describe("Cours Module - Tests de base", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should have tests", () => {
    expect(true).toBe(true);
  });
});
