import { useState, useEffect, useRef, useCallback } from 'react';
import { ArenaRoom } from '../../../houseArena.types';
import { QuickThinkQuestionState, QuickThinkSubmissionResult } from '../quickThink.types';
import { quickThinkService } from '../../../services/quickThink.service';

interface UseQuickThinkGameplayProps {
  room: ArenaRoom;
  reconnectToken: string;
  onRoundFinished?: () => void;
}

export const useQuickThinkGameplay = ({
  room,
  reconnectToken,
  onRoundFinished
}: UseQuickThinkGameplayProps) => {
  const [currentQuestion, setCurrentQuestion] = useState<QuickThinkQuestionState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<QuickThinkSubmissionResult | null>(null);

  // Countdown timers (browser-level presentation)
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number>(0);
  const [roundTimeLeft, setRoundTimeLeft] = useState<number>(room.remainingRoundSeconds ?? 300);

  // Track the current roundQuestionId to detect when we transition to a new question
  const currentRqidRef = useRef<string | null>(null);
  const isPollingRef = useRef<boolean>(false);

  /**
   * Fetches the current state of the active question from the server.
   */
  const syncWithServer = useCallback(async (forceTransitionReset = false) => {
    if (isPollingRef.current) return;
    isPollingRef.current = true;

    try {
      const data = await quickThinkService.getActiveQuestion(room.roomCode, reconnectToken);
      
      if (!data) {
        // Round has ended
        if (onRoundFinished) {
          onRoundFinished();
        }
        return;
      }

      // Update round-level countdown
      setRoundTimeLeft(Math.max(0, data.remainingRoundSeconds));

      // Check if we got a new question, or if we were forced to reset
      const isNewQuestion = data.roundQuestionId !== currentRqidRef.current;

      if (isNewQuestion || forceTransitionReset) {
        currentRqidRef.current = data.roundQuestionId;
        setCurrentQuestion(data);
        setQuestionTimeLeft(Math.max(0, data.remainingQuestionSeconds));
        setIsTransitioning(false);

        if (data.isAnswered && data.answeredOptionId) {
          setSelectedOptionId(data.answeredOptionId);
          setSubmissionResult({
            isAccepted: true,
            isCorrect: data.correctOptionId === data.answeredOptionId,
            scoreAwarded: data.correctOptionId === data.answeredOptionId ? 1 : 0,
            updatedRoundScore: data.roundScore,
            updatedTotalScore: data.totalScore,
            correctOptionId: data.correctOptionId || '',
            explanationPt: data.explanationPt || '',
            explanationEn: data.explanationEn || ''
          });
        } else {
          // Reset local selections for the new active question
          setSelectedOptionId(null);
          setSubmissionResult(null);
        }
      } else {
        // Same question, but let's update some critical states (e.g., scores, answered status if changed via other syncs)
        setCurrentQuestion(prev => {
          if (!prev) return data;
          return {
            ...prev,
            roundScore: data.roundScore,
            totalScore: data.totalScore,
            isAnswered: data.isAnswered,
            answeredOptionId: data.answeredOptionId,
            correctOptionId: data.correctOptionId || prev.correctOptionId,
            explanationPt: data.explanationPt || prev.explanationPt,
            explanationEn: data.explanationEn || prev.explanationEn
          };
        });

        // Sync local timers with server clock occasionally
        if (Math.abs(questionTimeLeft - data.remainingQuestionSeconds) > 2) {
          setQuestionTimeLeft(Math.max(0, data.remainingQuestionSeconds));
        }
      }
    } catch (err) {
      console.error('[useQuickThinkGameplay] Error syncing state:', err);
    } finally {
      isPollingRef.current = false;
      setLoading(false);
    }
  }, [room.roomCode, reconnectToken, onRoundFinished, questionTimeLeft]);

  // Initial load on mount
  useEffect(() => {
    syncWithServer();
  }, [syncWithServer]);

  // Question ticking interval
  useEffect(() => {
    if (isTransitioning || loading) return;

    const interval = setInterval(() => {
      setQuestionTimeLeft((prev) => {
        if (prev <= 1) {
          // Time is up for this question!
          clearInterval(interval);
          handleQuestionTimeUp();
          return 0;
        }
        return prev - 1;
      });

      setRoundTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isTransitioning, loading]);

  // Periodic slow sync with server (every 5 seconds) to keep scores and states perfectly aligned
  useEffect(() => {
    const syncInterval = setInterval(() => {
      syncWithServer();
    }, 5000);

    return () => clearInterval(syncInterval);
  }, [syncWithServer]);

  /**
   * Action when local countdown expires for the current question
   */
  const handleQuestionTimeUp = async () => {
    setIsTransitioning(true);
    
    // Automatically reveal correct answer from server if they had not submitted anything
    await syncWithServer(true);

    // Pause briefly for 3 seconds so the player can see the correct answer feedback before moving on
    setTimeout(() => {
      triggerPollForNextQuestion();
    }, 3000);
  };

  /**
   * Fast polling loop to detect when the next question is activated on the server
   */
  const triggerPollForNextQuestion = () => {
    let attempts = 0;
    const maxAttempts = 10;

    const poll = setInterval(async () => {
      attempts++;
      try {
        const data = await quickThinkService.getActiveQuestion(room.roomCode, reconnectToken);
        if (data && data.roundQuestionId !== currentRqidRef.current) {
          clearInterval(poll);
          // Set new question and restart ticking
          currentRqidRef.current = data.roundQuestionId;
          setCurrentQuestion(data);
          setQuestionTimeLeft(Math.max(0, data.remainingQuestionSeconds));
          setSelectedOptionId(null);
          setSubmissionResult(null);
          setIsTransitioning(false);
        } else if (attempts >= maxAttempts) {
          clearInterval(poll);
          // Fallback, end round or force transition anyway
          setIsTransitioning(false);
        }
      } catch (err) {
        console.error('[useQuickThinkGameplay] Polling error:', err);
      }
    }, 1500);
  };

  /**
   * Submits selected answer to the service
   */
  const submitAnswer = async (optionId: string) => {
    if (!currentQuestion || !currentQuestion.roundQuestionId || submitting || currentQuestion.isAnswered) return;
    
    setSubmitting(true);
    setSelectedOptionId(optionId);

    try {
      const res = await quickThinkService.submitAnswer(
        room.roomCode,
        reconnectToken,
        currentQuestion.roundQuestionId,
        optionId
      );

      if (res.isAccepted) {
        setSubmissionResult(res);
        // Mark as answered locally immediately
        setCurrentQuestion(prev => {
          if (!prev) return null;
          return {
            ...prev,
            isAnswered: true,
            answeredOptionId: optionId,
            correctOptionId: res.correctOptionId,
            explanationPt: res.explanationPt,
            explanationEn: res.explanationEn,
            roundScore: res.updatedRoundScore,
            totalScore: res.updatedTotalScore
          };
        });
      }
    } catch (err) {
      console.error('[useQuickThinkGameplay] Error submitting answer:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return {
    currentQuestion,
    loading,
    isTransitioning,
    submitting,
    selectedOptionId,
    submissionResult,
    questionTimeLeft,
    roundTimeLeft,
    submitAnswer,
    syncWithServer
  };
};
