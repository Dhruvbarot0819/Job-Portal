import express from "express";
import { config } from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connection } from "./database/connection.js";
import { errorMiddleware } from "./middlewares/error.js";
import fileUpload from "express-fileupload";
import userRouter from "./routes/userRouter.js";
import jobRouter from "./routes/jobRouter.js";
import applicationRouter from "./routes/applicationRouter.js";
import { newsLetterCron } from "./automation/newsLetterCron.js";
import { isAuthenticated } from './middlewares/auth.js'
import { Application } from './models/applicationSchema.js'


const app = express();
config({ path: "./config/config.env" });

app.use(
  cors({
    origin: [process.env.FRONTEND_URL],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

app.use("/api/v1/user", userRouter);
app.use("/api/v1/job", jobRouter);
app.use("/api/v1/application", applicationRouter);
// app.post('/api/addJobApplication', isAuthenticated, async (req, res, next) => {
//   console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
//   const { 
//     address,
//     coverLetter,
//     email,
//     name, 
//     phone,
//     jobId,
//     jobTitle
//   } = req.body;

//   const employerId = req.user;

//   // Validate required fields
//   if (!address || !coverLetter || !email || !name || !phone || !jobId || !jobTitle || !employerId) {
//     return next(new ErrorHandler('Please fill all required fields', 400));
//   }

//   try {
//     const application = await Application.create({
//       jobSeekerInfo: {
//         id: req.user._id, // Assuming you have user info in req.user after authentication
//         name,
//         email,
//         phone,
//         address,
//         coverLetter,
//         role: 'Job Seeker',
//         // resume: {
//         //   public_id: req.file?.public_id || '', // If you're handling file uploads
//         //   url: req.file?.url || ''
//         // }
//       },
//       employerInfo: {
//         id: employerId,
//         role: 'Employer'
//       },
//       jobInfo: {
//         jobId,
//         jobTitle
//       },
//       deletedBy: {
//         jobSeeker: false,
//         employer: false
//       }
//     });

//     res.status(201).json({
//       success: true,
//       message: 'Application submitted successfully',
//       data: application
//     });

//   } catch (error) {
//     return next(new ErrorHandler(error.message, 500));
//   }
// });

newsLetterCron()
connection();
app.use(errorMiddleware);

export default app;
