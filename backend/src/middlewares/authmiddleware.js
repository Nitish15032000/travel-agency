const jwt = require("jsonwebtoken");


export const authAdmin = async (req, res, next) => {
   const token = req.cookies.token;

   if (!token) {
      return res.status(401).json({ message: "Unauthorized" })
   }

   try {

      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      if (decoded.role !== "admin") {
         return res.status(403).json({ message: "You don't have access" })
      }

      req.user = decoded;

      next()

   }
   catch (err) {
      console.log(err);
      return res.status(401).json({ message: "Unauthorized" })
   }
}

export const authUser = async (req, res, next) => {
   
   const token = req.cookies.token;

   if (!token) {
      res.status(401).json({ message: "Unauthorized" })
   }

   try {

      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      if (decoded.role !== "user") {
         return res.status(403).json({ message: "You don't have access" })
      }

      req.user = decoded;

      next()


   } catch (err) {
      console.log(err);
      return res.status(401).json({ message: "Unauthorized" })
   }
}

