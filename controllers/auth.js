/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const jwt = require('jsonwebtoken')
const xss = require("xss");


const {User, Marketer, Login} = require('../models')

/*****************************/
/*** GESTION DE LA RESSOURCE */

exports.unameLogin = async (req, res, next) => {
    const username = xss(req.body.username)
    const password = req.body.password
    const appareil = xss(req.headers['user-agent']+' '+req.headers['sec-ch-ua'])
    const localisation = xss(req.body.localisation)
    const ip = req.headers['x-forwarded-for'];
   

    //VALIDATION DES DONNEES RECUES
    if(!username || !password || !appareil || !localisation){
        return res.status(400).json({ message: 'Veuillez renseigner tous les champs' })
    }
    console.log("=====================================");
    console.log(req.body)
    try {
        // VERIFICATION D'EXISTENCE
        let user = await User.findOne({ where: {username: username}, raw: true })
        console.log(user)
        if(user === null){
            
            await Login.create({
                identifiant: username,
                ip: ip,
                appareil: appareil,
                localisation: localisation,
                statut: 'Compte inexistant'
            })

            return res.status(401).json({ message: 'Compte introuvable ou désactivé' })
        }

        // VERIFICATION DU MOT DE PASSE
        let test = await User.checkPassword(password, user.password)
        if(!test){

            await Login.create({
                identifiant: username,
                ip: ip,
                appareil: appareil,
                localisation: localisation,
                statut:  'Mot de passe erroné'
            })

            return res.status(401).json({ message: 'Identifiant ou Mot de passe erroné' })
        }
        let identite;
        if (user.type=='Station'|| user.type=="Marketer") {
            
         const marketer = await Marketer.findOne({where: {id: user.marketer_id}, paranoid: false});
            identite = marketer.identite;
        }else{
            identite = null;
        }
        // GENERATION DU TOKEN ET ENVOI
        const token = jwt.sign({
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email,
            email_verified_at: user.email_verified_at,
            passChanged: user.passChanged,
            type: user.type,
            role: user.role,
            marketer_id: user.marketer_id,
            marketer_identity: identite,
            depot_id: user.depot_id,
            transporteur_id: user.transporteur_id,
            station_id: user.station_id,
            b2b_id: user.b2b_id,
            image: user.image,
            remember_token: user.remember_token,
            created_by: user.created_by,
            updated_by: user.updated_by,
            etat: user.etat,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            deletedAt: user.deletedAt,
        }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_DURING })

        await Login.create({
            user_id: user.id,
            identifiant: username,
            ip: ip,
            appareil: appareil,
            localisation: localisation,
            statut:  'Succès'
        })
        console.log("je suis le token de user",token);
        return res.json({access_token: token})
        
    } catch (err) {
        console.log('====================================');
        console.log(err);
        console.log('====================================');
        next(err)
    }
}

exports.emailLogin = async (req, res, next) => { 
    // console.log(req);
    const email = xss(req.body.email)
    const password = req.body.password
    const appareil = xss(req.headers['user-agent']+' '+req.headers['sec-ch-ua'])
    const localisation = xss(req.body.localisation)
    const ip = req.headers['x-forwarded-for'];
    console.log("mail")
    //VALIDATION DES DONNEES RECUES
    if(!email || !password || !appareil || !localisation){
        return res.status(400).json({ message: 'Veuillez renseigner tous les champs' })
    }

    try {
        // VERIFICATION D'EXISTENCE
        console.log("=====================================");
        console.log(req.body)
        let user = await User.findOne({ where: {email: email}, raw: true })
        if(user === null){

            await Login.create({
                email: email,
                ip: ip,
                appareil: appareil,
                localisation: localisation,
                statut:  'Compte introuvable ou désactivé'
            })

            return res.status(401).json({ message: 'Compte introuvable ou désactivé' })
        }

        // VERIFICATION DU MOT DE PASSE
        let test = await User.checkPassword(password, user.password)
        if(!test){

            await Login.create({
                email: email,
                ip: ip,
                appareil: appareil,
                localisation: localisation,
                statut:  'Mot de passe erroné'
            })

            return res.status(401).json({ message: 'Identifiant ou Mot de passe erroné' })
        }

        marketer = await Marketer.findOne({where: {id: user.marketer_id}, paranoid: false });

        // GENERATION DU TOKEN ET ENVOI
        const token = jwt.sign({
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email,
            email_verified_at: user.email_verified_at,
            passChanged: user.passChanged,
            type: user.type,
            role: user.role,
            marketer_id: user.marketer_id,
            marketer_identity: marketer? marketer.identite:null,
            depot_id: user.depot_id,
            transporteur_id: user.transporteur_id,
            station_id: user.station_id,
            image: user.image,
            remember_token: user.remember_token,
            created_by: user.created_by,
            updated_by: user.updated_by,
            etat: user.etat,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            deletedAt: user.deletedAt,
        }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_DURING })

        await Login.create({
            user_id: user.id,
            email: email,
            ip: ip,
            appareil: appareil,
            localisation: localisation,
            statut:  'Succès'
        })


        return res.json({access_token: token})
        
    } catch (err) {
        next(err)
    }
}
