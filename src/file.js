const fs = require('fs')
const Promise = require('bluebird')
const _find = require('lodash/find')
const _filter = require('lodash/filter')
const _sortBy = require('lodash/sortBy')

class File {
    constructor(path, params, config) {
        this.path = path
        this.params = params
        this.config = config
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
                        return reject(new Error('Error during import analization'))
                    }

                    this.data = mergeImports(imports)
                    this.data.imports = groupImports(this.data.imports, groups)
                    resolve(this)
                })
        })
    }

    save(groupRules) {
        let parts = this.path.split('.')
        let ending = parts.pop()
        const filename = !this.params.safe ? this.path : `${parts.join('.')}.cleaned.${ending}`

        try {
            const data = compose(this.data, groupRules, this.config)
            return fs.writeFile(filename, data, () => {
                console.log(`changed '${filename}'`)
            })
        } catch (err) {
            console.log(err)
        }
    }
}

function analyze(data) {
    if (!data) {
        throw new Error('Data is undefined')
    }

    const rxImport = /import\s+((\{((\s*\w+\s*,?)*)\}|\* as \w+)\s+from\s+)?(['"`])(.*)(['"`]);?/g
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

    // console.log(imports)

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
            return i.from === imp.from
                && i !== imp
                && !i.alias
                && !imp.alias
                && i.imported
                && imp.imported
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

function compose(data, groups, config) {
    let str = ''

    let orderedGroups = []
    config.order.forEach(o => {
        orderedGroups.push(_find(data.imports.groups, { name: o }))
    })
    orderedGroups = orderedGroups
        .filter(g => g.imports.length > 0)

    orderedGroups
        .forEach((g, gIndex) => {
            let groupStr = ''

            if (g.comment && g.imports.length > 0) {
                groupStr += '// ' + g.comment + '\n'
            }

            g.imports.forEach(i => {
                if (i.imported) {
                    let line = `import { ${ i.imported.join(', ') } } from '${ i.from }'\n`
                    if (line.length > 120) line = `import {\n  ${ i.imported.join(',\n  ') }\n} from '${ i.from }'\n`
                    groupStr += line
                } else if (i.alias) {
                    groupStr += `import ${ i.alias } from '${ i.from }'\n`
                } else {
                    groupStr += `import '${ i.from }'\n`
                }
            })

            const configEnvironment = {
                $first: gIndex === 0,
                $last: gIndex === orderedGroups.length - 1,
                $size: g.imports.length,
                $count: orderedGroups.length
            }
            const spacing = getSpacing(config, g, configEnvironment)

            groupStr =
                Array(spacing.before).fill('\n').join('')
                + groupStr
                + Array(spacing.after).fill('\n').join('')
            str += groupStr
        })

    const afterImports = config.space ? (config.space.afterImports === undefined ? 1 : config.space.afterImports) : 1
    str += Array(afterImports).fill('\n').join('')

    str += data.code + '\n'

    return str
}

function getSpacing(config, group, environment) {
    const spacing = { }

    if (group.space) {
        if (typeof group.space === 'number') {
            after = group.space
        } else if (typeof group.space === 'object') {
            ([
                'before',
                'after'
            ]).forEach(pos => {
                if (group.space[pos]) {
                    switch (typeof group.space[pos]) {
                        case 'number':
                            if (evalCondition(group.space[pos].if, environment)) {
                                spacing[pos] = group.space[pos]
                            }
                            break
                        case 'object':
                            if (evalCondition(group.space[pos].if, environment)) {
                                spacing[pos] = group.space[pos].size || 0
                            }
                            break
                    }
                }
            })
        }
    }

    return {
        before: spacing.before || 0,
        after: spacing.after || config.space.afterGroup || 0
    }
}

function evalCondition( cond, env) {
    cond = cond.trim()
    // console.log('### COND', cond, env)

    if (cond === 'true') return true
    if (cond === 'false') return false

    const boolExpr = /^(!)?(\$[A-Za-z]+)$/
    const compareExpr = /^(\$[A-Za-z]+)\s*(<|<=|>|>=|==)\s*([0-9]+)$/

    let m
    if (m = boolExpr.exec(cond)) {
        const neg = m[1]
        const _var = env[m[2]]
        if (_var === undefined) {
            throw new Error(`Undefined variable '${m[2]}'`)
        }
        return neg ? !_var : !!_var
    } else if (m = compareExpr.exec(cond)) {
        const _var = env[m[1]]
        if (_var === undefined) {
            throw new Error(`Undefined variable '${m[1]}'`)
        }
        const op = m[2]
        const val = m[3]
        return eval(`${_var}${op}${val}`)
    } else {
        throw new Error(`Invalid expression: "${cond}"`)
    }
}

module.exports = File
