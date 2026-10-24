/** @type {import('jest').Config} */
const config = {
  verbose: true,
  collectCoverageFrom: ['controllers/**/*.js', 'middleware.js'],
  coverageReporters: ['text', 'text-summary', 'html'],
}

module.exports = config
