function getIsoDate () {
  return new Date().toISOString()
}

module.exports = {
  debug: function () {
    if (process.env.NODE_ENV !== 'production') {
      console.log(getIsoDate(), 'DEBUG', ...arguments)
    }
  },
  log: function () {
    console.log(getIsoDate(), '  LOG', ...arguments)
  },
  info: function () {
    console.log(getIsoDate(), ' INFO', ...arguments)
  },
  warn: function () {
    console.warn(getIsoDate(), ' WARN', ...arguments)
  },
  error: function () {
    console.error(getIsoDate(), 'ERROR', ...arguments)
  }
}
