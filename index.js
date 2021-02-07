
var Mailgun = require('mailgun-js');
var mailcomposer = require('mailcomposer');

var SimpleMailgunAdapter = mailgunOptions => {
  if (!mailgunOptions || !mailgunOptions.apiKey || !mailgunOptions.domain || !mailgunOptions.fromAddress || ! mailgunOptions.typeOfCustomersToVerify) {
    throw 'SimpleMailgunAdapter requires an API Key, domain, fromAddress and typeOfCustomersToVerify.';
  }

  mailgunOptions.verificationSubject =
    mailgunOptions.verificationSubject ||
    {en: 'Please verify your e-mail for %appname%'};
  mailgunOptions.verificationBody =
    mailgunOptions.verificationBody || {en: 'Hi,\n\nYou are being asked to confirm the e-mail address %email% ' +
    'with %appname%\n\nClick here to confirm it:\n%link%'};
  mailgunOptions.passwordResetSubject =
    mailgunOptions.passwordResetSubject || {en: 'Password Reset Request for %appname%'};
  mailgunOptions.passwordResetBody =
    mailgunOptions.passwordResetBody || {en: 'Hi,\n\nYou requested a password reset for %appname%.\n\nClick here ' +
    'to reset it:\n%link%'};

  var mailgun = Mailgun(mailgunOptions);

  function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
  }
  
  function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
  }
  
  function fillVariables(text, options) {
    text = replaceAll(text, "%username%", options.user.get("username"));
    text = replaceAll(text, "%email%", options.user.get("email"));
    text = replaceAll(text, "%appname%", options.appName);
    text = replaceAll(text, "%link%", options.link);
    return text;
  }

  function getRecipient(user) {
      return user.get("email") || user.get('username')
  }

  var sendVerificationEmail = options => {
    let user = options.user;
    let customerType = user.get('typeOfCustomer');
    let userLanguage = user.get('language') || 'en';

    if(mailgunOptions.typeOfCustomersToVerify.indexOf(customerType) < 0 ){
      console.log(`Email not sent because customer type is ${customerType}`);
      return Promise.resolve();
    }

    if(mailgunOptions.verificationBodyHTML){
      var mail = mailcomposer({
        from: mailgunOptions.fromAddress,
        to: getRecipient(options.user),
        subject: fillVariables(mailgunOptions.verificationSubject[userLanguage], options),
        text: fillVariables(mailgunOptions.verificationBody[userLanguage], options),
        html: fillVariables(mailgunOptions.verificationBodyHTML[userLanguage], options)
      });
      return new Promise((resolve, reject) => {
      	mail.build((mailBuildError, message) => {
          if(mailBuildError){
            return reject(mailBuildError);
          }
          var dataToSend = {
            to: getRecipient(options.user),
            message: message.toString('ascii')
          };
          mailgun.messages().sendMime(dataToSend, (err, body) => {
            if (err) {
              return reject(err);
            }
            resolve(body);
          });
        }).catch(err => {
          reject(err);
        });
      });
    }else{
      var data = {
        from: mailgunOptions.fromAddress,
        to: getRecipient(options.user),
        subject: fillVariables(mailgunOptions.verificationSubject[userLanguage], options),
        text: fillVariables(mailgunOptions.verificationBody[userLanguage], options)
      }
      return new Promise((resolve, reject) => {
        mailgun.messages().send(data, (err, body) => {
          if (err) {
            reject(err);return;
          }
          resolve(body);
        });
      });
    }
  }

  var sendPasswordResetEmail = options => {
    let user = options.user;
    let userLanguage = user.get('language') || 'en';

    if(mailgunOptions.passwordResetBodyHTML){
      var mail = mailcomposer({
        from: mailgunOptions.fromAddress,
        to: getRecipient(options.user),
        subject: fillVariables(mailgunOptions.passwordResetSubject[userLanguage], options),
        text: fillVariables(mailgunOptions.passwordResetBody[userLanguage], options),
        html: fillVariables(mailgunOptions.passwordResetBodyHTML[userLanguage], options)
      });
      return new Promise((resolve, reject) => {
      	mail.build((mailBuildError, message) => {
          if(mailBuildError){
            return reject(mailBuildError);
          }
          var dataToSend = {
            to: getRecipient(options.user),
            message: message.toString('ascii')
          };
          mailgun.messages().sendMime(dataToSend, (err, body) => {
            if (err) {
              return reject(err);
            }
            resolve(body);
          });
        }).catch(err => {
          reject(err);
        });
      });
    }else{
      var data = {
        from: mailgunOptions.fromAddress,
        to: getRecipient(options.user),
        subject: fillVariables(mailgunOptions.passwordResetSubject[userLanguage], options),
        text: fillVariables(mailgunOptions.passwordResetBody[userLanguage], options)
      }
      return new Promise((resolve, reject) => {
        mailgun.messages().send(data, (err, body) => {
          if (err) {
            reject(err);return;
          }
          resolve(body);
        });
      });
    }
  }

  var sendMail = mail => {
    if(mail.html){
      var mailC = mailcomposer({
        from: mailgunOptions.fromAddress,
        to: mail.to,
        subject: mail.subject,
        text: mail.text,
        html: mail.html
      });
      return new Promise((resolve, reject) => {
      	mailC.build((mailBuildError, message) => {
          if(mailBuildError){
            return reject(mailBuildError);
          }
          var dataToSend = {
            to: mail.to,
            message: message.toString('ascii')
          };
          mailgun.messages().sendMime(dataToSend, (err, body) => {
            if (err) {
              return reject(err);
            }
            resolve(body);
          });
        }).catch(err => {
          reject(err);
        });
      });
    }else{
      var data = {
        from: mailgunOptions.fromAddress,
        to: mail.to,
        subject: mail.subject,
        text: mail.text
      }
      return new Promise((resolve, reject) => {
        mailgun.messages().send(data, (err, body) => {
          if (err) {
            reject(err);return;
          }
          resolve(body);
        });
      });
    }
  }

  return Object.freeze({
    sendVerificationEmail: sendVerificationEmail,
    sendPasswordResetEmail: sendPasswordResetEmail,
    sendMail: sendMail
  });
}

module.exports = SimpleMailgunAdapter
