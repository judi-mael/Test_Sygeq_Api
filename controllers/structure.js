/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const {Produit,User,Structure} = require('../models')
const xss = require("xss");
const { Op } = require('sequelize');

const mailerCtrl = require('./_internal/mailer')
const notifCtrl = require('./notification')

/*****************************/
/*** GESTION DE LA RESSOURCE */
exports.getAll = async (req, res, next) => {

    try {
        const structures = await Structure.findAll({paranoid: false, order:[ ['createdAt','desc'] ], 
            include: [
                {model: Produit}
            ]
        });
        res.json({data: structures})
    } catch (err) {
        console.log(err)
        next(err)
    }
    
}

exports.get = async (req, res, next) => {

    const id = parseInt(req.parseInt.id)

    try {
        const structure = await Structure.findByPk(id, {paranoid: false});
        res.json({data: structure})
    } catch (err) {
        // console.log(err)
        next(err)
    }
    
}

exports.add = async (req, res, next) => {

    const produitId = parseInt(req.body.produitId)
    const tauxPereq = req.body.tauxPereq
    const tauxTransportInterDepot = req.body.tauxTransportInterDepot
    const tauxDifferentielTransport = req.body.tauxDifferentielTransport
    const differentiel = req.body.differentiel
    const dateAppl = req.body.dateAppl
    const dateExp = req.body.dateExp
    const caisse = req.body.caisse
    const caisseB2B = req.body.caisseB2B

    console.log(req.body);

    //VALIDATION DES DONNEES RECUES
    if(
        !produitId || (!tauxPereq && req.body.tauxPereq !==0) || !dateAppl || !dateExp
    ){return res.status(400).json({ message: 'Veuillez renseigner tous les champs' })}
    
    // if(
    //     !produitId || (!tauxPereq && req.body.tauxPereq !==0) || (!tauxTransportInterDepot && req.body.tauxTransportInterDepot !==0) || 
    //     (!tauxDifferentielTransport && req.body.tauxDifferentielTransport !==0) || (!differentiel && differentiel !== 0) || 
    //     !dateAppl || !dateExp
    // ){return res.status(400).json({ message: 'Veuillez renseigner tous les champs' })}

    try { 

        const productCheck = await Produit.findByPk(produitId)
        if(!productCheck){return res.status(404).json({message: 'Produit introuvable ou désactivé'})}

        //VERIFICATION D'EXISTENCE
        let structures = await Structure.findAll({where: {produitId: produitId}})
        if(structures !== null){
            for (const structure of structures) { await Structure.destroy({where: {id: structure.id}}) }
        }

        //CREATION
        await Structure.create({
            produitId: produitId,
            tauxPereq: tauxPereq,
            tauxTransportInterDepot: tauxTransportInterDepot,
            tauxDifferentielTransport: tauxDifferentielTransport,
            differentiel: differentiel,
            dateAppl: dateAppl,
            dateExp: dateExp,
            caisse: caisse,
            caisseB2B: caisseB2B,
            createdBy: req.reqUserId,
            updatedBy: req.reqUserId
        })

        const requester = await User.findByPk(req.reqUserId)
        mailerCtrl.mailAllUsersOfAType('MIC', `Nouvelle structure de prix ajoutée`, `Le ${requester.type} ${requester.name}, a ajouté une nouvelle structure de prix.`)
        notifCtrl.notifyAllUsersOfAType('MIC', `Nouvelle structure de prix ajoutée`, `Le ${requester.type} ${requester.name}, a ajouté une nouvelle structure de prix.`)
      
        //ENVOI
        return res.status(204).json({})
        
    } catch (err) {
        // console.log(err);
        next(err)
    }
}