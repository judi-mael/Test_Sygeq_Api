/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const express = require('express')
const userCtrl  = require('../controllers/user')
const check = require('../jsonwebtoken/check')

/***************************************/
/*** RECUPERATION DU ROUTEUR D'EXPRESS */
const router = express.Router()

/*****************************/
/*** ROUTAGE DE LA RESSOURCE */

router.get('', check.ifUser, userCtrl.getAllUsers)
router.get('/:id', check.permissionUser, userCtrl.getUser)
router.get('/profile/picture', check.ifUser, userCtrl.getImage)
router.patch('/:id', check.permissionUser, userCtrl.update) 
router.patch('/change/password', check.ifIsMe, userCtrl.updatePass)
router.post('/check-password', userCtrl.checkPass)
router.post('/password-reset', userCtrl.resetPass)
//seul les utilsateurs de type admin ou super admin font les actions suivantes
router.patch('/change_mail/:id', check.permissionUser, userCtrl.modify)
router.put('', check.adminOrSuperAdmin, userCtrl.add)
router.post('/untrash/:id', check.adminOrSuperAdmin, userCtrl.untrashUser)
router.post('/trash/:id', check.adminOrSuperAdmin, userCtrl.trashUser)
// router.delete('/:id', check.ifMIC, userCtrl.deleteUser)

router.put('/change_password_token',check.ifValideTokenResetPassword,userCtrl.changePasswordThisToken)

//MARKETER SPECIFICITIES
router.put('/marketer-admin-or-station', check.ifMarketerSuperAdmin, userCtrl.addMarketerAdminOrStation)
router.put('/station', check.ifMarketerCanAddStation, userCtrl.addStationUser)

//DEPOT SPECIFICITIES
router.put('/depot-admin', check.ifDepotSuperAdmin, userCtrl.addDepotAdminOrUser)
router.put('/depot-user', check.ifDepotAdmin, userCtrl.addDepotUser)


module.exports = router

