export const validateUser = async (req, res, next) => {
   const { name, email, phone, role, password } = req.body;

   // Validate name
   if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required and must be a non-empty string' });
   }

   // Validate email
   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
   }

   // Validate role
   const validRoles = ['admin', 'user'];
   if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ error: `Role must be one of: ${validRoles.join(', ')}` });
   }

   // Validate password
   if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
   }

   next();
};