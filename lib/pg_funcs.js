// Setup
const currentDir = process.cwd()
const path = require('path')
var appInfo
try {
  appInfo = require(path.join(currentDir, 'package.json'))
} catch (e) {
  console.log('pgFuncs command needs to be run in an OACP API directory')
  process.exit(0)
}
const oacpConf = appInfo.oacp || {jwt: {}, env: {}}
const fs = require('fs')
const PG = require('./pg')
const assets = path.resolve(__dirname, '../', 'assets')
const outBase = path.join(currentDir, 'db', 'pg_funcs')
var bpFuncs = {}
bpFuncs.search = fs.readFileSync(path.join(assets, '_pgfunc_search.sql'))
bpFuncs.create = fs.readFileSync(path.join(assets, '_pgfunc_create.sql'))
bpFuncs.read = fs.readFileSync(path.join(assets, '_pgfunc_read.sql'))
bpFuncs.update = fs.readFileSync(path.join(assets, '_pgfunc_update.sql'))
bpFuncs.delete = fs.readFileSync(path.join(assets, '_pgfunc_delete.sql'))
// Variable setup
var namespace = oacpConf.namespace
var schema = 'public'
var resources

module.exports = (resources, options) => {
  resources = resources
  schema = options.name || schema
  makePgFunctions()
}

// Iterate over all resources
function makePgFunctions () {
  resources.forEach((r) => new PgFunc(r))
}

// PgFunc class
function PgFunc (resource) {
  var self = this
  self.columns = {core: []}
  self.resource = resource
  self.pg = new PG()
  function runGetColumns () { self.getColumns() }
  self.pg.on('ready', runGetColumns)
  return self
}

// Make that isht
PgFunc.prototype.getColumns = function () {
  var self = this
  var resource = self.resource
  var query = '' +
    'SELECT * FROM information_schema.columns ' +
    'WHERE table_schema = $1 AND table_name = $2;'
  self.pg
    .query(query, [schema, resource])
    .on('error', (err) => console.log(err))
    .on('data', (data) => self.setColumnObject(data.rows))
}

PgFunc.prototype.setColumnObject = function (rawCols) {
  var self = this
  var columns = self.columns
  var typed = (t) => t === 'USER-DEFINED' ? 'citext' : t
  rawCols.forEach((c) => {
    if ((c.column_default || '').match(/nextval/)) {
      columns.primary = {name: c.column_name, type: typed(c.data_type)}
    } else {
      columns.core.push({name: c.column_name, type: typed(c.data_type)})
    }
  })
  return self.writePgFunctions()
}

PgFunc.prototype.writePgFunctions = function () {
  var self = this
  var resource = self.resource
  var columns = self.columns
  var columnList, columnListB, columnListC, columnListD
  ['search', 'create', 'read', 'update', 'delete'].forEach((action) => {
    if (!bpFuncs[action]) return
    columnList =
      [columns.primary].concat(columns.core)
        .map((c) => `      ${c.name}`).join(',\n').trim()
    switch (action) {
      case 'search':
        columnList =
          columns.core.map((c) =>
            `  v_${c.name} ${c.type}`
          ).join(';\n').trim()
        columnListB =
          columns.core.map((c) =>
            c.type.match(/text|char/)
            ? `    NULLIF(BTRIM((p_jsonb->>'${c.name}')::${c.type}), '')`
            : `    (p_jsonb->>'${c.name}')::${c.type}`
          ).join(',\n').trim()
        columnListC =
          columns.core.map((c) =>
            `    v_${c.name}`
          ).join(',\n').trim()
        columnListD =
          columns.core.map((c) =>
            c.type.match(/text|char/)
            ? `    (v_${c.name} IS null OR ${c.name} ` +
              `LIKE '%' || v_${c.name} || '%')`
            : `    (v_${c.name} IS null OR ${c.name} = v_${c.name})`
          ).join(' AND\n').trim()
        break
      case 'create':
        columnList =
          columns.core
            .map((c) => `    ${c.name}`).join(',\n').trim()
        columnListB =
          columns.core.map((c) =>
            `      (p_jsonb->>'${c.name}')::${c.type}`
          ).join(',\n').trim()
        break
      case 'update':
        columnList =
          columns.core.map((c) =>
            `    ${c.name} = ` +
            `coalesce((p_jsonb->>'${c.name}')::${c.type}, ${c.name})`
          ).join(',\n').trim()
        break
    }
    var pathOut = path.join(outBase, `${namespace}_${resource}_${action}.sql`)
    var out =
      bpFuncs[action].toString()
        .replace(/{{namespace}}/g, namespace)
        .replace(/{{resource}}/g, resource)
        .replace(/{{primary_key}}/g, columns.primary.name)
        .replace(/{{pkey_type}}/g, columns.primary.type)
        .replace(/{{column_list}}/g, columnList)
        .replace(/{{column_list_b}}/g, (columnListB || ''))
        .replace(/{{column_list_c}}/g, (columnListC || ''))
        .replace(/{{column_list_d}}/g, (columnListD || ''))
    fs.writeFileSync(pathOut, out)
  })
}
