/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const jwt = require('jsonwebtoken')
const { Op } = require("sequelize");
const xss = require("xss");

const {LicenceExploitation,CustomSSatToken,Ville,Marketer,User,Station} = require('../models')
const userCtrl = require('./user')
const directory = process.env.SERVER_DIR

const mailerCtrl = require('./_internal/mailer')
const notifCtrl = require('./notification');
const { fileSaver } = require('./_internal/filesaver');
const path = require('path')
let fs = require('fs');

// mod.cjs
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

/*****************************/
/*** GESTION DE LA RESSOURCE */



async function ssLogin(type) {

    let body = {
        "login": process.env.SSAT_LOGIN,
        "password": process.env.SSAT_PASS,
        "appKey": process.env.SSAT_APPKEY
    }
    console.log("***********> login FK*====> type is ", type);
    if (type == "JNP") {
        body = {
            "login": process.env.JNP_LOGIN,
            "password": process.env.JNP_PASS,
            "appKey": process.env.JNP_APPKEY
        }
    }
    else {
        body = {
            "login": process.env.SSAT_LOGIN,
            "password": process.env.SSAT_PASS,
            "appKey": process.env.SSAT_APPKEY
        }
    }

    console.log("body");
    console.log(body);
    const response = await fetch('https://fleet.securysat.com/json/login',
        {
            method: 'post',
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' }
        });

    const data = await response.json();

    // newSst = await SSatToken.create({
    //     token: data.sessionId
    // })
    console.log("je ussuiuizeegjhfjgfhe",type);
    newSst = await CustomSSatToken.create({
        type: type,
        token: data.sessionId
    })

    // console.log('returned this after sslogin --> ', data.sessionId);
    return data.sessionId
}

async function ssGetList(token) {

    const response = await fetch('https://fleet.securysat.com/json/getMarkers', {
        method: 'post',
        body: JSON.stringify({
            "sessionId": token,
            "onlyActive": true
        }),
        headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();

    return data
}
async function sSatTokenIsValid(token){

    const response = await fetch('https://fleet.securysat.com/json/getVehicles', {
        method: 'post',
        body: JSON.stringify({
            "sessionId": token,
            onlyActive: true
        }),
        headers: {'Content-Type': 'application/json'}
    });

    const data = await response.json();

    if (data.error) {return false}else{return true}

}
async function gValidSST(type) {
    console.log("validate");
    console.log("***********> validation FK*====> type is ", type);

    try {
        // let ssts = (type == "JNP" ? await CustomSSatToken.findAll({ where: { type: "JNP" } }) : await CustomSSatToken.findAll());
        let ssts = (type == "JNP" ? await CustomSSatToken.findAll({ where: { type: "JNP" },order:[ ['createdAt','desc'] ],limit: 1 }) : await CustomSSatToken.findAll({ where: { type: null },order:[ ['createdAt','desc'] ],limit: 1 }));
        if (ssts.length < 1) {
            const newSst = await ssLogin(type);
            return newSst;
        } else {

            const tokenIsValid = await sSatTokenIsValid(ssts[0].token);
            console.warn("tokenIsValid========>", tokenIsValid);
            if (tokenIsValid) { return ssts[0].token }
            else {
                for (const sst of ssts) { await CustomSSatToken.destroy({ where: { id: sst.id } }) }
                
                const newSst = await ssLogin(type);

                return newSst;
            }
        }
    } catch (err) {
        console.log("faail");
        return null
    }
}


exports.getStationsFromPOI = async (req, res, next) => {
    const option = xss(req.params.option)
    const identity = xss(req.identite)
    console.warn("==================================>");
    console.warn("identity");
    console.log(identity);
    console.warn("==================================>");
    // console.log(req)
    try {
        let sst = await gValidSST(identity);
        // let sst = (identity == "JNP" ? await CustomSSatToken.findOne({where:{ type: "JNP" }}) : await CustomSSatToken.findOne({where:{ type: null },order: [['createdAt', 'ASC']],limit: 1}));
        // // let sst = await SSatToken.findOne();
        let token =sst;
        let list;

        
            list = await ssGetList(token)
        // }

        let data = [];
        const ssatData = list;
        // const stations = await Station.findAll({paranoid: true });
        const stations = await Station.findAll({ where: { isactive: true }, paranoid: true });

        //FILTERS EXISTING DATA
        for (const ssd of ssatData.markers) {
            let matches = 0;
            for (const station of stations) { station.nom.toLowerCase().replaceAll(' ', '') === ssd.label.toLowerCase().replaceAll(' ', '') && matches++ }
            matches === 0 && data.push(ssd)
        }

        return option === 'no-filter' ? res.json(list.markers) : res.json(data)

    } catch (err) {
        next(err); 
    }
}

exports.getAllStations = async (req, res, next) => {
    // console.log(req);
    try {

        let stationList = [];
        let stations

        if (req.reqUserType === 'Marketer') {
            // console.log("je suis un marketer");
            const user = await userCtrl.getUsefulUserData(req.reqUserId)
            stations = await Station.findAll({ where: { [Op.and]: [{ type: 'STATION' }, { marketer_id: user.marketer_id }] }, paranoid: false, order: [['createdAt', 'desc']] });
            // stations = await Station.findAll({ where: { [Op.and]: [{ type: 'STATION' }, { marketer_id: user.marketer_id }, {isactive: true}] }, paranoid: false, order: [['createdAt', 'desc']] });
        }
        else {
            stations = await Station.findAll({ where: { type: 'STATION' }, paranoid: false, order: [['createdAt', 'desc']] });
        }

        for (let i = 0; i < stations.length; i++) {

            stationList.push(
                {
                    id: stations[i].id,
                    type: stations[i].type,
                    poi_id: stations[i].poi_id,
                    longitude: stations[i].longitude,
                    latitude: stations[i].latitude,
                    ifu: stations[i].ifu,
                    rccm: stations[i].rccm,
                    nom: stations[i].nom,
                    ville: await Ville.findByPk(stations[i].ville_id),
                    isactive: stations[i].isactive,
                    licenceExploitation: await LicenceExploitation.findOne({ where: { station_id: stations[i].id }, paranoid: false }),
                    adresse: stations[i].adresse,
                    marketer: await Marketer.findByPk(stations[i].marketer_id),
                    etat: stations[i].etat,
                    createdBy: await userCtrl.getUsefulUserData(stations[i].createdBy),
                    updatedBy: await userCtrl.getUsefulUserData(stations[i].updatedBy),
                    createdAt: stations[i].createdAt,
                    updatedAt: stations[i].updatedAt,
                    deletedAt: stations[i].deletedAt
                }
            )
        }

        res.json({ data: stationList,nbr:stationList.length })

    } catch (err) {
        console.log(err)
        next(err); 
    }

}

exports.getAll = async (req, res, next) => {
    // console.log(req.body);
    try {

        let stationList = [];
        let stations

        if (req.reqUserType === 'Marketer') {
            const user = await userCtrl.getUsefulUserData(req.reqUserId)
            stations = await Station.findAll({ where: { marketer_id: user.marketer_id }, paranoid: false, order: [['createdAt', 'desc']] });
        }
        else {
            stations = await Station.findAll({ where: { isactive: true }, paranoid: false, order: [['createdAt', 'desc']] });
        }

        for (let i = 0; i < stations.length; i++) {
            stationList.push(
                {
                    id: stations[i].id,
                    type: stations[i].type,
                    poi_id: stations[i].poi_id,
                    longitude: stations[i].longitude,
                    latitude: stations[i].latituded,
                    ifu: stations[i].ifu,
                    rccm: stations[i].rccm,
                    nom: stations[i].nom,
                    ville: await Ville.findByPk(stations[i].ville_id),
                    isactive: stations[i].isactive,
                    adresse: stations[i].adresse,
                    licenceExploitation: await LicenceExploitation.findOne({ where: { station_id: stations[i].id }, paranoid: false }),
                    marketer: await Marketer.findByPk(stations[i].marketer_id),
                    etat: stations[i].etat,
                    createdBy: await userCtrl.getUsefulUserData(stations[i].createdBy),
                    updatedBy: await userCtrl.getUsefulUserData(stations[i].updatedBy),
                    createdAt: stations[i].createdAt,
                    updatedAt: stations[i].updatedAt,
                    deletedAt: stations[i].deletedAt
                }
            )
        }



        return res.json({ data: stationList,nbr:stationList.length })

    } catch (err) {
        console.log(err)
        next(err); 
    }

}
exports.getAllinactive = async (req, res, next) => {

    try {

        let stationList = [];
        let stations

        if (req.reqUserType === 'Marketer') {
            const user = await userCtrl.getUsefulUserData(req.reqUserId)
            stations = await Station.findAll({ where: { marketer_id: user.marketer_id, isactive: false, }, paranoid: false, order: [['createdAt', 'desc']] });
        }
        else {
            stations = await Station.findAll({ where: { isactive: false }, paranoid: false, order: [['createdAt', 'desc']] });
        }

        for (let i = 0; i < stations.length; i++) {
            stationList.push(
                {
                    id: stations[i].id,
                    type: stations[i].type,
                    poi_id: stations[i].poi_id,
                    longitude: stations[i].longitude,
                    latitude: stations[i].latitude,
                    ifu: stations[i].ifu,
                    rccm: stations[i].rccm,
                    nom: stations[i].nom,
                    ville: await Ville.findByPk(stations[i].ville_id),
                    isactive: stations.isactive,
                    licenceExploitation: await LicenceExploitation.findOne({ where: { station_id: stations[i].id }, paranoid: false }),
                    adresse: stations[i].adresse,
                    marketer: await Marketer.findByPk(stations[i].marketer_id),
                    etat: stations[i].etat,
                    createdBy: await userCtrl.getUsefulUserData(stations[i].createdBy),
                    updatedBy: await userCtrl.getUsefulUserData(stations[i].updatedBy),
                    createdAt: stations[i].createdAt,
                    updatedAt: stations[i].updatedAt,
                    deletedAt: stations[i].deletedAt
                }
            )
        }



        return res.json({ data: stationList ,nbr:list.length})

    } catch (err) {
        next(err); 
    }

}

exports.gStationsByMarketer = async (req, res, next) => {

    const id = parseInt(req.params.id)
    if (!id) { return res.status(400).json({ message: 'Parametre(s) manquant(s)' }) }

    try {
        const marketer = await Marketer.findByPk(id, { paranoid: false, order: [['createdAt', 'desc']] })
        if (marketer === null) { return res.status(404).json({ message: 'Marketer introuvable ou désactivé' }) }

        let stationList = [];
        let stations = await Station.findAll({ where: { marketer_id: id, isactive: true }, paranoid: false, order: [['createdAt', 'desc']] });
        for (const station of stations) {
            stationList.push(
                {
                    id: station.id,
                    type: station.type,
                    poi_id: station.poi_id,
                    longitude: station.longitude,
                    latitude: station.latitude,
                    nom: station.nom,
                    ville: await Ville.findByPk(station.ville_id),
                    isactive: stations.isactive,
                    licenceExploitation: await LicenceExploitation.findOne({ where: { station_id: station.id }, paranoid: false }),
                    adresse: station.adresse,
                    marketer: await Marketer.findByPk(station.marketer_id),
                    etat: station.etat,
                    createdBy: await userCtrl.getUsefulUserData(station.createdBy),
                    updatedBy: await userCtrl.getUsefulUserData(station.updatedBy),
                    createdAt: station.createdAt,
                    updatedAt: station.updatedAt,
                    deletedAt: station.deletedAt
                }
            )
        }

        res.json({ data: stationList ,nbr:stationList.length})

    } catch (err) {
        next(err); 
    }

}

exports.gInactiveStationsByMarketer = async (req, res, next) => {

    const id = parseInt(req.params.id)
    if (!id) { return res.status(400).json({ message: 'Parametre(s) manquant(s)' }) }

    try {
        const marketer = await Marketer.findByPk(id, { paranoid: false, order: [['createdAt', 'desc']] })
        if (marketer === null) { return res.status(404).json({ message: 'Marketer introuvable ou désactivé' }) }

        let stationList = [];
        let stations = await Station.findAll({ where: { marketer_id: id, isactive: false }, paranoid: false, order: [['createdAt', 'desc']] });
        for (const station of stations) {
            stationList.push(
                {
                    id: station.id,
                    type: station.type,
                    poi_id: station.poi_id,
                    longitude: station.longitude,
                    latitude: station.latitude,
                    nom: station.nom,
                    ville: await Ville.findByPk(station.ville_id),
                    isactive: stations.isactive,
                    licenceExploitation: await LicenceExploitation.findOne({ where: { station_id: station.id }, paranoid: false }),
                    adresse: station.adresse,
                    marketer: await Marketer.findByPk(station.marketer_id),
                    etat: station.etat,
                    createdBy: await userCtrl.getUsefulUserData(station.createdBy),
                    updatedBy: await userCtrl.getUsefulUserData(station.updatedBy),
                    createdAt: station.createdAt,
                    updatedAt: station.updatedAt,
                    deletedAt: station.deletedAt
                }
            )
        }

        res.json({ data: stationList,nbr:stationList.length })

    } catch (err) {
        next(err); 
    }

}

exports.getOne = async (req, res, next) => {
    let id = parseInt(req.params.id)

    //VALIDATION DES DONNEES RECUES
    if (!id) {
        return res.status(400).json({ message: 'Parametre(s) manquant(s)' })
    }

    try {
        //RECUPERATION
        let station = await Station.findByPk(id, { paranoid: false })
        if (station === null) {
            return res.status(404).json({ message: 'Station introuvable ou désactivée' })
        }

        // if (station.isactive === true) {

        //ENVOI
        return res.json({
            data: [{
                id: station.id,
                type: station.type,
                poi_id: station.poi_id,
                longitude: station.longitude,
                latitude: station.latitude,
                nom: station.nom,
                ville: await Ville.findByPk(station.ville_id),
                isactive: station.isactive,
                licenceExploitation: await LicenceExploitation.findOne({ where: { station_id: station.id }, paranoid: false }),
                adresse: station.adresse,
                marketer: await Marketer.findByPk(station.marketer_id),
                etat: station.etat,
                createdBy: await userCtrl.getUsefulUserData(station.createdBy),
                updatedBy: await userCtrl.getUsefulUserData(station.updatedBy),
                createdAt: station.createdAt,
                updatedAt: station.updatedAt,
                deletedAt: station.deletedAt
            }]
        })

        // }
        // return res.status(400).json({ message: 'Cette station n\'est pas activée' })
    } catch (err) {
        next(err); 
    }
}
exports.getOneInactive = async (req, res, next) => {
    let id = parseInt(req.params.id)

    //VALIDATION DES DONNEES RECUES
    if (!id) {
        return res.status(400).json({ message: 'Parametre(s) manquant(s)' })
    }

    try {
        //RECUPERATION
        let station = await Station.findByPk(id, { paranoid: false })
        if (station === null) {
            return res.status(404).json({ message: 'Station introuvable ou désactivée' })
        }
        if (station.isactive === false) {



            //ENVOI
            return res.json({
                data: [{
                    id: station.id,
                    type: station.type,
                    poi_id: station.poi_id,
                    longitude: station.longitude,
                    latitude: station.latitude,
                    nom: station.nom,
                    ville: await Ville.findByPk(station.ville_id),
                    licenceExploitation: await LicenceExploitation.findOne({ where: { station_id: station.id }, paranoid: false }),
                    adresse: station.adresse,
                    marketer: await Marketer.findByPk(station.marketer_id),
                    etat: station.etat,
                    createdBy: await userCtrl.getUsefulUserData(station.createdBy),
                    updatedBy: await userCtrl.getUsefulUserData(station.updatedBy),
                    createdAt: station.createdAt,
                    updatedAt: station.updatedAt,
                    deletedAt: station.deletedAt
                }]
            })
        }
        return res.status(400).json({ message: 'Cette station est déja activée' })

    } catch (err) {
        next(err); 
    }
}

exports.getByName = async (req, res, next) => {
    let nom = xss(req.params.nom)

    //VALIDATION DES DONNEES RECUES
    if (!nom) {
        return res.status(400).json({ message: 'Parametre(s) manquant(s)' })
    }

    try {
        //RECUPERATION
        let station;
        let stations = await Station.findAll({ paranoid: false });
        for (const sta of stations) {
            sta.nom.toLowerCase().replaceAll(' ', '') === nom.toLowerCase().replaceAll(' ', '') ? station = sta : false
        }

        if (!station) {
            return res.status(404).json({ message: 'Station introuvable ou désactivée' })
        }

        //ENVOI
        return res.json(station)

    } catch (err) {
        next(err); 
    }
}

exports.add = async (req, res, next) => {


    const poi_id = parseInt(req.body.poi_id)
    const longitude = xss(req.body.longitude)
    const latitude = xss(req.body.latitude)
    const ifu = xss(req.body.ifu)
    const nom = xss(req.body.nom)
    const ville_id = parseInt(req.body.ville_id)
    const marketer_id = parseInt(req.body.marketer_id)
    const rccm = xss(req.body.rccm)
    const adresse = xss(req.body.adresse)
    const licenceExploitation = req.body.licenceExploitation


    //VALIDATION DES DONNEES RECUES
    if (
        !poi_id || !longitude || !latitude || !nom || !ville_id || !adresse || !marketer_id || !licenceExploitation
    ) {
        return res.status(400).json({ message: 'Veuillez renseigner tous les champs' })
    }
    else if (!licenceExploitation.date_debut || !licenceExploitation.date_fin || !licenceExploitation.doc) {
        return res.status(400).json({ message: 'Veuillez renseigner tous les champs pour l\'licence d\'exploitation' })
    }
    // console.log("licenceExploitation------>", licenceExploitation);
    try {
        //VERIFICATION D'EXISTENCE
        // let stationCheckByIfuOrRCCM = await Station.findOne({where: {[Op.or]: [{ifu: ifu}, {rccm: rccm}]}})
        let stationCheckByName = await Station.findOne({ where: { nom: nom } })
        // if(stationCheckByIfuOrRCCM !== null){ return res.status(409).json({ message: `Ifu ou rccm déjà utilisé` }) }
        if (stationCheckByName !== null) { return res.status(409).json({ message: `Le nom ${nom} est déjà utilisé` }) }


        const directory = process.env.SERVER_DIR
        const licenceExploitationdocName = fileSaver(licenceExploitation.doc, licenceExploitation.date_debut + "_" + nom + "_" + licenceExploitation.date_fin, "licenceExploitation")


        //CREATION
        let newStation = await Station.create({
            poi_id: poi_id,
            longitude: longitude,
            latitude: latitude,
            isactive: false,
            rccm: rccm,
            ifu: ifu,
            nom: nom,
            ville_id: ville_id,
            adresse: adresse,
            marketer_id: marketer_id,
            createdBy: req.reqUserId,
            updatedBy: req.reqUserId
        })

        await LicenceExploitation.create({
            station_id: newStation.id,
            document: licenceExploitationdocName,
            date_debut: licenceExploitation.date_debut,
            date_fin: licenceExploitation.date_fin,
            createdBy: req.reqUserId,
            updatedBy: req.reqUserId
        })

        // const requester = await User.findByPk(req.reqUserId)
        // const targetMarketer = await Marketer.findByPk(marketer_id)
        // mailerCtrl.mailAllUsersOfAType('MIC', `La station ${newStation.nom} a bien été ajouté`, `Le ${requester.type} ${requester.name}, a ajouté la station ${newStation.nom} pour la structure ${targetMarketer.nom}.`)
        // notifCtrl.notifyAllUsersOfAType('MIC', `La station ${newStation.nom} a bien été ajouté`, `Le ${requester.type} ${requester.name}, a ajouté la station ${newStation.nom} pour la structure ${targetMarketer.nom}.`)

        // const marketerUsers = await User.findAll({ where: { marketer_id: marketer_id } })
        // for (const marketerUser of marketerUsers) {
        //     if (marketerUsers.type !== 'Station') {
        //         mailerCtrl.mailSingle(marketerUser.id, `La station ${newStation.nom} a bien été ajouté`, `La station ${newStation.nom} a été ajoutée pour la structure ${targetMarketer.nom}.`)
        //         notifCtrl.notifySingle(marketerUser.id, `La station ${newStation.nom} a bien été ajouté`, `La station ${newStation.nom} a été ajoutée pour la structure ${targetMarketer.nom}.`)
        //     }
        // }

        //ENVOI
        return res.json({ message: 'La station a bien été ajouté' })

    } catch (err) {
        next(err); 
    }
}

exports.addb2b = async (req, res, next) => {
    // console.log(req.body);
    // return res.json(req.body)
    const poi_id = parseInt(req.body.poi_id)
    const longitude = xss(req.body.longitude)
    const latitude = xss(req.body.latitude)
    const ifu = xss(req.body.ifu)
    const document_ifu = req.body.document_ifu
    const nom = xss(req.body.nom)
    const ville_id = parseInt(req.body.ville_id)
    // const marketer_id = parseInt(req.body.marketer_id)
    const rccm = xss(req.body.rccm)
    const document_rccm = req.body.document_rccm
    const adresse = xss(req.body.adresse)

    //VALIDATION DES DONNEES RECUES
    if (
        !poi_id || !longitude || !latitude || !nom || !ville_id || !adresse
    ) {
        return res.status(400).json({ message: 'Veuillez renseigner tous les champs' })
    }

    const user = await userCtrl.getUsefulUserData(req.reqUserId)
    try {
        if (user.marketer_id) {

            //VERIFICATION D'EXISTENCE
            // let stationCheckByIfuOrRCCM = await Station.findOne({where: {[Op.or]: [{ifu: ifu}, {rccm: rccm}]}})
            let stationCheckByName = await Station.findOne({ where: { nom: nom } })
            // if(stationCheckByIfuOrRCCM !== null){ return res.status(409).json({ message: `Ifu ou rccm déjà utilisé` }) }
            if (stationCheckByName !== null) { return res.status(409).json({ message: `Le nom ${nom} est déjà utilisé` }) }

            //CREATION
            let newStation = await Station.create({
                poi_id: poi_id,
                longitude: longitude,
                latitude: latitude,
                rccm: rccm,
                document_rccm: document_rccm,
                ifu: ifu,
                document_ifu: document_ifu,
                nom: nom,
                ville_id: ville_id,
                adresse: adresse,
                marketer_id: user.marketer_id,
                createdBy: req.reqUserId,
                updatedBy: req.reqUserId
            })

            const requester = await User.findByPk(req.reqUserId)
            const targetMarketer = await Marketer.findByPk(marketer_id)
            mailerCtrl.mailAllUsersOfAType('MIC', `La station ${newStation.nom} a bien été ajouté`, `Le ${requester.type} ${requester.name}, a ajouté la station ${newStation.nom} pour la structure ${targetMarketer.nom}.`)
            notifCtrl.notifyAllUsersOfAType('MIC', `La station ${newStation.nom} a bien été ajouté`, `Le ${requester.type} ${requester.name}, a ajouté la station ${newStation.nom} pour la structure ${targetMarketer.nom}.`)

            const marketerUsers = await User.findAll({ where: { marketer_id: marketer_id } })
            for (const marketerUser of marketerUsers) {
                if (marketerUsers.type !== 'Station') {
                    mailerCtrl.mailSingle(marketerUser.id, `Le B2B  ${newStation.nom} a bien été ajouté`, `La station ${newStation.nom} a été ajoutée pour la structure ${targetMarketer.nom}.`)
                    notifCtrl.notifySingle(marketerUser.id, `Le B2B  ${newStation.nom} a bien été ajouté`, `La station ${newStation.nom} a été ajoutée pour la structure ${targetMarketer.nom}.`)
                }
            }

            //ENVOI
            return res.json({ message: 'La station a bien été ajouté' })
        } else {
            return res.status(400).json({ message: "Vous n'avez aucun Marketer associé à votre compte" })
        }

    } catch (err) {
        next(err); 
    }
}


exports.activate = async (req, res, next) => {
    let id = parseInt(req.params.id)



    //VALIDATION DES DONNEES RECUES
    if (!id) {
        return res.status(400).json({ message: 'Parametre(s) manquant(s)' })
    }

    try {
        //RECUPERATION
        let station = await Station.findByPk(id)
        if (station === null) {
            return res.status(404).json({ message: 'Station introuvable ou désactivée' })
        }

        if (station.isactive == true) {
            await Station.update({ isactive: 0 }, { where: { id: id } });
            await Station.update({ updatedBy: req.reqUserId }, { where: { id: id } });
            return res.json({ message: 'La station a bien été activée' });
        }
        else {
            await Station.update({ isactive: 1 }, { where: { id: id } });
            await Station.update({ updatedBy: req.reqUserId }, { where: { id: id } });
            return res.json({ message: 'La station a bien été désactivée' });
        }
    } catch (err) {
        next(err); 
    }
}



exports.update = async (req, res, next) => {
    let id = parseInt(req.params.id)
    const lExploitation = req.body.licenceExploitation
    if (!id) {
        return res.status(400).json({ message: 'Parametre(s) manquant(s)' })
    }
    // else if (lExploitation)
    //     if (!lExploitation.date_debut || !lExploitation.date_fin) {
    //         return res.status(400).json({ message: 'Veuillez renseigner tous les champs.' })
    //     }
    try {
        // let ExploitationdocBuffer;
        let licenceExploitationdocName

        if (lExploitation) {
            ExploitationdocBuffer = Buffer.from(lExploitation.doc, 'base64')
            licenceExploitationdocName = '/public/uploads/licenceExploitation_docs_' + req.body.nom + Date() + '_.pdf'
            fs.writeFileSync(directory + licenceExploitationdocName, ExploitationdocBuffer);
        }

        //RECUPERATION
        let station = await Station.findByPk(id)
        if (station === null) {
            return res.status(404).json({ message: 'Station introuvable' })
        }

        //MISE A JOUR
        await Station.update(req.body, { where: { id: id } })
        await Station.update({ updatedBy: req.reqUserId }, { where: { id: id } })
        // let destroylExploitation = await LicenceExploitation.findOne({ where: { station_id: id }, paranoid: false })
        // if (destroylExploitation !== null) {
        //     await LicenceExploitation.destroy({ where: { station_id: id } })
        // }
        licence_docs = {}
        if (lExploitation)
            if (lExploitation.date_debut && lExploitation.date_fin) {
                licence_docs = {
                    document: licenceExploitationdocName,
                    date_debut: lExploitation.date_debut,
                    date_fin: lExploitation.date_fin,
                    createdBy: req.reqUserId,
                    updatedBy: req.reqUserId
                }

            } else {
                licence_docs = {
                    document: licenceExploitationdocName,
                    createdBy: req.reqUserId,
                    updatedBy: req.reqUserId
                }

            }
        await LicenceExploitation.update(licence_docs, { where: { station_id: id }, paranoid: false })
        // await LicenceExploitation.create({
        //     station_id: id,
        //     document: licenceExploitationdocName,
        //     date_debut: lExploitation.date_debut,
        //     date_fin: lExploitation.date_fin,
        //     createdBy: req.reqUserId,
        //     updatedBy: req.reqUserId
        // })
        return res.json({ message: 'Le station a bien été mis à jour' })

    } catch (err) {
        next(err); 
    }
}


exports.trash = async (req, res, next) => {

    let id = parseInt(req.params.id)
    const suspensionComment = xss(req.body.suspensionComment)

    //VALIDATION DES DONNEES RECUES
    if (!id || !suspensionComment) {
        // console.log('missing data');
        return res.status(400).json({ message: 'Parametre(s) ou donnée(s) manquant(s)' })
    }

    try {
        const station = await Station.findByPk(id)
        if (station === null) { return res.status(404).json({ message: 'Donnée introubable' }) }

        await Station.update({ deletedBy: req.reqUserId, suspensionComment: suspensionComment, restoredBy: null, isactive: false }, { where: { id: id } })
        await Station.destroy({ where: { id: id } })

        // await User.update({ deletedBy: req.reqUserId, suspensionComment: suspensionComment, restoredBy: null }, { where: { station_id: id } })
        // await User.destroy({ where: { station_id: id } })

        return res.status(204).json({})

    } catch (err) {
        return next(err); 
    }

}
exports.multiUnTrash = async (req, res, next) => {
    
    const listeId = req.body.ids
    if (!listeId || !Array.isArray(listeId)) { return res.status(400).json({ message: "Parametre(s) manquant(s)" }) }

    try {
        for(const id of listeId){
            const station = await Station.findByPk(id, { paranoid: false })
            if (station === null) { return res.status(404).json({ message: 'Donnée introubable' }) }

            await Station.restore({ where: { id: id } })
            await Station.update({ deletedBy: null, suspensionComment: null, restoredBy: req.reqUserId,isactive:true }, { where: { id: id} })

            await User.restore({ where: { station_id: id } })
            await User.update({ deletedBy: null, suspensionComment: null, restoredBy: req.reqUserId }, { where: { station_id: id } })
        }
        

        return res.status(204).json({})

    } catch (err) {
        return next(err); 
    }

}
exports.untrash = async (req, res, next) => {
    let id = parseInt(req.params.id)

    //VALIDATION DES DONNEES RECUES
    if (!id) {
        return res.status(400).json({ message: 'Parametre(s) manquant(s)' })
    }

    try {
        const station = await Station.findByPk(id, { paranoid: false })
        if (station === null) { return res.status(404).json({ message: 'Donnée introubable' }) }

        await Station.restore({ where: { id: id } })
        await Station.update({ deletedBy: null, suspensionComment: null, restoredBy: req.reqUserId, isactive: true }, { where: { id: id } })

        await User.restore({ where: { station_id: id } })
        await User.update({ deletedBy: null, suspensionComment: null, restoredBy: req.reqUserId }, { where: { station_id: id } })

        return res.status(204).json({})

    } catch (err) {
        return next(err); 
    }

}

exports.delete = async (req, res, next) => {
    let id = parseInt(req.params.id)

    //VALIDATION DES DONNEES RECUES
    if (!id) {
        return res.status(400).json({ message: 'Parametre(s) manquant(s)' })
    }

    try {
        const station = await Station.findByPk(id, { paranoid: false })
        if (station === null) { return res.status(404).json({ message: 'Donnée introubable' }) }

        await Station.destroy({ where: { id: id }, force: true })

        return res.status(204).json({})

    } catch (err) {
        return next(err); 
    }
}