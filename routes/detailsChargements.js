/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const express = require('express')
const dcCtrl = require('../controllers/detailsChargement')
const check = require('../jsonwebtoken/check')

/***************************************/
/*** RECUPERATION DU ROUTEUR D'EXPRESS */
const router = express.Router()

/*****************************/
/*** ROUTAGE DE LA RESSOURCE */

router.get('', check.ifUser, dcCtrl.getAll)

router.get('/:id', check.ifUser, dcCtrl.get)

router.put('', check.ifDepot, dcCtrl.add)

router.patch('/:id', check.ifDepot, dcCtrl.update)

router.post('/untrash/:id', check.ifDepot, dcCtrl.untrash)

router.post('/trash/:id', check.ifDepot, dcCtrl.trash)

// router.delete('/:id', check.ifDepot, dcCtrl.delete)


module.exports = router