/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const express = require('express')

const Version  = require('../controllers/version')
// const { getVersion } = require('../controllers/version')

/***************************************/
/*** RECUPERATION DU ROUTEUR D'EXPRESS */
const router = express.Router()

/*****************************/
/*** ROUTAGE DE LA RESSOURCE */

router.get('', Version.getVersion)
// router.get('', check.ifUser, Version)

module.exports = router
