require('dotenv').config()
process.env.RELAY_PORT ??= 8008
process.env.RELAY_HOST_IP ??= '0.0.0.0'

const { mainStory, config } = require('storyboard')
if (process.env.NODE_ENV === 'development') {
  config({ filter: '*:DEBUG' })
  mainStory.info('ENVIRONMENT', 'Running in DEVELOPMENT mode!')
} else {
  config({ filter: '*:INFO' })
  mainStory.info('ENVIRONMENT', 'Running in PRODUCTION mode!')
}
require('storyboard-preset-console')

const { sendNotificationToNtfyServer } = require('./ntfy.js')

let topics = null
try {
  topics = require('./topics.js')
} catch (err) {
  if (err.message?.indexOf("Cannot find module './topics.js'") > -1) {
    mainStory.error('CONFIG', 'File "topics.js" does not exists or is not passed correctly to the docker container.')
  } else {
    mainStory.error('CONFIG', 'Error while loading "topics.js"')
    mainStory.error('CONFIG', err.message)
  }
  process.exit(1)
}
const express = require('express')
const multer = require('multer')
const { json } = require('body-parser')

const app = express()
const upload = multer()

app.use(upload.none())
app.use(json())

app.post('/message', upload.none(), json(), async (req, res) => {
  const token = req.query.token || req.headers['x-gotify-key'] || (req.headers.authorization ? req.headers.authorization.replace('Bearer ', '') : '')

  mainStory.debug('MESSAGE', 'Gotify message recieved:', {
    attach: { ...req.body, token },
    attachLevel: 'debug'
  })

  const priority = ['min', 'low', 'default', 'high', 'max']
  const topic = token.split('/')[0]
  const ntfyToken = token.split('/')[1]
  if (!topic || !topics[topic]) {
    const error = {
      error: 'Bad Request',
      errorCode: 400,
      errorDescription: 'No matching topic found! Please ensure the topic is defined in topic.js and provide a token formated: topic/ntfyToken'
    }
    mainStory.error('NOTIFICATION', error.error, {
      attach: error,
      attachLevel: 'error'
    })
    return res.json(error).status(400)
  }
  if (topics[topic].ntfyToken !== ntfyToken) {
    const error = {
      error: 'Unauthorized',
      errorCode: 401,
      errorDescription: 'Please provide a token formated: topic/ntfyToken'
    }
    mainStory.error('NOTIFICATION', error.error, {
      attach: error,
      attachLevel: 'error'
    })
    return res.json(error).status(401)
  }
  if (!req.body.message) {
    const error = {
      error: 'Bad Request',
      errorCode: 400,
      errorDescription: 'Please provide a message.'
    }
    mainStory.error('NOTIFICATION', error.error, {
      attach: error,
      attachLevel: 'error'
    })
    return res.json(error).status(400)
  }
  req.body.message = req.body.message.replace(/```\n+/, '').replace(/\n+```/, '')

  // Workaround for iOS not having attatchment support limitation of ntfy
  // splitting the content into multiple chunks of 4K strings or less
  // reverse chunks and send notifications so it is in correct order for reading
  if (process.env.SPLIT_LARGE_MESSAGES && Buffer.byteLength(req.body.message) > 4096) {
    // chunking in 4000 Byte increments to leave room for long strings/ids
    // this should avoid the automatic attatchment conversion from ntfy
    const messageParts = chunkStringByByteLength(req.body.message, 4000, 3700).reverse()

    mainStory.info('DEBUG', 'Message parts:', {
      attach: messageParts,
      attachLevel: 'info'
    })

    let msg = null
    for (let i = 0; i < messageParts.length; i++) {
      const notification = {
        topic: token.split('/')[0],
        title: `${req.body.title} PART ${messageParts.length - i}/${messageParts.length}`,
        content: messageParts[i],
        priority: priority[req.body.priority - 1 || 3] || 'default',
        token: ntfyToken
      }
      msg = await sendNotificationToNtfyServer(notification)
      // delay over 1000 ms between msgs to ensure delivery order in app
      await delay(1050)
    }

    res.json({
      id: msg.id,
      appid: 1,
      message: req.body.message,
      title: req.body.title,
      priority: req.body.priority,
      date: new Date().toISOString()
    })

    return
  }

  const notification = {
    topic: token.split('/')[0],
    title: req.body.title,
    content: req.body.message,
    priority: priority[req.body.priority - 1 || 3] || 'default',
    token: ntfyToken
  }
  const msg = await sendNotificationToNtfyServer(notification)

  res.json({
    id: msg.id,
    appid: 1,
    message: req.body.message,
    title: req.body.title,
    priority: req.body.priority,
    date: new Date().toISOString()
  })
})

app.listen(process.env.RELAY_PORT, process.env.RELAY_HOST_IP, () => {
  mainStory.info('SERVER', `Relay Server is listening on http://${process.env.RELAY_HOST_IP || '0.0.0.0'}:${process.env.RELAY_PORT || 8008}`)
})

/**
 * Converts a string into array of strings of maximum Byte length or less
 * The string will be split at new lines "\n" or spaces, if none are found force split at max length
 * @param {String} string String to be split up into multiple parts
 * @param {Number} maxBytes Integer Byte size -1 of maximum chunk size in Bytes to split the string provided
 * @param {Number} minBytes Integer Byte size of minimum chunk size in Bytes to split the string provided
 * @returns {String[]} Array of strings with max chunk size in Bytes or less
 */
function chunkStringByByteLength (string, maxBytes, minBytes) {
  const chunks = []
  while (string.length) {
    if (string.length <= maxBytes) {
      chunks.push(string)
      return chunks
    } else {
      let removeSplitChars = true
      // split at new line if possible
      let index = string.lastIndexOf('\n', maxBytes)
      // split at space if no new line was found
      if (index === -1 || index < minBytes) index = string.lastIndexOf(' ', maxBytes)
      // force split at maxBytes
      if (index === -1 || index < minBytes) {
        removeSplitChars = false
        index = 0 + maxBytes
        // avoid multi byte character splits
        while (string.codePointAt(index) > 0xFFFF) index--
      }
      chunks.push(string.slice(0, index))
      string = string.slice(index)
      if (removeSplitChars) string = string.slice(1)
    }
  }
  return chunks
}

function delay (ms) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), ms)
  })
}
