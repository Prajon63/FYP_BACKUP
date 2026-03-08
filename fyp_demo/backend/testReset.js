import mongoose from 'mongoose';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

async function testReset() {
    await mongoose.connect(process.env.MONGO_URI);
    const User = (await import('./models/User.js')).default;
    const { sendResetEmail } = await import('./config/mailer.js');

    const email = 'prajonjung63@gmail.com'; // User's email from their message
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
        console.log("User not found!");
        process.exit(0);
    }

    console.log("User found, saving token...");
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);

    try {
        await user.save();
        console.log("Token saved ok!");
    } catch (err) {
        console.error("ERROR SAVING USER:", err);
        process.exit(1);
    }

    try {
        await sendResetEmail({ to: user.email, resetLink: 'http://localhost' });
        console.log("Email sent ok!");
    } catch (err) {
        console.error("ERROR SENDING EMAIL:", err);
        process.exit(1);
    }

    console.log("All done!");
    process.exit(0);
}

testReset();
