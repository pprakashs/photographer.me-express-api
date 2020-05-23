import express from 'express';
import authController from './../controllers/authController';
import photoUploadController from './../controllers/photoUploadController';
import photoController from '../controllers/photoController';

const router = express.Router();

router.route('/').post(authController.protected, photoUploadController, photoController.createPhoto);

export default router;
