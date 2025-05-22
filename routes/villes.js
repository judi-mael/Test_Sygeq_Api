/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const express = require('express')
const villeCtrl = require('../controllers/ville')
const check = require('../jsonwebtoken/check')

/***************************************/
/*** RECUPERATION DU ROUTEUR D'EXPRESS */
const router = express.Router()

/*****************************/
/*** ROUTAGE DE LA RESSOURCE */

router.get('', check.ifUser, villeCtrl.getAll)

router.get('/filter-only-one-by-name/:nom', check.ifUser, villeCtrl.getByName)

// router.get('/:id', check.ifUser, villeCtrl.get)

router.put('', check.ifMIC, villeCtrl.addVille)
router.get('/regions', check.ifMIC, villeCtrl.getAllRegion)
// router.put('', check.ifMIC, villeCtrl.add)

// router.put('/test', villeCtrl.addTest)

// router.patch('/:id', check.ifMIC, villeCtrl.update)

// router.post('/untrash/:id', check.ifMIC, villeCtrl.untrash)

// router.delete('/trash/:id', check.ifMIC, villeCtrl.trash)

// router.delete('/:id', check.ifMIC, villeCtrl.delete)




module.exports = router