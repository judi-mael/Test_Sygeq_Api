/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const express = require('express')
const structureCtrl = require('../controllers/structure')
const check = require('../jsonwebtoken/check')

/***************************************/
/*** RECUPERATION DU ROUTEUR D'EXPRESS */
const router = express.Router()

/*****************************/
/*** ROUTAGE DE LA RESSOURCE */

router.get('', check.ifMIC, structureCtrl.getAll)

router.get('/filter-by/marketer/:id', check.ifMIC, structureCtrl.get)

router.put('', check.ifMIC, structureCtrl.add)


module.exports = router