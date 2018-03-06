#!/usr/bin/env node

const fs = require('fs')
const Promise = require('bluebird')

const Config = require('./src/config')
const Params = require('./src/params')
const File = require('./src/file')

var configs, params

Params.parse()
    .then(p => {
        params = p
        return Config.load(p.directories)
            .then(c => {
                configs = c
                main()
            })
    })

function main() {
    processInput()
}

function processInput() {
    params.directories.forEach(d => {
        processFileOrDirectory(configs[d], d)
    })
}

function processFileOrDirectory(config, f) {
    if (!f || !config) {
        return
    }

    const groups = getGroupRules(config)
    const finfo = fs.lstatSync(f)

    if (finfo.isFile()) {
        const file = new File(f, params, config)
        let include = false

        if (config.include) {
            config.include.forEach(frx => {
                if (f.match(frx) !== null) {
                    include = true
                }
            })
        }
        if (config.exclude) {
            config.exclude.forEach(erx => {
                if (f.match(erx) !== null) {
                    include = false
                }
            })
        }
        if (!include) {
            console.log('excluded', f)
            return
        }

        let _groups = JSON.parse(JSON.stringify(groups))
        file.cleanUp(_groups)
            .then(f => f.save(_groups))
            .catch(() => {
            })
    } else {
        fs.readdirSync(f).forEach(file => {
            processFileOrDirectory(config, f + '/' + file)
        })
    }
}

function getGroupRules(config) {
    let groups = []

    for (let type in config.types) {
        config.types[type].name = type
        groups.push(config.types[type])
    }

    //console.log('groups', groups)
    return groups
}
