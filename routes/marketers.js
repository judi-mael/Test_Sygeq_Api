/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const express = require('express')
const marketerCtrl = require('../controllers/marketer')
const check = require('../jsonwebtoken/check')

/***************************************/
/*** RECUPERATION DU ROUTEUR D'EXPRESS */
const router = express.Router()

/*****************************/
/*** ROUTAGE DE LA RESSOURCE */

router.get('', check.ifMicDPBOrDepot, marketerCtrl.getAll)

router.get('/:id', check.ifUser, marketerCtrl.get)

router.put('', check.ifCanManageMarketers, marketerCtrl.add)

router.patch('/:id', check.ifMicorDPBorDepotOrMatketerGroup, marketerCtrl.update)

router.post('/untrash/:id', check.ifCanManageMarketers, marketerCtrl.untrash)

router.post('/trash/:id', check.ifCanManageMarketers, marketerCtrl.trash)
router.post('/untrashmulti', check.ifCanManageMarketers, marketerCtrl.multiUnTrash)


// router.delete('/:id', check.ifMIC, marketerCtrl.delete)


module.exports = router 