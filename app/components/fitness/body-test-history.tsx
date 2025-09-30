"use client";

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, TrendingUp, TrendingDown, Minus, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface BodyMeasurement {
  _id: string;
  measurementDate: string;
  weight: number;
  measurementMethod: string;
  bodyComposition: {
    bodyFatPercentage: number;
    leanBodyMass: number;
    bmr: number;
  };
  powerliftingPredictions: {
    benchPress1RM: number;
    squat1RM: number;
    deadlift1RM: number;
    total: number;
    wilksScore: number;
  };
  trainingLevel: string;
  notes?: string;
}

interface PaginationInfo {
  current: number;
  total: number;
  count: number;
  totalRecords: number;
}

export default function BodyTestHistory() {
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMeasurement, setSelectedMeasurement] = useState<BodyMeasurement | null>(null);

  useEffect(() => {
    fetchMeasurements();
  }, [currentPage]);

  const fetchMeasurements = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/body-test?page=${currentPage}&limit=10`);

      if (!response.ok) {
        throw new Error('Failed to fetch measurements');
      }

      const result = await response.json();

      if (result.success) {
        setMeasurements(result.data.measurements);
        setPagination(result.data.pagination);
      }
    } catch (error: any) {
      console.error('Error fetching measurements:', error);
      toast.error('Failed to load measurement history');
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else if (current < previous) {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    } else {
      return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getMethodBadgeColor = (method: string) => {
    switch (method) {
      case 'SKINFOLD_3_SITE': return 'bg-blue-100 text-blue-800';
      case 'SKINFOLD_7_SITE': return 'bg-green-100 text-green-800';
      case 'SKINFOLD_9_SITE': return 'bg-purple-100 text-purple-800';
      case 'BIA': return 'bg-orange-100 text-orange-800';
      case 'MANUAL_INPUT': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMethodDisplayName = (method: string) => {
    switch (method) {
      case 'SKINFOLD_3_SITE': return '3-Site';
      case 'SKINFOLD_7_SITE': return '7-Site';
      case 'SKINFOLD_9_SITE': return '9-Site';
      case 'BIA': return 'BIA';
      case 'MANUAL_INPUT': return 'Manual';
      default: return method;
    }
  };

  if (loading && measurements.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (measurements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-default-500">
        <Calendar className="w-16 h-16 text-default-300 mb-4" />
        <p className="text-lg font-medium">No measurements found</p>
        <p className="text-sm text-center">Complete your first body test to see your history here</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      {measurements.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-default-50 rounded-lg p-4">
            <div className="text-sm text-default-600">Latest Body Fat</div>
            <div className="text-2xl font-bold text-default-900">
              {measurements[0].bodyComposition.bodyFatPercentage.toFixed(1)}%
            </div>
            {measurements.length > 1 && (
              <div className="flex items-center mt-1">
                {getTrendIcon(
                  measurements[0].bodyComposition.bodyFatPercentage,
                  measurements[1].bodyComposition.bodyFatPercentage
                )}
                <span className="text-xs text-default-600 ml-1">
                  vs previous
                </span>
              </div>
            )}
          </div>

          <div className="bg-default-50 rounded-lg p-4">
            <div className="text-sm text-default-600">Latest Weight</div>
            <div className="text-2xl font-bold text-default-900">
              {measurements[0].weight.toFixed(1)}kg
            </div>
            {measurements.length > 1 && (
              <div className="flex items-center mt-1">
                {getTrendIcon(measurements[0].weight, measurements[1].weight)}
                <span className="text-xs text-default-600 ml-1">
                  {Math.abs(measurements[0].weight - measurements[1].weight).toFixed(1)}kg
                </span>
              </div>
            )}
          </div>

          <div className="bg-default-50 rounded-lg p-4">
            <div className="text-sm text-default-600">Total Strength</div>
            <div className="text-2xl font-bold text-default-900">
              {measurements[0].powerliftingPredictions.total.toFixed(0)}kg
            </div>
            {measurements.length > 1 && (
              <div className="flex items-center mt-1">
                {getTrendIcon(
                  measurements[0].powerliftingPredictions.total,
                  measurements[1].powerliftingPredictions.total
                )}
                <span className="text-xs text-default-600 ml-1">
                  vs previous
                </span>
              </div>
            )}
          </div>

          <div className="bg-default-50 rounded-lg p-4">
            <div className="text-sm text-default-600">Wilks Score</div>
            <div className="text-2xl font-bold text-default-900">
              {measurements[0].powerliftingPredictions.wilksScore.toFixed(0)}
            </div>
            {measurements.length > 1 && (
              <div className="flex items-center mt-1">
                {getTrendIcon(
                  measurements[0].powerliftingPredictions.wilksScore,
                  measurements[1].powerliftingPredictions.wilksScore
                )}
                <span className="text-xs text-default-600 ml-1">
                  vs previous
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Measurements Table */}
      <div className="bg-white rounded-lg border border-default-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Weight</TableHead>
              <TableHead>Body Fat %</TableHead>
              <TableHead>Lean Mass</TableHead>
              <TableHead>Total (B/S/D)</TableHead>
              <TableHead>Wilks</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {measurements.map((measurement, index) => (
              <TableRow key={measurement._id}>
                <TableCell className="font-medium">
                  {format(new Date(measurement.measurementDate), 'MMM dd, yyyy')}
                </TableCell>
                <TableCell>
                  <Badge color="secondary" className={getMethodBadgeColor(measurement.measurementMethod)}>
                    {getMethodDisplayName(measurement.measurementMethod)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <span>{measurement.weight.toFixed(1)}kg</span>
                    {index < measurements.length - 1 &&
                      getTrendIcon(measurement.weight, measurements[index + 1].weight)
                    }
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <span>{measurement.bodyComposition.bodyFatPercentage.toFixed(1)}%</span>
                    {index < measurements.length - 1 &&
                      getTrendIcon(
                        measurement.bodyComposition.bodyFatPercentage,
                        measurements[index + 1].bodyComposition.bodyFatPercentage
                      )
                    }
                  </div>
                </TableCell>
                <TableCell>
                  {measurement.bodyComposition.leanBodyMass.toFixed(1)}kg
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <span>{measurement.powerliftingPredictions.total.toFixed(0)}kg</span>
                    {index < measurements.length - 1 &&
                      getTrendIcon(
                        measurement.powerliftingPredictions.total,
                        measurements[index + 1].powerliftingPredictions.total
                      )
                    }
                  </div>
                </TableCell>
                <TableCell>
                  {measurement.powerliftingPredictions.wilksScore.toFixed(0)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedMeasurement(measurement)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.total > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-default-600">
            Showing {pagination.count} of {pagination.totalRecords} measurements
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-default-600">
              Page {pagination.current} of {pagination.total}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(pagination.total, currentPage + 1))}
              disabled={currentPage === pagination.total}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Detailed View Modal/Drawer - Simple version for now */}
      {selectedMeasurement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                Measurement Details - {format(new Date(selectedMeasurement.measurementDate), 'PPP')}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedMeasurement(null)}
              >
                ×
              </Button>
            </div>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-default-600">Weight</label>
                  <p className="text-lg">{selectedMeasurement.weight}kg</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-default-600">Method</label>
                  <p className="text-lg">{getMethodDisplayName(selectedMeasurement.measurementMethod)}</p>
                </div>
              </div>

              {/* Body Composition */}
              <div>
                <h3 className="font-semibold mb-3">Body Composition</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-default-600">Body Fat:</span>
                    <span className="ml-2 font-medium">
                      {selectedMeasurement.bodyComposition.bodyFatPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-default-600">Lean Mass:</span>
                    <span className="ml-2 font-medium">
                      {selectedMeasurement.bodyComposition.leanBodyMass.toFixed(1)}kg
                    </span>
                  </div>
                  <div>
                    <span className="text-default-600">BMR:</span>
                    <span className="ml-2 font-medium">
                      {selectedMeasurement.bodyComposition.bmr.toFixed(0)} kcal/day
                    </span>
                  </div>
                </div>
              </div>

              {/* Strength Predictions */}
              <div>
                <h3 className="font-semibold mb-3">Strength Predictions</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-default-600">Bench Press:</span>
                    <span className="ml-2 font-medium">
                      {selectedMeasurement.powerliftingPredictions.benchPress1RM.toFixed(0)}kg
                    </span>
                  </div>
                  <div>
                    <span className="text-default-600">Squat:</span>
                    <span className="ml-2 font-medium">
                      {selectedMeasurement.powerliftingPredictions.squat1RM.toFixed(0)}kg
                    </span>
                  </div>
                  <div>
                    <span className="text-default-600">Deadlift:</span>
                    <span className="ml-2 font-medium">
                      {selectedMeasurement.powerliftingPredictions.deadlift1RM.toFixed(0)}kg
                    </span>
                  </div>
                  <div>
                    <span className="text-default-600">Total:</span>
                    <span className="ml-2 font-medium">
                      {selectedMeasurement.powerliftingPredictions.total.toFixed(0)}kg
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-default-600">Wilks Score:</span>
                    <span className="ml-2 font-medium">
                      {selectedMeasurement.powerliftingPredictions.wilksScore.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedMeasurement.notes && (
                <div>
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-sm text-default-600 bg-default-50 p-3 rounded">
                    {selectedMeasurement.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}