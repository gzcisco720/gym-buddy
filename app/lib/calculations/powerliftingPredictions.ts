/**
 * Powerlifting Prediction Calculations
 *
 * Implementation of 1RM prediction formulas and strength predictions
 * based on body composition and training level
 */

import { TrainingLevel } from '../models/BodyMeasurement';

// 1RM Prediction Formulas
export function epleyFormula(weight: number, reps: number): number {
  return weight * (1 + reps / 30);
}

export function brzyckiFormula(weight: number, reps: number): number {
  return weight * (36 / (37 - reps));
}

export function oconnerFormula(weight: number, reps: number): number {
  return weight * (1 + 0.025 * reps);
}

// Calculate average 1RM from multiple formulas for better accuracy
export function calculate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  if (reps > 15) throw new Error('Rep range too high for accurate 1RM prediction (max 15 reps)');

  const epley = epleyFormula(weight, reps);
  const brzycki = brzyckiFormula(weight, reps);
  const oconner = oconnerFormula(weight, reps);

  // Return weighted average (Brzycki is generally considered most accurate for lower reps)
  if (reps <= 5) {
    return (brzycki * 0.5 + epley * 0.3 + oconner * 0.2);
  } else {
    return (epley * 0.4 + brzycki * 0.4 + oconner * 0.2);
  }
}

// Body composition based strength predictions
export function predictBenchPress(leanBodyMass: number, trainingLevel: TrainingLevel = TrainingLevel.INTERMEDIATE): number {
  const multipliers = {
    [TrainingLevel.BEGINNER]: 1.2,
    [TrainingLevel.INTERMEDIATE]: 1.6,
    [TrainingLevel.ADVANCED]: 2.0,
    [TrainingLevel.ELITE]: 2.2
  };
  return leanBodyMass * multipliers[trainingLevel];
}

export function predictSquat(leanBodyMass: number, trainingLevel: TrainingLevel = TrainingLevel.INTERMEDIATE): number {
  const multipliers = {
    [TrainingLevel.BEGINNER]: 1.8,
    [TrainingLevel.INTERMEDIATE]: 2.2,
    [TrainingLevel.ADVANCED]: 2.8,
    [TrainingLevel.ELITE]: 3.2
  };
  return leanBodyMass * multipliers[trainingLevel];
}

export function predictDeadlift(leanBodyMass: number, trainingLevel: TrainingLevel = TrainingLevel.INTERMEDIATE): number {
  const multipliers = {
    [TrainingLevel.BEGINNER]: 2.0,
    [TrainingLevel.INTERMEDIATE]: 2.5,
    [TrainingLevel.ADVANCED]: 3.0,
    [TrainingLevel.ELITE]: 3.5
  };
  return leanBodyMass * multipliers[trainingLevel];
}

// Wilks coefficient calculation for powerlifting scoring
// Updated coefficients based on the 2020 revision
export function calculateWilksCoefficient(bodyweight: number, gender: 'MALE' | 'FEMALE'): number {
  let a, b, c, d, e, f;

  if (gender === 'MALE') {
    a = -216.0475144;
    b = 16.2606339;
    c = -0.002388645;
    d = -0.00113732;
    e = 7.01863e-6;
    f = -1.291e-8;
  } else {
    a = 594.31747775582;
    b = -27.23842536447;
    c = 0.82112226871;
    d = -0.00930733913;
    e = 4.731582e-5;
    f = -9.054e-8;
  }

  const x = bodyweight;
  const denominator = a + b * x + c * x * x + d * x * x * x + e * x * x * x * x + f * x * x * x * x * x;

  return 600 / denominator;
}

// Calculate Wilks score
export function calculateWilksScore(total: number, bodyweight: number, gender: 'MALE' | 'FEMALE'): number {
  const coefficient = calculateWilksCoefficient(bodyweight, gender);
  return total * coefficient;
}

// Alternative strength standards based on bodyweight ratios
export function getStrengthStandards(bodyweight: number, gender: 'MALE' | 'FEMALE') {
  const standards = {
    MALE: {
      BEGINNER: { bench: 1.0, squat: 1.25, deadlift: 1.5 },
      INTERMEDIATE: { bench: 1.25, squat: 1.75, deadlift: 2.0 },
      ADVANCED: { bench: 1.5, squat: 2.25, deadlift: 2.5 },
      ELITE: { bench: 2.0, squat: 2.75, deadlift: 3.0 }
    },
    FEMALE: {
      BEGINNER: { bench: 0.5, squat: 1.0, deadlift: 1.25 },
      INTERMEDIATE: { bench: 0.75, squat: 1.25, deadlift: 1.5 },
      ADVANCED: { bench: 1.0, squat: 1.75, deadlift: 2.0 },
      ELITE: { bench: 1.25, squat: 2.25, deadlift: 2.5 }
    }
  };

  const genderStandards = standards[gender];

  return Object.fromEntries(
    Object.entries(genderStandards).map(([level, ratios]) => [
      level,
      {
        bench: ratios.bench * bodyweight,
        squat: ratios.squat * bodyweight,
        deadlift: ratios.deadlift * bodyweight,
        total: (ratios.bench + ratios.squat + ratios.deadlift) * bodyweight
      }
    ])
  );
}

// Comprehensive powerlifting prediction
export interface PowerliftingPredictionResult {
  benchPress1RM: number;
  squat1RM: number;
  deadlift1RM: number;
  total: number;
  wilksScore: number;
  strengthStandards: ReturnType<typeof getStrengthStandards>;
}

export function calculatePowerliftingPredictions(
  leanBodyMass: number,
  totalBodyweight: number,
  trainingLevel: TrainingLevel,
  gender: 'MALE' | 'FEMALE'
): PowerliftingPredictionResult {
  // Base predictions on lean body mass
  const benchPress1RM = predictBenchPress(leanBodyMass, trainingLevel);
  const squat1RM = predictSquat(leanBodyMass, trainingLevel);
  const deadlift1RM = predictDeadlift(leanBodyMass, trainingLevel);
  const total = benchPress1RM + squat1RM + deadlift1RM;

  // Calculate Wilks score
  const wilksScore = calculateWilksScore(total, totalBodyweight, gender);

  // Get strength standards for comparison
  const strengthStandards = getStrengthStandards(totalBodyweight, gender);

  return {
    benchPress1RM,
    squat1RM,
    deadlift1RM,
    total,
    wilksScore,
    strengthStandards
  };
}

// Performance category classification
export function classifyPerformance(
  lift: 'bench' | 'squat' | 'deadlift' | 'total',
  value: number,
  bodyweight: number,
  gender: 'MALE' | 'FEMALE'
): string {
  const standards = getStrengthStandards(bodyweight, gender);

  if (value >= standards.ELITE[lift]) return 'ELITE';
  if (value >= standards.ADVANCED[lift]) return 'ADVANCED';
  if (value >= standards.INTERMEDIATE[lift]) return 'INTERMEDIATE';
  if (value >= standards.BEGINNER[lift]) return 'BEGINNER';
  return 'NOVICE';
}

// Calculate relative strength (lift/bodyweight ratio)
export function calculateRelativeStrength(liftWeight: number, bodyweight: number): number {
  return liftWeight / bodyweight;
}

// Progression estimates based on training level
export function estimateStrengthGains(
  currentTotal: number,
  trainingLevel: TrainingLevel,
  timeframeDays: number = 365
): number {
  // Annual strength gain rates by training level
  const annualGainRates = {
    [TrainingLevel.BEGINNER]: 0.40,     // 40% per year
    [TrainingLevel.INTERMEDIATE]: 0.15,  // 15% per year
    [TrainingLevel.ADVANCED]: 0.05,     // 5% per year
    [TrainingLevel.ELITE]: 0.02         // 2% per year
  };

  const dailyRate = annualGainRates[trainingLevel] / 365;
  const projectedGain = currentTotal * (dailyRate * timeframeDays);

  return currentTotal + projectedGain;
}

// Training volume recommendations based on strength level
export function getTrainingVolumeRecommendations(trainingLevel: TrainingLevel) {
  const recommendations = {
    [TrainingLevel.BEGINNER]: {
      frequency: '3-4 days/week',
      setsPerLift: '3-4 sets',
      repRange: '5-8 reps',
      intensity: '70-85% 1RM',
      focusAreas: ['Form', 'Consistency', 'Progressive Overload']
    },
    [TrainingLevel.INTERMEDIATE]: {
      frequency: '4-5 days/week',
      setsPerLift: '4-6 sets',
      repRange: '3-6 reps',
      intensity: '75-90% 1RM',
      focusAreas: ['Periodization', 'Weak Points', 'Technique Refinement']
    },
    [TrainingLevel.ADVANCED]: {
      frequency: '5-6 days/week',
      setsPerLift: '5-8 sets',
      repRange: '1-5 reps',
      intensity: '80-95% 1RM',
      focusAreas: ['Competition Prep', 'Peak Strength', 'Advanced Periodization']
    },
    [TrainingLevel.ELITE]: {
      frequency: '6+ days/week',
      setsPerLift: '6-10 sets',
      repRange: '1-4 reps',
      intensity: '85-100% 1RM',
      focusAreas: ['Competition Strategy', 'Peak Performance', 'Recovery Optimization']
    }
  };

  return recommendations[trainingLevel];
}