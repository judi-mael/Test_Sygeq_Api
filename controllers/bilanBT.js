/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const jwt = require('jsonwebtoken')
const { Op } = require("sequelize");
const xss = require("xss");

const userCtrl = require('./user')
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

exports.getQuantitiesPerProductsPerArea = async (req, res, next) => {

    const startDate = req.params.startDate;
    let endDate = new Date(req.params.endDate); 
    endDate.setDate(endDate.getDate() + 1);

    try {
        let list = []

        const regions = await Region.findAll({include: [
            {model: Ville, include: [
                {model: Station, include: [
                    {model: BonLivraison, where: {statut: 'Déchargé'}, include: [
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
        
        // console.log(list)
        return res.json({data: list})
        
    } catch (err) {
        // console.log(err)
        next(err)
    }

}

exports.getQuantitiesPerProductsAsMIC = async (req, res, next) => {

    const startDate = new Date(req.params.startDate);
    let endDate = new Date(req.params.endDate); 
    endDate.setDate(endDate.getDate() + 1);

    try {
        let list = []
        
        let produits = await Produit.findAll()
        
        for (const produit of produits) {
            let total = 0;
            let dls = await DetailsLivraison.findAll({where: {produit_id: produit.id}});
            startDate && endDate ? dls = filterByPeriod(startDate, endDate, dls) : false;
            
            for (const dl of dls) {
                const bl = await BonLivraison.findOne({where: {[Op.and]: [{id: dl.bonlivraison_id}, {statut: 'Déchargé'}]}})
                
                if(bl !== null){
                    total = total + dl.qtte
                }
            }
            
            list.push({produit: produit.nom, total: total })
        }
        
        // console.log(list)
        return res.json({data: list})
        
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
        let produits = await Produit.findAll()

        for (const marketer of marketers) {
            let data = []

            for (const produit of produits) {
                let total = 0
                let dls = await DetailsLivraison.findAll({where: {produit_id: produit.id}})
                startDate && endDate ? dls = filterByPeriod(startDate, endDate, dls) : false;
                for (const dl of dls) {
                    const bl = await BonLivraison.findOne({where: {[Op.and]: [{id: dl.bonlivraison_id}, {statut: 'Déchargé'}, {marketer_id: marketer.id}]}})

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
        // console.log('rrrrrrrrrrrrrrrrrrrr',err)
        next(err)
    }

}
exports.getQuantitiesForOneMarketersAsMIC = async (req, res, next) => {

    const marketerid = req.params.marketerid;
    const startDate = new Date(req.params.startDate);
    let endDate = new Date(req.params.endDate);
    endDate.setDate(endDate.getDay()+1)

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
                    const bl = await BonLivraison.findOne({where: {[Op.and]: [{id: dl.bonlivraison_id}, {statut: 'Déchargé'}, {marketer_id: marketer.id}]}})

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

    const startDate =new  Date(req.params.startDate);
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

    const startDate = new Date(req.params.startDate);
    // const endDate = req.params.endDate;
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

        // console.log(list)
        return res.json({data: list})
        
    } catch (err) {
        // console.log(err)
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
    const startDate = new Date(req.params.startDate);
    let endDate = new Date(req.params.endDate); 
    endDate.setDate(endDate.getDate() + 1);

    // if(req.reqUserType !== 'MIC' && req.reqUserType !== 'DPB' && !marketerId){return res.status(400).json({message: 'Paramètre manquant'})}

    try {

        if(marketerId && marketerId !== 'all'){
            const marketerCheck = await Marketer.findByPk(marketerId);
            if(!marketerCheck){return res.status(404).json({message: 'Marketer introuvable'})}
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
    console.log('New SSAT login')
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
        // console.log('got this after gValidSST --> ', sst);
        // console.log(sst);

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
        // console.log('got this after gValidSST --> ', sst);
        // console.log(sst);

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
        // console.log('got this after gValidSST --> ', sst);
        // console.log(sst);

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
        // console.log('got this after gValidSST --> ', sst);
        // console.log(sst);

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
        console.log(err);
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
        return null;
    }
}

async function gUnloadedBlsByMarketer(marketer_id, startDate, endDate){
    // console.log(marketer_id, startDate, endDate);
    try {

        let list=[];
        let bls = [];
        let rawBls = [];
        if(isValidDate(startDate) && isValidDate(endDate)){

         rawBls = await BonLivraison.findAll({where: {[Op.and]:[{marketer_id: marketer_id},{statut: 'Déchargé'},{type: 'BT'},{date_dechargement: {
                        [Op.between]: [startDate, endDate]
                    }}]}});
        }else{
            rawBls = await BonLivraison.findAll({where: {[Op.and]:[{marketer_id: marketer_id},{statut: 'Déchargé'},{type: 'BT'}]}});
        }
        for (const rbl of rawBls) {
            const bnoBl = await BonLivraison.findByPk(rbl.id)
            const _depot = await Depot.findByPk(bnoBl.station_id)
            const _station = {
                id:_depot.id,
                poi_id:'0',
                longitude:_depot.longitude,
                latitude:_depot.latitude,
                ifu:_depot.ifu,
                rccm:'',
                nom:_depot.nom,
                ville:await Ville.findOne({where: {id:_depot.ville_id},include: [{model:Region}, {model: DetailsVille, where: {depot_id: rbl.depot_id}}]}),
                adresse:_depot.adresse,
                marketer_id:bnoBl.marketer_id,
                etat:0,
            }
            bls.push({
                id:bnoBl.id,
                numeroBL:bnoBl.numeroBL,
                date:bnoBl.createdAt,
                date_dechargement:bnoBl.date_dechargement,
                date_chargement:bnoBl.date_chargement,
                cbl_tp: bnoBl.cbl_tp,
                cbl_ttid: bnoBl.cbl_ttid,
                cbl_tdt: bnoBl.cbl_tdt,
                ftbl:bnoBl.ftbl,
                cp:bnoBl.cp,
                qty: bnoBl.qty,
                createdBy: await userCtrl.getUsefulUserData(bnoBl.createdBy),
                updatedBy: await userCtrl.getUsefulUserData(bnoBl.updatedBy),
                deletedBy: bnoBl.deletedBy,
                restoredBy: bnoBl.restoredBy,
                createdAt: bnoBl.createdAt,
                updatedAt: bnoBl.updatedAt,
                station:_station,
                detailsLivraisons:await DetailsLivraison.findAll({ where: { bonlivraison_id: bnoBl.id } ,include: [{model: Produit}] })
            })
            // bls.push(
            //     await BonLivraison.findByPk(rbl.id, {
            //         include: [
            //             {model: Station, include: [
            //                 {model: Ville, include: {model: DetailsVille, where: {depot_id: rbl.depot_id}}}
            //             ]},
            //             {model: DetailsLivraison, include: [{model: Produit}]}
            //         ]
            //     })
            // )
        }
        for(const bbb of bls){

            console.log('dates are valid');
            console.log('dates are valid',bbb);
        }
        // if(isValidDate(startDate) && isValidDate(endDate)){list = filterByPeriod(startDate, endDate, bls)}
        // else{list = bls}
        list = bls

        return list;
    } catch (err) {
        console.log(err);
     return [];}
}

async function gBlsAndFilterByTr(marketer_id, startDate, endDate){
    try {
        const bls = await gUnloadedBlsByMarketer(marketer_id, startDate, endDate)
        const marketer = await Marketer.findByPk(marketer_id)
        let data = [];
        let trList = [];

        // for (const bl of bls) {if (trList.indexOf(bl.transporteur_id) < 0) {trList.push(bl.transporteur_id)}}
        // for (const trId of trList) {
        //     const tr = await Transporteur.findByPk(trId)
        //     const trAssociatedBls = []
        //     let qty = 0;
        //     let cp = 0;
        //     let ftbl = 0;
        //     let cbl_tp = 0;
        //     let cbl_ttid = 0;
        //     let cbl_tdt = 0;
        //     for (const bl of bls) {
        //         if(bl.transporteur_id === trId)
        //         {
        //             trAssociatedBls.push(await gBl(bl.id)); 
        //             qty += bl.qty; 
        //             cp += bl.cp; 
        //             ftbl += bl.ftbl; 
        //             cbl_tp += bl.cbl_tp; 
        //             cbl_ttid += bl.cbl_ttid; 
        //             cbl_tdt += bl.cbl_tdt;
        //         }
        //     }

        //     data.push({
        //         transporteur: tr.nom, 
        //         qty: qty, 
        //         ftbl: ftbl, 
        //         cp:cp,
        //         cbl_tp: cbl_tp, 
        //         cbl_ttid: cbl_ttid, 
        //         cbl_tdt: cbl_tdt, 
        //         bls: trAssociatedBls
        //     })
        // }
        
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
    // const startDate = "2024-07-01";
    // const endDate ="2024-07-22";
    const startDate = new Date(req.body.startDate);
    // const endDate = req.body.endDate;
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
            // console.log("ej siuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu", marketerData);
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
       

        // for (const bl of bls) {if (trList.indexOf(bl.transporteur_id) < 0) {trList.push(bl.transporteur_id)}}
        // for (const trId of trList) {
        //     const tr = await Transporteur.findByPk(trId)
        //     const trAssociatedBls = []
        //     let qty = 0;
        //     let cp = 0;
        //     let ftbl = 0;
        //     let cbl_tp = 0;
        //     let cbl_ttid = 0;
        //     let cbl_tdt = 0;
            for (const bl of bls) {
                m_qty += bl.qty;
                m_ftbl += bl.ftbl;
                m_cp += bl.cp;
                m_cbl_tp += bl.cbl_tp;
               
            }

        //     data.push({
        //         transporteur: tr.nom, 
        //         qty: qty, 
        //         ftbl: ftbl, 
        //         cp:cp,
        //         cbl_tp: cbl_tp, 
        //         cbl_ttid: cbl_ttid, 
        //         cbl_tdt: cbl_tdt, 
        //         bls: trAssociatedBls
        //     })
        // }
        
        


        

        

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
        // console.log(err);
        return null
    }
}

exports.getResum = async(req, res, next)=>{
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















