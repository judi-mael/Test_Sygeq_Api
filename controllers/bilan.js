/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const jwt = require('jsonwebtoken')
const {Sequelize, Op, where } = require("sequelize");
const xss = require("xss");

const userCtrl = require('./user');
const { raw } = require('express');
const {BonLivraison,Depot,DetailsVille,DetailsLivraison,DetailsLivraisonBarcode,Produit,Station,Transporteur,Camion,Compartiment,Marketer,Region,User,Ville,SSatToken}= require('../models')


/*****************************/
/*** GESTION DE LA RESSOURCE */

// mod.cjs
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

function filterByPeriod(startDate, endDate, data){
    let filteredData = []

    startDate = new Date(startDate);
    endDate = new Date(endDate);

    for (const el of data) {
       
        const createdAt = new Date(el.createdAt)
        createdAt <= endDate && createdAt >= startDate && filteredData.push(el);
    }

    return filteredData;

}

function isValidDate(d) {
    d = new Date(d)
    return d instanceof Date && !isNaN(d);
}
exports.getTotauxBL = async(req, res, next)=>{
    const startDate = req.params.startDate;
    let endDate = new Date(req.params.endDate); 
    endDate.setDate(endDate.getDate() + 1);
    
    try {
        let somme_cbl_tp=0;
        let somme_ftbl=0;
        let somme_cp=0;
        let somme_qty=0;
        let sommeGPL_cbl_tp=0;
        let sommeGPL_ftbl=0;
        let sommeGPL_cp=0;
        let sommeGPL_qty=0;

        let bt_somme_cbl_tp=0;
        let bt_somme_ftbl=0;
        let bt_somme_cp=0;
        let bt_somme_qty=0;
        let bt_sommeGPL_cbl_tp=0;
        let bt_sommeGPL_ftbl=0;
        let bt_sommeGPL_cp=0;
        let bt_sommeGPL_qty=0;
        let bonLs;
        if (startDate &&  endDate ) {
        // if (startDate && !isNaN(startDate) && endDate && !isNaN(endDate)) {
             bonLs = await BonLivraison.findAll({
                where: {
                    statut: 'Déchargé',
                    date_dechargement: {
                        [Op.between]: [startDate, endDate]
                    },
                },
                include: [
                    {
                        model:DetailsLivraison,
                        include: [
                            {
                                model: Produit
                            }
                        ]
                    }
                ],
                })
         }else{
            bonLs = await BonLivraison.findAll({
                where: {
                    statut: 'Déchargé',
                },
                include: [
                    {
                        model:DetailsLivraison,
                        include: [
                            {
                                model: Produit
                            }
                        ]
                    }
                ],
                })
         }
        for(const bonl of bonLs ){
            if(bonl.type=='BL'){    
                let isGpl =false
                for(const detail of bonl.DetailsLivraisons){
                    if (detail.Produit.nom.includes("GPL")) {
                        isGpl = true;
                        sommeGPL_qty +=detail.qtte
                    }else {
                        somme_qty +=detail.qtte
                    }
                }
                if (isGpl) {
                    sommeGPL_cbl_tp+= bonl.cbl_tp;
                    sommeGPL_cp += bonl.cp;
                    sommeGPL_ftbl += bonl.ftbl;
                }else {
                    somme_cbl_tp+= bonl.cbl_tp;
                    somme_cp += bonl.cp;
                    somme_ftbl += bonl.ftbl;
                }
            }else{
                let isGpl =false
                for(const detail of bonl.DetailsLivraisons){
                    if (detail.Produit.nom.includes("GPL")) {
                        isGpl = true;
                        bt_sommeGPL_qty +=detail.qtte
                    }else {
                        bt_somme_qty +=detail.qtte
                    }
                }
                if (isGpl) {
                    bt_sommeGPL_cbl_tp+= bonl.cbl_tp;
                    bt_sommeGPL_cp += bonl.cp;
                    bt_sommeGPL_ftbl += bonl.ftbl;
                }else {
                    bt_somme_cbl_tp+= bonl.cbl_tp;
                    bt_somme_cp += bonl.cp;
                    bt_somme_ftbl += bonl.ftbl;
                }

            }
        }
        taux_blanc =isNaN(somme_ftbl/somme_qty)?0:somme_ftbl/somme_qty ;
        taux_gpl = isNaN(sommeGPL_ftbl/sommeGPL_qty)?0:sommeGPL_ftbl/sommeGPL_qty;
        const total= {
            montant_collect:{
                produit_blanc:somme_cbl_tp,
                gpl:sommeGPL_cbl_tp
            },
            quantite:{
                produit_blanc:somme_qty,
                gpl:sommeGPL_qty
            },
            provision:{
                produit_blanc:somme_ftbl,
                gpl:sommeGPL_ftbl
            },
            caisse_perequation:{
                produit_blanc:somme_cp,
                gpl:sommeGPL_cp
            },
            diffrenciel:{
                produit_blanc:somme_cbl_tp - somme_ftbl,
                gpl:sommeGPL_cbl_tp - sommeGPL_ftbl
            },
            taux_moyen:{
                produit_blanc:taux_blanc,
                gpl:taux_gpl
            },
        }
        taux_bt_blanc =isNaN(bt_somme_ftbl/somme_qty)?0: bt_somme_ftbl / somme_qty ;
        taux_bt_gpl = isNaN(bt_sommeGPL_ftbl/sommeGPL_qty)?0:bt_sommeGPL_ftbl/sommeGPL_qty;
        const total_bt= {
            montant_collect:{
                produit_blanc:bt_somme_cbl_tp,
                gpl:bt_sommeGPL_cbl_tp
            },
            quantite:{
                produit_blanc:bt_somme_qty,
                gpl:bt_sommeGPL_qty
            },
            provision:{
                produit_blanc:bt_somme_ftbl,
                gpl:bt_sommeGPL_ftbl
            },
            caisse_perequation:{
                produit_blanc:bt_somme_cp,
                gpl:bt_sommeGPL_cp
            },
            diffrenciel:{
                produit_blanc:bt_somme_cbl_tp - bt_somme_ftbl,
                gpl:bt_sommeGPL_cbl_tp - bt_sommeGPL_ftbl
            },
            taux_moyen:{
                produit_blanc:taux_bt_blanc,
                gpl:taux_bt_gpl
            },
        }
        const performance = {
            taux_moyen:{
                produit_blanc:taux_blanc + taux_bt_blanc,
                gpl:taux_gpl + taux_bt_gpl,
            },
            total_caisse:{
                produit_blanc:somme_cp + bt_somme_cp,
                gpl:sommeGPL_cp + bt_sommeGPL_cp,
            },
            total_differenciel:{
                produit_blanc:bt_somme_cbl_tp - bt_somme_ftbl+somme_cbl_tp - somme_ftbl,
                gpl:bt_sommeGPL_cbl_tp - bt_sommeGPL_ftbl+sommeGPL_cbl_tp - sommeGPL_ftbl,
            },
            gain_perte:{
                produit_blanc:(somme_cp + bt_somme_cp) + (somme_cbl_tp + bt_somme_cbl_tp),
                gpl:(sommeGPL_cp + bt_sommeGPL_cp) + (sommeGPL_cbl_tp + bt_sommeGPL_cbl_tp),
            }
        }
        const results= {
            bt:total_bt,
            bl:total,
            performance:performance
        }
        res.json({data: results}) 
    } catch (error) {
        console.log(error)
        next(error)
    }
}
exports.getQuantitiesPerProductsPerArea = async (req, res, next) => {
    // const startDate = '2024-06-01T00:00:00.000Z';
    // let endDate = '2024-07-01T00:00:00.000Z'; 
    console.log("dsfjdfghfdjhgfdjhjk"+req.params);
    
    const startDate = new Date(req.params.startDate);
    let endDate = new Date(req.params.endDate); 
    endDate.setDate(endDate.getDate() + 1);
    try {
        let list = []
        const regions = await Region.findAll({include: [
            {model: Ville, include: [
                {model: Station, include: [
                    {model: BonLivraison, where: {statut: 'Déchargé',type:'BL',
                        date_dechargement: {
                            [Op.between]: [startDate, endDate]
                        },
                    }, include: [
                        {model: DetailsLivraison, include: [
                            {model: Produit}
                        ]}
                    ]}
                ]}
            ]}
        ]});
        for (const rg of regions) {
            let el = {region: rg.nom, produits: []}
            const existingProds = await Produit.findAll();
            for (const prd of existingProds) {el.produits.push({produit: prd.nom, qty: 0})}
            for (const ville of rg.Villes) {
                for (const station of ville.Stations) {
                    for (const bl of station.BonLivraisons) {
                    // for (const bl of station.BonLivraisons.filter(val=>val.date_dechargement>=startDate && val.date_dechargement<=endDate))
                        let dls = bl.DetailsLivraisons;
                        for (const dl of dls) {
                            if(el.produits.length===0){el.produits.push({produit: dl.Produit.nom, qty: dl.qtte})}
                            else{
                                let matches=0;
                                for (const prod of el.produits) {
                                    if(prod.produit===dl.Produit.nom){el.produits[el.produits.indexOf(prod)].qty += dl.qtte; matches++}
                                }
                                matches===0 && el.produits.push({produit: dl.Produit.nom, qty: dl.qtte})
                            }
                        }
                    }
                }
            }
            list.push(el)
        }
        console.log(list)
        return res.json({data: list})
    } catch (err) {
        console.log(err)
        next(err)
    }
}
exports.getQuantitiesOneProduct = async (req, res, next) => {
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;
    const productId = req.body.product;
    try {
        let list = []
        const regions = await Region.findAll({include: [
            {model: Ville, include: [
                {model: Station, include: [
                    {model: BonLivraison, where: {statut: 'Déchargé',
                        id: {
                            [Op.in]: productId
                        }
                    }, include: [
                        {model: DetailsLivraison, include: [
                            {model: Produit}
                        ]}
                    ]}
                ]}
            ]}
        ]});
        for (const rg of regions) {
            let el = {region: rg.nom, produits: []}

            const existingProds = await Produit.findAll({where: {
                id: {
                        [Op.in]: productId
                    }
            }});
            for (const prd of existingProds) {el.produits.push({produit: prd.nom, qty: 0})}
            for (const ville of rg.Villes) {
                for (const station of ville.Stations) {
                    for (const bl of station.BonLivraisons) {
                        let dls = bl.DetailsLivraisons;
                        startDate && endDate ? dls = filterByPeriod(startDate, endDate, dls) : false;
                        for (const dl of dls) {
                            if(el.produits.length===0){el.produits.push({produit: dl.Produit.nom, qty: dl.qtte})}
                            else{
                                let matches=0;
                                for (const prod of el.produits) {
                                    if(prod.produit===dl.Produit.nom){el.produits[el.produits.indexOf(prod)].qty += dl.qtte; matches++}
                                }
                                matches===0 && el.produits.push({produit: dl.Produit.nom, qty: dl.qtte})
                            }
                        }
                    }
                }
            }
            list.push(el)
        }
        return res.json({data: list})
    } catch (err) {
        // console.log(err)
        next(err)
    }
}
exports.getQuantitiesPerProductsAsMIC = async (req, res, next) => {
    const startDate = req.params.startDate;
    let endDate = new Date(req.params.endDate);
    endDate.setDate(endDate.getDate() + 1);
    try {
        let list = []
        const produits = await Produit.findAll()
        for( const produit of produits){
            const bonLivraisons = await BonLivraison.findAll({
                where: {
                    deletedAt: null,
                    type:'BL',
                    statut: 'Déchargé',
                    date_dechargement: startDate && endDate ?{
                        [Op.between]: [startDate, endDate]
                    }:undefined,
                },
                include: [
                    {
                        model: DetailsLivraison,
                        include: [
                            {
                                model: Produit,
                                attributes: ['id', 'nom'],
                                where: { deletedAt: null } 
                            }
                        ],
                        where: {
                            produit_id:produit.id,
                            deletedAt: null
                        },
                        attributes: [
                            [Sequelize.fn('SUM', Sequelize.col('qtte')), 'total_quantite'],
                        ],
                        required: true,
                    },
                ],
                group: [
                'DetailsLivraisons.produit_id', 
                'DetailsLivraisons.id', 
                'DetailsLivraisons.Produit.id', 
                'DetailsLivraisons.Produit.nom',
            ],
            });
            for (const bons of bonLivraisons){
                for (const detail of bons.DetailsLivraisons){
                    list.push({produit: detail.Produit.nom, total: detail._previousDataValues.total_quantite })
                }
            }
        }
         const produitsr = {};
            list.forEach(item => {
                const produitNom = item.produit; 
                const quantite = parseInt(item.total, 10)
                if (produitsr[produitNom]) {
                    produitsr[produitNom] += quantite;
                } else {
                    produitsr[produitNom] = quantite;
                }
            });
            const produitsUnic = Object.keys(produitsr).map(produitNom => ({
                produit: produitNom,
                total: produitsr[produitNom]
            }));
        return res.json({data: produitsUnic})
        
    } catch (err) {
        next(err)
    }
}

exports.getQuantitiesPerMarketersAsMIC = async (req, res, next) => {

    const startDate = new Date(req.body.startDate);
    let endDate = new Date(req.body.endDate); 
    endDate.setDate(endDate.getDate() + 1);
    const marketersIds = req.body.marketersIds;
    try {

        let list = []
        let marketers=[]
        if(marketersIds.length>0){
            for (const ids of marketersIds) {
                const mValues = await Marketer.findByPk(ids)
                marketers.push(mValues)
            }

        }else{
            marketers.push( await Marketer.findAll())
        }
        // console.log("je isoiouoiu",marketers)
            // let marketers= await Marketer.findAll()
        // let produits = await Produit.findAll()

        for (const marketer of marketers) {
            let data = []
            const bonLivraisons = await BonLivraison.findAll({
                // attributes: ['marketer_id'],
                where: {
                    type:'BL',
                    statut: 'Déchargé',
                    date_dechargement:{[Op.between]: [startDate, endDate]},
                    marketer_id:marketer.id
                },
                include: [
                    {
                        model: DetailsLivraison,
                        include: [
                            {
                                model: Produit,
                                attributes: ['id', 'nom'],
                            }
                        ],
                        attributes: [
                            [Sequelize.fn('SUM', Sequelize.col('qtte')), 'total_quantite'],
                        ],
                    }
                ],
                group: [
                    'BonLivraison.id',
                    'DetailsLivraisons.id',
                    // 'marketer_id',
                    'DetailsLivraisons.Produit.nom',
                    'DetailsLivraisons.Produit.id'],raw:true
            });
            
            const totalParProduit = bonLivraisons.reduce((acc, item) => {
                const produit = item['DetailsLivraisons.Produit.nom'];
                const quantite = parseFloat(item['DetailsLivraisons.total_quantite']) || 0;

                if (!acc[produit]) {
                    acc[produit] = 0;
                }
                acc[produit] += quantite;

                return acc;
            }, {});
            const result = Object.entries(totalParProduit).map(([produit, total]) => ({
                produit,
                total
            }));
            
            list.push({marketer: marketer.nom, data: result})
        }
        return res.json({data: list});
    } catch (err) {
        next(err)
    }
}
exports.getQuantitiesForOneMarketersAsMIC = async (req, res, next) => {

    const marketerid = req.params.marketerid;
    const startDate = req.params.startDate;
    const endDate = req.params.endDate;

    // console.log('request is here');
    if (!!marketerid)
    {
        return res.status(400).json({message: 'Mauvais format des identifiants des marketers'})
    }

    try {

        let list = []

        let marketers = await Marketer.findAll({where: {[Op.and]: [{id: marketerid}]}})
        let produits = await Produit.findAll()

        for (const marketer of marketers) {
            let data = []

            for (const produit of produits) {
                let total = 0
                let dls = await DetailsLivraison.findAll({where: {produit_id: produit.id}})
                startDate && endDate ? dls = filterByPeriod(startDate, endDate, dls) : false;

                for (const dl of dls) {
                    const bl = await BonLivraison.findOne({where: {[Op.and]: [{id: dl.bonlivraison_id}, {statut: 'Déchargé'}, {marketer_id: marketer.id},{date_dechargement: {
                        [Op.between]: [startDate, endDate]
                    }}]}})

                    if(bl !== null){
                        total = total + dl.qtte
                    }
                }

                data.push({produit: produit.nom, total: total })
            }
            list.push({marketer: marketer.nom, data: data})
        }

        return res.json({data: list})

    } catch (err) {
        // console.log(err)
        next(err)
    }

}

exports.getQuantitiesPerDepotsAsMIC = async (req, res, next) => {

    const startDate = req.params.startDate;
    let endDate = new Date(req.params.endDate); 
    endDate.setDate(endDate.getDate() + 1);

    try {

        let list = []

        let depots = await Depot.findAll()
        let produits = await Produit.findAll()

        for (const depot of depots) {
            let data = []

            for (const produit of produits) {
                let total = 0
                let dls = await DetailsLivraison.findAll({where: {produit_id: produit.id}})
                startDate && endDate ? dls = filterByPeriod(startDate, endDate, dls) : false;

                for (const dl of dls) {
                    const bl = await BonLivraison.findOne({where: {[Op.and]: [{id: dl.bonlivraison_id}, {statut: 'Chargé'}, {depot_id: depot.id}]}})
                    
                    if(bl !== null){
                        total = total + dl.qtte
                    }
                }
                
                data.push({produit: produit.nom, total: total })
            }

            list.push({depot: depot.nom, data: data})
        }
        
        console.log(list)
        return res.json({data: list})
        
    } catch (err) {
        // console.log(err)
        next(err)
    }

}

exports.getQuantitiesPerProductsAsDepot = async (req, res, next) => {

    const startDate = req.params.startDate;
    let endDate = new Date(req.params.endDate); 
    endDate.setDate(endDate.getDate() + 1);

    try {
        let list = []

        let user = await User.findByPk(req.reqUserId)
        
        let produits = await Produit.findAll()
        
        for (const produit of produits) {
            let total = 0
            let dls = await DetailsLivraison.findAll({where: {produit_id: produit.id}})
            startDate && endDate ? dls = filterByPeriod(startDate, endDate, dls) : false;

            for (const dl of dls) {
                const bl = await BonLivraison.findOne({where: {[Op.and]: [{id: dl.bonlivraison_id}, {statut: 'Chargé'}, {depot_id: user.depot_id}]}})
                
                if(bl !== null){
                    total = total + dl.qtte
                }
            }
            
            list.push({produit: produit.nom, total: total })
        }
        
        console.log(list)
        return res.json({data: list})
        
    } catch (err) {
        // console.log(err)
        next(err)
    }

}

async function getMonthStatForMarketer(marketer_id, month, year){

    let marketer = await Marketer.findByPk(marketer_id)
    let produits = await Produit.findAll()

    let data = []

    for (const produit of produits) {
        let total = 0
        let dls = await DetailsLivraison.findAll({where: {produit_id: produit.id}})
        
        for (const dl of dls) {
            const bl = await BonLivraison.findOne({where: {[Op.and]: [{id: dl.bonlivraison_id}, {statut: 'Déchargé'}, {marketer_id: marketer.id}, {statMonth: month}, {statYear: year}]}})
            
            if(bl !== null){
                total = total + dl.qtte
            }
        }

        data.push({produit: produit.nom, total: total })
    }

    return data;
}

function gMonthLabel(month) {
    if(month === 1){return 'Janv'}
    else if(month === 2){return 'Févr'}
    else if(month === 3){return 'Mars'}
    else if(month === 4){return 'Avr'}
    else if(month === 5){return 'Mai'}
    else if(month === 6){return 'Juin'}
    else if(month === 7){return 'Juill'}
    else if(month === 8){return 'Août'}
    else if(month === 9){return 'Sept'}
    else if(month === 10){return 'Oct'}
    else if(month === 11){return 'Nov'}
    else if(month === 12){return 'Déc'}
}

exports.getQuantitiesPerProductsPerMonthAsMarketer = async (req, res, next) => {
    const year = parseInt(req.params.year)
    if(!year){return res.status(400).json({message: 'Parametre(s) manquant(s)'})}
    
    try {

        let list = []
        const user = await User.findByPk(req.reqUserId)
        const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

        for (const month of months) {
            const stats = await getMonthStatForMarketer(user.marketer_id, month, year)
            list.push({
                year: year,
                month: gMonthLabel(month),
                stats: stats 
            })
        }
        return res.json({data: list})
        
    } catch (err) {
        console.log(err)
        next(err)
    }
}

async function gFilteredBlsByStatus(marketer_id){
    try {
        let data = []
        const statuts = ['Ouvert','Approuvé','Bon à Charger','Chargé','Déchargé','Annulé','Rejeté','Payé']
        const marketer = await Marketer.findByPk(marketer_id)

        for (const statut of statuts) {
            const bls = await BonLivraison.findAll({where: {[Op.and]: [{marketer_id: marketer_id}, {statut: statut}]}})
            data.push({
                statut: statut,
                total: bls.length,
                data: bls
            })
        }

        return {
            marketer: marketer.nom,
            data: data
        }
    } catch (err) {console.log('Failed getting filtered BLS by status'); return null}
}

exports.getBlsStatsPerStatus = async (req, res, next) => {
    const marketerIds = req.body.marketerIds;
    if(marketerIds && !Array.isArray(marketerIds)){return res.status(400).json({message: 'Mauvais format de la liste des marketers'})}
    
    try {
        let data = []
        
        if (req.reqUserType === 'Marketer') {
            const user = await User.findByPk(req.reqUserId)
            return res.json(await gFilteredBlsByStatus(user.marketer_id))
        }else if(req.reqUserType === 'MIC'){
            if(marketerIds){
                for (const marketerId of marketerIds) {data.push(await gFilteredBlsByStatus(marketerId))}
            }else{
                const marketers = await Marketer.findAll()
                for (const marketer of marketers) {data.push(await gFilteredBlsByStatus(marketer.id))}
            }
        }

        return res.json(data)
        
    } catch (err) {
        console.log(err)
        next(err)
    }
}

exports.getQuantitiesPerProductsPerStation = async (req, res, next) => {
    const marketerId = req.params.marketerId;
    const startDate = req.params.startDate;
    let endDate = new Date(req.params.endDate); 
    endDate.setDate(endDate.getDate() + 1);

    // if(req.reqUserType !== 'MIC' && req.reqUserType !== 'DPB' && !marketerId){return res.status(400).json({message: 'Paramètre manquant'})}

    try {

        if(marketerId && marketerId !== 'all'){
            const marketerCheck = await Marketer.findByPk(marketerId);
            if(!marketerCheck){return res.status(404).json({message: 'Marketer introuvable ou désactivé'})}
        }

        let data = [];

        const params = marketerId === 'all' ? {} : {where: {id: marketerId}}
        const marketers = await Marketer.findAll(params);

        for (const mark of marketers) {

            let stationData = [];
            const stations = await Station.findAll({where: {marketer_id: mark.id}})

            for (const station of stations) {
                const bls = await BonLivraison.findAll({where: {[Op.and]:[{station_id: station.id},{statut: 'Déchargé'}]}})

                //type {produit: productNAme, qty: productQty}
                let productsData = []

                for (const bl of bls) {
                    let dls = await DetailsLivraison.findAll({where: {bonlivraison_id: bl.id}, include: [{model: Produit}]})
                    startDate && endDate ? dls = filterByPeriod(startDate, endDate, dls) : false;

                    for (const dl of dls) {
                        const prodData = {produit: dl.Produit.nom, qty: dl.qtte }

                        if(productsData.length === 0){productsData.push(prodData);}
                        else{
                            let matches = 0;
                            for (const pd of productsData) { if(pd.produit === prodData.nom){prodData[prodData.indexOf(pd)].qty += prodData.qty; matches++;} }
                            matches === 0 && productsData.push(prodData)
                        }
                    }

                }

                stationData.push({station: station.nom, produits: productsData})
            }


            data.push({marketer: mark.nom, stations: stationData})

        }

        return res.json(data)

    } catch (err) {
        console.log(err)
        next(err)
    }
}

/* SST REPORTS */

async function ssLogin(){
    // console.log('New SSAT login')
    const response = await fetch('https://fleet.securysat.com/json/login', {
        method: 'post',
        body: JSON.stringify({
            "login": process.env.SSAT_LOGIN,
            "password": process.env.SSAT_PASS,
            "appKey": process.env.SSAT_APPKEY
        }),
        headers: {'Content-Type': 'application/json'}
    });

    const data = await response.json();

    newSst = await SSatToken.create({
        token: data.sessionId
    })

    // console.log('returned this after sslogin --> ', data.sessionId);
    return data.sessionId
}

async function sSatTokenIsValid(token){

    const response = await fetch('https://fleet.securysat.com/json/getVehicles', {
        method: 'post',
        body: JSON.stringify({
            "sessionId": token,
            onlyActive: true
        }),
        headers: {'Content-Type': 'application/json'}
    });

    const data = await response.json();

    if (data.error) {return false}else{return true}

}

async function gValidSST(){
    try {
        let ssts = await SSatToken.findAll()
        if (ssts.length < 1) {
            const newSst = await ssLogin();
            return newSst;
        }else{

            const tokenIsValid = await sSatTokenIsValid(ssts[0].token)
            if (tokenIsValid) {return ssts[0].token}
            else{
                for(const sst of ssts) {await SSatToken.destroy({where:{id: sst.id}})}
                const newSst = await ssLogin();
                // console.log('returned this after gValidSST --> ', newSst);

                return newSst;
            }
        }
    } catch (err) {return null}
}

exports.getV01 = async (req, res, next) => {
    startDate = req.body.startDate;
    endDate = req.body.endDate;
    vehicleIds = req.body.vehicleIds;
    if(!startDate || !endDate || !vehicleIds || vehicleIds.length < 1){return res.status(400).json({message: 'Veuillez renseigner tous les champs'})}

    try {
        let sst = await gValidSST();
        if(sst === null){return res.status(500).json({message: 'Erreur réseau ou serveur SST'})}

        const response = await fetch('https://fleet.securysat.com/json/getVehicleUsageReport', {
            method: 'post',
            body: JSON.stringify({
                "sessionId": sst,
                "startDate": startDate,
                "endDate": endDate,
                "vehicleIds": vehicleIds
            }),
            headers: {'Content-Type': 'application/json'}
        });
    
        const data = await response.json();

        return res.json(data);
        
    } catch (err) {
        console.log(err);
        next(err)
    }
}

exports.getV02 = async (req, res, next) => {
    startDate = req.body.startDate;
    endDate = req.body.endDate;
    vehicleIds = req.body.vehicleIds;
    if(!startDate || !endDate || !vehicleIds || vehicleIds.length < 1){return res.status(400).json({message: 'Veuillez renseigner tous les champs'})}

    try {
        let sst = await gValidSST();
        if(sst === null){return res.status(500).json({message: 'Erreur réseau ou serveur SST'})}
        // console.log('got this after gValidSST --> ', sst);
        // console.log(sst);

        const response = await fetch('https://fleet.securysat.com/json/getVehicleOverview', {
            method: 'post',
            body: JSON.stringify({
                "sessionId": sst,
                "startDate": startDate,
                "endDate": endDate,
                "vehicleIds": vehicleIds
            }),
            headers: {'Content-Type': 'application/json'}
        });
    
        const data = await response.json();

        return res.json(data);
        
    } catch (err) {
        console.log(err);
        next(err)
    }
}

exports.getV04 = async (req, res, next) => {
    startDate = req.body.startDate;
    endDate = req.body.endDate;
    vehicleIds = req.body.vehicleIds;
    if(!startDate || !endDate || !vehicleIds || vehicleIds.length < 1){return res.status(400).json({message: 'Veuillez renseigner tous les champs'})}

    try {
        let sst = await gValidSST();
        if(sst === null){return res.status(500).json({message: 'Erreur réseau ou serveur SST'})}

        const response = await fetch('https://fleet.securysat.com/json/getStopReport', {
            method: 'post',
            body: JSON.stringify({
                "sessionId": sst,
                "startDate": startDate,
                "endDate": endDate,
                "vehicleIds": vehicleIds
            }),
            headers: {'Content-Type': 'application/json'}
        });
    
        const data = await response.json();

        return res.json(data);
        
    } catch (err) {
        console.log(err);
        next(err)
    }
}

exports.getV11 = async (req, res, next) => {
    startDate = req.body.startDate;
    endDate = req.body.endDate;
    vehicleIds = req.body.vehicleIds;
    if(!startDate || !endDate || !vehicleIds || vehicleIds.length < 1){return res.status(400).json({message: 'Veuillez renseigner tous les champs'})}

    try {
        let sst = await gValidSST();
        if(sst === null){return res.status(500).json({message: 'Erreur réseau ou serveur SST'})}
        // console.log('got this after gValidSST --> ', sst);
        // console.log(sst);

        const response = await fetch('https://fleet.securysat.com/json/getVehiclesMaximumSpeed', {
            method: 'post',
            body: JSON.stringify({
                "sessionId": sst,
                "startDate": startDate,
                "endDate": endDate,
                "vehicleIds": vehicleIds
            }),
            headers: {'Content-Type': 'application/json'}
        });
    
        const data = await response.json();

        return res.json(data);
        
    } catch (err) {
        console.log(err);
        next(err)
    }
}

exports.getI3 = async (req, res, next) => {
    startDate = req.body.startDate;
    endDate = req.body.endDate;
    vehicleIds = req.body.vehicleIds;
    if(!startDate || !endDate || !vehicleIds || vehicleIds.length < 1){return res.status(400).json({message: 'Veuillez renseigner tous les champs'})}

    try {
        let sst = await gValidSST();
        if(sst === null){return res.status(500).json({message: 'Erreur réseau ou serveur SST'})}

        const response = await fetch('https://fleet.securysat.com/json/getMarkerEventReport', {
            method: 'post',
            body: JSON.stringify({
                "sessionId": sst,
                "startDate": startDate,
                "endDate": endDate,
                "vehicleIds": vehicleIds
            }),
            headers: {'Content-Type': 'application/json'}
        });
    
        const data = await response.json();

        return res.json(data);
        
    } catch (err) {
        console.log(err);
        next(err)
    }
}

exports.getI7 = async (req, res, next) => {
    startDate = req.body.startDate;
    endDate = req.body.endDate;
    vehicleIds = req.body.vehicleIds;
    if(!startDate || !endDate || !vehicleIds || vehicleIds.length < 1){return res.status(400).json({message: 'Veuillez renseigner tous les champs'})}

    try {
        let sst = await gValidSST();
        if(sst === null){return res.status(500).json({message: 'Erreur réseau ou serveur SST'})}

        const response = await fetch('https://fleet.securysat.com/json/getSitePresenceReportBasedOnVehicle', {
            method: 'post',
            body: JSON.stringify({
                "sessionId": sst,
                "startDate": startDate,
                "endDate": endDate,
                "vehicleIds": vehicleIds
            }),
            headers: {'Content-Type': 'application/json'}
        });
    
        const data = await response.json();

        return res.json(data);
        
    } catch (err) {
        // console.log(err);
        next(err)
    }
}


/* SST REPORTS */

async function gBl(id) {

    try {
        //RECUPERATION
        let bl = await BonLivraison.findByPk(id, {paranoid: false})
        if(bl === null){
            // console.log('not found');
            return null;
        }

        let station = await Station.findByPk(bl.station_id)
        let transporteur = await Transporteur.findByPk(bl.transporteur_id)
        let marketer = await Marketer.findByPk(bl.marketer_id)
        let camion = await Camion.findByPk(bl.camion_id)
        let depot = await Depot.findByPk(bl.depot_id)
        let creator = await userCtrl.getUsefulUserData(bl.createdBy)
        let updator = await userCtrl.getUsefulUserData(bl.updatedBy)

        let dls = await DetailsLivraison.findAll({where: {bonlivraison_id: bl.id}});
        let details = [];
        
        for (let i = 0; i < dls.length; i++) {
            const dl = dls[i];
            let detailsBarcodes = [];

            if(dl){

                let dlbs = await DetailsLivraisonBarcode.findAll({where: {detailslivraison_id: dl.id}})

                for (let ii = 0; ii < dlbs.length; ii++) {
                    const dlb = dlbs[ii];

                    if(dlb){
                        detailsBarcodes.push({
                            id: dlb.id,
                            detailslivraison_id: dlb.detailslivraison_id,
                            qty: dlb.qty,
                            barcode: dlb.barcode,
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
        return {
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
                vannes: await Compartiment.findAll({where: {camion_id: camion.id}}),
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

    } catch (err) {
        console.log(err);
        return null;
    }
}

async function gUnloadedBlsByMarketer(marketer_id, startDate, endDate){
    // console.log(marketer_id, startDate, endDate);
    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);
    try {

        let list=[];
        let bls = [];
        let rawBls = [];
        if(isValidDate(startDate) && isValidDate(endDate)){

         rawBls = await BonLivraison.findAll({where: {[Op.and]:[{marketer_id: marketer_id},{statut: 'Déchargé'},{type: 'BL'},{date_dechargement: {
                        [Op.between]: [startDate, endDate]
                    }}]}});
        }else{
            rawBls = await BonLivraison.findAll({where: {[Op.and]:[{marketer_id: marketer_id},{statut: 'Déchargé'},{type: 'BL'}]}});
        }

        for (const rbl of rawBls) {
            bls.push(
                await BonLivraison.findByPk(rbl.id, {
                    include: [
                        {model: Station, include: [
                            {model: Ville, include: [{model:Region,},{model: DetailsVille, where: {depot_id: rbl.depot_id},paranoid:false}]}
                        ]},
                        {model: DetailsLivraison, include: [{model: Produit,paranoid:false}]}
                    ]
                })
            )
        }

        list = bls

        return list;
    } catch (err) {console.log(err); return [];}
}

async function gBlsAndFilterByTr(marketer_id, startDate, endDate){
    try {
        const bls = await gUnloadedBlsByMarketer(marketer_id, startDate, endDate)
        const marketer = await Marketer.findByPk(marketer_id)
        let data = [];
        let trList = [];
        let m_qty = 0;
        let m_ftbl = 0;
        let m_cp = 0;
        let m_cbl_tp = 0;
        let m_cbl_ttid = 0;
        let m_cbl_tdt = 0;
        let bilan = 'inconnu';
        for (const el of bls) {
            m_qty += el.qty;
            m_ftbl += el.ftbl;
            m_cp += el.cp;
            m_cbl_tp += el.cbl_tp;
            m_cbl_ttid += el.cbl_ttid;
            m_cbl_tdt += el.cbl_tdt;
        }

        if(m_cbl_tp > m_ftbl){bilan = 'Péréquation déficitaire de '+(m_cbl_tp-m_ftbl)+' FCFA'}
        else if(m_cbl_tp < m_ftbl){bilan = 'Péréquation excédentaire de '+(m_cbl_tp-m_ftbl)+' FCFA'}
        else if (m_cbl_tp === m_ftbl){bilan = 'Péréquation équilibrée'}

        return ({
            marketer: marketer.nom, 
            qty: m_qty,
            ftbl: m_ftbl,
            cp: m_cp,
            cbl_tp: m_cbl_tp,
            cbl_ttid: m_cbl_ttid,
            cbl_tdt: m_cbl_tdt,
            bilan: bilan,
            bls: bls,
            // transporteurs: data,
        })
        
    } catch (err) {
        return null
    }
}


exports.getFtms = async (req, res, next) => {
    const marketer_ids = req.body.marketer_ids;
    const startDate = new Date(req.body.startDate);
    let endDate = new Date(req.body.endDate);
    endDate.setDate(endDate.getDate() + 1);
    if(marketer_ids && !Array.isArray(marketer_ids)){return res.status(400).json({message: 'Mauvais format des identifiants des marketers'})}
    
    try {
        let marketers = 0;
        let data = [];
        let responseData;

        const user = await User.findByPk(req.reqUserId)

        if (user.type === 'Marketer'){marketers += 1; data.push(await gBlsAndFilterByTr(user.marketer_id, startDate, endDate))}
        else if(['MIC','DPB'].indexOf(user.type)>=0){

            if(marketer_ids){
                //LET'S CHECK MARKETERS
                for (const mktId of marketer_ids) {
                    const marketerCheck = await Marketer.findByPk(mktId, {paranoid: false})
                    if(!marketerCheck){return res.status(404).json({message: 'Un ou plusieurs marketer(s) introuvable(s)'})}
                }
                //GENERATING DATA
                for (const mktId of marketer_ids) {
                    marketers += 1;
                    data.push(await gBlsAndFilterByTr(mktId, startDate, endDate))
                }
            }else{
                let marks = await Marketer.findAll();
                for (const marketer of marks) {marketers += 1; data.push(await gBlsAndFilterByTr(marketer.id, startDate, endDate))} 
            }

        }
        let cp = 0;
        let qty = 0;
        let ftbl = 0;
        let cbl_tp = 0;
        let cbl_ttid = 0;
        let cbl_tdt = 0;
        let bilan = 'inconnu';

        for (const marketerData of data) {
            if (marketerData.data != []) {
                // for (const el of marketerData) {
                    qty +=marketerData.qty;
                    cp +=marketerData.cp;
                    ftbl +=marketerData.ftbl;
                    cbl_tp +=marketerData.cbl_tp;
                    cbl_ttid +=marketerData.cbl_ttid;
                    cbl_tdt +=marketerData.cbl_tdt;
                // }
            }
        }

        if(cbl_tp > ftbl){bilan = 'Péréquation déficitaire de '+(cbl_tp-ftbl)+' FCFA'}
        else if(cbl_tp < ftbl){bilan = 'Péréquation excédentaire de '+(cbl_tp-ftbl)+' FCFA'}
        else if (cbl_tp === ftbl){bilan = 'Péréquation équilibrée'}

        responseData = {
            marketers: marketers,
            qty: qty,
            ftbl: ftbl,
            cp: cp,
            cbl_tp: cbl_tp,
            cbl_ttid: cbl_ttid,
            cbl_tdt: cbl_tdt,
            bilan: bilan,
            data: data,
        }
        
        // console.log("ddsfdsfdsfsdfsd",responseData);
        return res.json(responseData)
        
    } catch (err) {
        next(err)
    }
}



async function getResuOldFunctuin(marketer_id, startDate, endDate){
    try {
        const bls = await gUnloadedBlsByMarketer(marketer_id, startDate, endDate)
        const marketer = await Marketer.findByPk(marketer_id)
        let data = [];
        let trList = [];
        let m_qty = 0;//quantité de produits transporter
        let m_ftbl = 0;//frais de transport par bl
        let m_cp = 0;//caisse de la péraquation
        let m_cbl_tp = 0;//collect de fond suivant la structure de prix
       

            for (const bl of bls) {
                m_qty += bl.qty;
                m_ftbl += bl.ftbl;
                m_cp += bl.cp;
                m_cbl_tp += bl.cbl_tp;
               
            }

    
        return ({
            marketer: marketer.nom, 
            fraisTransport: m_ftbl,
            fondStructurePrix: m_cbl_tp,
            differenceT:m_cbl_tp - m_ftbl,
            caissePerequation: m_cp,
            gainOrPerte : m_cp - m_cbl_tp - m_ftbl,
            quantite: m_qty,
            tauxMPerequation:m_ftbl/m_qty,
            
        })
        
    } catch (err) {
        next(err)
    }
}

exports.getResum = async(req, res, next)=>{
    const marketer_ids = req.body.marketer_ids;
    const startDate = req.body.startDate;
    let endDate = req.body.endDate;
    endDate.setDate(endDate.getDate() + 1);
    
    if(marketer_ids && !Array.isArray(marketer_ids)){return res.status(400).json({message: 'Mauvais format des identifiants des marketers'})}
    
    try {
        let marketers = 0;
        let data = [];
        let responseData;

        const user = await User.findByPk(req.reqUserId)

        if (user.type === 'Marketer'){marketers += 1; data.push(await getResuOldFunctuin(user.marketer_id, startDate, endDate))}
        else if(['MIC','DPB'].indexOf(user.type)>=0){

            if(marketer_ids){
                //LET'S CHECK MARKETERS
                for (const mktId of marketer_ids) {
                    const marketerCheck = await Marketer.findByPk(mktId, {paranoid: false})
                    if(!marketerCheck){return res.status(404).json({message: 'Un ou plusieurs marketer(s) introuvable(s)'})}
                }
                //GENERATING DATA
                for (const mktId of marketer_ids) {
                    marketers += 1;
                    data.push(await getResuOldFunctuin(mktId, startDate, endDate))
                }
            }else{
                let marks = await Marketer.findAll();
                for (const marketer of marks) {marketers += 1; data.push(await getResuOldFunctuin(marketer.id, startDate, endDate))} 
            }

        }
         let m_qty = 0;//quantité de produits transporter
        let m_ftbl = 0;//frais de transport par bl
        let m_cp = 0;//caisse de la péraquation
        let m_cbl_tp = 0;//collect de fond suivant la structure de prix
        // let bilan = 'inconnu';

        for (const marketerData of data) {
            // if (marketerData.data.length > 0) {
                // for (const el of marketerData.transporteurs) {
                    m_qty += marketerData.quantite;
                    m_cp += marketerData.caissePerequation;
                    m_ftbl += marketerData.fraisTransport;
                    m_cbl_tp += marketerData.fondStructurePrix;
            //     }
            // }
        }

        responseData = {
            marketers: marketers,
            fraisTransport: m_ftbl,
            cbl_tp: m_cbl_tp,
            differenceT:m_cbl_tp - m_ftbl,
            caissePerequation: m_cp,
            gainOrPerte : m_cp - (m_cbl_tp - m_ftbl),
            quantite: m_qty,
            tauxMPerequation:m_ftbl/m_qty,
            // bilan: bilan,
            data: data,
        }
        return res.json(responseData)
        
    } catch (err) {
        // console.log(err);
        next(err)
    }
}

exports.getStartNbrBLandBT = async (req, res, next) => {

    const startDate = req.params.startDate;
    const endDate = req.params.endDate;
    try {
         const result = await BonLivraison.findAll({
            attributes: [
                'type',
                'statut',
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'nombre_elements']
            ],
            group: ['type', 'statut']
            });

            console.log(result.map(r => r.toJSON()));
        let list = []
        
        
        // console.log(list)
        return res.json({data: result})
        
    } catch (err) {
        console.log(err)
        next(err)
    }

}
exports.getStartNbrBLandBT_Mic = async (req, res, next) => {
    const startDate = req.params.startDate;
    let endDate = new Date(req.params.endDate);
    endDate.setDate(endDate.getDate() + 1);
    try {
        const types = ['BL', 'BT'];
        const statuts = ['Chargé', 'Déchargé', 'Ouvert', 'Approuvé','Bon à Charger','Rejeté','Annulé'];

        // Créez un tableau de toutes les combinaisons possibles
        const combinations = types.flatMap(type => 
        statuts.map(statut => ({ type, statut, nombre_elements: 0 }))
        );
         const results = await BonLivraison.findAll({
            where: { 
                createdAt: { 
                    [Op.between]: [startDate, endDate] 
                } 
            },
            attributes: [
                'type',
                'statut',
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'nombre_elements']
            ],
            group: ['type', 'statut']
            });
        const resultMap = results.reduce((map, result) => {
            const { type, statut, nombre_elements } = result.get();
            map[`${type}-${statut}`] = nombre_elements;
            return map;
        }, {});
        const finalResults = combinations.map(combination => ({
            type: combination.type,
            statut: combination.statut,
            nombre_elements: resultMap[`${combination.type}-${combination.statut}`] || 0
        }));
        let list_Bt = []
        let list_Bl = []
        for(const detail of finalResults){
            if(detail.type == 'BT'){
                list_Bt.push({
                    "statut": detail.statut,
                    "nombre_elements": detail.nombre_elements
                })
            }else{
                list_Bl.push({
                    "statut": detail.statut,
                    "nombre_elements": detail.nombre_elements
                })
        }
        }
        return res.json({bt:list_Bt,bl:list_Bl })
        
    } catch (err) {
        next(err)
    }

}

exports.countElements= async(req, res, next) =>{
    try {
        const marketer = await Marketer.count({
            where:{
                deletedAt:null,
            }
        });
        const depot = await Depot.count({
            where:{
                deletedAt:null,
            }
        });
        const transporteur = await Transporteur.count({
            where:{
                deletedAt:null,
            }
        });
        const station = await Station.count({
            where:{
                deletedAt:null,type:'STATION'
            }
        });
        const b2b = await Station.count({
            where:{
                deletedAt:null,type:'B2B'
            }
        });
        const camions = await Camion.count({
            where:{
                deletedAt:null
            }
        });
        res.status(200).json({
            'marketer': marketer,
            'station': station,
            'transporteur': transporteur,
            'depot': depot,
            'b2b' :b2b,
            'camion' : camions
        })
    } catch (err) {
        next(err)
    }
}











