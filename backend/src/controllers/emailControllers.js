import nodemailer from "nodemailer";
import userModel from "../models/userModel.js";

// Function to send email (e.g., for password reset)
export const sendEmail = async (req, res) => {
   try {
      const { email , name} = req.body;
      const user = await userModel.findOne({ email });

      if (!user) {
         return res.status(404).json({ message: 'User not found' });
      }

      // Create a transporter using your email service configuration
      const transporter = nodemailer.createTransport({
         host: process.env.EMAIL_HOST,

         auth: {
            user: process.env.EMAIL_HOST,
            pass: process.env.EMAIL_PASSWORD
         }
      });

      // Define email options
      const mailOptions = {
         from: process.env.EMAIL_HOST,
         to: email,
         subject: 'welcome to travel agency',
         text: `Hello ${name},\n\nWelcome to our travel agency! We're excited to have you on board.\n\nBest regards,\nThe Travel Agency Team`
      };

      // Send the email
      let sendEmail = await transporter.sendMail(mailOptions);

      res.status(200).json({ message: 'Email sent successfully', info: sendEmail });
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
}