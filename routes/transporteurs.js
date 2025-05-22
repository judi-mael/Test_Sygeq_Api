/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const express = require('express')
const trCtrl = require('../controllers/transporteur')
const check = require('../jsonwebtoken/check')

/***************************************/
/*** RECUPERATION DU ROUTEUR D'EXPRESS */
const router = express.Router()

/*****************************/
/*** ROUTAGE DE LA RESSOURCE */

router.get('', check.ifUser, trCtrl.getAll)

router.get('/filter-by/active', check.ifUser, trCtrl.getActives)
router.get('/filter-by/inactive', check.ifUser, trCtrl.getInactives)
router.get('/filter-by/contractuals', check.ifMarketerOrMICOrDPB, trCtrl.getContractuals)
router.get('/filter-by/contractables', check.ifMarketer, trCtrl.getContractables)

router.get('/:id', check.ifUser, trCtrl.get)

router.put('', check.ifCanManageCamion, trCtrl.add)
// router.put('', check.ifCanManageMarketers, trCtrl.add)

router.patch('/:id', check.ifCanManageCamion, trCtrl.update)

router.post('/untrash/:id', check.ifCanManageMarketers, trCtrl.untrash)

router.post('/trash/:id', check.ifCanManageMarketers, trCtrl.trash)
router.post('/untrashmulti', check.ifCanManageMarketers, trCtrl.multiUnTrash)

// router.delete('/:id', check.ifMIC, trCtrl.delete)


module.exports = router