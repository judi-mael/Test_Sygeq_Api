/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const express = require('express')
const contratCtrl = require('../controllers/contrat')
const check = require('../jsonwebtoken/check')

/***************************************/
/*** RECUPERATION DU ROUTEUR D'EXPRESS */
const router = express.Router()

/*****************************/
/*** ROUTAGE DE LA RESSOURCE */

router.get('', check.ifMarketerOrMIC, contratCtrl.getAll)

router.get('/:id', check.ifMarketerOrMIC, contratCtrl.get)

router.put('', check.ifMarketer, contratCtrl.add)

router.patch('/annuler/:id', check.ifMarketer, contratCtrl.cancel)

router.patch('/approuver/:id',  contratCtrl.approve)

router.patch('/rejeter/:id', contratCtrl.reject)
// router.patch('/approuver/:id', check.ifMIC, contratCtrl.approve)

// router.patch('/rejeter/:id', check.ifMIC, contratCtrl.reject)




module.exports = router