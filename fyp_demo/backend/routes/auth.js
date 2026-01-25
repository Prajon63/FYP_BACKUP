// const express = require('express');
import express from 'express';  //es module

// const { register, login } = require('../controllers/authController');  //importing 2 funcs from controller
import {register,login,preference,forgotPassword, resetPassword} from '../controllers/authController.js'; //es module

const router = express.Router();

router.post('/register', register);  //post le data lai show garxa
router.post('/login', login);
router.post('/preference',preference);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// module.exports = router;
export default router; //es module ko lagi default exportt