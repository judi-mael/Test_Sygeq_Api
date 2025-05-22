/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const jwt = require('jsonwebtoken')
const { Op } = require("sequelize");
const xss = require("xss");

const {User,Station,Marketer} = require('../models')
const userCtrl = require('./user')

const mailerCtrl = require('./_internal/mailer')
const notifCtrl = require('./notification')
var generator = require('generate-password');
const customSymbols = '!#$&*+,.?@[\\]^_{|}~';

const path = require('path')
let fs = require('fs');
const directory = process.env.SERVER_DIR
/*****************************/
/*** GESTION DE LA RESSOURCE */
exports.getAll = (req, res, next) => {
    Marketer.findAll({ paranoid: false, order: [['createdAt', 'desc']] })
        .then(marketers => res.json({ data: marketers,nbr:marketers.length }))
        .catch(err => next(err))
}

exports.get = async (req, res, next) => {
    let id = parseInt(req.params.id)

    //VALIDATION DES DONNEES RECUES
    if (!id) {
        return res.status(400).json({ message: 'Parametre(s) manquant(s)' })
    }

    try {
        //RECUPERATION
        let marketer = await Marketer.findByPk(id, { paranoid: false })
        if (marketer === null) {
            return res.status(404).json({ message: 'Marketer introuvable' })
        }

        let creator = await userCtrl.getUsefulUserData(marketer.createdBy)
        let updator = await userCtrl.getUsefulUserData(marketer.updatedBy)

        //ENVOI
        return res.json({
            data: {
                id: marketer.id,
                agrement: marketer.agrement,
                ifu: marketer.ifu,
                dateVigueur: marketer.dateVigueur,
                dateExpiration: marketer.dateExpiration,
                nom: marketer.nom,
                adresse: marketer.adresse,
                identite: marketer.identite,
                etat: marketer.etat,
                createdBy: creator,
                updatedBy: updator,
                createdAt: marketer.createdAt,
                updatedAt: marketer.updatedAt,
                deletedAt: marketer.deletedAt
            }
        })

    } catch (err) {
        // console.log(err);
        next(err)
    }
}

exports.add = async (req, res, next) => {
    const agrement = xss(req.body.agrement)
    const document_agrement = xss(req.body.document_agrement)
    const ifu = xss(req.body.ifu)
    const document_ifu = xss(req.body.document_ifu)
    const dateVigueur = xss(req.body.dateVigueur)
    const dateExpiration = xss(req.body.dateExpiration)
    const nom = xss(req.body.nom)
    const name = xss(req.body.name)
    const username = xss(req.body.username.replace(/\s+/g, ''))
    const email = xss(req.body.email)
    const adresse = xss(req.body.adresse)

   

    //VALIDATION DES DONNEES RECUES
    if (
        !agrement || !ifu || !dateVigueur || !dateExpiration ||
        !nom || !adresse || !name || !username || !email
    ) {
        return res.status(400).json({ message: 'Veuillez renseigner tous les champs' })
    }

    try {

        //VERIFICATION D'EXISTENCE
        let user = await User.findOne({ where: { [Op.or]: [{ email: email }, { username: username }] } })
        let marketer = await Marketer.findOne({ where: { [Op.or]: [{ agrement: agrement }, { ifu: ifu }] } })
        if (user !== null) {
            // console.log('Identifiant / email déjà utilisé');
            return res.status(409).json({ message: `Identifiant / email déjà utilisé` })
        } else if (marketer !== null) {
            // console.log('Agrement / ifu déjà utilisé');
            return res.status(409).json({ message: `Agrement / ifu déjà utilisé` })
        }
        

        // stockage des fichiers
        const IfudocBuffer = Buffer.from(document_ifu, 'base64')
        const IfudocName = '/public/uploads/ifu_docs_' + ifu + '_.pdf'
        // const a = fs.writeFileSync(directory + IfudocName, IfudocBuffer);

        const AgrementdocBuffer = Buffer.from(document_agrement, 'base64')
        const AgrementdocName = '/public/uploads/agrement_docs_' + agrement + '_.pdf'
        // const b = fs.writeFileSync(directory + AgrementdocName, AgrementdocBuffer);




        //CREATION
        let newMarketer = await Marketer.create({
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
        const generatedPass = generator.generate({ lenght: 12, numbers: true , symbols: customSymbols,})
        const newUser = await User.create({
            name: name,
            username: username,
            email: email,
            password: generatedPass,
            type: 'Marketer',
            role: 'Super Admin',
            adresse: 'N/A',
            marketer_id: newMarketer.id,
            createdBy: req.reqUserId,
            updatedBy: req.reqUserId
        })
        // console.log("je suis e n  bas ");
        mailerCtrl.sendAccountConfirmationEmail(newUser.name, newUser.username, newUser.email, generatedPass)
        // mailerCtrl.sendAccountConfirmationEmailMarketr(newUser.name, newUser.username, newUser.email, generatedPass,nom)
        // console.log('je sios ennnnnnnnnnnnnnnnnnnnnnnnnnn');
        const requester = await User.findByPk(req.reqUserId)
        mailerCtrl.mailAllUsersOfAType('MIC', `Le marketer ${newMarketer.nom} a bien été ajouté`, `Le ${requester.type} ${requester.name}, a ajouté le marketer ${newMarketer.nom} ainsi que son utilisateur ${newUser.name}.`)
        notifCtrl.notifyAllUsersOfAType('MIC', `Le marketer ${newMarketer.nom} a bien été ajouté`, `Le ${requester.type} ${requester.name}, a ajouté le marketer ${newMarketer.nom} ainsi que son utilisateur ${newUser.name}.`)


        //ENVOI
        return res.json({ message: 'Le marketer et son utilisateur ont bien été ajoutés' })

    } catch (err) {
        // console.log(err);
        next(err)
    }
}

exports.update = async (req, res, next) => {
    let id = parseInt(req.params.id)

    const agrement = xss(req.body.agrement)
    const document_agrement = xss(req.body.document_agrement)
    const ifu = xss(req.body.ifu)
    const document_ifu = xss(req.body.document_ifu)
    const dateVigueur = xss(req.body.dateVigueur)
    const dateExpiration = xss(req.body.dateExpiration)
    const nom = xss(req.body.nom)
    const name = xss(req.body.name)
    const username = xss(req.body.username)
    const email = xss(req.body.email)
    const adresse = xss(req.body.adresse)

    // console.log(req.body);

    //VALIDATION DES DONNEES RECUES
    if (
        !agrement || !ifu || !dateVigueur || !dateExpiration ||
        !nom || !adresse 
    ) {
        return res.status(400).json({ message: 'Veuillez renseigner tous les champs' })
    }

    //VALIDATION DES DONNEES RECUES
    if (!id) {
        return res.status(400).json({ message: 'Parametre(s) manquant(s)' })
    }

    try {
        //RECUPERATION
        let marketer = await Marketer.findByPk(id)
        if (marketer === null) {
            return res.status(404).json({ message: 'Marketer désactivé' })
        }

        // stockage des fichiers
        let updateMarketer
        if (document_ifu && !document_agrement) {

            const IfudocBuffer = Buffer.from(document_ifu, 'base64')
            const IfudocName = '/public/uploads/ifu_docs_' +ifu + '_.pdf'
            fs.writeFileSync(directory + IfudocName, IfudocBuffer);

            //Mise à jour
            updateMarketer = {
                agrement: agrement,
                ifu: ifu,
                document_ifu: IfudocName,
                dateVigueur: dateVigueur,
                dateExpiration: dateExpiration,
                nom: nom,
                adresse: adresse,
                createdBy: req.reqUserId,
                updatedBy: req.reqUserId
            }

        }
        else if (document_agrement && !document_ifu) {

            const AgrementdocBuffer = Buffer.from(document_ifu, 'base64')
            const AgrementdocName = '/public/uploads/agrement_docs_' + agrement + '_.pdf'
            fs.writeFileSync(directory + AgrementdocName, AgrementdocBuffer);

            //Mise à jour
            updateMarketer = {
                agrement: agrement,
                document_agrement: AgrementdocName,
                ifu: ifu,
                dateVigueur: dateVigueur,
                dateExpiration: dateExpiration,
                nom: nom,
                adresse: adresse,
                createdBy: req.reqUserId,
                updatedBy: req.reqUserId
            }

        }
        else if (document_ifu && document_agrement) {

            const IfudocBuffer = Buffer.from(document_ifu, 'base64')
            const IfudocName = '/public/uploads/ifu_docs_' + ifu + '_.pdf'
            fs.writeFileSync(directory + IfudocName, IfudocBuffer);

            const AgrementdocBuffer = Buffer.from(document_ifu, 'base64')
            const AgrementdocName = '/public/uploads/agrement_docs_' + marketer.agrement + '_.pdf'
            fs.writeFileSync(directory + AgrementdocName, AgrementdocBuffer);



            //Mise à jour
            updateMarketer = {
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
            }

        }
         else {
            //Mise à jour
            updateMarketer = {
                agrement: agrement,
                ifu: ifu,
                dateVigueur: dateVigueur,
                dateExpiration: dateExpiration,
                nom: nom,
                adresse: adresse,
                createdBy: req.reqUserId,
                updatedBy: req.reqUserId
            }

        }


        //MISE A JOUR
        await Marketer.update(updateMarketer, { where: { id: id } })
        await Marketer.update({ updatedBy: req.reqUserId }, { where: { id: id } })
        return res.json({ message: 'Le marketer a bien été mis à jour (Modifié) ' })

    } catch (err) {
        // console.log(err);
        next(err)
    }
}

exports.trash = async (req, res, next) => {

    let id = parseInt(req.params.id)
    const suspensionComment = xss(req.body.suspensionComment)

    //VALIDATION DES DONNEES RECUES
    if (!id || !suspensionComment) {
        return res.status(400).json({ message: 'Parametre(s) ou donnée(s) manquant(s)' })
    }

    try {
        const marketer = await Marketer.findByPk(id)
        if (marketer === null) { return res.status(404).json({ message: 'Donnée introubable' }) }

        await Marketer.update({ deletedBy: req.reqUserId, suspensionComment: suspensionComment, restoredBy: null }, { where: { id: id } })
        await Marketer.destroy({ where: { id: id } })

        await Station.update({ deletedBy: req.reqUserId, suspensionComment: suspensionComment, restoredBy: null }, { where: { marketer_id: id } })
        await Station.destroy({ where: { id: id } })

        await User.update({ deletedBy: req.reqUserId, suspensionComment: suspensionComment, restoredBy: null }, { where: { marketer_id: id } })
        await User.destroy({ where: { marketer_id: id } })

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
            const marketer = await Marketer.findByPk(id, { paranoid: false })
            if (marketer === null) { return res.status(404).json({ message: 'Donnée introubable' }) }

            await Marketer.restore({ where: { id: id } })
            await Marketer.update({ deletedBy: null, suspensionComment: null, restoredBy: req.reqUserId,isactive:true }, { where: { id: id} })

            await Station.restore({ where: { marketer_id: id } })
            await Station.update({ deletedBy: null, suspensionComment: null, restoredBy: req.reqUserId, isactive:true}, { where: { marketer_id: id } })

            await User.restore({ where: { marketer_id: id } })
            await User.update({ deletedBy: null, suspensionComment: null, restoredBy: req.reqUserId }, { where: { marketer_id: id } })
        }
        

        return res.status(204).json({})

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Erreur réseau ou serveur' })
    }

}
exports.untrash = async (req, res, next) => {
    let id = parseInt(req.params.id)

    //VALIDATION DES DONNEES RECUES
    if (!id) {
        return res.status(400).json({ message: 'Parametre(s) manquant(s)' })
    }

    try {
        const marketer = await Marketer.findByPk(id, { paranoid: false })
        if (marketer === null) { return res.status(404).json({ message: 'Donnée introubable' }) }

        await Marketer.restore({ where: { id: id } })
        await Marketer.update({ deletedBy: null, suspensionComment: null, restoredBy: req.reqUserId }, { where: { id: id } })

        await Station.restore({ where: { marketer_id: id } })
        await Station.update({ deletedBy: null, suspensionComment: null, restoredBy: req.reqUserId }, { where: { marketer_id: id } })

        await User.restore({ where: { marketer_id: id } })
        await User.update({ deletedBy: null, suspensionComment: null, restoredBy: req.reqUserId }, { where: { marketer_id: id } })

        return res.status(204).json({})

    } catch (err) {
        // console.log(err);
        next(err)
    }

}

exports.delete = async (req, res, next) => {
    let id = parseInt(req.params.id)

    //VALIDATION DES DONNEES RECUES
    if (!id) {
        return res.status(400).json({ message: 'Parametre(s) manquant(s)' })
    }

    try {
        const marketer = await Marketer.findByPk(id, { paranoid: false })
        if (marketer === null) { return res.status(404).json({ message: 'Donnée introubable' }) }

        const marketerr = await Marketer.destroy({ where: { id: id }, force: true })

        fs.unlink(marketerr.document_ifu, (err) => {
            if (err) {
                console.log(err);
            } else {
                console.log('File ' + marketerr.document_ifu + ' removed successfully');
            }
        });

        return res.status(204).json({})

    } catch (err) {
        // console.log(err);
        next(err)
    }
}