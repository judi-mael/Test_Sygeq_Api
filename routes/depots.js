/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const express = require('express')
const depotCtrl = require('../controllers/depot')
const check = require('../jsonwebtoken/check')

/***************************************/
/*** RECUPERATION DU ROUTEUR D'EXPRESS */
const router = express.Router()

/*****************************/
/*** ROUTAGE DE LA RESSOURCE */

router.get('', check.ifUser, depotCtrl.getAll)
router.get('/:id', check.ifUser, depotCtrl.get)
router.get('/bytype/:type', check.ifUser, depotCtrl.getAllByType)


router.get('/filter-only-one-by-name/:nom', check.ifUser, depotCtrl.getByName)

router.put('', check.ifMIC, depotCtrl.add)

router.patch('/:id', check.ifMIC, depotCtrl.update)

router.post('/untrash/:id', check.ifMIC, depotCtrl.untrash)

router.post('/trash/:id', check.ifMIC, depotCtrl.trash)

// router.delete('/:id', check.ifMIC, depotCtrl.delete)


module.exports = router