const fs = require('fs')
const Promise = require('bluebird')

module.exports.parse = function() {
    const params = process.argv

    return new Promise((resolve, reject) => {
        const jParams = params
            .filter((p, index) => index > 1)

        const paramsConfig = {
            recursive: jParams.includes('-r'),
            safe: jParams.includes('-s') || jParams.includes('--safe'),
            files: jParams.filter(p => fs.existsSync(p) && fs.lstatSync(p).isFile()),
            directories: jParams.filter(p => fs.existsSync(p) && fs.lstatSync(p).isDirectory())
        }
        //console.log(paramsConfig)

        resolve(paramsConfig)
    })
}
