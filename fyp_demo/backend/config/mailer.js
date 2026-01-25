import nodemailer from "nodemailer";

let transporterPromise = null;

// Ethereal transporter for development/testing
async function getTransporter() {
  if (!transporterPromise) {
    transporterPromise = nodemailer.createTestAccount().then((testAccount) => {
      return nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    });
  }
  return transporterPromise;
}

async function sendResetEmail({ to, resetLink }) {
  try {
    console.log("📧 Preparing to send reset email to:", to);
    
    const transporter = await getTransporter();
    console.log("✅ Transporter ready");

    const info = await transporter.sendMail({
      from: '"Capella Support" <no-reply@capella.local>',
      to,
      subject: "Reset your Capella password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ec4899;">Reset Your Capella Password</h2>
          <p>You requested a password reset.</p>
          <p>Click the button below to reset your password (valid for 10 minutes):</p>
          <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #ec4899, #9333ea); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">Reset Password</a>
          <p style="color: #666; font-size: 12px;">Or copy and paste this link in your browser:</p>
          <p style="color: #666; font-size: 12px; word-break: break-all;">${resetLink}</p>
          <p style="color: #999; font-size: 11px; margin-top: 30px;">If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
      text: `Reset your Capella password\n\nClick this link: ${resetLink}\n\nValid for 10 minutes.\n\nIf you did not request this, ignore this email.`,
    });

    // Shows a preview link in console (Ethereal)
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log("✅ Reset email sent successfully!");
    console.log("📧 Message ID:", info.messageId);
    
    if (previewUrl) {
      console.log("🌐 Preview URL (copy this to see the email):");
      console.log("   ", previewUrl);
      console.log("   ⚠️  Note: Check your BACKEND console/terminal for this URL, not browser console!");
    } else {
      console.log("⚠️  No preview URL available");
    }
    
    return { success: true, messageId: info.messageId, previewUrl };
  } catch (error) {
    console.error("❌ Error sending reset email:", error);
    throw error;
  }
}

export { sendResetEmail };
