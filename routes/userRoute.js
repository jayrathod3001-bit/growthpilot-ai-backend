import express from "express"
import {
    addUser,
    sendOtp,
    sendForgotPasswordOtp,
    getUser,
    getSingleUser,
    deleteUSer,
    updateUser,
    login,
    forgotPassword,
    changePassword,
    setActiveBusiness,
    googleAuth,
    getUserNotifications
} from "../controllers/userDataController.js"
import { getUserStats, getRealAnalytics, recordUsage } from "../controllers/statsController.js"
import { createInquiry } from '../controllers/inquiryController.js'
import jwt from "jsonwebtoken"
import authanticateToken from "../utils/authMiddleware.js"

const router = express.Router()

router.post('/api/send-otp', sendOtp)
router.post('/api/add-user', addUser)
router.get('/api/get-user', authanticateToken, getUser)
router.get('/api/get-singleuser/:uid', authanticateToken, getSingleUser)
router.delete('/api/delete-user/:uid', authanticateToken, deleteUSer)
router.put('/api/update-user/:uid', authanticateToken, updateUser)
router.put('/api/set-active-business', authanticateToken, setActiveBusiness)
router.post('/api/login', login)
router.post('/api/forgot-password-otp', sendForgotPasswordOtp)
router.post('/api/forgot-password', forgotPassword)
router.put('/api/change-password/:uid', authanticateToken, changePassword)

// Google OAuth Authentication
router.post('/api/auth/google', googleAuth)
router.post('/api/google-login', googleAuth) // backward-compatible alias

// Live stats from MongoDB
router.get('/api/user/stats', authanticateToken, getUserStats)
router.get('/api/user/analytics-real', authanticateToken, getRealAnalytics)
router.post('/api/user/record-usage', authanticateToken, recordUsage)
router.get('/api/user/notifications', authanticateToken, getUserNotifications)

// Inquiries, Contact & Support (public)
router.post('/api/inquiries', createInquiry)

export default router


