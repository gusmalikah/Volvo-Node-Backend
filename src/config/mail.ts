import nodemailer from 'nodemailer'

export const transporter = nodemailer.createTransport({
  pool: true,
  service: 'hotmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    ciphers: 'SSLv3',
  },
})

transporter.verify(function (error) {
  if (error) {
    console.log(error)
  } else {
    console.log('Server is ready to send messages')
  }
})