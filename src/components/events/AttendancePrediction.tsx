import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, AlertCircle, Lightbulb, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

interface AttendancePredictionProps {
  eventId: string;
  registrationCount: number;
  event: any;
}

interface PredictionFactor {
  name: string;
  impact: number;
  description: string;
}

interface PredictionData {
  predictedAttendance: number;
  attendanceRate: number;
  confidence: 'low' | 'medium' | 'high';
  factors: PredictionFactor[];
  recommendations: string[];
  registrationCount: number;
  maxAttendees: number | null;
}

export const AttendancePrediction = ({ eventId, registrationCount, event }: AttendancePredictionProps) => {
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPrediction();
  }, [eventId, registrationCount]);

  const fetchPrediction = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.functions.invoke('predict-attendance', {
        body: { eventId },
      });

      if (error) throw error;

      setPrediction(data);
    } catch (err: any) {
      console.error('Prediction error:', err);
      setError(err.message || 'Failed to load prediction');
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    const variants = {
      low: 'destructive',
      medium: 'secondary',
      high: 'default',
    } as const;

    return (
      <Badge variant={variants[confidence as keyof typeof variants] || 'secondary'}>
        {confidence.toUpperCase()}
      </Badge>
    );
  };

  const getCapacityStatus = () => {
    if (!prediction || !prediction.maxAttendees) return null;

    const capacityPercent = (prediction.predictedAttendance / prediction.maxAttendees) * 100;

    if (capacityPercent > 100) {
      return (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>Predicted to exceed capacity</span>
        </div>
      );
    }

    if (capacityPercent > 80) {
      return (
        <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>Near capacity</span>
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Attendance Prediction
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !prediction) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Attendance Prediction
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {error || 'Unable to generate prediction. Try again later.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const capacityPercent = prediction.maxAttendees
    ? (prediction.predictedAttendance / prediction.maxAttendees) * 100
    : 0;

  return (
    <Card className="animate-enter">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Attendance Prediction
          </CardTitle>
          {getConfidenceBadge(prediction.confidence)}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Prediction Display */}
        <div className="text-center space-y-2 p-6 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-center gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-8 border-primary flex items-center justify-center bg-background">
                <span className="text-2xl font-bold">{prediction.attendanceRate}%</span>
              </div>
            </div>
            <div className="text-left">
              <div className="text-sm text-muted-foreground">Predicted Attendance</div>
              <div className="text-3xl font-bold">
                {prediction.predictedAttendance}
                <span className="text-lg text-muted-foreground"> / {prediction.registrationCount}</span>
              </div>
              {prediction.maxAttendees && (
                <div className="text-sm text-muted-foreground mt-1">
                  Capacity: {prediction.maxAttendees} ({Math.round(capacityPercent)}% expected)
                </div>
              )}
            </div>
          </div>
          {getCapacityStatus()}
        </div>

        {/* Factors */}
        {prediction.factors.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Target className="h-4 w-4 text-primary" />
              Factors Affecting Prediction
            </div>
            <div className="space-y-2">
              {prediction.factors.map((factor, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50"
                >
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      factor.impact > 0
                        ? 'bg-primary/10 text-primary'
                        : 'bg-destructive/10 text-destructive'
                    }`}
                  >
                    <span className="text-sm font-semibold">
                      {factor.impact > 0 ? '+' : ''}
                      {factor.impact}%
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{factor.name}</div>
                    <div className="text-xs text-muted-foreground">{factor.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {prediction.recommendations.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              Recommendations
            </div>
            <ul className="space-y-2">
              {prediction.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-0.5">•</span>
                  <span className="text-muted-foreground">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Confidence Note */}
        <div className="text-xs text-muted-foreground text-center pt-4 border-t">
          {prediction.confidence === 'low' && 'Predictions improve with more registration data and event history'}
          {prediction.confidence === 'medium' && 'Prediction based on industry benchmarks and event characteristics'}
          {prediction.confidence === 'high' && 'High confidence prediction based on historical data'}
        </div>
      </CardContent>
    </Card>
  );
};