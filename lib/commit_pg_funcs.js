// Setup
const currentDir = process.cwd()
const path = require('path')
const fs = require('fs')
const PG = require('./pg')
var schema = 'public'

module.exports = (options) => {
  schema = (typeof options.schema === 'function') ? schema : options.schema
  var funcs = fs.readdirSync(path.join(currentDir, 'db', 'pg_funcs'))
  commitPgFunctions(funcs)
}

// Iterate over all resources
function commitPgFunctions (funcs) {
  var i = 0
  var proceed = () => {
    i = i + 1
    if (i <= funcs.length) commitNext()
  }
  var commitNext = () => {
    var pg = new PG()
    var commit = () => {
      if (!funcs[i]) return process.exit(0)
      var funcPath = path.join(currentDir, 'db', 'pg_funcs', funcs[i])
      var funcText = fs.readFileSync(funcPath).toString()
      pg.query(funcText)
      pg.on('error', (err) => {
        console.log('Error committing ' + funcs[i])
        console.log(err)
        proceed()
      })
      pg.on('data', () => {
        console.log('Successfully committed ' + funcs[i])
        proceed()
      })
    }
    pg.once('ready', commit)
  }
  commitNext()
}
