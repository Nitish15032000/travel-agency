export const validateSearchParams = async (req, res, next) => {
   const { from, to, date, adults } = req.query;

   // Validate 'from' location
   if (!from || typeof from !== 'string' || from.trim().length === 0) {
      return res.status(400).json({ error: 'Valid "from" location is required' });
   }

   // Validate 'to' location
   if (!to || typeof to !== 'string' || to.trim().length === 0) {
      return res.status(400).json({ error: 'Valid "to" location is required' });
   }

   // Validate that 'from' and 'to' are not the same
   if (from.trim().toUpperCase() === to.trim().toUpperCase()) {
      return res.status(400).json({ error: '"from" and "to" locations cannot be the same' });
   }

   // Validate date
   if (!date || isNaN(Date.parse(date))) {
      return res.status(400).json({ error: 'Valid date is required' });
   }

   // Validate number of adults
   if (!adults || isNaN(adults) || parseInt(adults) < 0) {
      return res.status(400).json({ error: 'Number of adults must be a positive integer' });
   }

   next();
};