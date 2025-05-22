/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const express = require('express')
const stationCtrl = require('../controllers/station')
const check = require('../jsonwebtoken/check')

/***************************************/
/*** RECUPERATION DU ROUTEUR D'EXPRESS */
const router = express.Router()

/*****************************/
/*** ROUTAGE DE LA RESSOURCE */

router.get('', check.ifMarketerOrMICOrDPB, stationCtrl.getAll)

router.get('/inactive', check.ifMarketerOrMICOrDPB, stationCtrl.getAllinactive)

router.get('/filter-by/type/stations-only', check.ifMarketerOrMICOrDPB, stationCtrl.getAllStations)

router.get('/filter-by/marketer/:id', check.ifMarketerOrMICOrDPB, stationCtrl.gStationsByMarketer)

router.get('/inactive/filter-by/marketer/:id', check.ifMarketerOrMICOrDPB, stationCtrl.gInactiveStationsByMarketer)

router.get('/:id', check.ifUser, stationCtrl.getOne)

router.get('/inactive/:id', check.ifStationOrMarketerOrMIC, stationCtrl.getOneInactive)

router.get('/poi/list',check.ifUser, stationCtrl.getStationsFromPOI)

router.get('/poi/list/:option', check.ifUser,stationCtrl.getStationsFromPOI)

router.get('/filter-only-one-by-name/:nom', stationCtrl.getByName)

router.put('', check.ifMarketerOrMIC, stationCtrl.add)

router.patch('activate/:id', check.ifMIC, stationCtrl.update)
router.patch('/:id', check.ifMarketerOrMIC, stationCtrl.update)

router.post('/untrash/:id', check.ifMarketerOrMIC, stationCtrl.untrash)

router.post('/trash/:id', check.ifMarketerOrMIC, stationCtrl.trash)

// router.delete('/:id', check.ifMIC, stationCtrl.delete)
router.post('/untrashmulti', check.ifMarketerOrMIC, stationCtrl.multiUnTrash)


module.exports = router