import User from "../models/user";
//import queryString from "query-string";
import Course from "../models/course";
const stripe = require("stripe")(process.env.STRIPE_SECRET);

export const makeInstructor = async (req, res) => {
   try {
         console.log(req.auth);
        //find user from DB
        const user = await User.findById(req.auth._id);
        // if user don't have  stripe_account, then create a new one
        console.log(user);
        if (!user.stripe_account_id) {
            const account = await stripe.accounts.create({ type: "standard" });
            //console.log('ACCOUNT=> , account.id');
            user.stripe_account_id = account.id;
            user.save();
        }
        //create account link based on account id(from frontend to complete onboarding)
        let accountLink = await stripe.accountLinks.create({
            account: user.stripe_account_id,
            refresh_url: process.env.STRIPE_REDIRECT_URL,
            return_url: process.env.STRIPE_REDIRECT_URL,
            type: 'account_onboarding',

        })
        //pre-fill any info such as email, then send url response to frontend
        accountLink = Object.assign(accountLink, {
            "stripe_user[email]": user.email,
        });
        // send the account link as response to frontend

        res.send(`${accountLink.url}?${JSON.stringify(accountLink)}`);

    } catch (err) {
        console.log("MAKE INSTRUCTOR ERROR", err);
    }
};

export const getAccountStatus= async(req,res)=>{
    try{
        const user = await User.findById(req.auth._id);
        const account= await stripe.accounts.retrieve(user.stripe_account_id);
        //console.log('Account=>',account);
        //return;

        if(!account.charges_enabled){
            return res.status(401).send("Unauthorized");
        }else{
            const statusUpdated = await User.findByIdAndUpdate(
                user._id,{
                   stripe_seller:account,
                   $addToSet:{role: "Instructor"},
                },
                {new: true}
            )
            .select("-password")
            .exec();
            res.json(statusUpdated);
        }
    }catch(err){
        console.log(err);
    }
}

export const currentInstructor = async(req, res)=>{
    try{
        let user = await User.findById(req.auth._id).select('-password').exec();
        if(!user.role.includes('Instructor')){
            return res.sendStatus(403);
        }else{
            res.json({ok:true});
        }

    }catch(err){
        console.log(err);
    }
}

export const instructorCourses = async(req, res)=>{
    try{
        const courses = await Course.find({instructor: req.auth._id})
          .sort({createdAt: -1})
          .exec();
          res.json(courses);

    }catch(err){
        console.log(err);
    }
}

export const studentCount= async (req, res)=>{
    try{
        //this users is an array of those students who enrolled in the course! 
        //in front end, we will calculate the user.length for calculating the number of students enrolled!
        
        const users = await User.find({courses: req.body.courseId})
            .select('_id')
            .exec();
        res.json(users);
    } catch (err){
        console.log(err);
    }
}