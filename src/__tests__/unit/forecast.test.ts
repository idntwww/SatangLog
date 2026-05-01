import { describe, it, expect } from "vitest";
import {
  linearRegression,
  forecast,
  type DataPoint,
} from "@/lib/analytics/forecast";

describe("linearRegression", () => {
  it("should return slope=0 and intercept=0 for empty data", () => {
    const result = linearRegression([]);
    expect(result.slope).toBe(0);
    expect(result.intercept).toBe(0);
  });

  it("should return slope=0 for a single point", () => {
    const result = linearRegression([{ x: 0, y: 100 }]);
    expect(result.slope).toBe(0);
    expect(result.intercept).toBe(100);
  });

  it("should calculate correct slope and intercept for a perfect line", () => {
    // y = 2x + 1 → points: (0,1), (1,3), (2,5), (3,7)
    const points: DataPoint[] = [
      { x: 0, y: 1 },
      { x: 1, y: 3 },
      { x: 2, y: 5 },
      { x: 3, y: 7 },
    ];
    const result = linearRegression(points);
    expect(result.slope).toBeCloseTo(2, 10);
    expect(result.intercept).toBeCloseTo(1, 10);
  });

  it("should handle constant y values (slope = 0)", () => {
    const points: DataPoint[] = [
      { x: 0, y: 5000 },
      { x: 1, y: 5000 },
      { x: 2, y: 5000 },
    ];
    const result = linearRegression(points);
    expect(result.slope).toBeCloseTo(0, 10);
    expect(result.intercept).toBeCloseTo(5000, 10);
  });

  it("should handle decreasing trend", () => {
    // y = -100x + 1000
    const points: DataPoint[] = [
      { x: 0, y: 1000 },
      { x: 1, y: 900 },
      { x: 2, y: 800 },
      { x: 3, y: 700 },
    ];
    const result = linearRegression(points);
    expect(result.slope).toBeCloseTo(-100, 10);
    expect(result.intercept).toBeCloseTo(1000, 10);
  });
});

describe("forecast", () => {
  it("should return empty array for empty data", () => {
    const result = forecast([], 3);
    expect(result).toEqual([]);
  });

  it("should return empty array for monthsAhead <= 0", () => {
    const result = forecast([{ x: 0, y: 100 }], 0);
    expect(result).toEqual([]);
  });

  it("should predict future values based on linear trend", () => {
    // y = 1000x + 5000 → at x=3, next values: 9000, 10000, 11000
    const points: DataPoint[] = [
      { x: 0, y: 5000 },
      { x: 1, y: 6000 },
      { x: 2, y: 7000 },
      { x: 3, y: 8000 },
    ];
    const result = forecast(points, 3);
    expect(result[0]).toBeCloseTo(9000, 5);
    expect(result[1]).toBeCloseTo(10000, 5);
    expect(result[2]).toBeCloseTo(11000, 5);
  });

  it("should clamp negative predictions to 0", () => {
    // Decreasing trend that would go negative
    // y = -500x + 1000 → at x=2, next: 500*(-1)+1000=-500 → clamped to 0
    const points: DataPoint[] = [
      { x: 0, y: 1000 },
      { x: 1, y: 500 },
      { x: 2, y: 0 },
    ];
    const result = forecast(points, 3);
    // x=3: -500*3 + 1000 = -500 → 0
    // x=4: -500*4 + 1000 = -1000 → 0
    // x=5: -500*5 + 1000 = -1500 → 0
    expect(result[0]).toBe(0);
    expect(result[1]).toBe(0);
    expect(result[2]).toBe(0);
  });

  it("should handle constant data (no trend)", () => {
    const points: DataPoint[] = [
      { x: 0, y: 3000 },
      { x: 1, y: 3000 },
      { x: 2, y: 3000 },
    ];
    const result = forecast(points, 2);
    expect(result[0]).toBeCloseTo(3000, 5);
    expect(result[1]).toBeCloseTo(3000, 5);
  });
});
