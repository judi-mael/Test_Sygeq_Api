/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const express = require('express')
const blCtrl = require('../controllers/bonTransfere')
const check = require('../jsonwebtoken/check')

/***************************************/
/*** RECUPERATION DU ROUTEUR D'EXPRESS */
const router = express.Router()

/*****************************/
/*** ROUTAGE DE LA RESSOURCE */

router.get('', check.ifUser, blCtrl.getAll)
router.get('/btdepot', check.ifUser, blCtrl.getMesBT)

router.get('/:id', check.ifUser, blCtrl.get)

router.get('/camion/:id', check.ifDPBOrDepot, blCtrl.getCamionRelatedBLs)

router.post('/camionbonacharger', check.ifDepot, blCtrl.getBLsBonacharger)

router.post('/get-bls/filter-by-statuses', check.ifUser, blCtrl.getBLsByStatuses)

// router.get('/statut/decharges', check.ifStation, blCtrl.getUnloadedBLs)

router.get('/filter-by/status-and-camion', check.ifUser, blCtrl.getBLsByStatusByCamionNotYetLoaded)

router.get('/select-just/barcodes', check.ifUser, blCtrl.getBarcodesByBl)

router.put('', check.ifMarketer, blCtrl.add)
router.put('/many', check.ifMarketer, blCtrl.addMany)

router.patch('/:id', check.ifCanManageBL, blCtrl.update)

router.patch('/unload/:id', check.ifDepot, blCtrl.unload)

router.patch('/status/paid', check.ifDepot, blCtrl.pay)

router.post('/change/:option/:id', check.ifMIC, blCtrl.change)

router.post('/untrash/:id', check.ifMIC, blCtrl.untrash)

router.post('/trash/:id', check.ifMIC, blCtrl.trash)

// router.delete('/:id', check.ifMIC, blCtrl.delete)


router.get('/periodique/:startDate/:endDate',check.ifUser,blCtrl.getAllPeriode)
router.post('/finaliser/chargement', check.ifDepot, blCtrl.loadCompletion)
// router.post('/test/test/test', blCtrl.test)




module.exports = router