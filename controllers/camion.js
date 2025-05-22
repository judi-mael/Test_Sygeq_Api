/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const jwt = require('jsonwebtoken')
const { Op } = require("sequelize");
const xss = require("xss");


const {BonLivraison,Camion,Transporteur,Compartiment,DetailsLivraison,DetailsLivraisonBarcode,CertificatDeBaremage,VisiteTechnique,Station,Slp,Depot,Produit,Marketer,CustomSSatToken,Insurance} =  require('../models')
const userCtrl = require('./user')


const directory = process.env.SERVER_DIR
let fs = require('fs');

// mod.cjs
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

/*****************************/
/*** GESTION DE LA RESSOURCE */



async function ssLogin(type) {

    let body = {}
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
    newSst = await CustomSSatToken.create({
        type: type,
        token: data.sessionId
    })

    // console.log('returned this after sslogin --> ', data.sessionId);
    return data.sessionId
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

async function gValidSST(identite){
    const type = identite
    try {
        let ssts = (type == "JNP" ? await CustomSSatToken.findAll({ where: { type: "JNP" },order:[ ['createdAt','desc'] ],limit: 1 }) : await CustomSSatToken.findAll({ where: { type: null },order:[ ['createdAt','desc'] ],limit: 1 }));
        // let ssts = await SSatToken.findAll()
        if (ssts.length < 1) {
            const newSst = await ssLogin(type);
            return newSst;
        }else{

            const tokenIsValid = await sSatTokenIsValid(ssts[0].token)
            if (tokenIsValid) {return ssts[0].token}
            else{
                for(const sst of ssts) {await CustomSSatToken.destroy({where:{id: sst.id}})}
                // for(const sst of ssts) {await SSatToken.destroy({where:{id: sst.id}})}
                const newSst = await ssLogin(type);

                return newSst;
            }
        }
    } catch (err) {return null}
}

exports.getCamionsFromPOI = async (req, res, next) => {

    const identity = req.identite
    const option = xss(req.params.option)
    

    try {
        let sst = await gValidSST(identity);
        if(sst === null){return res.status(500).json({message: 'Erreur réseau ou serveur SST'})}
        

        const response = await fetch('https://fleet.securysat.com/json/getVehicles', {
            method: 'post',
            body: JSON.stringify({
                "sessionId": sst,
                "onlyActive": true
            }),
            headers: {'Content-Type': 'application/json'}
        });
    
        let data=[];
        const ssatData = await response.json();
        if (option === 'no-filter') {
  
            return res.json(ssatData.vehicles)
        }
        const camions = await Camion.findAll({paranoid: true});
        //FILTERS EXISTING DATA
        for (const ssd of ssatData.vehicles) {
            let matches = 0;
            for (const camion of camions) { camion.imat.toLowerCase().replaceAll(' ','') === ssd.plateNumber.toLowerCase().replaceAll(' ','') && matches++ }
            matches === 0 && data.push(ssd)
        }

        return  res.json(data)
        
    } catch (err) {
        console.log(err);
        next(err)
    }
}

exports.getCamionLastPositionFromPOI = async (req, res, next) => {
    let id =req.params.id
    let identity =req.identite
    // if(req.body.id){
    //     id= req.body.id
    //     identity = req.body.type
        
    // }else{
    //     id = req.params.id ;
    //     identity = req.identite
    // }
    // identity='JNP'
    console.log("je suis llllllllllll", identity ," jjj " ,id);
    
    if(!id){return res.status(400).json({message: 'Parametre manquant'})}

    try {
        let sst = await gValidSST(identity);
        // let sst = (identity == "JNP" ? await CustomSSatToken.findOne({where:{ type: "JNP" }}) : await CustomSSatToken.findOne({where:{ type: null },order: [['createdAt', 'ASC']],limit: 1}));
        // let ssts = await SSatToken.findAll()
        if(sst === null){return res.status(500).json({message: 'Erreur réseau ou serveur SST'})}
        
        // console.log(sst);

        const camion = await Camion.findByPk(id)
        if(camion === null){return res.status(404).json({message: 'Camion introuvable'})}

        const response = await fetch('https://fleet.securysat.com/json/getVehicles', {
            method: 'post',
            body: JSON.stringify({
                "sessionId": sst,
                "vehicleIds": [parseInt(camion.ssat_id)]
            }),
            headers: {'Content-Type': 'application/json'}
        });
//         const ssatData = {
//   "vehicles": [
//     {
//       "id": 4451,
//       "satId": 352592574666327,
//       "serialId": "352592574666327",
//       "status": 5,
//       "position": {
//         "id": 164159644,
//         "latitude": 9.702544125888863,
//         "longitude": 1.6491635338171795
//       },
//       "address": {
//         "street": "RNIE 2",
//         "streetNumber": "",
//         "zipCode": "",
//         "locality": null,
//         "city": "Tangbo",
//         "country": "BJ",
//         "poiName": "[SOMAYAF BENIN SA  AKASSATO]",
//         "addressRegion": null,
//         "poiAndReplaceAddress": 1,
//         "isPoi": true,
//         "replacePoiByAddress": false,
//         "poiId": 1832
//       },
      
//     }
//   ],
//   "incremental": null
// }
        const ssatData = await response.json();
// console.log('====================================');
// console.log(ssatData);
// console.log('====================================');
        return res.json(ssatData);
        
    } catch (err) {
        console.log(err);
        next(err)
    }
}
exports.depotGetCamionLastPositionFromPOI = async (req, res, next) => {
    let id= req.body.id
    let identity = req.body.type
    // if(req.body.id){
    //     id= req.body.id
    //     identity = req.body.type
        
    // }else{
    //     id = req.params.id ;
    //     identity = req.identite
    // }
    // identity='JNP'
    console.log("je suis llllllllllll",req.body.type  ," jjj " ,id);
    
    if(!id){return res.status(400).json({message: 'Parametre manquant'})}

    try {
        let sst = await gValidSST(identity);
        // let sst = (identity == "JNP" ? await CustomSSatToken.findOne({where:{ type: "JNP" }}) : await CustomSSatToken.findOne({where:{ type: null },order: [['createdAt', 'ASC']],limit: 1}));
        // let ssts = await SSatToken.findAll()
        if(sst === null){return res.status(500).json({message: 'Erreur réseau ou serveur SST'})}
        
        // console.log(sst);

        const camion = await Camion.findByPk(id)
        if(camion === null){return res.status(404).json({message: 'Camion introuvable'})}

        const response = await fetch('https://fleet.securysat.com/json/getVehicles', {
            method: 'post',
            body: JSON.stringify({
                "sessionId": sst,
                "vehicleIds": [parseInt(camion.ssat_id)]
            }),
            headers: {'Content-Type': 'application/json'}
        });
//         const ssatData = {
//   "vehicles": [
//     {
//       "id": 4451,
//       "satId": 352592574666327,
//       "serialId": "352592574666327",
//       "status": 5,
//       "position": {
//         "id": 164159644,
//         "latitude": 9.702544125888863,
//         "longitude": 1.6491635338171795
//       },
//       "address": {
//         "street": "RNIE 2",
//         "streetNumber": "",
//         "zipCode": "",
//         "locality": null,
//         "city": "Tangbo",
//         "country": "BJ",
//         "poiName": "[SOMAYAF BENIN SA  AKASSATO]",
//         "addressRegion": null,
//         "poiAndReplaceAddress": 1,
//         "isPoi": true,
//         "replacePoiByAddress": false,
//         "poiId": 1832
//       },
      
//     }
//   ],
//   "incremental": null
// }
        const ssatData = await response.json();
// console.log('====================================');
// console.log(ssatData);
// console.log('====================================');
        return res.json(ssatData);
        
    } catch (err) {
        console.log(err);
        next(err)
    }
}

exports.getAll = async (req, res, next) => {
    // console.log(req);
    let trId = parseInt(req.params.id)

    try {

        let list = [];
        let camions = []
        const user = await userCtrl.getUsefulUserData(req.reqUserId)

        if(trId){
            camions = await Camion.findAll({where: {transporteur_id: trId, isactive: true}, paranoid: false, order:[ ['createdAt','desc'] ]});
        }
        else{
            camions = await Camion.findAll({paranoid: false, order:[ ['createdAt','desc'] ]});
        }

        for (let i = 0; i < camions.length; i++) {

            let camion = camions[i]

            list.push(
                {
                    id: camion.id,
                    ssat_id: camion.ssat_id,
                    imat: camion.imat,
                    nbrVanne: camion.nbrVanne,
                    vannes: await Compartiment.findAll({where: {camion_id: camion.id}}),
                    annee: camion.annee,
                    type: camion.type,
                    isactive:camion.isactive,
                    marque: camion.marque,
                    cb: await CertificatDeBaremage.findOne({where: {camion_id: camion.id}, paranoid: true}),
                    vt: await VisiteTechnique.findOne({where: {camion_id: camion.id}, paranoid: true}),
                    slp: await Slp.findOne({where: {camion_id: camion.id}, paranoid: true}),
                    insurance: await Insurance.findOne({where: {camion_id: camion.id}, paranoid: true}),
                    transporteur: await Transporteur.findByPk(camion.transporteur_id),
                    filling_level: camion.filling_level,
                    capacity: camion.capacity,
                    isactive: camion.isactive,
                    is_busy: camion.is_busy,
                    createdBy: await userCtrl.getUsefulUserData(camion.createdBy),
                    updatedBy: await userCtrl.getUsefulUserData(camion.updatedBy),
                    deletedBy: camion.deletedBy,
                    restoredBy: camion.restoredBy,
                    createdAt: camion.createdAt,
                    updatedAt: camion.updatedAt,
                    deletedAt: camion.deletedAt,
                    suspensionComment: camion.suspensionComment
                }
            )
        }
        // console.log(list);
        return res.json({data: list,nbr:list.length})

    } catch (err) {
        // console.log(err)
        res.status(500).json({message: "Une erreur s'est produite veuillez réessayer"})
    }
}
exports.getPerImmatriculation = async (req, res, next) => {
    // console.log(req);
    let trId = parseInt(req.params.id)
    let immatriculation = req.params.imat

    try {

        let list = [];
        let camions = []
        const user = await userCtrl.getUsefulUserData(req.reqUserId)

        if(trId){
            camions = await Camion.findAll({where: {transporteur_id: trId, isactive: true}, paranoid: false, order:[ ['createdAt','desc'] ]});
        }
        else{
            camions = await Camion.findAll({
                paranoid: false, 
                order:[ ['createdAt','desc'] ],
                where: {
                    imat:{
                        [Op.like]:`%${immatriculation}%`
                    }
                }

            });
        }

        for (let i = 0; i < camions.length; i++) {

            let camion = camions[i]

            list.push(
                {
                    id: camion.id,
                    ssat_id: camion.ssat_id,
                    imat: camion.imat,
                    nbrVanne: camion.nbrVanne,
                    vannes: await Compartiment.findAll({where: {camion_id: camion.id}}),
                    annee: camion.annee,
                    type: camion.type,
                    isactive:camion.isactive,
                    marque: camion.marque,
                    cb: await CertificatDeBaremage.findOne({where: {camion_id: camion.id}, paranoid: true}),
                    vt: await VisiteTechnique.findOne({where: {camion_id: camion.id}, paranoid: true}),
                    slp: await Slp.findOne({where: {camion_id: camion.id}, paranoid: true}),
                    insurance: await Insurance.findOne({where: {camion_id: camion.id}, paranoid: true}),
                    transporteur: await Transporteur.findByPk(camion.transporteur_id),
                    filling_level: camion.filling_level,
                    capacity: camion.capacity,
                    isactive: camion.isactive,
                    is_busy: camion.is_busy,
                    createdBy: await userCtrl.getUsefulUserData(camion.createdBy),
                    updatedBy: await userCtrl.getUsefulUserData(camion.updatedBy),
                    deletedBy: camion.deletedBy,
                    restoredBy: camion.restoredBy,
                    createdAt: camion.createdAt,
                    updatedAt: camion.updatedAt,
                    deletedAt: camion.deletedAt,
                    suspensionComment: camion.suspensionComment
                }
            )
        }
        // console.log(list);
        return res.json({data: list,nbr:list.length})

    } catch (err) {
        // console.log(err)
        res.status(500).json({message: "Une erreur s'est produite veuillez réessayer"})
    }
}

exports.getAllinactive = async (req, res, next) => {
    // console.log(req);
    let trId = parseInt(req.params.id)

    try {

        let list = [];
        let camions = []
        const user = await userCtrl.getUsefulUserData(req.reqUserId)

        if(trId){
            camions = await Camion.findAll({where: {transporteur_id: trId, isactive: false}, paranoid: false, order:[ ['createdAt','desc'] ]});
        }
        else{
            camions = await Camion.findAll({where: {isactive: false},paranoid: false, order:[ ['createdAt','desc'] ]});
        }

        for (let i = 0; i < camions.length; i++) {

            let camion = camions[i]

            list.push(
                {
                    id: camion.id,
                    ssat_id: camion.ssat_id,
                    imat: camion.imat,
                    nbrVanne: camion.nbrVanne,
                    vannes: await Compartiment.findAll({where: {camion_id: camion.id}}),
                    annee: camion.annee,
                    type: camion.type,
                    isactive:camion.isactive,
                    marque: camion.marque,
                    cb: await CertificatDeBaremage.findOne({where: {camion_id: camion.id}, paranoid: true}),
                    vt: await VisiteTechnique.findOne({where: {camion_id: camion.id}, paranoid: true}),
                    slp: await Slp.findOne({where: {camion_id: camion.id}, paranoid: true}),
                    insurance: await Insurance.findOne({where: {camion_id: camion.id}, paranoid: true}),
                    transporteur: await Transporteur.findByPk(camion.transporteur_id),
                    filling_level: camion.filling_level,
                    capacity: camion.capacity,
                    is_busy: camion.is_busy,
                    isactive: camion.isactive,
                    createdBy: await userCtrl.getUsefulUserData(camion.createdBy),
                    updatedBy: await userCtrl.getUsefulUserData(camion.updatedBy),
                    deletedBy: camion.deletedBy,
                    restoredBy: camion.restoredBy,
                    createdAt: camion.createdAt,
                    updatedAt: camion.updatedAt,
                    deletedAt: camion.deletedAt,
                    suspensionComment: camion.suspensionComment
                }
            )
        }
        // console.log(list);
        return res.json({data: list})

    } catch (err) {
        // console.log(err)
        res.status(500).json({message: "Une erreur s'est produite veuillez réessayer"})
    }
}
exports.getAllActive = async (req, res, next) => {
    // console.log(req);
    let trId = parseInt(req.params.id)

    try {

        let list = [];
        let camions = []
        const user = await userCtrl.getUsefulUserData(req.reqUserId)

        if(trId){
            camions = await Camion.findAll({where: {transporteur_id: trId, isactive: true}, paranoid: false, order:[ ['createdAt','desc'] ]});
        }
        else{
            camions = await Camion.findAll({where: {isactive: true},paranoid: false, order:[ ['createdAt','desc'] ]});
        }

        for (let i = 0; i < camions.length; i++) {

            let camion = camions[i]

            list.push(
                {
                    id: camion.id,
                    ssat_id: camion.ssat_id,
                    imat: camion.imat,
                    nbrVanne: camion.nbrVanne,
                    vannes: await Compartiment.findAll({where: {camion_id: camion.id}}),
                    annee: camion.annee,
                    type: camion.type,
                    isactive:camion.isactive,
                    marque: camion.marque,
                    cb: await CertificatDeBaremage.findOne({where: {camion_id: camion.id}, paranoid: true}),
                    vt: await VisiteTechnique.findOne({where: {camion_id: camion.id}, paranoid: true}),
                    slp: await Slp.findOne({where: {camion_id: camion.id}, paranoid: true}),
                    insurance: await Insurance.findOne({where: {camion_id: camion.id}, paranoid: true}),
                    transporteur: await Transporteur.findByPk(camion.transporteur_id),
                    filling_level: camion.filling_level,
                    capacity: camion.capacity,
                    is_busy: camion.is_busy,
                    isactive: camion.isactive,
                    createdBy: await userCtrl.getUsefulUserData(camion.createdBy),
                    updatedBy: await userCtrl.getUsefulUserData(camion.updatedBy),
                    deletedBy: camion.deletedBy,
                    restoredBy: camion.restoredBy,
                    createdAt: camion.createdAt,
                    updatedAt: camion.updatedAt,
                    deletedAt: camion.deletedAt,
                    suspensionComment: camion.suspensionComment
                }
            )
        }
        // console.log(list);
        return res.json({data: list})

    } catch (err) {
        // console.log(err)
        res.status(500).json({message: "Une erreur s'est produite veuillez réessayer"})
    }
}

exports.gNotFullByMarketer = async (req, res, next) => {

    let trId = parseInt(req.params.id)
    if(!trId){return res.status(400).json({message: 'Parametre(s) manquant(s)'})}

    try {
        let list = [];
        let camions = await Camion.findAll({where: {transporteur_id: trId, isactive: true}, paranoid: false, order:[ ['createdAt','desc'] ]})

        for (const camion of camions) {
            if (camion.capacity !== camion.filling_level) {
                list.push(
                    {
                        id: camion.id,
                        ssat_id: camion.ssat_id,
                        imat: camion.imat,
                        nbrVanne: camion.nbrVanne,
                        vannes: await Compartiment.findAll({where: {camion_id: camion.id}}),
                        annee: camion.annee,
                        type: camion.type,
                        isactive:camion.isactive,
                        marque: camion.marque,
                        cb: await CertificatDeBaremage.findOne({where: {camion_id: camion.id}, paranoid: true}),
                        vt: await VisiteTechnique.findOne({where: {camion_id: camion.id}, paranoid: true}),
                        slp: await Slp.findOne({where: {camion_id: camion.id}, paranoid: true}),
                        insurance: await Insurance.findOne({where: {camion_id: camion.id}, paranoid: true}),
                        transporteur: await Transporteur.findByPk(camion.transporteur_id),
                        filling_level: camion.filling_level,
                        capacity: camion.capacity,
                        is_busy: camion.is_busy,
                        createdBy: await userCtrl.getUsefulUserData(camion.createdBy),
                        updatedBy: await userCtrl.getUsefulUserData(camion.updatedBy),
                        deletedBy: camion.deletedBy,
                        restoredBy: camion.restoredBy,
                        createdAt: camion.createdAt,
                        updatedAt: camion.updatedAt,
                        deletedAt: camion.deletedAt,
                        suspensionComment: camion.suspensionComment
                    }
                )
            }
        }

        // console.log(list);
        return res.json({data: list})

    } catch (err) {
        // console.log(err)
        res.status(500).json({message: "Une erreur s'est produite veuillez réessayer"})
    }
}

exports.gNotFullInactiveByMarketer = async (req, res, next) => {

    let trId = parseInt(req.params.id)
    if(!trId){return res.status(400).json({message: 'Parametre(s) manquant(s)'})}

    try {
        let list = [];
        let camions = await Camion.findAll({where: {transporteur_id: trId, isactive: false}, paranoid: false, order:[ ['createdAt','desc'] ]})

        for (const camion of camions) {
            if (camion.capacity !== camion.filling_level) {
                list.push(
                    {
                        id: camion.id,
                        ssat_id: camion.ssat_id,
                        imat: camion.imat,
                        nbrVanne: camion.nbrVanne,
                        vannes: await Compartiment.findAll({where: {camion_id: camion.id}}),
                        annee: camion.annee,
                        type: camion.type,
                        isactive:camion.isactive,
                        marque: camion.marque,
                        cb: await CertificatDeBaremage.findOne({where: {camion_id: camion.id}, paranoid: true}),
                        vt: await VisiteTechnique.findOne({where: {camion_id: camion.id}, paranoid: true}),
                        slp: await Slp.findOne({where: {camion_id: camion.id}, paranoid: true}),
                        insurance: await Insurance.findOne({where: {camion_id: camion.id}, paranoid: true}),
                        transporteur: await Transporteur.findByPk(camion.transporteur_id),
                        filling_level: camion.filling_level,
                        capacity: camion.capacity,
                        is_busy: camion.is_busy,
                        createdBy: await userCtrl.getUsefulUserData(camion.createdBy),
                        updatedBy: await userCtrl.getUsefulUserData(camion.updatedBy),
                        deletedBy: camion.deletedBy,
                        restoredBy: camion.restoredBy,
                        createdAt: camion.createdAt,
                        updatedAt: camion.updatedAt,
                        deletedAt: camion.deletedAt,
                        suspensionComment: camion.suspensionComment
                    }
                )
            }
        }

        // console.log(list);
        return res.json({data: list})

    } catch (err) {
        // console.log(err)
        res.status(500).json({message: "Une erreur s'est produite veuillez réessayer"})
    }
}

exports.get = async (req, res, next) => {
    let id = parseInt(req.params.id)

    // console.log('Tried to get camion ',id);

    //VALIDATION DES DONNEES RECUES
    if(!id){
        return res.status(400).json({ message: 'Parametre(s) manquant(s)' })
    }

    try {
        //RECUPERATION
        let camion = await Camion.findByPk(id, {paranoid: false})
        if(camion === null){
            return res.status(404).json({message: 'Camion introuvable ou désactivé'})
        }
        // if(camion.isactive === false){
        //     return res.status(404).json({message: 'Ce camion n\'est pas encore activé'})
        // }

        let transporteur = await Transporteur.findByPk(camion.transporteur_id)
        let creator = await userCtrl.getUsefulUserData(camion.createdBy)
        let updator = await userCtrl.getUsefulUserData(camion.updatedBy)

        //ENVOI
        return res.json({data: {
            id: camion.id, 
            imat: camion.imat,
            ssat_id: camion.ssat_id,
            nbrVanne: camion.nbrVanne,
            vannes: await Compartiment.findAll({where: {camion_id: camion.id}}),
            annee: camion.annee,
            type: camion.type,
            isactive:camion.isactive,
            marque: camion.marque,
            cb: await CertificatDeBaremage.findOne({where: {camion_id: camion.id}, paranoid: true}),
            vt: await VisiteTechnique.findOne({where: {camion_id: camion.id}, paranoid: true}),
            slp: await Slp.findOne({where: {camion_id: camion.id}, paranoid: true}),
            insurance: await Insurance.findOne({where: {camion_id: camion.id}, paranoid: true}),
            transporteur: transporteur,
            filling_level: camion.filling_level,
            capacity: camion.capacity,
            is_busy: camion.is_busy,
            createdBy: await userCtrl.getUsefulUserData(camion.createdBy),
            updatedBy: await userCtrl.getUsefulUserData(camion.updatedBy),
            deletedBy: camion.deletedBy,
            restoredBy: camion.restoredBy,
            createdAt: camion.createdAt,
            updatedAt: camion.updatedAt,
            deletedAt: camion.deletedAt,
            suspensionComment: camion.suspensionComment
        }})

    } catch (err) {
        console.log(err);
        res.status(500).json({message: "Une erreur s'est produite veuillez réessayer"})
    }
}
exports.getInactive = async (req, res, next) => {
    let id = parseInt(req.params.id)

    // console.log('Tried to get camion ',id);

    //VALIDATION DES DONNEES RECUES
    if(!id){
        return res.status(400).json({ message: 'Parametre(s) manquant(s)' })
    }

    try {
        //RECUPERATION
        let camion = await Camion.findByPk(id, {paranoid: false})
        if(camion === null){
            return res.status(404).json({message: 'Camion introuvable ou désactivé'})
        }
        if(camion.isactive === true){
            return res.status(404).json({message: 'Camion ce camion est activé'})
        }

        let transporteur = await Transporteur.findByPk(camion.transporteur_id)
        let creator = await userCtrl.getUsefulUserData(camion.createdBy)
        let updator = await userCtrl.getUsefulUserData(camion.updatedBy)

        //ENVOI
        return res.json({data: {
            id: camion.id, 
            imat: camion.imat,
            ssat_id: camion.ssat_id,
            nbrVanne: camion.nbrVanne,
            vannes: await Compartiment.findAll({where: {camion_id: camion.id}}),
            annee: camion.annee,
            type: camion.type,
            marque: camion.marque,
            cb: await CertificatDeBaremage.findOne({where: {camion_id: camion.id}, paranoid: false}),
            vt: await VisiteTechnique.findOne({where: {camion_id: camion.id}, paranoid: false}),
            slp: await Slp.findOne({where: {camion_id: camion.id}, paranoid: false}),
            insurance: await Insurance.findOne({where: {camion_id: camion.id}, paranoid: false}),
            transporteur: transporteur,
            filling_level: camion.filling_level,
            capacity: camion.capacity,
            is_busy: camion.is_busy,
            createdBy: await userCtrl.getUsefulUserData(camion.createdBy),
            updatedBy: await userCtrl.getUsefulUserData(camion.updatedBy),
            deletedBy: camion.deletedBy,
            restoredBy: camion.restoredBy,
            createdAt: camion.createdAt,
            updatedAt: camion.updatedAt,
            deletedAt: camion.deletedAt,
            suspensionComment: camion.suspensionComment
        }})

    } catch (err) {
        console.log(err);
        res.status(500).json({message: "Une erreur s'est produite veuillez réessayer"})
    }
}
// getBLsByStatuses
exports.getCamionbyBlstatus = async (req, res, next) =>{
    let statues = req.params.statuses
    console.log(statues);
    console.log(typeof(statues));
    const isArray = Array.isArray(statues);
    const user = await userCtrl.getUsefulUserData(req.reqUserId)
    // console.log(user);
    console.log("------> dépot id",user.dataValues.depot_id);
    // console.log('Tried to get camion ',id);
    // req.reqUserId

    //VALIDATION DES DONNEES RECUES
    if(!statues){
        return res.status(400).json({ message: 'Parametre status manquant' })
    }

    try {
        let CAMIONS = []
        //RECUPERATION
        bls = await BonLivraison.findAll({where: {statut: "Bon à Charger"}, paranoid: false});
        for(const bl of bls){
            CAMIONS.push(await Camion.findOne({ where: { id: bl.camion_id }}, {paranoid: false}))
        }
        return res.json({data: CAMIONS})
    } catch (error) {
        
    }
}
exports.add = async (req, res, next) => {
    const ssat_id = parseInt(req.body.ssat_id)
    const imat = xss(req.body.imat)
    const nbrVanne = parseInt(req.body.nbrVanne)
    const annee = parseInt(req.body.annee)
    const type = xss(req.body.type)
    const marque = xss(req.body.marque)
    const transporteur_id  = parseInt(req.body.transporteur_id)
    const compartiments = req.body.compartiments
    const cb = req.body.cb
    const vt = req.body.vt
    const slp = req.body.slp
    const insurance = req.body.insurance
    const suffix = Date.now();

    console.log("new camion");

    // console.log('--- compartiments ---',req.body.compartiments);
    console.log('--- Adding camion ---',req.body);

    if(!ssat_id || !imat || !nbrVanne || !annee || !type || !marque || !transporteur_id || !compartiments || compartiments.length < 1)
    {console.log('Veuillez renseigner tous les champs'); return res.status(400).json({ message: 'Veuillez renseigner tous les champs' })}
    else if (!cb.date_debut || !cb.date_fin || !cb.doc){console.log('Veuillez renseigner tous les champs dans le certificat de baremage'); return res.status(400).json({ message: 'Veuillez renseigner tous les champs dans le certificat de baremage' })}
    else if (!vt.date_debut || !vt.date_fin || !vt.doc){console.log('Veuillez renseigner tous les champs dans la visite technique'); return res.status(400).json({ message: 'Veuillez renseigner tous les champs dans la visite technique' })}
    else if (!slp.date_debut || !slp.date_fin || !slp.doc){console.log('Veuillez renseigner tous les champs dans le slp'); return res.status(400).json({ message: 'Veuillez renseigner tous les champs dans le slp' })}
    else if (!insurance.date_debut || !insurance.date_fin || !insurance.doc){console.log('Veuillez renseigner tous les champs pour l\'assurance'); return res.status(400).json({ message: 'Veuillez renseigner tous les champs pour l\'assurance' })}

    try {
        const camionCheck = await Camion.findOne({where: {imat: imat}})
        if (camionCheck !== null) {console.log(`${imat} est déjà enregistré`); return res.status(409).json({message: `${imat} est déjà enregistré`})}

        //CREATION
        let camion = await Camion.create({
            ssat_id: ssat_id,
            imat: imat,
            nbrVanne: nbrVanne,
            annee: annee,
            isactive :false,
            type: type,
            marque: marque,
            transporteur_id: transporteur_id,
            createdBy: req.reqUserId,
            updatedBy: req.reqUserId
        })

        const CbBuffer = Buffer.from(req.body.cb.doc, 'base64')
        const VtBuffer = Buffer.from(req.body.vt.doc, 'base64')
        const SlpBuffer = Buffer.from(req.body.slp.doc, 'base64')
        const InsuranceBuffer =Buffer.from(req.body.insurance.doc, 'base64')

        const CbName = '/public/uploads/camion'+camion.id+suffix+'cb.pdf'
        const VtName = '/public/uploads/camion'+camion.id+suffix+'vt.pdf'
        const SlpName = '/public/uploads/camion'+camion.id+suffix+'slp.pdf'
        const InsuranceName = '/public/uploads/camion'+camion.id+suffix+'insurance.pdf'



        fs.writeFileSync(directory+CbName, CbBuffer);
        fs.writeFileSync(directory+VtName, VtBuffer);
        fs.writeFileSync(directory+SlpName, SlpBuffer);
        fs.writeFileSync(directory+InsuranceName, InsuranceBuffer);
        let capacity = 0;

        for (const compartiment of compartiments) {
            
            await Compartiment.create({
                camion_id: camion.id,
                numero: compartiment.numero,
                capacite: parseInt(compartiment.capacite),
                createdBy: req.reqUserId,
                updatedBy: req.reqUserId
            })

            capacity = capacity + parseInt(compartiment.capacite)

        }
        
        await Camion.update({capacity: capacity}, {where: {id: camion.id}})

        await CertificatDeBaremage.create({
            camion_id: camion.id,
            document: CbName,
            date_debut: cb.date_debut,
            date_fin: cb.date_fin,
            createdBy: req.reqUserId,
            updatedBy: req.reqUserId
        })

        await VisiteTechnique.create({
            camion_id: camion.id,
            document: VtName,
            date_debut: vt.date_debut,
            date_fin: vt.date_fin,
            createdBy: req.reqUserId,
            updatedBy: req.reqUserId
        })

        await Slp.create({
            camion_id: camion.id,
            document: SlpName,
            date_debut: slp.date_debut,
            date_fin: slp.date_fin,
            createdBy: req.reqUserId,
            updatedBy: req.reqUserId
        })
//insurance stop here
        await Insurance.create({
            camion_id: camion.id,
            document: InsuranceName,
            date_debut: insurance.date_debut,
            date_fin: insurance.date_fin,
            createdBy: req.reqUserId,
            updatedBy: req.reqUserId
        })

        //NOTIF TO ALL MIC 

        // const user = await User.findByPk(req.reqUserId, {paranoid: false})
        // const transporteur = await Transporteur.findByPk(transporteur_id, {paranoid: false})
        
        //mailerCtrl.mailAllUsersOfAType('MIC', `Le camion ${imat} a bien été ajouté`, `Le ${user.type} ${user.name}, a ajouté le camion d'immatriculation N° ${imat} au nom de la structure de transport ${transporteur.nom}.`)
        //notifCtrl.notifyAllUsersOfAType('MIC', `Le camion ${imat} a bien été ajouté`, `Le ${user.type} ${user.name}, a ajouté le camion d'immatriculation N° ${imat} au nom de la structure de transport ${transporteur.nom}.`)

        
        //NOTIF TO CREATOR
        // if(user.type !== 'MIC'){
        //     mailerCtrl.mailSingle(req.reqUserId, `Le camion ${imat} a bien été ajouté`, `Vous avez ajouté le camion d'immatriculation N° ${imat} au nom de la structure de transport ${transporteur.nom}.`)
        //     notifCtrl.notifySingle(req.reqUserId, `Le camion ${imat} a bien été ajouté`, `Vous avez ajouté le camion d'immatriculation N° ${imat} au nom de la structure de transport ${transporteur.nom}.`)
        // }

        //ENVOI
        return res.json({message: 'Le Camion et ses compartiments ont bien été ajoutés'})

    } catch (err) {
        console.log(err)
        res.status(500).json({message: "Une erreur s'est produite veuillez réessayer"})
    }
}


exports.update = async (req, res, next) => {
    
    let id = parseInt(req.params.id)
    const suffix = Date.now();
    const updatedBy = parseInt(req.reqUserId)

    const compartiments = req.body.compartiments
    const cb = req.body.cb
    const vt = req.body.vt
    const slp = req.body.slp
    const insurance = req.body.insurance

    //VALIDATION DES DONNEES RECUES
    if(req.body.isactive===false || req.body.isactive===null){

        if(!id || !compartiments){
            return res.status(400).json({ message: 'Parametre(s) ou donnée(s) manquant(s)' })
        }
    }

    try {
        //RECUPERATION
        let camion = await Camion.findByPk(id)       
        if(camion === null){
            return res.status(404).json({message: 'Camion introuvable'})
        }

        //MISE A JOUR
        await Camion.update(req.body, {where: {id: id}})
        await Camion.update({updatedBy: req.reqUserId}, {where: {id: id}})

        if(req.body.compartiments){
            await Compartiment.destroy({where: {camion_id: camion.id,deletedAt:null}})

            let capacity = 0;

            for (const compartiment of compartiments) {
                
                await Compartiment.create({
                    camion_id: camion.id,
                    numero: xss(compartiment.numero),
                    capacite: parseInt(compartiment.capacite),
                    createdBy: req.reqUserId,
                    updatedBy: req.reqUserId
                })
    
                capacity = parseInt(capacity) + parseInt(compartiment.capacite)
    
            }
    // console.log("capacité");
    // console.log("capacité", capacity);
            await Camion.update({capacity: capacity}, {where: {id: id}})

        }

        
        const directory = process.env.SERVER_DIR        
        
        if(req.body.cb){
            const CbBuffer = Buffer.from(req.body.cb.doc, 'base64')
            const CbName = '/public/uploads/camion'+id+'_'+suffix+'cb.pdf'
            fs.writeFileSync(directory+CbName, CbBuffer);

            await CertificatDeBaremage.destroy({where: {camion_id: id}})

            await CertificatDeBaremage.create({
                camion_id: id,
                document: CbName,
                date_debut: cb.date_debut,
                date_fin: cb.date_fin,
                createdBy: req.reqUserId,
                updatedBy: req.reqUserId
            })

        }
        
        if(req.body.vt){
            const VtBuffer = Buffer.from(req.body.vt.doc, 'base64')
            const VtName = '/public/uploads/camion'+id+'_'+suffix+'vt.pdf'
            fs.writeFileSync(directory+VtName, VtBuffer);

            await VisiteTechnique.destroy({where: {camion_id: id},})

            await VisiteTechnique.create({
                camion_id: id,
                document: VtName,
                date_debut: vt.date_debut,
                date_fin: vt.date_fin,
                createdBy: req.reqUserId,
                updatedBy: req.reqUserId
            })

        }
        
        if(req.body.slp){

            const SlpBuffer = Buffer.from(req.body.slp.doc, 'base64')
            const SlpName = '/public/uploads/camion'+id+'_'+suffix+'slp.pdf'
             fs.writeFileSync(directory+SlpName, SlpBuffer);

            await Slp.destroy({where: {camion_id: id}})

            await Slp.create({
                camion_id: id,
                document: SlpName,
                date_debut: slp.date_debut,
                date_fin: slp.date_fin,
                createdBy: req.reqUserId,
                updatedBy: req.reqUserId
            })

        }


        
        if(req.body.insurance){
            const InsuranceBuffer = Buffer.from(req.body.insurance.doc, 'base64')
            const InsuranceName = '/public/uploads/camion'+id+'_'+suffix+'insurance.pdf'
            fs.writeFileSync(directory+InsuranceName, InsuranceBuffer);

            await Insurance.destroy({where: {camion_id: id}})

            await Insurance.create({
                camion_id: id,
                document: InsuranceName,
                date_debut: insurance.date_debut,
                date_fin: insurance.date_fin,
                createdBy: req.reqUserId,
                updatedBy: req.reqUserId
            })
        }
        return res.json({message: 'Le camion a bien été mis à jour'})

    } catch (err) {
        console.log(err)
        res.status(500).json({message: "Une erreur s'est produite veuillez réessayer"})
    }
}

exports.activate = async (req, res, next) => {
    let id = parseInt(req.params.id)

    //VALIDATION DES DONNEES RECUES
    if(!id){
        return res.status(400).json({ message: 'paramètre invalide ou manquant(s)' })
    }

    try {
        //RECUPERATION
        let camion = await Camion.findByPk(id)       
        if(camion === null){
            return res.status(404).json({message: 'Camion introuvable ou désactivé'})
        }

        //MISE A JOUR
        await Camion.update({isactive: true}, {where: {id: id}})
        await Camion.update({updatedBy: req.reqUserId}, {where: {id: id}})
        return res.json({message: 'Le camion a bien été activé'})
        
    } catch (err) {
        // console.log(err)
        res.status(500).json({message: "Une erreur s'est produite veuillez réessayer"})
    }
}



exports.trash = async (req, res, next) => {
    let id = parseInt(req.params.id)
    const suspensionComment = xss(req.body.suspensionComment)
    console.log("====>",id);
    console.log("====>",suspensionComment);

    //VALIDATION DES DONNEES RECUES
    if(!id || !suspensionComment){
        return res.status(400).json({ message: 'Parametre(s) ou donnée(s) manquant(s)' })
    }

    try {
        const camion = await Camion.findByPk(id)
        if(camion === null){return res.status(404).json({message: 'Donnée introubable'})}

        await Camion.update({deletedBy: req.reqUserId, suspensionComment: suspensionComment, restoredBy: null}, {where: {id: id}})
        await Camion.destroy({where: {id: id}})
        await Compartiment.update({deletedBy: req.reqUserId, suspensionComment: suspensionComment, restoredBy: null}, {where: {camion_id: id}})
        await Compartiment.destroy({where: {camion_id: id}})

        return res.status(204).json({})
        
    } catch (err) {
        // console.log(err);
        next(err)
    }

}
exports.multiUnTrash = async (req, res, next) => {
    
    const listeId = req.body.ids
    if (!listeId || !Array.isArray(listeId)) { return res.status(400).json({ message: "Parametre(s) manquant(s)" }) }

    try {
        for(const id of listeId){
            const camion = await Camion.findByPk(id, { paranoid: false })
            if (camion === null) { return res.status(404).json({ message: 'Donnée introubable' }) }

            await Camion.restore({ where: { id: id } })
            await Camion.update({ deletedBy: null, suspensionComment: null, restoredBy: req.reqUserId,isactive:true }, { where: { id: id} })

            await Compartiment.restore({where: {camion_id: id}})
            await Compartiment.update({deletedBy: null, suspensionComment: null, restoredBy: req.reqUserId,isactive:true}, {where: {camion_id: id}})
        }
        

        return res.status(204).json({})

    } catch (err) {
        next(err)
    }

}
exports.untrash = async (req, res, next) => {
    let id = parseInt(req.params.id)

    //VALIDATION DES DONNEES RECUES
    if(!id){
        return res.status(400).json({ message: 'Parametre(s) manquant(s)' })
    }

    try {
        const camion = await Camion.findByPk(id, {paranoid: false})
        if(camion === null){return res.status(404).json({message: 'Donnée introubable'})}

        await Camion.restore({where: {id: id}})
        await Camion.update({deletedBy: null, suspensionComment: null, restoredBy: req.reqUserId}, {where: {id: id}})
        await Compartiment.restore({where: {camion_id: id}})
        await Compartiment.update({deletedBy: null, suspensionComment: null, restoredBy: req.reqUserId}, {where: {camion_id: id}})

        return res.status(204).json({})

    } catch (err) {
        // console.log(err);
        next(err)
    }

}

exports.delete = async (req, res, next) => {
    let id = parseInt(req.params.id)

    //VALIDATION DES DONNEES RECUES
    if(!id){
        return res.status(400).json({ message: 'Parametre(s) manquant(s)' })
    }

    try {
        const camion = await Camion.findByPk(id, {paranoid: false})
        if(camion === null){return res.status(404).json({message: 'Donnée introuvable'})}
        
        await Camion.destroy({where: {id: id}, force: true})

        return res.status(204).json({})

    } catch (err) {
        // console.log(err);
        next(err)
    }
}

exports.verifyCamionCharge = async (req, res, next) => {
    let id = parseInt(req.params.id)

    //VALIDATION DES DONNEES RECUES
    if(!id){
        return res.status(400).json({ message: 'Paramètre invalide ou manquant(s)' })
    }

    try {
        //RECUPERATION
        let camion = await Camion.findByPk(id)       
        if(camion === null){
            return res.status(404).json({message: 'Camion introuvable ou désactivé'})
        }
        //MISE A JOUR
        let camionData =  {
            id: camion.id,
            ssat_id: camion.ssat_id,
            imat: camion.imat,
            nbrVanne: camion.nbrVanne,
            vannes: await Compartiment.findAll({ where: { camion_id: camion.id } }),
            annee: camion.annee,
            type: camion.type,
            capacity: camion.capacity,
            marque: camion.marque,
            transporteur: await Transporteur.findByPk(camion.transporteur_id),
            createdBy: await userCtrl.getUsefulUserData(camion.createdBy),
            updatedBy: await userCtrl.getUsefulUserData(camion.updatedBy),
            deletedBy: camion.deletedBy,
            restoredBy: camion.restoredBy,
            createdAt: camion.createdAt,
            updatedAt: camion.updatedAt,
            deletedAt: camion.deletedAt,
            suspensionComment: camion.suspensionComment
        }
        let dls
        let list = []
        let bls = []
        const isAnyBusy = camionData.vannes.some(item => item.is_busy === 1);
        if(isAnyBusy===1){
            const blsCharge = await BonLivraison.findAll({where: {camion_id: id, statut:'Chargé'},paranoid: true })
        
            for (const bl of blsCharge) {

                let productList = []

                if (bl !== null) {
                    dls = await DetailsLivraison.findAll({ where: { bonlivraison_id: bl.id }, paranoid: false })

                    for (const dl of dls) {
                        productList.push({
                            id: parseInt(dl.id),
                            bonlivraison_id: parseInt(dl.bonlivraison_id),
                            produit: await Produit.findByPk(dl.produit_id),
                            qtte: parseInt(dl.qtte),
                            details: await DetailsLivraisonBarcode.findAll({ where: { detailslivraison_id: parseInt(dl.id) } }),
                            createdBy: await userCtrl.getUsefulUserData(dl.createdBy),
                            updatedBy: await userCtrl.getUsefulUserData(dl.updatedBy),
                            deletedBy: dl.deletedBy,
                            restoredBy: dl.restoredBy,
                            createdAt: dl.createdAt,
                            updatedAt: dl.updatedAt,
                            deletedAt: dl.deletedAt,
                            suspensionComment: dl.suspensionComment
                        })
                    }
                    

                    list.push({
                        id: bl.id,
                        numeroBL: bl.numeroBL,
                        date: bl.date,
                        station: await Station.findByPk(bl.station_id),
                        marketer: await Marketer.findByPk(bl.marketer_id),
                        transporteur: await Transporteur.findByPk(bl.transporteur_id),
                        depot: await Depot.findByPk(bl.depot_id),
                        produits: productList,
                        statut: bl.statut,
                        statYear: bl.statYear,
                        statMonth: bl.statMonth,
                        commentaire: bl.commentaire,
                        ftbl: bl.ftbl,
                        cbl_tp: bl.cbl_tp,
                        cbl_ttid: bl.cbl_ttid,
                        cbl_tdt: bl.cbl_tdt,
                        qty: bl.qty,
                        createdBy: await userCtrl.getUsefulUserData(bl.createdBy),
                        updatedBy: await userCtrl.getUsefulUserData(bl.updatedBy),
                        deletedBy: bl.deletedBy,
                        restoredBy: bl.restoredBy,
                        createdAt: bl.createdAt,
                        updatedAt: bl.updatedAt,
                        deletedAt: bl.deletedAt,
                        suspensionComment: bl.suspensionComment
                    })

                }

            }
        }
        return res.json({
            camion : camionData,
            data : list,
            nombre: list.length,

        })
        
    } catch (err) {
        console.log(err)
        res.status(500).json({message: "Une erreur s'est produite veuillez réessayer"})
    }
}























