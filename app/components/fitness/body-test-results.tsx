"use client";

import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface BodyTestResultsProps {
  results: {
    measurement: {
      bodyComposition: {
        bodyFatPercentage: number;
        leanBodyMass: number;
        fatMass: number;
        muscleMass: number;
        totalBodyWater: number;
        bmr: number;
        tdee: number;
      };
      powerliftingPredictions: {
        benchPress1RM: number;
        squat1RM: number;
        deadlift1RM: number;
        total: number;
        wilksScore: number;
      };
      weight: number;
      gender: 'MALE' | 'FEMALE';
      trainingLevel: string;
    };
    strengthStandards: {
      [key: string]: {
        bench: number;
        squat: number;
        deadlift: number;
        total: number;
      };
    };
  };
}

export default function BodyTestResults({ results }: BodyTestResultsProps) {
  const { measurement, strengthStandards } = results;
  const { bodyComposition, powerliftingPredictions } = measurement;

  // Function to get performance level for a lift
  const getPerformanceLevel = (liftValue: number, liftType: 'bench' | 'squat' | 'deadlift' | 'total') => {
    const standards = Object.entries(strengthStandards);
    for (const [level, values] of standards) {
      if (liftValue >= values[liftType]) {
        return level;
      }
    }
    return 'NOVICE';
  };

  // Function to get body fat category
  const getBodyFatCategory = (bodyFat: number, gender: 'MALE' | 'FEMALE') => {
    const categories = {
      MALE: [
        { min: 0, max: 6, label: 'Essential Fat', color: 'bg-red-500' },
        { min: 6, max: 13, label: 'Athletes', color: 'bg-green-500' },
        { min: 13, max: 17, label: 'Fitness', color: 'bg-blue-500' },
        { min: 17, max: 25, label: 'Average', color: 'bg-yellow-500' },
        { min: 25, max: 100, label: 'Obese', color: 'bg-red-500' }
      ],
      FEMALE: [
        { min: 0, max: 13, label: 'Essential Fat', color: 'bg-red-500' },
        { min: 13, max: 20, label: 'Athletes', color: 'bg-green-500' },
        { min: 20, max: 24, label: 'Fitness', color: 'bg-blue-500' },
        { min: 24, max: 31, label: 'Average', color: 'bg-yellow-500' },
        { min: 31, max: 100, label: 'Obese', color: 'bg-red-500' }
      ]
    };

    const category = categories[gender].find(cat => bodyFat >= cat.min && bodyFat < cat.max);
    return category || { label: 'Unknown', color: 'bg-gray-500' };
  };

  const bodyFatCategory = getBodyFatCategory(bodyComposition.bodyFatPercentage, measurement.gender);

  return (
    <div className="space-y-6">
      {/* Body Composition Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-default-900">Body Composition</h3>
          <Badge color="secondary" className={`${bodyFatCategory.color} text-white`}>
            {bodyFatCategory.label}
          </Badge>
        </div>

        {/* Body Fat Percentage - Main Metric */}
        <div className="bg-default-50 rounded-lg p-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-default-900">
              {bodyComposition.bodyFatPercentage.toFixed(1)}%
            </div>
            <div className="text-sm text-default-600">Body Fat Percentage</div>
          </div>
          <div className="mt-3">
            <Progress
              value={bodyComposition.bodyFatPercentage}
              max={40}
              className="h-2"
            />
          </div>
        </div>

        {/* Detailed Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm text-default-600">Lean Body Mass</div>
            <div className="text-lg font-semibold text-default-900">
              {bodyComposition.leanBodyMass.toFixed(1)} kg
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-default-600">Fat Mass</div>
            <div className="text-lg font-semibold text-default-900">
              {bodyComposition.fatMass.toFixed(1)} kg
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-default-600">Muscle Mass</div>
            <div className="text-lg font-semibold text-default-900">
              {bodyComposition.muscleMass.toFixed(1)} kg
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-default-600">Body Water</div>
            <div className="text-lg font-semibold text-default-900">
              {bodyComposition.totalBodyWater.toFixed(1)} kg
            </div>
          </div>
        </div>

        {/* Metabolism */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-default-200">
          <div className="space-y-2">
            <div className="text-sm text-default-600">BMR</div>
            <div className="text-lg font-semibold text-default-900">
              {Math.round(bodyComposition.bmr)} kcal/day
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-default-600">TDEE</div>
            <div className="text-lg font-semibold text-default-900">
              {Math.round(bodyComposition.tdee)} kcal/day
            </div>
          </div>
        </div>
      </div>

      {/* Powerlifting Predictions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-default-900">Strength Predictions</h3>
          <Badge variant="outline">
            {measurement.trainingLevel}
          </Badge>
        </div>

        {/* Main Lifts */}
        <div className="space-y-4">
          {[
            { name: 'Bench Press', value: powerliftingPredictions.benchPress1RM, key: 'bench' as const },
            { name: 'Squat', value: powerliftingPredictions.squat1RM, key: 'squat' as const },
            { name: 'Deadlift', value: powerliftingPredictions.deadlift1RM, key: 'deadlift' as const }
          ].map((lift) => {
            const level = getPerformanceLevel(lift.value, lift.key);
            const relative = (lift.value / measurement.weight).toFixed(2);

            return (
              <div key={lift.key} className="bg-default-50 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium text-default-900">{lift.name}</div>
                    <div className="text-sm text-default-600">
                      {relative}x bodyweight
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-default-900">
                      {lift.value.toFixed(0)} kg
                    </div>
                    <Badge color="secondary" className="text-xs">
                      {level}
                    </Badge>
                  </div>
                </div>

                {/* Progress bar showing relative to elite standard */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-default-600 mb-1">
                    <span>Novice</span>
                    <span>Elite</span>
                  </div>
                  <Progress
                    value={(lift.value / strengthStandards.ELITE[lift.key]) * 100}
                    max={100}
                    className="h-2"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Total and Wilks */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-default-200">
          <div className="space-y-2">
            <div className="text-sm text-default-600">Total</div>
            <div className="text-xl font-bold text-default-900">
              {powerliftingPredictions.total.toFixed(0)} kg
            </div>
            <Badge color="secondary" className="text-xs">
              {getPerformanceLevel(powerliftingPredictions.total, 'total')}
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-default-600">Wilks Score</div>
            <div className="text-xl font-bold text-default-900">
              {powerliftingPredictions.wilksScore.toFixed(1)}
            </div>
            <div className="text-xs text-default-600">
              {powerliftingPredictions.wilksScore >= 400 ? 'Elite' :
               powerliftingPredictions.wilksScore >= 300 ? 'Advanced' :
               powerliftingPredictions.wilksScore >= 200 ? 'Intermediate' : 'Beginner'}
            </div>
          </div>
        </div>
      </div>

      {/* Standards Comparison */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-default-900">Strength Standards</h3>

        <div className="bg-default-50 rounded-lg p-4 space-y-3">
          <div className="text-sm text-default-600">
            Strength standards for {measurement.weight}kg {measurement.gender.toLowerCase()}
          </div>

          <div className="space-y-2">
            {Object.entries(strengthStandards).map(([level, values]) => (
              <div key={level} className="flex justify-between items-center text-sm">
                <span className="font-medium capitalize">{level.toLowerCase()}</span>
                <div className="flex space-x-4 text-default-600">
                  <span>{values.bench.toFixed(0)}kg</span>
                  <span>{values.squat.toFixed(0)}kg</span>
                  <span>{values.deadlift.toFixed(0)}kg</span>
                  <span className="font-medium">{values.total.toFixed(0)}kg</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center text-xs text-default-500 border-t border-default-200 pt-2">
            <span>Level</span>
            <div className="flex space-x-4">
              <span>Bench</span>
              <span>Squat</span>
              <span>Deadlift</span>
              <span>Total</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}