import express from "express";

const router = express.Router();
//middleware
import { requireSignin} from "../middlewares";
//import {create} from "../../client/pages/instructor/course/create"


import {makeInstructor, 
       getAccountStatus ,
       currentInstructor,
       instructorCourses,
       studentCount,
} from '../controllers/instructor.js';

router.post('/make-instructor',requireSignin, makeInstructor );
router.post('/get-account-status', requireSignin, getAccountStatus);
router.get('/current-instructor', requireSignin, currentInstructor);
//router.get('/course/create', requireSignin, create);

router.get('/instructor-courses', requireSignin, instructorCourses)

router.post('/instructor/student-count', requireSignin, studentCount);

module.exports = router;
