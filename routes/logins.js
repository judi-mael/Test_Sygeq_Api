/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const express = require('express')
const logCtrl = require('../controllers/login')
const check = require('../jsonwebtoken/check')

/***************************************/
/*** RECUPERATION DU ROUTEUR D'EXPRESS */
const router = express.Router()

/*****************************/
/*** ROUTAGE DE LA RESSOURCE */

router.get('', check.ifUser, logCtrl.getAll)

module.exports = router