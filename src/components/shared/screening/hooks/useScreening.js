// src/components/shared/screening/hooks/useScreening.js

"use client"

import { useState, useCallback, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { screeningApi, screeningHelpers } from "../lib/screeningApi"

// LocalStorage keys - HANYA untuk session info, TIDAK untuk answers
const STORAGE_KEYS = {
  SESSION_ID: "screening_session_id",
  START_TIME: "screening_start_time",
}

/**
 * Custom hook for managing screening functionality WITHOUT localStorage for answers
 * Data tidak disimpan ke localStorage untuk screening answers
 */
export const useScreening = () => {
  const queryClient = useQueryClient()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState(new Array(21).fill(null))
  const [isInitialized, setIsInitialized] = useState(false)

  // Query for getting DASS-21 questions from backend
  const {
    data: questionsData,
    isLoading: isLoadingQuestions,
    error: questionsError,
  } = useQuery({
    queryKey: ["screeningQuestions"],
    queryFn: screeningApi.getQuestions,
    staleTime: 1000 * 60 * 30, // 30 minutes
    cacheTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
  })

  // Query for getting user's screening history
  const {
    data: screeningHistory,
    isLoading: isLoadingHistory,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ["myScreenings"],
    queryFn: () => screeningApi.getMyScreenings({ limit: 10 }),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  })

  // Mutation for submitting screening
  const submitScreeningMutation = useMutation({
    mutationFn: ({ answers, notes }) => screeningApi.submitScreening(answers, notes),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["myScreenings"] })
      return data
    },
    onError: (error) => {
      toast.error("Gagal menyimpan hasil screening", {
        description: "Terjadi kesalahan saat mengirim data. Silakan coba lagi.",
      })
    },
  })

  // Clear localStorage - hanya clear session info
  const clearScreeningStorage = useCallback(() => {
    try {
      Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key)
      })
    } catch (error) {
      console.error("Error clearing storage:", error)
    }
  }, [])

  // Initialize screening session
  const initializeScreening = useCallback(async () => {
    if (!questionsData?.questions) {
      throw new Error("Questions not loaded from backend")
    }

    if (questionsData.questions.length !== 21) {
      throw new Error("Invalid questions data - expected 21 questions")
    }

    // Selalu fresh start, tidak load progress dari localStorage
    setCurrentQuestion(0)
    setAnswers(new Array(21).fill(null))

    // Create session ID and start time - hanya ini yang disimpan
    const sessionId = `screening_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const startTime = new Date().toISOString()

    try {
      localStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId)
      localStorage.setItem(STORAGE_KEYS.START_TIME, startTime)
    } catch (error) {
      console.error("Error saving session info:", error)
    }

    setIsInitialized(true)
  }, [questionsData])

  // Update answer for specific question
  const updateAnswer = useCallback(
    (questionIndex, value) => {
      if (questionIndex < 0 || questionIndex >= 21) {
        throw new Error("Invalid question index")
      }

      // Ensure value is integer and within range
      const intValue = Number.parseInt(value, 10)
      if (intValue < 0 || intValue > 3 || isNaN(intValue)) {
        throw new Error("Answer value must be integer between 0 and 3")
      }

      setAnswers((prev) => {
        const newAnswers = [...prev]
        newAnswers[questionIndex] = intValue
        return newAnswers
      })
    },
    [],
  )

  // Navigate to next question
  const nextQuestion = useCallback(() => {
    if (currentQuestion < 20) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }, [currentQuestion])

  // Navigate to previous question  
  const previousQuestion = useCallback(() => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }, [currentQuestion])

  // Jump to specific question
  const goToQuestion = useCallback((questionIndex) => {
    if (questionIndex >= 0 && questionIndex < 21) {
      setCurrentQuestion(questionIndex)
    }
  }, [])

  // Check if current question has been answered
  const isCurrentQuestionAnswered = useCallback(() => {
    const answer = answers[currentQuestion]
    return answer !== null && answer !== undefined && Number.isInteger(answer) && answer >= 0 && answer <= 3
  }, [answers, currentQuestion])

  // Check if all questions have been answered
  const isAllQuestionsAnswered = useCallback(() => {
    return answers.every(
      (answer) => answer !== null && answer !== undefined && Number.isInteger(answer) && answer >= 0 && answer <= 3,
    )
  }, [answers])

  // Get answered questions count
  const getAnsweredCount = useCallback(() => {
    return answers.filter(
      (answer) => answer !== null && answer !== undefined && Number.isInteger(answer) && answer >= 0 && answer <= 3,
    ).length
  }, [answers])

  // Get progress percentage
  const getProgress = useCallback(() => {
    return screeningHelpers.getProgress(getAnsweredCount(), 21)
  }, [getAnsweredCount])

  // Submit screening with validation
  const submitScreening = useCallback(
    async (notes = "") => {
      try {
        // Ensure all answers are integers
        const validatedAnswers = answers.map((answer) => {
          const intAnswer = Number.parseInt(answer, 10)
          if (isNaN(intAnswer) || intAnswer < 0 || intAnswer > 3) {
            throw new Error(`Invalid answer: ${answer}. Must be integer between 0 and 3`)
          }
          return intAnswer
        })

        // Validate answers using helper
        screeningHelpers.validateAnswers(validatedAnswers)

        // Get session info
        const sessionId = localStorage.getItem(STORAGE_KEYS.SESSION_ID)
        const startTime = localStorage.getItem(STORAGE_KEYS.START_TIME)

        // Calculate duration
        let sessionDuration = null
        if (startTime) {
          const endTime = new Date()
          const start = new Date(startTime)
          sessionDuration = Math.round((endTime - start) / 1000) // duration in seconds
        }

        // Add session info to notes if available
        let finalNotes = notes
        if (sessionId && sessionDuration) {
          finalNotes = `${notes}\n\nSession ID: ${sessionId}\nDuration: ${sessionDuration}s`.trim()
        }

        // Submit to API
        const result = await submitScreeningMutation.mutateAsync({
          answers: validatedAnswers,
          notes: finalNotes,
        })

        // Clear localStorage and reset state on successful submission
        clearScreeningStorage()
        resetScreening()

        // Return the complete result from backend
        return result.data
      } catch (error) {
        throw error
      }
    },
    [answers, submitScreeningMutation, clearScreeningStorage],
  )

  // Reset screening state
  const resetScreening = useCallback(() => {
    setCurrentQuestion(0)
    setAnswers(new Array(21).fill(null))
    setIsInitialized(false)
  }, [])

  // Get current question data
  const getCurrentQuestion = useCallback(() => {
    if (!questionsData?.questions || currentQuestion < 0 || currentQuestion >= 21) {
      return null
    }
    return questionsData.questions[currentQuestion]
  }, [questionsData, currentQuestion])

  // Get response options
  const getResponseOptions = useCallback(() => {
    return questionsData?.responseOptions || []
  }, [questionsData])

  // Check if user can proceed to next question
  const canProceed = useCallback(() => {
    return isCurrentQuestionAnswered()
  }, [isCurrentQuestionAnswered])

  // Check if user can go back
  const canGoBack = useCallback(() => {
    return currentQuestion > 0
  }, [currentQuestion])

  // Check if this is the last question
  const isLastQuestion = useCallback(() => {
    return currentQuestion === 20
  }, [currentQuestion])

  // Get session info
  const getSessionInfo = useCallback(() => {
    try {
      const sessionId = localStorage.getItem(STORAGE_KEYS.SESSION_ID)
      const startTime = localStorage.getItem(STORAGE_KEYS.START_TIME)

      let duration = null
      if (startTime) {
        duration = new Date() - new Date(startTime)
      }

      return {
        sessionId,
        startTime,
        duration,
        hasProgress: getAnsweredCount() > 0,
      }
    } catch (error) {
      return {
        sessionId: null,
        startTime: null,
        duration: null,
        hasProgress: false,
      }
    }
  }, [getAnsweredCount])

  return {
    // State
    currentQuestion,
    answers,
    isInitialized,

    // Data
    questionsData,
    screeningHistory,
    currentQuestionData: getCurrentQuestion(),
    responseOptions: getResponseOptions(),

    // Loading states
    isLoading: isLoadingQuestions || submitScreeningMutation.isPending,
    isLoadingQuestions,
    isLoadingHistory,
    isSubmitting: submitScreeningMutation.isPending,

    // Error states
    error: questionsError || submitScreeningMutation.error,
    questionsError,
    submissionError: submitScreeningMutation.error,

    // Navigation
    nextQuestion,
    previousQuestion,
    goToQuestion,

    // Answer management
    updateAnswer,
    isCurrentQuestionAnswered,
    isAllQuestionsAnswered,

    // Progress
    getProgress,
    getAnsweredCount,

    // Conditions
    canProceed,
    canGoBack,
    isLastQuestion,

    // Actions
    initializeScreening,
    submitScreening,
    resetScreening,
    refetchHistory,
    clearScreeningStorage,

    // Session info
    getSessionInfo,

    // Success data
    submissionResult: submitScreeningMutation.data,
    isSubmissionSuccess: submitScreeningMutation.isSuccess,
  }
}