/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const express = require('express')
const tfCtrl = require('../controllers/tauxForfaitaire')
const check = require('../jsonwebtoken/check')

/***************************************/
/*** RECUPERATION DU ROUTEUR D'EXPRESS */
const router = express.Router()

/*****************************/
/*** ROUTAGE DE LA RESSOURCE */

router.get('', check.ifUser, tfCtrl.getAll)

router.get('/:id', check.ifUser, tfCtrl.get)

router.get('/filter-by-statut/:statut', check.ifUser, tfCtrl.getAll)

router.put('', check.ifMIC, tfCtrl.add)

// router.patch('/:id', check.ifMIC, tfCtrl.update)

// router.post('/untrash/:id', check.ifMIC, tfCtrl.untrash)

// router.delete('/trash/:id', check.ifMIC, tfCtrl.trash)

// router.delete('/:id', check.ifMIC, tfCtrl.delete)


module.exports = router