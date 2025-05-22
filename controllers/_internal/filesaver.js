const directory = process.env.SERVER_DIR
// const directory = require('path').join(__dirname, 'public/uploads/')
const path = require('path')
let fs = require('fs');


exports.fileSaver = (file, unique_id, file_type) => {
    // console.log("file generation");
    // const FileBuffer = Buffer.from(file, 'base64')
    const docName = '/public/uploads/' + file_type + '_docs_' + unique_id + '_.pdf'
    // fs.writeFileSync(directory + docName, FileBuffer);

    return docName;
}



