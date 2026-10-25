import express from "express"
import {
    addBusiness,
    getUserBusinesses,
    getSingleBusiness,
    updateBusiness,
    deleteBusiness
} from "../controllers/businessController.js"
import authanticateToken from "../utils/authMiddleware.js"

const router = express.Router()

router.post('/api/add-business', authanticateToken, addBusiness)
router.get('/api/get-my-businesses', authanticateToken, getUserBusinesses)
router.get('/api/get-single-business/:bid', authanticateToken, getSingleBusiness)
router.put('/api/update-business/:bid', authanticateToken, updateBusiness)
router.delete('/api/delete-business/:bid', authanticateToken, deleteBusiness)

export default router
