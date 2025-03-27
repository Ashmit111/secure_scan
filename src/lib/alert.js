import nodemailer from "nodemailer";


export const sendAlert = async (userEmail, url, status) => {

    try {

        if (!userEmail) {
            console.log("No email found for alert");
            return;
        }
        // email alert:
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.USER_EMAIL,
                pass: process.env.USER_PASS
            },
        })

        const mailOptions = {
            from: process.env.USER_EMAIL,
            to: userEmail, // for registered user
            subject: " Website Down Alert!!",
            text: `ALERT!!: Your website :${url} is down!\n\nMessage: ${message}`,
        }

        await transporter.sendMail(mailOptions)
        console.log("Email alert sent");

    } catch (error) {
        console.log("Error while sending alert :", error);

    }
}