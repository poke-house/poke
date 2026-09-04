import { useState, useEffect, useCallback, useRef } from 'react';
import { QuizQuestion, GameState } from '../../types';
import { QUIZ_QUESTIONS } from '../../constants';
import { shuffleArray } from '../../utils/helpers';
import { playSound } from '../../utils/sound';

interface UseQuizGameProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  resetToHome: () => void;
}

export interface AnsweredQuestion {
  question: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export type QuizGameStateType = "QUIZ_INTRO" | "QUIZ_PLAYING" | "QUIZ_FEEDBACK" | "QUIZ_RESULT";

export function useQuizGame({ gameState, setGameState, resetToHome }: UseQuizGameProps) {
  const [quizGameState, setQuizGameState] = useState<QuizGameStateType>("QUIZ_INTRO");
  const [sessionQuestions, setSessionQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [timeUp, setTimeUp] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [timer, setTimer] = useState<number>(10);
  const [answeredQuestions, setAnsweredQuestions] = useState<AnsweredQuestion[]>([]);

  // We want stable refs for callbacks to avoid re-renders or stale closures.
  const quizGameStateRef = useRef(quizGameState);
  const selectedOptionRef = useRef(selectedOption);

  useEffect(() => {
    quizGameStateRef.current = quizGameState;
  }, [quizGameState]);

  useEffect(() => {
    selectedOptionRef.current = selectedOption;
  }, [selectedOption]);

  const currentQuizQuestion = sessionQuestions[currentQuestionIndex] || null;
  const quizCorrectAnswer = currentQuizQuestion ? currentQuizQuestion.options[0] : "";

  // Helper to start/reset the quiz session
  const startQuiz = useCallback(() => {
    // Select 10 random questions
    const shuffled = shuffleArray([...QUIZ_QUESTIONS]);
    const selected = shuffled.slice(0, 10);
    
    setSessionQuestions(selected);
    setCurrentQuestionIndex(0);
    setQuizScore(0);
    setSelectedOption(null);
    setIsCorrect(null);
    setTimeUp(false);
    setTimer(10);
    setAnsweredQuestions([]);
    
    // Set options for the first question
    if (selected[0]) {
      setQuizOptions(shuffleArray([...selected[0].options]));
    }
    setQuizGameState("QUIZ_PLAYING");
    setGameState("QUIZ_PLAYING");
  }, [setGameState]);

  // Handle option selection
  const handleQuizAnswer = useCallback((answer: string) => {
    if (quizGameStateRef.current !== "QUIZ_PLAYING" || selectedOptionRef.current !== null) return;
    if (!currentQuizQuestion) return;

    const correct = (answer === currentQuizQuestion.options[0]);
    setSelectedOption(answer);
    setIsCorrect(correct);
    
    if (correct) {
      setQuizScore(prev => prev + 1);
      playSound("happy");
      // Trigger confetti if available on the window object
      if (window.confetti) {
        window.confetti({ particleCount: 30, spread: 40, origin: { y: 0.8 }, colors: ['#99CA5C'] }); // Olives green
      }
    } else {
      playSound("sad");
    }

    setAnsweredQuestions(prev => [
      ...prev,
      {
        question: currentQuizQuestion.question,
        selectedAnswer: answer,
        correctAnswer: currentQuizQuestion.options[0],
        isCorrect: correct
      }
    ]);

    setQuizGameState("QUIZ_FEEDBACK");
    setGameState("QUIZ_FEEDBACK");
  }, [currentQuizQuestion, setGameState]);

  // Handle timer timeout
  const handleTimeout = useCallback(() => {
    if (quizGameStateRef.current !== "QUIZ_PLAYING" || selectedOptionRef.current !== null) return;
    if (!currentQuizQuestion) return;

    setSelectedOption("");
    setIsCorrect(false);
    setTimeUp(true);
    playSound("sad");

    setAnsweredQuestions(prev => [
      ...prev,
      {
        question: currentQuizQuestion.question,
        selectedAnswer: "",
        correctAnswer: currentQuizQuestion.options[0],
        isCorrect: false
      }
    ]);

    setQuizGameState("QUIZ_FEEDBACK");
    setGameState("QUIZ_FEEDBACK");
  }, [currentQuizQuestion, setGameState]);

  // Continue to the next question or the results screen
  const handleContinue = useCallback(() => {
    if (quizGameStateRef.current !== "QUIZ_FEEDBACK") return;

    if (currentQuestionIndex < 9) {
      const nextIdx = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIdx);
      setSelectedOption(null);
      setIsCorrect(null);
      setTimeUp(false);
      setTimer(10);
      
      const nextQuestion = sessionQuestions[nextIdx];
      if (nextQuestion) {
        setQuizOptions(shuffleArray([...nextQuestion.options]));
      }
      setQuizGameState("QUIZ_PLAYING");
      setGameState("QUIZ_PLAYING");
    } else {
      setQuizGameState("QUIZ_RESULT");
      playSound("happy");
    }
  }, [currentQuestionIndex, sessionQuestions, setGameState]);

  const resetQuiz = useCallback(() => {
    setQuizGameState("QUIZ_INTRO");
    setSessionQuestions([]);
    setCurrentQuestionIndex(0);
    setQuizOptions([]);
    setSelectedOption(null);
    setIsCorrect(null);
    setTimeUp(false);
    setQuizScore(0);
    setTimer(10);
    setAnsweredQuestions([]);
    setGameState("QUIZ_PLAYING"); // stay inside active QuizMode container
  }, [setGameState]);

  // Countdown timer effect
  useEffect(() => {
    if (quizGameState !== "QUIZ_PLAYING" || selectedOption !== null) return;

    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [quizGameState, selectedOption, handleTimeout]);

  return {
    quizGameState,
    setQuizGameState,
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
  };
}
