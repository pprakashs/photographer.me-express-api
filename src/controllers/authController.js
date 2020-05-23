import crypto from 'crypto';
import User from '../models/userModal';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import Email from '../utils/email';

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE_IN,
  });
};

const createSendToken = async (user, statusCode, res) => {
  const token = signToken(user._id);

  //cookie options
  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };
  // if environment is production then https only se to true
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  // setting up the cookie
  res.cookie('photographer_jwt', token, cookieOptions);

  //removing password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

const AuthController = {
  //signup controller
  signup: async (req, res, next) => {
    try {
      const newUser = await User.create(req.body);

      const url = `${req.protocol}://${req.get('host')}/login`;

      //sending welcome email
      await new Email(newUser, url).sendWelcome();

      createSendToken(newUser, 201, res);
    } catch (err) {
      res.status(401).json({
        status: 'fail',
        message: err,
      });
    }
  },

  //login controller
  login: async (req, res, next) => {
    try {
      const { username, email, password } = req.body;

      let loginType;
      username ? (loginType = 'username') : (loginType = 'email');

      //1) if email or username and password is missing
      if ((!username || !password) && (!email || !password)) {
        throw `Please provide ${loginType} and password!`;
      }

      //2)  if user exist or password is correct
      const user = username ? await User.findOne({ username }).select('+password') : await User.findOne({ email }).select('+password');

      if (!user || !(await user.correctPassword(password, user.password))) {
        throw `Incorrect ${loginType} or password`;
      }

      //3) sending the token to client
      const token = signToken(user._id);
      createSendToken(user, 200, res);
    } catch (err) {
      res.status(401).json({
        status: 'fail',
        message: err,
      });
    }
  },

  //logout controller
  logout: (req, res) => {
    res.cookie('photographer_jwt', 'loggedout', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });
    res.status(200).json({ status: 'success' });
  },

  //protected controller
  protected: async (req, res, next) => {
    try {
      //get the token
      let token;
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
      } else if (req.cookies.photographer_jwt) {
        token = req.cookies.photographer_jwt;
      }
      if (!token) throw 'You are not logged in! Please log in to get access';
      //decode the token
      const decoded = await jwt.verify(token, process.env.JWT_SECRET);
      //checking if user is still exist
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        throw 'The user belonging with the token does not exists.';
      }
      //if user change password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        throw 'User Recently changed the password please login again';
      }
      //  GRANT ACCESS TO PROTECTED ROUTE
      res.locals.user = currentUser;
      req.user = currentUser;
      next();
    } catch (err) {
      res.status(401).json({
        status: 'fail',
        message: err,
      });
    }
  },

  //loggedin controller
  isLoggedIn: async (req, res, next) => {
    //get the token
    if (req.cookies.photographer_jwt) {
      try {
        //decode the token
        const decoded = await jwt.verify(req.cookies.photographer_jwt, process.env.JWT_SECRET);
        //checking if user is still exist
        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
          return next();
        }
        //if user change password after the token was issued
        if (currentUser.changedPasswordAfter(decoded.iat)) {
          return next();
        }
        //  THERE IS A LOGGED IN USER
        res.locals.user = currentUser;
        return next();
      } catch (err) {
        return next();
      }
    }
    next();
  },

  //forgot password controller
  forgotPassword: async (req, res, next) => {
    try {
      const { username, email } = req.body;

      let loginType;
      username ? (loginType = 'username') : (loginType = 'email');

      // checking if username or email provided or not
      if (!username && !email) throw `Please provide your username or email!`;

      // checking if email address is valid or not
      if (email && !validator.isEmail(email)) throw `Invalid email! please provide valid email or username`;

      //getting user from collection
      const user = username ? await User.findOne({ username }) : await User.findOne({ email });

      //checking if there is user exist or not
      if (!user) throw `there is no user with that ${loginType}`;

      //2) generate the random token
      const resetToken = user.createPasswordResetToken();
      await user.save({ validateBeforeSave: false });

      //3) send the email to user
      const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
      try {
        await new Email(user, resetUrl).sendPasswordReset();

        res.status(200).json({
          status: 'success',
          message: 'Token message to email!',
        });
      } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        res.status(400).json({
          status: 'There was an error sending the email trying again later',
          message: err,
        });
      }
    } catch (err) {
      res.status(404).json({
        status: 'fail',
        message: err,
      });
    }
  },

  resetPassword: async (req, res, next) => {
    try {
      // getting user based on token
      const hashToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

      const user = await User.findOne({
        passwordResetToken: hashToken,
        passwordResetExpires: { $gt: Date.now() },
      });

      // setting the new password if the token is not expired and there is the user
      if (!user) {
        throw 'Token is invalid or has expired';
      }

      user.password = req.body.password;
      user.confirmPassword = req.body.confirmPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      const token = signToken(user._id);
      createSendToken(user, 200, res);
    } catch (err) {
      res.status(401).json({
        status: 'fail',
        message: err,
      });
    }
  },

  updatePassword: async (req, res, next) => {
    try {
      //get the password from collection
      const user = await User.findById(req.user._id).select('+password');
      if (!user) {
        throw 'Your not logged in to Perform this task!';
      }

      //checking if posted password is correct password
      if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
        throw 'Your current password is wrong!';
      }

      if (req.body.password !== req.body.confirmPassword) {
        throw 'New password and confirm password does not match!';
      }

      //if so update the password
      user.password = req.body.password;
      user.confirmPassword = req.body.confirmPassword;
      await user.save();

      createSendToken(user, 200, res);
    } catch (err) {
      res.status(401).json({
        status: 'fail',
        message: err,
      });
    }
  },
};

export default AuthController;
