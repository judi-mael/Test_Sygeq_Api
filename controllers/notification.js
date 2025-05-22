/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const { Op } = require("sequelize");
const xss = require("xss");

const {Notification,User} = require('../models')




/*****************************/
/*** GESTION DE LA RESSOURCE */
exports.getAll = async (req, res, next) => {

    try {
        const notifications = await Notification.findAll({where: {userId: req.reqUserId}, order:[ ['createdAt','desc'] ]})
        return res.json(notifications)
    } catch (err) {
        // console.log(err);
        next(err)
    }

}

exports.readAll = async (req, res, next) => {

    try {
        const notifications = await Notification.update({readState: 1}, {where: {userId: req.reqUserId}})
        return res.status(204).json({})

    } catch (err) {
        // console.log(err);
        next(err)
    }

}

exports.read = async (req, res, next) => {

    const id = parseInt(req.params.id)
    if (!id) { return res.status(400).json({message: 'Parametre(s) manquant(s)'}) }

    try {
        const notif = await Notification.findByPk(id)
        if(notif === null){return res.status(404).json({message: 'Donnée introuvable'})}
        else if(notif.userId !== req.reqUserId){return res.status(404).json({message: 'Requête non authorisée'})}

        await Notification.update({where: {id: id}})
        return res.status(204).json({})

    } catch (err) {
        // console.log(err);
        next(err)
    }

}

exports.notifySingle = async (id, label, description) => {
    try {
        await Notification.create({
            label: label,
            description: description,
            userId: id
        })
    } catch (err) {
        // console.log(err);
        next(err)
    }
}

exports.notifyAllUsersOfAType = async (type, label, description) => {
    try {

        let users = await User.findAll({where: {type: type}})        
        for (const user of users) {
            await Notification.create({
                label: label,
                description: description,
                // readState: 0,
                userId: user.id
            })
        }

    } catch (err) {
        console.log(err);
        next(err)
    }
}

exports.notifyEverybody = async (label, description) => {
    try {

        let users = await User.findAll()

        for (const user of users) {
            await Notification.create({
                label: label,
                description: description,
                userId: user.id
            })
        }
        
    } catch (err) {
        // console.log(err);
        next(err)
    }
}