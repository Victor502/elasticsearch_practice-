const config = require('./config.js')
const fastify = require('fastify')({
  logger: true
})
const fetch = require('node-fetch');
 
// Declare a route
fastify.get('/', (request, reply) => {
  reply.send({ hello: 'world' })
})
 
// Run the server!
fastify.listen(3000, (err, address) => {
  if (err) throw err
  fastify.log.info(`server listening on ${address}`)
})