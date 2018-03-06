const fs = require('fs')
const Promise = require('bluebird')

Promise.promisifyAll(fs)

module.exports.load = function(directories) {
    const promises = directories.map(dir => {
        return fs.readFileAsync(`${dir}/imports.json`, 'utf8')
            .then(f => ({
                directory: dir,
                config: f
            }))
    })
    return Promise.all(promises)
        .then(_configs => {
            const configs = {}
            _configs.forEach(c => {
                configs[c.directory] = JSON.parse(c.config)
            })
            return configs
        })
        .catch(err => {
            console.log('Config file "imports.json" does not exist in this folder. Aborting.', err)
        })
}
