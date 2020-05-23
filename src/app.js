import express from 'express';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import cookieParser from 'cookie-parser';

import AppError from './utils/appError';
import globalErrorHandler from './utils/globalErrorHandler';
import userRouter from './routes/userRoutes';
import photoRouter from './routes/photoRoutes';

const app = express();
// MIDDLEWARE
//set security http headers
app.use(helmet());

//body parser
app.use(express.json());

app.use(cookieParser());

//data sensitization against NoSAL query
app.use(mongoSanitize());

//data sensitization against xss
app.use(xss());

app.get('/', (req, res) => {
  res.send('API service for photo.grapher.me');
});

// ROUTES
app.use('/v1/user', userRouter);
app.use('/v1/photo', photoRouter);

//Error middleware
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find this ${req.originalUrl} on this server!`, 404));
});
//Global error handler
app.use(globalErrorHandler);

export default app;
