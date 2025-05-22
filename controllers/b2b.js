/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const jwt = require('jsonwebtoken')
const { Op } = require("sequelize");
const xss = require("xss");

const {Ville,User,Station,Marketer,SSToken} = require('../models')
const userCtrl = require('./user')

var generator = require('generate-password');

const mailerCtrl = require('./_internal/mailer')
const notifCtrl = require('./notification')
const { fileSaver } = require('./_internal/filesaver');
const directory = process.env.SERVER_DIR
const path = require('path')
let fs = require('fs');
const { log } = require('console');
const customSymbols = '!#$&*+,.?@[\\]^_{|}~';

function generateRandomString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
// mod.cjs
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

function emailIsValid(email) {
    let re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}



/*****************************/
/*** GESTION DE LA RESSOURCE */
exports.getAll = async (req, res, next) => {

    const option = req.params.option;
    const id = req.params.id;

    try {

        let b2bList = [];
        let b2bs = [];

        if(req.reqUserType === 'Marketer'){
            const user = await userCtrl.getUsefulUserData(req.reqUserId)
            const data = await Station.findAll({where: [{marketer_id: user.marketer_id},{type:'B2B'}]})
            // const data = await Station.findAll({where: [{marketer_id: user.marketer_id},{isactive: true},{type:'B2B'}]})
            
            for(const el of data){el && b2bs.push(el)}

        }
        else{
            const user = await userCtrl.getUsefulUserData(req.reqUserId)
            b2bs = await Station.findAll({where: {type:'B2B'},paranoid: false, order:[ ['createdAt','desc'] ], groupBy: user.marketer_id});
        }
        // const uniqueArray = new Set(b2bs);
        // const b2bb = Array.from(uniqueArray);

        for (const el of b2bs) {
            if(el){
                // const stations = await Station.findByPk(el.id)
                b2bList.push(
                    {
                        id: el.id,
                        type: el.type,
                        poi_id: el.poi_id,
                        longitude: el.longitude,
                        latitude: el.latitude,
                        ifu: el.ifu,
                        rccm: el.rccm,
                        nom: el.nom,
                        document_ifu: el.document_ifu,
                        document_rccm: el.document_rccm,
                        ville: await Ville.findByPk(el.ville_id),
                        isactive: el.isactive,
                        adresse: el.adresse,
                        marketer: await Marketer.findByPk(el.marketer_id),
                        etat: el.etat,
                        createdBy: await userCtrl.getUsefulUserData(el.createdBy),
                        updatedBy: await userCtrl.getUsefulUserData(el.updatedBy),
                        createdAt: el.createdAt,
                        updatedAt: el.updatedAt,
                        deletedAt: el.deletedAt
                    }
                )
            }
        } 
        res.json({data: b2bList,nbr:b2bList.length})
    } catch (err) {
        console.log(err)
        next(err)
    }
}
exports.getAllInactive = async (req, res, next) => {

    const option = req.params.option;
    const id = req.params.id;

    try {

        let b2bList = [];
        let b2bs = [];

        if(req.reqUserType === 'Marketer'){
            const user = await userCtrl.getUsefulUserData(req.reqUserId)
            const data = await Station.findAll({where: [{marketer_id: user.marketer_id},{isactive: false},{type:'B2B'}]})
            
            for(const el of data){el && b2bs.push(el)}

        }
        else{
            const user = await userCtrl.getUsefulUserData(req.reqUserId)
            b2bs = await Station.findAll({where: [{type:'B2B'},{isactive: false}],paranoid: false, order:[ ['createdAt','desc'] ], groupBy: user.marketer_id});
        }
        const uniqueArray = new Set(b2bs);
        const b2bb = Array.from(uniqueArray);
        

        for (const el of b2bs) {
            if(el){
                const stations = await Station.findByPk(el.id)
                b2bList.push(
                    {
                        id: stations.id,
                        type: stations.type,
                        poi_id: stations.poi_id,
                        longitude: stations.longitude,
                        latitude: stations.latitude,
                        ifu: stations.ifu,
                        rccm: stations.rccm,
                        nom: stations.nom,
                        ville: await Ville.findByPk(stations.ville_id),
                        isactive: stations.isactive,
                        adresse: stations.adresse,
                        marketer: await Marketer.findByPk(stations.marketer_id),
                        etat: stations.etat,
                        createdBy: await userCtrl.getUsefulUserData(stations.createdBy),
                        updatedBy: await userCtrl.getUsefulUserData(stations.updatedBy),
                        createdAt: stations.createdAt,
                        updatedAt: stations.updatedAt,
                        deletedAt: stations.deletedAt
                    }
                )
                // b2bList.push(await Station.findByPk(el.id, {
                    
                //     include: [
                //         {model: Ville}
                //     ],
                //     marketer:await Marketer.findByPk(el.marketer_id),
                // }))
            }
        }  
        // const uniqueArray = new Set(b2bList);

// const result = Array.from(uniqueArray);
// console.log(result);
        res.json({data: b2bList})

    } catch (err) {
        console.log(err)
        next(err)
    }
    
}


exports.getOne = async (req, res, next) => {
    const id = xss(req.params.b2bId)
    // console.log(id);
        //VALIDATION DES DONNEES RECUES
    if( !id ){ return res.status(400).json({ message: 'Vous devez spécifier l\'identifiant du B2B concerné ' })}

        try {

        const b2bCheck = await Station.findOne({where: {[Op.and]:[{id:id},{type:'B2B'}]}});
        if(!b2bCheck){ return res.status(404).json({ message: `B2B introuvable ou désactivé` }) }
        const stations = await Station.findByPk(b2bCheck.id, )
        const b2bOne = {
            id: stations.id,
                    type: stations.type,
                    poi_id: stations.poi_id,
                    longitude: stations.longitude,
                    latitude: stations.latitude,
                    ifu: stations.ifu,
                    rccm: stations.rccm,
                    nom: stations.nom,
                    ville: await Ville.findByPk(stations.ville_id),
                    adresse: stations.adresse,
                    marketer: await Marketer.findByPk(stations.marketer_id),
                    etat: stations.etat,
                    createdBy: await userCtrl.getUsefulUserData(stations.createdBy),
                    updatedBy: await userCtrl.getUsefulUserData(stations.updatedBy),
                    createdAt: stations.createdAt,
                    updatedAt: stations.updatedAt,
                    deletedAt: stations.deletedAt
        }
        if(!b2bOne){ return res.status(404).json({ message: `B2B introuvable ou désactivé` }) }

       res.json({data: b2bOne})
        
    } catch (err) {
        console.log(err);
        next(err)
    }


    
}
exports.getOneInactive = async (req, res, next) => {
    const id = xss(req.params.b2bId)
    // console.log(id);
        //VALIDATION DES DONNEES RECUES
    if( !id ){ return res.status(400).json({ message: 'Vous devez spécifier l\'identifiant du B2B concerné ' })}

        try {

        const b2bCheck = await Station.findOne({where: {[Op.and]:[{id:id},{type:'B2B'}]}});
        if(!b2bCheck){ return res.status(404).json({ message: `B2B introuvable ou désactivé` }) }
        const stations = await Station.findByPk(b2bCheck.id, )
        const b2bOne = {
            id: stations.id,
                    type: stations.type,
                    poi_id: stations.poi_id,
                    longitude: stations.longitude,
                    latitude: stations.latitude,
                    ifu: stations.ifu,
                    rccm: stations.rccm,
                    nom: stations.nom,
                    ville: await Ville.findByPk(stations.ville_id),
                    adresse: stations.adresse,
                    marketer: await Marketer.findByPk(stations.marketer_id),
                    etat: stations.etat,
                    createdBy: await userCtrl.getUsefulUserData(stations.createdBy),
                    updatedBy: await userCtrl.getUsefulUserData(stations.updatedBy),
                    createdAt: stations.createdAt,
                    updatedAt: stations.updatedAt,
                    deletedAt: stations.deletedAt
        }
        if(!b2bOne){ return res.status(404).json({ message: `B2B introuvable ou désactivé` }) }

       res.json({data: b2bOne})
        
    } catch (err) {
        console.log(err);
        next(err)
    }


    
}

exports.add = async (req, res, next) => {
    const name = xss(req.body.name)
    const username = xss(req.body.username)
    const email = xss(req.body.email)
    const ifu = xss(req.body.ifu)
    const document_ifu = req.body.document_ifu
    const rccm = xss(req.body.rccm)
    const document_rccm = req.body.document_rccm
    const nom = xss(req.body.nom)
    const ville_id = parseInt(req.body.ville_id)
    const adresse = xss(req.body.adresse)
    const marketer_ids = req.body.marketer_ids

    // console.log(req.body)

    //VALIDATION DES DONNEES RECUES
    if( !ifu || !rccm || !nom || !ville_id || !adresse || !name || !username ){ return res.status(400).json({ message: 'Veuillez renseigner tous les champs' })}
    if( !email || !emailIsValid(email) ){ return res.status(400).json({ message: email+'n\'est pas un email valide' })}
   
    try {

        

        let userCheck = await User.findOne({where: {[Op.or]: [{email: email}, {username: username}]}})
        if(userCheck){ return res.status(409).json({ message: `${email} ou ${username} est déjà utilisé` }) }
        
        const villeCheck = await Ville.findByPk(ville_id);
        if(!villeCheck){ return res.status(404).json({ message: `Villes introuvable ou désactivée` }) }

        let stationCheckByIfuOrRCCM = await Station.findOne({where: {[Op.or]: [{ifu: ifu}, {rccm: rccm}]}})
        let stationCheckByName = await Station.findOne({where: {nom: nom}})
        if(stationCheckByIfuOrRCCM !== null){ return res.status(409).json({ message: `Ifu ou rccm déjà utilisé` }) }
        if(stationCheckByName !== null){ return res.status(409).json({ message: `Le nom ${nom} est déjà utilisé` }) }

        const RccmdocBuffer =Buffer.from(document_rccm, 'base64')
        const IfudocBuffer =Buffer.from(document_ifu, 'base64')
        const RccmdocName = fileSaver(document_rccm,generateRandomString(10),"rccm")
        const IfudocName = fileSaver(document_ifu,ifu,"ifu")
        fs.writeFileSync(directory+RccmdocName, RccmdocBuffer);
        fs.writeFileSync(directory+IfudocName, IfudocBuffer);
        //CREATION

        let newB2B = await Station.create({
            type: 'B2B',
            rccm: rccm,
            document_rccm: RccmdocName,
            ifu: ifu,
            document_ifu: IfudocName,
            nom: nom,
            ville_id: ville_id,
            marketer_id:marketer_ids,
            adresse: adresse,
            createdBy: req.reqUserId,
            updatedBy: req.reqUserId,
            isactive: 0
        })

        let generatedPass = generator.generate({lenght: 12, numbers: true,symbols: customSymbols,})

        let newUser = await User.create({
            name: name,
            username: username,
            email: email,
            password: generatedPass,
            type: 'B2B',
            role: 'User',
            marketer_id:marketer_ids,
            b2b_id: newB2B.id,
            adresse: adresse,
            station_id:null,
            depot_id:null,
            transporteur_id:null,
            createdBy: req.reqUserId,
            updatedBy: req.reqUserId
        })
        //SEND EMAIL
        console.log("before mail");
        mailerCtrl.sendAccountConfirmationEmail(newUser.name, newUser.username, newUser.email, generatedPass)

        //ENVOI
        console.log("After mail");
        return res.json({message: 'Le B2B a bien été ajouté et ses identifiants lui ont été envoyés'})
        
    } catch (err) {
        console.log("eeeeeeee",err);
        next(err)
    }
}

exports.update = async (req, res, next) => {
    const id = xss(req.params.b2bId)
    const ifu = xss(req.body.ifu)
    // const document_ifu = xss(req.body.document_ifu)
    const rccm = xss(req.body.rccm)
    // const document_rccm = xss(req.body.document_rccm)
    const nom = xss(req.body.nom)
    const ville_id = parseInt(req.body.ville_id)
    const adresse = xss(req.body.adresse)
    const marketer_ids = req.body.marketer_ids

    //VALIDATION DES DONNEES RECUES
    if( !id ){ return res.status(400).json({ message: 'Vous devez spécifier l\'identifiant du B2B concerné ' })}
    else if( !ifu && !rccm && !nom && !ville_id && !adresse && !marketer_ids ){ return res.status(400).json({ message: 'Vous devez spécifier les données à modifier' })}
    // else if( req.body.marketer_ids && !Array.isArray(marketer_ids) ){ return res.status(400).json({ message: 'Mauvais format de la liste des marketers' })}

    try {

        const b2bCheck = await Station.findOne({where: {[Op.and]:[{id:id},{type:'B2B'}]}});
        if(!b2bCheck){ return res.status(404).json({ message: `B2B introuvable ou désactivé` }) }

        //VERIFICATION D'EXISTENCE
        // if(req.body.marketer_ids){
        //     for (const marketer_id of marketer_ids) {
        //         const marketerCheck = await Marketer.findByPk(marketer_id);
        //         if(!marketerCheck){ return res.status(404).json({ message: `Un ou plusieurs marketers introuvable` }) }
        //     }
        // }
        
        if(req.body.ville_id){
            const villeCheck = await Ville.findByPk(ville_id);
            if(!villeCheck){ return res.status(404).json({ message: `Ville introuvable ou désactivée` }) }
        }

        // if(req.body.ifu){
        //     let stationCheckByIfu = await Station.findOne({where: {ifu: ifu}})
        //     if(stationCheckByIfu !== null && stationCheckByIfu.id !== id){ return res.status(409).json({ message: `Ifu déjà utilisé` }) }
        // }
        
        // if(req.body.document_ifu){
        //     let stationCheckByIfu_doc = await Station.findOne({where: {document_ifu: document_ifu}})
        //     if(stationCheckByIfu_doc !== null && stationCheckByIfu_doc.id !== id){ return res.status(409).json({ message: `Ifu déjà utilisé` }) }
        // }
        
        // if(req.body.rccm){
        //     let stationCheckByRCCM = await Station.findOne({where: {rccm: rccm}})
        //     if(stationCheckByRCCM !== null && stationCheckByRCCM.id !== id){ return res.status(409).json({ message: `Rccm déjà utilisé` }) }
        // }
        // if(req.body.rccm){
        //     let stationCheckByRCCM = await Station.findOne({where: {rccm: rccm}})
        //     if(stationCheckByRCCM !== null && stationCheckByRCCM.id !== id){ return res.status(409).json({ message: `Rccm déjà utilisé` }) }
        // }

        // if(req.body.name){
        //     let stationCheckByName = await Station.findOne({where: {nom: nom}})
        //     if(stationCheckByName !== null && stationCheckByName.id !== id){ return res.status(409).json({ message: `Le nom ${nom} est déjà utilisé` }) }
        // }

        if(req.body.ville_id){
            let villeCheck = await Ville.findByPk(ville_id)
            if(!villeCheck){ return res.status(404).json({ message: `Ville introuvable ou désactivée` }) }
        }
        
        if (req.body.document_ifu) {
            const IfudocBuffer =Buffer.from(req.body.document_ifu, 'base64')
            const IfudocName = fileSaver(req.body.document_ifu,ifu,"ifu")
            fs.writeFileSync(directory+IfudocName, IfudocBuffer);
            req.body.document_ifu = IfudocName
        }

        if (req.body.document_rccm) {
            const RccmdocBuffer =Buffer.from(req.body.document_rccm, 'base64')
            const RccmdocName = fileSaver(req.body.document_rccm,rccm,"rccm")
            fs.writeFileSync(directory+RccmdocName, RccmdocBuffer);
            req.body.document_rccm=RccmdocName
        }

        //CREATION
        await Station.update({...req.body, updatedBy: req.reqUserId},{where: {id:id}})
        
        

        //ENVOI
        return res.json({message: 'Le B2B a bien été modifié'})
        
    } catch (err) {
        console.log("rfffffffffffffffffff",err);
        next(err)
    }
}

exports.addMarketers = async (req, res, next) => {
    const id = xss(req.params.b2bId)
    const marketer_ids = req.body.marketer_ids

    //VALIDATION DES DONNEES RECUES
    if( !id ){ return res.status(400).json({ message: 'Vous devez spécifier l\'identifiant du B2B concerné ' })}
    else if( req.body.marketer_ids || !Array.isArray(marketer_ids) ){ return res.status(400).json({ message: 'Mauvais format de la liste des marketers' })}

    try {

        const b2bCheck = await Station.findOne({where: {[Op.and]:[{id:id},{type:'B2B'}]}});
        if(!b2bCheck){ return res.status(404).json({ message: `B2B introuvable ou désactivé` }) }

        //VERIFICATION D'EXISTENCE DU MARKETER
        for (const marketer_id of marketer_ids) {
            const marketerCheck = await Marketer.findByPk(marketer_id);
            if(!marketerCheck){ return res.status(404).json({ message: `Un ou plusieurs marketers introuvable` }) }
        }
        
        

        //ENVOI
        return res.status(204).json({})
        
    } catch (err) {
        console.log(err);
        next(err)
    }
}

exports.removeMarketers = async (req, res, next) => {
    const id = xss(req.params.b2bId)
    const marketer_ids = req.body.marketer_ids

    //VALIDATION DES DONNEES RECUES
    if( !id ){ return res.status(400).json({ message: 'Vous devez spécifier l\'identifiant du B2B concerné ' })}
    else if( req.body.marketer_ids || !Array.isArray(marketer_ids) ){ return res.status(400).json({ message: 'Mauvais format de la liste des marketers' })}

    try {

        const b2bCheck = await Station.findOne({where: {[Op.and]:[{id:id},{type:'B2B'}]}});
        if(!b2bCheck){ return res.status(404).json({ message: `B2B introuvable ou désactivé` }) }

        //VERIFICATION D'EXISTENCE DU MARKETER
        for (const marketer_id of marketer_ids) {
            const marketerCheck = await Marketer.findByPk(marketer_id);
            if(!marketerCheck){ return res.status(404).json({ message: `Un ou plusieurs marketers introuvable` }) }
        }
        
       
        //ENVOI
        return res.status(204).json({})
        
    } catch (err) {
        console.log(err);
        next(err)
    }
}

exports.trash = async (req, res, next) => {
    
    let id = parseInt(req.params.id)
    const suspensionComment = xss(req.body.suspensionComment)

    //VALIDATION DES DONNEES RECUES
    if(!id || !suspensionComment){
        // console.log('missing data');
        return res.status(400).json({ message: 'Parametre(s) ou donnée(s) manquant(s)' })
    }

    try {
        const station = await Station.findByPk(id)
        if(station === null){return res.status(404).json({message: 'Donnée introubable'})}

        await Station.update({deletedBy: req.reqUserId, suspensionComment: suspensionComment, restoredBy: null,isactive:false}, {where: {id: id}})
        // await Station.destroy({where: {id: id}})
        
        

        await User.update({deletedBy: req.reqUserId, suspensionComment: suspensionComment, restoredBy: null,isactive:false}, {where: {station_id: id}})
        // await User.destroy({where: {station_id: id}})

        return res.status(204).json({})
        
    } catch (err) {
        return next(err)
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
            await Station.update({ deletedBy: null, suspensionComment: null, restoredBy: req.reqUserId,isactive:true  }, { where: { id: id} })

            await User.restore({ where: { station_id: id } })
            await User.update({ deletedBy: null, suspensionComment: null, restoredBy: req.reqUserId,isactive:true }, { where: { station_id: id } })
        }
        

        return res.status(204).json({})

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Une erreur s'est produite veuillez réessayer" })
    }

}
exports.untrash = async (req, res, next) => {
    let id = parseInt(req.params.id)

    //VALIDATION DES DONNEES RECUES
    if(!id){
        return res.status(400).json({ message: 'Parametre(s) manquant(s)' })
    }

    try {
        const station = await Station.findByPk(id, {paranoid: false})
        if(station === null){return res.status(404).json({message: 'Donnée introubable'})}

        await Station.restore({where: {id: id}})
        await Station.update({deletedBy: null, suspensionComment: null, restoredBy: req.reqUserId,isactive:true}, {where: {id: id}})

        await User.restore({where: {station_id: id}})
        await User.update({deletedBy: null, suspensionComment: null, restoredBy: req.reqUserId,isactive:true}, {where: {station_id: id}})

        return res.status(204).json({})

    } catch (err) {
        return next(err)
    }

}
