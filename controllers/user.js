/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const jwt = require('jsonwebtoken')
const { Op, json, where } = require("sequelize");
const bcrypt = require('bcrypt')
const xss = require("xss");


// const user = require('../models/user');
const {PasswordResetRecord,Station,Transporteur,Depot,Marketer,User} = require('../models')

const mailerCtrl = require('./_internal/mailer')
const notifCtrl = require('./notification')
var generator = require('generate-password');
const { add } = require('./bonChargement');

const types = ['MIC', 'DPB', 'Depot', 'Marketer', 'Station', 'Transporteur']
const roles = ['Super Admin', 'Admin', 'User']

const path = require('path')
let fs = require('fs');
const { log } = require('console');

/*****************************/
/*** GESTION DE LA RESSOURCE */
const customSymbols = '!#$&*+,.?@[\\]^_{|}~';
exports.getAllUsers = async (req, res, next) => {

    try {
        let list = []
        let users = []
        const user = await this.getUsefulUserData(req.reqUserId);

        if (req.reqUserType === 'MIC') {
            if (req.reqUserRole === "User") {
                users = await User.findAll({
                    where: { type: "MIC", role: "User" },
                    attributes: { exclude: ['password'] }, paranoid: false, order: [['createdAt', 'desc']]
                })
            } else {
                users = await User.findAll({ attributes: { exclude: ['password'] }, paranoid: false, order: [['createdAt', 'desc']] })
            }
        }
        else if (req.reqUserType === 'DPB') {
            users = await User.findAll({ where: { type: 'DPB' }, attributes: { exclude: ['password'] }, paranoid: false, order: [['createdAt', 'desc']] })
        }
        else if (req.reqUserType === 'Depot' && req.reqUserRole !== 'User') {
            users = await User.findAll({ where: { depot_id: user.depot_id }, attributes: { exclude: ['password'] }, paranoid: false, order: [['createdAt', 'desc']] })
        }
        else if (req.reqUserType === 'Marketer') {

            if (req.reqUserRole === 'Super Admin' || req.reqUserRole === 'Admin') {
                let mktUsers = await User.findAll({ where: { marketer_id: user.marketer_id }, attributes: { exclude: ['password'] }, paranoid: false, order: [['createdAt', 'desc']] });
                // On récupère tous les utilis
                for (const mktUser of mktUsers) { users.push(mktUser) };

                let stationUsers = await User.findAll({ attributes: { exclude: ['password'] }, paranoid: false, order: [['createdAt', 'desc']] })
                // let stationUsers = await User.findAll({where: {type: 'Station'}, attributes: {exclude: ['password']}, paranoid: false, order:[ ['createdAt','desc'] ]})
                for (const stationUser of stationUsers) {
                    const station = await Station.findByPk(stationUser.station_id, { paranoid: false })
                }
            }
            else {
                let stationUsers = await User.findAll({ attributes: { exclude: ['password'] }, paranoid: false, order: [['createdAt', 'desc']] })
                // let stationUsers = await User.findAll({where: {type: 'Station'}, attributes: {exclude: ['password']}, paranoid: false, order:[ ['createdAt','desc'] ]})
                for (const stationUser of stationUsers) {
                    const station = await Station.findByPk(stationUser.station_id, { paranoid: false })
                    if (station.marketer_id === user.marketer_id) { users.push(stationUser) }
                }
            }
        }
        else if (req.reqUserType === 'Station') {
            users = await User.findAll({ where: { station_id: user.station_id }, attributes: { exclude: ['password'] }, paranoid: false, order: [['createdAt', 'desc']] })
        }
        else if (req.reqUserType === 'Transporteur') {
            users = await User.findAll({ where: { transporteur_id: user.transporteur_id }, attributes: { exclude: ['password'] }, paranoid: false, order: [['createdAt', 'desc']] })
        }


        const UsersList = removeDuplicated(users);
        for (let i = 0; i < UsersList.length; i++) {

            let usr = UsersList[i]
            // usr.nana = "namama"
            let item = {
                id: usr.id,
                name: usr.name,
                username: usr.username,
                email: usr.email,
                type: usr.type,
                role: usr.role,
                marketer_id: usr.marketer_id,
                marketer: await Marketer.findByPk(usr.marketer_id, { paranoid: false }) || null,
                depot_id: usr.depot_id,
                depot: await Depot.findByPk(usr.depot_id, { paranoid: false }) || null,
                transporteur_id: usr.transporteur_id,
                transporteur: await Transporteur.findByPk(usr.transporteur_id, { paranoid: false }) || null,
                station_id: usr.station_id,
                station: await Station.findByPk(usr.station_id, { paranoid: false }) || null,
                // b2b_id: usr.b2b_id,
                b2b: null,
                // b2b : await B2b.findByPk(usr.b2b_id, {paranoid: false}) || null,
                createdAt: usr.createdAt,
                updatedAt: usr.updatedAt,
                createdBy: usr.createdBy,
                updatedBy: usr.updatedBy,
                image: usr.image,
            }

            list.push(item);
        }

        res.json({ ds: "mam", data: list, nbr: list.length })

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Une erreur s'est produite veuillez réessayer" })
    }

}

function removeDuplicated(els) {
    let data = [];
    for (const el of els) {
        let matches = 0;
        for (const dat of data) {
            dat.id === el.id && matches++
        }
        matches === 0 && data.push(el)
    }
    // console.log('data --->',data);
    return data;
}

exports.getUsefulUserData = async (id) => {
    return await User.findByPk(id, { paranoid: false, attributes: { exclude: ['password', 'pin'] } })
}

exports.getUser = async (req, res, next) => {
    let id = parseInt(req.params.id)

    //VALIDATION DES DONNEES RECUES
    if (!id) {
        return res.status(400).json({ message: 'Parametre(s) manquant(s)' })
    }

    try {
        //RECUPERATION
        let user = await User.findByPk(id, { paranoid: false, attributes: { exclude: ['password', 'pin'] } })
        if (user === null) {
            return res.status(404).json({ message: 'Utilisateur introuvable ou désactivé' })
        }
        let item = {}
        if (user) {

            item = {
                id: user.id,
                name: user.name,
                username: user.username,
                email: user.email,
                type: user.type,
                role: user.role,
                marketer_id: user.marketer_id,
                marketer: await Marketer.findByPk(user.marketer_id, { paranoid: false }) || null,
                depot_id: user.depot_id,
                depot: await Depot.findByPk(user.depot_id, { paranoid: false }) || null,
                transporteur_id: user.transporteur_id,
                transporteur: await Transporteur.findByPk(user.transporteur_id, { paranoid: false }) || null,
                station_id: user.station_id,
                station: await Station.findByPk(user.station_id, { paranoid: false }) || null,
                // b2b_id: user.b2b_id,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                createdBy: user.createdBy,
                updatedBy: user.updatedBy,
                image: user.image,
            }

        }

        //ENVOI
        return res.json(item)

    } catch (err) {
        next(err)
    }
}

exports.getImage = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.reqUserId)
        return res.json(user.image)
    } catch (err) {
        console.log("============",err)
       next(err)
    }
}

function emailIsValid(email) {
    let re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

async function typeIsAllowed(requesterId, targetType) {
    try {
        const requester = await User.findByPk(requesterId)

        if (
            requester.type === 'MIC' ||
            (
                requester.type === 'Marketer' && (targetType === 'Marketer' || targetType === 'Station')
            ) ||
            (requester.type === 'Depot' && targetType === 'Depot') ||
            (requester.type === 'Transporteur' && targetType === 'Transporteur') ||
            (requester.type === 'DPB' && targetType === 'DPB') ||
            (requester.type === 'Station' && targetType === 'Station')
        ) { 
            return true } else { 
                return false }

    } catch (err) { return false }
}

exports.add = async (req, res, next) => {

    // console.log(req.body);
    // console.log(req.reqUserRole, req.reqUserType);

    const name = xss(req.body.name)
    const username = xss(req.body.username.replace(/\s+/g, ''))
    const email = xss(req.body.email)
    const type = xss(req.body.type)
    const role = xss(req.body.role)
    const marketerId = parseInt(req.body.marketerId)
    const depotId = parseInt(req.body.depotId)
    const transporteurId = parseInt(req.body.transporteurId)
    const stationId = parseInt(req.body.stationId)
    if (!name || !username || !email || !type) { return res.status(400).json({ message: 'Veuillez renseigner tous les champs' }) }
    else if (!emailIsValid(email)) { return res.status(400).json({ message: email + ' n\'est pas un email valide' }) }
    else if (types.indexOf(type) < 0 || !typeIsAllowed(req.reqUserId, type)) { return res.status(401).json({ message: type + ' est un type incorrect ou non authorisé' }) }
    else if (
        req.reqUserRole === role ||
        (req.reqUserRole === 'Admin' && role === 'Super Admin') ||
        req.reqUserRole === 'User'
    ) { return res.status(401).json({ message: role + ' est un role incorrect ou non authorisé' }) }
    else if (
        (type === 'MIC' && (marketerId || depotId || transporteurId || stationId)) ||
        (type === 'DPB' && (marketerId || depotId || transporteurId || stationId)) ||
        (type === 'Transporteur' && (marketerId || depotId || stationId)) ||
        (type === 'Station' && (depotId || transporteurId)) ||
        (type === 'Depot' && (marketerId || transporteurId || stationId)) ||
        (type === 'Marketer' && (depotId || transporteurId || stationId))
    ) { return res.status(401).json({ message: 'Donnée(s) non authorisée(s) dans la requette' }) }
    else if (
        (type === 'Transporteur' && !transporteurId) ||
        (type === 'Station' && (!stationId || !marketerId)) ||
        (type === 'Depot' && !depotId) ||
        (type === 'Marketer' && !marketerId)
    ) { return res.status(401).json({ message: `Société ou établissement d'appartenance de l'utilisateur de type ${type} non précisé` }) }

    try {
        let laStation = {};
        const user = await User.findOne({ where: { [Op.or]: [{ username: username }, { email: email }] }, raw: true })
        if (user !== null) {
            return res.status(409).json({ message: 'Identifiant / email déjà utilisé' })
        }
        if (stationId) {

            laStation = await Station.findByPk(stationId)
        }
        let generatedPass = generator.generate({ lenght: 12, numbers: true, symbols: customSymbols, })
        const userc = await User.create({
            name: name,
            username: username,
            email: email,
            password: generatedPass,
            type: laStation.type ? laStation.type : type,
            role: role,
            marketer_id: marketerId,
            depot_id: depotId,
            transporteur_id: transporteurId,
            station_id: laStation.type == "STATION" ? stationId : null,
            // b2b_id: laStation.type == "B2B" ? stationId : null,
            createdBy: req.reqUserId,
            updatedBy: req.reqUserId
        })

        //SEND EMAIL
        mailerCtrl.sendAccountConfirmationEmail(userc.name, userc.username, userc.email, generatedPass)

        //NOTIF
        // notifCtrl.notifyAllUsersOfAType('MIC', `Inscription de ${name}`, `${name} a été inscrit en tant que ${userc.type} ${userc.role}`)
        // mailerCtrl.mailAllUsersOfAType('MIC', `Inscription de ${name}`, `${name} a été inscrit en tant que ${userc.type} ${userc.role}`)
        return res.status(204).json({})

    } catch (err) {
        next(err)
    }
}
exports.modify = async (req, res, next) => {
    let userId = parseInt(req.params.id)

    const email = xss(req.body.email)
    const user = await User.findOne({ where: { id: userId }, raw: true });

    const checkMail = await User.findOne({ where: { email: email }, raw: true });
    if (!user) {
        return res.status(404).json({ message: 'Utilisateur introuvable ou désactivé' });
    }

    if (checkMail) {
        return res.status(404).json({ message: 'Ce mail est déja utilisé' });
    }


    if (!emailIsValid(email)) { return res.status(400).json({ message: email + ' n\'est pas un email valide' }) }

    try {

        // let generatedPass = generator.generate({lenght: 12, numbers: true,symbols: customSymbols,})

        //Hashage du mot de passe utilisateur
        // let hash = await bcrypt.hash(generatedPass, parseInt(process.env.BCRYPT_SALT_ROUND))

        const userc = await User.update({ email: email }, { where: { id: userId } });
        const usern = await User.findOne({ where: { id: userId }, raw: true });

        const tokenResetPassword = jwt.sign({
            id: usern.id,
            email: usern.email
        }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_DURING });
        const addLien = `confirm/${tokenResetPassword}`
        mailerCtrl.sendPasswordResetEmail(usern.name, usern.email, addLien)



        return res.status(204).json({})

    } catch (err) {
        next(err)
    }
}

exports.addUser = async (req, res, next) => {
    const name = xss(req.body.name)
    const username = xss(req.body.username.replace(/\s+/g, ''))
    const email = xss(req.body.email)
    const type = xss(req.body.type)
    const role = xss(req.body.role)
    const marketerId = req.body.marketerId
    const depotId = req.body.depotId
    const transporteurId = req.body.transporteurId
    const stationId = req.body.stationId

    //VALIDATION DES DONNEES RECUES
    if (!name || !username || !email || !type || !role) { return res.status(400).json({ message: 'Parametre(s) manquant(s)' }) }
    else if (marketerId && depotId && transporteurId && stationId) { return res.status(400).json({ message: 'Donnée(s) non authorisée(s) dans la requête' }) }
    else if (types.indexOf(type) < 0) { return res.status(400).json({ message: `${type} est un type incorrect` }) }
    else if (type === 'MIC') { return res.status(400).json({ message: `Création de compte de type ${type} non authorisée` }) }

    try {
        // VERIFICATION D'EXISTENCE
        const user = await User.findOne({ where: { [Op.or]: [{ username: username }, { email: email }] }, raw: true })

        if (user !== null) {
            return res.status(409).json({ message: 'Identifiant / email déjà utilisé' })
        }

        let generatedPass = generator.generate({ lenght: 12, numbers: true, symbols: customSymbols, })

        if (marketerId && !stationId) {
            //Creation
            let userc = await User.create({
                name: name,
                username: username,
                email: email,
                password: generatedPass,
                type: 'Marketer',
                marketer_id: marketerId,
                depot_id: null,
                transporteur_id: null,
                station_id: null,
                role: role,
                createdBy: req.reqUserId,
                updatedBy: req.reqUserId
            })
        }
        else if (marketerId && stationId) {
            //Creation
            let userc = await User.create({
                name: name,
                username: username,
                email: email,
                password: generatedPass,
                type: 'Station',
                marketer_id: marketerId,
                depot_id: null,
                transporteur_id: null,
                station_id: stationId,
                role: 'User',
                createdBy: req.reqUserId,
                updatedBy: req.reqUserId
            })
        }
        else if (depotId) {
            //Creation
            let userc = await User.create({
                name: name,
                username: username,
                email: email,
                password: generatedPass,
                type: 'Depot',
                marketer_id: null,
                depot_id: depotId,
                transporteur_id: null,
                station_id: null,
                role: role,
                createdBy: req.reqUserId,
                updatedBy: req.reqUserId
            })
        }
        else if (type === 'DPB') {
            //Creation
            let userc = await User.create({
                name: name,
                username: username,
                email: email,
                password: generatedPass,
                type: 'DPB',
                marketer_id: null,
                depot_id: null,
                transporteur_id: null,
                station_id: null,
                role: 'User',
                createdBy: req.reqUserId,
                updatedBy: req.reqUserId
            })
        }
        else if (transporteurId) {
            //Creation
            let userc = await User.create({
                name: name,
                username: username,
                email: email,
                password: generatedPass,
                type: 'Transporteur',
                marketer_id: null,
                depot_id: null,
                transporteur_id: transporteurId,
                station_id: null,
                role: role,
                createdBy: req.reqUserId,
                updatedBy: req.reqUserId
            })
        }
        else { return res.status(401).json({ message: 'Requête invalide ou non authorisée' }) }

        //SEND EMAIL
        mailerCtrl.sendAccountConfirmationEmail(userc.name, userc.username, userc.email, generatedPass)

        //NOTIF
        // notifCtrl.notifyAllUsersOfAType('MIC', `Inscription de ${name}`, `${name} a été inscrit en tant que ${userc.type} ${userc.role}`)
        // mailerCtrl.mailAllUsersOfAType('MIC', `Inscription de ${name}`, `${name} a été inscrit en tant que ${userc.type} ${userc.role}`)
        return res.status(204).json({})

    } catch (err) {
        next(err)
    }
}

exports.addMarketerAdminOrStation = async (req, res, next) => {
    const name = xss(req.body.name)
    const username = xss(req.body.username.replace(/\s+/g, ''))
    const email = xss(req.body.email)
    const station_id = parseInt(req.body.station_id)
    const marketer_id = (await this.getUsefulUserData(req.reqUserId)).marketer_id

    // console.log(req.body);

    //VALIDATION DES DONNEES RECUES ET PSEUDO ROUTAGE
    if (!name || !username || !email) {
        return res.status(400).json({ message: 'Veuillez renseigner tous les champs' })
    }

    try {

        // VERIFICATION D'EXISTENCE
        const userCheck = await User.findOne({ where: { [Op.or]: [{ username: username }, { email: email }] }, raw: true })

        if (userCheck !== null) {
            return res.status(409).json({ message: 'Identifiant / email déjà utilisé' })
        }

        let generatedPass = generator.generate({ lenght: 12, numbers: true, symbols: customSymbols, })

        let userc

        if (station_id > 0) {
            //Creation
            userc = await User.create({
                name: name,
                username: username,
                email: email,
                password: generatedPass,
                type: 'Station',
                marketer_id: marketer_id,
                station_id: station_id,
                role: 'User',
                createdBy: req.reqUserId,
                updatedBy: req.reqUserId
            })
        }
        else if (!req.body.station_id) {
            //Creation
            userc = await User.create({
                name: name,
                username: username,
                email: email,
                password: generatedPass,
                type: 'Marketer',
                marketer_id: marketer_id,
                role: 'Admin',
                createdBy: req.reqUserId,
                updatedBy: req.reqUserId
            })
        }
        else { return res.status(401).json({ message: 'Requête non authorisée' }) }

        //SEND EMAIL
        mailerCtrl.sendAccountConfirmationEmail(userc.name, userc.username, userc.email, generatedPass)

        //NOTIF
        // notifCtrl.notifyAllUsersOfAType('MIC', `Inscription de ${name}`, `${name} a été inscrit en tant que ${userc.type} ${userc.role}`)
        // mailerCtrl.mailAllUsersOfAType('MIC', `Inscription de ${name}`, `${name} a été inscrit en tant que ${userc.type} ${userc.role}`)
        return res.status(204).json({})

        return res.json({ message: 'Utilisateur créé avec succès' })
    } catch (err) {
        // console.log(err)
        next(err)
    }



}

exports.addStationUser = async (req, res, next) => {
    const name = xss(req.body.name)
    const username = xss(req.body.username.replace(/\s+/g, ''))
    const email = xss(req.body.email)
    const station_id = parseInt(req.body.station_id)
    const marketer_id = (await this.getUsefulUserData(req.reqUserId)).marketer_id

    //VALIDATION DES DONNEES RECUES
    if (!name || !username || !email || !station_id) {
        return res.status(400).json({ message: 'Parametre(s) manquant(s)' })
    }

    try {
        // VERIFICATION D'EXISTENCE
        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { username: username },
                    { email: email }
                ]
            },
            raw: true
        })

        if (user !== null) {
            return res.status(409).json({ message: 'Identifiant / email déjà utilisé' })
        }

        let generatedPass = generator.generate({ lenght: 12, numbers: true, symbols: customSymbols, })


        //Creation
        let userc = await User.create({
            name: name,
            username: username,
            email: email,
            password: generatedPass,
            type: 'Station',
            marketer_id: marketer_id,
            station_id: station_id,
            role: 'User',
            createdBy: req.reqUserId,
            updatedBy: req.reqUserId
        })

        //SEND EMAIL
        mailerCtrl.sendAccountConfirmationEmail(userc.name, userc.username, userc.email, generatedPass)

        //NOTIF
        // notifCtrl.notifyAllUsersOfAType('MIC', `Inscription de ${name}`, `${name} a été inscrit en tant que ${userc.type} ${userc.role}`)
        // mailerCtrl.mailAllUsersOfAType('MIC', `Inscription de ${name}`, `${name} a été inscrit en tant que ${userc.type} ${userc.role}`)
        return res.status(204).json({})

        return res.json({ message: 'Utilisateur créé avec succès' })
    } catch (err) {
        // console.log(err);
        next(err)
    }
}

exports.addDepotAdminOrUser = async (req, res, next) => {
    const name = xss(req.body.name)
    const username = xss(req.body.username.replace(/\s+/g, ''))
    const email = xss(req.body.email)
    const role = xss(req.body.role)
    const depot_id = (await this.getUsefulUserData(req.reqUserId)).depot_id

    //VALIDATION DES DONNEES RECUES ET PSEUDO ROUTAGE
    if (name || !username || !email || !role || !depot_id) {
        return res.status(400).json({ message: 'Parametre(s) manquant(s)' })
    } else if (role !== 'Admin' && role !== 'User') {
        return res.status(401).json({ message: `Le role ${role} est incorrect ou non authorisé` })
    }


    try {

        // VERIFICATION D'EXISTENCE
        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { username: username },
                    { email: email }
                ]
            },
            raw: true
        })

        if (user !== null) {
            return res.status(409).json({ message: 'Identifiant / email déjà utilisé' })
        }

        let generatedPass = generator.generate({ lenght: 12, numbers: true, symbols: customSymbols, })

        let userc = await User.create({
            name: name,
            username: username,
            email: email,
            password: generatedPass,
            type: 'Depot',
            depot_id: depot_id,
            role: role,
            createdBy: req.reqUserId,
            updatedBy: req.reqUserId
        })

        //SEND EMAIL
        mailerCtrl.sendAccountConfirmationEmail(userc.name, userc.username, userc.email, generatedPass)

        //NOTIF
        // notifCtrl.notifyAllUsersOfAType('MIC', `Inscription de ${name}`, `${name} a été inscrit en tant que ${userc.type} ${userc.role}`)
        // mailerCtrl.mailAllUsersOfAType('MIC', `Inscription de ${name}`, `${name} a été inscrit en tant que ${userc.type} ${userc.role}`)
        return res.status(204).json({})

        return res.json({ message: 'Utilisateur créé avec succès' })

    } catch (err) {
        // console.log(err);
        next(err)
    }

}

exports.addDepotUser = async (req, res, next) => {
    const name = xss(req.body.name)
    const username = xss(req.body.username.replace(/\s+/g, ''))
    const email = xss(req.body.email)
    const depot_id = (await this.getUsefulUserData(req.reqUserId)).depot_id

    //VALIDATION DES DONNEES RECUES ET PSEUDO ROUTAGE
    if (name || !username || !email || !depot_id) {
        return res.status(400).json({ message: 'Parametre(s) manquant(s)' })
    }


    try {

        // VERIFICATION D'EXISTENCE
        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { username: username },
                    { email: email }
                ]
            },
            raw: true
        })

        if (user !== null) {
            return res.status(409).json({ message: 'Identifiant / email déjà utilisé' })
        }

        let generatedPass = generator.generate({ lenght: 12, numbers: true, symbols: customSymbols, })

        let userc = await User.create({
            name: name,
            username: username,
            email: email,
            password: generatedPass,
            type: 'Depot',
            depot_id: depot_id,
            role: 'User',
            createdBy: req.reqUserId,
            updatedBy: req.reqUserId
        })

        //SEND EMAIL
        mailerCtrl.sendAccountConfirmationEmail(userc.name, userc.username, userc.email, generatedPass)

        //NOTIF
        // notifCtrl.notifyAllUsersOfAType('MIC', `Inscription de ${name}`, `${name} a été inscrit en tant que ${userc.type} ${userc.role}`)
        // mailerCtrl.mailAllUsersOfAType('MIC', `Inscription de ${name}`, `${name} a été inscrit en tant que ${userc.type} ${userc.role}`)
        return res.status(204).json({})

        return res.json({ message: 'Utilisateur créé avec succès' })

    } catch (err) {
        // console.log(err);
        next(err)
    }

}

exports.update = async (req, res, next) => {
    let id = parseInt(req.params.id)
    console.log('====================================');
    console.log(req.body);
    console.log('====================================');
    const name = xss(req.body.name);
    const username =req.body.username ? xss(req.body.username.replace(/\s+/g, '')):xss(req.body.username);
    const email = xss(req.body.email);
    let oldPass = xss(req.body.oldPass);
    let newPass = xss(req.body.newPass);
    const type = xss(req.body.type);
    const role = xss(req.body.role);
    const marketer_id = xss(req.body.marketer_id);
    const depot_id = xss(req.body.depot_id);
    const station_id = xss(req.body.station_id);
    const transporteur_id = xss(req.body.transporteur_id);
    const picture = req.body.picture;
    const changedPass = req.body.changedPass;
    const suffix = Date.now();

    if (!id || (!name && !username && !email && !oldPass && !newPass && !type && !role && !marketer_id && !depot_id && !station_id && !transporteur_id && !picture && (!changedPass || (changedPass !== 0 || changedPass !== 1)))) { return res.status(400).json({ message: 'Parametre(s) ou donnée(s) manquant(s)' }) }
    else if (id !== req.reqUserId && !(await canManageUser(req.reqUserId, id))) { return res.status(401).json({ message: 'Requête non authorisée' }) }
    else if (
        (id === req.reqUserId && (req.body.type || req.body.role || req.body.marketer_id || req.body.depot_id || req.body.station_id || req.body.transporteur_id)) ||
        (id !== req.reqUserId && (req.body.oldPass || req.body.newPass || req.body.picture)) ||
        (id !== req.reqUserId && req.body.type && !(await typeIsAllowed(req.reqUserId, type))) ||
        (id !== req.reqUserId && req.body.role &&
            (req.reqUserRole === role || req.reqUserRole === 'User' || (req.reqUserRole === 'Admin' && role === 'Super Admin'))
        )
    ) { { 
        return res.status(401).json({ message: 'Donnée(s) non authorisée(s) dans la requête ou accréditation incorrecte' }) } }
    else if (req.body.email && !emailIsValid(email)) { { return res.status(401).json({ message: email + ' n\'est pas un email valide' }) } }
    else if ((req.body.oldPass && !req.body.newPass) || (!req.body.oldPass && req.body.newPass)) { { return res.status(400).json({ message: 'Ancien ou nouveau mot de passe abscent' }) } }

    try {
        const user = await User.findByPk(id)
        if (user === null) { return res.status(404).json({ message: 'Compte utilisateur introuvable ou désactivé' }) }

        const useremail = await User.findOne({
            where:{'id':req.params.id}
        })
        // if(useremail.email === email) {return res.status(404).json({message: "L'adresse e-mail utilisée est déjà associée à un compte."})}
        if (oldPass && newPass){
            console.log(oldPass, newPass); 
            let test = await User.checkPassword(oldPass, user.password)
            if (!test) { return res.status(401).json({ message: 'L\'ancien mot de passe est erroné' }) }

            let hash = await bcrypt.hash(newPass, parseInt(process.env.BCRYPT_SALT_ROUND))
            req.body.newPass = hash
            newPass = hash
            console.log(user.passChanged);
            if (user.passChanged === 0) { await User.update({ password: newPass, passChanged: 1 }, { where: { id: user.id } }) }
            // Mise à jour de l'utilisateur
            await User.update({ password: newPass }, { where: { id: id } })

        }

        if (req.body.picture) {
            const buffer = Buffer.from(picture, 'base64')
            const name = '/public/uploads/profiles/user' + req.reqUserId + '_' + suffix + 'pp.jpg'
            const directory = process.env.SERVER_DIR
            fs.writeFileSync(directory + name, buffer);
            // console.log('file', directory+name);

            // console.log(name);
            await User.update({ image: name }, { where: { id: req.reqUserId } })
        }

        await User.update(req.body, { where: { id: id } })
        await User.update({ updatedBy: req.reqUserId }, { where: { id: id } })

        return res.status(204).json({})

    } catch (err) {
        console.log("uuuuuuuuuuuuuuuuuuuuuuuuuuuuuu",err);
        return res.status(500).json({ message: 'Erreur réseau ou serveur' })
    }
}

exports.updateUser = async (req, res, next) => {
    let id = parseInt(req.params.id)

    //VALIDATION DES DONNEES RECUES
    if (!id) {
        return res.status(400).json({ message: 'Parametre(s) manquant(s)' })
    } else if (req.body.password) { return res.status(401).json({ message: 'Parametre(s) non authorisé(s) dans la requette' }) }

    try {
        //RECUPERATION
        let user = await User.findByPk(id)
        if (user === null) {
            return res.status(404).json({ message: 'Utilisateur introuvable' })
        }

        //MISE A JOUR
        await User.update(req.body, { where: { id: id } })
        await User.update({ updatedBy: req.reqUserId }, { where: { id: id } })
        return res.json({ message: 'L\'utilisateur a bien été mis à jour' })

    } catch (err) {
        next(err)
    }
}

exports.updatePass = async (req, res, next) => {
    let id = parseInt(req.reqUserId)
    let oldPass = req.body.oldPass
    let newPass = req.body.newPass

    // console.log('Ancien: ', oldPass);
    // console.log('Nouveau: ', newPass);

    // Vérification si le champ id est présent et cohérent
    if (!id || !newPass || !oldPass) {
        return res.status(400).json({ message: 'Parametre(s) ou donnée(s) manquant(s)' })
    } else if (oldPass === newPass) {
        return res.status(400).json({ message: 'Les mot de passe sont identiques' })
    } else if (newPass.length < 8) {
        return res.status(400).json({ message: 'Le nouveau mot de passe doit avoir au moins 8 caractères' })
    }

    try {
        // Recherche de l'utilisateur et vérification
        let user = await User.findOne({ where: { id: id } })
        if (user === null) {
            return res.status(404).json({ message: 'Compte inexistant!' })
        }

        //Vérification de l'ancien mot de passe
        //let test = await bcrypt.compare(password, user.password)  
        let test = await User.checkPassword(oldPass, user.password)
        if (!test) {
            return res.status(401).json({ message: 'Mot depasse erroné' })
        }

        //Hashage du mot de passe utilisateur
        let hash = await bcrypt.hash(newPass, parseInt(process.env.BCRYPT_SALT_ROUND))
        req.body.newPass = hash
        newPass = hash

        // Mise à jour de l'utilisateur
        await User.update({ password: newPass }, { where: { id: id } })
        return res.status(200).json({ message: 'Mot de passe modifié avec succès' })
    } catch (err) {
        // console.log(err);
        return res.status(500).json({ message: 'Erreur réseau ou serveur' })
    }
}

exports.checkPass = async (req, res, next) => {
    let pass = req.body.pass

    // Vérification si le champ id est présent et cohérent
    if (!pass) { return res.status(400).json({ message: 'Veuillez renseigner le mot de passe' }) }

    try {
        // Recherche de l'utilisateur et vérification
        let user = await User.findByPk(req.reqUserId)
        if (user === null) { return res.status(404).json({ message: 'Compte inexistant!' }) }

        //Vérification de l'ancien mot de passe
        //let test = await bcrypt.compare(password, user.password)  
        let test = await User.checkPassword(pass, user.password)
        if (!test) { return res.status(401).json({ message: 'Mot depasse erroné' }) }

        return res.status(204).json({})

    } catch (err) {
        // console.log(err);
        return res.status(500).json({ message: 'Erreur réseau ou serveur' })
    }
}

async function canResetPass(email, month, year) {
    try {
        const password_reset_records = await PasswordResetRecord.findAll({ where: { [Op.and]: [{ email: email }, { month: month }, { year: year }] } })
        if (password_reset_records.length >= process.env.PASS_RESETS_PER_MONTH) { return false; }
        else { return true }
    } catch (err) {
        console.log(err);
        return false;
    }
}

exports.changePasswordThisToken = async (req, res, next) => {
    try {

        const password = xss(req.body.password)
        const { id, email } = req.user
        const user = await User.findOne({ where: { email: email, id: id } })
        if (user === null) {
            return res.status(404).json({ message: 'Compte inexistant' })
        }
        let hash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_SALT_ROUND));
        user.update({
            password: hash
        });
        return res.status(204).json({})
    } catch (err) {
        next(err)
    }

}
exports.resetPass = async (req, res, next) => {
    let { email, longitude, latitude, ip, device } = req.body

    const date = new Date();
    const currentYear = date.getFullYear();
    const currentMonth = date.getMonth() + 1;

    //VALIDATION DES DONNEES RECUES
    if (!email || !longitude || !latitude || !ip || !device) {
        return res.status(400).json({ message: 'Veuillez renseigner tous les champs' })
    }


    try {

        const canReset = await canResetPass(email, currentMonth, currentYear)
        if (!canReset) { return res.status(401).json({ message: 'Désolé, vous ne pouvez plus réinitialiser votre mot de passe avant le mois prochain' }) }

        // VERIFICATION D'EXISTENCE
        const user = await User.findOne({ where: { email: email } })

        if (user === null) {
            return res.status(404).json({ message: 'Compte inexistant' })
        }

        // let generatedPass = generator.generate({lenght: 12, numbers: true,symbols: customSymbols,})
        // let hash = await bcrypt.hash(generatedPass, parseInt(process.env.BCRYPT_SALT_ROUND))
        const tokenResetPassword = jwt.sign({
            id: user.id,
            email: user.email
        }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_DURING });
        //Creation
        // await User.update({ password: hash, updatedBy: req.reqUserId }, {where: {email: email}})
        const addLien = `confirm/${tokenResetPassword}`
        mailerCtrl.sendPasswordResetEmail(user.name, user.email, addLien)

        //TRACABILITE
        await PasswordResetRecord.create({
            email: email,
            longitude: longitude,
            latitude: latitude,
            ip: ip,
            device: device,
            month: currentMonth,
            year: currentYear
        })
        return res.status(204).json({})

    } catch (err) {
        next(err)
    }
}

async function canManageUser(requesterId, targetId) {
    try {
        const requester = await User.findByPk(requesterId);
        const target = await User.findByPk(targetId);

        if (requester.role === 'Super Admin'||
            (
                requester.type === target.type &&
                (
                    (requester.role === 'Super Admin' && (target.role === 'Admin' || target.role === 'User')) ||
                    (requester.role === 'Admin' && target.role === 'User')
                )
            ) ||
            (requester.type === 'MIC' && target.type !== 'MIC') ||
            (requester.type === 'Marketer' && target.type === 'Station')
        ){return true}else{return false}
    } catch (err) {return false}
}

exports.trashUser = async (req, res, next) => {

    let id = parseInt(req.params.id)
    const suspensionComment = xss(req.body.suspensionComment)

    //VALIDATION DES DONNEES RECUES
    if (!id || !suspensionComment) { return res.status(400).json({ message: 'Parametre(s) ou donnée(s) manquant(s)' }) }
    else if (!canManageUser(req.reqUserId, id)) { return res.status(401).json({ message: 'Requête non authorisée' }) }

    try {
        const user = await User.findByPk(id)
        if (user === null) { return res.status(404).json({ message: 'Donnée introubable' }) }

        await User.update({ deletedBy: req.reqUserId, suspensionComment: suspensionComment, restoredBy: null }, { where: { id: id } })
        await User.destroy({ where: { id: id } })

        return res.status(204).json({})

    } catch (err) {
        next(err)
    }

}

exports.untrashUser = async (req, res, next) => {
    let id = parseInt(req.params.id)

    //VALIDATION DES DONNEES RECUES
    if (!id) { return res.status(400).json({ message: 'Parametre(s) manquant(s)' }) }
    else if (!canManageUser(req.reqUserId, id)) { return res.status(401).json({ message: 'Requête non authorisée' }) }

    try {
        const user = await User.findByPk(id, { paranoid: false })
        if (user === null) { return res.status(404).json({ message: 'Donnée introubable' }) }

        await User.restore({ where: { id: id } })
        await User.update({ deletedBy: null, suspensionComment: null, restoredBy: req.reqUserId }, { where: { id: id } })

        return res.status(204).json({})

    } catch (err) {
        next(err)
    }

}

exports.deleteUser = async (req, res, next) => {
    let id = parseInt(req.params.id)

    //VALIDATION DES DONNEES RECUES
    if (!id) {
        return res.status(400).json({ message: 'Parametre(s) manquant(s)' })
    }

    try {
        const user = await User.findByPk(id, { paranoid: false })
        if (user === null) { return res.status(404).json({ message: 'Donnée introubable' }) }

        await User.destroy({ where: { id: id }, force: true })

        return res.status(204).json({})

    } catch (err) {
        next(err)
    }
}