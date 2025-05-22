/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const jwt = require('jsonwebtoken')
const { Op } = require("sequelize");
const xss = require("xss");

const {BonChargement,BonLivraison,DetailsChargement} = require('../models')
const userCtrl = require('./user')

/*****************************/
/*** GESTION DE LA RESSOURCE */
exports.getAll = (req, res, next) => {
    DetailsChargement.findAll({paranoid: false, order:[ ['createdAt','desc'] ]})
        .then(dcs => res.json({data: dcs}))
        .catch(err => next(err))
}

exports.get = async (req, res, next) => {
    let id = parseInt(req.params.id)

    //VALIDATION DES DONNEES RECUES
    if(!id){
        return res.status(400).json({ message: 'Parametre(s) manquant(s)' })
    }

    try {
        //RECUPERATION
        let dc = await DetailsChargement.findByPk(id, {paranoid: false})
        if(dc === null){
            return res.status(404).json({message: 'Donnée introuvable'})
        }

        let bonlivraison = await BonLivraison.findByPk(dc.bonlivraison_id)
        let bonchargement = await BonChargement.findByPk(dc.bonchargement_id)
        let creator = await userCtrl.getUsefulUserData(dc.createdBy)
        let updator = await userCtrl.getUsefulUserData(dc.updatedBy)

        //ENVOI
        return res.json({data: {
            id: dc.id,
            bonlivraison: bonlivraison,
            bonchargement: bonchargement,
            etat: dc.etat,
            createdBy: creator,
            updatedBy: updator,
            createdAt: dc.createdAt,
            updatedAt: dc.updatedAt,
            deletedAt: dc.deletedAt
        }})
        
    } catch (err) {
        next(err)
    }
}

exports.add = async (req, res, next) => {
    let {
        bonlivraison_id, bonchargement_id
    } = req.body

    //FORMATAGE
    bonlivraison_id = parseInt(bonlivraison_id)
    bonchargement_id = parseInt(bonchargement_id)

    //VALIDATION DES DONNEES RECUES
    if(!bonlivraison_id || !bonchargement_id){
        return res.status(400).json({ message: 'Veuillez renseigner tous les champs' })
    }

    try {      
        //CREATION
        let dc = await DetailsChargement.create({
            bonlivraison_id: bonlivraison_id,
            bonchargement_id: bonchargement_id,
            createdBy: req.reqUserId,
            updatedBy: req.reqUserId
        })        

        //ENVOI
        return res.json({message: 'Les détails ont bien été ajoutés'})
        
    } catch (err) {
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
        let dc = await DetailsChargement.findByPk(dcId)       
        if(dc === null){
            return res.status(404).json({message: 'Donnée introuvable'})
        }

        //MISE A JOUR
        await DetailsChargement.update(req.body, {where: {id: dcId}})
        await DetailsChargement.update({updatedBy: req.reqUserId}, {where: {id: dcId}})
        return res.json({message: 'Les détails ont bien été mis à jour'})
        
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
        const dc = await DetailsChargement.findByPk(id)
        if(dc === null){return res.status(404).json({message: 'Donnée introubable'})}

        await DetailsChargement.update({deletedBy: req.reqUserId, suspensionComment: suspensionComment, restoredBy: null}, {where: {id: id}})
        await DetailsChargement.destroy({where: {id: id}})

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
        const dc = await DetailsChargement.findByPk(id, {paranoid: false})
        if(dc === null){return res.status(404).json({message: 'Donnée introubable'})}

        await DetailsChargement.restore({where: {id: id}})
        await DetailsChargement.update({deletedBy: null, suspensionComment: null, restoredBy: req.reqUserId}, {where: {id: id}})

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
        const dc = await DetailsChargement.findByPk(id, {paranoid: false})
        if(dc === null){return res.status(404).json({message: 'Donnée introubable'})}
        
        await DetailsChargement.destroy({where: {id: id}, force: true})

        return res.status(204).json({})

    } catch (err) {
        // console.log(err);
        next(err)
    }
}