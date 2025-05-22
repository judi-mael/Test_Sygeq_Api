/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const express = require('express')
const produitCtrl = require('../controllers/produit')
const check = require('../jsonwebtoken/check')

/***************************************/
/*** RECUPERATION DU ROUTEUR D'EXPRESS */
const router = express.Router()

/*****************************/
/*** ROUTAGE DE LA RESSOURCE */

router.get('', check.ifUser, produitCtrl.getAll)

router.get('/:id', check.ifUser, produitCtrl.get)

router.get('/filter-only-one-by-name/:nom', check.ifUser, produitCtrl.getByName)

router.put('', check.ifMIC, produitCtrl.add)

router.patch('/:id', check.ifMIC, produitCtrl.update)

router.post('/untrash/:id', check.ifMIC, produitCtrl.untrash)

router.post('/trash/:id', check.ifMIC, produitCtrl.trash)

// router.delete('/:id', check.ifMIC, produitCtrl.delete)


module.exports = router