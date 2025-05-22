/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const express = require('express')
const bilanCtrl = require('../controllers/bilan')
const check = require('../jsonwebtoken/check')

/***************************************/
/*** RECUPERATION DU ROUTEUR D'EXPRESS */
const router = express.Router()

/*****************************/
/*** ROUTAGE DE LA RESSOURCE */

// router.get('/quantities-per-products-per-area', check.ifMIC, bilanCtrl.getQuantitiesPerProductsPerArea)
router.post('/quantities_in_product_list', check.ifMIC, bilanCtrl.getQuantitiesOneProduct)
router.get('/quantities-per-products-per-area/:startDate/:endDate', check.ifMIC, bilanCtrl.getQuantitiesPerProductsPerArea)
router.get('/total_recapitulatif/:startDate/:endDate',check.ifMIC,bilanCtrl.getTotauxBL)
router.get('/get_count_stat_bl_bt/:startDate/:endDate',check.ifMarketerOrMICOrDPB,bilanCtrl.getStartNbrBLandBT_Mic)



router.post('/mic/quantities-per-marketers', check.ifMarketerOrMICOrDPB, bilanCtrl.getQuantitiesPerMarketersAsMIC)
router.get('/mic/quantities-for-one-marketer', check.ifMarketerOrMICOrDPB, bilanCtrl.getQuantitiesForOneMarketersAsMIC)
router.get('/mic/quantities-per-depots', check.ifMIC, bilanCtrl.getQuantitiesPerDepotsAsMIC)
router.get('/depot/quantities-per-products', check.ifDepot, bilanCtrl.getQuantitiesPerProductsAsDepot)

router.get('/mic/quantities-per-products/:startDate/:endDate',check.ifMIC, bilanCtrl.getQuantitiesPerProductsAsMIC)
router.get('/mic/quantities-per-marketers/:startDate/:endDate', check.ifMIC, bilanCtrl.getQuantitiesPerMarketersAsMIC)
router.get('/mic/quantities-per-depots/:startDate/:endDate', check.ifMIC, bilanCtrl.getQuantitiesPerDepotsAsMIC)
router.get('/depot/quantities-per-products/:startDate/:endDate', check.ifDepot, bilanCtrl.getQuantitiesPerProductsAsDepot)

router.get('/quantities-per-products-per-station/:marketerId', check.ifMarketerOrMICOrDPB, bilanCtrl.getQuantitiesPerProductsPerStation)
router.get('/quantities-per-products-per-station/:startDate/:endDate/:marketerId', check.ifMarketerOrMICOrDPB, bilanCtrl.getQuantitiesPerProductsPerStation)

router.get('/marketer/quantities-per-products-per-year/:year', check.ifMarketer, bilanCtrl.getQuantitiesPerProductsPerMonthAsMarketer)
router.get('/bls-stats-per-status', check.ifMarketerOrMIC, bilanCtrl.getBlsStatsPerStatus)


router.get('/sst-reports/v1', check.ifUser, bilanCtrl.getV01)
router.get('/sst-reports/v2', check.ifUser, bilanCtrl.getV02)
router.get('/sst-reports/v4', check.ifUser, bilanCtrl.getV04)
router.get('/sst-reports/v11', check.ifUser, bilanCtrl.getV11)
router.get('/sst-reports/i3', check.ifUser, bilanCtrl.getI3)
router.get('/sst-reports/i7', check.ifUser, bilanCtrl.getI7)


// router.get('/perequation', check.ifUser, bilanCtrl.getFtms)
router.post('/get-perequations', check.ifMarketerOrMICOrDPB, bilanCtrl.getFtms)
router.post('/get-resume', check.ifMarketerOrMICOrDPB, bilanCtrl.getResum)
router.get('/count_element',check.ifMIC, bilanCtrl.countElements)






module.exports = router