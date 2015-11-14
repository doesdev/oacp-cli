// Setup
const path = require('path')
const fs = require('fs')
const assets = path.resolve(__dirname, '../', 'assets')
const bpIndex = fs.readFileSync(path.join(assets, '_index.js')).toString()
const bpAccess = fs.readFileSync(path.join(assets, '_access.js')).toString()
const bpSecrets = fs.readFileSync(path.join(assets, '_secrets.json')).toString()
const bpContr = fs.readFileSync(path.join(assets, '_controller.js')).toString()
const bpWl = fs.readFileSync(path.join(assets, '_whitelist.js')).toString()
const bpGitignore = fs.readFileSync(path.join(assets, '_gitignore')).toString()
var bpApiIndex = fs.readFileSync(path.join(assets, '_api_index.js')).toString()
var bpPackage = fs.readFileSync(path.join(assets, '_package.json')).toString()

module.exports = function (opts) {
  // Create directory structure
  var dirException = 'Error creating directory, stopping app generation'
  try {
    fs.mkdirSync(opts.dir)
  } catch (e) {
    if (e.code !== 'EEXIST') {
      console.log(dirException, e)
      throw e
    }
  }
  try {
    fs.mkdirSync(path.join(opts.dir, 'api'))
  } catch (e) {
    if (e.code !== 'EEXIST') {
      console.log(dirException, e)
      throw e
    }
  }
  try {
    fs.mkdirSync(path.join(opts.dir, 'config'))
  } catch (e) {
    if (e.code !== 'EEXIST') {
      console.log(dirException, e)
      throw e
    }
  }
  try {
    fs.mkdirSync(path.join(opts.dir, 'helpers'))
  } catch (e) {
    if (e.code !== 'EEXIST') {
      console.log(dirException, e)
      throw e
    }
  }
  try {
    fs.mkdirSync(path.join(opts.dir, 'test'))
  } catch (e) {
    if (e.code !== 'EEXIST') {
      console.log(dirException, e)
      throw e
    }
  }
  opts.scaffold.forEach(function (s) {
    try {
      fs.mkdirSync(path.join(opts.dir, 'api', s))
    } catch (e) {
      if (e.code !== 'EEXIST') {
        console.log(dirException, e)
        throw e
      }
    }
  })
  // Write package.json
  bpPackage = bpPackage.replace(/\{\{name\}\}/g, opts.name)
  bpPackage = bpPackage.replace(/\{\{namespace\}\}/g, opts.namespace)
  fs.writeFileSync(path.join(opts.dir, 'package.json'), bpPackage)
  // Write .gitignore
  fs.writeFileSync(path.join(opts.dir, '.gitignore'), bpGitignore)
  // Write index.js
  fs.writeFileSync(path.join(opts.dir, 'index.js'), bpIndex)
  // Write config/secrets.json
  fs.writeFileSync(path.join(opts.dir, 'config', 'secrets.json'), bpSecrets)
  // Write helpers/access.js
  fs.writeFileSync(path.join(opts.dir, 'helpers', 'access.js'), bpAccess)
  // Write api/index.js
  var regModels = ''
  var regChannels = ''
  var regControllers = ''
  opts.scaffoldCamel.forEach(function (s, i) {
    regModels += 'app.registerModel(\'' + s + '\')\n'
    regChannels += 'app.registerChannel(\'' + s + '\')\n'
    regControllers += 'app.registerController(\'' + s +
      '\', require(\'./' + opts.scaffold[i] + '/whitelist\'))\n'
  })
  regModels = regModels.replace(/\n$/, '')
  regChannels = regChannels.replace(/\n$/, '')
  regControllers = regControllers.replace(/\n$/, '')
  bpApiIndex = bpApiIndex.replace(/'\{\{regModels\}\}'/g, regModels)
  bpApiIndex = bpApiIndex.replace(/'\{\{regChannels\}\}'/g, regChannels)
  bpApiIndex = bpApiIndex.replace(/'\{\{regControllers\}\}'/g, regControllers)
  fs.writeFileSync(path.join(opts.dir, 'api', 'index.js'), bpApiIndex)
  // Write api/resource/[controller.js, whitelist.js]
  opts.scaffold.forEach(function (s) {
    fs.writeFileSync(path.join(opts.dir, 'api', s, 'controller.js'), bpContr)
    fs.writeFileSync(path.join(opts.dir, 'api', s, 'whitelist.js'), bpWl)
  })
}
