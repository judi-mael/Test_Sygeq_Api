/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const express = require('express')
const htCtrl = require('../controllers/historiqueTarif')
const check = require('../jsonwebtoken/check')

/***************************************/
/*** RECUPERATION DU ROUTEUR D'EXPRESS */
const router = express.Router()

/*****************************/
/*** ROUTAGE DE LA RESSOURCE */

router.get('', check.ifUser, htCtrl.getAll)


module.exports = router