/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const jwt = require('jsonwebtoken')
const { Op } = require("sequelize");
const xss = require("xss");


const userCtrl = require('./user')

const {User,Camion, Transporteur, Marketer,Contrat} = require('../models')
const mailerCtrl = require('./_internal/mailer')
const notifCtrl = require('./notification')

/*****************************/
/*** GESTION DE LA RESSOURCE */
exports.getAll = async (req, res, next) => {

    let list = []
    let contrats
    let user = await userCtrl.getUsefulUserData(req.reqUserId)

    try {

        if(req.reqUserType === 'Marketer'){
            contrats = await Contrat.findAll({where: {marketer_id: user.marketer_id}, paranoid: false, order:[['createdAt','desc']]});
            // On récupère la liste des transporteurs pour le marketer en question
        }else{
            contrats = await Contrat.findAll({paranoid: false, order:[['createdAt','desc']]});
        }

        for (let i = 0; i < contrats.length; i++) {
            const contrat = contrats[i];
            list.push(
                {
                    id: contrat.id,
                    marketer: await Marketer.findByPk(contrat.marketer_id),
                    transporteur: await Transporteur.findByPk(contrat.transporteur_id),
                    statut: contrat.statut,
                    commentaire: contrat.commentaire,
                    etat: contrat.etat,
                    createdBy: await userCtrl.getUsefulUserData(contrat.createdBy),
                    updatedBy: await userCtrl.getUsefulUserData(contrat.updatedBy),
                    createdAt: contrat.createdAt,
                    updatedAt: contrat.updatedAt,
                    deletedAt: contrat.deletedAt,
                }
            )
        }

        return res.json({data: list})
        
    } catch (err) {
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
        let contrat = await Contrat.findByPk(id, {paranoid: false})
        if(contrat === null){
            return res.status(404).json({message: 'Contrat introuvable'})
        }

        //ENVOI
        return res.json({data: [{
            id: contrat.id,
            marketer: await Marketer.findByPk(contrat.marketer_id),
            transporteur: await Transporteur.findByPk(contrat.transporteur_id),
            statut: contrat.statut,
            commentaire: contrat.commentaire,
            etat: contrat.etat,
            createdBy: await userCtrl.getUsefulUserData(contrat.createdBy),
            updatedBy: await userCtrl.getUsefulUserData(contrat.updatedBy),
            createdAt: contrat.createdAt,
            updatedAt: contrat.updatedAt,
            deletedAt: contrat.deletedAt,
        }] })
        
    } catch (err) {
        // console.log(err);
        next(err)
    }
}

exports.add = async (req, res, next) => {

    const trIds = req.body.trIds;

    // const trIdsd = req.body.trdata;

    // console.log(req.reqUserId);
    // console.log(req.body.trIds);

    if(trIds === null){return res.status(400).json({ message: 'Donnée invalide ou manquante' })};

    // if(trIdsd === null){return res.status(400).json({ message: 'Donnée invalide ou manquante' })};

    //VALIDATION DES DONNEES RECUES
    if(trIds.length < 1){return res.status(400).json({ message: 'Aucun transporteur dans la liste' })}
    else if(req.reqUserRole !== 'Super Admin' && req.reqUserRole !== 'Admin'){return res.status(409).json({ message: 'Requête non authorisée' })};
    
    // if(trIdsd.length < 1){return res.status(400).json({ message: 'Aucun transporteur dans la liste' })}
    // else if(req.reqUserRole !== 'Super Admin' && req.reqUserRole !== 'Admin'){return res.status(409).json({ message: 'Requête non authorisée' })}

    try {

        const user = await userCtrl.getUsefulUserData(req.reqUserId)
        let notes = '';

        for (const trId of trIds) {
            if (parseInt(trId) > 0) {
                const contrat = await Contrat.findOne({where: {[Op.and]: [{marketer_id: user.marketer_id}, {transporteur_id: trId}]} });
                if(contrat !== null && contrat.statut === 'Approuvé'){
                    const tr = await Transporteur.findByPk(contrat.transporteur_id)
                    notes = notes + `Le contrat avec ${tr.nom} contrat existe déjà et est actif. ` 
                }
                else if(contrat !== null && contrat.status !== 'Approuvé'){
                    //MISE A JOUR
                   await Contrat.update({
                        statut: 'En attente',
                        commentaire: null,
                        etat: 1,
                        updatedBy: req.reqUserId
                    }, {where: {id: contrat.id}})
                    
                    //NOTIF TO ALL MIC 
                    const user = await User.findByPk(req.reqUserId)
                    const transporteur = await Transporteur.findByPk(trId)
                    const marketer = await Marketer.findByPk(user.marketer_id)
                    
                    /** this part has been commented by me to prevent admin Mic spamming durring test */
                   // mailerCtrl.mailAllUsersOfAType('MIC', `Demande d'approbation de contrat`, `Le ${user.type} ${user.name}, a relancé contrat de transport entre les structures ${marketer.nom} et ${transporteur.nom}. Le contrat est en attente d'approbation`)
                    //notifCtrl.notifyAllUsersOfAType('MIC', `Demande d'approbation de contrat`, `Le ${user.type} ${user.name}, a relancé contrat de transport entre les structures ${marketer.nom} et ${transporteur.nom}. Le contrat est en attente d'approbation`)
    
                    //NOTIF TO CREATOR
                    mailerCtrl.mailSingle(req.reqUserId, `Contrat avec ${transporteur.nom} mis à jour`, `Vous avez relancé un contrat avec la structure de transport ${transporteur.nom}. Le contrat est en attente d'approbation`);
                    notifCtrl.notifyAllUsersOfAType(req.reqUserId, `Contrat avec ${transporteur.nom} mis à jour`, `Vous avez relancé un contrat avec la structure de transport ${transporteur.nom}. Le contrat est en attente d'approbation`);
                    // transporter notif
                    mailerCtrl.mailContratTransporter(trId, contrat.id, `Contrat de transport avec ${marketer.nom} `, `${transporteur.nom} vous avez reçu une demande d'approbation de transport de ${marketer.nom} . Le contrat est donc en attente d'approbation. `)
                                
                    //ENVOI
                    notes = notes + ` Le contrat avec ${transporteur.nom} a été relancé avec success. ` 
                }
                else{
                    //CREATION
                    let ctrt = await Contrat.create({
                        marketer_id: (await userCtrl.getUsefulUserData(req.reqUserId)).marketer_id,
                        transporteur_id: trId,
                        createdBy: req.reqUserId,
                        updatedBy: req.reqUserId
                    })
        
                    //NOTIF TO ALL MIC 
                    const user = await User.findByPk(req.reqUserId)
                    const transporteur = await Transporteur.findByPk(trId)
                    const marketer = await Marketer.findByPk(user.marketer_id)
                    // mailerCtrl.mailAllUsersOfAType('MIC', `Demande d'approbation de contrat`, `Le ${user.type} ${user.name}, a initié un contrat de transport entre les structures ${marketer.nom} et ${transporteur.nom}. Le contrat est donc en attente d'approbation`)
                    notifCtrl.notifyAllUsersOfAType('MIC', `Demande d'approbation de contrat`, `Le ${user.type} ${user.name}, a initié un contrat de transport entre les structures ${marketer.nom} et ${transporteur.nom}. Le contrat est donc en attente d'approbation`)
            
                    //NOTIF TO CREATOR
                    mailerCtrl.mailSingle(req.reqUserId, `Contrat avec ${transporteur.nom} initié`, `Vous avez initié un contrat avec la structure de transport ${transporteur.nom}. Le contrat est donc en attente d'approbation`)
                    notifCtrl.notifyAllUsersOfAType(req.reqUserId, `Contrat avec ${transporteur.nom} initié`, `Vous avez initié un contrat avec la structure de transport ${transporteur.nom}. Le contrat est donc en attente d'approbation`)
                    // Notif Transporteur
                    mailerCtrl.mailContratTransporter(transporteur.id, ctrt.id, `Demande d'approbation de contrat`, ` ${marketer.nom}, a initié un contrat de transport entre les structures ${marketer.nom} et ${transporteur.nom}. Le contrat est donc en attente d'approbation`)
                   //ENVOI
                   notes = notes + ` Le contrat avec ${transporteur.nom} a été initié avec success. ` 
                }
            }else{notes = notes + `${trId} n'est pas un nombre valide. `}
        }

        // for (const trId of trIds) {
        //     if (parseInt(trId) > 0) {
        //         const contrat = await Contrat.findOne({where: {[Op.and]: [{marketer_id: user.marketer_id}, {transporteur_id: trId}]} });
        //         if(contrat !== null && contrat.statut === 'Approuvé'){
        //             const tr = await Transporteur.findByPk(contrat.transporteur_id)
        //             notes = notes + `Le contrat avec ${tr.nom} contrat existe déjà et est actif. ` 
        //         }
        //         else if(contrat !== null && contrat.status !== 'Approuvé'){
        //             //MISE A JOUR
        //             await Contrat.update({
        //                 statut: 'En attente',
        //                 commentaire: null,
        //                 etat: 1,
        //                 updatedBy: req.reqUserId
        //             }, {where: {id: contrat.id}})
                    
        //             //NOTIF TO ALL MIC 
        //             const user = await User.findByPk(req.reqUserId)
        //             const transporteur = await Transporteur.findByPk(trId)
        //             const marketer = await Marketer.findByPk(user.marketer_id)
        //             mailerCtrl.mailAllUsersOfAType('MIC', `Demande d'approbation de contrat`, `Le ${user.type} ${user.name}, a mis à jour un contrat de transport entre les structures ${marketer.nom} et ${transporteur.nom}. Le contrat est donc en attente d'approbation`)
        //             notifCtrl.notifyAllUsersOfAType('MIC', `Demande d'approbation de contrat`, `Le ${user.type} ${user.name}, a mis à jour un contrat de transport entre les structures ${marketer.nom} et ${transporteur.nom}. Le contrat est donc en attente d'approbation`)
    
        //             //NOTIF TO CREATOR
        //             mailerCtrl.mailSingle(req.reqUserId, `Contrat avec ${transporteur.nom} mis à jour`, `Vous avez mis à jour un contrat avec la structure de transport ${transporteur.nom}. Le contrat est donc en attente d'approbation`)
        //             notifCtrl.notifyAllUsersOfAType(req.reqUserId, `Contrat avec ${transporteur.nom} mis à jour`, `Vous avez mis à jour un contrat avec la structure de transport ${transporteur.nom}. Le contrat est donc en attente d'approbation`)
                                
        //             //ENVOI
        //             notes = notes + `Le contrat avec ${transporteur.nom} a bien été mis à jour. ` 
        //         }
        //         else{
        //             //CREATION
        //             await Contrat.create({
        //                 marketer_id: (await userCtrl.getUsefulUserData(req.reqUserId)).marketer_id,
        //                 transporteur_id: trId,
        //                 createdBy: req.reqUserId,
        //                 updatedBy: req.reqUserId
        //             })
        
        //             //NOTIF TO ALL MIC 
        //             const user = await User.findByPk(req.reqUserId)
        //             const transporteur = await Transporteur.findByPk(trId)
        //             const marketer = await Marketer.findByPk(user.marketer_id)
        //             mailerCtrl.mailAllUsersOfAType('MIC', `Demande d'approbation de contrat`, `Le ${user.type} ${user.name}, a initié un contrat de transport entre les structures ${marketer.nom} et ${transporteur.nom}. Le contrat est donc en attente d'approbation`)
        //             notifCtrl.notifyAllUsersOfAType('MIC', `Demande d'approbation de contrat`, `Le ${user.type} ${user.name}, a initié un contrat de transport entre les structures ${marketer.nom} et ${transporteur.nom}. Le contrat est donc en attente d'approbation`)
            
        //             //NOTIF TO CREATOR
        //             mailerCtrl.mailSingle(req.reqUserId, `Contrat avec ${transporteur.nom} initié`, `Vous avez initié un contrat avec la structure de transport ${transporteur.nom}. Le contrat est donc en attente d'approbation`)
        //             notifCtrl.notifyAllUsersOfAType(req.reqUserId, `Contrat avec ${transporteur.nom} initié`, `Vous avez initié un contrat avec la structure de transport ${transporteur.nom}. Le contrat est donc en attente d'approbation`)
                    
        //         }
        //     }else{notes = notes + `${trId} n'est pas un nombre valide. `}
        // }
        
        //ENVOI
        if (notes.length > 0) {return res.json({message: notes})}
        return res.status(204).json({})
        
    } catch (err) {
        console.log(err);
        next(err)
    }
}

exports.cancel = async (req, res, next) => {
    let id = parseInt(req.params.id)
    // console.log(req.body);

    //VALIDATION DES DONNEES RECUES
    if(!id){
        return res.status(400).json({ message: 'Parametre(s) manquant(s)' })
    }

    try {
        //RECUPERATION
        const contrat = await Contrat.findByPk(id)       
        const user = await User.findByPk(req.reqUserId)       
        if(contrat === null){return res.status(404).json({message: 'Contrat introuvable'})}
        else if(user.marketer_id !== contrat.marketer_id){return res.status(401).json({message: 'Requête non authorisée'})}

        //MISE A JOUR
        await Contrat.update({statut: 'Annulé', updatedBy: req.reqUserId}, {where: {id: id}})
        
        //NOTIF TO ALL MIC 
        const transporteur = await Transporteur.findByPk(contrat.transporteur_id)
        const marketer = await Marketer.findByPk(user.marketer_id)
        mailerCtrl.mailAllUsersOfAType('MIC', `Demande d'approbation de contrat`, `Le ${user.type} ${user.name}, a mis à jour un contrat de transport entre les structures ${marketer.nom} et ${transporteur.nom}. Le contrat est donc en attente d'approbation`)
        notifCtrl.notifyAllUsersOfAType('MIC', `Demande d'approbation de contrat`, `Le ${user.type} ${user.name}, a mis à jour un contrat de transport entre les structures ${marketer.nom} et ${transporteur.nom}. Le contrat est donc en attente d'approbation`)

        //NOTIF TO CREATOR
        mailerCtrl.mailSingle(req.reqUserId, `Contrat avec ${transporteur.nom} mis à jour`, `Vous avez mis à jour un contrat avec la structure de transport ${transporteur.nom}. Le contrat est donc en attente d'approbation`)
        notifCtrl.notifySingle(req.reqUserId, `Contrat avec ${transporteur.nom} mis à jour`, `Vous avez mis à jour un contrat avec la structure de transport ${transporteur.nom}. Le contrat est donc en attente d'approbation`)
         
        return res.status(204).json({})
        
    } catch (err) {
        // console.log(err);
        next(err)
    }
}

// exports.approve = async (req, res, next) => {
//     const id = parseInt(req.params.id)
//     const commentaire = "-"
//     // const commentaire = xss(req.body.commentaire)

//     // console.log(req.body);

//     //VALIDATION DES DONNEES RECUES
//     if(!id){
//         return res.status(400).json({ message: 'Parametre(s) manquant(s)' })
//     }

//     try {
//         //RECUPERATION
//         const contrat = await Contrat.findByPk(id)       
//         const user = await User.findByPk(req.reqUserId)       
//         if(contrat === null){return res.status(404).json({message: 'Contrat introuvable'})}

//         //MISE A JOUR
//         await Contrat.update({statut: 'Approuvé', commentaire: commentaire, updatedBy: req.reqUserId}, {where: {id: id}})
        
//         //NOTIF TO ALL MIC 
//         const transporteur = await Transporteur.findByPk(contrat.transporteur_id)
//         const marketer = await Marketer.findByPk(contrat.marketer_id)
//         mailerCtrl.mailAllUsersOfAType('MIC', `Contrat avec ${transporteur.nom} a été approuvé`, `Le ${user.type} ${user.name}, a approuvé le contrat de transport entre les structures ${marketer.nom} et ${transporteur.nom}.`)
//         notifCtrl.notifyAllUsersOfAType('MIC', `Contrat avec ${transporteur.nom} a été approuvé`, `Le ${user.type} ${user.name}, a approuvé le contrat de transport entre les structures ${marketer.nom} et ${transporteur.nom}.`)

//         //NOTIF TO MARKETER
//         const marketerUsers = await User.findAll({where: {marketer_id: contrat.marketer_id}})
//         for (const marketerUser of marketerUsers) {
//             if(marketerUser.type !== 'Station'){
//                 mailerCtrl.mailSingle(marketerUser.reqUserId, `Contrat avec ${transporteur.nom} a été approuvé`, `Votre contrat avec la structure de transport ${transporteur.nom} a été approuvé. Vous pouvez donc choisir ses camion lors de création de vos bons de livraisons.`)
//                 notifCtrl.notifySingle(marketerUser.reqUserId, `Contrat avec ${transporteur.nom} a été approuvé`, `Votre contrat avec la structure de transport ${transporteur.nom} a été approuvé. Vous pouvez donc choisir ses camion lors de création de vos bons de livraisons.`)
//             }
//         }
         
//         return res.status(204).json({})
        
//     } catch (err) {
//         // console.log(err);
//         next(err)
//     }
// }

const decodeContratid = (req, res, next) => {

    const token = req.params.id && extractBearer(req.params.id)

    if (!token) {
        return res.status(401).json({ message: 'Identifian de la requette invalide' })
    }

    // Vérifier la validité du token
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
            return res.status(401).json({ message: 'Token erroné ou expiré' })
        }
        // else if (parseInt(decodedToken.id) !== parseInt(req.params.id)) {
        //     return res.status(401).json({ message: 'Accréditation incorrecte, opération non autorisée' })
        // }

        // req.reqUserId = decodedToken.id
        // req.reqUserType = decodedToken.type
        // req.reqUserRole = decodedToken.role
        // next()
        return decodedToken?.id 
    })
}

exports.approve = async (req, res, next) => {
    console.log('approve');
    console.log('approve',req.params.id);
    const id = decodeContratid(req, res, next)
    //const id = parseInt(req.params.id)
    console.log(id);
    const commentaire = "-"
    // const commentaire = xss(req.body.commentaire)

    // console.log(req.body);

    //VALIDATION DES DONNEES RECUES
    if(!id){
        return res.status(400).json({ message: 'Parametre(s) manquant(s)' })
    }

    try {
        //RECUPERATION
        const contrat = await Contrat.findByPk(id)       
        const user = await User.findByPk(req.reqUserId)       
        if(contrat === null){return res.status(404).json({message: 'Contrat introuvable'})}

        //MISE A JOUR
        await Contrat.update({statut: 'Approuvé', commentaire: commentaire, updatedBy: req.reqUserId}, {where: {id: id}})
        
        //NOTIF TO ALL MIC 
        const transporteur = await Transporteur.findByPk(contrat.transporteur_id)
        const marketer = await Marketer.findByPk(contrat.marketer_id)
        mailerCtrl.mailAllUsersOfAType('MIC', `Contrat avec ${transporteur.nom} a été approuvé`, `Le ${user.type} ${user.name}, a approuvé le contrat de transport entre les structures ${marketer.nom} et ${transporteur.nom}.`)
        notifCtrl.notifyAllUsersOfAType('MIC', `Contrat avec ${transporteur.nom} a été approuvé`, `Le ${user.type} ${user.name}, a approuvé le contrat de transport entre les structures ${marketer.nom} et ${transporteur.nom}.`)

        //NOTIF TO MARKETER
        const marketerUsers = await User.findAll({where: {marketer_id: contrat.marketer_id}})
        for (const marketerUser of marketerUsers) {
            if(marketerUser.type !== 'Station'){
                mailerCtrl.mailSingle(marketerUser.reqUserId, `Contrat avec ${transporteur.nom} a été approuvé`, `Votre contrat avec la structure de transport ${transporteur.nom} a été approuvé. Vous pouvez donc choisir ses camion lors de création de vos bons de livraisons.`)
                notifCtrl.notifySingle(marketerUser.reqUserId, `Contrat avec ${transporteur.nom} a été approuvé`, `Votre contrat avec la structure de transport ${transporteur.nom} a été approuvé. Vous pouvez donc choisir ses camion lors de création de vos bons de livraisons.`)
            }
        }
    //     const view =  `
    //     <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">
    //     <div style="padding: 20px; background: #eeeeee; margin-bottom: 50px;">
    //         <h3 style="color:#555555; text-align: center;">REPUBLIQUE DU BENIN</h3>
    //         <div style="height: 8px; width: 300px; background-color: rgb(0, 133, 89); border-radius: 5px; margin: auto;">
    //             <div style="height: 8px; width: 150px; background-color: rgb(229, 48, 9); border-radius: 0 5px 5px 0; margin: 0 0 0 auto; padding:0;">
    //                 <div style="height: 4px; width: 100%; background-color: rgb(255, 212, 0); border-radius: 0 5px 0 0;"></div>
    //             </div>
    //         </div>
    //         <h4 style="color:#555555; text-align: center;">Ministère de l'Industrie et du Commerce</h4>
    //     </div>
    //     <div>
    //         <div style="text-align: center; width:400px; margin:auto;">
    //             <h1 style="color:rgb(0, 133, 89);">SyGeQ ALERT!</h1>
    //             <p style="font-size: 18px; font-weight:600; letter-spacing:1px; color:#555555;">Madame, Monsieur,</p>
    //             <p style="font-size: 18px; font-weight:600; letter-spacing:1px; color:#555555;"> Le contrat entre ${transporteur.nom} et ${marketer.nom}  a bien été approuvé .</p>
    //         </div>
    //     </div>
    //     <div style="padding: 20px; background: #eeeeee; margin-top: 50px; text-align: center;">
    //         <b>&copy; ${new Date().getFullYear()} | SyGeQ BJ | 3DT | REEXOM</b>
    //     </div>
    //   </div>
    //     `;
        //  console.log(view);
        // return res.send(view);
        
    } catch (err) {
        // console.log(err);
        next(err)
    }
}

exports.reject = async (req, res, next) => {
    //const id = parseInt(req.params.id)
    const id = decodeContratid(req, res, next)
    const commentaire = xss(req.body.commentaire)

    // console.log(req.body);

    //VALIDATION DES DONNEES RECUES
    if(!id || !commentaire){
        return res.status(400).json({ message: 'Parametre(s) ou donnée(s) manquant(s)' })
    }

    try {
        //RECUPERATION
        const contrat = await Contrat.findByPk(id)       
        const user = await User.findByPk(req.reqUserId)       
        if(contrat === null){return res.status(404).json({message: 'Contrat introuvable'})}

        //MISE A JOUR
        await Contrat.update({statut: 'Rejeté', commentaire: commentaire, updatedBy: req.reqUserId}, {where: {id: id}})

        //NOTIF TO ALL MIC 
        const transporteur = await Transporteur.findByPk(contrat.transporteur_id)
        const marketer = await Marketer.findByPk(contrat.marketer_id)
        mailerCtrl.mailAllUsersOfAType('MIC', `Contrat avec ${transporteur.nom} a été rejeté`, `Le ${user.type} ${user.name}, a rejeté le contrat de transport entre les structures ${marketer.nom} et ${transporteur.nom}. Raison du rejet: ${commentaire}`)
        notifCtrl.notifyAllUsersOfAType('MIC', `Contrat avec ${transporteur.nom} a été rejeté`, `Le ${user.type} ${user.name}, a rejeté le contrat de transport entre les structures ${marketer.nom} et ${transporteur.nom}. Raison du rejet: ${commentaire}`)

        //NOTIF TO MARKETER
        const marketerUsers = await User.findAll({where: {marketer_id: contrat.marketer_id}})
        for (const marketerUser of marketerUsers) {
            if(marketerUser.type !== 'Station'){
                mailerCtrl.mailSingle(marketerUser.reqUserId, `Contrat avec ${transporteur.nom} a été rejeté`, `Votre contrat avec la structure de transport ${transporteur.nom} a été rejeté. Raison du rejet: ${commentaire}`)
                notifCtrl.notifySingle(marketerUser.reqUserId, `Contrat avec ${transporteur.nom} a été rejeté`, `Votre contrat avec la structure de transport ${transporteur.nom} a été rejeté. Raison du rejet: ${commentaire}`)
            }
        }
         
        return res.status(204).json({})
        
    } catch (err) {
        // console.log(err);
        next(err)
    }
}
