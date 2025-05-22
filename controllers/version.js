/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const jwt = require('jsonwebtoken')
const { Op } = require("sequelize");
const xss = require("xss");

const {Version} = require('../models')




// mod.cjs
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

exports.getVersion = async (req, res, next) => {

    try {

            const version = await Version.findAll();
        // return version.version
        console.log(version);
        return res.json( version[0].version )

    } catch (err) {
        console.log(err)
        next(err)
    }

}