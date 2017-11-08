const fs = require('fs')
const Promise = require('bluebird')
const _find = require('lodash/find')
const _filter = require('lodash/filter')
const _sortBy = require('lodash/sortBy')

class File {
    constructor(path, params) {
        this.path = path
        this.params = params
    }

    analyze() {
        return new Promise((resolve, reject) => {
            fs.readFileAsync(this.path, 'utf8')
                .then(f => {
                    resolve(analyze(f))
                })
        })
    }

    cleanUp(groups) {
        return new Promise((resolve, reject) => {
            this.analyze()
                .then(imports => {
                    if (!imports) {
                        return reject()
                    }

                    this.data = mergeImports(imports)
                    this.data.imports = groupImports(this.data.imports, groups)
                    resolve(this)
                })
            })
    }

    save(groupRules) {
        return fs.writeFile(this.path + (this.params.unsafe ? '' : '.cleaned'), compose(this.data, groupRules))
    }
}

function analyze(data) {
    const rxImport = /import\s+((\{((\s*\w+\s*,?)*)\}|\* as \w+)\s+from\s+)?(['"`])(.*)(['"`])/g
    let imports = []
    let aliasImports = []
    let completeFileImports = []

    let m, lastMatch
    let foundOne = false

    while (m = rxImport.exec(data)) {
        foundOne = true

        lastMatch = m
        if (m.index === rxImport.lastIndex) rxImport.lastIndex++

        if (!m[2]) { // import 'package'
            completeFileImports.push({
                imported: null,
                from: m[6].trim()
            })
        } else if (!m[3]) { // import * as alias from 'package'
            aliasImports.push({
                imported: null,
                alias: m[2],
                from: m[6].trim()
            })
        } else { // import { Func1, Func2 } from 'package'
            imports.push({
                imported: m[3]
                    .split(',')
                    .map(x => x.trim()),
                from: m[6].trim()
            })
        }
    }

    if (!foundOne) {
        return null
    }

    let importsEndPos = lastMatch.index + lastMatch[0].length
    let code = data
        .substr(importsEndPos, data.length - importsEndPos)
        .trim()

    imports = imports
        .concat(...aliasImports)
        .concat(...completeFileImports)

    console.log(imports)

    return {
        imports,
        code
    }
}

function groupImports(imports, groups) {
    groups.forEach(g => {
        let regexes = g.matches.map(m => new RegExp(m, 'g'))
        g.imports = []

        regexes.forEach(rx => {
            let rximports = []
            imports.forEach(i => {
                let m
                if (i.from.match(rx)) {
                    rximports.push(i)
                }
            })
            rximports.forEach(i => imports.splice(imports.indexOf(i), 1))
            g.imports.push(...rximports)
        })

    })

    imports.groups = groups

    return imports
}

function mergeImports(file) {
    file.imports.forEach(i => {
        let duplicates = file.imports.filter(imp => {
            //console.log(i.from, imp.from, i.from === imp.from, i !== imp)
            return i.from === imp.from && i !== imp
        })
        duplicates
            .forEach(d => {
                let _i = {
                    imported: _sortBy([
                        ...(i.imported || []),
                        ...(d.imported || [])
                    ]),
                    from: i.from
                }

                const iIndex = file.imports.indexOf(i)
                file.imports.splice(iIndex, 1)

                const dIndex = file.imports.indexOf(d)
                file.imports.splice(dIndex, 1)

                file.imports.push(_i)
            })
    })

    return file
}

function compose(data, groups) {
    let str = ''

    groups.forEach(g => {
        const _g = _find(data.imports.groups, { name: g.name })
        if (!_g) return

        _g.imports.forEach(i => {
            if (i.imported) {
                str += `import { ${ i.imported.join(', ') } } from '${ i.from }'\n`
            } else if (i.alias) {
                str += `import ${ i.alias } from '${ i.from }'\n`
            } else {
                str += `import '${ i.from }'\n`
            }
        })
        if (g.imports.length > 0) str += '\n'
    })
    str += '\n'
    str += data.code

    return str
}

module.exports = File
