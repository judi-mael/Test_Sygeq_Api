
const {User} = require('../../models')
const nodemailer = require("nodemailer")
const jwt = require('jsonwebtoken')
const crypto = require('crypto');

// Fonction pour hacher un ID entier


exports.sendAccountConfirmationEmailMarketr = (name, username, email, password, nom) => {
  // const name = 'Dieudonné';
  // const username = 'mtechbenin';
  // const email = 'mtechbenin@gmail.com';
  // const password = 'password';
  // const link = process.env.WEBAPP_LINK

  const output = `

            <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">
            <div style="padding: 20px; background: #eeeeee; margin-bottom: 50px;">
                <h3 style="color:#555555; text-align: center;">REPUBLIQUE DU BENIN</h3>
                <div style="height: 8px; width: 300px; background-color: rgb(0, 133, 89); border-radius: 5px; margin: auto;">
                    <div style="height: 8px; width: 150px; background-color: rgb(229, 48, 9); border-radius: 0 5px 5px 0; margin: 0 0 0 auto; padding:0;">
                        <div style="height: 4px; width: 100%; background-color: rgb(255, 212, 0); border-radius: 0 5px 0 0;"></div>
                    </div>
                </div>
                <h4 style="color:#555555; text-align: center;">Ministère de l'Industrie et du Commerce</h4>
            </div>

            <div>
                <div style="text-align: center; width:400px; margin:auto;">
                    <h1 style="color:rgb(0, 133, 89);">Compte créé avec succès!</h1>
                    <p style="font-size: 18px; font-weight:600; letter-spacing:1px; color:#555555;">Cher(e) ${name}</p>
                    <p style="font-size: 18px; font-weight:600; letter-spacing:1px; color:#555555;">
                        Pour le déploiement de votre base de donnée SyGeQ, veuillez télécharger le fichier Excel attaché à 
                        ce mail et insérez les données à la demande. Après renseignement de ses données, veuillez renvoyer le 
                        fichier à jour en répondant à ce mail et en mettant en copie le mail suivant : info@reexom.com. 
                    </p>
                    <p style="font-size: 18px; font-weight:600; letter-spacing:1px; color:#555555;">
                       <strong> NB :</strong> Le délai de réponse est prévu pour le <strong>10/11/2023.</strong>
                    </p>
                    <p style="font-size: 18px; font-weight:600; letter-spacing:1px; color:#555555;">
                        Pour plus d'information, veuillez contacter le +22999998929.
                    </p>
                    <p style="font-size: 18px; font-weight:600; letter-spacing:1px; color:#555555;">Pour vous connecter veuillez utiliser les informations ci-dessous:</p>
                </div>
                <div style="background-color: rgba(255, 212, 0, 0.1); border-radius:15px; padding:20px; width:400px; margin:auto;">
                    <p style="font-size:18px;">
                        Nom d'utilisateur: <b>${username}</b>
                    </p>

                    <p style="font-size:18px;">
                        Mot de passe: <b>${password}</b>
                    </p>
                </div>

                <p style="text-align: center; margin-top: 30px;">
                  <a href=\`${process.env.WEBAPP_LINK}\` style="display: inline-block; margin:auto; background-color: rgb(0, 133, 89); color:white; font-weight: bold; padding: 15px 30px; text-decoration: none; border-radius: 10px;" target="_blank">Se connecter</a>
                  <br> Ou simplement copier le lien ci dessous dans un navigateur <br>
                  <a href=\`${process.env.WEBAPP_LINK}\`>${process.env.WEBAPP_LINK}</a>
                </p>
            </div>

            <div style="padding: 20px; background: #eeeeee; margin-top: 50px; text-align: center;">
               
                <b>---------- SyGeQ-Péréquation hydrocarbures-MICBénin ----------</b>
            </div>
          </div>

        `;
  //  <p>
  //             <i>Ceci est un message automatique, merci de ne pas y répondre.</i>
  //         </p>
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: process.env.MAIL_SERVER,
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.MAIL_USER, // generated ethereal user
      pass: process.env.MAIL_PASS  // generated ethereal password
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  // setup email data with unicode symbols
  let mailOptions = {
    from: `"MIC BJ" <${process.env.MAIL_USER}>`, // sender address
    to: email, // list of receivers
    subject: 'Identifiants de compte', // Subject line
    text: 'Hello world?', // plain text body
    html: output,// html body
    // attachments: [
    //       {
    //           filename: 'SyGeQ_'+nom+'.xlsx',
    //           path: process.env.SERVER_DIR+'/public/uploads/SyGeQ_Form.xlsx',
    //       },
    //    ]
  };

  // send mail with defined transport object
  transporter.sendMail(mailOptions, (error, info) => {
    // console.log('in here')
    if (error) {
      console.log('Mailing process failed for ' + email)
      console.log(error)
      // return res.status(500).json({message: 'Sth went wrong'})
    }
    console.log('Confirmation code sent to: ' + email);
  });
}

exports.sendAccountConfirmationEmail = (name, username, email, password) => {
  // const name = 'Dieudonné';
  // const username = 'mtechbenin';
  // const email = 'mtechbenin@gmail.com';
  // const password = 'password';
  // const link = process.env.WEBAPP_LINK

  const output = `

            <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">
            <div style="padding: 20px; background: #eeeeee; margin-bottom: 50px;">
                <h3 style="color:#555555; text-align: center;">REPUBLIQUE DU BENIN</h3>
                <div style="height: 8px; width: 300px; background-color: rgb(0, 133, 89); border-radius: 5px; margin: auto;">
                    <div style="height: 8px; width: 150px; background-color: rgb(229, 48, 9); border-radius: 0 5px 5px 0; margin: 0 0 0 auto; padding:0;">
                        <div style="height: 4px; width: 100%; background-color: rgb(255, 212, 0); border-radius: 0 5px 0 0;"></div>
                    </div>
                </div>
                <h4 style="color:#555555; text-align: center;">Ministère de l'Industrie et du Commerce</h4>
            </div>

            <div>
                <div style="text-align: center; width:400px; margin:auto;">
                    <h1 style="color:rgb(0, 133, 89);">Compte créé avec succès!</h1>
                    <p style="font-size: 18px; font-weight:600; letter-spacing:1px; color:#555555;">Cher(e) ${name}</p>
                    <p style="font-size: 18px; font-weight:600; letter-spacing:1px; color:#555555;">Votre compte a bien été créé. Pour vous connecter veuillez utiliser les informations ci-dessous:</p>
                </div>
                <div style="background-color: rgba(255, 212, 0, 0.1); border-radius:15px; padding:20px; width:400px; margin:auto;">
                    <p style="font-size:18px;">
                        Nom d'utilisateur: <b>${username}</b>
                    </p>

                    <p style="font-size:18px;">
                        Mot de passe: <b>${password}</b>
                    </p>
                </div>

                <p style="text-align: center; margin-top: 30px;">
                  <a href=\`${process.env.WEBAPP_LINK}\` style="display: inline-block; margin:auto; background-color: rgb(0, 133, 89); color:white; font-weight: bold; padding: 15px 30px; text-decoration: none; border-radius: 10px;" target="_blank">Se connecter</a>
                  <br> Ou simplement copier le lien ci dessous dans un navigateur <br>
                  <a href=\`${process.env.WEBAPP_LINK}\`>${process.env.WEBAPP_LINK}</a>
                </p>
            </div>

            <div style="padding: 20px; background: #eeeeee; margin-top: 50px; text-align: center;">
                <p>
                    <i>Ceci est un message automatique, merci de ne pas y répondre.</i>
                </p>
                <b>---------- SyGeQ-Péréquation hydrocarbures-MICBénin ----------</b>
            </div>
          </div>

        `;
                // <b>&copy; ${new Date().getFullYear()} | MIC BJ | 3DT | REEXOM</b>
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: process.env.MAIL_SERVER,
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.MAIL_USER, // generated ethereal user
      pass: process.env.MAIL_PASS  // generated ethereal password
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  // setup email data with unicode symbols
  let mailOptions = {
    from: `"MIC BJ" <${process.env.MAIL_USER}>`, // sender address
    to: email, // list of receivers
    subject: 'Identifiants de compte', // Subject line
    text: 'Hello world?', // plain text body
    html: output,// html body
  };

  // send mail with defined transport object
  transporter.sendMail(mailOptions, (error, info) => {
    // console.log('in here')
    if (error) {
      console.log('Mailing process failed for ' + email)
      console.log(error)
      // return res.status(500).json({message: 'Sth went wrong'})
    }
    console.log('Confirmation code sent to: ' + email);
  });
}

exports.sendPasswordResetEmail = (name, email, token) => {

  const output = `
  
              <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">
              <div style="padding: 20px; background: #eeeeee; margin-bottom: 50px;">
                  <h3 style="color:#555555; text-align: center;">REPUBLIQUE DU BENIN</h3>
                  <div style="height: 8px; width: 300px; background-color: rgb(0, 133, 89); border-radius: 5px; margin: auto;">
                      <div style="height: 8px; width: 150px; background-color: rgb(229, 48, 9); border-radius: 0 5px 5px 0; margin: 0 0 0 auto; padding:0;">
                          <div style="height: 4px; width: 100%; background-color: rgb(255, 212, 0); border-radius: 0 5px 0 0;"></div>
                      </div>
                  </div>
                  <h4 style="color:#555555; text-align: center;">Ministère de l'Industrie et du Commerce</h4>
              </div>
  
              <div>
                  <div style="text-align: center; width:400px; margin:auto;">
                      <h1 style="color:rgb(0, 133, 89);">Réinitialisation de Mot de passe.</h1>
                      <p style="font-size: 18px; font-weight:600; letter-spacing:1px; color:#555555;">Bonjour cher(e) ${name}</p>
                      <p style="font-size: 18px; font-weight:600; letter-spacing:1px; color:#555555;">Vous avez demandé à réinitialiser votre mot de passe. Pour procéder à la réinitialisation, veuillez cliquer sur le lien ci-dessous :</p>
                  </div>
                  
                  <p style="text-align: center; margin-top: 30px;">
                      <a href=\`${process.env.WEBAPP_LINK}${token}\` style="display: inline-block; margin:auto; background-color: rgb(0, 133, 89); color:white; font-weight: bold; padding: 15px 30px; text-decoration: none; border-radius: 10px;" target="_blank">Réinitialiser</a>
                      <br> Ou simplement copier le lien ci dessous dans un navigateur <br>
                      <a href=\`${process.env.WEBAPP_LINK}${token}\`>${process.env.WEBAPP_LINK}${token}</a>
                  </p>
                  <p style="text-align: center; margin-top: 30px;">
                      Ce lien est valable pendant 24h pour des raisons de sécurité. Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer ce message.
                      Si vous avez des questions ou avez besoin d'assistance, n'hésitez pas à nous contacter.
                  </p>
              </div>
  
              <div style="padding: 20px; background: #eeeeee; margin-top: 50px; text-align: center;">
                  <p>
                      <i>Ceci est un message automatique, merci de ne pas y répondre. Si vous n'êtes pas l'auteur de la demande, merci de contacter notre support technique pour une investigation approfondie</i>
                  </p>
                  <b>---------- SyGeQ-Péréquation hydrocarbures-MICBénin ----------</b>
              </div>
            </div>
  
          `;

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: process.env.MAIL_SERVER,
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.MAIL_USER, // generated ethereal user
      pass: process.env.MAIL_PASS  // generated ethereal password
    },
    tls: {
      rejectUnauthorized: false
    }
  });


  // setup email data with unicode symbols
  let mailOptions = {
    from: `"MIC BJ" <${process.env.MAIL_USER}>`, // sender address
    to: email, // list of receivers
    subject: 'Reinitialisation de mot de passe', // Subject line
    text: 'Hello world?', // plain text body
    html: output // html body
  };


  // send mail with defined transport object
  transporter.sendMail(mailOptions, (error, info) => {
    // console.log('in here')
    if (error) {
      console.log('Mailing process failed for ' + email)
      console.log(error)
      // return res.status(500).json({message: 'Sth went wrong'})
    }
    // console.log('Confirmation code sent to: '+email);
  });
}

async function sendMail(email, subject, output) {
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: process.env.MAIL_SERVER,
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.MAIL_USER, // generated ethereal user
      pass: process.env.MAIL_PASS  // generated ethereal password
    },
    tls: {
      rejectUnauthorized: false
    }
  });


  // setup email data with unicode symbols
  let mailOptions = {
    from: `"MIC BJ" <${process.env.MAIL_USER}>`, // sender address
    to: email, // list of receivers
    subject: subject, // Subject line
    text: 'Hello world?', // plain text body
    html: output // html body
  };


  // send mail with defined transport object
  transporter.sendMail(mailOptions, (error, info) => {
    // console.log('in here')
    if (error) {
      console.log('Mailing process failed for ' + email)
      console.log(error)
      // return res.status(500).json({message: 'Sth went wrong'})
    }
    // console.log('Confirmation code sent to: '+email);
  });
}

exports.mailSingle = async (id, label, description) => {
  try {
    let user = await User.findByPk(id)
    await sendMail(user.email, label,
      `
          <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">
          <div style="padding: 20px; background: #eeeeee; margin-bottom: 50px;">
              <h3 style="color:#555555; text-align: center;">REPUBLIQUE DU BENIN</h3>
              <div style="height: 8px; width: 300px; background-color: rgb(0, 133, 89); border-radius: 5px; margin: auto;">
                  <div style="height: 8px; width: 150px; background-color: rgb(229, 48, 9); border-radius: 0 5px 5px 0; margin: 0 0 0 auto; padding:0;">
                      <div style="height: 4px; width: 100%; background-color: rgb(255, 212, 0); border-radius: 0 5px 0 0;"></div>
                  </div>
              </div>
              <h4 style="color:#555555; text-align: center;">Ministère de l'Industrie et du Commerce</h4>
          </div>
  
          <div>
              <div style="text-align: center; width:400px; margin:auto;">
                  <h1 style="color:rgb(0, 133, 89);">SYGEQ</h1>
                  <p style="font-size: 18px; font-weight:600; letter-spacing:1px; color:#555555;">Madame, Monsieur,</p>
                  <p style="font-size: 18px; font-weight:600; letter-spacing:1px; color:#555555;">${description}</p>
              </div>
  
              <p style="text-align: center; margin-top: 30px;">
                  <a href=\`${process.env.WEBAPP_LINK}\` style="display: inline-block; margin:auto; background-color: rgb(0, 133, 89); color:white; font-weight: bold; padding: 15px 30px; text-decoration: none; border-radius: 10px;" target="_blank">Se connecter</a>
                  <br> Ou simplement copier le lien ci dessous dans un navigateur <br>
                  <a href=\`${process.env.WEBAPP_LINK}\`>${process.env.WEBAPP_LINK}</a>
              </p>
          </div>
  
          <div style="padding: 20px; background: #eeeeee; margin-top: 50px; text-align: center;">
              <p>
                  <i>Ceci est un message automatique, merci de ne pas y répondre.</i>
              </p>
              <b>---------- SyGeQ-Péréquation hydrocarbures-MICBénin ----------</b>
          </div>
        </div>
          `);

  } catch (err) {
    // console.log(err);
    console.log(`Failed mailing single`);
  }
}

exports.mailContratTransporter = async (id, contrat_id, label, description) => {

  try {

    function encodeId(idx) {
      result = jwt.sign({id: idx}, process.env.JWT_SECRET, { expiresIn: process.env.JWT_SPEC_ENC })
      return result;
  }


    // let user = await User.findByPk(id);    

    let transporter = await DB.Transporteur.findByPk(id);
    const encodedId = encodeId(contrat_id);
    const voir = `transporteur/tmail/${encodedId}`
    console.log("*************>transporter");
    // console.log(transporter);
    await sendMail(transporter.email, label,
      `
          <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">
          <div style="padding: 20px; background: #eeeeee; margin-bottom: 50px;">
              <h3 style="color:#555555; text-align: center;">REPUBLIQUE DU BENIN</h3>
              <div style="height: 8px; width: 300px; background-color: rgb(0, 133, 89); border-radius: 5px; margin: auto;">
                  <div style="height: 8px; width: 150px; background-color: rgb(229, 48, 9); border-radius: 0 5px 5px 0; margin: 0 0 0 auto; padding:0;">
                      <div style="height: 4px; width: 100%; background-color: rgb(255, 212, 0); border-radius: 0 5px 0 0;"></div>
                  </div>
              </div>
              <h4 style="color:#555555; text-align: center;">Ministère de l'Industrie et du Commerce</h4>
          </div>
  
          <div>
              <div style="text-align: center; width:400px; margin:auto;">
                  <h1 style="color:rgb(0, 133, 89);">SyGeQ</h1>
                  <p style="font-size: 18px; font-weight:600; letter-spacing:1px; color:#555555;">Madame, Monsieur,</p>
                  <p style="font-size: 18px; font-weight:600; letter-spacing:1px; color:#555555;">${description}</p>
              </div>
  
              <p style="text-align: center; margin-top: 30px;">
                  <a href="${process.env.WEBAPP_LINK + voir}" id="accepted" style="display: inline-block; margin:auto; background-color: rgb(0, 133, 89); color:white; font-weight: bold; padding: 15px 30px; text-decoration: none; border-radius: 10px;" target="_blank">Voir</a>
                  <br> <br/> <span class="">Si vous n'avez pas connaissance d'un tel contrat vous pouvez simplement ignorer ce mail</span>  <br> <br/>
               </p>
          </div>
  
          <div style="padding: 20px; background: #eeeeee; margin-top: 50px; text-align: center;">
              <p>
                  <i>Ceci est un message automatique, merci de ne pas y répondre.</i>
              </p>
              <b>---------- SyGeQ-Péréquation hydrocarbures-MICBénin ----------</b>
          </div>

        </div>
          `);

  } catch (err) {
    console.log(err);
    console.log(`Failed mailing transporter `);
  }
}

exports.mailAllUsersOfAType = async (type, label, description) => {
  try {
    let users = await User.findAll({ where: { type: type } })
    for (const user of users) {
      await sendMail(user.email, label,
        `
          <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">
          <div style="padding: 20px; background: #eeeeee; margin-bottom: 50px;">
              <h3 style="color:#555555; text-align: center;">REPUBLIQUE DU BENIN</h3>
              <div style="height: 8px; width: 300px; background-color: rgb(0, 133, 89); border-radius: 5px; margin: auto;">
                  <div style="height: 8px; width: 150px; background-color: rgb(229, 48, 9); border-radius: 0 5px 5px 0; margin: 0 0 0 auto; padding:0;">
                      <div style="height: 4px; width: 100%; background-color: rgb(255, 212, 0); border-radius: 0 5px 0 0;"></div>
                  </div>
              </div>
              <h4 style="color:#555555; text-align: center;">Ministère de l'Industrie et du Commerce</h4>
          </div>
  
          <div>
              <div style="text-align: center; width:400px; margin:auto;">
                  <h1 style="color:rgb(0, 133, 89);">SYGEQ</h1>
                  <p style="font-size: 18px; font-weight:600; letter-spacing:1px; color:#555555;">Madame, Monsieur,</p>
                  <p style="font-size: 18px; font-weight:600; letter-spacing:1px; color:#555555;">${description}</p>
              </div>
  
              <p style="text-align: center; margin-top: 30px;">
                  <a href=\`${process.env.WEBAPP_LINK}\` style="display: inline-block; margin:auto; background-color: rgb(0, 133, 89); color:white; font-weight: bold; padding: 15px 30px; text-decoration: none; border-radius: 10px;" target="_blank">Se connecter</a>
                  <br> Ou simplement copier le lien ci dessous dans un navigateur <br>
                  <a href=\`${process.env.WEBAPP_LINK}\`>${process.env.WEBAPP_LINK}</a> 
              </p>
          </div>
  
          <div style="padding: 20px; background: #eeeeee; margin-top: 50px; text-align: center;">
              <p>
                  <i>Ceci est un message automatique, merci de ne pas y répondre.</i>
              </p>
              <b>---------- SyGeQ-Péréquation hydrocarbures-MICBénin ----------</b>
          </div>
        </div>
          `);
    }
  } catch (err) {
    console.log(err);
    console.log(`Failed mailing all ${type}`);
  }
}

exports.mailAllEverybody = async (label, description) => {
  try {
    let users = await User.findAll()
    for (const user of users) {
      await sendMail(user.email, label,
        `
          <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">
          <div style="padding: 20px; background: #eeeeee; margin-bottom: 50px;">
              <h3 style="color:#555555; text-align: center;">REPUBLIQUE DU BENIN</h3>
              <div style="height: 8px; width: 300px; background-color: rgb(0, 133, 89); border-radius: 5px; margin: auto;">
                  <div style="height: 8px; width: 150px; background-color: rgb(229, 48, 9); border-radius: 0 5px 5px 0; margin: 0 0 0 auto; padding:0;">
                      <div style="height: 4px; width: 100%; background-color: rgb(255, 212, 0); border-radius: 0 5px 0 0;"></div>
                  </div>
              </div>
              <h4 style="color:#555555; text-align: center;">Ministère de l'Industrie et du Commerce</h4>
          </div>
  
          <div>
              <div style="text-align: center; width:400px; margin:auto;">
                  <h1 style="color:rgb(0, 133, 89);">SYGEQ</h1>
                  <p style="font-size: 18px; font-weight:600; letter-spacing:1px; color:#555555;">Madame, Monsieur,</p>
                  <p style="font-size: 18px; font-weight:600; letter-spacing:1px; color:#555555;">${description}</p>
              </div>
  
              <p style="text-align: center; margin-top: 30px;">
                  <a href=\`${process.env.WEBAPP_LINK}\` style="display: inline-block; margin:auto; background-color: rgb(0, 133, 89); color:white; font-weight: bold; padding: 15px 30px; text-decoration: none; border-radius: 10px;" target="_blank">Se connecter</a>
                  <br> Ou simplement copier le lien ci dessous dans un navigateur <br>
                  <a href=\`${process.env.WEBAPP_LINK}\`>${process.env.WEBAPP_LINK}</a>
              </p>
          </div>
  
          <div style="padding: 20px; background: #eeeeee; margin-top: 50px; text-align: center;">
              <p>
                  <i>Ceci est un message automatique, merci de ne pas y répondre.</i>
              </p>
              <b>---------- SyGeQ-Péréquation hydrocarbures-MICBénin ----------</b>
          </div>
        </div>
          `);
    }
  } catch (err) {
    // console.log(err);
    console.log('Failed notifing all users');
  }
}