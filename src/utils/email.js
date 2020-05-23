import nodemailer from 'nodemailer';

class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.from = `Photographer.me <${process.env.EMAIL_FROM}>`;
    this.url = url;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        host: process.env.MAILGUN_HOST,
        port: process.env.MAILGUN_PORT,
        auth: {
          user: process.env.MAILGUN_USERNAME,
          pass: process.env.MAILGUN_PASSWORD,
        },
      });
    }
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.YOUR_PASSWORD,
      },
    });
  }

  async send(subject, message) {
    //define mail options
    const mailOptions = {
      from: this.from,
      //for test we can only use one email
      //this.to
      to: 'contact@pprakash.com',
      subject,
      html: message,
      // text: message,
    };

    if (process.env.NODE_ENV === 'production') {
      //for development sending email through mailgun
      await this.newTransport().sendMail(mailOptions);
    } else if (process.env.NODE_ENV === 'development') {
      //for development sending email through nodemailer
      await this.newTransport().sendMail(mailOptions);
    }
  }

  async sendWelcome() {
    const smg = `<b>Hello ${this.firstName}</b>! Welcome to PhotoGrapher community<br /> <a href="${this.url}" target="_blank">Click here to login</a><br />`;

    await this.send('Welcome to PhotoGrapher community', smg);
  }

  async sendPasswordReset() {
    const smg = `<b>Hi! ${this.firstName}</b>, Forgot your Password?<br /> <a href="${this.url}"; target="_blank">Click here to reset password</a><br />if you did not forget your password please ignore this message.`;

    await this.send('Your forget password reset token (valid for 10m)', smg);
  }
}
export default Email;
