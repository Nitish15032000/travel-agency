import userModel from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();


// Create transporter ONCE (outside function)
const transporter = nodemailer.createTransport({
   service: "gmail",
   auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
   }
});

// Send email ASYNCHRONOUSLY (non-blocking)
async function sendWelcomeEmail(name, email) {
   try {
      const mailOptions = {
         from: process.env.EMAIL_USER,
         to: email,
         subject: 'Welcome to Travel Agency 🌍 – Your Adventure Begins Here',
         html: `
         <div style="font-family: Arial, Helvetica, sans-serif; max-width: 650px; margin: 0 auto; color: #333;">
            <div style="background: linear-gradient(135deg, #0d6efd, #0099ff); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
               <h1 style="color: #fff; margin: 0;">🌍 Welcome to Travel Agency</h1>
               <p style="color: #eaf4ff; margin-top: 10px;">
                  Your next adventure starts here
               </p>
            </div>

            <div style="padding: 35px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 12px 12px; background: #ffffff;">
               <h2 style="color: #0d6efd;">👋 Hello ${name},</h2>
               <p>
                  Thank you for joining <strong>Travel Agency</strong>! We're thrilled to have you as part of our travel community.
               </p>
               <p>
                  Whether you're dreaming of a tropical escape 🏝️, a mountain adventure ⛰️, or exploring vibrant cities 🏙️, we're here to help you create unforgettable memories.
               </p>
               <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 25px 0;">
                  <h3 style="margin-top: 0;">✨ What's waiting for you?</h3>
                  <p>🎯 Personalized travel recommendations</p>
                  <p>💰 Exclusive deals & discounts</p>
                  <p>🗺️ Curated destination guides</p>
                  <p>✈️ Hassle-free trip planning</p>
                  <p>📢 Early access to special offers</p>
               </div>
               <p>
                  Ready to discover your next destination?
               </p>
               <div style="text-align: center; margin: 30px 0;">
                  <a href="https://yourwebsite.com"
                     style="background: #0d6efd; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; display: inline-block;">
                     🚀 Explore Destinations
                  </a>
               </div>
               <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
               <p>
                  🌟 We can't wait to be part of your travel journey.
               </p>
               <p>
                  Safe travels,<br>
                  <strong>❤️ The Travel Agency Team</strong>
               </p>
            </div>


            <div style="text-align: center; color: #777; font-size: 12px; padding: 20px;">
               <p>📍 Explore • Discover • Experience</p>
               <p>© ${new Date().getFullYear()} Travel Agency. All rights reserved.</p>
            </div>
         </div>`
      };

      await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${email}`);
      return true;
   } catch (error) {
      console.error(`Email failed for ${email}:`, error);
      return false; // Don't crash if email fails
   }
}

// Register user
export const register = async (req, res) => {
   try {
      const { username, name, email, password, role } = req.body;

      // Check if user already exists
      const existingUser = await userModel.findOne({
         $or: [{ username }, { email }]
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
      });

      // Generate token
      const token = jwt.sign(
         { id: newUser._id, role: newUser.role },
         process.env.JWT_SECRET,
         { expiresIn: '30d' }
      );

      // Save user
      await newUser.save();

      // Set cookie
      res.cookie("token", token, {
         httpOnly: true,
         secure: process.env.NODE_ENV === 'production',
         maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });

      // Send email ASYNCHRONOUSLY (don't await, don't block response)
      sendWelcomeEmail(name, email).catch(err => {
         console.log('Email send failed, but user registered:', err);
      });

      //Send response immediately (don't wait for email)
      return res.status(201).json({
         message: 'User registered successfully',
         user: {
            id: newUser._id,
            username: newUser.username,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role
         },
         token
      });

   } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ message: error.message });
   }
};


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

// Forgot password
// export const forgotPassword = async (req, res){
//    const { email } = req.body;

//    // check email exits or not inside my db
//    const user = await userModel.findOne({ email })

//    if(!user){
//       return res.status(404).json({ message: 'User not found' });
//    }


// }