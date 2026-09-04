import { useState, useEffect, useRef } from 'react';
import { memoryMatchService } from '../../../services/memoryMatch.service';
import { MemoryMatchCard, MemoryMatchRoundState } from '../memoryMatch.types';
import { ArenaRoom } from '../../../houseArena.types';

interface UseMemoryMatchGameplayProps {
  room: ArenaRoom;
  reconnectToken: string;
  language: 'pt' | 'en';
  onRoundFinished?: () => void;
}

export const useMemoryMatchGameplay = ({
  room,
  reconnectToken,
  language,
  onRoundFinished
}: UseMemoryMatchGameplayProps) => {
  const [cards, setCards] = useState<MemoryMatchCard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(300);
  const [roundScore, setRoundScore] = useState<number>(0);
  const [totalScore, setTotalScore] = useState<number>(0);

  // Tracks currently selected cards in the turn (max 2)
  const [selectedCards, setSelectedCards] = useState<MemoryMatchCard[]>([]);
  // Prevents clicking cards while waiting for validation delay
  const [isLocked, setIsLocked] = useState<boolean>(false);

  // Notification feedbacks
  const [feedback, setFeedback] = useState<{ status: 'success' | 'error' | null; message: string }>({
    status: null,
    message: ''
  });

  // Fetch initial board and scores
  useEffect(() => {
    let active = true;

    const loadBoard = async () => {
      setLoading(true);
      try {
        const state = await memoryMatchService.getMemoryMatchRoundState(room.roomCode, reconnectToken);
        if (active && state) {
          setCards(state.cards);
          setTimeLeft(state.remainingRoundSeconds);
          setRoundScore(state.roundScore);
          setTotalScore(state.totalScore);
        }
      } catch (err) {
        console.error('[useMemoryMatchGameplay] Error loading board:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadBoard();

    return () => {
      active = false;
    };
  }, [room.roomCode, reconnectToken]);

  // Handle count-down ticking
  useEffect(() => {
    if (timeLeft <= 0) {
      if (onRoundFinished) {
        onRoundFinished();
      }
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (onRoundFinished) {
            onRoundFinished();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, onRoundFinished]);

  // Triggers temporary feedback
  const triggerFeedback = (status: 'success' | 'error', message: string) => {
    setFeedback({ status, message });
    const timer = setTimeout(() => {
      setFeedback({ status: null, message: '' });
    }, 1500);
    return () => clearTimeout(timer);
  };

  /**
   * Action when a player clicks a card
   */
  const handleCardClick = async (card: MemoryMatchCard) => {
    if (isLocked || submitting || card.status !== 'hidden') return;

    // 1. Reveal card via secure service call
    setIsLocked(true);
    try {
      const revealedCard = await memoryMatchService.revealCard(room.roomCode, reconnectToken, card.id);
      if (!revealedCard) {
        setIsLocked(false);
        return;
      }

      // Update card in local cards state
      setCards((prev) =>
        prev.map((c) => (c.id === card.id ? { ...c, status: 'revealed' as const, labelPt: revealedCard.labelPt, labelEn: revealedCard.labelEn } : c))
      );

      const nextSelection: MemoryMatchCard[] = [...selectedCards, { ...card, status: 'revealed' as const, labelPt: revealedCard.labelPt, labelEn: revealedCard.labelEn }];
      setSelectedCards(nextSelection);

      // If this is the second card, evaluate the match
      if (nextSelection.length === 2) {
        setSubmitting(true);
        const [first, second] = nextSelection;

        const res = await memoryMatchService.submitPair(room.roomCode, reconnectToken, first.id, second.id);
        
        if (res.isMatch) {
          // Play match feedback immediately
          setCards((prev) =>
            prev.map((c) => (c.id === first.id || c.id === second.id ? { ...c, status: 'matched' } : c))
          );
          setRoundScore(res.updatedRoundScore);
          setTotalScore(res.updatedTotalScore);
          triggerFeedback('success', language === 'pt' ? '+10 Pontos! Par correto.' : '+10 Points! Correct pair.');

          // Reset selection
          setSelectedCards([]);
          setSubmitting(false);
          setIsLocked(false);

          // If the board was completed and regenerated, reload state in a brief delay to let user see match
          if (res.boardCompleted || cards.filter(c => c.status !== 'matched').length <= 2) {
            setTimeout(async () => {
              const freshState = await memoryMatchService.getMemoryMatchRoundState(room.roomCode, reconnectToken);
              if (freshState) {
                setCards(freshState.cards);
                triggerFeedback('success', language === 'pt' ? 'Tabuleiro completado! Carregando novo nível!' : 'Board completed! Loading new level!');
              }
            }, 1000);
          }
        } else {
          // It's a mismatch. Wait 1.2s to let player memorize, then flip back
          triggerFeedback('error', language === 'pt' ? 'Incorreto! Tente de novo.' : 'Incorrect! Try again.');
          setTimeout(() => {
            setCards((prev) =>
              prev.map((c) => (c.id === first.id || c.id === second.id ? { ...c, status: 'hidden', labelPt: null, labelEn: null } : c))
            );
            setSelectedCards([]);
            setSubmitting(false);
            setIsLocked(false);
          }, 1200);
        }
      } else {
        // Just the first card, unlock for second click
        setIsLocked(false);
      }
    } catch (err) {
      console.error('[useMemoryMatchGameplay] Card click failed:', err);
      setIsLocked(false);
    }
  };

  return {
    cards,
    loading,
    submitting,
    timeLeft,
    roundScore,
    totalScore,
    selectedCards,
    feedback,
    handleCardClick
  };
};
export type UseMemoryMatchGameplay = ReturnType<typeof useMemoryMatchGameplay>;
