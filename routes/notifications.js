/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const express = require('express')
const notifCtrl = require('../controllers/notification')
const check = require('../jsonwebtoken/check')

/***************************************/
/*** RECUPERATION DU ROUTEUR D'EXPRESS */
const router = express.Router()

/*****************************/
/*** ROUTAGE DE LA RESSOURCE */

router.get('', check.ifUser, notifCtrl.getAll)

router.post('/read-all', check.ifUser, notifCtrl.readAll)

module.exports = router