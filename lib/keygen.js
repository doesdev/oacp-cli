// Setup
const path = require('path')
const fs = require('fs')
const keypair = require('keypair')

module.exports = function (opts) {
  console.log('\x1b[33mGenerating RSA keys for JWT Auth\x1b[0m')
  console.log('... this may take a minute')
  const keys = keypair()
  const priv = opts.namespace + '.priv'
  const pub = opts.namespace + '.pub'
  fs.writeFileSync(path.join(opts.dir, 'config', priv), keys.private)
  fs.writeFileSync(path.join(opts.dir, 'config', pub), keys.public)
}
