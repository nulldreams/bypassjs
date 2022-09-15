const path = require('path')

exports.appRealPath = () => {
  const isLocal = typeof process.pkg === 'undefined'
  return isLocal ? process.cwd() : path.dirname(process.execPath)
}
