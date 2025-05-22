/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const express = require('express')
const fileCtrl = require('../controllers/file')
const check = require('../jsonwebtoken/check')

/***************************************/
/*** RECUPERATION DU ROUTEUR D'EXPRESS */
const router = express.Router()

/*****************************/
/*** ROUTAGE DE LA RESSOURCE */

router.put('/image', check.ifUser, fileCtrl.addPicture)
router.put('/document', check.ifUser, fileCtrl.addDocument)

module.exports = router