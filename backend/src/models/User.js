import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
   username: {
      type: String,
      required: true,
      unique: true
   },
   name: {
      type: String,
      required: true
   },
   email: {
      type: String,
      required: true,
      unique: true
   },
   password: {
      type: String,
      required: true
   },
   isVerified: {
      type: Boolean,
      default: false
   },
   role: {
      type: String,
      enum: ['user', "provider", 'admin'],
      default: 'user'
   }
}, { timestamps: true });

const userModel = mongoose.model('User', userSchema);

export default userModel;