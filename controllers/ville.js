/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const jwt = require('jsonwebtoken')
const { Op } = require("sequelize");
const xss = require("xss");

const {Region, Depot,DetailsVille,TauxTk,Ville,TauxForfaitaire} = require('../models')

/*****************************/
/*** GESTION DE LA RESSOURCE */

async function initCities(){
    const cities = [
        'Abomey',      'Abomey-Calavi', 'Adja-Ouèrè',   'Adjarra',              'Agoue',
        'Adjohoun',    'Agbangnizoun',  'Aguégués',     'Allada',
        'Aplahoué',    'Athiémé',       'Avrankou',     'Azovè',                'Banikoara',
        'Bantè',       'Bassila',       'Bembèrèkè',    'Bohicon',              'Bodi',
        'Bonou',       'Bopa',          'Boukombé',     'Cobly',
        'Comè',        'Copargo',       'Cotonou',      'Covè',
        'Dangbo',      'Dassa-Zoumè',   'Djakotomey',   'Djidja',               'Dan',
        'Djougou',     'Dogbo',         'Glazoué',      'Gogounou',
        'Grand-Popo',  'Houéyogbé',     'Ifangni',      'Kalalé',
        'Kandi',       'Karimama',      'Kérou',        'Kétou',
        ' Klouékanmè', 'Kouandé',       'Kpomassè',     'Lalo',
        'Lokossa',     'Masse',         'Malanville',   'Manigri',              'Matéri', 'Akpro-Missérété',
        "N'dali",      'Natitingou',    'Nikki',        'Ouaké',                'Onigbolo',
        'Ouèssè',      'Ouidah',        'Ouinhi',       'Parakou',              'PK 10', 'Pahou',
        'Pehunco',     'Pèrèrè',        'Pobè',         'Porga',                'Porto-Novo',
        'Sakété',      'Savalou',       'Savè',         'Ségbana',              'Sékou',
        'Sèmè-Podji',  'Sinendé',       'Sô-Ava',       'Tanguiéta',
        'Tchaourou',   'Toffo',         'Tori-Bossito', 'Toucountouna',
        'Toviklin',    'Zagnanado',     'Za-Kpota',     'Zè',
        'Zogbodomey',  'Attogon',        'Godomey',      'Glo',
        'Houègbo',     'Mougnon',       'Gakpé',        'Paouignan',
    ]
    
    let deps = [
        {
            department: 'Zou',
            lat:7.2794078,
            lng:1.7635035,
            cities: [
              'Abomey',   'Agbangnizoun',
              'Bohicon',  'Covè',
              'Dan',      'Djidja',
              'Ouinhi',   'Zagnanado',
              'Za-Kpota', 'Zogbodomey',
              'Mougnon'
            ]
          },
          {
            department: 'Atlantique',
            lat:6.6515339,
            lng:1.8888688,
            cities: [
              'Abomey-Calavi',
              'Allada',
              'Kpomassè',
              'Ouidah',
              'Pahou',
              'Sékou',
              'Sô-Ava',
              'Toffo',
              'Tori-Bossito',
              'Zè',
              'Attogon',
              'Godomey',
              'Glo',
              'Houègbo',
              'Gakpé'
            ]
          },
          {
            department: 'Plateau',
            lat:7.1032291,
            lng:2.2716653,
            cities: [ 'Adja-Ouèrè', 'Ifangni', 'Kétou', 'Masse', 'Pobè', 'Sakété' ]
          },
          {
            department: 'Ouémé',
            lat:6.6737661,
            lng:2.2169439,
            cities: [
              'Adjarra',
              'Adjohoun',
              'Aguégués',
              'Akpro-Missérété',
              'Avrankou',
              'Bonou',
              'Dangbo',
              'Onigbolo',
              'Porto-Novo',
              'Sèmè-Podji'
            ]
          },
          {
            department: 'Mono',
            lat:6.5151947,
            lng:1.6322908,
            cities: [
              'Agoue',
              'Athiémé',
              'Bopa',
              'Comè',
              'Grand-Popo',
              'Houéyogbé',
              'Lokossa'
            ]
          },
          {
            department: 'Couffo',
            lat:7.0821618,
            lng:1.19859,
            cities: [
              'Aplahoué',
              'Azovè',
              'Djakotomey',
              'Dogbo',
              'Klouékanmè',
              'Lalo',
              'Toviklin'
            ]
          },
          {
            department: 'Alibori',
            lat:11.4571482,
            lng:2.2705477,
            cities: [
              'Banikoara',
              'Gogounou',
              'Kandi',
              'Karimama',
              'Malanville',
              'Ségbana'
            ]
          },
          {
            department: 'Collines',
            lat:8.1187885,
            lng:1.5328918,
            cities: [ 'Bantè', 'Dassa-Zoumè', 'Glazoué', 'Ouèssè', 'Savalou', 'Savè','Paouignan' ]
          },
          {
            department: 'Donga',
            lat:9.2978076,
            lng:1.1243397,
            cities: [ 'Bassila', 'Bodi', 'Copargo', 'Djougou', 'Manigri', 'Ouaké' ]
          },
          {
            department: 'Borgou',
            lat:9.7199788,
            lng:2.2483544,
            cities: [
              'Bembèrèkè', 'Kalalé',
              "N’dali",    'Nikki',
              'Parakou',   'Pèrèrè',
              'Sinendé',   'Tchaourou'
            ]
          },
          {
            department: 'Atacora',
            lat:10.7372172,
            lng:0.9072465,
            cities: [
              'Boukombé',  'Cobly',
              'Kérou',     'Kouandé',
              'Matéri',    'Natitingou',
              'Pehunco',   'Porga',
              'Tanguiéta', 'Toucountouna'
            ]
          },
          { department: 'Littoral', lat:6.3846062, lng:2.3958529, cities: [ 'Cotonou', 'PK 10' ] }
    ];
    
    try {

        let data = [];

        for (const dep of deps) {
            const newDep = await Region.create({
                nom:dep.department,
                lng:dep.lng,
                lat:dep.lat,
                createdBy:1,
                updatedBy:1,
            })

            for (const city of dep.cities) { await Ville.create({nom: city, region_id: newDep.id, createdBy: 1, updatedBy: 1}) }

        }


        data = await Ville.findAll()
        
        return data;

    } catch (err) { 
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
       next(err)
    }
}
exports.addVille = async (req, res, next)=> {
    const nom = xss(req.body.nom)
    const depots = req.body.depots
    
    const region_id = parseInt(req.body.region_id)
    let checkVille = await Ville.findAll({where:{nom:nom, region_id:region_id}})
    if (checkVille[0]){
        res.status(400).json({message: 'Cette ville existe déjà.'})
    }
    try {
        const newVille = await Ville.create({nom:nom, region_id:region_id, createdBy:req.reqUserId, updatedBy:req.reqUserId})
        for(const depot of depots){
            let tarif = await renderTarif(depot.distance, depot.prime, depot.difficultee)

            const newDetailVille = await DetailsVille.create({
                ville_id:newVille.id, 
                depot_id:depot.depot_id,
                distance:parseFloat(depot.distance),
                difficultee:parseFloat(depot.difficultee),
                prime:parseFloat(depot.prime),
                tarif_produits_blanc:tarif,
                tarif_gpl:tarif*2.51,
                createdBy:req.reqUserId, 
                updatedBy:req.reqUserId}) 
        }
        return res.status(204).json({message:'Ville ajouté avec succèss'})
    } catch (err) {
        next(err)
    }
}
exports.getAllRegion = async  (req, res, next)=>{
    try {
        const list = []
        let allRegion = await Region.findAll({ paranoid: false, order: [['createdAt', 'desc']] })
        for(const region of allRegion){
            list.push({id:region.id, nom:region.nom, createdAt:region.createdAt, updatedAt:region.updatedAt})
        }
        return res.json({data:list})
    } catch (error) {
       next(err)
    }
}
exports.getAll = async (req, res, next) => {
    try {
        const list = []
        let villes = await Ville.findAll({ order:[ ['createdAt','desc'] ]})
        !villes || villes.length === 0 ? villes = await initCities() : false

        for (const ville of villes) {
            const details = []
            const data = await DetailsVille.findAll({where: {ville_id: ville.id}})
            for (const dv of data) {
                details.push({
                    id: dv.id,
                    depot: await Depot.findByPk(dv.depot_id),
                    ville_id: dv.ville_id,
                    difficultee: dv.difficultee,
                    distance: dv.distance,
                    prime: dv.prime,
                    tarif_produits_blanc: dv.tarif_produits_blanc,
                    tarif_gpl: dv.tarif_gpl,
                    tarif_gpl_vrac: dv.tarif_gpl_vrac,
                    createdBy: dv.createdBy,
                    updatedBy: dv.updatedBy,
                    deletedBy: dv.deletedBy,
                    restoredBy: dv.restoredBy,
                    suspensionComment: dv.suspensionComment,
                    createdAt: dv.createdAt,
                    updatedAt: dv.updatedAt,
                    deletedAt: dv.deletedAt
                })
            }
            list.push({
                id: ville.id,
                nom: ville.nom,
                details: details,
                createdBy: ville.createdBy,
                updatedBy: ville.updatedBy,
                deletedBy: ville.deletedBy,
                restoredBy: ville.restoredBy,
                suspensionComment: ville.suspensionComment,
                createdAt: ville.createdAt,
                updatedAt: ville.updatedAt,
                deletedAt: ville.deletedAt
            })
        }

        return res.json({data: list})

    } catch (err) {
        console.log(err);
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
        let ville = await Ville.findByPk(id, {paranoid: false})
        if(ville === null){
            return res.status(404).json({message: 'Ville introuvable'})
        }

        const details = []
        const data = await DetailsVille.findAll({where: {ville_id: ville.id}})
        for (const dv of data) {
            details.push({
                id: dv.id,
                depot: await Depot.findByPk(dv.depot_id),
                ville_id: dv.ville_id,
                difficultee: dv.difficultee,
                distance: dv.distance,
                prime: dv.prime,
                tarif: dv.tarif,
                createdBy: dv.createdBy,
                updatedBy: dv.updatedBy,
                deletedBy: dv.deletedBy,
                restoredBy: dv.restoredBy,
                suspensionComment: dv.suspensionComment,
                createdAt: dv.createdAt,
                updatedAt: dv.updatedAt,
                deletedAt: dv.deletedAt
            })
        }

        //ENVOI
        return res.json({data: {
            id: ville.id,
            nom: ville.nom,
            details: details,
            createdBy: ville.createdBy,
            updatedBy: ville.updatedBy,
            deletedBy: ville.deletedBy,
            restoredBy: ville.restoredBy,
            suspensionComment: ville.suspensionComment,
            createdAt: ville.createdAt,
            updatedAt: ville.updatedAt,
            deletedAt: ville.deletedAt
        }})
        
    } catch (err) {
        // console.log(err);
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
        let ville;
        let villes = await Ville.findAll({paranoid: false, include: [
            {model: DetailsVille, include: [
                {model: Depot}
            ]}
        ]});
        for (const vil of villes) {
            vil.nom.toLowerCase().replaceAll(' ','') === nom.toLowerCase().replaceAll(' ','') ? ville=vil : false
        }
        
        if(!ville){
            console.log('ville introuvable === ',nom);
            return res.status(404).json({message: 'Ville introuvable ou désactivée'})
        }

        //ENVOI
        return res.json(ville)
        
    } catch (err) {
        next(err)
    }
}

exports.add = async (req, res, next) => {
    const nom = xss(req.body.nom)

    //VALIDATION DES DONNEES RECUES
    if(!nom){
        return res.status(400).json({ message: 'Veuillez renseigner tous les champs' })
    }

    try {
        //CREATION
        let ville= await Ville.create({
            nom : nom,
            createdBy: req.reqUserId,
            updatedBy: req.reqUserId
        })

        //ENVOI
        return res.json({message: 'La ville a bien été ajoutée'})
        
    } catch (err) {
        // console.log(err);
        next(err)
    }
}

// exports.addTest = async (req, res, next) => {
//     const villes = req.body.villes

//     try {
//         //CREATION
//         for (const nom of villes) {
//             await Ville.create({
//                 nom : nom,
//                 createdBy: 1,
//                 updatedBy: 1
//             })
//         }

//         //ENVOI
//         return res.json({message: `Les ${villes.length} villes ont bien été ajoutées`})
        
//     } catch (err) {
//         console.log(err);
//         next(err)
//     }
// }

exports.update = async (req, res, next) => {
    let id = parseInt(req.params.id)

    //VALIDATION DES DONNEES RECUES
    if(!id){
        return res.status(400).json({ message: 'Parametre(s) manquante(s)' })
    }

    try {
        //RECUPERATION
        let ville = await Ville.findByPk(id)       
        if(ville === null){
            return res.status(404).json({message: 'Ville introuvable'})
        }

        //MISE A JOUR DU BC
        await Ville.update(req.body, {where: {id: id}})
        await Ville.update({updatedBy: req.reqUserId}, {where: {id: id}})
        return res.json({message: 'La ville a bien été modifié'})
        
    } catch (err) {
        // console.log(err);
        next(err)
    }
}

exports.trash = async (req, res, next) => {
    const id = parseInt(req.params.id)
    const suspensionComment = req.body.suspensionComment

    //VALIDATION DES DONNEES RECUES
    if(!id || !suspensionComment){
        return res.status(400).json({ message: 'Parametre(s) ou donnée(s) manquant(s)' })
    }

    try {

        let ville = await Ville.findByPk(id)       
        if(ville === null){
            return res.status(404).json({message: 'Donnée introuvable'})
        }

        await Ville.update({deletedBy: req.reqUserId, suspensionComment: suspensionComment}, {where: {id: id}})
        await Ville.destroy({where: {id: id}})
        return req.status(204).json({})
        
    } catch (err) {
        // console.log(err);
        next(err)
    }
}

exports.untrash = async (req, res, next) => {
    const id = parseInt(req.params.id)

    //VALIDATION DES DONNEES RECUES
    if(!id){
        return res.status(400).json({ message: 'Parametre(s) manquant(s)' })
    }

    try {

        let ville = await Ville.findByPk(id, {paranoid: false})       
        if(ville === null){ return res.status(404).json({message: 'Donnée introuvable'}) }

        await Ville.restore({where: {id: id}})
        await Ville.update({deletedBy: null, restoredBy: req.reqUserId, suspensionComment: null}, {where: {id: id}})
        return req.status(204).json({})

    } catch (err) {
        // console.log(err);
        next(err)
    }
}

exports.delete = async (req, res, next) => {
    const id = parseInt(req.params.id)

    //VALIDATION DES DONNEES RECUES
    if(!id){
        return res.status(400).json({ message: 'Parametre(s) manquant(s)' })
    }

    try {

        let ville = await Ville.findByPk(id, {paranoid: false})       
        if(ville === null){ return res.status(404).json({message: 'Donnée introuvable'}) }

        await Ville.destroy({where: {id: id}, force: true})
        return req.status(204).json({})

    } catch (err) {
        // console.log(err);
        next(err)
    }
}





