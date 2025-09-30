/**
 * Body Composition Calculation Utilities
 *
 * Implementation of various body fat and composition calculation methods
 * based on the formulas from BODY_TEST_FORMULAS.md
 */

import { MeasurementMethod, TrainingLevel, SkinfoldMeasurements } from '../models/BodyMeasurement';

// Input validation
export function validateMeasurement(value: number, type: 'skinfold' | 'weight' | 'height' | 'age'): boolean {
  const ranges = {
    skinfold: { min: 2, max: 50 }, // mm
    weight: { min: 30, max: 300 }, // kg
    height: { min: 120, max: 250 }, // cm
    age: { min: 10, max: 100 }
  };

  const range = ranges[type];
  return value >= range.min && value <= range.max;
}

// Siri Formula - converts body density to body fat percentage
export function siriFormula(bodyDensity: number): number {
  return (495 / bodyDensity) - 450;
}

// Brozek Formula - alternative conversion from body density to body fat percentage
export function brozekFormula(bodyDensity: number): number {
  return (457 / bodyDensity) - 414.2;
}

// 3-Site Skinfold Method
export function calculate3SiteMale(chest: number, abdomen: number, thigh: number, age: number): number {
  const sum = chest + abdomen + thigh;
  const bodyDensity = 1.10938 - 0.0008267 * sum + 0.0000016 * (sum * sum) - 0.0002574 * age;
  return siriFormula(bodyDensity);
}

export function calculate3SiteFemale(triceps: number, suprailiac: number, thigh: number, age: number): number {
  const sum = triceps + suprailiac + thigh;
  const bodyDensity = 1.0994921 - 0.0009929 * sum + 0.0000023 * (sum * sum) - 0.0001392 * age;
  return siriFormula(bodyDensity);
}

// 7-Site Skinfold Method (Jackson-Pollock)
export function calculate7SiteMale(measurements: number[], age: number): number {
  const sum = measurements.reduce((a, b) => a + b, 0);
  const bodyDensity = 1.112 - 0.00043499 * sum + 0.00000055 * (sum * sum) - 0.00028826 * age;
  return siriFormula(bodyDensity);
}

export function calculate7SiteFemale(measurements: number[], age: number): number {
  const sum = measurements.reduce((a, b) => a + b, 0);
  const bodyDensity = 1.097 - 0.00046971 * sum + 0.00000056 * (sum * sum) - 0.00012828 * age;
  return siriFormula(bodyDensity);
}

// 9-Site Skinfold Method (Parillo)
export function calculateParillo9Site(measurements: number[]): number {
  const sum = measurements.reduce((a, b) => a + b, 0);
  const skinfoldConstant = 27; // Typical constant used in Parillo formula
  return (sum * 0.11) + skinfoldConstant;
}

// Durnin-Womersley constants for different age groups and genders
function getDurninConstants(age: number, gender: 'MALE' | 'FEMALE'): { C: number; M: number } {
  if (gender === 'MALE') {
    if (age < 20) return { C: 1.1631, M: 0.0632 };
    if (age < 30) return { C: 1.1422, M: 0.0544 };
    if (age < 40) return { C: 1.1620, M: 0.0700 };
    if (age < 50) return { C: 1.1715, M: 0.0779 };
    return { C: 1.1765, M: 0.0829 };
  } else {
    if (age < 20) return { C: 1.1549, M: 0.0678 };
    if (age < 30) return { C: 1.1599, M: 0.0717 };
    if (age < 40) return { C: 1.1423, M: 0.0632 };
    if (age < 50) return { C: 1.1333, M: 0.0612 };
    return { C: 1.1339, M: 0.0645 };
  }
}

// Durnin-Womersley 9-Site Method
export function calculateDurnin9Site(measurements: number[], age: number, gender: 'MALE' | 'FEMALE'): number {
  const sum = measurements.reduce((a, b) => a + b, 0);
  const { C, M } = getDurninConstants(age, gender);
  const bodyDensity = C - M * Math.log10(sum);
  return siriFormula(bodyDensity);
}

// Main skinfold calculation dispatcher
export function calculateSkinfoldBodyFat(
  measurements: SkinfoldMeasurements,
  method: MeasurementMethod,
  age: number,
  gender: 'MALE' | 'FEMALE'
): number {
  switch (method) {
    case MeasurementMethod.SKINFOLD_3_SITE:
      if (gender === 'MALE') {
        if (!measurements.chest || !measurements.abdomen || !measurements.thigh) {
          throw new Error('3-site male measurement requires chest, abdomen, and thigh measurements');
        }
        return calculate3SiteMale(measurements.chest, measurements.abdomen, measurements.thigh, age);
      } else {
        if (!measurements.triceps || !measurements.suprailiac || !measurements.thigh) {
          throw new Error('3-site female measurement requires triceps, suprailiac, and thigh measurements');
        }
        return calculate3SiteFemale(measurements.triceps, measurements.suprailiac, measurements.thigh, age);
      }

    case MeasurementMethod.SKINFOLD_7_SITE:
      const sites7 = [
        measurements.chest,
        measurements.midaxillary,
        measurements.triceps,
        measurements.subscapular,
        measurements.abdomen,
        measurements.suprailiac,
        measurements.thigh
      ].filter((val): val is number => val !== undefined);

      if (sites7.length !== 7) {
        throw new Error('7-site measurement requires all 7 measurement points');
      }

      return gender === 'MALE'
        ? calculate7SiteMale(sites7, age)
        : calculate7SiteFemale(sites7, age);

    case MeasurementMethod.SKINFOLD_9_SITE:
      const sites9 = [
        measurements.chest,
        measurements.midaxillary,
        measurements.triceps,
        measurements.subscapular,
        measurements.abdomen,
        measurements.suprailiac,
        measurements.thigh,
        measurements.calf,
        measurements.biceps
      ].filter((val): val is number => val !== undefined);

      if (sites9.length !== 9) {
        throw new Error('9-site measurement requires all 9 measurement points');
      }

      return calculateDurnin9Site(sites9, age, gender);

    default:
      throw new Error(`Unsupported skinfold method: ${method}`);
  }
}

// BMR Calculations
export function calculateBMRMifflin(weight: number, height: number, age: number, gender: 'MALE' | 'FEMALE'): number {
  const base = (10 * weight) + (6.25 * height) - (5 * age);
  return gender === 'MALE' ? base + 5 : base - 161;
}

export function calculateBMRHarris(weight: number, height: number, age: number, gender: 'MALE' | 'FEMALE'): number {
  if (gender === 'MALE') {
    return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  } else {
    return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  }
}

export function calculateBMRKatch(leanBodyMass: number): number {
  return 370 + (21.6 * leanBodyMass);
}

// TDEE Calculation
export function calculateTDEE(bmr: number, activityLevel: string): number {
  const activityMultipliers = {
    SEDENTARY: 1.2,        // 久坐
    LIGHTLY_ACTIVE: 1.375,  // 轻度活动
    MODERATELY_ACTIVE: 1.55, // 中度活动
    VERY_ACTIVE: 1.725,     // 高度活动
    EXTRA_ACTIVE: 1.9       // 极度活动
  };

  const multiplier = activityMultipliers[activityLevel as keyof typeof activityMultipliers] || 1.55;
  return bmr * multiplier;
}

// Body composition calculations
export function calculateLeanBodyMass(totalWeight: number, bodyFatPercentage: number): number {
  const fatMass = (totalWeight * bodyFatPercentage) / 100;
  return totalWeight - fatMass;
}

export function calculateFatMass(totalWeight: number, bodyFatPercentage: number): number {
  return (totalWeight * bodyFatPercentage) / 100;
}

export function calculateMuscleMass(leanBodyMass: number): number {
  // Approximate muscle mass as ~50-55% of lean body mass
  // This is a rough estimation as actual muscle mass requires more sophisticated methods
  return leanBodyMass * 0.525;
}

export function calculateTotalBodyWater(leanBodyMass: number): number {
  // Lean body mass is approximately 73% water
  return leanBodyMass * 0.73;
}

// Comprehensive body composition calculation
export interface BodyCompositionResult {
  bodyFatPercentage: number;
  leanBodyMass: number;
  fatMass: number;
  muscleMass: number;
  totalBodyWater: number;
  bmr: number;
  tdee: number;
}

export function calculateBodyComposition(
  weight: number,
  height: number,
  age: number,
  gender: 'MALE' | 'FEMALE',
  bodyFatPercentage: number,
  activityLevel: string
): BodyCompositionResult {
  const leanBodyMass = calculateLeanBodyMass(weight, bodyFatPercentage);
  const fatMass = calculateFatMass(weight, bodyFatPercentage);
  const muscleMass = calculateMuscleMass(leanBodyMass);
  const totalBodyWater = calculateTotalBodyWater(leanBodyMass);

  // Use Katch-McArdle formula for more accurate BMR when body composition is known
  const bmr = calculateBMRKatch(leanBodyMass);
  const tdee = calculateTDEE(bmr, activityLevel);

  return {
    bodyFatPercentage,
    leanBodyMass,
    fatMass,
    muscleMass,
    totalBodyWater,
    bmr,
    tdee
  };
}