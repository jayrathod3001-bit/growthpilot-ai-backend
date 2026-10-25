import exprees from 'express'
import cors from 'cors'
import 'dotenv/config'
import rateLimit from 'express-rate-limit'
import connectDb from './config/db.js'
import router from './routes/userRoute.js'
import businessRouter from './routes/businessRoute.js'
import adminRouter from './routes/adminRoute.js'
import imageRouter from './routes/imageRoute.js'
import aiRouter from './routes/aiRoute.js'

const app = exprees()
app.use(cors())
app.use(exprees.json({ limit: '10mb' }))
app.use(exprees.urlencoded({ extended: true, limit: '10mb' }))

// Rate limiting: general protection against abuse
const generalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 150, // limit each IP to 150 requests per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: 0, message: 'Too many requests from this IP, please try again in a minute.' }
})
app.use('/api/', generalLimiter)
app.use(router)
app.use(businessRouter)
app.use(adminRouter)
app.use(imageRouter)
app.use(aiRouter)
const PORT = process.env.PORT || 5000
app.get('/', (req, res) => {
    res.send("Backend run successfully")
})

connectDb().then(() => {
    app.listen(PORT, () => {
        console.log(`App is running on port localhost://${PORT}`)
    })
})

export default app
