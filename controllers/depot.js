/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const jwt = require('jsonwebtoken')
const { Op } = require("sequelize");
const xss = require("xss");

const {Ville,DetailsVille,TauxTk,TauxForfaitaire,User,Depot} = require('../models')
const userCtrl = require('./user')
const directory = process.env.SERVER_DIR
const path = require('path')
let fs = require('fs');
const mailerCtrl = require('./_internal/mailer')
const notifCtrl = require('./notification')
var generator = require('generate-password');
const { fileSaver } = require('./_internal/filesaver');
// const { fileSaver } = require('./_internal/filesaver');
const customSymbols = '!#$&*+,.?@[\\]^_{|}~';


/*****************************/
/*** GESTION DE LA RESSOURCE */
exports.getAll = (req, res, next) => {
    
    Depot.findAll({paranoid: false,
            include: [
                {model: DetailsVille, include: [{model: Ville}]}
            ],
            order:[ ['createdAt','desc'] ]}
        )
        .then(depots => res.json({data: depots, nbr: depots.length}))
        .catch(err => {
            console.log(err);
            next(err)
        })
}
exports.getAllByType = (req, res, next) => {
    let values = req.params.type
    Depot.findAll({where: {type: values},paranoid: false,
            include: [
                {model: DetailsVille, include: [{model: Ville}]}
            ],
            order:[ ['createdAt','desc'] ]}
        )
        .then(depots => res.json({data: depots}))
        .catch(err => {
            console.log(err);
            next(err)
        })
}


exports.get = async (req, res, next) => {
    let id = parseInt(req.params.id)
    console.log('====================================');
    console.log(id);
    console.log('====================================');
    //VALIDATION DES DONNEES RECUES
    if(!id){
        return res.status(400).json({ message: 'Parametre(s) manquant(s)' })
    }

    try {
        //RECUPERATION
        let depot = await Depot.findByPk(id, {paranoid: false})
        if(depot === null){
            return res.status(404).json({message: 'Depot introuvable ou désactivé. \n Activez-le pour pouvoir le modifier'})
        }

        let creator = await userCtrl.getUsefulUserData(depot.createdBy)
        let updator = await userCtrl.getUsefulUserData(depot.updatedBy)

        //ENVOI
        return res.json({data: {
            id: depot.id,
            numdepotdouanier: depot.numdepotdouanier,
            agrement: depot.agrement,
            document_agrement: depot.document_agrement,
            ifu: depot.ifu,
            document_ifu: depot.document_ifu,
            dateVigueur: depot.dateVigueur,
            dateExpiration: depot.dateExpiration,
            nom: depot.nom,
            adresse: depot.adresse,
            type: depot.type,
            longitude: depot.longitude,
            latitude: depot.latitude,
            type: depot.type,
            etat: depot.etat,
            createdBy: creator,
            DetailsVilles: await DetailsVille.findAll({where: {depot_id: id}, include: {model: Ville}}),
            updatedBy: updator,
            createdAt: depot.createdAt,
            updatedAt: depot.updatedAt,
            deletedAt: depot.deletedAt
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
        let depot;
        let depots = await Depot.findAll({paranoid: false, include: [
            {model: DetailsVille, include: [{model: Ville}]}
        ]});
        for (const dep of depots) {
            dep.nom.toLowerCase().replaceAll(' ','') === nom.toLowerCase().replaceAll(' ','') ? depot=dep : false
        }
        
        if(!depot){
            return res.status(404).json({message: 'Depot introuvable ou désactivé. \n Activez-le pour pouvoir le modifier'})
        }

        //ENVOI
        return res.json(depot)
        
    } catch (e) {
        console.log(e);
        next(err)
    }
}

async function renderTarif(distance, prime, difficultee) {
 try {
    const ttks = await TauxTk.findAll();
    const tfs = await TauxForfaitaire.findAll();

    if(distance <= tfs[0].distance){
        const tarif = tfs[0].tarifforfait*(1 + difficultee + prime)
        return tarif
    }
    else{
        const tarif = ttks[0].valeurtk*distance*(1 + difficultee + prime)
        return tarif
    }
 } catch (err) {
    // console.log(err);
    console.log('Failed rendering tarif');
 }
}

exports.add = async (req, res, next) => {
    const numdepotdouanier = xss(req.body.numdepotdouanier)
    const agrement = xss(req.body.agrement)
    const document_agrement = xss(req.body.document_agrement)
    const ifu = xss(req.body.ifu)
    const document_ifu = xss(req.body.document_ifu)
    const dateVigueur = req.body.dateVigueur
    const dateExpiration = req.body.dateExpiration
    const nom = xss(req.body.nom)
    const longitude = xss(req.body.longitude)
    const latitude = xss(req.body.latitude)
    const ville_id = parseInt(req.body.ville_id)
    const adresse = xss(req.body.adresse)
    const name = xss(req.body.name)
    const type = xss(req.body.type)
    const username = xss(req.body.username.replace(/\s+/g, ''))
    const email = xss(req.body.email)

    // console.log(req.body);

    //VALIDATION DES DONNEES RECUES
    if(
        !numdepotdouanier || !agrement || !ifu || !dateVigueur || !dateExpiration ||
        !nom || !adresse || !name || !username || !email || !ville_id || !type || !longitude || !latitude 
    ){
        // console.log('here 1');
        return res.status(400).json({ message: 'Veuillez renseigner tous les champs' })
    }

    try {

        //VERIFICATION D'EXISTENCE
        let user = await User.findOne({where: {[Op.or]: [{email: email}, {username: username}]}})
        let depot = await Depot.findOne({where: {[Op.or]: [{agrement: agrement}, {ifu: ifu}]}})
        let numdepot = await Depot.findOne({where: {[Op.or]: [{numdepotdouanier: numdepotdouanier},]}})
        let checkDepotByName = await Depot.findOne({where: {nom: nom}})
        if(user !== null){
            return res.status(409).json({ message: `Identifiant / email déjà utilisé` })
            
        } 
        // else if(depot !== null){
        //     return res.status(409).json({ message: `Agrement / ifu déjà utilisé` })
        // } 
        else if(numdepot !== null){
            return res.status(409).json({ message: `Numéro  dépôt douanier déjà utilisé` })
        } 
        else if(checkDepotByName !== null){
            return res.status(409).json({ message: `Le dépôt ${nom} existe déjà` })
        }
        // stockage des fichiers
        const AgrementdocName =  fileSaver(document_agrement,agrement,"agrement")
        const IfudocName = fileSaver(document_ifu,ifu,"ifu")

        //CREATION
        let newDepot = await Depot.create({
            numdepotdouanier: numdepotdouanier,
            agrement: agrement,
            document_agrement: AgrementdocName,
            ifu: ifu,
            document_ifu: IfudocName,
            dateVigueur: dateVigueur, 
            dateExpiration: dateExpiration, 
            nom: nom,
            longitude: longitude,
            latitude: latitude,
            type: type,
            ville_id: ville_id,
            adresse: adresse, 
            createdBy: req.reqUserId,
            updatedBy: req.reqUserId
        })

        let generatedPass = generator.generate({lenght: 12, numbers: true,symbols: customSymbols,})

        let newUser = await User.create({
            name: name,
            username: username,
            email: email,
            password: generatedPass,
            type: 'Depot',
            role: 'admin',
            adresse: 'N/A',
            depot_id: newDepot.id,
            createdBy: req.reqUserId,
            updatedBy: req.reqUserId
        })
        
        //SEND EMAIL
        const requester = await User.findByPk(req.reqUserId)
        mailerCtrl.sendAccountConfirmationEmail(newUser.name, newUser.username, newUser.email, generatedPass)

        // mailerCtrl.mailAllUsersOfAType('MIC', `Le dépôt ${newDepot.nom} a bien été ajouté`, `Le ${requester.type} ${requester.name}, a ajouté le dépôt ${newDepot.nom} ainsi que son utilisateur ${newUser.name}.`)
        // notifCtrl.notifyAllUsersOfAType('MIC', `Le dépôt ${newDepot.nom} a bien été ajouté`, `Le ${requester.type} ${requester.name}, a ajouté le dépôt ${newDepot.nom} ainsi que son utilisateur ${newUser.name}.`)

        //ENVOI
        return res.json({message: 'Le depot et son utilisateur ont bien été ajoutés'})
        
    } catch (err) {
        // console.log(err)
        next(err)
    }
}

exports.updateCityDetails = async (req, res, next) => {
    const numdepotdouanier = xss(req.body.numdepotdouanier)
    // const numdepotdouanier = xss(req.body.numdepotdouanier)
    // const agrement = xss(req.body.agrement)
    // const ifu = xss(req.body.ifu)
    // const dateVigueur = req.body.dateVigueur
    // const dateExpiration = req.body.dateExpiration
    // const nom = xss(req.body.nom)
    // const ville_id = parseInt(req.body.ville_id)
    // const adresse = xss(req.body.adresse)
    // const name = xss(req.body.name)
    // const username = xss(req.body.username)
    // const email = xss(req.body.email)
    const detailsVilles = req.body.detailsVilles

    console.log(req.body);

    //VALIDATION DES DONNEES RECUES
    if(!de){
        // console.log('here 1');
        return res.status(400).json({ message: 'Veuillez renseigner tous les champs' })
    }

    for (const dv of detailsVilles) {
        if(!parseInt(dv.ville_id) || !parseFloat(dv.difficultee) || !parseFloat(dv.distance) || !parseFloat(dv.prime)){
            // console.log('here');
            return res.status(400).json({message: 'Un ou plusieurs détails villes sont incomplet ou invalides'})
        }
    }

    try {

        //VERIFICATION D'EXISTENCE
        let user = await User.findOne({where: {[Op.or]: [{email: email}, {username: username}]}})
        let depot = await Depot.findOne({where: {[Op.or]: [{agrement: agrement}, {ifu: ifu}]}})
        let checkDepotByName = await Depot.findOne({where: {nom: nom}})
        if(user !== null){
            return res.status(409).json({ message: `Identifiant / email déjà utilisé` })
            
        } else if(depot !== null){
            return res.status(409).json({ message: `Agrement / ifu déjà utilisé` })
        } else if(checkDepotByName !== null){
            return res.status(409).json({ message: `Le dépôt ${nom} existe déjà` })
        }

        //CREATION
        let newDepot = await Depot.create({
            numdepotdouanier: numdepotdouanier,
            agrement: agrement, 
            ifu: ifu, 
            dateVigueur: dateVigueur, 
            dateExpiration: dateExpiration, 
            nom: nom,
            ville_id: ville_id,
            adresse: adresse, 
            createdBy: req.reqUserId,
            updatedBy: req.reqUserId
        })

        for (const dv of detailsVilles) {
            const oldDv = await DetailsVille.findAll({where: {[Op.and]: [{depot_id: newDepot.id}, {ville_id: dv.ville_id}]}})
            if(oldDv.length>0){ await DetailsVille.destroy({where: {[Op.and]: [{depot_id: dv.depot_id}, {ville_id: dv.ville_id}]}}) }

            console.log('Tarif here: ', await renderTarif(parseFloat(dv.distance), parseFloat(dv.prime), parseFloat(dv.difficultee)));

            await DetailsVille.create({
                depot_id: newDepot.id,
                ville_id: dv.ville_id,
                difficultee: dv.difficultee,
                distance: dv.distance,
                prime: dv.prime,
                tarif: await renderTarif(parseFloat(dv.distance), parseFloat(dv.prime), parseFloat(dv.difficultee)),
                createdBy: req.reqUserId,
                updatedBy: req.reqUserId,
            })
        }

        let generatedPass = generator.generate({lenght: 12, numbers: true,symbols: customSymbols,})

        let newUser = await User.create({
            name: name,
            username: username,
            email: email,
            password: generatedPass,
            type: 'Depot',
            role: 'admin',
            adresse: 'N/A',
            depot_id: newDepot.id,
            createdBy: req.reqUserId,
            updatedBy: req.reqUserId
        })
        
        //SEND EMAIL
        mailerCtrl.sendAccountConfirmationEmail(newUser.name, newUser.username, newUser.email, generatedPass)

        const requester = await User.findByPk(req.reqUserId)
        mailerCtrl.mailAllUsersOfAType('MIC', `Le dépôt ${newDepot.nom} a bien été ajouté`, `Le ${requester.type} ${requester.name}, a ajouté le dépôt ${newDepot.nom} ainsi que son utilisateur ${newUser.name}.`)
        notifCtrl.notifyAllUsersOfAType('MIC', `Le dépôt ${newDepot.nom} a bien été ajouté`, `Le ${requester.type} ${requester.name}, a ajouté le dépôt ${newDepot.nom} ainsi que son utilisateur ${newUser.name}.`)

        //ENVOI
        return res.json({message: 'Le depot et son utilisateur ont bien été ajoutés'})
        
    } catch (err) {
        // console.log(err)
        next(err)
    }
}

exports.update = async (req, res, next) => {
    // req.body.ifu ="je suis body"
    // console.log(req.body.ifu);
    let id = parseInt(req.params.id)

    //VALIDATION DES DONNEES RECUES
    if(!id){
        return res.status(400).json({ message: 'Parametre(s) manquant(s)' })
    }

    try {
        //RECUPERATION
        let depot = await Depot.findByPk(id)       
        if(depot === null){
            return res.status(404).json({message: 'Depot introuvable ou désactivé. \n Activez-le pour pouvoir le modifier'})
        }

        //MISE A JOUR
        // const udpData = req.body
        // delete udpData["document_agrement"]
        // delete udpData["document_ifu"]

        // await Depot.update(req.body, {where: {id: id}})
        // await Depot.update(udpData, {where: {id: id}})
        if(req.body.document_agrement){
            const FileBufferb = Buffer.from(req.body.document_agrement, 'base64')
            const AgrementdocName = fileSaver(req.body.document_agrement,req.body.agrement,"agrement")
            fs.writeFileSync(directory + AgrementdocName, FileBufferb);
            // await Depot.update({document_agrement: AgrementdocName}, {where: {id: id}})
            req.body.document_agrement = AgrementdocName;
        }
        if(req.body.document_ifu){
            const IfudocName = fileSaver(req.body.document_ifu,req.body.ifu,"ifu")
            const FileBuffer = Buffer.from(req.body.document_ifu, 'base64')
            fs.writeFileSync(directory + IfudocName, FileBuffer);
            // await Depot.update({document_ifu: IfudocName}, {where: {id: id}})
            
            req.body.document_ifu = IfudocName;
        }
        // console.log(req.body)
        await Depot.update(req.body, {where: {id: id}})
        await Depot.update({updatedBy: req.reqUserId}, {where: {id: id}})
        // console.log("je suis en bas du code ");
        return res.status(204).json({})
        
    } catch (err) {
        // console.log("--------> err",err);
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
        const depot = await Depot.findByPk(id)
        if(depot === null){return res.status(404).json({message: 'Donnée introubable'})}

        await Depot.update({deletedBy: req.reqUserId, suspensionComment: suspensionComment, restoredBy: null}, {where: {id: id}})
        await Depot.destroy({where: {id: id}})

        await User.update({deletedBy: req.reqUserId, suspensionComment: suspensionComment, restoredBy: null},{where: {depot_id: id}})
        await User.destroy({where: {depot_id: id}})

        return res.status(204).json({})
        
    } catch (err) {
        // console.log(err);
        return next(err)
    }

}

exports.untrash = async (req, res, next) => {
    let id = parseInt(req.params.id)

    //VALIDATION DES DONNEES RECUES
    if(!id){
        return res.status(400).json({ message: 'Parametre(s) manquant(s)' })
    }

    try {
        const depot = await Depot.findByPk(id, {paranoid: false})
        if(depot === null){return res.status(404).json({message: 'Donnée introubable'})}

        await Depot.restore({where: {id: id}})
        await Depot.update({deletedBy: null, suspensionComment: null, restoredBy: req.reqUserId}, {where: {id: id}})

        await User.restore({where: {depot_id: id}})
        await User.update({deletedBy: null, suspensionComment: null, restoredBy: req.reqUserId}, {where: {depot_id: id}})

        return res.status(204).json({})

    } catch (err) {
        // console.log(err);
        return next(err)
    }
}

exports.delete = async (req, res, next) => {
    let id = parseInt(req.params.id)

    //VALIDATION DES DONNEES RECUES
    if(!id){
        return res.status(400).json({ message: 'Parametre(s) manquant(s)' })
    }

    try {
        const depot = await Depot.findByPk(id, {paranoid: false})
        if(depot === null){return res.status(404).json({message: 'Donnée introubable'})}
        
        await Depot.destroy({where: {id: id}, force: true})

        return res.status(204).json({})

    } catch (err) {
        // console.log(err);
        return next(err)
    }
}