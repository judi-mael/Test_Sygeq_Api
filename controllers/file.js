/************************************/
/*** IMPORT DES MODULES NECESSAIRES */
const util = require('util')

const path = require('path')
let fs = require('fs');

/*****************************/
/*** GESTION DE LA RESSOURCE */

exports.addPicture = async (req, res, next) => {

    const file = req.files.file;
    const allowedExtensions = /png|jpeg|jpg|gif/
    
    try {
        //SINGLE FILE CHECK
        const fileName = file.name;
        const size = file.size;
        const extension = path.extname(fileName)

        if(!file){
            return res.status(400).json({message: 'Donnée manquante'})
        }
        else if(!allowedExtensions.test(extension)){
            return res.status(401).json({message: 'Extension non supportée'})
        }
        else if(size > 7000000){
            return res.status(401).json({message: 'La taille du fichier doit être 7MB maximum'})
        }

        const md5 = file.md5
        const URL = "/uploads/" + md5 + extension
        await util.promisify(file.mv)("./public" + URL)
        
        return res.json(URL)

    } catch (err) {
        // console.log(err);
        next(err)
    }

}

exports.addDocument = async (req, res, next) => {

    const file = req.files.file;
    const allowedExtensions = /pdf/
    
    try {
        //SINGLE FILE CHECK
        const fileName = file.name;
        const size = file.size;
        const extension = path.extname(fileName)

        if(!file){
            return res.status(400).json({message: 'Donnée manquante'})
        }
        else if(!allowedExtensions.test(extension)){
            return res.status(401).json({message: 'Extension non supportée'})
        }
        else if(size > 30000000){
            return res.status(401).json({message: 'La taille du fichier doit être 30MB maximum'})
        }

        const md5 = file.md5
        const URL = "/uploads/" + md5 + extension
        await util.promisify(file.mv)("./public" + URL)
        
        return res.json(URL)

    } catch (err) {
        // console.log(err);
        next(err)
    }
    
}