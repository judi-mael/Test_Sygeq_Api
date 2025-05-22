/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const jwt = require('jsonwebtoken')
const { Op } = require("sequelize");
const xss = require("xss");

const {TauxForfaitaire,User,DetailsVille,TauxTk}  = require('../models')
const userCtrl = require('./user')

const mailerCtrl = require('./_internal/mailer')
const notifCtrl = require('./notification')

/*****************************/
/*** GESTION DE LA RESSOURCE */
exports.getAll = async (req, res, next) => {
    const statut = req.params.statut;
    try {
        let ttks = []

        if(statut){
            const data = await TauxTk.findAll({paranoid:false, order:[ ['createdAt','desc'] ]})
            if(statut === 'active'){for(const ttk of data) { !ttk.deletedAt && ttks.push(ttk) }}
            else if(statut === 'inactive'){for(const ttk of data) { ttk.deletedAt && ttks.push(ttk) }}
        }else{ttks = await TauxTk.findAll({paranoid:false, order:[ ['createdAt','desc'] ]})}

        return res.json({data: ttks})
        
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
        let ttk = await TauxTk.findByPk(id)
        if(ttk === null){
            return res.status(404).json({message: 'TTK introuvable'})
        }

        let creator = await userCtrl.getUsefulUserData(ttk.createdBy)
        let updator = await userCtrl.getUsefulUserData(ttk.updatedBy)

        //ENVOI
        return res.json({data: {
            id: ttk.id,
            valeurtk: ttk.valeurtk,
            ref: ttk.ref,
            date_debut: ttk.date_debut,
            date_fin: ttk.date_fin,
            etat: ttk.etat,
            createdBy: creator,
            updatedBy: updator,
            createdAt: ttk.createdAt,
            updatedAt: ttk.updatedAt,
            deletedAt: ttk.deletedAt
        }})
        
    } catch (err) {
        next(err)
    }
}

async function renderTarif(distance, prime, difficultee) {
    try {
       const ttk = await TauxTk.findAll();
       const tf = await TauxForfaitaire.findAll();
   
       if(distance <= tf[0].distance){
           const tarif = tf[0].tarifforfait*(1 + difficultee + prime)
        //    console.log('here ->', tarif);
           return tarif
        }
        else{
            const tarif = ttk[0].valeurtk*distance*(1 + difficultee + prime)
            // console.log('here -->', tarif);
           return tarif
       }
    } catch (err) {
        // console.log(err);
       console.log('Failed rendering tarif');
    }
} 

function gRef(id, userId){

    const newDate = new Date()
    const year = newDate.getFullYear()
    const month = ('0' + (newDate.getMonth() + 1)).slice(-2)
    const day = ('0' + newDate.getDate()).slice(-2)
    const ref = 'TTK'+year+userId+month+id+day
    return ref
    
}

exports.add = async (req, res, next) => {
    const date_debut = req.body.date_debut
    const date_fin = req.body.date_fin
    const valeurtk = parseFloat(req.body.valeurtk)

    console.log(valeurtk, ' converted -- vs -- non converted ', req.body.valeurtk);

    //VALIDATION DES DONNEES RECUES
    if(!valeurtk || !date_debut || !date_fin){
        return res.status(400).json({ message: 'Veuillez renseigner tous les champs' })
    }

    try {      

        const ttks = await TauxTk.findAll()
        if(ttks.length>0){
            for (const ttk of ttks) {
                await TauxTk.update({'deletedBy': req.reqUserId, suspensionComment: 'Ecrasé par l\'ajout d\'un nouveau tarif'}, {where: {id: ttk.id}})
                await TauxTk.destroy({where: {id: ttk.id}})
            }
        }

        //CREATION
        let ttk = await TauxTk.create({
            valeurtk: valeurtk, 
            ref: 'N/A', 
            date_debut: date_debut, 
            date_fin: date_fin, 
            createdBy: req.reqUserId,
            updatedBy: req.reqUserId
        })

        await TauxTk.update({ref: gRef(ttk.id, req.reqUserId)}, {where: {id: ttk.id}}) 
        
        const tfs = await TauxForfaitaire.findAll()
        if(tfs.length > 0){
            let tf = await TauxForfaitaire.update({ distance: tfs[0].tarifforfait / valeurtk, updatedBy: req.reqUserId }, {where: {id: tfs[0].id}})
        }

        //UPDATING DETAILSVILLES ON TTK CHANGE
        const dvs = await DetailsVille.findAll()
        if(dvs.length > 0){
            for (const dv of dvs) {
                const tarif = await renderTarif(dv.distance, dv.prime, dv.difficultee)
                console.log(dv.distance, dv.prime, dv.difficultee, tarif);
                await DetailsVille.update({tarif: tarif}, {where: {id: dv.id}})
            }
        }

        const requester = await User.findByPk(req.reqUserId)
        mailerCtrl.mailAllUsersOfAType('MIC', `Nouvelle valeure TK définie ${valeurtk}`, `Le ${requester.type} ${requester.name}, a ajouté une nouvelle valeure TK ${valeurtk}.`)
        notifCtrl.notifyAllUsersOfAType('MIC', `Nouvelle valeure TK définie ${valeurtk}`, `Le ${requester.type} ${requester.name}, a ajouté une nouvelle valeure TK ${valeurtk}.`)
      
        //ENVOI
        return res.json({message: 'Le TTK a bien été créé'})
        
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
        let ttk = await TauxTk.findByPk(id)       
        if(ttk === null){
            return res.status(404).json({message: 'TTK introuvable'})
        }

        //MISE A JOUR
        await TauxTk.update(req.body, {where: {id: id}})
        await TauxTk.update({updatedBy: req.reqUserId}, {where: {id: id}})
        return res.json({message: 'Le TTK a bien été modifié'})
        
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
        const ttk = await TauxTk.findByPk(id)
        if(ttk === null){return res.status(404).json({message: 'Donnée introubable'})}

        await TauxTk.update({deletedBy: req.reqUserId, suspensionComment: suspensionComment, restoredBy: null}, {where: {id: id}})
        await TauxTk.destroy({where: {id: id}})

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
        const ttk = await TauxTk.findByPk(id, {paranoid: false})
        if(ttk === null){return res.status(404).json({message: 'Donnée introubable'})}

        await TauxTk.restore({where: {id: id}})
        await TauxTk.update({deletedBy: null, suspensionComment: null, restoredBy: req.reqUserId}, {where: {id: id}})

        return res.status(204).json({})

    } catch (err) {
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
        const ttk = await TauxTk.findByPk(id, {paranoid: false})
        if(ttk === null){return res.status(404).json({message: 'Donnée introubable'})}
        
        await TauxTk.destroy({where: {id: id}, force: true})

        return res.status(204).json({})

    } catch (err) {
        // console.log(err);
        next(err)
    }
}