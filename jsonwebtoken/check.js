/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const jwt = require('jsonwebtoken')
const {User} = require('../models')

/*************************/
/*** EXTRACTION DU TOKEN */
const extractBearer = authorization => {
    if (typeof authorization !== 'string') {
        return false
    }
    //ISOLATION DU TOKEN
    const matches = authorization.match(/(bearer)\s+(\S+)/i)

    return matches && matches[2]
}

/**********************************************/
/*** VERIFICATION SI UTILISATEUR PROPRIETAIRE */
exports.ifValideTokenResetPassword = (req, res, next) => {

    const token = req.headers.authorization && extractBearer(req.headers.authorization)

    if (!token) {
        return res.status(401).json({ message: 'Le lien a expiré veuillez réessayer.' })
    }

    // Vérifier la validité du token
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
            return res.status(401).json({ message: 'Token erroné ou expiré' })
        }
        

        req.user = {id:decodedToken.id,email:decodedToken.email}

        next()
    })
}
exports.ifUAOwner = (req, res, next) => {

    const token = req.headers.authorization && extractBearer(req.headers.authorization)

    if (!token) {
        return res.status(401).json({ message: 'Veuillez vous authentifier' })
    }

    // Vérifier la validité du token
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
            return res.status(401).json({ message: 'Token erroné ou expiré' })
        }
        else if (parseInt(decodedToken.id) !== parseInt(req.params.id)) {
            return res.status(401).json({ message: 'Accréditation incorrecte, opération non autorisée' })
        }

        req.reqUserId = decodedToken.id
        req.reqUserType = decodedToken.type
        req.reqUserRole = decodedToken.role
        next()
    })
}

/***************************************/
/*** VERIFICATION SI PEUT GERER CAMION */
exports.ifCanManageCamion = (req, res, next) => {

    const token = req.headers.authorization && extractBearer(req.headers.authorization)
    if (!token) {
        return res.status(401).json({ message: 'Veuillez vous authentifier' })
    }

    //VALIDITE DU TOKEN
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
            return res.status(401).json({ message: 'Token erroné ou expiré' })
        }
        else if (
            decodedToken.type !== 'MIC' &&
            decodedToken.type !== 'DPB' &&
            decodedToken.type !== 'Marketer' &&
            decodedToken.type !== 'Transporteur'
        ) {
            return res.status(401).json({ message: 'Accréditation incorrecte, opération non autorisée' })
        }

        req.reqUserId = decodedToken.id
        req.reqUserType = decodedToken.type
        req.reqUserRole = decodedToken.role
        req.marketerId = decodedToken?.marketer_id
        next()
    })
}

/***********************************/
/*** VERIFICATION SI PEUT GERER BL */
exports.ifCanManageBL = (req, res, next) => {
    const token = req.headers.authorization && extractBearer(req.headers.authorization)
    if (!token) {
        return res.status(401).json({ message: 'Veuillez vous authentifier' })
    }

    //VALIDITE DU TOKEN
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
            return res.status(401).json({ message: 'Token erroné ou expiré' })
        }
        else if (
            // decodedToken.type !== 'MIC' &&
            decodedToken.type !== 'Marketer' &&
            decodedToken.type !== 'Depot' &&
            decodedToken.type !== 'Station' &&
            decodedToken.type !== 'DPB'
        ) {
            return res.status(401).json(
                { message: 'Accréditation incorrecte, opération non autorisée' })
        }

        req.reqUserId = decodedToken.id
        req.reqUserType = decodedToken.type
        req.reqUserRole = decodedToken.role
        next()
    })
}

/**********************************************/
/*** VERIFICATION SI PEUT GERER LES MARKETERS */
exports.ifCanManageMarketers = (req, res, next) => {

    const token = req.headers.authorization && extractBearer(req.headers.authorization)
    if (!token) {
        return res.status(401).json({ message: 'Veuillez vous authentifier' })
    }

    //VALIDITE DU TOKEN
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
            return res.status(401).json({ message: 'Token erroné ou expiré' })
        }
        else if (
            decodedToken.type !== 'MIC' 
        ) {
            return res.status(401).json({ message: 'Accréditation incorrecte, opération non autorisée' })
        }

        req.reqUserId = decodedToken.id
        req.reqUserType = decodedToken.type
        req.reqUserRole = decodedToken.role
        next()
    })
}

exports.ifMarketerCanAddStation = (req, res, next) => {

    const token = req.headers.authorization && extractBearer(req.headers.authorization)
    if (!token) {
        return res.status(401).json({ message: 'Veuillez vous authentifier' })
    }

    //VALIDITE DU TOKEN
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
            return res.status(401).json({ message: 'Token erroné ou expiré' })
        }
        else if (
            decodedToken.type !== 'Marketer'
        ) {
            return res.status(401).json({ message: 'Accréditation incorrecte, opération non autorisée' })
        }
        else if (
            decodedToken.role !== 'Super Admin' &&
            decodedToken.role !== 'Admin'
        ) {
            return res.status(401).json({ message: 'Accréditation incorrecte, opération non autorisée' })
        }

        req.reqUserId = decodedToken.id
        req.reqUserType = decodedToken.type
        req.reqUserRole = decodedToken.role
        next()
    })
}

/*************************************/
/*** VERIFICATION SI MARKETER OU MIC */
exports.ifMarketerOrMIC = (req, res, next) => {

    const token = req.headers.authorization && extractBearer(req.headers.authorization)
    if (!token) {
        return res.status(401).json({ message: 'Veuillez vous authentifier' })
    }

    //VALIDITE DU TOKEN
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
            return res.status(401).json({ message: 'Token erroné ou expiré' })
        }
        else if (
            decodedToken.type !== 'MIC' &&
            decodedToken.type !== 'Marketer'
        ) {
            return res.status(401).json({ message: 'Accréditation incorrecte, opération non autorisée' })
        }

        req.reqUserId = decodedToken.id
        req.reqUserType = decodedToken.type
        req.reqUserRole = decodedToken.role
        next()
    })
}

/*******************************************/
/*** VERIFICATION SI MARKETER OU MIC OU DPB*/
exports.ifMarketerOrMICOrDPB = (req, res, next) => {

    const token = req.headers.authorization && extractBearer(req.headers.authorization)
    if (!token) {
        return res.status(401).json({ message: 'Veuillez vous authentifier' })
    }

    //VALIDITE DU TOKEN
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
            return res.status(401).json({ message: 'Token erroné ou expiré' })
        }
        else if (
            decodedToken.type !== 'MIC' &&
            decodedToken.type !== 'DPB' &&
            decodedToken.type !== 'Marketer'
        ) {
            return res.status(401).json({ message: 'Accréditation incorrecte, opération non autorisée' })
        }

        req.reqUserId = decodedToken.id
        req.reqUserType = decodedToken.type
        req.reqUserRole = decodedToken.role
        next()
    })
}

/*************************************/
/*** VERIFICATION SI MARKETER OU MIC */
exports.ifStationOrMarketerOrMIC = (req, res, next) => {

    const token = req.headers.authorization && extractBearer(req.headers.authorization)
    if (!token) {
        return res.status(401).json({ message: 'Veuillez vous authentifier' })
    }

    //VALIDITE DU TOKEN
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
            return res.status(401).json({ message: 'Token erroné ou expiré' })
        }
        else if (
            decodedToken.type !== 'Station' &&
            decodedToken.type !== 'Marketer' &&
            decodedToken.type !== 'MIC'
        ) {
            return res.status(401).json({ message: 'Accréditation incorrecte, opération non autorisée' })
        }

        req.reqUserId = decodedToken.id
        req.reqUserType = decodedToken.type
        req.reqUserRole = decodedToken.role
        next()
    })
}

/***************************/
/*** VERIFICATION SI UTILISATEUR */
exports.ifUser = (req, res, next) => {
    const token = req.headers.authorization && extractBearer(req.headers.authorization);
    
    if (!token) {
        
        return res.status(401).json({ message: 'Veuillez vous authentifier' });
    }
    
    //VALIDITE DU TOKEN
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
            return res.status(401).json({ message: 'Token erroné ou expiré' })
        }
        req.reqUserId = decodedToken.id;
        req.reqUserType = decodedToken.type;
        req.reqUserRole = decodedToken.role;
        req.identite = decodedToken.marketer_identity;
        next()
    });
}
exports.permissionUser = async (req, res, next) => {
    const token = req.headers.authorization && extractBearer(req.headers.authorization);
    
    if (!token) {
        
        return res.status(401).json({ message: 'Veuillez vous authentifier' });
    }
    
    //VALIDITE DU TOKEN
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
            return res.status(401).json({ message: 'Token erroné ou expiré' })
        }
        req.reqUserId = decodedToken.id;
        req.reqUserType = decodedToken.type;
        req.reqUserRole = decodedToken.role;
        req.marketerId = decodedToken.marketer_id;
        req.depotId = decodedToken.depot_id;
        req.stationId = decodedToken.station_id;
        req.b2bId = decodedToken.b2b_id;
        req.identite = decodedToken.marketer_identity;
        // next()
    });
    
    if (req.params.id==req.reqUserId) {
        next()
    }else{

        const msg = "Vous n'êtes pas autorisé à avoir les informations de cet utilisateur.";
        const user = await User.findByPk(req.params.id);
        if (req.reqUserType=="Marketer" ) {
                if (req.reqUserRole=='Admin'|| req.reqUserRole=='Super Admin') {
                next()
            }
            if (req.reqUserRole=="User" && user.id==req.params.id) {
                next()
            }
        }
        if (req.reqUserType=="DPB" && user.type=='DPB') {
               if (req.reqUserRole=='Admin'|| req.reqUserRole=='Super Admin') {
                next()
            }
            if (req.reqUserRole=="User" && user.id==req.params.id) {
                next()
            }
        }
        if (req.reqUserType=="Depot" ) {
                if (req.reqUserRole=='Admin'|| req.reqUserRole=='Super Admin') {
                next()
            }
            if (req.reqUserRole=="User" && user.id==req.params.id) {
                next()
            }
        }
        if (req.reqUserType=="MIC") {
            if (req.reqUserRole=='Admin'|| req.reqUserRole=='Super Admin') {
                next()
            }
            if (req.reqUserRole=="User" && user.id==req.params.id) {
                next()
            }
        }
        if (req.reqUserType=="Station" ) {
                if (req.reqUserRole=='Admin'|| req.reqUserRole=='Super Admin') {
                next()
            }
            if (req.reqUserRole=="User" && user.id==req.params.id) {
                next()
            }
        }
        if (req.reqUserType=="B2B" ) {
                if (req.reqUserRole=='Admin'|| req.reqUserRole=='Super Admin') {
                next()
            }
            if (req.reqUserRole=="User" && user.id==req.params.id) {
                next()
            }
        }
    }
}

/***************************/
/*** VERIFICATION SI MIC */
exports.ifMIC = (req, res, next) => {

    const token = req.headers.authorization && extractBearer(req.headers.authorization)
    if (!token) {
        return res.status(401).json({ message: 'Veuillez vous authentifier' })
    }

    //VALIDITE DU TOKEN
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
            return res.status(401).json({ message: 'Token erroné ou expiré' })
        }
        else if (decodedToken.type !== 'MIC') {
            return res.status(401).json({ message: 'Accréditation incorrecte, opération non autorisée' })
        }

        req.reqUserId = decodedToken.id
        req.reqUserType = decodedToken.type
        req.reqUserRole = decodedToken.role
        req.identite = decodedToken.marketer_identity;
        next()
    })
}

/***************************/
/*** VERIFICATION SI DPB */
exports.ifDPB = (req, res, next) => {

    const token = req.headers.authorization && extractBearer(req.headers.authorization)
    if (!token) {
        return res.status(401).json({ message: 'Veuillez vous authentifier' })
    }

    //VALIDITE DU TOKEN
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
            return res.status(401).json({ message: 'Token erroné ou expiré' })
        }
        else if (decodedToken.type !== 'DPB') {
            return res.status(401).json({ message: 'Accréditation incorrecte, opération non autorisée' })
        }

        req.reqUserId = decodedToken.id
        req.reqUserType = decodedToken.type
        req.reqUserRole = decodedToken.role
        req.identite = decodedToken.marketer_identity;
        next()
    })
}
exports.ifDPBOrDepot = (req, res, next) => {

    const token = req.headers.authorization && extractBearer(req.headers.authorization)
    if (!token) {
        return res.status(401).json({ message: 'Veuillez vous authentifier' })
    }

    //VALIDITE DU TOKEN
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
            return res.status(401).json({ message: 'Token erroné ou expiré' })
        }
        else if (decodedToken.type ==='DPB' || decodedToken.type==='Depot'){

            req.reqUserId = decodedToken.id
            req.reqUserType = decodedToken.type
            req.reqUserRole = decodedToken.role
            req.identite = decodedToken.marketer_identity;
            next()
        }else{
            
            return res.status(401).json({ message: 'Accréditation incorrecte, opération non autorisée' })
        
        }

    })
}

/***************************/
/*** VERIFICATION SI DEPOT */
exports.ifDepot = (req, res, next) => {

    const token = req.headers.authorization && extractBearer(req.headers.authorization)
    if (!token) {
        return res.status(401).json({ message: 'Veuillez vous authentifier' })
    }

    //VALIDITE DU TOKEN
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
            return res.status(401).json({ message: 'Token erroné ou expiré' })
        }
        else if (decodedToken.type !== 'Depot') {
            return res.status(401).json({ message: 'Accréditation incorrecte, opération non autorisée' })
        }

        req.reqUserId = decodedToken.id
        req.reqUserType = decodedToken.type
        req.reqUserRole = decodedToken.role
        req.identite = decodedToken.marketer_identity;
        next()
    })
}

/***************************/
/*** VERIFICATION SI MARKETER */
exports.ifMarketer = (req, res, next) => {

    const token = req.headers.authorization && extractBearer(req.headers.authorization)
    if (!token) {
        return res.status(401).json({ message: 'Veuillez vous authentifier' })
    }

    //VALIDITE DU TOKEN
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
            return res.status(401).json({ message: 'Token erroné ou expiré' })
        }
        else if (decodedToken.type !== 'Marketer') {
            return res.status(401).json({ message: 'Accréditation incorrecte, opération non autorisée' })
        }

        req.reqUserId = decodedToken.id
        req.reqUserType = decodedToken.type
        req.reqUserRole = decodedToken.role
        req.identite = decodedToken.marketer_identity;
        next()
    })
}

/*****************************************/
/*** VERIFICATION SI MARKETER SUPER ADMIN*/
exports.ifMarketerSuperAdmin = (req, res, next) => {

    const token = req.headers.authorization && extractBearer(req.headers.authorization)
    if (!token) {
        return res.status(401).json({ message: 'Veuillez vous authentifier' })
    }

    //VALIDITE DU TOKEN
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
            return res.status(401).json({ message: 'Token erroné ou expiré' })
        }
        else if (decodedToken.type !== 'Marketer' || decodedToken.role !== 'Super Admin') {
            return res.status(401).json({ message: 'Accréditation incorrecte, opération non autorisée' })
        }

        req.reqUserId = decodedToken.id
        req.reqUserType = decodedToken.type
        req.reqUserRole = decodedToken.role
        req.identite = decodedToken.marketer_identity;
        next()
    })
}

/***********************************/
/*** VERIFICATION SI MARKETER ADMIN*/
exports.ifMarketerAdmin = (req, res, next) => {

    const token = req.headers.authorization && extractBearer(req.headers.authorization)
    if (!token) {
        return res.status(401).json({ message: 'Veuillez vous authentifier' })
    }

    //VALIDITE DU TOKEN
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
            return res.status(401).json({ message: 'Token erroné ou expiré' })
        }
        else if (decodedToken.type !== 'Marketer' || decodedToken.role !== 'Admin') {
            return res.status(401).json({ message: 'Accréditation incorrecte, opération non autorisée' })
        }

        req.reqUserId = decodedToken.id
        req.reqUserType = decodedToken.type
        req.reqUserRole = decodedToken.role
        req.identite = decodedToken.marketer_identity;
        next()
    })
}

/*****************************************/
/*** VERIFICATION SI DEPOT SUPER ADMIN*/
exports.ifDepotSuperAdmin = (req, res, next) => {

    const token = req.headers.authorization && extractBearer(req.headers.authorization)
    if (!token) {
        return res.status(401).json({ message: 'Veuillez vous authentifier' })
    }

    //VALIDITE DU TOKEN
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
            return res.status(401).json({ message: 'Token erroné ou expiré' })
        }
        else if (decodedToken.type !== 'Depot' || decodedToken.role !== 'Super Admin') {
            return res.status(401).json({ message: 'Accréditation incorrecte, opération non autorisée' })
        }

        req.reqUserId = decodedToken.id
        req.reqUserType = decodedToken.type
        req.reqUserRole = decodedToken.role
        req.identite = decodedToken.marketer_identity;
        next()
    })
}

/***********************************/
/*** VERIFICATION SI DEPOT ADMIN*/
exports.ifDepotAdmin = (req, res, next) => {

    const token = req.headers.authorization && extractBearer(req.headers.authorization)
    if (!token) {
        return res.status(401).json({ message: 'Veuillez vous authentifier' })
    }

    //VALIDITE DU TOKEN
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
            return res.status(401).json({ message: 'Token erroné ou expiré' })
        }
        else if (decodedToken.type !== 'Depot' || decodedToken.role !== 'Admin') {
            return res.status(401).json({ message: 'Accréditation incorrecte, opération non autorisée' })
        }

        req.reqUserId = decodedToken.id
        req.reqUserType = decodedToken.type
        req.reqUserRole = decodedToken.role
        req.identite = decodedToken.marketer_identity;
        next()
    })
}

/*****************************************/
/*** VERIFICATION SI MARKETER PROPRIETAIRE OU SUPER ADMIN*/
exports.ifThisMarketerCanEditTheRequestedAccount = (req, res, next) => {

    const token = req.headers.authorization && extractBearer(req.headers.authorization)
    if (!token) {
        return res.status(401).json({ message: 'Veuillez vous authentifier' })
    }

    //VALIDITE DU TOKEN
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
            return res.status(401).json({ message: 'Token erroné ou expiré' })
        }
        else if (decodedToken.type !== 'Marketer') {
            return res.status(401).json({ message: 'Accréditation incorrecte, opération non autorisée' })
        }
        else if (
            decodedToken.type === 'Marketer' &&
            decodedToken.role === 'User'
        ) {
            if (decodedToken.id != req.params.userId) {
                return res.status(401).json({ message: 'Vous n\'êtes pas autorisé à éditer ce compte.' })
            }
            else if (
                req.body.type || req.body.role
            ) {
                return res.status(401).json({ message: `Vous n'êtes pas autorisé à devenir ${req.body.type || ''} ${req.body.role || ''}.` })
            }
        }
        else if (
            decodedToken.type === 'Marketer' &&
            decodedToken.role === 'Admin'
        ) {
            if (decodedToken.id != req.params.userId) {
                return res.status(401).json({ message: 'Vous n\'êtes pas autorisé à éditer ce compte.' })
            }
            else if (
                req.body.type || req.body.role
            ) {
                return res.status(401).json({ message: `Vous n'êtes pas autorisé à devenir ${req.body.type || ''} ${req.body.role || ''}.` })
            }
        }

        req.reqUserId = decodedToken.id
        req.reqUserType = decodedToken.type
        req.reqUserRole = decodedToken.role
        req.identite = decodedToken.marketer_identity;
        next()
    })
}

/***************************/
/*** VERIFICATION SI STATION */
exports.ifStation = (req, res, next) => {

    const token = req.headers.authorization && extractBearer(req.headers.authorization)
    if (!token) {
        return res.status(401).json({ message: 'Veuillez vous authentifier' })
    }

    //VALIDITE DU TOKEN
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
            return res.status(401).json({ message: 'Token erroné ou expiré' })
        }
        else if (decodedToken.type !== 'Station' && decodedToken.type !== 'B2B') {
            return res.status(401).json({ message: 'Accréditation incorrecte, opération non autorisée' })
        }
        
        req.reqUserId = decodedToken.id
        req.reqUserType = decodedToken.type
        req.reqUserRole = decodedToken.role
        req.identite = decodedToken.marketer_identity;
        next()
    })
}

/***************************/
/*** VERIFICATION SI TRANSPORTEUR */
exports.ifTransporteur = (req, res, next) => {

    const token = req.headers.authorization && extractBearer(req.headers.authorization)
    if (!token) {
        return res.status(401).json({ message: 'Veuillez vous authentifier' })
    }

    //VALIDITE DU TOKEN
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
            return res.status(401).json({ message: 'Token erroné ou expiré' })
        }
        else if (decodedToken.type !== 'Transporteur') {
            return res.status(401).json({ message: 'Accréditation incorrecte, opération non autorisée' })
        }

        req.reqUserId = decodedToken.id
        req.reqUserType = decodedToken.type
        req.reqUserRole = decodedToken.role
        req.identite = decodedToken.marketer_identity;
        next()
    })
}
exports.ifIsMe = async(req, res, next) => {

    const token = req.headers.authorization && extractBearer(req.headers.authorization)
    if (!token) {
        return res.status(401).json({ message: 'Veuillez vous authentifier' })
    }

    //VALIDITE DU TOKEN
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
            return res.status(401).json({ message: 'Token erroné ou expiré' })
        }
        else if (decodedToken.type !== 'Transporteur') {
            return res.status(401).json({ message: 'Accréditation incorrecte, opération non autorisée' })
        }
        if(decodedToken.id!==req.params.id){
            return res.status(401).json({ message: 'Accréditation incorrecte, opération non autorisée' })
        }
        req.reqUserId = decodedToken.id
        req.reqUserType = decodedToken.type
        req.reqUserRole = decodedToken.role
        req.identite = decodedToken.marketer_identity;
        next()
    })
}
exports.mICAdminOrSuperAdmin = async (req, res, next) => {
    const token = req.headers.authorization && extractBearer(req.headers.authorization);
    
    if (!token) {
        
        return res.status(401).json({ message: 'Veuillez vous authentifier' });
    }
    
    //VALIDITE DU TOKEN
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
            return res.status(401).json({ message: 'Token erroné ou expiré' })
        }
        req.reqUserId = decodedToken.id;
        req.reqUserType = decodedToken.type;
        req.reqUserRole = decodedToken.role;
        req.marketerId = decodedToken.marketer_id;
        req.depotId = decodedToken.depot_id;
        req.stationId = decodedToken.station_id;
        req.identite = decodedToken.marketer_identity;
        // next()
    });
    if (req.reqUserRole==="Admin" || req.reqUserRole==="Super Admin") {
        next()
    }
    
}
exports.marketerAdminOrSuperAdmin = async (req, res, next) => {
    const token = req.headers.authorization && extractBearer(req.headers.authorization);
    
    if (!token) {
        
        return res.status(401).json({ message: 'Veuillez vous authentifier' });
    }
    
    //VALIDITE DU TOKEN
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
            return res.status(401).json({ message: 'Token erroné ou expiré' })
        }
        req.reqUserId = decodedToken.id;
        req.reqUserType = decodedToken.type;
        req.reqUserRole = decodedToken.role;
        req.marketerId = decodedToken.marketer_id;
        req.depotId = decodedToken.depot_id;
        req.stationId = decodedToken.station_id;
        req.identite = decodedToken.marketer_identity;
        // next()
    });
    if (req.reqUserRole==="Admin" || req.reqUserRole==="Super Admin") {
        next()
    }
    
}
exports.adminOrSuperAdmin = async (req, res, next) => {
    const token = req.headers.authorization && extractBearer(req.headers.authorization);
    
    if (!token) {
        
        return res.status(401).json({ message: 'Veuillez vous authentifier' });
    }
    
    //VALIDITE DU TOKEN
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
            return res.status(401).json({ message: 'Token erroné ou expiré' })
        }
        req.reqUserId = decodedToken.id;
        req.reqUserType = decodedToken.type;
        req.reqUserRole = decodedToken.role;
        req.marketerId = decodedToken.marketer_id;
        req.depotId = decodedToken.depot_id;
        req.stationId = decodedToken.station_id;
        req.identite = decodedToken.marketer_identity;
        // next()
    });
    if (req.reqUserRole ==="Admin" || req.reqUserRole==="Super Admin") {
        next()
    }else{
        return res.status(401).json({ message: "Vous n'êtes pas autorisé à effectuer cette action." })
    }
    
    
    
}
exports.ifMicDPBOrDepot = (req, res, next) => {

    const token = req.headers.authorization && extractBearer(req.headers.authorization)
    if (!token) {
        return res.status(401).json({ message: 'Veuillez vous authentifier' })
    }

    //VALIDITE DU TOKEN
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
            return res.status(401).json({ message: 'Token erroné ou expiré' })
        }
        else if (decodedToken.type ==='DPB' || decodedToken.type==='Depot' || decodedToken.type ==='MIC'){

            req.reqUserId = decodedToken.id
            req.reqUserType = decodedToken.type
            req.reqUserRole = decodedToken.role
            req.identite = decodedToken.marketer_identity;
            next()
        }else{
            
            return res.status(401).json({ message: 'Accréditation incorrecte, opération non autorisée' })
        
        }

    })
}
exports.ifMicorDPBorDepotOrMatketerGroup = async (req, res, next) => {
    const token = req.headers.authorization && extractBearer(req.headers.authorization);
    if (!token) {
        return res.status(401).json({ message: 'Veuillez vous authentifier' });
    }
    //VALIDITE DU TOKEN
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
            return res.status(401).json({ message: 'Token erroné ou expiré' })
        }
        req.reqUserId = decodedToken.id;
        req.reqUserType = decodedToken.type;
        req.reqUserRole = decodedToken.role;
        req.marketerId = decodedToken.marketer_id;
        req.depotId = decodedToken.depot_id;
        req.stationId = decodedToken.station_id;
        req.identite = decodedToken.marketer_identity;
        // next()
    });
    if (req.params.id==req.reqUserId) {
        next()
    }
    const msg = "Vous n'êtes pas autorisé à avoir les information de cet utilisateur.";

    if (req.reqUserType=="Marketer") {
        const user = await User.findByPk(req.params.id);
        if (user && user.marketer_id==req.marketerId) {
            next()
        }
        return res.status(401).json({message: "Vous n'êtes pas autorisé à avoir les information de cet utilisateur."});
    }
    if (req.reqUserType=="Depot" || req.reqUserType=="MIC" ||req.reqUserType=="DPB") {
            next()
    }
    
}

