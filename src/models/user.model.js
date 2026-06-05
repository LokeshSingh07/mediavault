import mongoose from "mongoose";
import bcrypt from "bcryptjs";


const userSchema = new mongoose.Schema({
    name: { type: String, required: true, toLowerCase: true, trim: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    password: { type: String, minLength: 6, required: true, select: false },
    role: { type: Number, enum: [1, 2, 3], default: 1 },

    isVerified: { type: Boolean, default: false },
    // verificationToken: { type: String, default: null },
    // verificationTokenExpiry: { type: Date, default: null },
    // passwordResetToken: { type: String, default: null },
    // passwordResetTokenExpiry: { type: Date, default: null },

    storageUsed:  { type: Number, default: 0 },        // bytes used
    storageLimit: { type: Number, default: 1 * 1024 * 1024 * 1024 }, // 1GB default
    
    isBlocked: { type: Boolean, default: false },
    blockedAt: { type: Date, default: null },
    blockedReason: { type: String, default: null },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },

    lastLoginAt: { type: Date, default: null },
    lastLoginIP: { type: String, default: null },
    lastLoginUserAgent: { type: String, default: null },

}, { timestamps: true });


// middleware -> hash password
userSchema.pre("save", async function(){
    if(this.isModified("password")){
        this.password = await bcrypt.hash(this.password, 10);
    }
})

// methods -> compare password
userSchema.methods.comparePassword = async function(password){
    return await bcrypt.compare(password, this.password);
}

// remove password
userSchema.methods.toJSON = function(){
    const obj = this.toObject();
    delete obj.password;
    return obj;
}



export const User =  mongoose.model("User", userSchema);