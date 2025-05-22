/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const jwt = require('jsonwebtoken')
const { Op } = require("sequelize");
const xss = require("xss");

const {BonLivraison,DetailsLivraison,DetailsLivraisonBarcode,Produit,Station,Transporteur,Camion,Compartiment,Depot,Marketer,User,Status,Structure,TauxForfaitaire,TauxTk,Slp,CertificatDeBaremage,VisiteTechnique} = require('../../models')

const mailerCtrl = require('../_internal/mailer')
const notifCtrl = require('../notification');



exports.isSystemActive = async (req, res, next) => {
    try {
        await checkStructureNTaux();

        const statuses = await Status.findAll()
        if(statuses[0].active === 1){next()}
        else {return res.status(503).json(`Serveur inactif! Cause: ${statuses[0].comment}`)}
    } catch (err) {
        // console.log('Failed checking system status');
        return res.status(500).json('Erreur DB ou statut serveur invalide')
    }
}

async function checkStructureNTaux() {
    try {
        const structures = await Structure.findAll()
        const ttks = await TauxTk.findAll()
        const tfs = await TauxForfaitaire.findAll()
        const cDate = new Date()

        if (!structures || !ttks || !tfs) {
            const statuses = await Status.findAll()
            return await Status.update({active: 0, comment: 'Structure ou Taux TK ou Taux Forfaitaire introuvable'}, {where: {id: statuses[0].id}})          
        }
        else if(structures[0].dateExp >= cDate || ttks[0].date_fin >= cDate || tfs[0].dateExpiration >= cDate){
            const statuses = await Status.findAll()
            return await Status.update({active: 0, comment: 'Structure ou Taux TK ou Taux Forfaitaire expiré(s)'}, {where: {id: statuses[0].id}}) 
        }

    } catch (err) {
        // console.log('Failed checking structure and taux');
    }
}

exports.cleanTransporteurs = async () => {
    try {
        const trs = await Transporteur.findAll()
        const cDate = new Date()
        const cleanedTrs = ''
        for (const tr of trs) {
            if (tr.dateExpiration >= cDate) {
                await Transporteur.update({suspensionComment: 'Agrément expiré'}, {where: {id: tr.id}})
                await Transporteur.destroy({where: {id: tr.id}})
                cleanedTrs = cleanedTrs + ' ,' + tr.nom
            }
        }

        if (cleanedTrs) {
            //NOTIF
            notifCtrl.notifyAllUsersOfAType('MIC', `Alerte de désactivation de certains transporteurs`, `Date: ${cDate}... Ont été désactivés pour cause d'agrément expiré les structures de transport suivantes: ${cleanedTrs}`)
            mailerCtrl.mailAllUsersOfAType('MIC', `Alerte de désactivation de certains transporteurs`, `Date: ${cDate}... Ont été désactivés pour cause d'agrément expiré les structures de transport suivantes: ${cleanedTrs}`)
        }

        return console.log('Transporteurs cleaned at ', cDate);
    } catch (err) {
        return console.log('Failed cleaning transporteurs');
    }
}

exports.cleanMarketers = async () => {
    try {
        const marketers = await Marketer.findAll()
        const cDate = new Date()
        const cleanedMarketers = ''
        for (const marketer of marketers) {
            if (marketer.dateExpiration >= cDate) {
                await Marketer.update({suspensionComment: 'Agrément expiré'}, {where: {id: marketer.id}})
                await Marketer.destroy({where: {id: marketer.id}})
                cleanedMarketers = cleanedMarketers + ' ,' + marketer.nom
            }
        }

        if (cleanedMarketers) {
            //NOTIF
            notifCtrl.notifyAllUsersOfAType('MIC', `Alerte de désactivation de certains marketers`, `Date: ${cDate}... Ont été désactivés pour cause d'agrément expiré les commerçants d'hydrocarbures suivants: ${cleanedMarketers}`)
            mailerCtrl.mailAllUsersOfAType('MIC', `Alerte de désactivation de certains marketers`, `Date: ${cDate}... Ont été désactivés pour cause d'agrément expiré les commerçants d'hydrocarbures suivants: ${cleanedMarketers}`)
        }

        return console.log('Marketers cleaned at ', cDate);
    } catch (err) {
        return console.log('Failed cleaning marketers');
    }
}

exports.cleanDepots = async () => {
    try {
        const depots = await Depot.findAll()
        const cDate = new Date()
        const cleanedDepots = ''
        for (const depot of depots) {
            if (depot.dateExpiration >= cDate) {
                await Depot.update({suspensionComment: 'Agrément expiré'}, {where: {id: depot.id}})
                await Depot.destroy({where: {id: depot.id}})
                cleanedDepots = cleanedDepots + ' ,' + depot.nom
            }
        }

        if (cleanedDepots) {
            //NOTIF
            notifCtrl.notifyAllUsersOfAType('MIC', `Alerte de désactivation de certains dépôts`, `Date: ${cDate}... Ont été désactivés pour cause d'agrément expiré les dépots d'hydrocarbures suivants: ${cleanedDepots}`)
            mailerCtrl.mailAllUsersOfAType('MIC', `Alerte de désactivation de certains dépôts`, `Date: ${cDate}... Ont été désactivés pour cause d'agrément expiré les dépots d'hydrocarbures suivants: ${cleanedDepots}`)
        }

        return console.log('Depots cleaned at ', cDate);
    } catch (err) {
        return console.log('Failed cleaning depots');
    }
}

exports.cleanCamions = async () => {
    try {
        const camions = await Camion.findAll()
        const cDate = new Date()
        const cleanedCamions = ''
        for (const camion of camions) {
            const slp = await Slp.findOne({where: {camion_id: camion.id}})
            const cb = await CertificatDeBaremage.findOne({where: {camion_id: camion.id}})
            const vt = await VisiteTechnique.findOne({where: {camion_id: camion.id}})
            if ( slp.date_fin >= cDate || cb.date_fin >= cDate || vt.date_fin >= cDate ) {
                await Camion.update({suspensionComment: 'Safe Load Pass (SLP), ou Certificat de barêmage, ou Visite technique expiré'}, {where: {id: camion.id}})
                await Camion.destroy({where: {id: camion.id}})
                cleanedCamions = cleanedCamions + ' ,' + camion.imat
            }
        }

        if (cleanedCamions) {
            //NOTIF
            notifCtrl.notifyAllUsersOfAType('MIC', `Alerte de désactivation de certains camions`, `Date: ${cDate}... Ont été désactivés pour cause Safe Load Pass (SLP), ou Certificat de barêmage, ou Visite technique expiré les camions suivants: ${cleanedCamions}`)
            mailerCtrl.mailAllUsersOfAType('MIC', `Alerte de désactivation de certains camions`, `Date: ${cDate}... Ont été désactivés pour cause Safe Load Pass (SLP), ou Certificat de barêmage, ou Visite technique expiré les camions suivants: ${cleanedCamions}`)
        }

        return console.log('Depots cleaned at ', cDate);
    } catch (err) {
        return console.log('Failed cleaning depots');
    }
}