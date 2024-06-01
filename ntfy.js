const { mainStory } = require('storyboard')
require('storyboard-preset-console')
const axios = require('axios')
process.env.NTFY_SERVER ??= 'https://ntfy.sh'

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

    const result = await axios(options)
    if (result.data) {
      mainStory.info('NTFY', `Sent to "${process.env.NTFY_SERVER}/${notification.topic}":`, {
        attach: result.data,
        attachLevel: 'info'
      })
      return result.data
    }
  } catch (err) {
    mainStory.error('NTFY', err.message, {
      attach: err,
      attachLevel: 'error'
    })
  }
}

module.exports = {
  sendNotificationToNtfyServer
}
