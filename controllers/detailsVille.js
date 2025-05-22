/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const jwt = require('jsonwebtoken')
const { Op } = require("sequelize");
const xss = require("xss");


const {User, TauxTk,TauxForfaitaire,Ville,DetailsVille} = require('../models')
const userCtrl = require('./user')
const mailerCtrl = require('./_internal/mailer')
const notifCtrl = require('./notification')

/*****************************/
/*** GESTION DE LA RESSOURCE */
exports.getByDepot = (req, res, next) => {
    const id = parseInt(req.params.depotId)
    const type = xss(req.params.type)
    if(!id){return req.status(400).json({message: 'Vous devez spécifier l\'identifiant du dépot concerné'})}

    const terms = {where: {depot_id: id}, paranoid: false, order:[ ['createdAt','desc'] ]}

    DetailsVille.findAll(terms)
        .then(dvs => res.json({data: dvs})) 
        .catch(err => res.status(500).json({message: "Une erreur s'est produite veuillez réessayer",err}))
}

exports.getByVille = (req, res, next) => {
    const id = parseInt(req.params.villeId)
    const type = xss(req.params.type)
    if(!id){return req.status(400).json({message: 'Vous devez spécifier l\'identifiant de la ville concernée'})}
    
    const terms = {where: {ville_id: id}, paranoid: false, order:[ ['createdAt','desc'] ]}

    DetailsVille.findAll({where: {ville_id: id}, paranoid: false, order:[ ['createdAt','desc'] ]})
        .then(dvs => res.json({data: dvs}))
        .catch(err => res.status(500).json({message: "Une erreur s'est produite veuillez réessayer",err}))
}

exports.get = async (req, res, next) => {
    let id = parseInt(req.params.id)

    //VALIDATION DES DONNEES RECUES
    if(!id){
        return res.status(400).json({ message: 'Parametre(s) manquant(s)' })
    }

    try {
        //RECUPERATION
        let dv = await DetailsVille.findByPk(id, {paranoid: false})
        if(dv === null){
            return res.status(404).json({message: 'Donnée introuvable'})
        }

        let ville = await Ville.findByPk(dv.ville_id)
        let creator = await userCtrl.getUsefulUserData(dv.createdBy)
        let updator = await userCtrl.getUsefulUserData(dv.updatedBy)

        //ENVOI
        return res.json({data: {
            id: dv.id,
            depot: dv.depot,
            distance: dv.distance,
            ville: ville,
            difficultee: dv.difficultee,
            prime: dv.prime,
            tarif_produits_blanc: dv.tarif_produits_blanc,
            tarif_gpl: dv.tarif_gpl,
            createdBy: creator,
            updatedBy: updator,
            createdAt: dv.createdAt,
            updatedAt: dv.updatedAt,
            deletedAt: dv.deletedAt
        }})
        
    } catch (err) {
        console.log(err)
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
    const depotId = req.params.depotId
    const dvs = req.body.dvs
    
    console.log('depotId donne-->',req.body);
    // console.log('dvs.length -->',req.body.dvs.length);

    if(!depotId || !dvs){return res.status(400).json({message: 'Parametre(s) ou donnée(s) manquant(s)'})}
    else if(!Array.isArray(dvs)){return res.status(400).json({message: 'Mauvais format de la liste des détails'})}
    // else if(dvs.length !== 88){return res.status(401).json({message: '77 détails requis mais '+dvs.length+' trouvés'})}

    for (const dv of dvs) {
        if(!dv || !dv.ville_id || !dv.difficultee || !dv.distance || !dv.prime){return res.status(400).json({message: "Un ou plusieurs éléments de la liste de détails est incomplet ou mal formatté"})}
    }

    try {      

        const depotCheck = await Depot.findByPk(depotId)
        if(!depotCheck){return res.status(404).json({message: 'Dépôt introuvable ou désactivé.'})}

        for (const dv of dvs) {
            const villeCheck = await Ville.findByPk(dv.ville_id)
            if(!villeCheck){return res.status(404).json({message: 'Une ou plusieurs ville(s) introuvable(s)'})}
        }

        //NETTOYAGE DES ANCIENNES DONNES CONCERNANT DE DEPOT
        await DetailsVille.destroy({where: {depot_id: depotId}})

        for (const dv of dvs) {
            let tarif = await renderTarif(dv.distance, dv.prime, dv.difficultee)
            //CREATION
            await DetailsVille.create({
                depot_id: depotId,
                ville_id: parseInt(dv.ville_id),
                difficultee: parseFloat(dv.difficultee),
                distance: parseFloat(dv.distance),
                prime: parseFloat(dv.prime),
                tarif_produits_blanc: tarif,
                tarif_gpl: tarif*2.51,
                tarif_gpl_vrac: tarif*1.79,
                createdBy: req.reqUserId,
                updatedBy: req.reqUserId
            })
        }

        //NOTIF TO ALL MIC
        // const ville = await Ville.findByPk(ville_id)
        // const depot = await Ville.findByPk(depot_id)
        // mailerCtrl.mailAllUsersOfAType('MIC', `Les détails ont bien été ajouté`, `Le ${user.type} ${user.name}, a ajouté les détails logistiques entre le depot ${depot.nom} et la vile ${ville.nom}.`)
        // notifCtrl.notifyAllUsersOfAType('MIC', `Les détails ont bien été ajouté`, `Le ${user.type} ${user.name}, a ajouté les détails logistiques entre le depot ${depot.nom} et la vile ${ville.nom}.`)

        //ENVOI
        return res.status(204).json({})
        
    } catch (err) {
        console.log(err);
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
        let dv = await DetailsVille.findByPk(id)       
        if(dv === null){
            return res.status(404).json({message: 'Donnée introuvable'})
        }

        //MISE A JOUR
        await DetailsVille.update(req.body, {where: {id: id}})
        await DetailsVille.update({updatedBy: req.reqUserId}, {where: {id: id}})
        return res.json({message: 'Les détails ont bien été mis à jour'})
        
    } catch (err) {
        next(err)
    }
}
 exports.addTarifGplVrac= async(req, res, next)=>{
    const allDetailVill = await DetailsVille.findAll()
    try {
        
        for(const detail of allDetailVill){
            const tarif = detail.tarif_produits_blanc
            await DetailsVille.update({tarif_gpl_vrac: (tarif*1.79).toFixed(2)}, {where: {id: detail.id}})
        }
    return res.json({message: 'Les tarifs ont bien été mis à jour'})
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
        const dv = await DetailsVille.findByPk(id)
        if(dv === null){return res.status(404).json({message: 'Donnée introubable'})}

        await DetailsVille.update({deletedBy: req.reqUserId, suspensionComment: suspensionComment, restoredBy: null}, {where: {id: id}})
        await DetailsVille.destroy({where: {id: id}})

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
        const dv = await DetailsVille.findByPk(id, {paranoid: false})
        if(dv === null){return res.status(404).json({message: 'Donnée introubable'})}

        await DetailsVille.restore({where: {id: id}})
        await DetailsVille.update({deletedBy: null, suspensionComment: null, restoredBy: req.reqUserId}, {where: {id: id}})

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
        const dv = await DetailsVille.findByPk(id, {paranoid: false})
        if(dv === null){return res.status(404).json({message: 'Donnée introubable'})}
        
        await DetailsVille.destroy({where: {id: id}, force: true})

        return res.status(204).json({})

    } catch (err) {
        next(err)
    }
}




