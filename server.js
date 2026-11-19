// Production server entry point for Hostinger
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const port = process.env.PORT || 3000
const dev = false
const hostname = '0.0.0.0'
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  }).listen(port, hostname, (err) => {
    if (err) throw err
    console.log(`> DimarClub ready on http://${hostname}:${port}`)
  })
})
