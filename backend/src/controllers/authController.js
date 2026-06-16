import userModel from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// register user
export const register = async (req, res) => {
   try {
      const { username, name, email, password, role } = req.body;

      // check if user already exists
      const existingUser = await userModel.findOne({
         $or: [
            { username },
            { email }
         ]
      });

      if (existingUser) {
         return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password
      const hash = await bcrypt.hash(password, 10);

      const newUser = new userModel({
         username,
         name,
         email,
         password: hash,
         role
      })

      // generate token
      const token = jwt.sign(
         {
            id: newUser._id,
            role: newUser.role
         },
         process.env.JWT_SECRET,
         { expiresIn: '30d' }
      );

      res.cookie("token", token);

      await newUser.save();


      // for passing the massage 
      res.status(201).json({
         message: 'User registered successfully',
         user: {
            id: newUser._id,
            username: newUser.username,
            name: newUser.name,
            email: newUser.email,
            phone: newUser.phone,
            password: newUser.password,
            role: newUser.role,
         },

         token
      });

   } catch (error) {
      res.status(500).json({ message: error.message });
   }
}


// Login user
export const login = async (req, res) => {
   try {
      const { username, email, password } = req.body;

      // check if user exists
      const user = await userModel.findOne({
         $or: [
            { username },
            { email }
         ]
      });

      if (!user) {
         return res.status(404).json({ message: 'User not found' });
      }

      // check if password is correct
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
         return res.status(400).json({ message: 'Invalid credentials' });
      }

      // generate token
      const token = jwt.sign(
         {
            id: user._id,
            role: user.role
         },
         process.env.JWT_SECRET,
         { expiresIn: '30d' }
      );

      res.cookie("token", token);

      res.status(200).json({
         message: 'User logged in successfully',
         user: {
            id: user._id,
            username: user.username,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
         },
         token
      });
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
}


// logout user
export const logout = async (req, res) => {
   try {
      res.clearCookie("token");
      res.status(200).json({ message: 'User logged out successfully' });
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
}