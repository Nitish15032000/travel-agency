import axios from 'axios';
// Mock data for testing/fallback
function getMockFlights(from, to, date, adults = 1) {
   return [
      {
         id: 'MOCK1',
         flightNumber: 'AI-101',
         airline: 'Air India',
         airlineLogo: 'https://www.gstatic.com/flights/airline_logos/70px/AI.png',
         from,
         fromCity: 'Delhi',
         to,
         toCity: 'Mumbai',
         departureTime: new Date().toISOString(),
         arrivalTime: new Date(Date.now() + 7200000).toISOString(),
         duration: '2h 0m',
         price: 4999,
         stops: 0,
         aircraft: 'Airbus A320',
         seat: 'Standard',
         legroom: '31 in'
      },
      {
         id: 'MOCK2',
         flightNumber: '6E-202',
         airline: 'IndiGo',
         airlineLogo: 'https://www.gstatic.com/flights/airline_logos/70px/6E.png',
         from,
         fromCity: 'Delhi',
         to,
         toCity: 'Mumbai',
         departureTime: new Date().toISOString(),
         arrivalTime: new Date(Date.now() + 10800000).toISOString(),
         duration: '3h 0m',
         price: 3499,
         stops: 1,
         aircraft: 'Boeing 737',
         seat: 'Standard',
         legroom: '30 in'
      }
   ];
}

async function flightdata(from = "DEL", to = "PAT", date = new Date().toISOString().split("T")[0], adults = 1) {
   try {
      const options = {
         method: "GET",
         url: process.env.RAPIDAPI_BASE_URL,
         params: {
            departure_id: from,
            arrival_id: to,
            outbound_date: date,
            adults: adults.toString(),
            currency: "INR",
            language_code: "en-US",
            country_code: "IN",
         },
         headers: {
            "x-rapidapi-key": process.env.RAPIDAPI_KEY,
            "x-rapidapi-host": process.env.RAPIDAPI_HOST,
         },
      };

      const response = await axios.request(options);

      // correct API structure
      const itineraries = response.data?.data?.itineraries || {};

      const allFlights = [
         ...(itineraries.topFlights || []),
         ...(itineraries.otherFlights || []),
      ];


      const flights = [];
      allFlights.forEach((flight, index) => {
         try {
            // Flight segment details (flights array)
            const segment = flight.flights?.[0];

            if (!segment) return;

            flights.push({
               id: `FLT${Date.now()}${index}`,

               // Airline info
               flightNumber: segment.flight_number || 'N/A',
               airline: segment.airline || 'Unknown',
               airlineLogo: segment.airline_logo || '',
               booking_token: segment.booking_token || '',
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

               // Pagination token for next page
               nextToken: flight.next_token || null

            });
         } catch (err) {
            console.error('Error processing flight:', err);
         }
      });



      console.log("Number of flights :", flights.length)
      console.log("Number of flights :", flights[0])
      console.log("Number of AllFlights :", allFlights.length)
      console.log("Number of AllFlights :", allFlights[0])

      return flights; // ONLY RETURN RAW FLIGHTS
   } catch (error) {
      console.error("Flight API error:", error.message);
      return [];
   }
}
// calling for check api is working or not
// flightdata();
export default { getMockFlights, flightdata };



