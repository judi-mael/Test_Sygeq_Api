const path = require('path')
require('dotenv').config({path: path.join(__dirname, '.env')})
const logger = require('./logger');
/***********************************/
/**IMPORT DES MODULES NECCESSAIRES */
const express = require('express')
const cors = require('cors')
const fileUpload = require('express-fileupload');
const ecCtrl = require('./controllers/system/expChecks')
const helmet = require('helmet');
const { body, validationResult } = require("express-validator")




const app = express()
app.use(express.json({limit: '50mb'}))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))
//middleware globale de securisation des entrées
const sanitizeInput = (req, res, next) => {
    
    const sanitize = (obj) => {
        if (typeof obj === "string") {
            return obj.replace(/<script>|<\/script>|javascript:/gi, ""); // Supprime les scripts
        } 
        else if (typeof obj === "object" && obj !== null) {
            for (let key in obj) {
                obj[key] = sanitize(obj[key]); // Nettoie chaque champ récursivement
            }
        }
        return obj;
    };

    req.body = sanitize(req.body);
    req.query = sanitize(req.query);
    req.params = sanitize(req.params);

    next();
};
app.use(sanitizeInput);


//Middleware pour Éviter les Injections SQL
// const sqlSanitizer = (req, res, next) => {
//     const sanitize = (value) => {
//         if (typeof value === "string") {
//             return value.replace(/['"%;()]/g, ""); // Supprime les caractères dangereux
//         }
//         return value;
//     };

//     req.body = JSON.parse(JSON.stringify(req.body), (key, value) => sanitize(value));
//     req.query = JSON.parse(JSON.stringify(req.query), (key, value) => sanitize(value));

//     next();
// };
const sqlSanitizer = (req, res, next) => {
    const sanitize = (value) => {
        if (typeof value === "string") {
            return value.replace(/['"%;()]/g, ""); // Supprime les caractères dangereux
        }
        return value;
    };

    if (req.body && typeof req.body === "object") {
        req.body = JSON.parse(JSON.stringify(req.body), (key, value) => sanitize(value));
    }

    if (req.query && typeof req.query === "object") {
        req.query = JSON.parse(JSON.stringify(req.query), (key, value) => sanitize(value));
    }

    next();
};

app.use(sqlSanitizer);
/*** INITIALISATION DE L'API */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],  // Bloque toutes les sources externes
      scriptSrc: ["'none'"],   // Interdit tout script
      objectSrc: ["'none'"],   // Bloque les fichiers Flash, etc.
      baseUri: ["'none'"],     // Empêche les injections via <base>
      imgSrc: ["'self'", "data:"], // Autorise les images locales et en base64
      mediaSrc: ["'none'"], // AuBloque les vidéos/audio locaux
      frameSrc: ["'none'"], // Empêche l'intégration via <iframe> (protection contre le clickjacking)
      connectSrc: ["'none'"], // bloque les requêtes AJAX 
      upgradeInsecureRequests: [], // Force la mise à niveau des requêtes HTTP vers HTTPS
    }
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }, 
  frameguard: { action: 'DENY' },
  permissionsPolicy: {
    features: {
      geolocation: ["'self'"], // Bloque l'accès à la géolocalisation
      microphone: ["'none'"], // Bloque l'accès au micro
      camera: ["'self'"], // Bloque l'accès à la caméra
      fullscreen: ["'self'"], // Autorise uniquement le plein écran pour le même domaine
      payment: ["'none'"] // Désactive les paiements via l'API Payment Request
    }
  }
}));

app.use(cors({
    // origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: 'Origin, X-Requested-Width, x-access-token, role, Content, Accept, Content-Type, Authorization'
}))
app.use((err, req, res, next) => {
  logger.error(`Erreur: ${err.message} - URL: ${req.originalUrl} - Méthode: ${req.method}`);
  console.log("==========================",err)
  res.status(err.status || 500).json({ error: err.message });
});


//middleware de validation pour valider et assainir toutes les entrées dynamiquement 
const validateInput = (req, res, next) => {

    if (["GET", "DELETE"].includes(req.method)) {
        return next();
    }
    // Vérifier si req.body est défini et est un objet
    if (!req.body || typeof req.body !== "object") {
        return res.status(400).json({ error: "Requête invalide : body manquant ou incorrect" });
    }
    const rules = [];

    // Vérifie chaque champ de `req.body`
    Object.keys(req.body).forEach((key) => {
        rules.push(body(key).trim().escape());
    });

    // Appliquer les règles et vérifier les erreurs
    Promise.all(rules.map((rule) => rule.run(req))).then(() => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    });
};
// app.use(validateInput);

app.use(fileUpload())

/***********************************/
/*** IMPORT DES MODULES DE ROUTAGE */
const authRoutes = require('./routes/auth')
const b2bRoutes = require('./routes/b2bs')
const bilanRoutes = require('./routes/bilans')
const btbilanRoutes = require('./routes/bilansBT')
const bcRoutes = require('./routes/bonChargements')
const blRoutes = require('./routes/bonLivraisons')
const camionRoutes = require('./routes/camions')
const compartimentRoutes = require('./routes/compartiments')
const contratRoutes = require('./routes/contrats')
const depotRoutes = require('./routes/depots')
const dcRoutes = require('./routes/detailsChargements')
const dlRoutes = require('./routes/detailsLivraisons')
const dvRoutes = require('./routes/detailsVilles')
const fileRoutes = require('./routes/files')
const htRoutes = require('./routes/historiqueTarifs')
const loginRoutes = require('./routes/logins')
const marketerRoutes = require('./routes/marketers')
const notifRoutes = require('./routes/notifications')
const produitRoutes = require('./routes/produits')
const stationRoutes = require('./routes/stations')
const structureRoutes = require('./routes/structures')
const tfRoutes = require('./routes/tauxForfaitaires')
const ttkRoutes = require('./routes/tauxTks')
const trRoutes = require('./routes/transporteurs')
const userRoutes = require('./routes/users')
const villeRoutes = require('./routes/villes');
const version  = require('./routes/version')
const btRoutes  = require('./routes/bonTransfere');
const { log } = require('console');


/******************************/
/*** MISE EN PLACE DU ROUTAGE */
// app.get('/', ecCtrl.isSystemActive, (req, res) => res.json({message: 'API MIC en ligne. Tout est OK!'}))


app.use('/b2bs', b2bRoutes)
app.use('/auth', authRoutes)
app.use('/bilans', bilanRoutes)
app.use('/bilans_bt', btbilanRoutes)
app.use('/bcs', bcRoutes)
app.use('/bls', blRoutes)
app.use('/bts', btRoutes)
app.use('/camions', camionRoutes)
app.use('/compartiments', compartimentRoutes)
app.use('/contrats', contratRoutes)
app.use('/depots', depotRoutes)
app.use('/dcs', dcRoutes)
app.use('/dls', dlRoutes)
app.use('/dvs', dvRoutes)
app.use('/files', fileRoutes)
app.use('/hts', htRoutes)
app.use('/logs', loginRoutes)
app.use('/marketers', marketerRoutes)
app.use('/notifications', notifRoutes)
app.use('/produits', produitRoutes)
app.use('/stations', stationRoutes)
app.use('/structures', structureRoutes)
app.use('/ttks', ttkRoutes)
app.use('/tfs', tfRoutes)
app.use('/trs', trRoutes)
app.use('/users', userRoutes)
app.use('/villes', villeRoutes)
app.use('/version', version)
// app.use('/test', (req, res) => res.json({message: 'Ressource non implémentée'}))

app.use('/public', express.static('public'))

// app.use((req, res) => res.status(501).json({message: 'Ressource non implémentée'}));
// app.use('*', (req, res) => res.status(501).json({message: 'Ressource non implémentée'}))

// app.get('/', (req, res) => res.json({message: 'API MIC en ligne. Tout est OK!'}))
app.use((err, req, res, next) => {
    const userIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
    logger.error(`Erreur: ${err.message} - URL: ${req.originalUrl} - Méthode: ${req.method} - IP Utilisateur: ${userIp}`);
    res.status(500).json({ message: "Une erreur s'est produite veuillez réessayer" })
});
// launchTimeOut()

/* SCRIPT DE MAINTENANCE AUTO */
function launchTimeOut() {
    setTimeout(() => {
        checkIfCanMaint();
    }, 10*60*1000);
}

async function checkIfCanMaint() {

    try {

        const maintDate = (await CheckDate.findAll())[0]
        const cDate = new Date()
        console.log('maintDate.checkUpDate : ', maintDate.checkUpDate);
        if (maintDate.checkUpDate >= cDate) {
            console.log('Not yet...');
            return launchTimeOut() 
        }
        
        ecCtrl.cleanCamions;
        ecCtrl.cleanDepots;
        ecCtrl.cleanMarketers;
        ecCtrl.cleanTransporteurs;
        console.log('System cleaning done at ', cDate)
        // await CheckDate.update({checkUpDate: mdYear+'-'+mdMonth+''+mdDate+' 01:00:00'}, {where: {id: maintDate.id}})
        
        return launchTimeOut()
        
    } catch (err) {
        // console.log(err);
        console.log('Failed checking if can maintain server at: ', new Date());
        return launchTimeOut()
    }

}

var date = new Date();

// add a day

console.log('Date: ', date);
console.log('Date + 1 day: ', date.setDate(date.getDate() + 1));

bjCities = "Abomey, Abomey-Calavi, Adja-Ouèrè, Adjarra, Adjohoun, Agbangnizoun, Aguégués, Allada, Aplahoué, Athiémé, Avrankou, Banikoara, Bantè, Bassila, Bembèrèkè, Bohicon, Bonou, Bopa, Boukombé, Cobly, Comè, Copargo, Cotonou, Covè, Dangbo, Dassa-Zoumè, Djakotomey, Djidja, Djougou, Dogbo, Glazoué, Gogounou, Grand-Popo, Houéyogbé, Ifangni, Kalalé, Kandi, Karimama, Kérou, Kétou,  Klouékanmè, Kouandé, Kpomassè, Lalo, Lokossa, Malanville, Matéri, Missérété, N’dali, Natitingou, Nikki, Ouaké, Ouèssè, Ouidah, Ouinhi, Parakou, Pehunco, Pèrèrè, Pobè, Porto-Novo, Sakété, Savalou, Savè, Ségbana, Sèmè-Podji, Sinendé, Sô-Ava, Tanguiéta, Tchaourou, Toffo, Tori-Bossito, Toucountouna, Toviklin, Zagnanado, Za-Kpota, Zè, Zogbodomey"
cities = bjCities.split(', ')

const PORT = process.env.PORT || 4501;

app.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
});