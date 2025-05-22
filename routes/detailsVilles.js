/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const express = require('express')
const dvCtrl = require('../controllers/detailsVille')
const check = require('../jsonwebtoken/check')

/***************************************/
/*** RECUPERATION DU ROUTEUR D'EXPRESS */
const router = express.Router()

/*****************************/
/*** ROUTAGE DE LA RESSOURCE */

router.get('/filter-by-depot/:depotId', check.ifUser, dvCtrl.getByDepot)
router.get('/filter-by-depot/:depotId/:type', check.ifUser, dvCtrl.getByDepot)
router.get('/filter-by-ville/:villeId', check.ifUser, dvCtrl.getByVille)
router.get('/filter-by-ville/:villeId/:type', check.ifUser, dvCtrl.getByVille)
router.get('/detail_ville/vrac', check.ifUser, dvCtrl.addTarifGplVrac)

router.get('/:id', check.ifUser, dvCtrl.get)

router.put('/:depotId', check.ifMIC, dvCtrl.add)

// router.patch('/:id', check.ifMIC, dvCtrl.update)

router.post('/untrash/:id', check.ifMIC, dvCtrl.untrash)

router.post('/trash/:id', check.ifMIC, dvCtrl.trash)

// router.delete('/:id', check.ifMIC, dvCtrl.delete)


module.exports = router