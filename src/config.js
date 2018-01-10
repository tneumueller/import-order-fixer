const fs = require('fs')
const Promise = require('bluebird')

Promise.promisifyAll(fs)

module.exports.load = function() {
    return new Promise((resolve, reject) => {
        fs.readFileAsync('config.json', 'utf8')
            .then(d => {
                try {
                    const config = JSON.parse(d)
                    resolve(config)
                } catch(err) {
                    reject(err)
                }
            })
            .catch(err => {
                console.log('Config file "imports.json" does not exist in this folder. Aborting.')
            })
    })
}
