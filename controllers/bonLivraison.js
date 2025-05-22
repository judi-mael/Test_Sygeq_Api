/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const jwt = require('jsonwebtoken')
const { Op, where } = require("sequelize");
const xss = require("xss");
const cron = require('node-cron');
const { subDays } = require('date-fns');

// const BonGPLBoutelle = DB.BonGPLBouteille
// const DetailsChargement = DB.DetailsChargement
const {BonLivraison, DetailsLivraison,DetailsVille,DetailsLivraisonBarcode,Produit,Station,Transporteur,Camion,Compartiment,Depot,Marketer,User,Structure} = require('../models')
const userCtrl = require('./user')
const mailerCtrl = require('./_internal/mailer')
const notifCtrl = require('./notification');
const { now } = require('sequelize/lib/utils');

const statuts = ['Ouvert', 'Approuvé', 'Bon à Charger', 'Chargé', 'Déchargé', 'Annulé', 'Rejeté', 'Payé']

/*****************************/
/*** GESTION DE LA RESSOURCE */
function paginated(page,limit){
    const pages = parseInt(page) || 1;  // Page actuelle, par défaut à la page 1
      // Nombre d'éléments par page
    const offset = (pages - 1) * limit;
    return offset;
}
exports.getAll = async (req, res, next) => {

    try {
        const page = parseInt(req.query.page) || 1;  // Page actuelle, par défaut à la page 1
        const limit = 10;  // Nombre d'éléments par page
        const offset = (page - 1) * limit;
        let list = [];
        let bls = []

        const user = await userCtrl.getUsefulUserData(req.reqUserId)
        if (req.reqUserType === 'Marketer') {
            bls = await BonLivraison.findAll({ where: { marketer_id: user.marketer_id, type: 'BL' }, paranoid: false, order: [['createdAt', 'desc']] });
        }
        else if (req.reqUserType === 'Station') {
            bls = await BonLivraison.findAll({ where: { station_id: user.station_id, type: 'BL' }, paranoid: false, order: [['createdAt', 'desc']] });
        }
        else if (req.reqUserType === 'B2B') {

            bls = await BonLivraison.findAll({ where: { station_id: user.b2b_id, type: 'BL' }, paranoid: false, order: [['createdAt', 'desc']] });
            // console.log(user.station_id);
        }
        else if (req.reqUserType === 'Depot') {
            bls = await BonLivraison.findAll({ where: { depot_id: user.depot_id, type: 'BL' }, paranoid: false, order: [['createdAt', 'desc']] });
        }

        else {
            bls = await BonLivraison.findAll({ 
                where: { type: 'BL' }, 
                paranoid: false, 
                order: [['createdAt', 'desc']],
                limit: limit,   // Limite les résultats à 10 éléments
                offset: offset,
            });
        }

        for (let i = 0; i < bls.length; i++) {

            let bl = bls[i]
            const camion = await Camion.findByPk(bl.camion_id, { paranoid: false })

            let dls = await DetailsLivraison.findAll({ where: { bonlivraison_id: bl.id } })
            let details = []

            for (let i = 0; i < dls.length; i++) {
                const dl = dls[i];
                let detailsBarcodes = []

                if (dl) {

                    let dlbs = await DetailsLivraisonBarcode.findAll({ where: { detailslivraison_id: dl.id } })

                    for (let ii = 0; ii < dlbs.length; ii++) {
                        const dlb = dlbs[ii]; 0.

                        if (dlb) {
                            detailsBarcodes.push({
                                id: dlb.id,
                                detailslivraison_id: dlb.detailslivraison_id,
                                qty: dlb.qty,
                                barcode: dlb.barcode,
                                creu_charger: dlb.creu_charger,
                                Compartiment: await Compartiment.findByPk(dlb.compartiment_id),
                                createdBy: await userCtrl.getUsefulUserData(dlb.createdBy),
                                updatedBy: await userCtrl.getUsefulUserData(dlb.updatedBy),
                                deletedBy: dlb.deletedBy,
                                restoredBy: dlb.restoredBy,
                                createdAt: dlb.createdAt,
                                updatedAt: dlb.updatedAt,
                                deletedAt: dlb.deletedAt,
                                suspensionComment: dlb.suspensionComment
                            })
                        }
                    }

                    details.push({
                        id: dl.id,
                        bonlivraison_id: dl.bonlivraison_id,
                        produit: await Produit.findByPk(dl.produit_id),
                        qtte: dl.qtte,
                        details_barcodes: detailsBarcodes,
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
            }

            list.push(
                {
                    id: bl.id,
                    numeroBL: bl.numeroBL,
                    date: bl.date,
                    info:bl.info,
                    station: await Station.findByPk(bl.station_id),
                    marketer: await Marketer.findByPk(bl.marketer_id),
                    transporteur: await Transporteur.findByPk(bl.transporteur_id),
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
                    depot: await Depot.findByPk(bl.depot_id),
                    produits: details,
                    statut: bl.statut,
                    statYear: bl.statYear,
                    statMonth: bl.statMonth,
                    commentaire: bl.commentaire,
                    ftbl: bl.ftbl,
                    cp: bl.cp,
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
                }
            )
        }

        res.json({ data: list })


    } catch (err) {
        console.log(err)
        next(err)
    }

}

exports.getAllPeriode = async (req, res, next) => {
    const startDate = req.params.startDate;
    let endDate = new Date(req.params.endDate);
    endDate.setDate(endDate.getDate() + 1);
    const limit = parseInt(req.params.limit) 
    const pages = paginated(req.params.page,limit)
    try {

        let list = [];
        let bls = []
        let nbrs= 0;
          
        
        const user = await userCtrl.getUsefulUserData(req.reqUserId)
        if (req.reqUserType === 'Marketer') {
            nbrs = await BonLivraison.count({
                where: {
                    marketer_id: user.marketer_id, type: 'BL',
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                }, paranoid: true, order: [['createdAt', 'desc']],
                
            });
            bls = await BonLivraison.findAll({
                where: {
                    marketer_id: user.marketer_id, type: 'BL',
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                }, paranoid: true, order: [['createdAt', 'desc']],
                limit: limit,
                offset: pages,
            });
        }
        else if (req.reqUserType === 'Station') {
            nbrs = await BonLivraison.count({
                where: {
                    station_id: user.station_id, type: 'BL',
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                }, paranoid: true, order: [['createdAt', 'desc']],
                
            });
            bls = await BonLivraison.findAll({
                where: {
                    station_id: user.station_id, type: 'BL',
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                }, paranoid: true, order: [['createdAt', 'desc']],
                limit: limit,
                offset: pages,
            });
        }
        else if (req.reqUserType === 'B2B') {

            nbrs = await BonLivraison.count({
                where: {
                    station_id: user.b2b_id, type: 'BL',
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                }, paranoid: true, order: [['createdAt', 'desc']],
                
            });
            bls = await BonLivraison.findAll({
                where: {
                    station_id: user.b2b_id, type: 'BL',
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                }, paranoid: true, order: [['createdAt', 'desc']],
                limit: limit,
                offset: pages,
            });
            // console.log(user.station_id);
        }
        else if (req.reqUserType === 'Depot') {
            nbrs = await BonLivraison.count({
                where: {
                    depot_id: user.depot_id, type: 'BL',
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                }, paranoid: true, order: [['createdAt', 'desc']],
                
            });
            bls = await BonLivraison.findAll({
                where: {
                    depot_id: user.depot_id, type: 'BL',
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                }, paranoid: true, order: [['createdAt', 'desc']],
                limit: limit,
                offset: pages,
            });
        }

        else {
            nbrs = await BonLivraison.count({
                where: {
                    type: 'BL',
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                },
                paranoid: true, order: [['createdAt', 'desc']],
                
            });
            bls = await BonLivraison.findAll({
                where: {
                    type: 'BL',
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                },
                paranoid: true, order: [['createdAt', 'desc']],
                limit: limit,
                offset: pages,
            });
        }

        for (let i = 0; i < bls.length; i++) {

            let bl = bls[i]
            const camion = await Camion.findByPk(bl.camion_id, { paranoid: false })

            let dls = await DetailsLivraison.findAll({ where: { bonlivraison_id: bl.id } })
            let details = []

            for (let i = 0; i < dls.length; i++) {
                const dl = dls[i];
                let detailsBarcodes = []

                if (dl) {

                    let dlbs = await DetailsLivraisonBarcode.findAll({ where: { detailslivraison_id: dl.id } })

                    for (let ii = 0; ii < dlbs.length; ii++) {
                        const dlb = dlbs[ii]; 0.

                        if (dlb) {
                            detailsBarcodes.push({
                                id: dlb.id,
                                detailslivraison_id: dlb.detailslivraison_id,
                                qty: dlb.qty,
                                barcode: dlb.barcode,
                                creu_charger: dlb.creu_charger,
                                Compartiment: await Compartiment.findByPk(dlb.compartiment_id),
                                createdBy: await userCtrl.getUsefulUserData(dlb.createdBy),
                                updatedBy: await userCtrl.getUsefulUserData(dlb.updatedBy),
                                deletedBy: dlb.deletedBy,
                                restoredBy: dlb.restoredBy,
                                createdAt: dlb.createdAt,
                                updatedAt: dlb.updatedAt,
                                deletedAt: dlb.deletedAt,
                                suspensionComment: dlb.suspensionComment
                            })
                        }
                    }

                    details.push({
                        id: dl.id,
                        bonlivraison_id: dl.bonlivraison_id,
                        produit: await Produit.findByPk(dl.produit_id),
                        qtte: dl.qtte,
                        details_barcodes: detailsBarcodes,
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
            }

            list.push(
                {
                    id: bl.id,
                    numeroBL: bl.numeroBL,
                    date: bl.date,
                    info:bl.info,
                    station: await Station.findByPk(bl.station_id),
                    marketer: await Marketer.findByPk(bl.marketer_id),
                    transporteur: await Transporteur.findByPk(bl.transporteur_id),
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
                    depot: await Depot.findByPk(bl.depot_id),
                    produits: details,
                    statut: bl.statut,
                    statYear: bl.statYear,
                    statMonth: bl.statMonth,
                    commentaire: bl.commentaire,
                    ftbl: bl.ftbl,
                    cp: bl.cp,
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
                }
            )
        }

        res.json({ data: list ,nombre: nbrs})


    } catch (err) {
        console.log(err)
        next(err)
    }

}
exports.getAllPeriodeCamion = async (req, res, next) => {
    const startDate = req.params.startDate;
    let endDate = new Date(req.params.endDate);
    endDate.setDate(endDate.getDate() + 1);
    const immatriculation= req.params.id
    try {
        // const produitids = (await Produit.findAll({
        //     where:{
        //         nom:{[Op.like]:`%${immatriculation}%`}
        //     }
        // })).map(produit=>produit.id);
        const camions_id = await Camion.findAll({
            where:{
                imat: {
                    [Op.like]: `%${immatriculation}%`
                }
            },
            attributes: ['id']
        });
        const camionIds = camions_id.map(camion=>camion.id);
        const depot_ids = await Depot.findAll({
            where:{
                nom: {
                    [Op.like]:`%${immatriculation}`
                }
            },
            attributes: ['id']
        });
        const depotIds = depot_ids.map(depot=>depot.id);
        const stations_id = await Station.findAll({
            where:{
                nom: {
                    [Op.like]: `%${immatriculation}%`
                }
            },
            attributes: ['id']
        });
        const stationIds = stations_id.map(station => station.id);

        let list = [];
        let bls = []

        const user = await userCtrl.getUsefulUserData(req.reqUserId)
        if (req.reqUserType === 'Marketer') {
            bls = await BonLivraison.findAll({
                where: {
                    marketer_id: user.marketer_id, type: 'BL',
                    [Op.or]:[
                        {
                            numeroBL:{[Op.like]: `%${immatriculation}%`}
                        },
                        {statut: {[Op.like]:`%${immatriculation}%` }},
                        {camion_id: {[Op.in]:camionIds}},
                        {depot_id:{[Op.in]:depotIds}},
                        {station_id:{[Op.in]:stationIds}}
                    ],
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                }, paranoid: true, order: [['createdAt', 'desc']]
            });
        }
        else if (req.reqUserType === 'Station') {
            bls = await BonLivraison.findAll({
                where: {
                    station_id: user.station_id, type: 'BL',
                    [Op.or]:[
                        {
                            numeroBL:{[Op.like]: `%${immatriculation}%`}
                        },
                        {camion_id: {[Op.in]:camionIds}},
                        {statut: {[Op.like]:`%${immatriculation}%` }},
                        {depot_id:{[Op.in]:depotIds}}
                    ],
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                }, paranoid: true, order: [['createdAt', 'desc']]
            });
        }
        else if (req.reqUserType === 'B2B') {

            bls = await BonLivraison.findAll({
                where: {
                    station_id: user.b2b_id, type: 'BL',
                    [Op.or]:[
                        {
                            numeroBL:{[Op.like]: `%${immatriculation}%`}
                        },
                        {statut: {[Op.like]:`%${immatriculation}%` }},
                        {camion_id: {[Op.in]:camionIds}},
                        {depot_id:{[Op.in]:depotIds}},
                        {station_id:{[Op.in]:stationIds}}
                    ],
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                }, paranoid: true, order: [['createdAt', 'desc']]
            });
        }
        else if (req.reqUserType === 'Depot') {
            const marketers_id = await Marketer.findAll({
                where:{
                    nom: {
                        [Op.like]: `%${immatriculation}%`
                    }
                },
                attributes: ['id']
            });
            const marketerIds = marketers_id.map(maketer=>maketer.id);
            bls = await BonLivraison.findAll({
                where: {
                    depot_id: user.depot_id, type: 'BL',
                    [Op.or]:[
                        {
                            numeroBL:{[Op.like]: `%${immatriculation}%`}
                        },
                        {statut: {[Op.like]:`%${immatriculation}%` }},
                        {camion_id: {[Op.in]:camions_id}},
                        {marketer_id:{[Op.in]:marketerIds}},
                        {station_id:{[Op.in]:stationIds}}
                    ],
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                }, paranoid: true, order: [['createdAt', 'desc']]
            });
        }

        else {
            const marketers_id = await Marketer.findAll({
                where:{
                    nom: {
                        [Op.like]: `%${immatriculation}%`
                    }
                },
                attributes: ['id']
            });
            const marketerIds = marketers_id.map(maketer=>maketer.id);
            bls = await BonLivraison.findAll({
                where: {
                    type: 'BL',
                    [Op.or]:[
                        {
                            numeroBL:{[Op.like]: `%${immatriculation}%`}
                        },
                        {statut: {[Op.like]:`%${immatriculation}%` }},
                        {camion_id: {[Op.in]:camionIds}},
                        {marketer_id:{[Op.in]:marketerIds}},
                        {station_id:{[Op.in]:stationIds}},
                        {depot_id:{[Op.in]:depotIds}}
                    ],
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                },
                paranoid: true, order: [['createdAt', 'desc']],
            });
        }
        for (let i = 0; i < bls.length; i++) {
            let bl = bls[i]
            const camion = await Camion.findByPk(bl.camion_id, { paranoid: false })
            let dls = await DetailsLivraison.findAll({ where: { bonlivraison_id: bl.id }, })
            let details = []
            for (let i = 0; i < dls.length; i++) {
                const dl = dls[i];
                let detailsBarcodes = []
                if (dl) {
                    let dlbs = await DetailsLivraisonBarcode.findAll({ where: { detailslivraison_id: dl.id,  } })
                    for (let ii = 0; ii < dlbs.length; ii++) {
                        const dlb = dlbs[ii]; 0.
                        if (dlb) {
                            detailsBarcodes.push({
                                id: dlb.id,
                                detailslivraison_id: dlb.detailslivraison_id,
                                qty: dlb.qty,
                                barcode: dlb.barcode,
                                creu_charger: dlb.creu_charger,
                                Compartiment: await Compartiment.findByPk(dlb.compartiment_id),
                                createdBy: await userCtrl.getUsefulUserData(dlb.createdBy),
                                updatedBy: await userCtrl.getUsefulUserData(dlb.updatedBy),
                                deletedBy: dlb.deletedBy,
                                restoredBy: dlb.restoredBy,
                                createdAt: dlb.createdAt,
                                updatedAt: dlb.updatedAt,
                                deletedAt: dlb.deletedAt,
                                suspensionComment: dlb.suspensionComment
                            })
                        }
                    }
                    details.push({
                        id: dl.id,
                        bonlivraison_id: dl.bonlivraison_id,
                        produit: await Produit.findByPk(dl.produit_id),
                        qtte: dl.qtte,
                        details_barcodes: detailsBarcodes,
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
            }

            list.push(
                {
                    id: bl.id,
                    numeroBL: bl.numeroBL,
                    date: bl.date,
                    info:bl.info,
                    station: await Station.findByPk(bl.station_id),
                    marketer: await Marketer.findByPk(bl.marketer_id),
                    transporteur: await Transporteur.findByPk(bl.transporteur_id),
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
                    depot: await Depot.findByPk(bl.depot_id),
                    produits: details,
                    statut: bl.statut,
                    statYear: bl.statYear,
                    statMonth: bl.statMonth,
                    commentaire: bl.commentaire,
                    ftbl: bl.ftbl,
                    cp: bl.cp,
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
                }
            )
        }
        res.json({ data: list})
    } catch (err) {
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
        let bl = await BonLivraison.findByPk(id, { paranoid: false })
        if (bl === null) {
            return res.status(404).json({ message: 'BL introuvable' })
        }


        let camion = await Camion.findByPk(bl.camion_id, { paranoid: false })

        let dls = await DetailsLivraison.findAll({ where: { bonlivraison_id: bl.id } })
        let details = []
        let _station = {};
        if (bl.type=='BL'){
            _station = await Station.findByPk(bl.station_id)
        }else{
            const _depot = await Depot.findByPk(bl.station_id)
            _station = {
                id:_depot.id,
                poi_id:'0',
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
        for (let i = 0; i < dls.length; i++) {
            const dl = dls[i];
            let detailsBarcodes = []

            if (dl) {

                let dlbs = await DetailsLivraisonBarcode.findAll({ where: { detailslivraison_id: dl.id } })

                for (let ii = 0; ii < dlbs.length; ii++) {
                    const dlb = dlbs[ii]; 0.

                    if (dlb) {
                        detailsBarcodes.push({
                            id: dlb.id,
                            detailslivraison_id: dlb.detailslivraison_id,
                            qty: dlb.qty,
                            barcode: dlb.barcode,
                            creu_charger: dlb.creu_charger,
                            Compartiment: await Compartiment.findByPk(dlb.compartiment_id),
                            createdBy: await userCtrl.getUsefulUserData(dlb.createdBy),
                            updatedBy: await userCtrl.getUsefulUserData(dlb.updatedBy),
                            deletedBy: dlb.deletedBy,
                            restoredBy: dlb.restoredBy,
                            createdAt: dlb.createdAt,
                            updatedAt: dlb.updatedAt,
                            deletedAt: dlb.deletedAt,
                            suspensionComment: dlb.suspensionComment
                        })
                    }
                }

                details.push({
                    id: dl.id,
                    bonlivraison_id: dl.bonlivraison_id,
                    produit: await Produit.findByPk(dl.produit_id),
                    qtte: dl.qtte,
                    details_barcodes: detailsBarcodes,
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
        }

        //ENVOI
        return res.json({
            data:
            {
                id: bl.id,
                numeroBL: bl.numeroBL,
                date: bl.date,
                info:bl.info,
                station: _station,
                // station: await Station.findByPk(bl.station_id),
                marketer: await Marketer.findByPk(bl.marketer_id),
                transporteur: await Transporteur.findByPk(bl.transporteur_id),
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
                depot: await Depot.findByPk(bl.depot_id),
                produits: details,
                statut: bl.statut,
                statYear: bl.statYear,
                statMonth: bl.statMonth,
                commentaire: bl.commentaire,
                ftbl: bl.ftbl,
                cbl_tp: bl.cbl_tp,
                cbl_ttid: bl.cbl_ttid,
                cbl_tdt: bl.cbl_tdt,
                qty: bl.qty,
                date_chargement: bl.date_chargement,
                date_dechargement: bl.date_dechargement,
                createdBy: await userCtrl.getUsefulUserData(bl.createdBy),
                updatedBy: await userCtrl.getUsefulUserData(bl.updatedBy),
                deletedBy: bl.deletedBy,
                restoredBy: bl.restoredBy,
                createdAt: bl.createdAt,
                updatedAt: bl.updatedAt,
                deletedAt: bl.deletedAt,
                suspensionComment: bl.suspensionComment
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
                }, paranoid: true, order: [['createdAt', 'desc']]
            })
        } else {
            bls = await BonLivraison.findAll({
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
                }, paranoid: true, order: [['createdAt', 'desc']]
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
                        poi_id:'0',
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

exports.getDepotCamionGPLBouteilleAValider = async (req, res, next) => {
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
                }, paranoid: true, order: [['createdAt', 'desc']]
            })
        } else {
            bls = await BonLivraison.findAll({
                where: {
                    [Op.and]: [
                        { camion_id: camion_id },
                        { depot_id: user.depot_id },
                        { produit_id: 3 },
                        {
                            [Op.or]: [
                                { statut: 'Approuvé' },
                                { statut: 'Bon à Charger' },
                                { statut: 'Rejeté' },
                            ]
                        }
                    ]
                }, paranoid: true, order: [['createdAt', 'desc']]
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
                        poi_id:'0',
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

exports.getDepotCamionGPLBouteilleACharger = async (req, res, next) => {
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
                        { produit_id: 3 },
                        {
                            [Op.or]: [
                                { statut: 'Approuvé' },
                                { statut: 'Ouvert' },
                                { statut: 'Rejeté' },
                                // { statut: 'Bon à Charger' },
                            ]
                        }
                    ]
                }, paranoid: true, order: [['createdAt', 'desc']]
            })
        } else {
            bls = await BonLivraison.findAll({
                where: {
                    [Op.and]: [
                        { camion_id: camion_id },
                        { depot_id: user.depot_id },
                        {
                            [Op.or]: [
                                { statut: 'Bon à Charger' },
                                { statut: 'Chargé' },
                            ]
                        }
                    ]
                }, paranoid: true, order: [['createdAt', 'desc']]
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
                        poi_id:'0',
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

exports.getDeatilDechargement = async (req,res)=>{
    const blId = parseInt(req.params.blId)
    const bl= await BonLivraison.findByPk(blId)
    if (!bl) {
        return res.status(400).json({ message: 'Bon de livraison introiuvable' })
        
    }
    try {
        let listElements = []
        const dls = await DetailsLivraison.findAll({ where: { bonlivraison_id: bl.id } },{ paranoid: false })
        for(const dl of dls){
            const detailBarecode = await DetailsLivraisonBarcode.findAll({ where: {detailslivraison_id :dl.id}},{ paranoid: false })
            let barrCode = []
            for(const bc of detailBarecode){
                barrCode.push({
                    id:bc.id,
                    barcode:bc.barcode,
                    creu_charger:bc.creu_charger,
                    qty:bc.qty,
                    compartiment: await Compartiment.findByPk(bc.compartiment_id)
                })
        
            }
            listElements.push({
                id:dl.id,
                qtte:dl.qtte,
                produit: await Produit.findByPk(dl.produit_id),
                detailChargement:barrCode
            })

        }
        return res.json({data:listElements})
        
    } catch (err) {
        console.log(error)
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
    } catch (err) {
        next(err)
    }
}
exports.getCamionRelatedBLs = async (req, res, next) => {
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
                }, paranoid: true, order: [['createdAt', 'desc']]
            })
        } else {
            bls = await BonLivraison.findAll({
                where: {
                    [Op.and]: [
                        { camion_id: camion_id },
                        { depot_id: user.depot_id },
                        { type: 'BL' },
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

                list.push(
                    {
                        id: bl.id,
                        numeroBL: bl.numeroBL,
                        date: bl.date,
                        info:bl.info,
                        station: await Station.findByPk(bl.station_id),
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
        // console.log(err);
        next(err)
    }
}

exports.getCamionRelatedBLsbyperiods = async (req, res, next) => {
    let camion_id = parseInt(req.params.id)
    const startDate = req.params.startDate;
    const endDate = req.params.endDate;
    // let date_debut = 
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
                                { statut: 'Bon à Charger' },
                            ]
                        }
                    ],
                    createdAt: { [Op.between]: [startDate, endDate] }
                }, paranoid: false, order: [['createdAt', 'desc']]
            })
        } else {
            bls = await BonLivraison.findAll({
                where: {
                    [Op.and]: [
                        { camion_id: camion_id },
                        { depot_id: user.depot_id },
                        { type: 'BL' },
                        {
                            [Op.or]: [
                                { statut: 'Approuvé' },
                                { statut: 'Bon à Charger' },
                                { statut: 'Chargé' },
                                { statut: 'Rejeté' }
                            ]
                        }
                    ], createdAt: { [Op.between]: [startDate, endDate] }
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

                list.push(
                    {
                        id: bl.id,
                        numeroBL: bl.numeroBL,
                        date: bl.date,
                        info: bl.info,
                        station: await Station.findByPk(bl.station_id),
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
        // console.log(err);
        next(err)
    }
}

exports.getBLsBonacharger = async (req, res, next) => {

    let statuts = "Bon à Charger"

    console.log('req-body', req.body)

    // if(!statuts || !Array.isArray(statuts) || statuts.length <= 0){return res.status(400).json({message: 'Liste de statuts invalide'})}

    // for (const statut of statuts) {
    //     if(!statut || ['Ouvert','Approuvé','Bon à Charger','Chargé','Déchargé','Annulé','Rejeté','Payé'].indexOf(statut)<0){return res.status(400).json({message: statut+' n\'est pas un statut valide'})}
    // }

    try {
        //RECUPERATION
        let dls
        let list = []
        let CamionList = []


        currentUser = await userCtrl.getUsefulUserData(req.reqUserId);
        let statusesOption = statuts.length === 1 ? { statut: statuts[0] } : { statut: statuts };
        let options = statusesOption;

        if (req.reqUserType === 'Station') {
            options = {
                [Op.and]: [statusesOption, { station_id: currentUser.station_id }, { type: 'BL' }]
            }
        }
        else if (req.reqUserType === 'Marketer') {
            options = {
                [Op.and]: [statusesOption, { marketer_id: currentUser.marketer_id }, { type: 'BL' }]
            }
        }
        else if (req.reqUserType === 'Depot') {
            options = {
                [Op.and]: [statusesOption, { depot_id: currentUser.depot_id }, { type: 'BL' }]
            }
        }

        // console.log(options);

        let bls = await BonLivraison.findAll({ where: options, group: ['camion_id'], order: [['createdAt', 'desc']] })
        for (let index = 0; index < bls.length; index++) {
            const blcam_id = bls[index].id;
            let camion = await Camion.findAll({ where: { bonlivraison_id: blcam_id }, paranoid: false })
            CamionList.push(...camion)
        }


        //ENVOI

        for (const bl of bls) {
            console.log(bl);
            const countBonacharger = await Camion.findAll({ where: { bonlivraison_id: bl.id }, paranoid: false })
        }

        d = {
            BlBonaCharger: countBonacharger.length
        }
        return res.json({ data: CamionList, Bls: bls })

    } catch (err) {
        next(err)
    }
}
exports.getBLsByStatuses = async (req, res, next) => {

    let statuts = req.body.statuts;

    // console.log('',req.body)

    if (!statuts || !Array.isArray(statuts) || statuts.length <= 0) { return res.status(400).json({ message: 'Liste de statuts invalide' }) }

    for (const statut of statuts) {
        if (!statut || ['Ouvert', 'Approuvé', 'Bon à Charger', 'Chargé', 'Déchargé', 'Annulé', 'Rejeté', 'Payé'].indexOf(statut) < 0) { return res.status(400).json({ message: statut + ' n\'est pas un statut valide' }) }
    }

    try {
        //RECUPERATION
        let dls
        let list = []


        currentUser = await userCtrl.getUsefulUserData(req.reqUserId);
        let statusesOption = statuts.length === 1 ? { statut: statuts[0] } : { statut: statuts };
        let options = statusesOption;

        if (req.reqUserType === 'Station') {
            options = {
                [Op.and]: [statusesOption, { station_id: currentUser.station_id }, { type: 'BL' }]
            }
        }
        else if (req.reqUserType === 'B2B') {
            options = {
                [Op.and]: [statusesOption, { station_id: currentUser.b2b_id }, { type: 'BL' }]
            }
        }
        else if (req.reqUserType === 'Marketer') {
            options = {
                [Op.and]: [statusesOption, { marketer_id: currentUser.marketer_id }, { type: 'BL' }]
            }
        }
        else if (req.reqUserType === 'Depot') {
            options = {
                [Op.and]: [statusesOption, { depot_id: currentUser.depot_id }, { type: 'BL' }]
            }
        }

        // console.log(options);

        let bls = await BonLivraison.findAll({ where: options, order: [['createdAt', 'desc']] })

        for (let i = 0; i < bls.length; i++) {
            let bl = bls[i];
            let productList = []

            if (bl !== null) {
                dls = await DetailsLivraison.findAll({ where: { bonlivraison_id: bl.id }, paranoid: false })

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
                list.push({
                    id: bl.id,
                    numeroBL: bl.numeroBL,
                    date: bl.date,
                    info:bl.info,
                    station: await Station.findByPk(bl.station_id),
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
                        suspensionComment: camion.suspensionComment
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

        // console.log(list)

        //ENVOI
        return res.json({ data: list })

    } catch (err) {
        next(err)
    }
}

exports.getBLsByStatusByCamionNotYetLoaded = async (req, res, next) => {

    const statut = xss(req.body.statut)
    const camion_id = parseInt(req.body.camion_id)

    if (!statut || !camion_id) { return res.status(400).json({ message: 'Donnée(s) manquantes' }) }
    else if (statuts.indexOf(statut) < 0) { return res.status(400).json({ message: statut + ' n\'est pas un statut valide' }) }

    try {
        //RECUPERATION
        let dls
        let list = []
        let bls = []

        const data = await BonLivraison.findAll({ where: { [Op.and]: [{ statut: statut }, { camion_id: camion_id }, { type: 'BL' }] }, order: [['createdAt', 'desc']] })
        // for (const bl of data) {
        //     const blInBcCheck = await DetailsChargement.findOne({ where: { bonlivraison_id: bl.id } })
        //     if (blInBcCheck === null) { bls.push(bl) }
        // }

        for (const bl of bls) {

            let productList = []

            if (bl !== null) {
                dls = await DetailsLivraison.findAll({ where: { bonlivraison_id: bl.id }, paranoid: false })

                for (const dl of dls) {
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
                let camion = await Camion.findByPk(bl.camion_id)

                list.push({
                    id: bl.id,
                    numeroBL: bl.numeroBL,
                    date: bl.date,
                    info:bl.info,
                    station: await Station.findByPk(bl.station_id),
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
                        suspensionComment: camion.suspensionComment
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

        // console.log(productList)

        //ENVOI
        return res.json({ data: list })

    } catch (err) {
        next(err)
    }
}

exports.getBarcodesByBl = async (req, res, next) => {
    const blId = req.body.bl_id;
    if (!blId) { return res.status(400).json({ message: 'Veuillez renseigner tous les champs' }) }

    try {
        const bl = await BonLivraison.findByPk(blId)
        if (bl === null) { return res.status(404).json('Données introuvables') }

        let list = [];
        const dls = await DetailsLivraison.findAll({ where: { bonlivraison_id: blId } });

        for (const dl of dls) {
            const dlbs = await DetailsLivraisonBarcode.findAll({ where: { detailslivraison_id: dl.id, type: 'BL' } })
            for (const dlb of dlbs) {
                list.push({
                    id: dlb.id,
                    detailslivraison_id: dlb.detailslivraison_id,
                    qty: dlb.qty,
                    barcode: dlb.barcode,
                    creu_charger: dlb.creu_charger,
                    compartiment: await Compartiment.findByPk(dlb.compartiment_id),
                    createdBy: dlb.createdBy,
                    updatedBy: dlb.updatedBy,
                    deletedBy: dlb.deletedBy,
                    restoredBy: dlb.restoredBy,
                    suspensionComment: dlb.suspensionComment,
                    createdAt: dlb.createdAt,
                    updatedAt: dlb.updatedAt,
                    deletedAt: dlb.deletedAt,
                })
            }
        }

        return res.json(list)

    } catch (err) {
        next(err)
    }
}

exports.add = async (req, res, next) => {

    let {
        station_id, transporteur_id, depot_id, camion_id, detailslivraison,info
    } = req.body

    //FORMATAGE
    station_id = parseInt(station_id)
    depot_id = parseInt(depot_id)

    let user = await User.findByPk(req.reqUserId)
    const marketer_id = parseInt(user.marketer_id)

    // transporteur_id = ""
    transporteur_id = parseInt(transporteur_id)
    camion_id = parseInt(camion_id)

    const camion = await Camion.findByPk(camion_id, { paranoid: false })

    //VALIDATION DES DONNEES RECUES
    if (!station_id || !camion_id || !depot_id || !detailslivraison) {
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
        let bl = await BonLivraison.create({
            station_id: station_id,
            marketer_id: marketer_id,
            transporteur_id: camion.transporteur_id,
            camion_id: camion_id,
            depot_id: depot_id,
            statut: statut,
            type: 'BL',
            info:info,
            createdBy: req.reqUserId,
            updatedBy: req.reqUserId
        })

        const newDate = new Date()
        const year = newDate.getFullYear()
        const month = ('0' + (newDate.getMonth() + 1)).slice(-2)
        const day = ('0' + newDate.getDate()).slice(-2)

        let numBL = 'BL' + req.reqUserId + year + month + day + bl.id

        await BonLivraison.update({ numeroBL: numBL, statMonth: month, statYear: year }, { where: { id: bl.id } })


        for (const dl of detailslivraison) {

            await DetailsLivraison.create({
                bonlivraison_id: bl.id,
                produit_id: parseInt(dl.produit_id),
                qtte: parseInt(dl.qtte),
                createdBy: req.reqUserId,
                updatedBy: req.reqUserId
            })

        }

        const blAssociatedDls = await DetailsLivraison.findAll({ where: { bonlivraison_id: bl.id } })
        let total = 0;
        // console.log('total avant -->', total);
        for (const dl of blAssociatedDls) { dl ? total += dl.qtte : false }
        // console.log('total après -->', total);

        await BonLivraison.update({ qty: total }, { where: { id: bl.id } })
        const activeCamion = await Camion.findByPk(camion_id)
        // await Camion.update({marketer_id: marketer_id, filling_level: activeCamion.filling_level+total}, {where: {id: camion_id}})

        //NOTIF TO MARKETERS
        const marketerUsers = await User.findAll({ where: { marketer_id: marketer_id }, paranoid: false })
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
        next(err)
    }
}
exports.dpbUpdateBL = async (req, res, next) => {

    let bls = req.body.ids
    const depotId = req.body.depot_id

    console.log("dpb aprovals",req.body);
    if (!depotId) {
        return res.status(400).json({ message: "Donnée(s) manquante(s) ou mal formatée(s)" })
    }
    const leDepot = await Depot.findByPk(depotId)
    if (!leDepot) {
        return res.status(400).json({ message: "Le dépôt choisi n'existe pas" })
    }
    if (!bls ||!Array.isArray(bls)) { return res.status(400).json({ message: "Donnée(s) manquante(s) ou mal formatée(s)" }) }
    if (req.reqUserType!="DPB" && req.reqUserType!="Depot") {
         return res.status(400).json({ message: "Accèss non autorisé" })
    }


    try {
        if (req.reqUserType=="DPB") {
            
            for (const id of bls) {
                await BonLivraison.update({depot_id:depotId,statut:"Approuvé"}, {where: {id: id}})
            }
        }else{

            for (const id of bls) {
                await BonLivraison.update({depot_id:depotId,statut:"Bon à charger"}, {where: {id: id}})
            }
        }
        return res.status(204).json({})

    } catch (err) {
        next(err)
    }
}
exports.changeBLStatut = async (req, res, next) => {

    let bls = req.body.ids
    const statutbls = req.body.statut;
    if (!statutbls) {
        return res.status(400).json({ message: "Donnée(s) manquante(s) ou mal formatée(s)" })
    }
    if (!bls ||!Array.isArray(bls)) { return res.status(400).json({ message: "Donnée(s) manquante(s) ou mal formatée(s)" }) }
    try {  
        for (const id of bls) {
            await BonLivraison.update({statut:statutbls}, {where: {id: id}})
        }
        return res.status(204).json({})
    } catch (err) {
        console.log(err);
        next(err)
    }
}
exports.marketerDispatchBL = async (req, res, next) => {

    let bls = req.body.ids
    const stationId = req.body.station_id

    console.log("Station di",req.body);
    // return res.status(400).json({ message: "Donnée(s) manquante(s) ou mal formatée(s)" })
    if (!stationId) {
        return res.status(400).json({ message: "Donnée(s) manquante(s) ou mal formatée(s)" })
    }
    const laStation = await Station.findByPk(stationId)
    if (!laStation) {
        return res.status(400).json({ message: "La station choisie n'existe pas" })
    }
    if (!bls ||!Array.isArray(bls)) { return res.status(400).json({ message: "Donnée(s) manquante(s) ou mal formatée(s)" }) }
    if (req.reqUserType!="Marketer" ) {
         return res.status(400).json({ message: "Accèss non autorisé" })
    }
    try { 
        for (const id of bls) {
            const updateBL = await BonLivraison.update({station_id:stationId}, {where: {id: id}})
        }
        
        return res.status(204).json({})

    } catch (err) {
        console.log(err);
        next(err)
    }
}
exports.addMany = async (req, res, next) => {

    let bls = req.body.bls

    // console.log("boboboboob",req.body);

    if (!bls || !Array.isArray(bls)) { return res.status(400).json({ message: "Donnée(s) manquante(s) ou mal formatée(s)" }) }

    //INITIALIZING COMMON CAMION TO CHECK IF ALL BLS ARE FOR THE SAME
    let commonCamionId = 0;

    for (const bl of bls) {
        //CHECKING IF ALL BL DATA ARE PROVIDED
        if (
            !bl.station_id || !bl.depot_id || !bl.camion_id
            || !bl.detailslivraison || !Array.isArray(bl.detailslivraison)
        ) {
            // console.log('jesuiiiiiiiiiiiiiiiiiiiiii',bl)
            return res.status(400).json({ message: "Mauvais format d'un ou de plusieurs BLs" })
        }

        //CHECKING IF THE CAMION IS SAME FOR ALL BLs
        if (commonCamionId === 0) { commonCamionId = bl.camion_id }
        else if (commonCamionId !== bl.camion_id) { return res.status(401).json({ message: "Tous les BLs doivent porter sur le même camion" }) }

        //CHECKING IF ALL DL DATA ARE PROVIDED
        for (const dl of bl.detailslivraison) {
            // console.log("c'est les nouuuuuuu",dl)
            if (!dl.produit_id || !dl.qtte) { return res.status(400).json({ message: "Mauvais format d'un ou de plusieurs détails" }) }
        }
    }


    try {
        console.log('total après -->',);
        let totalProductQtyForSameCamion = 0;
        let depotCheck ={};
        //CHECKING DATA        
        for (const bl of bls) {
            if (bl.depot_id !== '0') {
                depotCheck = await Depot.findByPk(bl.depot_id)
                if (!depotCheck) { return res.status(404).json({ message: "Un ou plusieurs dépôt(s) introuvable(s)" }) }
            }
            const camionCheck = await Camion.findByPk(bl.camion_id)
            if (!camionCheck) { return res.status(404).json({ message: "Un ou plusieurs camion(s) introuvable(s)" }) }
            // else if(camionCheck.filling_level >= camion.capacity){ return res.status(409).json({ message: 'Un ou plusieurs camion(s) déjà plein(s)' }) }

            for (const dl of bl.detailslivraison) {
                const produitCheck = await Produit.findByPk(dl.produit_id)
                if (!produitCheck) { return res.status(404).json({ message: "Un ou plusieurs produits(s) introuvable(s)" }) }
                //INCREMENTATION DE LA QTY TOTAL DES PRODUITS DU BL
                totalProductQtyForSameCamion += dl.qtte;
            }

        }

        //DEFINING USEFUL VARIABLES
        const user = await User.findByPk(req.reqUserId)
        const marketer_id = parseInt(user.marketer_id)

        //COLLECTING NUM BLS
        let numBLs = [];

        //PROCESSING DATA   
        for (const bl of bls) {
            //DEFINING USEFUL VARIABLES
            const station_id = parseInt(bl.station_id)
            // const transporteur_id = parseInt(bl.transporteur_id)
            const depot_id = parseInt(bl.depot_id)
            const camion_id = parseInt(bl.camion_id)
            const camion = await Camion.findByPk(camion_id)
            let statut = (user.type === 'Marketer' && (user.role === 'Admin' || user.role === 'Super Admin')) ? 'Ouvert' : 'Ouvert';
            // let statut = (user.type === 'Marketer' && (user.role === 'Admin' || user.role === 'Super Admin')) ? 'Approuvé' : 'Ouvert';

            // CREATION
            const newBL = await BonLivraison.create({
                station_id: station_id,
                marketer_id: marketer_id,
                transporteur_id: camion.transporteur_id,
                camion_id: camion_id,
                depot_id: depot_id,
                info:bl.info===''||bl.info===null?'Vide':bl.info,
                statut:depotCheck.type=='INTERIEUR'?'Approuvé': statut,
                type: 'BL',
                createdBy: req.reqUserId,
                updatedBy: req.reqUserId
            })

            //UPDATING FEW THINGS
            const newDate = new Date()
            const year = newDate.getFullYear()
            const month = ('0' + (newDate.getMonth() + 1)).slice(-2)
            const day = ('0' + newDate.getDate()).slice(-2)

            let numBL = 'BL' + req.reqUserId + year + month + day + newBL.id;
            numBLs.push(numBL);

            await BonLivraison.update({ numeroBL: numBL, statMonth: month, statYear: year }, { where: { id: newBL.id } })
            const sumsByProductId = bl.detailslivraison.reduce((accumulator, currentValue) => {
                const { produit_id, qtte } = currentValue;
                const quantity = parseInt(qtte);
                accumulator[produit_id] = (accumulator[produit_id] || 0) + quantity;
                return accumulator;
            }, {});
            const sumsArray = Object.entries(sumsByProductId).map(([productId, totalQuantity]) => ({
                'produit_id': productId,
                'qtte': totalQuantity
            }));
            //SUMMARISING PRODUCTS QTY WHILE CREATING EACH DL
            for (const dl of sumsArray) {

                await DetailsLivraison.create({
                    bonlivraison_id: newBL.id,
                    produit_id: parseInt(dl.produit_id),
                    qtte: parseInt(dl.qtte),
                    createdBy: req.reqUserId,
                    updatedBy: req.reqUserId
                })

            }

            const blAssociatedDls = await DetailsLivraison.findAll({ where: { bonlivraison_id: newBL.id } })
            let total = 0;
            // console.log('total avant -->', total);
            for (const dl of blAssociatedDls) { dl ? total += dl.qtte : false }
            // console.log('total après -->', total);

            await BonLivraison.update({ qty: total }, { where: { id: newBL.id } })
            // const activeCamion = await Camion.findByPk(camion_id)
            // await Camion.update({marketer_id: marketer_id, filling_level: activeCamion.filling_level+total}, {where: {id: camion_id}})

        }


        //NOTIF TO MARKETERS
        const marketerUsers = await User.findAll({ where: { marketer_id: marketer_id ,type:'Super Admin'}, paranoid: false })
        for (const marketerUser of marketerUsers) {
            if (marketerUser.type !== 'Station') {
                const marketerCompany = await Marketer.findByPk(marketer_id, { paranoid: false })
                notifCtrl.notifySingle(marketerUser.id, `${numBLs.length} nouveaux BLs ont été  émis`, `${user.name} a émis ${numBLs.length} Bons de Livraison (BL) dont les numeros sont : ${numBLs.toString()}. Ces BLs sont au nom de la structure ${marketerCompany.nom}.`)
                mailerCtrl.mailSingle(marketerUser.id, `${numBLs.length} nouveaux BLs ont été  émis`, `${user.name} a émis ${numBLs.length} Bons de Livraison (BL) dont les numeros sont : ${numBLs.toString()}. Ces BLs sont au nom de la structure ${marketerCompany.nom}.`)
            }
        }

        // //historicizing
        // await historicize(bl.id, 'Création', `${user.name} a créé un nouveau bl avec le statut ${statut}`, user.id)

        return res.status(204).json({})

    } catch (err) {
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
        let bl = await BonLivraison.findByPk(id)
        let user = await userCtrl.getUsefulUserData(req.reqUserId) 

        if (req.body.info) {
        await BonLivraison.update({ info: req.body.info}, { where: { id: id } })}
        if (bl === null) {
            return res.status(404).json({ message: 'BL introuvable' })
        }

        // else if (req.reqUserType === 'DPB' && bl.statut === 'Ouvert') {
        //     if (req.body.station_id) {
        //         await BonLivraison.update({ station_id: req.body.station_id }, { where: { id: id } })
        //         return res.json({ message: `La destination du BL modifier avec succès` })
        //     } else {
        //         return res.status(401).json({ message: `Désolé, ce BL est ${bl.statut}` })
        //     }
        // } 
    
        else if (req.reqUserType === 'Marketer' && bl.statut === 'Chargé'  ) {
            if (req.body.station_id) {
                await BonLivraison.update({ station_id: req.body.station_id }, { where: { id: id } })
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

        //PURGE DE L'ANCIEN CAMION ET DE SES COMPARTIMENTS

        if (req.body.statut === 'Annulé' || req.body.statut === 'Rejeté') {

            const dls = await DetailsLivraison.findAll({ where: { bonlivraison_id: id } })
            let total = (await Camion.findByPk(bl.camion_id)).filling_level;
            for (const dl of dls) { total = total - dl.qtte }

            let newFillingLevel = 0;
            let newMarketerId = null;
            if (total <= 0) {
                newFillingLevel = 0;
                newMarketerId = null;
            } else {
                newFillingLevel = total;
                newMarketerId = (await Camion.findByPk(bl.camion_id)).marketer_id
            }

            await Camion.update({ filling_level: newFillingLevel, marketer_id: newMarketerId }, { where: { id: bl.camion_id } })
            await Compartiment.update({ is_busy: 0 }, { where: { camion_id: bl.camion_id } })

            //NOTIF TO MARKETERS
            const marketer_id = bl.marketer_id
            const marketerUsers = await User.findAll({ where: { marketer_id: marketer_id,type:'Super Admin' } })
            for (const marketerUser of marketerUsers) {
                if (marketerUser.type !== 'Station') {
                    const marketerCompany = await Marketer.findByPk(marketer_id)
                    notifCtrl.notifySingle(marketerUser.id, `${bl.numeroBL} a été ${req.body.statut}`, `${user.name} a ${req.body.statut} le bon de livraison N° ${bl.numeroBL} au nom de ${marketerCompany.nom}. Ce BL est donc retiré du circuit`)
                    mailerCtrl.mailSingle(marketerUser.id, `${bl.numeroBL} a été  ${req.body.statut}`, `${user.name} a ${req.body.statut} le bon de livraison N° ${bl.numeroBL} au nom de ${marketerCompany.nom}. Ce BL est donc retiré du circuit`)
                }
            }
        }
        if (req.body.statut === 'Approuvé') {
            // get this transporterid from camion id
            //    const caMion =  await Camion.findByPk(bl.transporteur_id)
            //NOTIF TO MARKETERS
            const marketer_id = bl.marketer_id
            const depotCible = await Depot.findByPk(bl.depot_id)
            const marketerUsers = await User.findAll({ where: { marketer_id: marketer_id,type:'Super Admin' } })
            const camionCible = await Camion.findByPk(bl.camion_id)
            const updateBL = await BonLivraison.update({ statut: req.body.statut }, { where: { id: id } })
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
            const marketerUsers = await User.findAll({ where: { marketer_id: marketer_id ,type:'Super Admin'}, paranoid: false })
            const camionCible = await Camion.findByPk(bl.camion_id, { paranoid: false })
            const trCible = camionCible.transporteur_id
            for (const marketerUser of marketerUsers) {
                if (marketerUser.type !== 'Station') {
                    const marketerCompany = await Marketer.findByPk(marketer_id, { paranoid: false })
                    notifCtrl.notifySingle(marketerUser.id, `${bl.numeroBL} est à présent bon à charger`, `${user.name} a déclaré bon à charger le bon de livraison N° ${bl.numeroBL} au nom de ${marketerCompany.nom}. Le camion d'immatriculation ${camionCible.imat} de la structure ${trCible.nom} peut donc recevoir le chargement.`)
                    mailerCtrl.mailSingle(marketerUser.id, `${bl.numeroBL} est à présent bon à charger`, `${user.name} a déclaré bon à charger le bon de livraison N° ${bl.numeroBL} au nom de ${marketerCompany.nom}. Le camion d'immatriculation ${camionCible.imat} de la structure ${trCible.nom} peut donc recevoir le chargement.`)
                }
            }

            //NOTIF TO DEPOT
            const depotUsers = await User.findAll({ where: { depot_id: bl.depot_id ,type:'Super Admin'} })
            const marketerCompany = await Marketer.findByPk(bl.marketer_id, { paranoid: false })
            // for (const depotUser of depotUsers) {
            //     notifCtrl.notifySingle(depotUser.id, `Le BL ${bl.numeroBL} est bon à charger`, `${user.name} a déclaré bon à charger le bon de livraison N° ${bl.numeroBL} au nom de ${marketerCompany.nom}. Le camion d'immatriculation ${camionCible.imat} de la structure ${trCible.nom} peut donc recevoir le chargement.`)
            //     mailerCtrl.mailSingle(depotUser.id, `Le BL ${bl.numeroBL} est bon à charger`, `${user.name} a déclaré bon à charger le bon de livraison N° ${bl.numeroBL} au nom de ${marketerCompany.nom}. Le camion d'immatriculation ${camionCible.imat} de la structure ${trCible.nom} peut donc recevoir le chargement.`)
            // }
        }

        //MISE A JOUR
        await BonLivraison.update(req.body, { where: { id: id } })
        await BonLivraison.update({ updatedBy: req.reqUserId }, { where: { id: id } })

        if (req.body.detailslivraison) {
            let total = 0;
            let camion = await Camion.findByPk(bl.camion_id)

            //REGULATION AUTO DE L'ETAT DE COMPLETION ET DE DISPONIBILITE DU CAMION
            const oldDls = await DetailsLivraison.findAll({ where: { bonlivraison_id: id } })
            for (const oldDl of oldDls) { total = total + oldDl.qtte }
            await Camion.update({ filling_level: camion.filling_level - total }, { where: { id: camion.id } })
            await DetailsLivraison.destroy({ where: { bonlivraison_id: id } })

            total = 0;

            for (const detail of req.body.detailslivraison) {
                await DetailsLivraison.create({
                    bonlivraison_id: id,
                    produit_id: detail.produit_id,
                    qtte: detail.qtte,
                    createdBy: req.reqUserId,
                    updatedBy: req.reqUserId
                })
                total += detail.qtte;
            }

            //REGULATION AUTO DE L'ETAT DE COMPLETION ET DE DISPONIBILITE DU CAMION
            await BonLivraison.update({ qty: total }, { where: { id: bl.id } })
            // await Camion.update({ filling_level: camion.filling_level + total }, { where: { id: camion.id } })
            // camion = await Camion.findByPk(bl.camion_id)
            // if (camion.filling_level <= 0) { await Camion.update({ marketer_id: null }, { where: { id: camion.id } }) }

        }

        // //historicizing
        // await historicize(id, 'Modification', `${user.name} a modifié bl n°${id} avec les données brutes suivantes: ${JSON.stringify(req.body)} `, user.id)

        return res.json({ message: 'Le BL a bien été modifié' })

    } catch (err) {
        next(err)
    }
}

exports.unload = async (req, res, next) => {
    let id = parseInt(req.params.blId)
    const data = req.body.data;
    // console.log('=================je suis le data envoyer par le gerant de la station ===================');
    console.log(data);
    let bl = await BonLivraison.findByPk(id, { paranoid: false })
    const dataDepot= await Depot.findByPk(bl.depot_id)
    if (bl.statut == "Déchargé") {
        return res.status(400).json({ message: 'Ce Bon est déja déchargé' })
    }
    if (bl.statut != "Chargé") {
        return res.status(400).json({ message: "Ce Bon n'est pas encore chargé" })
    }
    if (!id) {
        return res.status(400).json({ message: 'Parametre(s) manquant(s)' })
    }
    if (req.reqUserType == "Station") {
        if (!Array.isArray(data)) {
            return res.status(400).json({ message: 'Format de liste incorrect.' });
        }
        try {
            data.forEach(async (item, index) => {
                await DetailsLivraison.update({ qtte_avant_livraison: item.before, qtte_apres_livraison: item.after, updatedBy: req.reqUserId }, { where: { id: item.id } })
            });
        } catch (error) {
            console.log(error);
            return res.status(400).json({ message: 'Erreur de processus.' });
        }
    }
    try {
        let bl = await BonLivraison.findByPk(id)
        let user = await userCtrl.getUsefulUserData(req.reqUserId)

        if (bl === null) {
            return res.status(404).json({ message: 'BL introuvable' })
        } else if(bl.type=="BL"){
            if (bl.station_id !== user.station_id && bl.station_id !== user.b2b_id) {

                return res.status(401).json({ message: 'Désolé, vous n\'êtes pas lié à ce BL' })
            }
        }else if(bl.type=="BT"){
            if (bl.station_id !== user.depot_id ) {

                return res.status(401).json({ message: 'Désolé, vous n\'êtes pas lié à ce BL' })
            }
        }
        let dls = await DetailsLivraison.findAll({ where: { bonlivraison_id: id }, include: [{ model: Produit }] })

        for (const dl of dls) {
            let structure = (await Structure.findAll({ where: { produitId: dl.produit_id } }))[0]
            if (!structure) { return res.status(401).json({ message: 'Structure de prix introuvable pour un ou plusieurs des produits' }) }

        }
        let station = {}
        if(bl.type=="BL"){
            station = await Station.findByPk(bl.station_id)
        }else{
            const _depot = await Depot.findByPk(bl.station_id)
            station = {
                id:_depot.id,
                poi_id:'0',
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
        if (!station || station === null) { return res.status(404).json({ message: 'Station de destination introuvable' }) }
        let detailsVille = await DetailsVille.findOne({ where: { [Op.and]: [{ depot_id: bl.depot_id }, { ville_id: station.ville_id }] } })

        if (!detailsVille || detailsVille === null) { return res.status(404).json({ message: 'Details de la ville de destination introuvable' }) }

        let total = 0;

        for (const i of dls) {
            let dlbs = await DetailsLivraisonBarcode.findAll({ where: { detailslivraison_id: i.id } })

            for (const dlb of dlbs) {
                const compartiment_id = dlb.compartiment_id
                await Compartiment.update({ is_busy: 0 }, { where: { id: compartiment_id } })
                total = total + dlb.qty
            }
        }
        await BonLivraison.update({ statut: 'Déchargé', date_dechargement: Date.now(), updatedBy: req.reqUserId }, { where: { id: id } })

        let ftbl = 0;
        let cbl_tp = 0;
        let cp = 0;
        let cbl_ttid = 0;
        let cbl_tdt = 0;

        for (const dl of dls) {
            let tarif = 0
            if (dl.Produit.nom=='GPL EN BOUTEILLE') {
                tarif = detailsVille.tarif_gpl
            }else if (dl.Produit.nom=="GPL VRAC"){
                tarif = detailsVille.tarif_gpl_vrac
            }else{
                tarif=detailsVille.tarif_produits_blanc;
            }

            ftbl += dl.qtte * tarif;
            // ftbl += dl.qtte * (dl.Produit.nom.includes("GPL")  ? detailsVille.tarif_gpl : detailsVille.tarif_produits_blanc);

            const struct = await Structure.findOne({ where: { produitId: dl.produit_id } });
            if (struct) {
                if (station.type !== "B2B") {

                    cp += dl.qtte * struct.caisse;
                    cbl_tp += dl.qtte * struct.tauxPereq;
                    cbl_ttid += dl.qtte * struct.tauxTransportInterDepot;
                    cbl_tdt += dl.qtte * struct.tauxDifferentielTransport;
                } else {
                    cp += dl.qtte * struct.caisseB2B //caise de pérequation
                    cbl_tp = dl.qtte * struct.tauxPereq;//colletcte de fond suivant la structure de prix
                    cbl_ttid = 0;
                    cbl_tdt = 0;
                    ftbl = 0 //provision frais de transport
                }
            }
        }
        await BonLivraison.update({
            ftbl: ftbl,
            cbl_tp:dataDepot.type=='INTERIEUR'?0: cbl_tp,
            cp:dataDepot.type=='INTERIEUR'?0: cp,
            cbl_ttid: dataDepot.type=='INTERIEUR'?0:cbl_ttid,
            cbl_tdt:dataDepot.type=='INTERIEUR'?0: cbl_tdt,
            updatedBy: req.reqUserId
        }, { where: { id: bl.id } })
        
        // const marketerCompany = await Marketer.findByPk(bl.marketer_id)
        //NOTIF TO ALL MICS
        // mailerCtrl.mailAllUsersOfAType('MIC', `${bl.numeroBL} a été déchargé`, `${user.name}, de la station ${stationCible.nom} a confirmé le déchargement effectif des produits inclus dans le bon de livraison N° ${bl.numeroBL} au nom de ${marketerCompany.nom}.`)
        // notifCtrl.notifyAllUsersOfAType('MIC', `${bl.numeroBL} a été déchargé`, `${user.name}, de la station ${stationCible.nom} a confirmé le déchargement effectif des produits inclus dans le bon de livraison N° ${bl.numeroBL} au nom de ${marketerCompany.nom}.`)

        //NOTIF TO THIS STATION
        // mailerCtrl.mailSingle(req.reqUserId, `${bl.numeroBL} a été déchargé`, `${user.name}, de la station ${stationCible.nom} a confirmé le déchargement effectif des produits inclus dans le bon de livraison N° ${bl.numeroBL} au nom de ${marketerCompany.nom}.`)
        // notifCtrl.notifySingle(req.reqUserId, `${bl.numeroBL} a été déchargé`, `${user.name}, de la station ${stationCible.nom} a confirmé le déchargement effectif des produits inclus dans le bon de livraison N° ${bl.numeroBL} au nom de ${marketerCompany.nom}.`)


        return res.status(200).json({ message: 'Le BL a bien été déchargé' })

    } catch (err) {
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

exports.loadCompletion = async (req, res, next) => {

    let loads = req.body.data

    console.log('loads befor completion ', loads)

    //VALIDATION DU FORMAT DES CHARGEMENTS
    for (let i = 0; i < loads.length; i++) {
        const load = loads[i];
        const dl_id = load.dl_id;
        const compartiment_id = load.compartiment_id;
        const qty = load.qty;
        const barcode = load.barcode;
        const creu_charger = load.creu_charger;

        if (!dl_id || !compartiment_id || !qty || !barcode || !creu_charger) {
            console.log('Tous les champs de load completion n\'ont pas été envoyé');
            return res.status(400).json({ message: 'Veuillez renseigner tous les champs ou invalide' })
        }
    }

    let dl_id = loads[0].dl_id
    // console.log('dl_id2222222222 '+dl_id)
    let bl_id = (await DetailsLivraison.findByPk(dl_id)).bonlivraison_id
    // console.log(' je suis le bl iiiiiiiiiibl_id '+bl_id)
    let dlbs = await DetailsLivraisonBarcode.findAll({ where: { detailslivraison_id: dl_id } })
    // console.log('2--------');
    const bl = await BonLivraison.findByPk(bl_id, { paranoid: false })
    if (bl.statut == 'Chargé') {
        return res.status(400).json({ message: 'Ce BL a déjà été charger' })
    }
    try {

        let times = 0;

        for (const load of loads) {

            await DetailsLivraisonBarcode.create({
                detailslivraison_id: load.dl_id,
                qty: load.qty,
                barcode: load.barcode,
                creu_charger: load.creu_charger,
                compartiment_id: load.compartiment_id,
                createdBy: req.reqUserId,
                updatedBy: req.reqUserId,
            })

            await Compartiment.update({ is_busy: 1 }, { where: { id: load.compartiment_id } })

            times++;
        }

        console.log('loads saves ', times, 'times');






        await BonLivraison.update({ statut: 'Chargé', date_chargement: Date.now() }, { where: { id: bl_id } })

        const bl = await BonLivraison.findByPk(bl_id, { paranoid: false })

        // console.log('3--------');

        //NOTIF TO MARKETERS
        const user = await User.findByPk(req.reqUserId)
        const marketer_id = bl.marketer_id
        const depotCible = await Depot.findByPk(bl.depot_id)
        const camionCible = await Camion.findByPk(bl.camion_id)
        const stationCible = await Station.findByPk(bl.station_id)
        const trCible = await Transporteur.findByPk(bl.transporteur_id)
        const marketerUsers = await User.findAll({ where: { marketer_id: marketer_id,type:'Super Admin' } })
        const marketerCompany = await Marketer.findByPk(marketer_id)
        for (const marketerUser of marketerUsers) {
            if (marketerUser.type !== 'Station') {
                mailerCtrl.mailSingle(marketerUser.id, `${bl.numeroBL} a bien été chargé`, `Le dépôt ${depotCible.nom}, a chargé les produits commandés du BL N° ${bl.numeroBL} au nom de ${marketerCompany.nom} dans le camion immatriculé ${camionCible.imat} de la structure ${trCible.nom}. Le camion devrait déjà être en route pour la station ${stationCible.nom}.`)
                notifCtrl.notifySingle(marketerUser.id, `${bl.numeroBL} a bien été chargé`, `Le dépôt ${depotCible.nom}, a chargé les produits commandés du BL N° ${bl.numeroBL} au nom de ${marketerCompany.nom} dans le camion immatriculé ${camionCible.imat} de la structure ${trCible.nom}. Le camion devrait déjà être en route pour la station ${stationCible.nom}.`)
            }
        }

        // console.log('4--------');


        //NOTIF TO DEPOT USERS
        const depotUsers = await User.findAll({ where: { depot_id: bl.depot_id,type:'Super Admin' } })
        for (const depotUser of depotUsers) {
            mailerCtrl.mailSingle(depotUser.id, `${bl.numeroBL} a bien été chargé`, `${user.name} du dépôt ${depotCible.nom}, a chargé les produits commandés dans le BL N° ${bl.numeroBL} au nom de ${marketerCompany.nom} dans le camion immatriculé ${camionCible.imat} de la structure ${trCible.nom}.`)
            notifCtrl.notifySingle(depotUser.id, `${bl.numeroBL} a bien été chargé`, `${user.name} du dépôt ${depotCible.nom}, a chargé les produits commandés dans le BL N° ${bl.numeroBL} au nom de ${marketerCompany.nom} dans le camion immatriculé ${camionCible.imat} de la structure ${trCible.nom}.`)
        }

       
        // console.log('6--------');


        return res.status(204).json({})

    } catch (err) {
        next(err)
    }


}

exports.pay = async (req, res, next) => {
    const blIds = req.body.blIds

    if (blIds.length < 1) {
        return res.status(400).json({ message: 'Veuillez renseigner tous les champs' })
    }

    try {

        blNums = []

        for (const id of blIds) {
            const bl = await BonLivraison.findByPk(parseInt(bl.id))
            if (bl !== null && bl.statut === 'Déchargé') {
                await BonLivraison.update({ statut: 'Payé', updatedBy: req.reqUserId }, { where: { id: id } })
                blNums.push(bl.numeroBL)
            }
        }

        if (blNums.length > 0) {
            const requester = await User.findByPk(req.reqUserId)
            mailerCtrl.mailAllUsersOfAType('MIC', `Bons de livraison payés`, `Le ${requester.type} ${requester.name}, a confirmé que des bons de livraison ont été payés. Il s'agit des bons suivants: ${blNums}.`)
            notifCtrl.notifyAllUsersOfAType('MIC', `Bons de livraison payés`, `Le ${requester.type} ${requester.name}, a confirmé que des bons de livraison ont été payés. Il s'agit des bons suivants: ${blNums}.`)
        }

        return res.status(204).json({})

    } catch (err) {
        // console.log(err);
        next(err)
    }
}

exports.change = async (req, res, next) => {

    const option = xss(req.params.option);
    const bonlivraison_id = xss(req.params.id);

    try {

    } catch (err) {
        console.log(err);
        next(err)
    }
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
    } catch (err) {
        next(err)
    }
}

// exports.dispatchBonGplBouteill= async(req, res, next)=>{
//     let bls = req.body.bls
//     let bgpl_id = req.body.bongpl_id

//     if (!bls || !Array.isArray(bls)) { return res.status(400).json({ message: "Donnée(s) manquante(s) ou mal formatée(s)" }) }

//     try {
//         let qte_bgpl =0
//         const bonGPL = await BonGPLBoutelle.findByPk(bgpl_id)

//         //DEFINING USEFUL VARIABLES
//         const user = await User.findByPk(req.reqUserId)
//         const marketer_id = parseInt(user.marketer_id)

//         //COLLECTING NUM BLS
//         const depot_id = parseInt(bonGPL.depot_id)
//         const camion_id = parseInt(bonGPL.camion_id)
//         const camion = await Camion.findByPk(camion_id)
//         //PROCESSING DATA   
//         for (const bl of bls) {
//             const station = await Station.findByPk(bl.stationId)
          
//             const newBL = await BonLivraison.create({
//                 station_id: bl.stationId,
//                 marketer_id: marketer_id,
//                 transporteur_id: camion.transporteur_id,
//                 camion_id: bonGPL.camion_id,
//                 depot_id: bonGPL.depot_id,
//                 date:bonGPL.date,
//                 qty:bl.quantite,
//                 statMonth:bonGPL.statMonth,
//                 statYear:bonGPL.statYear,
//                 date_chargement:bonGPL.date_chargement,
//                 statut: bonGPL.statut,
//                 ville_id: station.ville_id,
//                 type: bonGPL.type,
//                 createdBy: req.reqUserId,
//                 updatedBy: req.reqUserId
//             })
//             //UPDATING FEW THINGS
//             const newDate = new Date()
//             const year = newDate.getFullYear()
//             const month = ('0' + (newDate.getMonth() + 1)).slice(-2)
//             const day = ('0' + newDate.getDate()).slice(-2)

//             let numBL = 'BL' + req.reqUserId + year + month + day + newBL.id;
//             await BonLivraison.update({ numeroBL: numBL, statMonth: month, statYear: year }, { where: { id: newBL.id } })
            
//             await DetailsLivraison.create({
//                 bonlivraison_id: newBL.id,
//                 produit_id: parseInt(bonGPL.produit_id),
//                 qtte: parseInt(bl.quantite),
//                 createdBy: req.reqUserId,
//                 updatedBy: req.reqUserId
//             })
//             qte_bgpl = qte_bgpl+parseInt(bl.quantite)
//             const oldQuantiteRestante = parseInt(bonGPL.qtyRestante) - qte_bgpl
//             await BonGPLBoutelle.update({ qtyRestante: oldQuantiteRestante}, { where: { id: bonGPL.id } })
           
//         }

//         return res.status(204).json({})
        
//     } catch (err) {
//         next(err)
//     }
// }

exports.chargerBlGPLBouteille= async(req,res)=>{
    let loads = req.body.ids
    try {
        for (const load of loads) {
            const bl = await BonLivraison.findByPk(load, { paranoid: false })
            if (bl.statut == 'Chargé') {
                return res.status(400).json({ message: 'Ce BL a déjà été charger' })
            }
            const detail = await DetailsLivraison.findOne({where:{bonlivraison_id :load},
                include: [
                    {
                        model: Produit
                    }
                ],
            })
            if(detail.Produit.nom.includes("BOUTEILLE")){

                await BonLivraison.update({ statut: 'Chargé', date_chargement: Date.now() }, { where: { id: load } })
            }else{
                return res.status(400).json({ message: 'Seul les produits en bouteille utilise cette methode de chargement' })
            }
        } 
        return res.status(204).json({})
    } catch (err) {
        next(err)
    }
}


exports.getAllPeriodeTrached = async (req, res, next) => {
    const typeBl = req.params.type;
    const startDate = req.params.startDate;
    let endDate = new Date(req.params.endDate);
    endDate.setDate(endDate.getDate() + 1);
    try {

        let list = [];
        let bls = []

        const user = await userCtrl.getUsefulUserData(req.reqUserId)
        if (req.reqUserType === 'Marketer') {
            bls = await BonLivraison.findAll({
                where: {
                    marketer_id: user.marketer_id, type: typeBl,
                    deletedAt: {
                        [Op.not]: null
                    },
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                }, paranoid: false, order: [['createdAt', 'desc']]
            });
        }
        else if (req.reqUserType === 'Station') {
            bls = await BonLivraison.findAll({
                where: {
                    station_id: user.station_id, type: typeBl,
                    deletedAt: {
                        [Op.not]: null
                    },
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                }, paranoid: false, order: [['createdAt', 'desc']]
            });
        }
        else if (req.reqUserType === 'B2B') {

            bls = await BonLivraison.findAll({
                where: {
                    station_id: user.b2b_id, type: typeBl,
                    deletedAt: {
                        [Op.not]: null
                    },
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                }, paranoid: false, order: [['createdAt', 'desc']]
            });
            // console.log(user.station_id);
        }
        else if (req.reqUserType === 'Depot') {
            bls = await BonLivraison.findAll({
                where: {
                    depot_id: user.depot_id, type: typeBl,
                    deletedAt: {
                        [Op.not]: null
                    },
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                }, paranoid: false, order: [['createdAt', 'desc']]
            });
        }

        else {
            bls = await BonLivraison.findAll({
                where: {
                    type: typeBl,
                    deletedAt: {
                        [Op.not]: null
                    },
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                }, paranoid: false, order: [['createdAt', 'desc']]
            });
        }

        for (let i = 0; i < bls.length; i++) {

            let bl = bls[i]
            const camion = await Camion.findByPk(bl.camion_id, { paranoid: false })

            let dls = await DetailsLivraison.findAll({ where: { bonlivraison_id: bl.id } })
            let details = []

            for (let i = 0; i < dls.length; i++) {
                const dl = dls[i];
                let detailsBarcodes = []

                if (dl) {

                    let dlbs = await DetailsLivraisonBarcode.findAll({ where: { detailslivraison_id: dl.id } })

                    for (let ii = 0; ii < dlbs.length; ii++) {
                        const dlb = dlbs[ii]; 0.

                        if (dlb) {
                            detailsBarcodes.push({
                                id: dlb.id,
                                detailslivraison_id: dlb.detailslivraison_id,
                                qty: dlb.qty,
                                barcode: dlb.barcode,
                                creu_charger: dlb.creu_charger,
                                Compartiment: await Compartiment.findByPk(dlb.compartiment_id),
                                createdBy: await userCtrl.getUsefulUserData(dlb.createdBy),
                                updatedBy: await userCtrl.getUsefulUserData(dlb.updatedBy),
                                deletedBy: dlb.deletedBy,
                                restoredBy: dlb.restoredBy,
                                createdAt: dlb.createdAt,
                                updatedAt: dlb.updatedAt,
                                deletedAt: dlb.deletedAt,
                                suspensionComment: dlb.suspensionComment
                            })
                        }
                    }

                    details.push({
                        id: dl.id,
                        bonlivraison_id: dl.bonlivraison_id,
                        produit: await Produit.findByPk(dl.produit_id),
                        qtte: dl.qtte,
                        details_barcodes: detailsBarcodes,
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
            }

            list.push(
                {
                    id: bl.id,
                    numeroBL: bl.numeroBL,
                    date: bl.date,
                    station: await Station.findByPk(bl.station_id),
                    marketer: await Marketer.findByPk(bl.marketer_id),
                    transporteur: await Transporteur.findByPk(bl.transporteur_id),
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
                    depot: await Depot.findByPk(bl.depot_id),
                    produits: details,
                    statut: bl.statut,
                    statYear: bl.statYear,
                    statMonth: bl.statMonth,
                    commentaire: bl.commentaire,
                    ftbl: bl.ftbl,
                    cp: bl.cp,
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
                }
            )
        }

        res.json({ data: list })


    } catch (err) {
        console.log(err)
        next(err)
    }

}
cron.schedule('0 3 * * *', async () => {
    try {
        const dateLimit = subDays(new Date(), 30);
        const result =await BonLivraison.update({ deletedAt: new Date() }, { where: {
            [Op.and]:[
                {date: { [Op.lt]: dateLimit }},
                {statut:{ [Op.ne]:'Déchargé'}}
            ]
         } })
    } catch (error) {
        console.error('Erreur lors de la mise à jour des bons de livraison :', error);
    }
    
})








/******************/
/* INTERNAL FUNCS */

















