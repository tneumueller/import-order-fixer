const fs = require('fs')
const Promise = require('bluebird')

const Config = require('./config')
const Params = require('./params')
const File = require('./file')

var config, params, groups;

Promise.all([
    Config.load(),
    Params.parse()
]).then(res => {
        config = res[0]
        params = res[1]
        main()
    })
    .catch(e => console.error(e))

function main() {
    processInput()
}

function processInput() {
    groups = getGroupRules()

    params.files.forEach(f => processFileOrDirectory(f))
    params.directories.forEach(d => processFileOrDirectory(d))
}

function processFileOrDirectory(f) {
    const finfo = fs.lstatSync(f)

    if (finfo.isFile()) {
        const file = new File(f, params)

        if (config.files) {
            let matchesAny = false
            config.files.forEach(frx => {
                if (f.match(frx) !== null) {
                    matchesAny = true
                }
            })
            if (!matchesAny) {
                console.log(`File "${f}" was skipped`)
                return
            }
        }

        let _groups = JSON.parse(JSON.stringify(groups))
        file.cleanUp(_groups)
            .then(f => f.save(_groups))
            .catch(() => {})
    } else {
        fs.readdirSync(f).forEach(file => {
            processFileOrDirectory(f + '/' + file)
        })
    }
}

function getGroupRules() {
    let groups = []

    for (let type in config.types) {
        config.types[type].name = type
        groups.push(config.types[type])
    }

    //console.log('groups', groups)
    return groups
}
