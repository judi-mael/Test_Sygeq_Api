/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const jwt = require('jsonwebtoken')
const { Op } = require("sequelize");
const xss = require("xss");

const {Produit,BonLivraison,DetailsLivraison,DetailsLivraisonBarcode,Camion}= require('../models')
const userCtrl = require('./user')

/*****************************/
/*** GESTION DE LA RESSOURCE */
exports.getAll = async (req, res, next) => {
    const blId = req.params.blId;

    if(!blId){return res.status(400).json({message: 'Paramètre ou donnée manquante'})}
    
    try {
        const blCheck = await BonLivraison.findByPk(blId)
        if(!blCheck){return res.status(404).json({message: 'BL introuvable ou désactivé.'})}

        const dls = await DetailsLivraison.findAll({where: {bonlivraison_id: blId}, paranoid: false, order:[ ['createdAt','desc'] ]})

        return res.json({data: dls})
        
    } catch (err) {
        console.log(err);
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
        let dl = await DetailsLivraison.findByPk(id, {paranoid: false})
        if(dl === null){
            return res.status(404).json({message: 'Donnée introuvable'})
        }

        let bl = await BonLivraison.findByPk(dl.bonlivraison_id)
        let produit = await Produit.findByPk(dl.produit_id)
        let creator = await userCtrl.getUsefulUserData(dl.createdBy)
        let updator = await userCtrl.getUsefulUserData(dl.updatedBy)

        //ENVOI
        return res.json({data: {
            id: dl.id,
            bonlivraison: bl,
            details: await DetailsLivraisonBarcode.findAll({where: {detailslivraison_id: id}, paranoid: false}),
            produit: produit,
            qtte: dl.qtte,
            etat: dl.etat,
            createdBy: creator,
            updatedBy: updator,
            createdAt: dl.createdAt,
            updatedAt: dl.updatedAt,
            deletedAt: dl.deletedAt
        }})
        
    } catch (err) {
        next(err)
    }
}

exports.add = async (req, res, next) => {
    const blId = parseInt(req.params.blId);
    const dls = req.body.dls

    //VALIDATION DES DONNEES RECUES
    if(!blId || !Array.isArray(dls)){return res.status(400).json({message: 'Paramètre ou donnée manquante ou mal formatté'})}
    
    for (const dl of dls) {
        if(!parseInt(dl.produit_id) || !parseFloat(dl.qtte)){return res.status(400).json({ message: 'Le format d\'un ou de plusieur des détails est icorrect' })}
    }

    try {
        const blCheck = await BonLivraison.findByPk(blId)
        if(!blCheck){return res.status(404).json({message: 'BL introuvable ou désactivé'})}
        else if(blCheck.statut !== 'Ouvert' && blCheck.status !== 'Approuvé'){return res.status(401).json({message: 'Ce BL est déjà '+blCheck.statut})}

        for (const dl of dls) {
            const productCheck = await Produit.findByPk(dl.produit_id)
            if(!productCheck){return res.status(404).json({ message: 'Un ou plusieur produit(s) introuvable(s)' })}
        }

        //NETTOYAGE
        const tempDls = await DetailsLivraison.findAll({where: {bonlivraison_id: blId}})
        let oldTotal = 0;
        for (const dl of tempDls) { oldTotal+=dl.qtte }
        
        await DetailsLivraison.destroy({where: {bonlivraison_id: blId}})
        let camion = await Camion.findByPk(blCheck.camion_id)
        camion && await Camion.update({filling_level: camion.filling_level-oldTotal},{where: {id: camion.id}})

        //CREATION
        let newTotal = parseInt(camion.filling_level);
        for (const dl of dls) {
            const newDl = await DetailsLivraison.create({
                bonlivraison_id: blId,
                produit_id: dl.produit_id,
                qtte:dl.qtte,
                createdBy: req.reqUserId,
                updatedBy: req.reqUserId
            })
            newTotal += parseInt(newDl.qtte);
        }

        camion = await Camion.findByPk(blCheck.camion_id)
        camion && await Camion.update({filling_level: camion.filling_level+newTotal},{where: {id: camion.id}})

        //remise à l'etat ouvert en cas d'édition
        await BonLivraison.update({statut: 'Ouvert'}, {where: {id: blCheck.id}})

        //ENVOI
        return res.status(204).json({})
        
    } catch (err) {
        // console.log(err);
        next(err)
    }
}

exports.update = async (req, res, next) => {
    let id = parseInt(req.params.id)

    //VALIDATION DES DONNEES RECUES
    if(!id){
        return res.status(400).json({ message: 'Parametre(s) manquant(s)' })
    }

    try {
        //RECUPERATION
        let dl = await DetailsLivraison.findByPk(id)       
        if(dl === null){
            return res.status(404).json({message: 'Donnée introuvable'})
        }

        //MISE A JOUR
        await DetailsLivraison.update(req.body, {where: {id: id}})
        await DetailsLivraison.update({updatedBy: req.reqUserId}, {where: {id: id}})
        return res.json({message: 'Les détails ont bien été mis à jour'})
        
    } catch (err) {
        // console.log(err);
        next(err)
    }
}

exports.trash = async (req, res, next) => {
    let id = parseInt(req.params.id)
    const suspensionComment = xss(req.body.suspensionComment)
    console.log(id);

    //VALIDATION DES DONNEES RECUES
    if(!id || !suspensionComment){
        return res.status(400).json({ message: 'Parametre(s) ou donnée(s) manquant(s)' })
    }

    try {
        const dl = await DetailsLivraison.findByPk(id)
        if(dl === null){return res.status(404).json({message: 'Donnée introubable'})}

        await DetailsLivraison.update({deletedBy: req.reqUserId, suspensionComment: suspensionComment, restoredBy: null}, {where: {id: id}})
        await DetailsLivraison.destroy({where: {id: id}})

        return res.status(204).json({})
        
    } catch (err) {
        console.log(err);
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
        const dl = await DetailsLivraison.findByPk(id, {paranoid: false})
        if(dl === null){return res.status(404).json({message: 'Donnée introubable'})}

        await DetailsLivraison.restore({where: {id: id}})
        await DetailsLivraison.update({deletedBy: null, suspensionComment: null, restoredBy: req.reqUserId}, {where: {id: id}})

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
        const dl = await DetailsLivraison.findByPk(id, {paranoid: false})
        if(dl === null){return res.status(404).json({message: 'Donnée introubable'})}
        
        await DetailsLivraison.destroy({where: {id: id}, force: true})

        return res.status(204).json({})

    } catch (err) {
        // console.log(err);
        next(err)
    }
}