/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const express = require('express')
const ttkCtrl = require('../controllers/tauxTk')
const check = require('../jsonwebtoken/check')

/***************************************/
/*** RECUPERATION DU ROUTEUR D'EXPRESS */
const router = express.Router()

/*****************************/
/*** ROUTAGE DE LA RESSOURCE */

router.get('', check.ifUser, ttkCtrl.getAll)

router.get('/:id', check.ifUser, ttkCtrl.get)

router.get('/filter-by-statut/:statut', check.ifUser, ttkCtrl.getAll)

router.put('', check.ifMIC, ttkCtrl.add)

// router.patch('/:id', check.ifMIC, ttkCtrl.update)

// router.post('/untrash/:id', check.ifMIC, ttkCtrl.untrash)

// router.delete('/trash/:id', check.ifMIC, ttkCtrl.trash)

// router.delete('/:id', check.ifMIC, ttkCtrl.delete)


module.exports = router