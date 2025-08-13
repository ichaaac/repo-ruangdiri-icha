// src/components/shared/booking/lib/bookingApi.js - Updated with Chat Integration

import { apiClient } from "../../../../lib/api.js";

export const createBookingApi = (userType = "student") => {
  
  // Validation helper for booking data
  const validateBookingData = (data) => {
    const errors = [];
    
    if (!data.psychologistId) {
      errors.push('Psychologist is required');
    }
    
    if (!data.method || !['online', 'offline', 'chat'].includes(data.method)) {
      errors.push('Valid counseling method is required');
    }
    
    if (!data.date) {
      errors.push('Date is required');
    }
    
    if (!data.startTime) {
      errors.push('Start time is required');
    }
    
    if (!data.endTime) {
      errors.push('End time is required');
    }
    
    return errors;
  };

  // Transform counseling method display
  const getCounselingMethodDisplay = (method) => {
    const methods = {
      'online': 'Daring (Zoom)',
      'offline': 'Luring', 
      'chat': 'Chat'
    };
    return methods[method] || method;
  };

  // Transform counseling method description
  const getCounselingMethodDescription = (method) => {
    const descriptions = {
      'online': 'Konseling yang dilakukan secara virtual dengan psikolog menggunakan platform percakapan audiovisual selama 1 jam.',
      'offline': 'Konseling yang dilakukan secara tatap muka dengan psikolog selama 1 jam.',
      'chat': 'Konseling melalui ruang chat dengan psikolog selama 15 menit dalam satu sesi.'
    };
    return descriptions[method] || '';
  };

  // Get available counseling methods
  const getAvailableMethods = () => {
    return [
      {
        id: 'offline',
        name: 'Luring',
        description: 'Konseling yang dilakukan secara tatap muka dengan psikolog selama 1 jam.',
        duration: '1 jam',
        image: '/placeholder.svg?height=192&width=288'
      },
      {
        id: 'online', 
        name: 'Daring (Zoom)',
        description: 'Konseling yang dilakukan secara virtual dengan psikolog menggunakan platform percakapan audiovisual selama 1 jam.',
        duration: '1 jam',
        image: '/placeholder.svg?height=192&width=288'
      },
      {
        id: 'chat',
        name: 'Chat', 
        description: 'Konseling melalui ruang chat dengan psikolog selama 15 menit dalam satu sesi.',
        duration: '15 menit',
        image: '/placeholder.svg?height=192&width=288'
      }
    ];
  };

  // Format booking datetime for display
  const formatBookingDateTime = (date, startTime, endTime) => {
    try {
      const dateObj = new Date(date);
      const formattedDate = dateObj.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "2-digit", 
        month: "long",
        year: "numeric"
      });
      
      return {
        date: formattedDate,
        time: `${startTime} - ${endTime} WIB`
      };
    } catch (error) {
      return { date: 'TBD', time: 'TBD' };
    }
  };

  // Create counseling chat session (helper function)
  const createCounselingChatSession = async (counselingId, psychologistId, scheduledAt) => {
    try {
      console.log('Creating counseling chat session...');
      console.log('Counseling ID:', counselingId);
      console.log('Psychologist ID:', psychologistId);
      console.log('Scheduled At:', scheduledAt);

      const payload = {
        counselingId,
        scheduledAt: scheduledAt.toISOString()
      };

      const response = await apiClient.post('/chat/sessions/counseling', payload);
      
      if (response.data && response.data.status === 'success') {
        console.log('Chat session created successfully:', response.data);
        return response.data.data;
      }
      
      throw new Error(response.data?.message || 'Failed to create chat session');
    } catch (error) {
      console.error('Error creating counseling chat session:', error);
      throw error;
    }
  };

  return {
    // Get available counseling methods
    getCounselingMethods: async () => {
      try {
        // This could be an API call or static data
        return {
          status: 'success',
          data: getAvailableMethods()
        };
      } catch (error) {
        console.error("Error fetching counseling methods:", error);
        throw error;
      }
    },

    // Get available psychologists
    getPsychologists: async (params = {}) => {
      try {
        const response = await apiClient.get('/psychologists', { 
          params: {
            ...params,
            available: true // Only get available psychologists
          }
        });
        
        if (response.data && response.data.status === 'success') {
          return {
            ...response,
            data: {
              ...response.data,
              data: response.data.data.map(psychologist => ({
                ...psychologist,
                displayName: psychologist.fullName || psychologist.name,
                specialties: psychologist.specialties || [],
                availability: psychologist.availability || {},
                rating: psychologist.rating || 0
              }))
            }
          };
        }
        
        return response;
      } catch (error) {
        console.error("Error fetching psychologists:", error);
        // Return fallback psychologists for demo
        return {
          status: 'fallback',
          data: {
            data: [
              {
                id: '1',
                fullName: 'Dr. Sarah Wijaya',
                email: 'sarah.wijaya@ruangdiri.com',
                specialties: ['Anxiety', 'Depression'],
                rating: 4.8,
                available: true
              },
              {
                id: '2', 
                fullName: 'Dr. Ahmad Rahman',
                email: 'ahmad.rahman@ruangdiri.com',
                specialties: ['Stress Management', 'Career Counseling'],
                rating: 4.9,
                available: true
              }
            ]
          }
        };
      }
    },

    // Get available locations for offline counseling
    getLocations: async () => {
      try {
        const response = await apiClient.get('/psychologists/locations');
        
        if (response.data && Array.isArray(response.data)) {
          return {
            status: 'success',
            data: response.data.map((location, index) => ({
              id: index + 1,
              name: location.locations,
              address: location.address
            }))
          };
        }
        
        return {
          status: 'success',
          data: response.data || []
        };
      } catch (error) {
        console.error("Error fetching locations:", error);
        // Return fallback locations
        return {
          status: 'fallback',
          data: [
            {
              id: 1,
              name: 'PT. Jasa Raharja Headquarter',
              address: 'Kuningan, Jakarta Selatan'
            },
            {
              id: 2,
              name: 'Biro Psikologi Sehati',
              address: 'Bekasi, Jawa Barat'
            },
            {
              id: 3,
              name: 'Jiwaku Sehati',
              address: 'Bekasi, Jawa Barat'
            }
          ]
        };
      }
    },

    // Get available time slots for a specific date and psychologist
    getAvailableTimeSlots: async (params = {}) => {
      try {
        const { psychologistId, date, method } = params;
        
        const response = await apiClient.get('/psychologists/availability', {
          params: {
            psychologistId,
            date,
            method
          }
        });

        if (response.data && response.data.status === 'success') {
          return {
            ...response,
            data: {
              ...response.data,
              data: response.data.data.map(slot => ({
                ...slot,
                displayTime: `${slot.startTime} - ${slot.endTime}`,
                available: slot.available !== false
              }))
            }
          };
        }

        return response;
      } catch (error) {
        console.error("Error fetching time slots:", error);
        // Return fallback time slots
        const fallbackSlots = [
          { startTime: '09:00', endTime: '10:00', available: true },
          { startTime: '10:00', endTime: '11:00', available: true },
          { startTime: '11:00', endTime: '12:00', available: false },
          { startTime: '13:00', endTime: '14:00', available: true },
          { startTime: '14:00', endTime: '15:00', available: true },
          { startTime: '15:00', endTime: '16:00', available: true },
        ];
        
        return {
          status: 'fallback',
          data: fallbackSlots.map(slot => ({
            ...slot,
            displayTime: `${slot.startTime} - ${slot.endTime}`
          }))
        };
      }
    },

    // Get user's subscription info
    getSubscriptionInfo: async () => {
      try {
        const response = await apiClient.get('/users/subscription');
        
        if (response.data && response.data.status === 'success') {
          return {
            ...response,
            data: {
              ...response.data,
              data: {
                ...response.data.data,
                displayType: response.data.data.type === 'organization' ? 'Organisasi' : 'Individual',
                remainingQuota: response.data.data.remainingQuota || 0
              }
            }
          };
        }

        return response;
      } catch (error) {
        console.error("Error fetching subscription info:", error);
        // Return fallback subscription info
        return {
          status: 'fallback',
          data: {
            type: 'organization',
            displayType: 'Organisasi',
            remainingQuota: 18
          }
        };
      }
    },

    // Create booking appointment - MAIN ENDPOINT WITH CHAT INTEGRATION
    createBooking: async (bookingData) => {
      try {
        console.log('=== createBooking API call ===');
        console.log('Booking data received:', bookingData);

        const validationErrors = validateBookingData(bookingData);
        if (validationErrors.length > 0) {
          throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
        }

        // Transform data for API
        const transformedData = {
          psychologistId: bookingData.psychologistId,
          method: bookingData.method, // 'online', 'offline', 'chat'
          notes: bookingData.notes || '',
          date: bookingData.date,
          startTime: bookingData.startTime,
          endTime: bookingData.endTime,
          timezone: bookingData.timezone || 'Asia/Jakarta'
        };

        // Add location for offline bookings
        if (bookingData.method === 'offline' && bookingData.locationId) {
          transformedData.locationId = bookingData.locationId;
        }

        console.log('Final payload sent to backend:', transformedData);

        const response = await apiClient.post('/counselings/book', transformedData);
        
        console.log('Backend response:', response.data);

        if (response.data && response.data.status === "success") {
          const bookingResult = {
            ...response.data.data,
            methodDisplay: getCounselingMethodDisplay(response.data.data.method),
            dateTimeFormatted: formatBookingDateTime(
              response.data.data.date,
              response.data.data.startTime, 
              response.data.data.endTime
            )
          };

          // 🔥 CREATE CHAT SESSION FOR CHAT BOOKINGS
          if (bookingData.method === 'chat') {
            try {
              console.log('🚀 Creating chat session for chat booking...');
              
              // Create counseling chat session
              const chatSession = await createCounselingChatSession(
                response.data.data.id, // counselingId from booking response
                bookingData.psychologistId,
                new Date(bookingData.date + 'T' + bookingData.startTime)
              );
              
              console.log('✅ Chat session created successfully:', chatSession);
              bookingResult.chatSessionCreated = true;
              bookingResult.chatSessionId = chatSession.sessionId;
              
            } catch (chatError) {
              console.error('❌ Failed to create chat session:', chatError);
              // Don't fail the booking, just log the error
              bookingResult.chatSessionCreated = false;
              bookingResult.chatSessionError = chatError.message;
            }
          }

          return {
            ...response,
            data: {
              ...response.data,
              data: bookingResult
            }
          };
        }
        
        return response;
      } catch (error) {
        console.error("Error creating booking:", error);
        
        if (error.response) {
          console.error("Booking error response:", error.response.data);
          const errorMessage = error.response.data && error.response.data.message || 
                             error.response.data && error.response.data.error || 
                             `HTTP ${error.response.status}: Booking failed`;
          throw new Error(errorMessage);
        } else if (error.request) {
          console.error("Booking error request:", error.request);
          throw new Error("Network error: Could not create booking");
        } else {
          console.error("Booking error message:", error.message);
          throw new Error(error.message || "Unknown error occurred during booking");
        }
      }
    },

    // Get user's booking history
    getBookingHistory: async (params = {}) => {
      try {
        const response = await apiClient.get('/counselings/my-bookings', { params });
        
        if (response.data && response.data.status === 'success') {
          return {
            ...response,
            data: {
              ...response.data,
              data: response.data.data.map(booking => ({
                ...booking,
                methodDisplay: getCounselingMethodDisplay(booking.method),
                dateTimeFormatted: formatBookingDateTime(
                  booking.date,
                  booking.startTime,
                  booking.endTime
                ),
                statusDisplay: booking.status === 'confirmed' ? 'Terkonfirmasi' : 
                              booking.status === 'pending' ? 'Menunggu' :
                              booking.status === 'cancelled' ? 'Dibatalkan' : booking.status
              }))
            }
          };
        }

        return response;
      } catch (error) {
        console.error("Error fetching booking history:", error);
        throw error;
      }
    },

    // Helper methods
    getCounselingMethodDisplay: getCounselingMethodDisplay,
    getCounselingMethodDescription: getCounselingMethodDescription,
    formatBookingDateTime: formatBookingDateTime,
    getAvailableMethods: getAvailableMethods,
    createCounselingChatSession: createCounselingChatSession
  };
};

// Export configuration for different user types
export const getBookingConfig = (userType) => {
  const baseConfig = {
    allowedMethods: ['online', 'offline', 'chat'],
    defaultTimezone: 'Asia/Jakarta',
    maxAdvanceBookingDays: 30,
    minAdvanceBookingHours: 24,
    maxCancellationHours: 24
  };

  if (userType === "student") {
    return {
      ...baseConfig,
      preferredMethods: ['online', 'chat', 'offline'],
      defaultMethod: 'online'
    };
  } else if (userType === "employee") {
    return {
      ...baseConfig,
      preferredMethods: ['online', 'offline', 'chat'],
      defaultMethod: 'online'
    };
  }

  return baseConfig;
};