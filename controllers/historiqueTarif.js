 /************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const jwt = require('jsonwebtoken')
const { Op } = require("sequelize");
const xss = require("xss");

// const DB = require('../db.config')
// const HistoriqueTarif = DB.HistoriqueTarif

/*****************************/
/*** GESTION DE LA RESSOURCE */
exports.getAll = async (req, res, next) => {
    try {

        // const data = await HistoriqueTarif.findAll({paranoid: false, order:[ ['createdAt','desc'] ]})
        // return res.json({data: data})
        
    } catch (err) {
        // console.log(err);
        next(err)
    }
}