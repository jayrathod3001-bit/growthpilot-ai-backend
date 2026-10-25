import businessData from '../models/business.js'
import userData from '../models/user.js'

// 1. Add new business for logged-in user
export const addBusiness = async (req, res) => {
    try {
        const businessObj = {
            userId: req.user.id,
            businessName: req.body.businessName,
            businessCategory: req.body.businessCategory,
            businessDescription: req.body.businessDescription || "",
            location: req.body.location || "",
            phone: req.body.phone || "",
            email: req.body.email || "",
            website: req.body.website || "",
            instagram: req.body.instagram || "",
            facebook: req.body.facebook || "",
            businessGoal: req.body.businessGoal || "",
            targetAudience: req.body.targetAudience || ""
        }

        const savedBusiness = await businessData.create(businessObj)
        await userData.findByIdAndUpdate(req.user.id, { activeBusinessId: savedBusiness._id })
        res.status(200).json({ message: "business added successfully", data: savedBusiness, status: 1 })
    } catch (error) {
        res.status(500).json({ errorMessage: error.message, status: 0 })
        console.log(error)
    }
}

// 2. Get all businesses of the logged in user + active business ID from database
export const getUserBusinesses = async (req, res) => {
    try {
        const user = await userData.findById(req.user.id).select('activeBusinessId name email')
        const businesses = await businessData.find({ userId: req.user.id })

        let activeBusinessId = user?.activeBusinessId
        if (!activeBusinessId || !businesses.some(b => b._id.toString() === activeBusinessId.toString())) {
            activeBusinessId = businesses.length > 0 ? businesses[0]._id : null
            if (activeBusinessId) {
                await userData.findByIdAndUpdate(req.user.id, { activeBusinessId })
            }
        }

        res.status(200).json({
            message: "businesses get successfully",
            data: businesses,
            activeBusinessId: activeBusinessId,
            user: user,
            status: 1
        })
    } catch (error) {
        res.status(500).json({ errorMessage: error.message, status: 0 })
    }
}

// 3. Get single business by id
export const getSingleBusiness = async (req, res) => {
    try {
        const id = req.params.bid
        const singleBusiness = await businessData.findById(id)
        if (!singleBusiness) {
            return res.status(404).json({ message: "business not found", status: 0 })
        }
        res.status(200).json({ message: "business get successfully", data: singleBusiness, status: 1 })
    } catch (error) {
        res.status(500).json({ errorMessage: error.message, status: 0 })
    }
}

// 4. Update business - strips immutable fields (_id, userId) and updates DB cleanly
export const updateBusiness = async (req, res) => {
    try {
        const id = req.params.bid
        const updateData = { ...req.body }
        delete updateData._id
        delete updateData.userId
        delete updateData.createdAt
        delete updateData.updatedAt

        const updatedBusiness = await businessData.findByIdAndUpdate(id, { $set: updateData }, {
            new: true
        })
        if (!updatedBusiness) {
            return res.status(404).json({ message: "business not found", status: 0 })
        }
        res.status(200).json({ message: "business updated successfully", data: updatedBusiness, status: 1 })
    } catch (error) {
        res.status(500).json({ errorMessage: error.message, status: 0 })
    }
}

// 5. Delete business
export const deleteBusiness = async (req, res) => {
    try {
        const id = req.params.bid
        const deletedBusiness = await businessData.findByIdAndDelete(id)
        res.status(200).json({ message: "business deleted successfully", data: deletedBusiness, status: 1 })
    } catch (error) {
        res.status(500).json({ errorMessage: error.message, status: 0 })
    }
}
