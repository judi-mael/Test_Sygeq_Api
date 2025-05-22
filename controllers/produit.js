/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const jwt = require('jsonwebtoken')
const { Op } = require("sequelize");
const xss = require("xss");

const {User, Produit} = require('../models')
const userCtrl = require('./user')

const mailerCtrl = require('./_internal/mailer')
const notifCtrl = require('./notification')

/*****************************/
/*** GESTION DE LA RESSOURCE */
exports.getAll = (req, res, next) => {
    Produit.findAll({paranoid:req.reqUserType=="MIC" ?false:true, order:[ ['createdAt','desc'] ]})
        .then(produits => res.json({data: produits,nbr:produits.length}))
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
        let produit = await Produit.findByPk(id, {paranoid: false})
        if(produit === null){
            return res.status(404).json({message: 'Produit introuvable ou désactivé'})
        }

        let creator = await userCtrl.getUsefulUserData(produit.createdBy)
        let updator = await userCtrl.getUsefulUserData(produit.updatedBy)

        //ENVOI
        return res.json({data: {
            id: produit.id,
            nom: produit.nom,
            hscode: produit.hscode,
            unite: produit.unite,
            type: produit.type,
            etat: produit.etat,
            createdBy: creator,
            updatedBy: updator,
            createdAt: produit.createdAt,
            updatedAt: produit.updatedAt,
            deletedAt: produit.deletedAt
        }})
        
    } catch (err) {
        next(err)
    }
}

exports.getByName = async (req, res, next) => {
    let nom = xss(req.params.nom)

    //VALIDATION DES DONNEES RECUES
    if(!nom){
        return res.status(400).json({ message: 'Parametre(s) manquant(s)' })
    }

    try {
        //RECUPERATION
        let produit;
        let produits = await Produit.findAll({paranoid: false});
        for (const prod of produits) {
            prod.nom.toLowerCase().replaceAll(' ','') === nom.toLowerCase().replaceAll(' ','') ? produit=prod : false
        }
        
        if(!produit){
            return res.status(404).json({message: 'Produit introuvable ou désactivé'})
        }

        let creator = await userCtrl.getUsefulUserData(produit.createdBy)
        let updator = await userCtrl.getUsefulUserData(produit.updatedBy)

        //ENVOI
        return res.json({data: {
            id: produit.id,
            nom: produit.nom,
            hscode: produit.hscode,
            unite: produit.unite,
            type: produit.type,
            etat: produit.etat,
            createdBy: creator,
            updatedBy: updator,
            createdAt: produit.createdAt,
            updatedAt: produit.updatedAt,
            deletedAt: produit.deletedAt
        }})
        
    } catch (err) {
        next(err)
    }
}

exports.add = async (req, res, next) => {
    const nom = xss(req.body.nom)
    const type = xss(req.body.type)
    const unite = xss(req.body.unite)
    const hscode = xss(req.body.hscode)

    // console.log(req.body);

    //VALIDATION DES DONNEES RECUES
    if(!nom || !type || !unite || !hscode){
        return res.status(400).json({ message: 'Veuillez renseigner tous les champs' })
    }

    try {      
        const produitCheck = await Produit.findOne({where: {nom: nom}})
        if(produitCheck !== null){return res.status(409).json({message: `${nom} existe déjà`})}

        //CREATION
        let produit = await Produit.create({
            nom: nom, 
            hscode: hscode, 
            type: type, 
            unite: unite,
            createdBy: req.reqUserId,
            updatedBy: req.reqUserId
        })        


        // await Produit.update({hscode: 'P00'+produit.id}, {where: {id: produit.id}})

        const requester = await User.findByPk(req.reqUserId)
        mailerCtrl.mailAllUsersOfAType('MIC', `Le produit ${produit.nom} a bien été ajouté`, `Le ${requester.type} ${requester.name}, a ajouté le produit ${produit.nom} de type ${produit.type}.`)
        notifCtrl.notifyAllUsersOfAType('MIC', `Le produit ${produit.nom} a bien été ajouté`, `Le ${requester.type} ${requester.name}, a ajouté le produit ${produit.nom} de type ${produit.type}.`)

        //ENVOI
        return res.json({message: 'Le produit a bien été créé'})
        
    } catch (err) {
        console.log(err)
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
        let produit = await Produit.findByPk(id)       
        if(produit === null){
            return res.status(404).json({message: 'Produit introuvable ou désactivé'})
        }

        //MISE A JOUR DU BC
        await Produit.update(req.body, {where: {id: id}})
        await Produit.update({updatedBy: req.reqUserId}, {where: {id: id}})
        return res.json({message: 'Le produit a bien été modifié'})
        
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
        const produit = await Produit.findByPk(id)
        if(produit === null){return res.status(404).json({message: 'Donnée introubable'})}

        await Produit.update({deletedBy: req.reqUserId, suspensionComment: suspensionComment, restoredBy: null}, {where: {id: id}})
        await Produit.destroy({where: {id: id}})

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
        const produit = await Produit.findByPk(id, {paranoid: false})
        if(produit === null){return res.status(404).json({message: 'Donnée introubable'})}

        await Produit.restore({where: {id: id}})
        await Produit.update({deletedBy: null, suspensionComment: null, restoredBy: req.reqUserId}, {where: {id: id}})

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
        const produit = await Produit.findByPk(id, {paranoid: false})
        if(produit === null){return res.status(404).json({message: 'Donnée introubable'})}
        
        await Produit.destroy({where: {id: id}, force: true})

        return res.status(204).json({})

    } catch (err) {
        // console.log(err);
        next(err)
    }
}