/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const jwt = require('jsonwebtoken')
const { Op } = require("sequelize");
const xss = require("xss");

const {DetailsLivraison,DetailsLivraisonBarcode,Compartiment} = require('../models')
const userCtrl = require('./user')

/*****************************/
/*** GESTION DE LA RESSOURCE */
exports.getAll = async (req, res, next) => {
    try {
        const dlbs = await DetailsLivraisonBarcode.findAll({paranoid: false, order:[ ['createdAt','desc'] ]})
        return res.status(500).json({data: dlbs})
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
        let dlb = await DetailsLivraisonBarcode.findByPk(id, {paranoid: false})
        if(dlb === null){
            return res.status(404).json({message: 'Donnée introuvable'})
        }

        let detailslivraison = await DetailsLivraison.findByPk(dlb.detailslivraison_id)
        let compartiment = await Compartiment.findByPk(dlb.compartiment_id)
        let creator = await userCtrl.getUsefulUserData(dlb.createdBy)
        let updator = await userCtrl.getUsefulUserData(dlb.updatedBy)

        //ENVOI
        return res.json({data: {
            id: dlb.id,
            detailslivraison: detailslivraison,
            qty: dlb.qty,
            barcode: dlb.barcode,
            compartiment: compartiment,
            etat: dlb.etat,
            createdBy: creator,
            updatedBy: updator,
            createdAt: dlb.createdAt,
            updatedAt: dlb.updatedAt,
            deletedAt: dlb.deletedAt
        }})
        
    } catch (err) {
        // console.log(err);
        next(err)
    }
}

exports.add = async (req, res, next) => {
    let {
        detailslivraison_id, qty, barcode, compartiment_id
    } = req.body

    //FORMATAGE
    detailslivraison_id = parseInt(detailslivraison_id)
    qty = parseInt(qty)
    compartiment_id = parseInt(compartiment_id)
    barcode = xss(barcode)

    //VALIDATION DES DONNEES RECUES
    if(!detailslivraison_id || !qty || !barcode || !compartiment_id){
        return res.status(400).json({ message: 'Veuillez renseigner tous les champs' })
    }

    try {      
        //CREATION
        let dlb = await DetailsLivraisonBarcode.create({
            detailslivraison_id: detailslivraison_id,
            qty: qty,
            barcode: barcode,
            compartiment_id: compartiment_id,
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
        let dlb = await DetailsLivraisonBarcode.findByPk(id)       
        if(dlb === null){
            return res.status(404).json({message: 'Donnée introuvable'})
        }

        //MISE A JOUR
        await DetailsLivraisonBarcode.update(req.body, {where: {id: id}})
        await DetailsLivraisonBarcode.update({updatedBy: req.reqUserId}, {where: {id: id}})
        return res.json({message: 'Les détails ont bien été mis à jour'})
        
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
        const dlb = await DetailsLivraisonBarcode.findByPk(id)
        if(dlb === null){return res.status(404).json({message: 'Donnée introubable'})}

        await DetailsLivraisonBarcode.update({deletedBy: req.reqUserId, suspensionComment: suspensionComment, restoredBy: null}, {where: {id: id}})
        await DetailsLivraisonBarcode.destroy({where: {id: id}})

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
        const dlb = await DetailsLivraisonBarcode.findByPk(id, {paranoid: false})
        if(dlb === null){return res.status(404).json({message: 'Donnée introubable'})}

        await DetailsLivraisonBarcode.restore({where: {id: id}})
        await DetailsLivraisonBarcode.update({deletedBy: null, suspensionComment: null, restoredBy: req.reqUserId}, {where: {id: id}})

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
        const dlb = await DetailsLivraisonBarcode.findByPk(id, {paranoid: false})
        if(dlb === null){return res.status(404).json({message: 'Donnée introubable'})}
        
        await DetailsLivraisonBarcode.destroy({where: {id: id}, force: true})

        return res.status(204).json({})

    } catch (err) {
        // console.log(err);
        next(err)
    }
}