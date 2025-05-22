try {
    
} catch (error) {
    console.log("=========================",error)
}
/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const express = require('express')
const authCtrl = require('../controllers/auth')
// const mailerCtrl = require('../controllers/_internal/mailer')

/***************************************/
/*** RECUPERATION DU ROUTEUR D'EXPRESS */
const router = express.Router()

/*****************************/
/*** ROUTAGE DE LA RESSOURCE */

router.post('/uname-login', authCtrl.unameLogin)
router.post('/email-login', authCtrl.emailLogin)

// router.post('/:confirmationUUID', authCtrl.emailConfirmation)

// router.get('/test', mailerCtrl.sendAccountConfirmationEmail)

module.exports = router