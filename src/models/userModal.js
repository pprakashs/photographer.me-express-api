import crypto from 'crypto';
import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name must be required'],
    },
    email: {
      type: String,
      required: [true, 'Email must be required'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide valid email'],
    },
    username: {
      type: String,
      required: [true, 'username must be required'],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Password must be required'],
      minlength: 8,
      select: false,
    },
    confirmPassword: {
      type: String,
      required: [true, 'Confirm Password must be required'],
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: 'Password does not match',
      },
    },
    avatar: String,
    bio: {
      type: String,
    },
    joinedDate: {
      type: Date,
      default: Date.now,
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    id: false,
  }
);

userSchema.virtual('photos', {
  ref: 'Photos',
  foreignField: 'user',
  localField: '_id',
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre('save', async function (next) {
  // only run this function if password was modify
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);

  //delete the confirm password
  this.confirmPassword = undefined;
  next();
});

userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  //token expires in 10 minutes
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

const User = mongoose.model('Users', userSchema);

export default User;
