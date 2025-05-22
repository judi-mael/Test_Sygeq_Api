/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const jwt = require('jsonwebtoken')
const { Op } = require("sequelize");
const xss = require("xss");

const {Compartiment,Camion} = require('../models')

/*****************************/
/*** GESTION DE LA RESSOURCE */
exports.getAllOfCamion = async (req, res, next) => {

    const id = parseInt(req.params.id) 
    console.log(id);
    
    //VALIDATION DES DONNEES RECUES
    if(!id){
        return res.status(400).json({ message: 'Parametre(s) manquant(s)' })
    }

    try {
        const camion = await Camion.findByPk(id, {paranoid: false})

        if(camion === null){
            return res.status(404).json({message: 'Camion introuvable ou désactivé'})
        }

        const compartiments = await Compartiment.findAll({where: {[Op.and]: [{camion_id: id}, {is_busy: 0}]}, order:[ ['createdAt','desc'] ]})

        return res.json({data: compartiments})

    } catch (err) {
        next(err)
    }
    
}
exports.getCompartimentPerCamion = async (req, res, next) => {

    const id = parseInt(req.params.id) 
    console.log(id);
    
    //VALIDATION DES DONNEES RECUES
    if(!id){
        return res.status(400).json({ message: 'Parametre(s) manquant(s)' })
    }

    try {
        const camion = await Camion.findByPk(id, {paranoid: false})

        if(camion === null){
            return res.status(404).json({message: 'Camion introuvable ou désactivé'})
        }

        const compartiments = await Compartiment.findAll({where: {[Op.and]: [{camion_id: id},{deletedAt:null}]}, })

        return res.json({data: compartiments})

    } catch (err) {
        next(err)
    }
    
}

exports.updateCompartiment = async (req, res, next) => {

    const id = parseInt(req.body.id) 
  
    
    //VALIDATION DES DONNEES RECUES
    if(!id){
        return res.status(400).json({ message: 'Parametre(s) manquant(s)' })
    }

    try {
        const compartiment = await Compartiment.findByPk(id, {paranoid: false})

        if(compartiment === null){
            return res.status(404).json({message: 'Compartiment introuvable ou désactivé'})
        }

        const compartiments = await Compartiment.update({ is_busy:0},{where: {id: id}},)

        return res.status(204).json({message: 'Compartiment modifié'})

    } catch (err) {
        next(err)
    }
    
}