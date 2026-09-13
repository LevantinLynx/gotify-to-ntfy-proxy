const logger = require('./logger.js')
const axios = require('axios')
process.env.NTFY_SERVER ??= 'https://ntfy.sh'

if (
  process.env.NTFY_SERVER.indexOf('https://') !== 0 &&
  process.env.NTFY_SERVER.indexOf('http://') !== 0
) {
  const errorMsg = `The protocol is missing or incorrect. Check your NTFY_SERVER variable! It is set to "${process.env.NTFY_SERVER}".`
  logger.error('CONFIG', errorMsg)
  process.exit(1)
}

/**
 * Send a notification to a Ntfy server
 * @param {Object} notification
 * @param {String} notification.topic - Notification topic
 * @param {String} notification.title - Notification title
 * @param {String} notification.content - Notification content text
 * @param {String} [notification.token] - Auth token for the ntfy server
 * @param {String} [notification.priority] - Ntfy notification priority
 */
async function sendNotificationToNtfyServer (notification) {
  try {
    notification.topic ??= 'test'
    notification.title ??= 'Gotify to Ntfy Relay Server'
    notification.priority ??= 'default'
    notification.content ??= 'No notification content provided!'

    const options = {
      method: 'post',
      url: `${process.env.NTFY_SERVER}/${notification.topic}`,
      headers: {
        Title: notification.title,
        Priority: notification.priority
      },
      data: notification.content
    }
    if (notification.token) options.headers.Authorization = `Bearer ${notification.token}`
    if (notification.title.indexOf('failed') > -1) {
      options.headers.Tags = 'red_circle'
      options.headers.Priority = 5
    } else if (notification.title.indexOf('successful') > -1) {
      options.headers.Tags = 'green_circle'
      options.headers.Priority = 3
    }

    const result = await axios(options)
    if (result.data) {
      logger.info('NTFY', `Sent to "${process.env.NTFY_SERVER}/${notification.topic}":`, result.data)
      return result.data
    }
  } catch (err) {
    logger.error('NTFY', err.message, err)
  }
}

module.exports = {
  sendNotificationToNtfyServer
}
