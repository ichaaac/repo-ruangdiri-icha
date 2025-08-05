// src/components/shared/screening/lib/screeningApi.js

import { apiClient } from "../../../../lib/api";

/**
 * Screening API endpoints
 */
export const screeningApi = {
  /**
   * Get DASS-21 questions and configuration
   */
  getQuestions: async () => {
    try {
      const response = await apiClient.get("/screenings/questions");
      return response.data;
    } catch (error) {
      console.error("Error fetching screening questions:", error);
      throw error;
    }
  },

  /**
   * Submit screening answers
   */
  submitScreening: async (answers, notes) => {
    try {
      const response = await apiClient.post("/screenings", {
        answers,
        notes: notes || null,
      });
      return response.data;
    } catch (error) {
      console.error("Error submitting screening:", error);
      throw error;
    }
  },

  /**
   * Get user's screening history
   */
  getMyScreenings: async (params = {}) => {
    try {
      const response = await apiClient.get("/screenings/me", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching user screenings:", error);
      throw error;
    }
  },

  /**
   * Get specific screening by ID
   */
  getScreeningById: async (id) => {
    try {
      const response = await apiClient.get(`/screenings/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching screening by ID:", error);
      throw error;
    }
  },
};

/**
 * Helper functions for screening data processing
 */
export const screeningHelpers = {
  /**
   * Validate screening answers
   */
  validateAnswers: (answers) => {
    if (!Array.isArray(answers)) {
      throw new Error("Answers must be an array");
    }

    if (answers.length !== 21) {
      throw new Error("DASS-21 assessment requires exactly 21 answers");
    }

    const invalidAnswers = answers.filter(
      (answer) => answer < 0 || answer > 3 || !Number.isInteger(answer)
    );

    if (invalidAnswers.length > 0) {
      throw new Error("All answers must be integers between 0 and 3");
    }

    return true;
  },

  /**
   * Calculate progress percentage
   */
  getProgress: (currentQuestion, totalQuestions = 21) => {
    return Math.round((currentQuestion / totalQuestions) * 100);
  },

  /**
   * Format screening result for display
   */
  formatResult: (result) => {
    if (!result || !result.data) return null;

    const { assessment, detailedReport } = result.data;
    
    return {
      scores: {
        depression: assessment.depression,
        anxiety: assessment.anxiety,
        stress: assessment.stress,
      },
      overall: {
        riskLevel: assessment.riskLevel,
        overallRisk: assessment.overallRisk,
        totalScore: assessment.totalScore,
        recommendedAction: assessment.recommendedAction,
      },
      report: detailedReport,
      timestamp: result.data.createdAt,
    };
  },

  /**
   * Get risk level color
   */
  getRiskColor: (riskLevel) => {
    const colors = {
      low: "#22c55e", // green-500
      medium: "#f97316", // orange-500
      high: "#ef4444", // red-500
      critical: "#dc2626", // red-600
    };
    return colors[riskLevel] || colors.low;
  },

  /**
   * Get risk level label in Indonesian
   */
  getRiskLabel: (riskLevel) => {
    const labels = {
      low: "Stabil",
      medium: "Perlu Perhatian",
      high: "Berisiko",
      critical: "Sangat Berisiko",
    };
    return labels[riskLevel] || "Tidak Diketahui";
  },
};