import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState } from '../../types';
import { IconHome, IconCheck, IconX, IconRotate, IconBrain, IconClock } from '../../components/Icons';
import { useQuizGame, AnsweredQuestion } from './useQuizGame';

interface QuizModeProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  resetToHome: () => void;
  t: (key: any, params?: {[key: string]: string | number}) => string;
}

export function QuizMode({ gameState, setGameState, resetToHome, t }: QuizModeProps) {
  const {
    quizGameState,
    sessionQuestions,
    currentQuestionIndex,
    currentQuizQuestion,
    quizOptions,
    quizCorrectAnswer,
    selectedOption,
    isCorrect,
    timeUp,
    quizScore,
    timer,
    answeredQuestions,
    startQuiz,
    handleQuizAnswer,
    handleContinue,
    resetQuiz
  } = useQuizGame({ gameState, setGameState, resetToHome });

  const [showExitModal, setShowExitModal] = useState(false);
  const continueBtnRef = useRef<HTMLButtonElement>(null);
  const exitModalRef = useRef<HTMLDivElement>(null);

  // Focus trapping and Escape key support for exit modal (Accessibility)
  useEffect(() => {
    if (!showExitModal) return;

    const modalElement = exitModalRef.current;
    if (!modalElement) return;

    // Save previous active element to restore later
    const previousActiveElement = document.activeElement as HTMLElement;

    // Query all focusable elements inside the modal
    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusableElements = modalElement.querySelectorAll(focusableSelector);
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Set initial focus to the first interactive button ("Continue Quiz")
    if (firstFocusable) {
      firstFocusable.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowExitModal(false);
        return;
      }

      if (e.key === 'Tab') {
        if (e.shiftKey) {
          // Shift + Tab: loop back to last element if on first element
          if (document.activeElement === firstFocusable) {
            lastFocusable?.focus();
            e.preventDefault();
          }
        } else {
          // Tab: loop to first element if on last element
          if (document.activeElement === lastFocusable) {
            firstFocusable?.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      // Restore focus to original trigger element upon exit
      if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
        previousActiveElement.focus();
      }
    };
  }, [showExitModal]);

  // Auto-focus the Continue button when feedback is displayed (Requirement G.2)
  useEffect(() => {
    if (quizGameState === "QUIZ_FEEDBACK" && continueBtnRef.current) {
      continueBtnRef.current.focus();
    }
  }, [quizGameState]);

  // Clean up exit modal if quiz resets
  useEffect(() => {
    if (quizGameState === "QUIZ_INTRO") {
      setShowExitModal(false);
    }
  }, [quizGameState]);

  // Handle Home Click
  const handleHomeClick = () => {
    if (quizGameState === "QUIZ_PLAYING" || quizGameState === "QUIZ_FEEDBACK") {
      setShowExitModal(true);
    } else {
      resetQuiz();
      resetToHome();
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center p-2 min-h-[500px]">
      <AnimatePresence mode="wait">
        
        {/* State 1: QUIZ_INTRO (Landing Screen) */}
        {quizGameState === "QUIZ_INTRO" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-2xl bg-white border-4 border-brand-charcoal rounded-card shadow-elevated p-6 md:p-8 text-center flex flex-col items-center gap-6"
          >
            <div className="w-20 h-20 bg-brand-olives/20 border-4 border-brand-charcoal rounded-full flex items-center justify-center shadow-soft">
              <IconBrain size={40} className="text-brand-olives animate-pulse" />
            </div>

            <div className="space-y-2">
              <h1 className="font-display font-black text-3xl md:text-4xl text-brand-charcoal tracking-tight uppercase">
                {t('quiz_title')}
              </h1>
              <p className="font-body text-brand-burgundy font-bold text-base md:text-lg max-w-lg mx-auto">
                {t('quiz_objective')}
              </p>
            </div>

            <div className="w-full max-w-md bg-brand-linen border-2 border-brand-charcoal rounded-button p-5 text-left space-y-4">
              <p className="font-body text-brand-charcoal text-sm leading-relaxed">
                {t('quiz_challenge_desc')}
              </p>
              <div className="flex flex-wrap gap-2 items-center justify-between pt-2 border-t border-brand-charcoal/10">
                <span className="font-condensed font-black text-xs text-brand-charcoal uppercase tracking-wider bg-brand-butter px-2.5 py-1 rounded-pill border border-brand-charcoal">
                  {t('quiz_total_questions')}: 10
                </span>
                <span className="font-condensed font-black text-xs text-brand-charcoal uppercase tracking-wider bg-brand-sorbet px-2.5 py-1 rounded-pill border border-brand-charcoal">
                  Timer: 10s
                </span>
              </div>
            </div>

            <div className="w-full max-w-md space-y-4">
              <button
                onClick={startQuiz}
                className="w-full p-4 rounded-button border-4 border-brand-charcoal bg-brand-mochi text-brand-charcoal font-display font-bold text-xl shadow-soft hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                {t('quiz_start')}
              </button>
              
              <p className="font-body text-[11px] text-text-muted leading-tight max-w-sm mx-auto">
                {t('quiz_own_pace_note')}
              </p>
            </div>
          </motion.div>
        )}

        {/* State 2 & 3: QUIZ_PLAYING or QUIZ_FEEDBACK */}
        {(quizGameState === "QUIZ_PLAYING" || quizGameState === "QUIZ_FEEDBACK") && currentQuizQuestion && (
          <motion.div
            key="playing"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-[720px] bg-white border-4 border-brand-charcoal rounded-card shadow-elevated overflow-hidden flex flex-col relative"
          >
            {/* Header: Progress, Score & Exit */}
            <div className="bg-brand-linen p-4 border-b-4 border-brand-charcoal flex justify-between items-center gap-4">
              <div className="flex flex-col gap-1">
                <span className="font-condensed font-black text-sm text-brand-burgundy uppercase tracking-widest leading-none">
                  {t('quiz_question_of', { current: currentQuestionIndex + 1, total: 10 })}
                </span>
                <span className="font-body font-bold text-[11px] text-brand-olives">
                  {t('quiz_current_score', { score: quizScore })}
                </span>
              </div>

              {/* Segmented Timer Ring/Text */}
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-pill border-2 border-brand-charcoal ${timer <= 3 ? 'bg-brand-tomato text-white animate-pulse-fast' : 'bg-brand-butter text-brand-charcoal'}`}>
                  <IconClock size={16} />
                  <span className="font-mono font-black text-sm tracking-widest leading-none">
                    00:{timer < 10 ? `0${timer}` : timer}
                  </span>
                </div>
                
                <button
                  onClick={handleHomeClick}
                  aria-label={t('btn_home_tooltip')}
                  className="p-2 rounded-button border-2 border-brand-charcoal bg-white text-brand-charcoal hover:bg-brand-sorbet shadow-soft active:translate-y-0.5 transition-all cursor-pointer"
                >
                  <IconHome size={16} />
                </button>
              </div>
            </div>

            {/* Thicker segmented Progress Bar */}
            <div className="w-full h-3 bg-brand-charcoal/10 border-b-2 border-brand-charcoal relative">
              <motion.div
                className="absolute top-0 left-0 h-full bg-brand-olives"
                animate={{ width: `${((currentQuestionIndex + (selectedOption !== null ? 1 : 0)) / 10) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Active Core Area */}
            <div className="p-6 md:p-8 flex-1 flex flex-col justify-between gap-6">
              {/* Question Card */}
              <div className="space-y-3">
                <span className="inline-block font-condensed font-black text-xs text-brand-charcoal uppercase tracking-widest bg-brand-sorbet/50 px-2.5 py-1 rounded-pill border border-brand-charcoal">
                  Poke House Academy
                </span>
                <h2 className="font-body font-black text-xl md:text-2xl text-brand-charcoal leading-snug">
                  {currentQuizQuestion.question}
                </h2>
              </div>

              {/* Answer options Grid */}
              <div className="grid gap-3 w-full grid-cols-1">
                {quizOptions.map((opt, i) => {
                  const isSelected = selectedOption === opt;
                  const isThisCorrect = opt === quizCorrectAnswer;
                  const hasAnswered = selectedOption !== null;

                  let btnStyle = "bg-white text-brand-charcoal border-2 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-soft active:translate-y-0.5";
                  let icon = null;

                  if (hasAnswered) {
                    if (isThisCorrect) {
                      // Correct option is highlighted green
                      btnStyle = "bg-brand-olives text-white border-2 border-brand-charcoal font-black scale-[1.01]";
                      icon = <IconCheck size={20} className="text-white shrink-0" />;
                    } else if (isSelected) {
                      // Incorrectly selected option is highlighted tomato soup
                      btnStyle = "bg-brand-tomato text-white border-2 border-brand-charcoal font-black scale-[0.99]";
                      icon = <IconX size={20} className="text-white shrink-0" />;
                    } else {
                      // Other non-correct option
                      btnStyle = "bg-brand-linen text-brand-charcoal/40 border-2 border-dashed border-brand-charcoal/30 pointer-events-none opacity-60";
                    }
                  }

                  return (
                    <motion.button
                      key={i}
                      disabled={hasAnswered}
                      onClick={() => handleQuizAnswer(opt)}
                      whileTap={!hasAnswered ? { scale: 0.98 } : {}}
                      className={`w-full p-4 rounded-button font-body font-bold text-left text-sm md:text-base flex items-center justify-between gap-3 border-brand-charcoal shadow-soft cursor-pointer transition-all ${btnStyle}`}
                    >
                      <span className="flex-1">{opt}</span>
                      {icon}
                    </motion.button>
                  );
                })}
              </div>

              {/* Feedback Section only after an answer is selected */}
              <AnimatePresence>
                {quizGameState === "QUIZ_FEEDBACK" && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="p-5 rounded-button border-4 border-brand-charcoal bg-brand-linen flex flex-col md:flex-row items-center justify-between gap-4 mt-2"
                    aria-live="polite"
                  >
                    <div className="flex items-center gap-3 text-left w-full md:w-auto">
                      <div className={`w-12 h-12 rounded-full border-2 border-brand-charcoal flex items-center justify-center shrink-0 ${isCorrect ? 'bg-brand-olives text-white' : 'bg-brand-tomato text-white'}`}>
                        {isCorrect ? <IconCheck size={24} /> : <IconX size={24} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-display font-black text-lg ${isCorrect ? 'text-brand-olives' : 'text-brand-tomato'}`}>
                          {timeUp ? t('quiz_time_up') : (isCorrect ? t('quiz_correct') : t('quiz_not_correct'))}
                        </h4>
                        {!isCorrect && (
                          <p className="font-body text-xs text-brand-burgundy font-medium leading-normal">
                            <span className="font-bold block text-[10px] uppercase tracking-wider text-brand-charcoal/60">{t('quiz_correct_answer')}</span>
                            <span className="font-bold">{quizCorrectAnswer}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      ref={continueBtnRef}
                      onClick={handleContinue}
                      className="w-full md:w-auto px-8 py-3 rounded-button border-2 border-brand-charcoal bg-brand-mochi text-brand-charcoal font-display font-bold text-sm shadow-soft hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-sm active:scale-[0.98] transition-all cursor-pointer shrink-0"
                    >
                      {t('quiz_continue')}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* State 4: QUIZ_RESULT (Results & Review) */}
        {quizGameState === "QUIZ_RESULT" && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-2xl bg-white border-4 border-brand-charcoal rounded-card shadow-elevated p-6 md:p-8 flex flex-col items-center gap-6"
          >
            <div className="w-20 h-20 bg-brand-butter border-4 border-brand-charcoal rounded-full flex items-center justify-center shadow-soft">
              <span className="text-4xl">🏆</span>
            </div>

            <div className="space-y-2 text-center">
              <h1 className="font-display font-black text-2xl md:text-3xl text-brand-charcoal uppercase tracking-tight">
                {t('quiz_complete')}
              </h1>
              <p className="font-body text-brand-burgundy font-bold text-sm md:text-base max-w-sm mx-auto">
                {t('quiz_review_missed')}
              </p>
            </div>

            {/* Grid of Sub-Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
              <div className="bg-brand-linen border-2 border-brand-charcoal rounded-button p-4 text-center">
                <span className="block font-condensed font-black text-xs text-brand-charcoal/60 uppercase tracking-widest">{t('quiz_final_score')}</span>
                <span className="font-display font-black text-xl text-brand-charcoal">{quizScore}</span>
              </div>
              
              <div className="bg-brand-olives/10 border-2 border-brand-charcoal rounded-button p-4 text-center">
                <span className="block font-condensed font-black text-xs text-brand-charcoal/60 uppercase tracking-widest">{t('quiz_correct_answers')}</span>
                <span className="font-display font-black text-xl text-brand-olives">{quizScore} / 10</span>
              </div>

              <div className="bg-brand-tomato/10 border-2 border-brand-charcoal rounded-button p-4 text-center">
                <span className="block font-condensed font-black text-xs text-brand-charcoal/60 uppercase tracking-widest">{t('quiz_incorrect_answers')}</span>
                <span className="font-display font-black text-xl text-brand-tomato">{10 - quizScore} / 10</span>
              </div>

              <div className="bg-brand-butter/20 border-2 border-brand-charcoal rounded-button p-4 text-center">
                <span className="block font-condensed font-black text-xs text-brand-charcoal/60 uppercase tracking-widest">{t('quiz_accuracy')}</span>
                <span className="font-display font-black text-xl text-brand-burgundy">{quizScore * 10}%</span>
              </div>
            </div>

            {/* Results Review Section: List of questions answered incorrectly */}
            {answeredQuestions.some(q => !q.isCorrect) && (
              <div className="w-full text-left space-y-3 max-h-[220px] overflow-y-auto custom-scroll border-2 border-brand-charcoal rounded-button p-4 bg-brand-linen/40">
                <h3 className="font-display font-black text-xs text-brand-charcoal uppercase tracking-widest border-b border-brand-charcoal/10 pb-2">
                  {t('changelog_history')} (Erros)
                </h3>
                <div className="space-y-3">
                  {answeredQuestions.map((q, idx) => {
                    if (q.isCorrect) return null;
                    return (
                      <div key={idx} className="text-xs space-y-1 p-2 bg-white rounded border border-brand-charcoal/10">
                        <p className="font-body font-black text-brand-charcoal">
                          • {q.question}
                        </p>
                        <p className="font-body text-[11px] text-brand-tomato font-bold">
                          {t('quiz_selected')}: {q.selectedAnswer === "" ? "Timeout ⏰" : q.selectedAnswer}
                        </p>
                        <p className="font-body text-[11px] text-brand-olives font-bold">
                          {t('quiz_correct_answer')} {q.correctAnswer}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Play Again & Return Home Actions */}
            <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
              <button
                onClick={resetQuiz}
                className="flex-1 p-4 rounded-button border-4 border-brand-charcoal bg-brand-mochi text-brand-charcoal font-display font-bold text-base shadow-soft hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-sm active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <IconRotate size={18} /> {t('quiz_play_again')}
              </button>
              
              <button
                onClick={() => {
                  resetQuiz();
                  resetToHome();
                }}
                className="flex-1 p-4 rounded-button border-4 border-brand-charcoal bg-white text-brand-charcoal font-display font-bold text-base shadow-soft hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-sm active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <IconHome size={18} /> {t('quiz_return_home')}
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Exit Confirmation Dialog (Requirement J) */}
      <AnimatePresence>
        {showExitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-charcoal/80 backdrop-blur-sm" role="dialog" aria-modal="true">
            <motion.div
              ref={exitModalRef}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-brand-linen border-4 border-brand-charcoal rounded-modal shadow-elevated max-w-md w-full p-6 text-center space-y-6"
            >
              <div className="w-16 h-16 bg-brand-tomato/10 border-4 border-brand-charcoal rounded-full flex items-center justify-center shadow-soft mx-auto">
                <span className="text-3xl">⚠️</span>
              </div>
              <div className="space-y-2">
                <h3 className="font-display font-black text-xl text-brand-charcoal uppercase leading-tight">
                  {t('quiz_exit_confirm_title')}
                </h3>
                <p className="font-body text-brand-burgundy font-medium text-sm leading-relaxed">
                  {t('quiz_exit_confirm_description')}
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setShowExitModal(false)}
                  className="w-full py-3.5 rounded-button border-2 border-brand-charcoal bg-brand-olives text-white font-display font-bold text-sm shadow-soft hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                >
                  {t('quiz_continue_quiz')}
                </button>
                <button
                  onClick={() => {
                    setShowExitModal(false);
                    resetQuiz();
                    resetToHome();
                  }}
                  className="w-full py-3.5 rounded-button border-2 border-brand-charcoal bg-white text-brand-charcoal font-display font-bold text-sm shadow-soft hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                >
                  {t('quiz_leave_quiz')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
