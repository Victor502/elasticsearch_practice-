const config = require("./config.js")
const fastify = require("fastify")({
  logger: true,
})
const fetch = require("node-fetch")

// Declare a route
fastify.get("/", (request, reply) => {
  ElasticTest()
  reply.send({hello: "world"})
})

// Run the server!
fastify.listen(3000, (err, address) => {
  if (err) throw err
  fastify.log.info(`server listening on ${address}`)
})

ElasticTest = async () => {
  try {
    let searchKeyword = "victor"
    let query = {
      query: {
        multi_match: {
          query: searchKeyword,
          fields: ["name"],
          type: "phrase_prefix",
          tie_breaker: 0.2,
        },
      },
    }
    //   const table = option==="vendor"?"trimco.users":"trimco.locations"
    const table = "trimco.users"
    let data = config.search.username+':'+config.search.password
    let encodedData = Buffer.from(data).toString('base64')
    const res = await fetch(
      config.search.url + "/" + table + "/_search?size=100",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization:
            "Basic " + encodedData,
        },
        body: JSON.stringify(query),
      }
    )
    const json = await res.json()
    console.log("json", json)
    if (
      typeof json.hits !== "undefined" &&
      typeof json.hits.hits !== "undefined"
    ) {
      const _choices = []
      json.hits.hits.forEach((hit) => {
        const _choice = {...hit._source}
        _choice._id = hit._id
        _choices.push(_choice)
      })
      console.log("_choices", _choices)
    }
  } catch (e) {
    console.log(e)
  }
}
