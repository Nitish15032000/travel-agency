import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
   user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
   },
   flight: {
      flightNumber: {
         type: String, required: true
      },
      airline: {
         type: String, required: true
      },
      airlineLogo: {
         type: String
      },
      from: {
         type: String, required: true
      },
      fromCity: {
         type: String
      },
      to: {
         type: String, required: true
      },
      toCity: {
         type: String
      },
      departureTime: {
         type: Date, required: true
      },
      arrivalTime: {
         type: Date, required: true
      },
      duration: {
         type: String
      },
      price: {
         type: Number, required: true
      },
      stops: {
         type: Number, default: 0
      },
      aircraft: {
         type: String
      },
      seat: {
         type: String
      },
      legroom: {
         type: String
      }
   },

   passengers: [
      {
         name: {
            type: String,
            required: true
         },
         age: {
            type: Number,
            required: true
         }
      }
   ],
   totalPrice: {
      type: Number,
      required: true
   },
   status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending'
   }
}, { timestamps: true });

const bookingModel = mongoose.model('Booking', bookingSchema);

export default bookingModel;