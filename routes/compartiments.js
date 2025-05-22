/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const express = require('express')
const compartimentCtrl = require('../controllers/compartiment')
const check = require('../jsonwebtoken/check')

/***************************************/
/*** RECUPERATION DU ROUTEUR D'EXPRESS */
const router = express.Router()

/*****************************/
/*** ROUTAGE DE LA RESSOURCE */

router.get('/:id', check.ifUser, compartimentCtrl.getAllOfCamion)
router.get('/compartiment/:id', check.ifUser, compartimentCtrl.getCompartimentPerCamion)
router.post('/update', check.ifUser, compartimentCtrl.updateCompartiment)

module.exports = router