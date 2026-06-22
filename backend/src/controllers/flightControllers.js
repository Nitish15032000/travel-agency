import axios from 'axios';
import flightdata from '../services/flightService.js'

// ========== FLIGHT SERVICE ==========

class FlightService {
   constructor() {
      this.apiKey = process.env.RAPIDAPI_KEY;
      this.apiHost = process.env.RAPIDAPI_HOST;
      this.baseUrl = 'https://google-flights2.p.rapidapi.com/api/v1/searchFlights';
   }

   // Validate search parameters
   validateSearchParams(from, to, date, adults, children = 0, infants = 0) {
      const errors = [];

      if (!from || from.trim() === '') {
         errors.push('Departure airport code is required (e.g., DEL, BOM, JFK)');
      }
      if (!to || to.trim() === '') {
         errors.push('Arrival airport code is required (e.g., BOM, LHR, NYC)');
      }
      if (!date || isNaN(new Date(date))) {
         errors.push('Valid departure date is required (YYYY-MM-DD format)');
      }
      if (adults < 1 || adults > 9) {
         errors.push('Adults must be between 1 and 9');
      }
      if (children < 0 || children > 8) {
         errors.push('Children must be between 0 and 8');
      }
      if (infants < 0 || infants > 8) {
         errors.push('Infants must be between 0 and 8');
      }
      if (from.toUpperCase() === to.toUpperCase()) {
         errors.push('Departure and arrival airports cannot be the same');
      }

      return { isValid: errors.length === 0, errors };
   }

   // Transform raw API response to standardized format
   transformFlight(flight, index) {
      try {
         const segment = flight.flights?.[0];

         if (!segment) return null;

         return {
            id: `FLT${Date.now()}${index}`,

            // Airline info
            flightNumber: segment.flight_number || 'N/A',
            airline: segment.airline || 'Unknown',
            airlineLogo: segment.airline_logo || '',
            aircraft: segment.aircraft || 'N/A',

            // Airports & Times
            from: segment.departure_airport?.airport_code || '',
            fromCity: segment.departure_airport?.airport_name || '',
            to: segment.arrival_airport?.airport_code || '',
            toCity: segment.arrival_airport?.airport_name || '',

            // Times from segment
            departureTime: segment.departure_airport?.time || flight.departure_time || '',
            arrivalTime: segment.arrival_airport?.time || flight.arrival_time || '',

            // Duration & Stops
            duration: flight.duration?.text || 'N/A',
            durationMinutes: flight.duration?.raw || 0,
            stops: flight.stops || 0,
            layovers: flight.layovers || null,

            // Seat Info
            seat: segment.seat || 'Standard',
            legroom: segment.legroom || 'N/A',

            // Baggage Info
            carryOn: flight.bags?.carry_on || 0,
            checkedBags: flight.bags?.checked || null,

            // Price
            price: flight.price || 0,

            // Carbon emissions if available
            carbonEmissions: flight.carbon_emissions || null,

            // Pagination token for next page
            nextToken: flight.next_token || null
         };
      } catch (err) {
         console.error('Error transforming flight:', err);
         return null;
      }
   }

   // Search flights from API
   async searchFlights(from, to, date, adults = 1, children = 0, infants = 0, returnDate = null) {
      try {
         // Validate inputs
         const validation = this.validateSearchParams(from, to, date, adults, children, infants);
         if (!validation.isValid) {
            return {
               success: false,
               errors: validation.errors,
               flights: []
            };
         }

         const params = {
            departure_id: from.toUpperCase(),
            arrival_id: to.toUpperCase(),
            outbound_date: date,
            adults: adults.toString(),
            currency: 'INR',
            language_code: 'en-US',
            country_code: 'IN'
         };

         // Add optional parameters
         if (children > 0) params.children = children.toString();
         if (infants > 0) params.infants = infants.toString();
         if (returnDate) params.return_date = returnDate;

         const options = {
            method: 'GET',
            url: this.baseUrl,
            params,
            headers: {
               'x-rapidapi-key': this.apiKey,
               'x-rapidapi-host': this.apiHost
            },
            timeout: 15000
         };

         console.log(`🔍 Searching flights: ${from} → ${to} on ${date}`);

         const response = await axios.request(options);

         if (!response.data?.data) {
            console.warn('⚠️ No flight data in API response');
            return {
               success: false,
               message: 'No flights found for this route',
               flights: [],
               count: 0
            };
         }

         // Combine topFlights and otherFlights
         const allFlights = [
            ...(response.data.data.topFlights || []),
            ...(response.data.data.otherFlights || [])
         ];

         // Transform flights
         const flights = allFlights
            .map((flight, index) => this.transformFlight(flight, index))
            .filter(flight => flight !== null)
            .sort((a, b) => a.price - b.price); // Sort by price

         console.log(`✅ Found ${flights.length} flights`);

         return {
            success: true,
            flights,
            count: flights.length,
            isMocked: false
         };

      } catch (error) {
         console.error('❌ Flight search error:', error.message);

         if (error.response?.status === 429) {
            return {
               success: false,
               message: 'Rate limit exceeded. Please try again in a moment.',
               flights: [],
               count: 0
            };
         }

         return {
            success: false,
            message: error.message || 'Failed to search flights',
            flights: [],
            count: 0
         };
      }
   }

   // Get flights with pagination token
   async getFlightsWithPagination(from, to, date, nextToken) {
      try {
         if (!nextToken) {
            return {
               success: false,
               message: 'Next token is required for pagination'
            };
         }

         const options = {
            method: 'GET',
            url: this.baseUrl,
            params: {
               departure_id: from.toUpperCase(),
               arrival_id: to.toUpperCase(),
               outbound_date: date,
               next_token: nextToken,
               currency: 'INR'
            },
            headers: {
               'x-rapidapi-key': this.apiKey,
               'x-rapidapi-host': this.apiHost
            },
            timeout: 15000
         };

         const response = await axios.request(options);

         const allFlights = [
            ...(response.data.data?.topFlights || []),
            ...(response.data.data?.otherFlights || [])
         ];

         const flights = allFlights
            .map((flight, index) => this.transformFlight(flight, index))
            .filter(flight => flight !== null)
            .sort((a, b) => a.price - b.price);

         return {
            success: true,
            flights,
            count: flights.length
         };

      } catch (error) {
         console.error('❌ Pagination error:', error.message);
         return {
            success: false,
            message: 'Failed to load more flights',
            flights: [],
            count: 0
         };
      }
   }
}

// ========== CONTROLLERS ==========

const flightService = new FlightService();

/**
 * Search Flights Controller
 * GET /api/flights/search
 * Query: from, to, date, adults, children, infants, returnDate
 */
export const searchFlights = async (req, res) => {
   try {
      const {
         from,
         to,
         date,
         adults = 1,
         children = 0,
         infants = 0,
         returnDate = null
      } = req.query;

      // Validate required fields
      if (!from || !to || !date) {
         return res.status(400).json({
            success: false,
            message: 'Missing required parameters',
            required: ['from', 'to', 'date'],
            example: '/api/flights/search?from=DEL&to=BOM&date=2025-01-15&adults=1'
         });
      }

      const result = await flightService.searchFlights(
         from,
         to,
         date,
         parseInt(adults),
         parseInt(children),
         parseInt(infants),
         returnDate
      );

      if (!result.success) {
         return res.status(400).json(result);
      }

      return res.status(200).json({
         success: true,
         data: {
            flights: result.flights,
            count: result.count,
            from,
            to,
            date,
            passengers: {
               adults: parseInt(adults),
               children: parseInt(children),
               infants: parseInt(infants)
            }
         }
      });

   } catch (error) {
      console.error('Controller error:', error);
      res.status(500).json({
         success: false,
         message: 'Internal server error',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
   }
};

/**
 * Get Flight Details Controller
 * GET /api/flights/details/:flightId
 * Query: from, to, date
 */
export const getFlightDetails = async (req, res) => {
   try {
      const { flightId } = req.params;
      const { from, to, date } = req.query;

      if (!flightId) {
         return res.status(400).json({
            success: false,
            message: 'Flight ID is required'
         });
      }

      if (!from || !to || !date) {
         return res.status(400).json({
            success: false,
            message: 'Missing required query parameters: from, to, date'
         });
      }

      // Search flights to find the specific one
      const result = await flightService.searchFlights(from, to, date);

      if (!result.success || result.flights.length === 0) {
         return res.status(404).json({
            success: false,
            message: 'No flights found'
         });
      }

      const flight = result.flights.find(f => f.id === flightId);

      if (!flight) {
         return res.status(404).json({
            success: false,
            message: 'Flight not found',
            flightId
         });
      }

      res.status(200).json({
         success: true,
         data: {
            flight,
            bookingInfo: {
               passengers: 1,
               totalPrice: flight.price,
               currency: 'INR'
            }
         }
      });

   } catch (error) {
      console.error('Controller error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch flight details',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
   }
};

/**
 * Get Next Page of Flights (Pagination)
 * GET /api/flights/next-page
 * Query: from, to, date, nextToken
 */
export const getNextPage = async (req, res) => {
   try {
      const { from, to, date, nextToken } = req.query;

      if (!from || !to || !date || !nextToken) {
         return res.status(400).json({
            success: false,
            message: 'Missing required parameters: from, to, date, nextToken'
         });
      }

      const result = await flightService.getFlightsWithPagination(from, to, date, nextToken);

      if (!result.success) {
         return res.status(400).json(result);
      }

      res.status(200).json({
         success: true,
         data: {
            flights: result.flights,
            count: result.count
         }
      });

   } catch (error) {
      console.error('Controller error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to load next page',
         error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
   }
};

/**
 * Get Flight by Airline
 * GET /api/flights/by-airline
 * Query: from, to, date, airline
 */
export const getFlightsByAirline = async (req, res) => {
   try {
      const { from, to, date, airline } = req.query;

      if (!from || !to || !date) {
         return res.status(400).json({
            success: false,
            message: 'Missing required parameters: from, to, date'
         });
      }

      if (!airline) {
         return res.status(400).json({
            success: false,
            message: 'Airline parameter is required'
         });
      }

      const result = await flightService.searchFlights(from, to, date);

      if (!result.success) {
         return res.status(400).json(result);
      }

      const filteredFlights = result.flights.filter(f =>
         f.airline.toLowerCase().includes(airline.toLowerCase())
      );

      res.status(200).json({
         success: true,
         data: {
            airline,
            flights: filteredFlights,
            count: filteredFlights.length
         }
      });

   } catch (error) {
      console.error('Controller error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch flights by airline'
      });
   }
};

/**
 * Get Cheapest Flights
 * GET /api/flights/cheapest
 * Query: from, to, date, limit
 */
export const getCheapestFlights = async (req, res) => {
   try {
      const { from, to, date, limit = 5 } = req.query;

      if (!from || !to || !date) {
         return res.status(400).json({
            success: false,
            message: 'Missing required parameters: from, to, date'
         });
      }

      const result = await flightService.searchFlights(from, to, date);

      if (!result.success) {
         return res.status(400).json(result);
      }

      const cheapest = result.flights
         .sort((a, b) => a.price - b.price)
         .slice(0, parseInt(limit));

      res.status(200).json({
         success: true,
         data: {
            flights: cheapest,
            count: cheapest.length,
            lowestPrice: cheapest[0]?.price || 0,
            highestPrice: cheapest[cheapest.length - 1]?.price || 0
         }
      });

   } catch (error) {
      console.error('Controller error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch cheapest flights'
      });
   }
};

/**
 * Get Fastest Flights
 * GET /api/flights/fastest
 * Query: from, to, date, limit
 */
export const getFastestFlights = async (req, res) => {
   try {
      const { from, to, date, limit = 5 } = req.query;

      if (!from || !to || !date) {
         return res.status(400).json({
            success: false,
            message: 'Missing required parameters: from, to, date'
         });
      }

      const result = await flightService.searchFlights(from, to, date);

      if (!result.success) {
         return res.status(400).json(result);
      }

      const fastest = result.flights
         .sort((a, b) => a.durationMinutes - b.durationMinutes)
         .slice(0, parseInt(limit));

      res.status(200).json({
         success: true,
         data: {
            flights: fastest,
            count: fastest.length,
            shortestDuration: fastest[0]?.duration || 'N/A',
            longestDuration: fastest[fastest.length - 1]?.duration || 'N/A'
         }
      });

   } catch (error) {
      console.error('Controller error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch fastest flights'
      });
   }
};

/**
 * Get Flights with Least Stops
 * GET /api/flights/direct
 * Query: from, to, date
 */
export const getDirectFlights = async (req, res) => {
   try {
      const { from, to, date } = req.query;

      if (!from || !to || !date) {
         return res.status(400).json({
            success: false,
            message: 'Missing required parameters: from, to, date'
         });
      }

      const result = await flightService.searchFlights(from, to, date);

      if (!result.success) {
         return res.status(400).json(result);
      }

      // Filter flights with 0 stops
      const directFlights = result.flights.filter(f => f.stops === 0);

      if (directFlights.length === 0) {
         return res.status(200).json({
            success: true,
            data: {
               flights: [],
               count: 0,
               message: 'No direct flights available for this route'
            }
         });
      }

      res.status(200).json({
         success: true,
         data: {
            flights: directFlights,
            count: directFlights.length
         }
      });

   } catch (error) {
      console.error('Controller error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch direct flights'
      });
   }
};

/**
 * Filter Flights by Price Range
 * GET /api/flights/by-price
 * Query: from, to, date, minPrice, maxPrice
 */
export const getFlightsByPriceRange = async (req, res) => {
   try {
      const { from, to, date, minPrice = 0, maxPrice = 100000 } = req.query;

      if (!from || !to || !date) {
         return res.status(400).json({
            success: false,
            message: 'Missing required parameters: from, to, date'
         });
      }

      const result = await flightService.searchFlights(from, to, date);

      if (!result.success) {
         return res.status(400).json(result);
      }

      const min = parseInt(minPrice);
      const max = parseInt(maxPrice);

      const filtered = result.flights.filter(f => f.price >= min && f.price <= max);

      res.status(200).json({
         success: true,
         data: {
            flights: filtered,
            count: filtered.count,
            priceRange: {
               min,
               max
            }
         }
      });

   } catch (error) {
      console.error('Controller error:', error);
      res.status(500).json({
         success: false,
         message: 'Failed to fetch flights by price range'
      });
   }
};

export default {
   searchFlights,
   getFlightDetails,
   getNextPage,
   getFlightsByAirline,
   getCheapestFlights,
   getFastestFlights,
   getDirectFlights,
   getFlightsByPriceRange
};