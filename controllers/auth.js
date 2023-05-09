import User from '../models/user.js'
import {hashPassword, comparePassword} from '../utils/auth.js';
import jwt from "jsonwebtoken";
import AWS from 'aws-sdk';
//const nanoid = require("nanoid");

const awsConfig ={
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  apiVersion: process.env.AWS_API_VERSION,
};

const SES = new AWS.SES(awsConfig);

export const register = async (req, res)=> {

  try{
    //console.log(req.body);
    const {name, email, password} = req.body;

    // validation

    if(!name) return res.status(400).send("Name is required");
     if(!password || password.length <6){
       res.status(400).send("Password is required and should be min 6 characters long");
     }
     let userExist = await User.findOne({email}).exec();
     if(userExist) return res.status(400).send("Email is taken");

     // hash password
     const hashedPassword = await hashPassword(password);

     // register

     const user = new User({
       name, 
       email, 
       password: hashedPassword,
     });
     await user.save();
     //console.log("saved user", user);
     return res.json({ok: true});
  }catch(err){
    console.log(err);
    return res.status(400).send("Error. Try again");
  }
};

export const login = async(req, res) =>{
  try{
    //console.log(req.body);
    //check if our DB has user with that email
    const {email, password}= req.body;
    const user= await User.findOne({email}).exec();
    if(!user) return res.status(400).send("No user found");
    //check password
    const match = await comparePassword(password, user.password);
    if(!match) return res.status(400).send("Wrong password")

    // create signed jwt
    const token = jwt.sign({_id: user._id}, process.env.JWT_SECRET,
      {expiresIn: "7d",
    });
    // return user and token to client, exclude hashed password
    user.password= undefined;
    // send token in cookie
    res.cookie('token', token,{
      httpOnly: true,
      //secure: true, // works on https only
    });
    // send user as json response
    res.json(user);
  }catch(err){
    console.log(err)
    return res.status(400).send("Error. Try again.");
  }
};

export const logout = async (req, res)=>{
  try{
    res.clearCookie("token",{path:'/'});
    return res.json({message: "Signout success"});
  }catch(err){
    console.log(err);
  }
};

export const currentUser = async(req, res)=>{
  try{
    const user = await User.findById(req.auth._id).select('-password').exec();
    console.log('CURRENT_USER', user)
    return res.json({ok: true});
  } catch(err){
    console.log(err);
  }
}

export const sendTestEmail = async (req, res) =>{
  // console.log("send email using SES");
  // res.json({ok:true});
  const params={
    Source: process.env.EMAIL_FROM,
    Destination: {
      ToAddresses: ['vrinda.sharma.amu@gmail.com'],
    },
    
    ReplyToAddresses : [process.env.EMAIL_FROM],

    Message:{
      Body:{
        Html:{
          Charset: "UTF-8",
          Data: `
            <html>
              <h1>Reset Password Link</h1>
              <p>Please use the following link to reset your password</p>
            </html>
          `,
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: "Password reset link",
      },
    },
  };

  const emailSent = SES.sendEmail(params).promise();

  emailSent
    .then((data)=>{
      console.log(data);
      res.json({ok:true});
    })
    .catch((err)=>{
      console.log(err);
    });
};

export const forgotPassword = async (req, res)=>{
  try{
    const {email} = req.body;
    //console.log(email);
    //const shortCode = nanoid(6).toUpperCase();
    const shortCode = new Date().valueOf().toString().substr(6).toUpperCase();
   // console.log(uniqueId);
    const user = await User.findOneAndUpdate({email},
       {passwordResetCode:shortCode}
    );
    if (!user) return res.status(400).send("User not found");

    //prepare for email

    const params ={
      Source: process.env.EMAIL_FROM,
      Destination:{
        ToAddresses: [email]
      },
      Message:{
        Body:{
          Html:{
            Charset: 'UTF-8',
            Data:`
              <html>
                 <h1>Reset Password</h1>
                 <p>Use this code to reset your password</p>
                 <h2 style="color:red;">${shortCode}</h2>
                 <i>edemy.com</i>
              </html>
            `,
          },
        },
        Subject:{
          Charset: "UTF-8",
          Data: "Reset Password",
        },
      },
      
    };

    const emailSent =SES.sendEmail(params).promise();
    emailSent.then((data)=>{
      console.log(data);
      res.json({ok:true});
    })
    .catch((err)=>{
      console.log(err);
    });
  }catch(err){
     console.log(err);
  }
}

export const resetPassword = async(req,res)=>{
  try{
    const {email, code, newPassword} = req.body;
    //console.table({email, code, newPassword});
    const hashedPassword = await hashPassword(newPassword);
    
    const user = User.findOneAndUpdate({
      email,
      passwordResetCode : code,
    }, {
      password : hashedPassword,
      passwordResetCode:"",
    }
    ).exec();
    res.json({ok: true});

  }catch(err){
    console.log(err);
    return res.status(400).send("Error! Try again.");
  }
}
// export const register = (req, res) =>{
//   console.log(req.body);
//   res.send("register user response from controllre");
// };