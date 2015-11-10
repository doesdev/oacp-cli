// Setup
const currentDir = process.cwd()
const path = require('path')
const readline = require('readline')

// Helpers
const toArray = (str) => (str.split(',').map((e) => e.trim()))
// Helper function for name dependent properties
function named (opts) {
  opts.namespace = opts.name
    .replace(/\.?([A-Z]+)/g, (x, y) => (' ' + y)).trim()
    .replace(/\s+|[,-;\[\]\\\/]/g, '_').toLowerCase()
  opts.dir = path.join(currentDir, opts.name)
}

// Interactively set variables for new API
module.exports = function (opts, cb) {
  const reader = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  // Steps for the prompts to walk through
  var steps = [
    {
      prompt: () => (
        console.log('====================') &
        console.log('What is your API\'s name going to be?\n') &
        console.log('Name: (' + (opts.name || '') + ') [Required Field]')
      ),
      required: true,
      variable: 'name',
      callback: () => named(opts)
    },
    {
      prompt: () => (
        console.log('====================') &
        console.log('What should the namespace be?\n') &
        console.log('note: this will be used in your PG functions') &
        console.log('i.e. namespace_resource_action(jsonb)\n') &
        console.log('Namespace: (' + opts.namespace + ')')
      ),
      variable: 'namespace'
    },
    {
      prompt: () => (
        console.log('====================') &
        console.log('What directory do you want your API in?\n') &
        console.log('Directory: (' + opts.dir + ')')
      ),
      variable: 'dir'
    },
    {
      prompt: () => (
        console.log('What resources do you want to scaffold out?\n') &
        console.log('note: comma separated list of resource names\n') &
        console.log('Scaffold: (' + opts.scaffold + ')')
      ),
      variable: 'scaffold',
      callback: () => (opts.scaffold = toArray(opts.scaffold))
    }
  ]
  // Track active step
  var curStep = 0
  // Setup prompt
  console.log('\n\n\x1b[32mWe\'re setting up your new OACP API\x1b[0m\n')
  console.log('Just a few questions before we get started...')
  console.log(' - current value for each (if any) is in parenthesis')
  console.log(' - to change it type the desired value in the prompt')
  console.log(' - simply press `Enter` to accept the current value...\n')
  reader.setPrompt('OACP> ')
  // Process each prompt
  reader.on('SIGINT', () => process.exit(0))
  reader.on('line', function (line) {
    if (
      line.trim() === '' &&
      steps[curStep].required &&
      !opts[steps[curStep].variable]
    ) {
      console.error('\x1b[33mField required \x1b[0m ')
      steps[0].prompt()
      return reader.prompt()
    }
    if (line.trim() !== '') opts[steps[curStep].variable] = line
    if (steps[curStep].callback) steps[curStep].callback()
    curStep = curStep + 1
    if (!steps[curStep]) {
      reader.close()
      return cb(opts)
    }
    steps[curStep].prompt()
    reader.prompt()
  })
  // Start prompts
  steps[0].prompt()
  reader.prompt()
}
