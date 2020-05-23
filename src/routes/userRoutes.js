import express from 'express';
import authController from './../controllers/authController';
import userController from '../controllers/userController';

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);
router.patch('/updatePassword', authController.protected, authController.updatePassword);

router.get('/:username/photos', userController.getUserPhoto);

export default router;
