/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const express = require('express');
const camionCtrl = require('../controllers/camion');
const check = require('../jsonwebtoken/check');

/***************************************/
/*** RECUPERATION DU ROUTEUR D'EXPRESS */
const router = express.Router();

/*****************************/
/*** ROUTAGE DE LA RESSOURCE */

router.get('', check.ifUser, camionCtrl.getAll);
router.get('/get/:imat',check.ifUser,camionCtrl.getPerImmatriculation)
router.get('/inactive', check.ifUser, camionCtrl.getAllinactive);
router.get('/active', check.ifUser, camionCtrl.getAllActive);
router.get('/verify_camion_charge/:id', check.ifUser, camionCtrl.verifyCamionCharge);

router.get('/as-marketer/filter-by-tr/:id', check.ifUser, camionCtrl.getAll);
router.get('/inactive/as-marketer/filter-by-tr/:id', check.ifUser, camionCtrl.getAllinactive);

router.get('/filter-by/tr-not-full/:id', check.ifUser, camionCtrl.gNotFullByMarketer);
router.get('/inactive/filter-by/tr-not-full/:id', check.ifUser, camionCtrl.gNotFullInactiveByMarketer);

router.get('/:id', check.ifUser, camionCtrl.get);
router.get('/inactive/:id', check.ifUser, camionCtrl.getInactive);

router.get('/filter-by/:statuses', check.ifDepot, camionCtrl.getCamionbyBlstatus);

router.get('/ssat/list', check.ifUser, camionCtrl.getCamionsFromPOI);

router.get('/ssat/list/:option', check.ifUser, camionCtrl.getCamionsFromPOI);

router.get('/ssat/last-position/:id', check.ifUser, camionCtrl.getCamionLastPositionFromPOI);
router.post('/ssat/depot_get_last_position', check.ifUser, camionCtrl.depotGetCamionLastPositionFromPOI);

router.put('', check.ifCanManageCamion, camionCtrl.add);

router.patch('/activate/:id', check.ifMIC, camionCtrl.activate);

router.patch('/:id', check.ifCanManageCamion, camionCtrl.update);

router.post('/untrash/:id', check.ifCanManageCamion, camionCtrl.untrash);

router.post('/trash/:id', check.ifCanManageCamion, camionCtrl.trash);
router.post('/untrashmulti', check.ifCanManageCamion, camionCtrl.multiUnTrash);


// router.delete('/:id', check.ifMIC, camionCtrl.delete)


module.exports = router;