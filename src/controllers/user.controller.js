import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";


export const signup = async(req, res) => {
    try{
        const { name, email, password } = req.body;

        if(!name || !email || !password){
            return res.status(400).json({success: false, message: "All fields are required"});
        }


        // check existing user
        const existingUser = await User.findOne({email: email});
        if(existingUser){
            return res.status(400).json({success: false, message: "User already exists"});
        }

        // create user
        const user = await User.create({name, email, password});

        // cookie
        const payload = {
            id: user._id,
            email: user.email,
            role: user.role,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: "1d"});
        res.cookie("accessToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000, // 1 day
        })

        
        return res.status(201)
            .json({success: true, message: "User created successfully", token});

    }
    catch(err){
        console.log("error", err);
        return res.status(500).json({success: false, message: "Internal Server Error", errror: err.message});
    }
}


export const login = async(req, res) => {
    try{
        const { email, password } = req.body;

        if(!email || !password){
            return res.status(400).json({success: false, message: "All fields are required"});
        }

        // check existing user
        const user = await User.findOne({email: email}).select("+password");
        if(!user){
            return res.status(400).json({success: false, message: "Invalid email or password"});
        }

        // check password
        const ismatch = await user.comparePassword(password);
        if(!ismatch){
            return res.status(400).json({success: false, message: "Invalid email or password"});
        }

        // cookie
        const payload = {
            id: user._id,
            email: user.email,
            role: user.role,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: "1d"});
        res.cookie("accessToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000, // 1 day
        })

        user.password = undefined;

        return res.status(200)
            .json({success: true, message: "User logged in successfully", token});

    }
    catch(err){
        console.log("error", err);
        return res.status(500).json({success: false, message: "Internal Server Error", errror: err.message});
    }
}