/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const express = require('express')
const dlCtrl = require('../controllers/detailsLivraison')
const check = require('../jsonwebtoken/check')

/***************************************/
/*** RECUPERATION DU ROUTEUR D'EXPRESS */
const router = express.Router()

/*****************************/
/*** ROUTAGE DE LA RESSOURCE */

router.get('/:blId', check.ifUser, dlCtrl.getAll)

router.get('/:id', check.ifUser, dlCtrl.get)

router.put('/:blId', check.ifMarketer, dlCtrl.add)

// router.patch('/:id', check.ifMarketer, dlCtrl.update)

// router.post('/untrash/:id', check.ifMarketer, dlCtrl.untrash)

// router.post('/trash/:id', check.ifMarketer, dlCtrl.trash)

// router.delete('/:id', check.ifMarketer, dlCtrl.delete)


module.exports = router