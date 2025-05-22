/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const jwt = require('jsonwebtoken')
const { Op, where } = require("sequelize");
const xss = require("xss");

const {User, DetailsVille,TauxTk,TauxForfaitaire} = require('../models')
const userCtrl = require('./user')

const mailerCtrl = require('./_internal/mailer')
const notifCtrl = require('./notification')

/*****************************/
/*** GESTION DE LA RESSOURCE */
exports.getAll = async (req, res, next) => {
    const statut = req.params.statut;
    try {
        let tfs = []

        if(statut){
            const data = await TauxForfaitaire.findAll({paranoid:false, order:[ ['createdAt','desc'] ]})
            if(statut === 'active'){for(const ttk of data) { !ttk.deletedAt && tfs.push(ttk) }}
            else if(statut === 'inactive'){for(const ttk of data) { ttk.deletedAt && tfs.push(ttk) }}
        }else{tfs = await TauxForfaitaire.findAll({paranoid:false, order:[ ['createdAt','desc'] ]})}

        return res.json({data: tfs})
        
    } catch (err) {
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
        let tf = await TauxForfaitaire.findByPk(id)
        if(tf === null){
            return res.status(404).json({message: 'TF introuvable'})
        }

        let creator = await userCtrl.getUsefulUserData(tf.createdBy)
        let updator = await userCtrl.getUsefulUserData(tf.updatedBy)

        //ENVOI
        return res.json({data: {
            id: tf.id,
            dateVigueur: tf.dateVigueur,
            dateExpiration: tf.dateExpiration,
            tarifforfait: tf.tarifforfait,
            distance: tf.distance,
            etat: tf.etat,
            createdBy: creator,
            updatedBy: updator,
            createdAt: tf.createdAt,
            updatedAt: tf.updatedAt,
            deletedAt: tf.deletedAt
        }})
        
    } catch (err) {
        // console.log(err);
        next(err)
    }
}

async function renderTarif(distance, prime, difficultee) {
    try {
        const ttk = await TauxTk.findAll();
        const tf = await TauxForfaitaire.findAll();
        //normalisation
        difficultee = parseFloat(difficultee);
        prime = parseFloat(prime);
        distance = parseFloat(distance);
        const tarifforfait = parseFloat(tf[0].tarifforfait);
        const distanceforfait = parseFloat(tf[0].distance);
        const valeurtk = parseFloat(ttk[0].valeurtk);
        
        if(distance <= distanceforfait){
            const tarif = tarifforfait*(1 + difficultee + prime)
         //    console.log(`Distance ${distance} <= ${distanceforfait} donc : tarif = tarifforfait*(1 + difficultee + prime) = ${tarifforfait}*(1 + ${difficultee} + ${prime}) = ${tarif}`);
            return tarif;
        }
        else{
            const tarif = valeurtk*distance*(1 + difficultee + prime)
         //    console.log(`Distance ${distance} > ${distanceforfait} donc : tarif = valeurtk*distance*(1 + difficultee + prime) = ${valeurtk}*${distance}*(1 + ${difficultee} + ${prime}) = ${tarif}`);
            return tarif;
        }
     } catch (err) {
        console.log('Failed rendering tarif');
     }
}

exports.add = async (req, res, next) => {
    const dateVigueur = req.body.dateVigueur
    const dateExpiration = req.body.dateExpiration
    const tarifforfait = parseFloat(req.body.tarifforfait)

    // console.log(req.body);

    //VALIDATION DES DONNEES RECUES
    if(!dateVigueur || !dateExpiration || !tarifforfait){
        return res.status(400).json({ message: 'Veuillez renseigner tous les champs' })
    }

    try {

        const tfs = await TauxForfaitaire.findAll({where:deletedAt=null})
        if(tfs.length>0){
            for (const tf of tfs) {
                if(tf){
                    await TauxForfaitaire.update({'deletedBy': req.reqUserId, suspensionComment: 'Ecrasé par l\'ajout d\'un nouveau tarif'}, {where: {id: tf.id}})
                    await TauxForfaitaire.destroy({where: {id: tf.id}})
                }
            }
        }
        
        
        const ttks = await TauxTk.findAll({where:deletedAt=null})
        if(ttks.length < 1){return res.status(404).json({message: 'Taux TK valide introuvable'})}
        //CREATION
        let tf = await TauxForfaitaire.create({
            dateVigueur: dateVigueur, 
            dateExpiration: dateExpiration, 
            tarifforfait: tarifforfait, 
            distance: tarifforfait / ttks[0].valeurtk, 
            createdBy: req.reqUserId,
            updatedBy: req.reqUserId
        })
        
        //UPDATING DETAILSVILLES ON TF CHANGE
        const dvs = await DetailsVille.findAll({where:deletedAt=null})
        for (const dv of dvs) {
            const tarif = await renderTarif(dv.distance, dv.prime, dv.difficultee)
            await DetailsVille.update({tarif_produits_blanc: tarif, tarif_gpl: tarif*2.51}, {where: {id: dv.id}})
        }

        // const requester = await User.findByPk(req.reqUserId)
        // mailerCtrl.mailAllUsersOfAType('MIC', `Nouveau tarif forfaitaire défini ${tarifforfait}`, `Le ${requester.type} ${requester.name}, a ajouté un nouveau tarif forfaitaire ${tarifforfait}. La distance zone forfaitaire est donc passée à ${tarifforfait / ttks[0].valeurtk} et les détails villes ont été mis à jour.`)
        // notifCtrl.notifyAllUsersOfAType('MIC', `Nouveau tarif forfaitaire défini ${tarifforfait}`, `Le ${requester.type} ${requester.name}, a ajouté un nouveau tarif forfaitaire ${tarifforfait}. La distance zone forfaitaire est donc passée à ${tarifforfait / ttks[0].valeurtk} et les détails villes ont été mis à jour.`)
        
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
        let tf = await TauxForfaitaire.findByPk(id)       
        if(tf === null){
            return res.status(404).json({message: 'TF introuvable ou désactivé'})
        }

        //MISE A JOUR
        await TauxForfaitaire.update(req.body, {where: {id: id}})
        // await TauxForfaitaire.update({updatedBy: req.reqUserId}, {where: {id: id}})
        return res.json({message: 'Le TF a bien été modifié'})
        
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
        const tf = await TauxForfaitaire.findByPk(id)
        if(tf === null){return res.status(404).json({message: 'Donnée introubable'})}

        await TauxForfaitaire.update({deletedBy: req.reqUserId, suspensionComment: suspensionComment, restoredBy: null}, {where: {id: id}})
        await TauxForfaitaire.destroy({where: {id: id}})

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
        const tf = await TauxForfaitaire.findByPk(id, {paranoid: false})
        if(tf === null){return res.status(404).json({message: 'Donnée introubable'})}

        await TauxForfaitaire.restore({where: {id: id}})
        await TauxForfaitaire.update({deletedBy: null, suspensionComment: null, restoredBy: req.reqUserId}, {where: {id: id}})

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
        const tf = await TauxForfaitaire.findByPk(id, {paranoid: false})
        if(tf === null){return res.status(404).json({message: 'Donnée introubable'})}
        
        await TauxForfaitaire.destroy({where: {id: id}, force: true})

        return res.status(204).json({})

    } catch (err) {
        // console.log(err);
        next(err)
    }
}