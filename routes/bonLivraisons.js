/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const express = require('express')
const blCtrl = require('../controllers/bonLivraison')
const blgplCtrl = require('../controllers/bonGPLBouteille')
const check = require('../jsonwebtoken/check')

/***************************************/
/*** RECUPERATION DU ROUTEUR D'EXPRESS */
const router = express.Router()

/*****************************/
/*** ROUTAGE DE LA RESSOURCE */

router.get('', check.ifUser, blCtrl.getAll)

router.get('/:id', check.ifUser, blCtrl.get)



router.get('/camion/:id', check.ifDPBOrDepot, blCtrl.getCamionRelatedBLs)
router.get('/depot_per_camion/:id',check.ifDPBOrDepot,blCtrl.getDepotCamionRelatedBLs)
router.get('/depot_per_camion_bpl_bouteille/:id',check.ifDPBOrDepot,blCtrl.getDepotCamionGPLBouteilleACharger)

// router.get('/camion/:id/:startDate/:endDate', check.ifDPBOrDepot, blCtrl.getCamionRelatedBLsbyperiods)

router.post('/camionbonacharger', check.ifDepot, blCtrl.getBLsBonacharger)

router.post('/get-bls/filter-by-statuses', check.ifUser, blCtrl.getBLsByStatuses)

// router.get('/statut/decharges', check.ifStation, blCtrl.getUnloadedBLs)

router.get('/filter-by/status-and-camion', check.ifUser, blCtrl.getBLsByStatusByCamionNotYetLoaded)

router.get('/select-just/barcodes', check.ifUser, blCtrl.getBarcodesByBl)

router.put('', check.ifMarketer, blCtrl.add)
router.put('/many', check.ifMarketer, blCtrl.addMany)

router.patch('/:id', check.ifCanManageBL, blCtrl.update)


router.patch('/unload/:blId', check.ifStation, blCtrl.unload)

router.patch('/status/paid', check.ifStation, blCtrl.pay)

router.post('/change/:option/:id', check.ifMIC, blCtrl.change)

router.post('/untrash/:id', check.ifMIC, blCtrl.untrash)

router.post('/trash/:id', check.ifMIC, blCtrl.trash)
router.post('/modify_detail_chargement',check.ifDepot,blCtrl.updateBarCode)
router.get('/rejeter_chargement/:blId',check.ifDepot,blCtrl.rejeterChargement)
router.get('/detail_chargement/:blId',check.ifDepot,blCtrl.getDeatilDechargement)

router.post('/finaliser/chargement', check.ifDepot, blCtrl.loadCompletion)
router.patch('/decharger/:blId',check.ifUser, blCtrl.unload)
router.get('/periodique_camion/:startDate/:endDate/:id',check.ifUser,blCtrl.getAllPeriodeCamion)
router.get('/periodique/:startDate/:endDate/:page/:limit',check.ifUser,blCtrl.getAllPeriode)
router.get('/bl_bt_trached/:type/:startDate/:endDate',check.ifUser,blCtrl.getAllPeriodeTrached)
router.post("/dpb/approuval_bl",check.ifDPB,blCtrl.dpbUpdateBL)
router.post("/dispatch_bl",check.ifMarketer,blCtrl.marketerDispatchBL)
router.post("/change_bl_statut",check.ifUser,blCtrl.changeBLStatut)
// router.put("/multi_bl_gpl",check.ifMarketer,blCtrl.dispatchBonGplBouteill)

router.post("/charger_gpl_bouteille",check.ifDepot,blCtrl.chargerBlGPLBouteille)

/// Grand bon GPL en bouteille 
router.get('/bon_gpl/:startDate/:endDate',check.ifUser,blgplCtrl.getAllPeriode)
router.get('/get_one_gpl_b/:id',check.ifUser,blgplCtrl.get)
router.put('/one_bon_gpl',check.ifMarketer,blgplCtrl.add)
// router.patch('/update_one_gpl',blgplCtrl.update)

module.exports = router