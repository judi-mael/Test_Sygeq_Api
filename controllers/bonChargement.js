/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const jwt = require('jsonwebtoken')
const { Op } = require("sequelize");
const xss = require("xss");


// const DlbGroup = DB.DlbGroup
// const DetailsChargement = DB.DetailsChargement
const {BonLivraison,Depot,DetailsLivraison,DetailsLivraisonBarcode,Produit,Station,Transporteur,Camion,Compartiment,Marketer,BonChargement,DetailsChargement}= require('../models')
const userCtrl = require('./user')

/*****************************/
/*** GESTION DE LA RESSOURCE */

async function gBl(id) {

    try {
        //RECUPERATION
        let bl = await BonLivraison.findByPk(id, {paranoid: false})
        if(bl === null){
            // console.log('not found');
            return null;
        }

        let station = await Station.findByPk(bl.station_id)
        let transporteur = await Transporteur.findByPk(bl.transporteur_id)
        let marketer = await Marketer.findByPk(bl.marketer_id)
        let camion = await Camion.findByPk(bl.camion_id)
        let depot = await Depot.findByPk(bl.depot_id)
        let creator = await userCtrl.getUsefulUserData(bl.createdBy)
        let updator = await userCtrl.getUsefulUserData(bl.updatedBy)

        let dls = await DetailsLivraison.findAll({where: {bonlivraison_id: bl.id}});
        let details = [];
        
        for (let i = 0; i < dls.length; i++) {
            const dl = dls[i];
            let detailsBarcodes = [];

            if(dl){

                let dlbs = await DetailsLivraisonBarcode.findAll({where: {detailslivraison_id: dl.id}})

                for (let ii = 0; ii < dlbs.length; ii++) {
                    const dlb = dlbs[ii];

                    if(dlb){
                        detailsBarcodes.push({
                            id: dlb.id,
                            detailslivraison_id: dlb.detailslivraison_id,
                            qty: dlb.qty,
                            barcode: dlb.barcode,
                            Compartiment: await Compartiment.findByPk(dlb.compartiment_id),
                            createdBy: await userCtrl.getUsefulUserData(dlb.createdBy),
                            updatedBy: await userCtrl.getUsefulUserData(dlb.updatedBy),
                            deletedBy: dlb.deletedBy,
                            restoredBy: dlb.restoredBy,
                            createdAt: dlb.createdAt,
                            updatedAt: dlb.updatedAt,
                            deletedAt: dlb.deletedAt,
                            suspensionComment: dlb.suspensionComment
                        })
                    }
                }

                details.push({
                    id: dl.id,
                    bonlivraison_id: dl.bonlivraison_id,
                    produit: await Produit.findByPk(dl.produit_id),
                    qtte: dl.qtte,
                    details_barcodes: detailsBarcodes,
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
        }

        //ENVOI
        return {
            id: bl.id,
            numeroBL: bl.numeroBL,
            date: bl.date,
            station: await Station.findByPk(bl.station_id),
            marketer: await Marketer.findByPk(bl.marketer_id),
            transporteur: await Transporteur.findByPk(bl.transporteur_id),
            camion: {
                id: camion.id,
                ssat_id: camion.ssat_id,
                imat: camion.imat,
                nbrVanne: camion.nbrVanne,
                vannes: await Compartiment.findAll({where: {camion_id: camion.id}}),
                annee: camion.annee,
                type: camion.type,
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
            },
            depot: await Depot.findByPk(bl.depot_id),
            produits: details,
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
        }

    } catch (err) {
        console.log(err);
        return null;
    }
}

exports.getAll = async (req, res, next) => {

    try {
        let list = []
        const bcs = await BonChargement.findAll({paranoid: false, order:[ ['createdAt','desc'] ]})
        
        for (const bc of bcs) {
            const details = []
            const data = await DetailsChargement.findAll({where: {bonchargement_id: bc.id}})
            for (const detail of data) {
                details.push({
                    id: detail.id,
                    bonlivraison_id: await gBl(detail.bonlivraison_id),
                    bonchargement_id: detail.bonchargement_id,
                    createdBy: detail.createdBy,
                    updatedBy: detail.updatedBy,
                    deletedBy: detail.deletedBy,
                    restoredBy: detail.restoredBy,
                    suspensionComment: detail.suspensionComment
                })
            }

            list.push({
                id: bc.id,
                details: details,
                dateheuredepart: bc.dateheuredepart,
                createdBy: bc.createdBy,
                updatedBy: bc.updatedBy,
                deletedBy: bc.deletedBy,
                restoredBy: bc.restoredBy,
                suspensionComment: bc.suspensionComment,
                createdAt: bc.createdAt,
                updatedAt: bc.updatedAt,
                deletedAt: bc.deletedAt
            })
        }

        return res.json({data: list})

    } catch (err) {
        console.log(err);
        next(err)
    }

}

exports.get = async (req, res, next) => {
    const id= parseInt(req.params.id)

    //VALIDATION DES DONNEES RECUES
    if(!id){
        return res.status(400).json({ message: 'Parametre(s) manquant(s)' })
    }

    try {
        //RECUPERATION
        let bc = await BonChargement.findByPk(id, {paranoid: false})
        if(bc === null){
            return res.status(404).json({message: 'BC introuvable'})
        }

        let bls = []
        const details = await DetailsChargement.findAll({where: {bonchargement_id: id}})
        for (const detail of details) {
            bls.push(await gBl(detail.bonlivraison_id))
        }
        
        //ENVOI
        return res.json({ data: {
            id: bc.id,
            bls: bls,
            dateheuredepart: bc.dateheuredepart,
            createdBy: await userCtrl.getUsefulUserData(bc.createdBy),
            updatedBy: await userCtrl.getUsefulUserData(bc.updatedBy),
            deletedBy: bc.deletedBy,
            restoredBy: bc.restoredBy,
            suspensionComment: bc.suspensionComment,
            createdAt: bc.createdAt,
            updatedAt: bc.updatedAt,
            deletedAt: bc.deletedAt
        }})
        
    } catch (err) {
        console.log(err);
        next(err)
    }
}

exports.add = async (req, res, next) => {
    const dateheuredepart = xss(req.body.dateheuredepart)
    const blIds = xss(req.body.blIds)

    console.log(req.body);

    //VALIDATION DES DONNEES RECUES
    if(!dateheuredepart || !blIds){
        return res.status(400).json({ message: 'Veuillez renseigner tous les champs' })
    }

    try {
        //CREATION
        let bc = await BonChargement.create({
            dateheuredepart: dateheuredepart, 
            createdBy: parseInt(req.reqUserId),
            updatedBy: parseInt(req.reqUserId)
        })        
        
        if(blIds.length>0){
            for (const blId of blIds) {
                if (parseInt(blId) > 0) {await DetailsChargement.create({bonlivraison_id: blId, bonchargement_id: bc.id, createdBy: req.reqUserId, updatedBy: req.reqUserId})}
            }
        }

        //ENVOI
        return res.json({message: 'Le BC a bien été créé'})
        
    } catch (err) {
        console.log(err);
        next(err)
    }
}

exports.update = async (req, res, next) => {
    let id = parseInt(req.params.id)
    const dlbIds = xss(req.body.dlbs)
    
    //VALIDATION DES DONNEES RECUES
    if(!id){
        return res.status(400).json({ message: 'Parametre(s) manquant(s)' })
    }

    try {
        //RECUPERATION
        let bc = await BonChargement.findByPk(id)       
        if(bc === null){
            return res.status(404).json({message: 'BC introuvable'})
        }

        //MISE A JOUR DU BC
        await BonChargement.update(req.body, {where: {id: id}})
        await BonChargement.update({updatedBy: parseInt(req.reqUserId)}, {where: {id: id}})

        if(dlbIds.length>0){
            for (const dlbId of dlbIds) {
                if (parseInt(dlbId) > 0) {
                    const dlb = await DetailsLivraisonBarcode.findByPk(dlbId)
                    const dl = await DetailsLivraison.findByPk(dlb.detailslivraison_id)
                    // await DlbGroup.destroy({where: {id: dlbId}, force: true})
                    // await DlbGroup.create({
                    //     dlbId: dlbId,
                    //     dlId: dlb.detailslivraison_id,
                    //     blId: dl.bonlivraison_id,
                    //     bcId: bc.id,
                    //     createdBy: req.reqUserId,
                    //     updatedBy: req.reqUserId
                    // })
                }
            }
        }

        return res.json({message: 'Le BC a bien été modifié'})
        
    } catch (err) {
        // console.log(err);
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
        const bc = await BonChargement.findByPk(id)
        if(bc === null){return res.status(404).json({message: 'Donnée introubable'})}

        await BonChargement.update({deletedBy: req.reqUserId, suspensionComment: suspensionComment, restoredBy: null}, {where: {id: id}})
        // await BonChargement.destroy({where: {id: id}})
        // await DlbGroup.update({deletedBy: req.reqUserId, suspensionComment: suspensionComment, restoredBy: null}, {where: {bcId: id}})
        // await DlbGroup.destroy({where: {bcId: id}})

        return res.status(204).json({})
        
    } catch (err) {
        // console.log(err);
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
        const bc = await BonChargement.findByPk(id, {paranoid: false})
        if(bc === null){return res.status(404).json({message: 'Donnée introubable'})}

        await BonChargement.restore({where: {id: id}})
        await BonChargement.update({deletedBy: null, suspensionComment: null, restoredBy: req.reqUserId}, {where: {id: id}})
        // await DlbGroup.restore({where: {bcId: id}})
        // await DlbGroup.update({deletedBy: null, suspensionComment: null, restoredBy: req.reqUserId}, {where: {bcId: id}})

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
        const bc = await BonChargement.findByPk(id, {paranoid: false})
        if(bc === null){return res.status(404).json({message: 'Donnée introubable'})}
        
        await BonChargement.destroy({where: {id: id}, force: true})

        return res.status(204).json({})

    } catch (err) {
        // console.log(err);
        next(err)
    }
}