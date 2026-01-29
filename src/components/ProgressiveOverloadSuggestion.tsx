import { useState, useEffect } from "react";
import { analyticsApi } from "../services/api";

interface Suggestion {
  recommendation: "increase_weight" | "increase_reps" | "maintain" | "deload";
  confidence: "needs_more_data" | "confident";
  reasoning: string;
  suggested_weight_kg: number | null;
  suggested_reps: number | null;
  current_avg_weight: number | null;
  current_avg_reps: number | null;
  current_avg_rpe: number | null;
  session_count: number;
}

interface ProgressiveOverloadSuggestionProps {
  exerciseId: string;
  onAccept?: (suggestion: Suggestion) => void;
  onDismiss?: () => void;
}

export function ProgressiveOverloadSuggestion({
  exerciseId,
  onAccept,
  onDismiss,
}: ProgressiveOverloadSuggestionProps) {
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    loadSuggestion();
  }, [exerciseId]);

  const loadSuggestion = async () => {
    try {
      setLoading(true);
      const data = await analyticsApi.getProgressiveOverloadSuggestion(exerciseId);
      setSuggestion(data);
    } catch (err) {
      // Silently fail - suggestion is optional
      setSuggestion(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (suggestion && onAccept) {
      onAccept(suggestion);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  if (loading || !suggestion || dismissed) {
    return null;
  }

  const getRecommendationColor = () => {
    switch (suggestion.recommendation) {
      case "increase_weight":
      case "increase_reps":
        return "border-green-500/30 bg-green-500/10";
      case "deload":
        return "border-yellow-500/30 bg-yellow-500/10";
      case "maintain":
        return "border-blue-500/30 bg-blue-500/10";
      default:
        return "border-gray-500/30 bg-gray-500/10";
    }
  };

  const getRecommendationIcon = () => {
    switch (suggestion.recommendation) {
      case "increase_weight":
      case "increase_reps":
        return (
          <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case "deload":
        return (
          <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
        );
      case "maintain":
        return (
          <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getRecommendationLabel = () => {
    switch (suggestion.recommendation) {
      case "increase_weight":
        return "Increase Weight";
      case "increase_reps":
        return "Increase Reps";
      case "deload":
        return "Deload";
      case "maintain":
        return "Maintain";
      default:
        return "Suggestion";
    }
  };

  return (
    <div className={`p-4 rounded-xl border ${getRecommendationColor()} mb-4`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-1">
          {getRecommendationIcon()}
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              {getRecommendationLabel()}
              {suggestion.confidence === "needs_more_data" && (
                <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 rounded text-xs font-normal">
                  Needs More Data
                </span>
              )}
            </h3>
            {suggestion.confidence === "confident" && (
              <p className="text-xs text-gray-400 mt-0.5">
                Based on last {suggestion.session_count} session(s)
              </p>
            )}
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
          title="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <p className="text-sm text-gray-300 mb-3">{suggestion.reasoning}</p>

      {(suggestion.suggested_weight_kg || suggestion.suggested_reps) && (
        <div className="flex items-center gap-4 mb-3">
          {suggestion.suggested_weight_kg && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Suggested Weight:</span>
              <span className="text-sm font-semibold text-white">
                {suggestion.suggested_weight_kg} kg
              </span>
            </div>
          )}
          {suggestion.suggested_reps && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Suggested Reps:</span>
              <span className="text-sm font-semibold text-white">
                {suggestion.suggested_reps}
              </span>
            </div>
          )}
        </div>
      )}

      {onAccept && (suggestion.suggested_weight_kg || suggestion.suggested_reps) && (
        <button
          onClick={handleAccept}
          className="w-full px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm text-white font-medium transition-colors"
        >
          Use This Suggestion
        </button>
      )}
    </div>
  );
}
