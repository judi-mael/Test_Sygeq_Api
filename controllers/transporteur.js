/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const jwt = require('jsonwebtoken')
const { Op } = require("sequelize");
const xss = require("xss");

const {Contrat,Compartiment,Camion,Marketer,User,Transporteur} = require('../models')
const userCtrl = require('./user')

const mailerCtrl = require('./_internal/mailer')
const notifCtrl = require('./notification')
var generator = require('generate-password');
const directory = process.env.SERVER_DIR
const path = require('path')
let fs = require('fs');
// const { default: fileSaver } = require('./_internal/filesaver');

/*****************************/
/*** GESTION DE LA RESSOURCE */
exports.getAll = async (req, res, next) => {

    let list = []
    
    try {

        let trs = await Transporteur.findAll({paranoid: false, order:[ ['createdAt','desc'] ]})
        const user = await userCtrl.getUsefulUserData(req.reqUserId)

        
        for (let i = 0; i < trs.length; i++) {
            
            let tr = trs[i];
            let camions;
            let contrat

            
            if(tr !== null){

                camions = await Camion.findAll({where: {transporteur_id: tr.id}})
                contrat = await Contrat.findOne({where: {[Op.and]: [{marketer_id: user.marketer_id}, {transporteur_id: tr.id}, {statut: 'Approuvé'}]}})
                
            }
            
            let creator = await userCtrl.getUsefulUserData(tr.createdBy)
            let updator = await userCtrl.getUsefulUserData(tr.updatedBy)

            list.push({
                id: tr.id,
                agrement: tr.agrement,
                document_agrement: tr.document_agrement,
                ifu: tr.ifu,
                document_ifu: tr.document_ifu,
                dateVigueur: tr.dateVigueur,
                dateExpiration: tr.dateExpiration,
                nom: tr.nom,
                adresse: tr.adresse,
                camions: camions,
                contrat: contrat,
                etat: tr.etat,
                createdBy: creator,
                updatedBy: updator,
                createdAt: tr.createdAt,
                updatedAt: tr.updatedAt,
                deletedAt: tr.deletedAt
            })

        }

        // console.log(list);
        return res.json({data: list,nbr:list.length})
        
    } catch (err) {
        // console.log(err);
        next(err)
    }
    
}

exports.getActives = async (req, res, next) => {

    let list = []
    
    try {

        let trs = await Transporteur.findAll({paranoid: true, order:[ ['createdAt','desc'] ]})
        const user = await userCtrl.getUsefulUserData(req.reqUserId)

        
        for (let i = 0; i < trs.length; i++) {
            
            let tr = trs[i];
            let camions;

            
            if(tr !== null){

                camions = await Camion.findAll({where: {transporteur_id: tr.id}})
                
            }
            
            let creator = await userCtrl.getUsefulUserData(tr.createdBy)
            let updator = await userCtrl.getUsefulUserData(tr.updatedBy)

            list.push({
                id: tr.id,
                agrement: tr.agrement,
                document_agrement: tr.document_agrement,
                ifu: tr.ifu,
                document_ifu: tr.document_ifu,
                dateVigueur: tr.dateVigueur,
                dateExpiration: tr.dateExpiration,
                nom: tr.nom,
                adresse: tr.adresse,
                camions: camions,
                etat: tr.etat,
                createdBy: creator,
                updatedBy: updator,
                createdAt: tr.createdAt,
                updatedAt: tr.updatedAt,
                deletedAt: tr.deletedAt
            })

        }

        // console.log(list);
        return res.json({data: list})
        
    } catch (err) {
        // console.log(err);
        next(err)
    }
    
}

exports.getInactives = async (req, res, next) => {

    let list = []
    
    try {

        let trs = await Transporteur.findAll({paranoid: false, order:[ ['createdAt','desc'] ]})
        const user = await userCtrl.getUsefulUserData(req.reqUserId)

        
        for (let i = 0; i < trs.length; i++) {
            
            let tr = trs[i];
            let camions;

            
            if(tr !== null && tr.deletedAt !== null){

                camions = await Camion.findAll({where: {transporteur_id: tr.id}})
                
            }
            
            let creator = await userCtrl.getUsefulUserData(tr.createdBy)
            let updator = await userCtrl.getUsefulUserData(tr.updatedBy)

            list.push({
                id: tr.id,
                agrement: tr.agrement,
                document_agrement: tr.document_agrement,
                ifu: tr.ifu,
                document_ifu: tr.document_ifu,
                dateVigueur: tr.dateVigueur,
                dateExpiration: tr.dateExpiration,
                nom: tr.nom,
                adresse: tr.adresse,
                camions: camions,
                etat: tr.etat,
                createdBy: creator,
                updatedBy: updator,
                createdAt: tr.createdAt,
                updatedAt: tr.updatedAt,
                deletedAt: tr.deletedAt
            })

        }

        // console.log(list);
        return res.json({data: list})
        
    } catch (err) {
        // console.log(err);
        next(err)
    }
    
}

exports.getContractuals = async (req, res, next) => {

    let list = []
    
    try {

        let trs = await Transporteur.findAll({paranoid: false, order:[ ['createdAt','desc'] ]})
        const user = await userCtrl.getUsefulUserData(req.reqUserId)

        for (const tr of trs) {

            let camions = [];
            
            if(tr !== null){camions = await Camion.findAll({where: {transporteur_id: tr.id}})}
            
            let creator = await userCtrl.getUsefulUserData(tr.createdBy)
            let updator = await userCtrl.getUsefulUserData(tr.updatedBy)
            
            const contrat = await Contrat.findOne({where: {[Op.and]: [{marketer_id: user.marketer_id}, {transporteur_id: tr.id}, {statut: 'Approuvé'}]}})
    
            if(contrat !== null){
    
                list.push({
                    id: tr.id,
                    agrement: tr.agrement,
                    document_agrement: tr.document_agrement,
                    ifu: tr.ifu,
                    document_ifu: tr.document_ifu,
                    dateVigueur: tr.dateVigueur,
                    dateExpiration: tr.dateExpiration,
                    nom: tr.nom,
                    adresse: tr.adresse,
                    camions: camions,
                    etat: tr.etat,
                    createdBy: creator,
                    updatedBy: updator,
                    createdAt: tr.createdAt,
                    updatedAt: tr.updatedAt,
                    deletedAt: tr.deletedAt
                })
    
            }
            
        }

        // console.log(list);
        return res.json({data: list})
        
    } catch (err) {
        // console.log(err);
        next(err)
    }
    
}

exports.getContractables = async (req, res, next) => {

    let list = []
    
    try {

        let trs = await Transporteur.findAll({paranoid: false, order:[ ['createdAt','desc'] ]})
        const user = await userCtrl.getUsefulUserData(req.reqUserId)

        for (const tr of trs) {

            let camions = [];
            
            if(tr !== null){camions = await Camion.findAll({where: {transporteur_id: tr.id}})}
            
            let creator = await userCtrl.getUsefulUserData(tr.createdBy)
            let updator = await userCtrl.getUsefulUserData(tr.updatedBy)
            
            const contrat = await Contrat.findOne({where: {[Op.and]: [{marketer_id: user.marketer_id}, {transporteur_id: tr.id}]}})
    
            if(
                contrat === null ||
                (
                    contrat !== null && contrat.statut !== 'En attente' && contrat.statut !== 'Approuvé'
                )
            ){
    
                list.push({
                    id: tr.id,
                    agrement: tr.agrement,
                    document_agrement: tr.document_agrement,
                    ifu: tr.ifu,
                    document_ifu: tr.document_ifu,
                    dateVigueur: tr.dateVigueur,
                    dateExpiration: tr.dateExpiration,
                    nom: tr.nom,
                    adresse: tr.adresse,
                    camions: camions,
                    etat: tr.etat,
                    createdBy: creator,
                    updatedBy: updator,
                    createdAt: tr.createdAt,
                    updatedAt: tr.updatedAt,
                    deletedAt: tr.deletedAt
                })
    
            }
            
        }

        // console.log(list);
        return res.json({data: list})
        
    } catch (err) {
        // console.log(err);
        next(err)
    }
    
}

exports.get = async (req, res, next) => {
    let id = parseInt(req.params.id)

    //VALIDATION DES DONNEES RECUES
    if(!id){
        return res.status(400).json({ message: 'Parametre(s) manquant(s)' })
    }

    try {
        //RECUPERATION
        let tr = await Transporteur.findByPk(id, {paranoid: false})
        if(tr === null){
            return res.status(404).json({message: 'Transporteur introuvable ou désactivé'})
        }

        let marketer = await Marketer.findByPk(tr.marketer_id)
        let camions = await Camion.findAll({where: {transporteur_id: tr.id}})
        let creator = await userCtrl.getUsefulUserData(tr.createdBy)
        let updator = await userCtrl.getUsefulUserData(tr.updatedBy)

        //ENVOI
        return res.json({data: {
            id: tr.id,
            agrement: tr.agrement,
            document_agrement: tr.document_agrement,
            ifu: tr.ifu,
            document_ifu: tr.document_ifu,
            dateVigueur: tr.dateVigueur,
            dateExpiration: tr.dateExpiration,
            nom: tr.nom,
            adresse: tr.adresse,
            marketer: marketer,
            camions: camions,
            etat: tr.etat,
            createdBy: creator,
            updatedBy: updator,
            createdAt: tr.createdAt,
            updatedAt: tr.updatedAt,
            deletedAt: tr.deletedAt
        }})
        
    } catch (err) {
        next(err)
    }
}

exports.add = async (req, res, next) => {
    const agrement = xss(req.body.agrement)
    const document_agrement = req.body.document_agrement
    const ifu = xss(req.body.ifu)
    const document_ifu = req.body.document_ifu
    const dateVigueur = req.body.dateVigueur
    const dateExpiration = req.body.dateExpiration
    const nom = xss(req.body.nom)
    const adresse = xss(req.body.adresse)

    if(
        !agrement || !ifu || !dateVigueur || !dateExpiration ||
        !nom || !adresse
    ){
        return res.status(400).json({ message: 'Veuillez renseigner tous les champs' })
    }

    try {

        //VERIFICATION D'EXISTENCE
        // let user = await User.findOne({where: {[Op.or]: [{email: email}, {username: username}]}})
        let transporteur = await Transporteur.findOne({where: {[Op.or]: [{agrement: agrement}, {ifu: ifu}]}})
        // if(user !== null){
        //     return res.status(409).json({ message: `Identifiant / email déjà utilisé` })
        // } 
        if(transporteur !== null){
            return res.status(409).json({ message: `Agrement / ifu déjà utilisé` })
        }


        // stockage des fichiers
        const IfudocBuffer =Buffer.from(document_ifu, 'base64')
        const IfudocName = '/public/uploads/ifu_docs_'+ifu+'_.pdf'
        fs.writeFileSync(directory+IfudocName, IfudocBuffer);
 
                
        const AgrementdocBuffer =Buffer.from(document_agrement, 'base64')
        const AgrementdocName = '/public/uploads/agrement_docs_'+agrement+'_.pdf'
        fs.writeFileSync(directory+AgrementdocName, AgrementdocBuffer);
 
        // eg
        // fileSaver(document_agrement,agrement,"agrement")
                

        //CREATION
        let newTransporteur = await Transporteur.create({
            agrement: agrement, 
            document_agrement: AgrementdocName, 
            ifu: ifu,
            document_ifu: IfudocName, 
            dateVigueur: dateVigueur, 
            dateExpiration: dateExpiration, 
            nom: nom,
            adresse: adresse,
            createdBy: req.reqUserId,
            updatedBy: req.reqUserId
        })

        // const requester = await User.findByPk(req.reqUserId)
        // mailerCtrl.mailAllUsersOfAType('MIC', `Le transporteur ${newTransporteur.nom} a bien été ajouté`, `Le ${requester.type} ${requester.name}, a ajouté le transporteur ${newTransporteur.nom}.`)
        // notifCtrl.notifyAllUsersOfAType('MIC', `Le transporteur ${newTransporteur.nom} a bien été ajouté`, `Le ${requester.type} ${requester.name}, a ajouté le transporteur ${newTransporteur.nom}.`)

        //ENVOI
        return res.json({message: 'Le transporteur a bien été ajoutés'})

    } catch (err) {
        next(err)
    }
}

exports.update = async (req, res, next) => {
    let id = parseInt(req.params.id)
    const agrement = xss(req.body.agrement)
    const document_agrement = req.body.document_agrement
    const ifu = xss(req.body.ifu)
    const document_ifu = req.body.document_ifu
    const dateVigueur = xss(req.body.dateVigueur)
    const dateExpiration = xss(req.body.dateExpiration)
    const nom = xss(req.body.nom)
    const name = xss(req.body.name)
    const username = xss(req.body.username)
    const email = xss(req.body.email)
    const adresse = xss(req.body.adresse)
    //VALIDATION DES DONNEES RECUES
    if(!id){
        return res.status(400).json({ message: 'Parametre(s) manquant(s)' })
    }

    try {
        //RECUPERATION
        let transporteur = await Transporteur.findByPk(id)       
        if(transporteur === null){
            return res.status(404).json({message: 'Transporteur introuvable ou désactivé'})
        }

        let updateTransporter
        if (document_ifu && !document_agrement) {

            const IfudocBuffer = Buffer.from(document_ifu, 'base64')
            const IfudocName = '/public/uploads/ifu_docs_' + ifu + '_.pdf'
            fs.writeFileSync(directory + IfudocName, IfudocBuffer);


            //Mise à jour
            updateTransporter = {
                agrement: agrement,
                ifu: ifu,
                document_ifu: IfudocName,
                dateVigueur: dateVigueur,
                dateExpiration: dateExpiration,
                nom: nom,
                adresse: adresse,
                // createdBy: req.reqUserId,
                updatedBy: req.reqUserId
            }

        }
        else if (document_agrement && !document_ifu) {

            const AgrementdocBuffer = Buffer.from(document_ifu, 'base64')
            let transporteur = await Transporteur.findByPk(id)       
            const AgrementdocName = '/public/uploads/agrement_docs_' + agrement + '_.pdf'
            fs.writeFileSync(directory + AgrementdocName, AgrementdocBuffer);

            //Mise à jour
            updateTransporter = {
                agrement: agrement,
                document_agrement: AgrementdocName,
                ifu: ifu,
                dateVigueur: dateVigueur,
                dateExpiration: dateExpiration,
                nom: nom,
                adresse: adresse,
                // createdBy: req.reqUserId,
                updatedBy: req.reqUserId
            }

        }
        else if (document_ifu && document_agrement) {
            

            const IfudocBuffer = Buffer.from(document_ifu, 'base64')
            const IfudocName = '/public/uploads/ifu_docs_' + ifu + '_.pdf'
            fs.writeFileSync(directory + IfudocName, IfudocBuffer);

            const AgrementdocBuffer = Buffer.from(document_ifu, 'base64')
            const AgrementdocName = '/public/uploads/agrement_docs_' + agrement + '_.pdf'
            fs.writeFileSync(directory + AgrementdocName, AgrementdocBuffer);

            //Mise à jour
            updateTransporter = {
                agrement: agrement,
                document_agrement: AgrementdocName,
                ifu: ifu,
                document_ifu: IfudocName,
                dateVigueur: dateVigueur,
                dateExpiration: dateExpiration,
                nom: nom,
                adresse: adresse,
                // createdBy: req.reqUserId,
                updatedBy: req.reqUserId
            }

        }
        else {
            //Mise à jour
            updateTransporter = {
                agrement: agrement,
                ifu: ifu,
                dateVigueur: dateVigueur,
                dateExpiration: dateExpiration,
                nom: nom,
                adresse: adresse,
                // createdBy: req.reqUserId,
                updatedBy: req.reqUserId
            }

        }

        //MISE A JOUR
        await Transporteur.update(updateTransporter, {where: {id: id}})
        // await Transporteur.update(req.body, {where: {id: id}})
        // await Transporteur.update(req.body, {where: {id: id}})
        // await Transporteur.update({updatedBy: req.reqUserId}, {where: {id: id}})
        // if(req.body.document_ifu){
        
        // }
        return res.json({message: 'Le transporteur a bien été mis à jour'})
        
    } catch (err) {
        next(err)
    }
}

exports.trash = async (req, res, next) => {
    
    let id = parseInt(req.params.id)
    const suspensionComment = xss(req.body.suspensionComment)

    //VALIDATION DES DONNEES RECUES
    if(!id || !suspensionComment){
        return res.status(400).json({ message: 'Parametre(s) ou donnée(s) manquant(s)' })
    }

    try {
        const tr = await Transporteur.findByPk(id)
        if(tr === null){return res.status(404).json({message: 'Donnée introubable'})}

        await Transporteur.update({deletedBy: req.reqUserId, suspensionComment: suspensionComment, restoredBy: null}, {where: {id: id}})
        await Transporteur.destroy({where: {id: id}})

        let camions= await Camion.findAll({where: {transporteur_id:id}})
        for (const camion of camions) {
            await Compartiment.update({deletedBy: req.reqUserId, suspensionComment: suspensionComment, restoredBy: null}, {where: {camion_id: camion.id}})
            await Compartiment.destroy({where: {camion_id: camion.id}})
        }

        await Camion.update({deletedBy: req.reqUserId, suspensionComment: suspensionComment, restoredBy: null}, {where: {transporteur_id: id}})
        await Camion.destroy({where: {transporteur_id: id}})

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
            const tr = await Transporteur.findByPk(id, {paranoid: false})
            if(tr === null){return res.status(404).json({message: 'Donnée introubable'})}

            await Transporteur.restore({where: {id: id}})
            await Transporteur.update({deletedBy: null, suspensionComment: null, restoredBy: req.reqUserId,isactive:true}, {where: {id: id}})

            
            await Camion.restore({where: {transporteur_id: id}})
            await Camion.update({deletedBy: null, suspensionComment: null, restoredBy: req.reqUserId,isactive:true}, {where: {transporteur_id: id}})

            let camions= await Camion.findAll({where: {transporteur_id:id}})
            for (const camion of camions) {
                await Compartiment.restore({where: {camion_id: camion.id}})
                await Compartiment.update({deletedBy: null, suspensionComment: null, restoredBy: req.reqUserId}, {where: {camion_id: camion.id}})
            }
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
        const tr = await Transporteur.findByPk(id, {paranoid: false})
        if(tr === null){return res.status(404).json({message: 'Donnée introubable'})}

        await Transporteur.restore({where: {id: id}})
        await Transporteur.update({deletedBy: null, suspensionComment: null, restoredBy: req.reqUserId}, {where: {id: id}})

        
        await Camion.restore({where: {transporteur_id: id}})
        await Camion.update({deletedBy: null, suspensionComment: null, restoredBy: req.reqUserId}, {where: {transporteur_id: id}})

        let camions= await Camion.findAll({where: {transporteur_id:id}})
        for (const camion of camions) {
            await Compartiment.restore({where: {camion_id: camion.id}})
            await Compartiment.update({deletedBy: null, suspensionComment: null, restoredBy: req.reqUserId}, {where: {camion_id: camion.id}})
        }

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
        const tr = await Transporteur.findByPk(id, {paranoid: false})
        if(tr === null){return res.status(404).json({message: 'Donnée introubable'})}
        
       const trans =  await Transporteur.destroy({where: {id: id}, force: true})

        fs.unlink(trans.document_ifu, (err) => {
         if (err) {
           console.log(err);
         } else {
           console.log('File '+ trans.document_ifu +' removed successfully');
         }
       });
 

        return res.status(204).json({})

    } catch (err) {
        // console.log(err);
        next(err)
    }
}