/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const express = require('express')
const bcCtrl = require('../controllers/bonChargement')
const check = require('../jsonwebtoken/check')

/***************************************/
/*** RECUPERATION DU ROUTEUR D'EXPRESS */
const router = express.Router()

/*****************************/
/*** ROUTAGE DE LA RESSOURCE */

router.get('', check.ifUser, bcCtrl.getAll)

router.get('/:id', check.ifUser, bcCtrl.get)

router.put('', check.ifDepot, bcCtrl.add)

router.patch('/:id', check.ifDepot, bcCtrl.update)

router.post('/untrash/:id', check.ifDepot, bcCtrl.untrash)

router.post('/trash/:id', check.ifMIC, bcCtrl.trash)

// router.delete('/:id', check.ifDepot, bcCtrl.delete)


module.exports = router