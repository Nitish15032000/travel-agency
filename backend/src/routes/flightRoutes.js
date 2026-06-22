import express from 'express';
import { searchFlights, getFlightDetails } from '../controllers/flightControllers.js';
import { validateSearchParams } from '../middlewares/validateSearchParams.js';


const router = express.Router();

router.get('/search',validateSearchParams, searchFlights);


export default router;