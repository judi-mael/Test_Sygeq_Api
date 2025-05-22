/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const express = require('express')
const b2bCtrl = require('../controllers/b2b')
const check = require('../jsonwebtoken/check')

/***************************************/
/*** RECUPERATION DU ROUTEUR D'EXPRESS */
const router = express.Router()

/*****************************/
/*** ROUTAGE DE LA RESSOURCE */

router.get('', check.ifMarketerOrMICOrDPB, b2bCtrl.getAll)
router.get('/inactive', check.ifMarketerOrMICOrDPB, b2bCtrl.getAllInactive)

// Ex: /:filter-by/:id ou /:single/:id
router.get('/:option/:id', check.ifStationOrMarketerOrMIC, b2bCtrl.getAll)
router.get('/inactive/:option/:id', check.ifStationOrMarketerOrMIC, b2bCtrl.getAllInactive)

//recupérer un seul b2b
router.get('/:b2bId', check.ifStationOrMarketerOrMIC, b2bCtrl.getOne)
router.get('/inactive/:b2bId', check.ifStationOrMarketerOrMIC, b2bCtrl.getOneInactive)

router.put('', check.ifMarketerOrMIC, b2bCtrl.add)
// router.put('', check.ifMIC, b2bCtrl.add)


router.patch('/:b2bId', check.ifMarketerOrMIC, b2bCtrl.update)

router.post('/add-marketers/:b2bId', check.ifMIC, b2bCtrl.addMarketers)
router.post('/remove-marketers/:b2bId', check.ifMIC, b2bCtrl.removeMarketers)

router.post('/untrash/:id', check.ifMarketerOrMIC, b2bCtrl.untrash)
router.post('/trash/:id', check.ifMarketerOrMIC, b2bCtrl.trash)
router.post('/untrashmulti', check.ifMarketerOrMIC, b2bCtrl.multiUnTrash)





module.exports = router