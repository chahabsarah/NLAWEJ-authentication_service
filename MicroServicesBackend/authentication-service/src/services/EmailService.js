const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

/* ****************************creating SMTP Transporter start***************************** */
var smtpTransport = nodemailer.createTransport({
  host: "smtp.gmail.com",
  transportMethod: "SMTP",
  port: 465,
//ensuring email security using TLS connexion
  secure: true,
//authentication details
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
 // useful when working with self-signed certificate
    rejectUnauthorized: false
  },
});
smtpTransport.verify((error) => {
  if (error) {
    console.error('SMTP Error:', error);
  } else {
    console.log('SMTP Server ready');
  }
});
/* ****************************creating SMTP Transporter end***************************** */

/* ****************************sending verification Email start*************************** */
async function sendVerificationCode(email, code) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    //recipient's email 
    to:email,
    subject: 'Email Verification',
    text: `Your verification code is: ${code}`,
  };
//sendMail is a method of  smtpTransport  object
  await smtpTransport.sendMail(mailOptions);
}
/* ****************************sending verification Email end*************************** */

/* ***************sending credentials to the client after verifying his account start***************** */
async function sendCredentials(email, randomPassword) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to:email,
    subject: 'Credentials',
    text: `Use these credentials to login(you have to change password once connected):
    Email :${email}
    Password :${randomPassword}`,
  };
//sendMail is a method of  smtpTransport  object
  await smtpTransport.sendMail(mailOptions);
}
/* ***************sending credentials to the client after verifying his account end***************** */

/* *****************reset password email alert start**************************** */
async function updatePasswordAlert(email) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to:email,
    subject: 'Updated Password',
    text: `your password has been updated!`,
  };
//sendMail is a method of  smtpTransport  object
  await smtpTransport.sendMail(mailOptions);
}
/* *****************reset password email alert end**************************** */

/* **********************email to help reset password start******************* */
async function forgotPasswordReset(email,recoverPassword) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to:email,
    subject: 'New Password',
    text: `this is your new password: ${recoverPassword}`,
  };
//sendMail is a method of  smtpTransport  object
  await smtpTransport.sendMail(mailOptions);
}
/* **********************email to help reset password end******************* */

/* ***************update email request sent to admin start********************************** */
async function updateEmailRequest(email) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to:email,
    subject: 'Email updating request',
    text: `your email updating request has been sent
     to the admin, you will be notified when your email will be approved!`,
  };
//sendMail is a method of  smtpTransport  object
  await smtpTransport.sendMail(mailOptions);
}
/* ***************update email request sent to admin end********************************** */

/* ********************************update email request approved start**************** */
async function approvedEmail(email) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to:email,
    subject: 'Approved Email',
    text: `your email has been approved!`,
  };
//sendMail is a method of  smtpTransport  object
  await smtpTransport.sendMail(mailOptions);
}
/* ********************************update email request approved end**************** */

/* ******************recoveryEmail alert start********************* */
async function recoveryEmailAlert(email, recoveryEmail) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to:email,
    subject: 'Recovery Email',
    text: `your have added this recovery email  to your account:  ${recoveryEmail}!`,
  };
//sendMail is a method of  smtpTransport  object
  await smtpTransport.sendMail(mailOptions);
}
/* ******************recoveryEmail alert end********************* */


/* ****************************sending verification Email for trusted device start*************************** */
async function sendTrustDeviceCode(email, trustDeviceCode) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    //recipient's email 
    to:email,
    subject: 'IP verification ',
    text: `Your verification code for the new device is: ${trustDeviceCode}`,
  };
//sendMail is a method of  smtpTransport  object
  await smtpTransport.sendMail(mailOptions);
}
/* ****************************sending verification Email for trusted device end*************************** */


/* ****************************Meeting Related Email Functions Start*************************** */
async function sendAdminNotification(meeting) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    subject: `New meeting request from ${meeting.companyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Meeting Request</h2>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #444;">Company Details</h3>
          <p><strong>Company:</strong> ${meeting.companyName}</p>
          <p><strong>Contact:</strong> ${meeting.contactFirstName} ${meeting.contactLastName}</p>
          <p><strong>Email:</strong> ${meeting.email}</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #444;">Meeting Details</h3>
          <p><strong>Opportunity:</strong> ${meeting.opportunity.category} - ${meeting.opportunity.question}</p>
          <p><strong>Location:</strong> ${meeting.location_city}, ${meeting.location_country_name}</p>
          <p><strong>Scheduled Time:</strong> ${meeting.slot.toLocaleString()}</p>
          <p><strong>Notes:</strong> ${meeting.notes || 'None'}</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.BASE_URL}/api/meetings/${meeting._id}/approve" 
             style="display: inline-block; background-color: #4CAF50; color: white; padding: 12px 24px; 
                    text-align: center; text-decoration: none; border-radius: 4px; margin-right: 10px;
                    font-weight: bold; border: none; cursor: pointer;">
            Approve
          </a>
          
          <a href="${process.env.BASE_URL}/api/meetings/${meeting._id}/reject" 
             style="display: inline-block; background-color: #f44336; color: white; padding: 12px 24px; 
                    text-align: center; text-decoration: none; border-radius: 4px;
                    font-weight: bold; border: none; cursor: pointer;">
            Reject
          </a>
        </div>
        
        <p style="margin-top: 30px; color: #777; font-size: 12px;">
          This meeting request was submitted via our scheduling system.
        </p>
      </div>
    `
  };

  await smtpTransport.sendMail(mailOptions);
}

async function sendClientEmail(clientEmail, subject, text) {
  try {
    const mailOptions = {
      from: `"Meeting System" <${process.env.EMAIL_USER}>`,
      to: clientEmail,
      subject,
      text,
      html: `<p>${text}</p>`
    };
    await smtpTransport.sendMail(mailOptions);
    console.log(`Client email sent to ${clientEmail}`);
  } catch (error) {
    console.error('Error sending client email:', error);
  }
}
/* ****************************Meeting Related Email Functions End*************************** */


module.exports = { sendVerificationCode,sendCredentials,updatePasswordAlert,
  forgotPasswordReset,updateEmailRequest,approvedEmail,recoveryEmailAlert,sendTrustDeviceCode, sendAdminNotification,
  sendClientEmail};
