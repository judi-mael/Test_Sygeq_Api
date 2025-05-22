/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const jwt = require('jsonwebtoken')
const { Op } = require("sequelize");
const xss = require("xss");

const {Login,User} = require('../models')
const userCtrl = require('./user')

/*****************************/
/*** GESTION DE LA RESSOURCE */
exports.getAll = async (req, res, next) => {
    try {
        // console.log(req.reqUserId);
        const user = await User.findByPk(req.reqUserId)
        // console.log(user.email, user.username);
        const logs = await Login.findAll({where: {[Op.or]:[{email:user.email}, {identifiant:user.username}, {user_id:user.id}]}, limit: 5, paranoid: false, order:[ ['createdAt','desc'] ]})
        // console.log(logs);
        return res.json({data: logs})
        
    } catch (err) {
        
        next(err)
    }
}