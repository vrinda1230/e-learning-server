import express from "express";
import formidable from 'express-formidable';
const router = express.Router();

//middleware
import { requireSignin, isInstructor, isEnrollled} from "../middlewares";


import {uploadImage, 
    removeImage, 
    create, 
    read, 
    uploadVideo, 
    removeVideo, 
    addLesson, 
    update,
    removeLesson,
    updateLesson,
    unpublishCourse,
    publishCourse,
    courses,
    checkEnrollment,
    freeEnrollment,
    paidEnrollment,
    stripeSuccess,
    userCourses,
    markCompleted,
    listCompleted,
    markIncompleted,
} from '../controllers/course';

router.get("/courses", courses);
//image
router.post('/course/upload-image',uploadImage);
router.post('/course/remove-image',removeImage);
//course
router.post("/course", requireSignin, isInstructor, create);
router.put("/course/:slug", requireSignin, update);

//publish unpublish
router.put("/course/unpublish/:courseId", requireSignin, unpublishCourse);
router.put("/course/publish/:courseId", requireSignin, publishCourse);

router.get('/course/:slug', read);
router.post('/course/video-upload/:instructorId', requireSignin, formidable({ maxFileSize: 500 *1024 * 1024 * 1024 }), uploadVideo);
router.post('/course/video-remove/:instructorId', requireSignin, removeVideo);



//course/lesson/slug/instructorId
router.post('/course/lesson/:slug/:instructorId', requireSignin, addLesson);
router.put('/course/lesson/:slug/:instructorId', requireSignin, updateLesson);
router.put('/course/:slug/:lessonId', requireSignin, removeLesson);

router.get('/check-enrollment/:courseId', requireSignin, checkEnrollment)

//enrollment
router.post('/free-enrollment/:courseId', requireSignin, freeEnrollment);
router.post('/paid-enrollment/:courseId', requireSignin, paidEnrollment);
router.get('/stripe-success/:courseId', requireSignin, stripeSuccess);

router.get('/user-courses', requireSignin, userCourses);
router.get('/user/course/:slug', requireSignin, isEnrollled, read);

//mark completed
router.post('/mark-completed', requireSignin, markCompleted);
router.post('/list-completed', requireSignin, listCompleted);
router.post('/mark-incompleted', requireSignin, markIncompleted);

module.exports = router;
