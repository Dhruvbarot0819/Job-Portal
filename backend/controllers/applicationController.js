import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { Application } from "../models/applicationSchema.js";
import { Job } from "../models/jobSchema.js";
import { v2 as cloudinary } from "cloudinary";

export const postApplication = catchAsyncErrors(async (req, res, next) => {
  const { 
    address,
    coverLetter,
    email,
    name, 
    phone,
    jobId,
    jobTitle
  } = req.body;

  const employerId = req.user;

  // Validate required fields
  if (!address || !coverLetter || !email || !name || !phone || !jobId || !jobTitle || !employerId) {
    return next(new ErrorHandler('Please fill all required fields', 400));
  }

  try {
    const application = await Application.create({
      jobSeekerInfo: {
        id: req.user._id, // Assuming you have user info in req.user after authentication
        name,
        email,
        phone,
        address,
        coverLetter,
        role: 'Job Seeker',
        // resume: {
        //   public_id: req.file?.public_id || '', // If you're handling file uploads
        //   url: req.file?.url || ''
        // }
      },
      employerInfo: {
        id: employerId,
        role: 'Employer'
      },
      jobInfo: {
        jobId,
        jobTitle
      },
      deletedBy: {
        jobSeeker: false,
        employer: false
      }
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: application
    });

  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
  const { id } = req.params;
  console.log(id);
  // const { name, email, phone, address, coverLetter } = req.body;
  // console.log(name, email, phone, address, coverLetter);
  // if (!name || !email || !phone || !address || !coverLetter) {
  //   console.log("if statement is acciqutate");
  //   return next(new ErrorHandler("All fields are required.", 400));
  // }
  // const jobSeekerInfo = {
  //   id: req.user._id,
  //   name,
  //   email,
  //   phone,
  //   address,
  //   coverLetter,
  //   role: "Job Seeker",
  // };
  // console.log(jobSeekerInfo);
  // console.log('8888888888888888888888888888888')
  // console.log(id)
  // const jobDetails = await Job.findById(id);
  // if (!jobDetails) {
  //   return next(new ErrorHandler("Job not found.", 404));
  // }
  // const isAlreadyApplied = await Application.findOne({
  //   "jobInfo.jobId": id,
  //   "jobSeekerInfo.id": req.user._id,
  // });
  // if (isAlreadyApplied) {
  //   return next(
  //     new ErrorHandler("You have already applied for this job.", 400)
  //   );
  // }
  // if (req.files && req.files.resume) {
  //   const { resume } = req.files;
  //   console.log("=================================");
  //   console.log(resume);
  //   try {
  //     const cloudinaryResponse = await cloudinary.uploader.upload(
  //       resume.tempFilePath,
  //       {
  //         folder: "Job_Seekers_Resume",
  //       }
  //     );
  //     if (!cloudinaryResponse || cloudinaryResponse.error) {
  //       return next(
  //         new ErrorHandler("Failed to upload resume to cloudinary.", 500)
  //       );
  //     }
  //     jobSeekerInfo.resume = {
  //       public_id: cloudinaryResponse.public_id,
  //       url: cloudinaryResponse.secure_url,
  //     };
  //   } catch (error) {
  //     console.log(error);
  //     return next(new ErrorHandler("Failed to upload resume "+error, 500));

  //   }
  // } else {
  //   if (req.user && !req.user.resume.url) {
  //     return next(new ErrorHandler("Please upload your resume.", 400));
  //   }
  //   jobSeekerInfo.resume = {
  //     public_id: req.user && req.user.resume.public_id,
  //     url: req.user && req.user.resume.url,
  //   };
  // }
  // const employerInfo = {
  //   id: jobDetails.postedBy,
  //   role: "Employer",
  // };
  // const jobInfo = {
  //   jobId: id,
  //   jobTitle: jobDetails.title,
  // };
  // const application = await Application.create({
  //   jobSeekerInfo,
  //   employerInfo,
  //   jobInfo,
  // });
  res.status(201).json({
    success: true,
    message: "Application submitted.",
    application,
  });
});

export const employerGetAllApplication = catchAsyncErrors(async (req, res, next) => {
  try {
    const { _id } = req.user;
    const { page = 1, limit = 10, sortBy = 'newest' } = req.query;

    // Build query
    const query = {
      "employerInfo.id": _id,
      "deletedBy.employer": false,
    };

    // Add sorting
    let sortOptions = {};
    if (sortBy === 'newest') {
      sortOptions = { createdAt: -1 };
    } else if (sortBy === 'oldest') {
      sortOptions = { createdAt: 1 };
    }

    // Count total documents for pagination
    const totalApplications = await Application.countDocuments(query);

    // Get paginated results
    const applications = await Application.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-deletedBy') // Optionally exclude some fields
      .populate('jobSeekerInfo.id', 'name email') // Populate additional user details if needed
      .lean(); // Convert to plain JavaScript objects for better performance

    // If no applications found
    if (!applications.length) {
      return res.status(200).json({
        success: true,
        message: "No applications found",
        applications: [],
        pagination: {
          total: 0,
          pages: 0,
          currentPage: parseInt(page),
          perPage: parseInt(limit)
        }
      });
    }

    res.status(200).json({
      success: true,
      message: "Applications retrieved successfully",
      applications,
      pagination: {
        total: totalApplications,
        pages: Math.ceil(totalApplications / limit),
        currentPage: parseInt(page),
        perPage: parseInt(limit)
      }
    });

  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

export const jobSeekerGetAllApplication = catchAsyncErrors(
  async (req, res, next) => {
    const { _id } = req.user;
    const applications = await Application.find({
      "jobSeekerInfo.id": _id,
      "deletedBy.jobSeeker": false,
    });
    res.status(200).json({
      success: true,
      applications,
    });
  }
);

export const deleteApplication = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const application = await Application.findById(id);
  if (!application) {
    return next(new ErrorHandler("Application not found.", 404));
  }
  const { role } = req.user;
  switch (role) {
    case "Job Seeker":
      application.deletedBy.jobSeeker = true;
      await application.save();
      break;
    case "Employer":
      application.deletedBy.employer = true;
      await application.save();
      break;

    default:
      console.log("Default case for application delete function.");
      break;
  }

  if (
    application.deletedBy.employer === true &&
    application.deletedBy.jobSeeker === true
  ) {
    await application.deleteOne();
  }
  res.status(200).json({
    success: true,
    message: "Application Deleted.",
  });
});

export const addJobApplication = catchAsyncErrors(async (req, res, next) => {
  
});
