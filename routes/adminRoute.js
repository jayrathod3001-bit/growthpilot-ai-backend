import express from 'express'
import adminMiddleware from '../utils/adminMiddleware.js'
import {
    adminLogin,
    getDashboardStats,
    adminGetAllUsers,
    adminGetUserDetail,
    adminUpdateUser,
    adminDeleteUser,
    adminGetAllBusinesses,
    adminUpdateBusiness,
    adminDeleteBusiness
} from '../controllers/adminController.js'
import {
    adminGetAllInquiries,
    adminReplyInquiry,
    adminDeleteInquiry
} from '../controllers/inquiryController.js'

const adminRouter = express.Router()

// Public - Admin Login
adminRouter.post('/api/admin/login', adminLogin)

// Protected - Admin only
adminRouter.get('/api/admin/stats', adminMiddleware, getDashboardStats)

adminRouter.get('/api/admin/users', adminMiddleware, adminGetAllUsers)
adminRouter.get('/api/admin/users/:uid', adminMiddleware, adminGetUserDetail)
adminRouter.put('/api/admin/users/:uid', adminMiddleware, adminUpdateUser)
adminRouter.delete('/api/admin/users/:uid', adminMiddleware, adminDeleteUser)

adminRouter.get('/api/admin/businesses', adminMiddleware, adminGetAllBusinesses)
adminRouter.put('/api/admin/businesses/:bid', adminMiddleware, adminUpdateBusiness)
adminRouter.delete('/api/admin/businesses/:bid', adminMiddleware, adminDeleteBusiness)

// Inquiries & Support Messages (Admin)
adminRouter.get('/api/admin/inquiries', adminMiddleware, adminGetAllInquiries)
adminRouter.post('/api/admin/inquiries/:id/reply', adminMiddleware, adminReplyInquiry)
adminRouter.delete('/api/admin/inquiries/:id', adminMiddleware, adminDeleteInquiry)

export default adminRouter

