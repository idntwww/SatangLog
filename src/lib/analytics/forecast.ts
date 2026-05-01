/**
 * Linear Regression สำหรับ Forecasting รายรับ/รายจ่าย
 * ใช้ least squares method ในการคำนวณเส้นตรงที่ fit กับข้อมูลมากที่สุด
 */

export interface DataPoint {
  x: number; // month index (0, 1, 2, ...)
  y: number; // amount
}

export interface RegressionResult {
  slope: number;
  intercept: number;
}

/**
 * คำนวณ Linear Regression (Least Squares Method)
 * @param points - ข้อมูลจุด (x, y) อย่างน้อย 2 จุด
 * @returns slope และ intercept ของเส้นตรง y = slope * x + intercept
 */
export function linearRegression(points: DataPoint[]): RegressionResult {
  const n = points.length;

  if (n === 0) {
    return { slope: 0, intercept: 0 };
  }

  if (n === 1) {
    return { slope: 0, intercept: points[0]!.y };
  }

  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);

  const denominator = n * sumX2 - sumX * sumX;

  // If all x values are the same, slope is 0
  if (denominator === 0) {
    return { slope: 0, intercept: sumY / n };
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

/**
 * พยากรณ์ค่าในอนาคตโดยใช้ Linear Regression
 * @param historicalData - ข้อมูลย้อนหลัง (DataPoint[])
 * @param monthsAhead - จำนวนเดือนที่ต้องการพยากรณ์
 * @returns ค่าพยากรณ์สำหรับแต่ละเดือนข้างหน้า (ไม่ติดลบ)
 */
export function forecast(historicalData: DataPoint[], monthsAhead: number): number[] {
  if (historicalData.length === 0 || monthsAhead <= 0) {
    return [];
  }

  const { slope, intercept } = linearRegression(historicalData);
  const lastX = historicalData[historicalData.length - 1]!.x;

  return Array.from({ length: monthsAhead }, (_, i) => {
    const predicted = slope * (lastX + i + 1) + intercept;
    return Math.max(0, predicted); // ไม่ให้ติดลบ
  });
}
