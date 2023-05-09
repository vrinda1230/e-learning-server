const express = require("express");
const cors = require("cors");
import {readdirSync} from "fs";
const mongoose = require("mongoose");
const morgan = require("morgan");
require("dotenv").config();
import csrf from "csurf";
import cookieParser from "cookie-parser";
//require = require("esm")(module/*, options*/);

const csrfProtection = csrf({ cookie : true});

const app = express();

//db
mongoose.connect("mongodb+srv://root:root123456789@cluster0.c1bhctq.mongodb.net/edemy", {})
  .then(() => console.log("DB connected"))
  .catch((err) => console.log("DB Error => ", err));


//middlewares
app.use(cors());
app.use(express.json({limit:'5mb'}));
app.use(cookieParser());
app.use(morgan("dev"));

//route
readdirSync('./routes').map((r)=> 
  app.use("/api", require(`./routes/${r}`))
);
// csrf
app.use(csrfProtection);

app.get('/api/csrf-token',(req, res)=>{
  res.json({ csrfToken: req.csrfToken()});
});

// port
const port = process.env.PORT || 8000;

app.listen(port, ()=> console.log(`Server is running on port ${port}`));
