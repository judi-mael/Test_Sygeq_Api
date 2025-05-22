/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const jwt = require('jsonwebtoken')
const { Op } = require("sequelize");
const xss = require("xss");


const {BonGPLBouteille,DetailsLivraison,DetailsLivraisonBarcode,Produit,Station,Transporteur,Camion,Compartiment,Depot,Marketer,User} =  require('../models')
const userCtrl = require('./user')
const mailerCtrl = require('./_internal/mailer')
const notifCtrl = require('./notification');

const statuts = ['Ouvert', 'Approuvé', 'Bon à Charger', 'Chargé', 'Déchargé', 'Annulé', 'Rejeté', 'Payé']

/*****************************/
/*** GESTION DE LA RESSOURCE */
exports.getAllPeriode = async (req, res, next) => {
    const startDate = req.params.startDate;
    let endDate = new Date(req.params.endDate);
    endDate.setDate(endDate.getDate() + 1);
    try {

        let list = [];
        let bls = []

        const user = await userCtrl.getUsefulUserData(req.reqUserId)
        if (req.reqUserType === 'Marketer') {
            bls = await BonGPLBouteille.findAll({
                where: {
                    marketer_id: user.marketer_id, type: 'BL',
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                }, paranoid: false, order: [['createdAt', 'desc']]
            });
        }
        else if (req.reqUserType === 'Station') {
            bls = await BonGPLBouteille.findAll({
                where: {
                    station_id: user.station_id, type: 'BL',
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                }, paranoid: false, order: [['createdAt', 'desc']]
            });
        }
        else if (req.reqUserType === 'B2B') {
            // console.log("==========================");
            // console.log(req.reqUserType);

            bls = await BonGPLBouteille.findAll({
                where: {
                    station_id: user.b2b_id, type: 'BL',
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                }, paranoid: false, order: [['createdAt', 'desc']]
            });
            // console.log(user.station_id);
        }
        else if (req.reqUserType === 'Depot') {
            bls = await BonGPLBouteille.findAll({
                where: {
                    depot_id: user.depot_id, type: 'BL',
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                }, paranoid: false, order: [['createdAt', 'desc']]
            });
        }

        else {
            bls = await BonGPLBouteille.findAll({
                where: {
                    type: 'BL',
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                }, paranoid: false, order: [['createdAt', 'desc']]
            });
        }

        for (let i = 0; i < bls.length; i++) {

            let bgb = bls[i]
            const camion = await Camion.findByPk(bgb.camion_id, { paranoid: false })

            let details = []

            
                    details.push({
                        id: 0,
                        bonlivraison_id:0,
                        produit: await Produit.findByPk(bgb.produit_id),
                        qtte: bgb.qtyRestante,
                        // details_barcodes: detailsBarcodes,
                        createdBy: await userCtrl.getUsefulUserData(bgb.createdBy),
                        updatedBy: await userCtrl.getUsefulUserData(bgb.updatedBy),
                        deletedBy: '',
                        restoredBy: '',
                        createdAt: '',
                        updatedAt: '',
                        deletedAt: '',
                        suspensionComment: ''
                    })
                

            list.push(
                {
                    id: bgb.id,
                    numeroBL: bgb.numeroBL,
                    date: bgb.date,
                    station: await Station.findByPk(bgb.station_id),
                    marketer: await Marketer.findByPk(bgb.marketer_id),
                    // transporteur: await Transporteur.findByPk(bgb.transporteur_id),
                    camion: {
                        id: camion.id,
                        ssat_id: camion.ssat_id,
                        imat: camion.imat,
                        nbrVanne: camion.nbrVanne,
                        capacity: camion.capacity,
                        filling_level: camion.filling_level,
                        vannes: await Compartiment.findAll({ where: { camion_id: camion.id } }),
                        annee: camion.annee,
                        type: camion.type,
                        marque: camion.marque,
                        transporteur: await Transporteur.findByPk(camion.transporteur_id),
                        createdBy: await userCtrl.getUsefulUserData(camion.createdBy),
                        updatedBy: await userCtrl.getUsefulUserData(camion.updatedBy),
                        deletedBy: camion.deletedBy,
                        restoredBy: camion.restoredBy,
                        createdAt: camion.createdAt,
                        updatedAt: camion.updatedAt,
                        deletedAt: camion.deletedAt,
                        suspensionComment: camion.suspensionComment
                    },
                    depot: await Depot.findByPk(bgb.depot_id),
                    produits: details,
                    statut: bgb.statut,
                    statYear: bgb.statYear,
                    statMonth: bgb.statMonth,
                    commentaire: bgb.commentaire,
                    ftbl: bgb.ftbl,
                    cp: bgb.cp,
                    cbl_tp: bgb.cbl_tp,
                    cbl_ttid: bgb.cbl_ttid,
                    cbl_tdt: bgb.cbl_tdt,
                    qty: bgb.qty,
                    createdBy: await userCtrl.getUsefulUserData(bgb.createdBy),
                    updatedBy: await userCtrl.getUsefulUserData(bgb.updatedBy),
                    deletedBy: bgb.deletedBy,
                    restoredBy: bgb.restoredBy,
                    createdAt: bgb.createdAt,
                    updatedAt: bgb.updatedAt,
                    deletedAt: bgb.deletedAt,
                    suspensionComment: bgb.suspensionComment
                }
            )
        }
        
        res.json({ data: list })


    } catch (err) {
        console.log(err)
        next(err)
    }

}

exports.get = async (req, res, next) => {
    let id = parseInt(req.params.id)
    //VALIDATION DES DONNEES RECUES
    if (!id) {
        return res.status(400).json({ message: 'Parametre(s) manquant(s)' })
    }

    try {
        //RECUPERATION
        let bgb = await BonGPLBouteille.findByPk(id, { paranoid: false })
        if (bgb === null) {
            return res.status(404).json({ message: 'BL introuvable' })
        }


        let camion = await Camion.findByPk(bgb.camion_id, { paranoid: false })

        // let dls = await DetailsLivraison.findAll({ where: { bonlivraison_id: bl.id } })
        let details = []

            let detailsBarcodes = []
        
                details.push({
                    id: 0,
                    bonlivraison_id: 0,
                    produit: await Produit.findByPk(bgb.produit_id),
                    qtte: bgb.qtte,
                    details_barcodes: detailsBarcodes,
                    createdBy: await userCtrl.getUsefulUserData(bgb.createdBy),
                    updatedBy: await userCtrl.getUsefulUserData(bgb.updatedBy),
                    deletedBy: bgb.deletedBy,
                    restoredBy: bgb.restoredBy,
                    createdAt: bgb.createdAt,
                    updatedAt: bgb.updatedAt,
                    deletedAt: bgb.deletedAt,
                    suspensionComment:""
                })
            
        

        //ENVOI
        return res.json({
            data:
            {
                id: bgb.id,
                numeroBL: bgb.numeroBL,
                date: bgb.date,
                station: await Station.findByPk(bgb.station_id),
                marketer: await Marketer.findByPk(bgb.marketer_id),
                transporteur: await Transporteur.findByPk(bgb.transporteur_id),
                camion: {
                    id: camion.id,
                    ssat_id: camion.ssat_id,
                    imat: camion.imat,
                    nbrVanne: camion.nbrVanne,
                    vannes: await Compartiment.findAll({ where: { camion_id: camion.id } }),
                    annee: camion.annee,
                    capacity: camion.capacity,
                    filling_level: camion.filling_level,
                    type: camion.type,
                    marque: camion.marque,
                    transporteur: await Transporteur.findByPk(camion.transporteur_id),
                    createdBy: await userCtrl.getUsefulUserData(camion.createdBy),
                    updatedBy: await userCtrl.getUsefulUserData(camion.updatedBy),
                    deletedBy: camion.deletedBy,
                    restoredBy: camion.restoredBy,
                    createdAt: camion.createdAt,
                    updatedAt: camion.updatedAt,
                    deletedAt: camion.deletedAt,
                    suspensionComment: camion.suspensionComment
                },
                depot: await Depot.findByPk(bgb.depot_id),
                produits: details,
                statut: bgb.statut,
                statYear: bgb.statYear,
                statMonth: bgb.statMonth,
                commentaire: bgb.commentaire,
                ftbl: bgb.ftbl,
                cbl_tp: bgb.cbl_tp,
                cbl_ttid: bgb.cbl_ttid,
                cbl_tdt: bgb.cbl_tdt,
                qty: bgb.qty,
                date_chargement: bgb.date_chargement,
                date_dechargement: bgb.date_dechargement,
                createdBy: await userCtrl.getUsefulUserData(bgb.createdBy),
                updatedBy: await userCtrl.getUsefulUserData(bgb.updatedBy),
                deletedBy: bgb.deletedBy,
                restoredBy: bgb.restoredBy,
                createdAt: bgb.createdAt,
                updatedAt: bgb.updatedAt,
                deletedAt: bgb.deletedAt,
                suspensionComment: bgb.suspensionComment
            }
        })

    } catch (err) {
        next(err)
    }
}

exports.getDepotCamionRelatedBLs = async (req, res, next) => {
    let camion_id = parseInt(req.params.id)
    const typeUser = req.reqUserType
    //VALIDATION DES DONNEES RECUES
    if (!camion_id) {
        return res.status(400).json({ message: 'Veuillez renseigner tous les champs' })
    }

    try {
        //RECUPERATION
        let dls
        let list = []

        const user = await userCtrl.getUsefulUserData(req.reqUserId)
        let bls;
        if (typeUser === "DPB") {
            bls = await BonLivraison.findAll({
                where: {
                    [Op.and]: [
                        { camion_id: camion_id },
                        {
                            [Op.or]: [
                                { statut: 'Approuvé' },
                                { statut: 'Ouvert' },
                                { statut: 'Rejeté' },
                                // { statut: 'Bon à Charger' },
                            ]
                        }
                    ]
                }, paranoid: false, order: [['createdAt', 'desc']]
            })
        } else {
            bls = await BonGPLBouteille.findAll({
                where: {
                    [Op.and]: [
                        { camion_id: camion_id },
                        { depot_id: user.depot_id },
                        {
                            [Op.or]: [
                                { statut: 'Approuvé' },
                                { statut: 'Bon à Charger' },
                                { statut: 'Chargé' },
                                { statut: 'Rejeté' }
                            ]
                        }
                    ]
                }, paranoid: false, order: [['createdAt', 'desc']]
            })
        }
        for (let i = 0; i < bls.length; i++) {
            let bl = bls[i];
            let productList = []

            if (bl !== null) {
                dls = await DetailsLivraison.findAll({ where: { bonlivraison_id: bl.id } })

                for (let j = 0; j < dls.length; j++) {
                    let dl = dls[j];

                    productList.push({
                        id: parseInt(dl.id),
                        bonlivraison_id: parseInt(dl.bonlivraison_id),
                        produit: await Produit.findByPk(dl.produit_id),
                        qtte: parseInt(dl.qtte),
                        details: await DetailsLivraisonBarcode.findAll({ where: { detailslivraison_id: parseInt(dl.id) } }),
                        createdBy: await userCtrl.getUsefulUserData(dl.createdBy),
                        updatedBy: await userCtrl.getUsefulUserData(dl.updatedBy),
                        deletedBy: dl.deletedBy,
                        restoredBy: dl.restoredBy,
                        createdAt: dl.createdAt,
                        updatedAt: dl.updatedAt,
                        deletedAt: dl.deletedAt,
                        suspensionComment: dl.suspensionComment
                    })

                }


                let camion = await Camion.findByPk(bl.camion_id, { paranoid: false })
                let _station = {};
                if (bl.type=='BL'){
                    _station = await Station.findByPk(bl.station_id)
                }else{
                    const _depot = await Depot.findByPk(bl.station_id)
                    _station = {
                        id:_depot.id,
                        poi_id:0,
                        longitude:_depot.longitude,
                        latitude:_depot.latitude,
                        ifu:_depot.ifu,
                        rccm:'',
                        nom:_depot.nom,
                        ville_id:_depot.ville_id,
                        adresse:_depot.adresse,
                        marketer_id:bl.marketer_id,
                        etat:0,
                    }
                }
                list.push(
                    {
                        id: bl.id,
                        numeroBL: bl.numeroBL,
                        date: bl.date,
                        type:bl.type,
                        station: _station,
                        marketer: await Marketer.findByPk(bl.marketer_id),
                        transporteur: await Transporteur.findByPk(bl.transporteur_id),
                        camion: {
                            id: camion.id,
                            ssat_id: camion.ssat_id,
                            imat: camion.imat,
                            nbrVanne: camion.nbrVanne,
                            vannes: await Compartiment.findAll({ where: { camion_id: camion.id } }),
                            annee: camion.annee,
                            type: camion.type,
                            marque: camion.marque,
                            transporteur: await Transporteur.findByPk(camion.transporteur_id),
                            createdBy: await userCtrl.getUsefulUserData(camion.createdBy),
                            updatedBy: await userCtrl.getUsefulUserData(camion.updatedBy),
                            deletedBy: camion.deletedBy,
                            restoredBy: camion.restoredBy,
                            createdAt: camion.createdAt,
                            updatedAt: camion.updatedAt,
                            deletedAt: camion.deletedAt,
                            suspensionComment: bl.suspensionComment
                        },
                        depot: await Depot.findByPk(bl.depot_id),
                        produits: productList,
                        statut: bl.statut,
                        statYear: bl.statYear,
                        statMonth: bl.statMonth,
                        commentaire: bl.commentaire,
                        ftbl: bl.ftbl,
                        cbl_tp: bl.cbl_tp,
                        cbl_ttid: bl.cbl_ttid,
                        cbl_tdt: bl.cbl_tdt,
                        qty: bl.qty,
                        createdBy: await userCtrl.getUsefulUserData(bl.createdBy),
                        updatedBy: await userCtrl.getUsefulUserData(bl.updatedBy),
                        deletedBy: bl.deletedBy,
                        restoredBy: bl.restoredBy,
                        createdAt: bl.createdAt,
                        updatedAt: bl.updatedAt,
                        deletedAt: bl.deletedAt,
                        suspensionComment: bl.suspensionComment
                    })

            }

        }

        //ENVOI
        return res.json({ data: list })

    } catch (err) {
        console.log(err);
        next(err)
    }
}
exports.rejeterChargement=async (req,res)=>{
    
    const blId = parseInt(req.params.blId)
    const bl= await BonLivraison.findByPk(blId,{ paranoid: false })
    if (!bl) {
        return res.status(400).json({ message: 'Bon de livraison introiuvable' })
    }
    try {
        const dls = await DetailsLivraison.findAll({ where: { bonlivraison_id: bl.id } },{ paranoid: false })
        for(const dl of dls){
            const detailBarecode = await DetailsLivraisonBarcode.findAll({ where: {detailslivraison_id :dl.id}},{ paranoid: false })
            for(const bc of detailBarecode){
                await DetailsLivraisonBarcode.update({ deletedAt: Date.now() }, { where: { id: bc.id } })
                await Compartiment.update({ is_busy:0},{ where: { id: bc.compartiment_id } })
            }
        }
        await BonLivraison.update({statut:'Bon à Charger'},{ where: { id: blId } })
        return res.status(200).json({})
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: 'Une erreur s\'est produite' })
    }
}

exports.add = async (req, res, next) => {
    let {
        station_id, produit_id, depot_id, camion_id,quantite
    } = req.body

    //FORMATAGE
    station_id = parseInt(station_id)
    depot_id = parseInt(depot_id)

    let user = await User.findByPk(req.reqUserId)
    const marketer_id = parseInt(user.marketer_id)

    // transporteur_id = ""
    produit_id = parseInt(produit_id)
    camion_id = parseInt(camion_id)

    const camion = await Camion.findByPk(camion_id, { paranoid: false })
    //VALIDATION DES DONNEES RECUES
    if (!camion_id || !depot_id || !produit_id || !quantite) {
        return res.status(400).json({ message: 'Veuillez renseigner tous les champs' })
    }
    else if (camion.filling_level >= camion.capacity) {
        return res.status(409).json({ message: 'Ce camion est plein' })
    }

    try {

        let statut = 'Ouvert';
        // user.type === 'Marketer' && (user.role === 'Admin' || user.role === 'Super Admin') ? statut = 'Approuvé' : false;
        user.type === 'Marketer' && (user.role === 'Admin' || user.role === 'Super Admin') ? statut = 'Ouvert' : false;
        
        // CREATION
        let bl = await BonGPLBouteille.create({
            station_id: 0,
            marketer_id: marketer_id,
            transporteur_id: camion.transporteur_id,
            camion_id: camion_id,
            depot_id: depot_id,
            statut: statut,
            qtyRestante:quantite,
            qtyTotale:quantite,
            produit_id:produit_id,
            type: 'BL',
            createdBy: req.reqUserId,
            updatedBy: req.reqUserId
        })

        const newDate = new Date()
        const year = newDate.getFullYear()
        const month = ('0' + (newDate.getMonth() + 1)).slice(-2)
        const day = ('0' + newDate.getDate()).slice(-2)

        let numBL = 'BL' + req.reqUserId + year + month + day + bl.id

        await BonGPLBouteille.update({ numeroBL: numBL, statMonth: month, statYear: year }, { where: { id: bl.id } })


        

        
        // await Camion.update({marketer_id: marketer_id, filling_level: activeCamion.filling_level+total}, {where: {id: camion_id}})

        //NOTIF TO MARKETERS
        const marketerUsers = await User.findAll({ where: { marketer_id: marketer_id,type:'Super Admin' }, paranoid: false })
        for (const marketerUser of marketerUsers) {
            if (marketerUser.type !== 'Station') {
                const marketerCompany = await Marketer.findByPk(marketer_id, { paranoid: false })
                notifCtrl.notifySingle(marketerUser.id, `${numBL} a bien été  émis`, `${user.name} a émis un nouveau bon de livraison N° ${numBL} au nom de ${marketerCompany.nom}. Ce BL est donc en attente d'approbation`)
                mailerCtrl.mailSingle(marketerUser.id, `${numBL} a bien été  émis`, `${user.name} a émis un nouveau bon de livraison N° ${numBL} au nom de ${marketerCompany.nom}. Ce BL est donc en attente d'approbation`)
            }
        }

        // //historicizing
        // await historicize(bl.id, 'Création', `${user.name} a créé un nouveau bl avec le statut ${statut}`, user.id)

        return res.json({ message: 'Le BL a bien été créé' })

    } catch (err) {
        console.log(err);
        next(err)
    }
}
exports.update = async (req, res, next) => {
    let id = parseInt(req.params.id)


    const updatedBy = parseInt(req.reqUserId)

    //VALIDATION DES DONNEES RECUES
    if (!id) {
        return res.status(400).json({ message: 'Parametre(s) manquant(s)' })
    }

    try {
        //RECUPERATION
        let bl = await BonGPLBouteille.findByPk(id)
        let user = await userCtrl.getUsefulUserData(req.reqUserId)

        if (bl === null) {
            return res.status(404).json({ message: 'BL introuvable' })
        }

        else if (req.reqUserType === 'Marketer' && bl.statut === 'Chargé' || bl.statut === 'Bon à Charger' ) {
            if (req.body.station_id) {
                await BonGPLBouteille.update({ station_id: req.body.station_id }, { where: { id: id } })
                return res.json({ message: `La destination du BL modifier avec succès` })
            } else {
                return res.status(401).json({ message: `Désolé, ce BL est ${bl.statut}` })
            }
        } 
        else if (req.reqUserType === 'Marketer' &&bl.marketer_id !== user.marketer_id) {
            return res.status(401).json({ message: 'Désolé, vous n\'êtes pas lié à ce BL' })
        } 
        else if ( res.reqUserType === 'Station' && bl.station_id !== user.station_id ) {
            return res.status(401).json({ message: 'Désolé, vous n\'êtes pas lié à ce BL' })
        } 
        else if ( res.reqUserType === 'Depot' && req.body.statut !== 'Rejeté' && req.body.statut !== 'Bon à Charger') {
            return res.status(401).json({ message: 'Donnée(s) erroné(s) dans la requête' })
        }

        if (req.body.statut === 'Approuvé') {
            // get this transporterid from camion id
            //    const caMion =  await Camion.findByPk(bl.transporteur_id)
            //NOTIF TO MARKETERS
            const marketer_id = bl.marketer_id
            const depotCible = await Depot.findByPk(bl.depot_id)
            const marketerUsers = await User.findAll({ where: { marketer_id: marketer_id,type:'Super Admin' } })
            const camionCible = await Camion.findByPk(bl.camion_id)
            const updateBL = await BonGPLBouteille.update({ statut: req.body.statut }, { where: { id: id } })
            const trCible = await Transporteur.findByPk(camionCible.transporteur_id)
            const marketerCompany = await Marketer.findByPk(marketer_id)
            for (const marketerUser of marketerUsers) {
                if (marketerUser.type !== 'Station') {
                    notifCtrl.notifySingle(marketerUser.id, `${bl.numeroBL} est à présent approuvé`, `${user.name} a approuvé le bon de livraison N° ${bl.numeroBL} au nom de ${marketerCompany.nom}. Le camion d'immatriculation ${camionCible.imat} de la structure ${trCible.nom} peut donc passer au dépôt ${depotCible.nom} pour le chargement.`)
                    mailerCtrl.mailSingle(marketerUser.id, `${bl.numeroBL} est à présent approuvé`, `${user.name} a approuvé le bon de livraison N° ${bl.numeroBL} au nom de ${marketerCompany.nom}. Le camion d'immatriculation ${camionCible.imat} de la structure ${trCible.nom} peut donc passer au dépôt ${depotCible.nom} pour le chargement.`)
                }
            }

            //NOTIF TO DEPOT
            const depotUsers = await User.findAll({ where: { depot_id: bl.depot_id,type:'Super Admin' } })
            for (const depotUser of depotUsers) {
                notifCtrl.notifySingle(depotUser.id, `BL N° ${bl.numeroBL} en route vers vous!`, `${marketerCompany.nom} a émis et approuvé le bon de livraison N° ${bl.numeroBL}. Le camion d'immatriculation ${camionCible.imat} de la structure ${trCible.nom} est authorisé à charger.`)
                mailerCtrl.mailSingle(depotUser.id, `BL N° ${bl.numeroBL} en route vers vous!`, `${marketerCompany.nom} a émis et approuvé le bon de livraison N° ${bl.numeroBL}. Le camion d'immatriculation ${camionCible.imat} de la structure ${trCible.nom} est authorisé à charger.`)
            }
        }

        if (req.body.statut === 'Bon à Charger') {
            //NOTIF TO MARKETERS
            console.log('--> ', user.marketer_id);
            const marketer_id = bl.marketer_id
            const marketerUsers = await User.findAll({ where: { marketer_id: marketer_id }, paranoid: false })
            const camionCible = await Camion.findByPk(bl.camion_id, { paranoid: false })
            const trCible = camionCible.transporteur_id
            
            const depotUsers = await User.findAll({ where: { depot_id: bl.depot_id,type:'Super Admin' } })
            const marketerCompany = await Marketer.findByPk(bl.marketer_id, { paranoid: false })
            for (const depotUser of depotUsers) {
                notifCtrl.notifySingle(depotUser.id, `Le BL ${bl.numeroBL} est bon à charger`, `${user.name} a déclaré bon à charger le bon de livraison N° ${bl.numeroBL} au nom de ${marketerCompany.nom}. Le camion d'immatriculation ${camionCible.imat} de la structure ${trCible.nom} peut donc recevoir le chargement.`)
                mailerCtrl.mailSingle(depotUser.id, `Le BL ${bl.numeroBL} est bon à charger`, `${user.name} a déclaré bon à charger le bon de livraison N° ${bl.numeroBL} au nom de ${marketerCompany.nom}. Le camion d'immatriculation ${camionCible.imat} de la structure ${trCible.nom} peut donc recevoir le chargement.`)
            }
        }

        //MISE A JOUR
        await BonGPLBouteille.update(req.body, { where: { id: id } })
        await BonGPLBouteille.update({ updatedBy: req.reqUserId }, { where: { id: id } })

        
        return res.json({ message: 'Le BL a bien été modifié' })

    } catch (err) {
        console.log(err);
        next(err)
    }
}


exports.trash = (req, res, next) => {
    let id = parseInt(req.params.id)

    //VALIDATION DES DONNEES RECUES
    if (!id) {
        return res.status(400).json({ message: 'Parametre(s) manquant(s)' })
    }

    //MISE A LA CORBEILLE
    BonLivraison.destroy({ where: { id: id } })
        .then(() => res.status(204).json({}))
        .catch(err => next(err))
}

exports.untrash = (req, res, next) => {
    let id = parseInt(req.params.id)

    //VALIDATION DES DONNEES RECUES
    if (!id) {
        return res.status(400).json({ message: 'Parametre(s) manquant(s)' })
    }

    //MISE A LA CORBEILLE
    BonLivraison.restore({ where: { id: id } })
        .then(() => res.status(204).json({}))
        .catch(err => next(err))
}

exports.delete = (req, res, next) => {
    let id = parseInt(req.params.id)

    //VALIDATION DES DONNEES RECUES
    if (!id) {
        return res.status(400).json({ message: 'Parametre(s) manquant(s)' })
    }

    //SUPRESSION DEFINITIVE
    BonLivraison.destroy({ where: { id: id }, force: true })
        .then(() => res.status(204).json({}))
        .catch(err => next(err))
}


exports.updateBarCode=async (req,res)=>{
    // const blId = parseInt(req.body.blId)
    const detailUpdate = req.body.detailUpdate
    const detailCode = await DetailsLivraisonBarcode.findByPk(detailUpdate.id)
     if(!detailCode){return res.status(400).json({message: 'Détail chargement introuvable'})}
    
    try {
        // for(const dl of detailUpdate){
            await DetailsLivraisonBarcode.update({ creu_charger:detailUpdate.creu,barcode:detailUpdate.barrecode }, 
            { where: { id: detailUpdate.id } })
        // }
        return res.status(204).json({})
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: 'Une erreur s\'est produite' })
    }
}

















/******************/
/* INTERNAL FUNCS */
















