"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Form schema
const bodyTestSchema = z.object({
  weight: z.number().min(30, 'Weight must be at least 30kg').max(300, 'Weight cannot exceed 300kg'),
  height: z.number().min(120, 'Height must be at least 120cm').max(250, 'Height cannot exceed 250cm'),
  age: z.number().min(13, 'Age must be at least 13').max(100, 'Age cannot exceed 100'),
  gender: z.enum(['MALE', 'FEMALE'], { required_error: 'Please select gender' }),
  measurementMethod: z.enum(['SKINFOLD_3_SITE', 'SKINFOLD_7_SITE', 'SKINFOLD_9_SITE', 'MANUAL_INPUT'], {
    required_error: 'Please select measurement method'
  }),
  trainingLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ELITE']).default('INTERMEDIATE'),
  activityLevel: z.enum(['SEDENTARY', 'LIGHTLY_ACTIVE', 'MODERATELY_ACTIVE', 'VERY_ACTIVE', 'EXTRA_ACTIVE'])
    .default('MODERATELY_ACTIVE'),

  // Skinfold measurements (conditional based on method)
  skinfoldMeasurements: z.object({
    chest: z.number().min(2).max(50).optional(),
    abdomen: z.number().min(2).max(50).optional(),
    thigh: z.number().min(2).max(50).optional(),
    triceps: z.number().min(2).max(50).optional(),
    subscapular: z.number().min(2).max(50).optional(),
    suprailiac: z.number().min(2).max(50).optional(),
    midaxillary: z.number().min(2).max(50).optional(),
    calf: z.number().min(2).max(50).optional(),
    biceps: z.number().min(2).max(50).optional(),
  }).optional(),

  // Manual input
  manualBodyFatPercentage: z.number().min(1).max(60).optional(),

  notes: z.string().max(500).optional(),
});

type BodyTestFormData = z.infer<typeof bodyTestSchema>;

interface BodyTestFormProps {
  onTestComplete?: (results: any) => void;
}

export default function BodyTestForm({ onTestComplete }: BodyTestFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [measurementMethod, setMeasurementMethod] = useState<string>('');
  const [todayMeasurement, setTodayMeasurement] = useState<any>(null);
  const [hasToday, setHasToday] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<BodyTestFormData>({
    resolver: zodResolver(bodyTestSchema),
    defaultValues: {
      trainingLevel: 'INTERMEDIATE',
      activityLevel: 'MODERATELY_ACTIVE',
    }
  });

  const watchedMethod = watch('measurementMethod');
  const watchedGender = watch('gender');

  // Check for today's measurement on component mount
  useEffect(() => {
    const checkTodayMeasurement = async () => {
      try {
        const response = await fetch('/api/body-test/today');
        const result = await response.json();

        if (result.success) {
          setHasToday(result.hasToday);
          setTodayMeasurement(result.todayMeasurement);
        }
      } catch (error) {
        console.error('Error checking today measurement:', error);
      }
    };

    checkTodayMeasurement();
  }, []);

  const onSubmit = async (data: BodyTestFormData) => {
    setIsLoading(true);

    try {
      // Validate method-specific requirements
      if (data.measurementMethod === 'MANUAL_INPUT' && !data.manualBodyFatPercentage) {
        toast.error('Please enter body fat percentage for manual input method');
        return;
      }

      if (data.measurementMethod.includes('SKINFOLD')) {
        const required3Site = data.gender === 'MALE'
          ? ['chest', 'abdomen', 'thigh']
          : ['triceps', 'suprailiac', 'thigh'];

        const required7Site = ['chest', 'midaxillary', 'triceps', 'subscapular', 'abdomen', 'suprailiac', 'thigh'];
        const required9Site = ['chest', 'midaxillary', 'triceps', 'subscapular', 'abdomen', 'suprailiac', 'thigh', 'calf', 'biceps'];

        let requiredFields: string[] = [];

        if (data.measurementMethod === 'SKINFOLD_3_SITE') {
          requiredFields = required3Site;
        } else if (data.measurementMethod === 'SKINFOLD_7_SITE') {
          requiredFields = required7Site;
        } else if (data.measurementMethod === 'SKINFOLD_9_SITE') {
          requiredFields = required9Site;
        }

        const missingFields = requiredFields.filter(field =>
          !data.skinfoldMeasurements ||
          !(data.skinfoldMeasurements as any)[field]
        );

        if (missingFields.length > 0) {
          toast.error(`Missing required skinfold measurements: ${missingFields.join(', ')}`);
          return;
        }
      }

      const response = await fetch('/api/body-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process body test');
      }

      // Show appropriate success message
      const message = result.message || 'Body test completed successfully!';
      toast.success(message);

      if (onTestComplete) {
        onTestComplete(result.data);
      }

      // Refresh today's measurement status after successful submission
      if (result.success) {
        setHasToday(true);
        if (result.data.measurement) {
          setTodayMeasurement(result.data.measurement);
        }
      }

      // Optionally reset form
      // reset();

    } catch (error: any) {
      console.error('Body test error:', error);
      toast.error(error.message || 'Failed to process body test');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Today's Measurement Notice */}
      {hasToday && todayMeasurement && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-800">
                You already have a measurement for today
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Current: {todayMeasurement.bodyComposition?.bodyFatPercentage?.toFixed(1)}% body fat, {todayMeasurement.weight}kg
                </p>
                <p className="mt-1">
                  Submitting a new test will <strong>replace</strong> today&apos;s existing data.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Measurements */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-default-900">Basic Measurements</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="weight" className={cn("", { "text-destructive": errors.weight })}>
              Weight (kg) *
            </Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              {...register("weight", { valueAsNumber: true })}
              placeholder="e.g. 70.5"
              className={cn("", { "border-destructive focus:border-destructive": errors.weight })}
            />
            {errors.weight && (
              <p className="text-xs text-destructive">{errors.weight.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="height" className={cn("", { "text-destructive": errors.height })}>
              Height (cm) *
            </Label>
            <Input
              id="height"
              type="number"
              {...register("height", { valueAsNumber: true })}
              placeholder="e.g. 175"
              className={cn("", { "border-destructive focus:border-destructive": errors.height })}
            />
            {errors.height && (
              <p className="text-xs text-destructive">{errors.height.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="age" className={cn("", { "text-destructive": errors.age })}>
              Age *
            </Label>
            <Input
              id="age"
              type="number"
              {...register("age", { valueAsNumber: true })}
              placeholder="e.g. 25"
              className={cn("", { "border-destructive focus:border-destructive": errors.age })}
            />
            {errors.age && (
              <p className="text-xs text-destructive">{errors.age.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className={cn("", { "text-destructive": errors.gender })}>Gender *</Label>
            <RadioGroup
              onValueChange={(value) => setValue('gender', value as 'MALE' | 'FEMALE')}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="MALE" id="male" />
                <Label htmlFor="male" className="cursor-pointer">Male</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="FEMALE" id="female" />
                <Label htmlFor="female" className="cursor-pointer">Female</Label>
              </div>
            </RadioGroup>
            {errors.gender && (
              <p className="text-xs text-destructive">{errors.gender.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Measurement Method */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-default-900">Measurement Method</h3>

        <div className="space-y-2">
          <Label className={cn("", { "text-destructive": errors.measurementMethod })}>
            Method *
          </Label>
          <Select onValueChange={(value) => {
            setValue('measurementMethod', value as any);
            setMeasurementMethod(value);
          }}>
            <SelectTrigger className={cn("", { "border-destructive": errors.measurementMethod })}>
              <SelectValue placeholder="Select measurement method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SKINFOLD_3_SITE">3-Site Skinfold (Quick)</SelectItem>
              <SelectItem value="SKINFOLD_7_SITE">7-Site Skinfold (Accurate)</SelectItem>
              <SelectItem value="SKINFOLD_9_SITE">9-Site Skinfold (Most Accurate)</SelectItem>
              <SelectItem value="MANUAL_INPUT">Manual Input</SelectItem>
            </SelectContent>
          </Select>
          {errors.measurementMethod && (
            <p className="text-xs text-destructive">{errors.measurementMethod.message}</p>
          )}
        </div>

        {/* Method-specific inputs */}
        {watchedMethod === 'MANUAL_INPUT' && (
          <div className="space-y-2">
            <Label htmlFor="manualBodyFatPercentage">Body Fat Percentage (%) *</Label>
            <Input
              id="manualBodyFatPercentage"
              type="number"
              step="0.1"
              min="1"
              max="60"
              {...register("manualBodyFatPercentage", { valueAsNumber: true })}
              placeholder="e.g. 15.5"
            />
          </div>
        )}

        {/* Skinfold Measurements */}
        {(watchedMethod === 'SKINFOLD_3_SITE' || watchedMethod === 'SKINFOLD_7_SITE' || watchedMethod === 'SKINFOLD_9_SITE') && (
          <div className="space-y-4">
            <h4 className="font-medium text-default-800">Skinfold Measurements (mm)</h4>

            {watchedMethod === 'SKINFOLD_3_SITE' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {watchedGender === 'MALE' ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="chest">Chest *</Label>
                      <Input
                        id="chest"
                        type="number"
                        step="0.5"
                        {...register("skinfoldMeasurements.chest", { valueAsNumber: true })}
                        placeholder="mm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="abdomen">Abdomen *</Label>
                      <Input
                        id="abdomen"
                        type="number"
                        step="0.5"
                        {...register("skinfoldMeasurements.abdomen", { valueAsNumber: true })}
                        placeholder="mm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="thigh">Thigh *</Label>
                      <Input
                        id="thigh"
                        type="number"
                        step="0.5"
                        {...register("skinfoldMeasurements.thigh", { valueAsNumber: true })}
                        placeholder="mm"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="triceps">Triceps *</Label>
                      <Input
                        id="triceps"
                        type="number"
                        step="0.5"
                        {...register("skinfoldMeasurements.triceps", { valueAsNumber: true })}
                        placeholder="mm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="suprailiac">Suprailiac *</Label>
                      <Input
                        id="suprailiac"
                        type="number"
                        step="0.5"
                        {...register("skinfoldMeasurements.suprailiac", { valueAsNumber: true })}
                        placeholder="mm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="thigh">Thigh *</Label>
                      <Input
                        id="thigh"
                        type="number"
                        step="0.5"
                        {...register("skinfoldMeasurements.thigh", { valueAsNumber: true })}
                        placeholder="mm"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {watchedMethod === 'SKINFOLD_7_SITE' && (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="chest">Chest *</Label>
                  <Input
                    id="chest"
                    type="number"
                    step="0.5"
                    {...register("skinfoldMeasurements.chest", { valueAsNumber: true })}
                    placeholder="mm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="midaxillary">Mid-axillary *</Label>
                  <Input
                    id="midaxillary"
                    type="number"
                    step="0.5"
                    {...register("skinfoldMeasurements.midaxillary", { valueAsNumber: true })}
                    placeholder="mm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="triceps">Triceps *</Label>
                  <Input
                    id="triceps"
                    type="number"
                    step="0.5"
                    {...register("skinfoldMeasurements.triceps", { valueAsNumber: true })}
                    placeholder="mm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subscapular">Subscapular *</Label>
                  <Input
                    id="subscapular"
                    type="number"
                    step="0.5"
                    {...register("skinfoldMeasurements.subscapular", { valueAsNumber: true })}
                    placeholder="mm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="abdomen">Abdomen *</Label>
                  <Input
                    id="abdomen"
                    type="number"
                    step="0.5"
                    {...register("skinfoldMeasurements.abdomen", { valueAsNumber: true })}
                    placeholder="mm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="suprailiac">Suprailiac *</Label>
                  <Input
                    id="suprailiac"
                    type="number"
                    step="0.5"
                    {...register("skinfoldMeasurements.suprailiac", { valueAsNumber: true })}
                    placeholder="mm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="thigh">Thigh *</Label>
                  <Input
                    id="thigh"
                    type="number"
                    step="0.5"
                    {...register("skinfoldMeasurements.thigh", { valueAsNumber: true })}
                    placeholder="mm"
                  />
                </div>
              </div>
            )}

            {watchedMethod === 'SKINFOLD_9_SITE' && (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="chest">Chest *</Label>
                  <Input
                    id="chest"
                    type="number"
                    step="0.5"
                    {...register("skinfoldMeasurements.chest", { valueAsNumber: true })}
                    placeholder="mm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="midaxillary">Mid-axillary *</Label>
                  <Input
                    id="midaxillary"
                    type="number"
                    step="0.5"
                    {...register("skinfoldMeasurements.midaxillary", { valueAsNumber: true })}
                    placeholder="mm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="triceps">Triceps *</Label>
                  <Input
                    id="triceps"
                    type="number"
                    step="0.5"
                    {...register("skinfoldMeasurements.triceps", { valueAsNumber: true })}
                    placeholder="mm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subscapular">Subscapular *</Label>
                  <Input
                    id="subscapular"
                    type="number"
                    step="0.5"
                    {...register("skinfoldMeasurements.subscapular", { valueAsNumber: true })}
                    placeholder="mm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="abdomen">Abdomen *</Label>
                  <Input
                    id="abdomen"
                    type="number"
                    step="0.5"
                    {...register("skinfoldMeasurements.abdomen", { valueAsNumber: true })}
                    placeholder="mm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="suprailiac">Suprailiac *</Label>
                  <Input
                    id="suprailiac"
                    type="number"
                    step="0.5"
                    {...register("skinfoldMeasurements.suprailiac", { valueAsNumber: true })}
                    placeholder="mm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="thigh">Thigh *</Label>
                  <Input
                    id="thigh"
                    type="number"
                    step="0.5"
                    {...register("skinfoldMeasurements.thigh", { valueAsNumber: true })}
                    placeholder="mm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="calf">Calf *</Label>
                  <Input
                    id="calf"
                    type="number"
                    step="0.5"
                    {...register("skinfoldMeasurements.calf", { valueAsNumber: true })}
                    placeholder="mm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="biceps">Biceps *</Label>
                  <Input
                    id="biceps"
                    type="number"
                    step="0.5"
                    {...register("skinfoldMeasurements.biceps", { valueAsNumber: true })}
                    placeholder="mm"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Training Context */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-default-900">Training Context</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Training Level</Label>
            <Select onValueChange={(value) => setValue('trainingLevel', value as any)} defaultValue="INTERMEDIATE">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BEGINNER">Beginner (0-1 years)</SelectItem>
                <SelectItem value="INTERMEDIATE">Intermediate (1-3 years)</SelectItem>
                <SelectItem value="ADVANCED">Advanced (3-5 years)</SelectItem>
                <SelectItem value="ELITE">Elite (5+ years)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Activity Level</Label>
            <Select onValueChange={(value) => setValue('activityLevel', value as any)} defaultValue="MODERATELY_ACTIVE">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SEDENTARY">Sedentary (desk job)</SelectItem>
                <SelectItem value="LIGHTLY_ACTIVE">Lightly Active (1-3 days/week)</SelectItem>
                <SelectItem value="MODERATELY_ACTIVE">Moderately Active (3-5 days/week)</SelectItem>
                <SelectItem value="VERY_ACTIVE">Very Active (6-7 days/week)</SelectItem>
                <SelectItem value="EXTRA_ACTIVE">Extra Active (2x/day, intense)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          {...register("notes")}
          placeholder="Any additional notes about this measurement..."
          rows={3}
        />
      </div>

      {/* Submit */}
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          hasToday ? 'Update Today\'s Measurement' : 'Calculate Body Composition'
        )}
      </Button>
    </form>
    </div>
  );
}