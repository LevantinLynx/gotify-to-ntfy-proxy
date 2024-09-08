require('dotenv').config()
process.env.RELAY_PORT ??= 8008
process.env.RELAY_HOST_IP ??= '127.0.0.1'

const { mainStory, config } = require('storyboard')
if (process.env.NODE_ENV === 'dev') {
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
const bodyParser = require('body-parser')

const app = express()
const upload = multer()

app.use(upload.none())
app.use(bodyParser.json())

app.post('/message', upload.none(), bodyParser.json(), async (req, res) => {
  const token = req.query.token || req.headers['x-gotify-key'] || req.headers.authorization ? req.headers.authorization.replace('Bearer ', '') : ''

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
  mainStory.info('SERVER', `Relay Server is listening on http://${process.env.RELAY_HOST_IP || '127.0.0.1'}:${process.env.RELAY_PORT || 8008}`)
})
