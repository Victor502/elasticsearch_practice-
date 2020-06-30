const config = require("./config.js")
const fastify = require("fastify")({
  logger: true,
})
const fetch = require("node-fetch")

// Declare a route
fastify.get("/", async (request, reply) => {
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
  const table = "trimco.users"
  const resFromES = await ElasticQuery(query, table)
  reply.send({hello: "world", resFromES, workingRes})
})

// Run the server!
fastify.listen(3000, (err, address) => {
  if (err) throw err
  fastify.log.info(`server listening on ${address}`)
})

ElasticQuery = async (query, table) => {
  try {
    let data = config.search.username+':'+config.search.password
    let encodedData = Buffer.from(data).toString('base64')
    const res = await fetch(
      config.search.url + "/" + table + "/_search",
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
    // console.log("json", json)
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
      // console.log("_choices", _choices)
      return _choices
    }
  } catch (e) {
    console.log(e)
  }
}

workingFunction = async () => {
    let timeNow = Date.now()
    //asssunmes cron job at 9am
    let threedaysMili = 3 * 24 * 60 * 60 * 1000 // 3 days
    let threedaysStartMili = threedaysMili + (6 * 60 * 60 * 1000) // minus 6 hours on 3rd day
    let threedaysEndMili = threedaysMili - (6 * 60 * 60 * 1000)  // plus 6 hrs on 3rd day
    const threeDaysAgoStart = timeNow - threedaysStartMili
    const threeDaysAgoEnd = timeNow - threedaysEndMili
    let userThereDaysAgo = []
    let userPendingBookings = []

    let bookingsThreeDaysAgoQuery = {
        "size": 10000,
        "query" : {
          "bool": {
            "must": {
                "range": {
                "start_time" : {
                  "gte" : threeDaysAgoStart,
                  "lte" : threeDaysAgoEnd,
                  "boost": 2
                }
              }
            },
            "filter" : [ 
                { "terms": { "status": ["4","7"] } }
              ]
          }
        }
    }

    const bookingsThreeDaysAgo = await ElasticQuery(bookingsThreeDaysAgoQuery, "trimco.bookings")

    for (let i = 0; i < bookingsThreeDaysAgo.length; i++){
      userThereDaysAgo.push(bookingsThreeDaysAgo[i].uid)
    }
    let uniqueThreeDayUsers = new Set(userThereDaysAgo)
    userThereDaysAgo = [...uniqueThreeDayUsers]

    let allPendingBookingsQuery = {
      "size": 10000,
      "query": {
        "bool": {
          "must": {
            "range": {
              "start_time": {"gte" : threeDaysAgoStart}
          }
        },
          "filter": {
            "term": {"status": 2}
          }
        }
      }
    }

    const allPendingBookings = await ElasticQuery(allPendingBookingsQuery, "trimco.bookings")

    for (let i = 0; i < allPendingBookings.length; i++){
      userPendingBookings.push(allPendingBookings[i].uid)
    }
    let uniquePendingUsers = new Set(userPendingBookings)
    userPendingBookings = [...uniquePendingUsers]

    let usersToGetPN = userThereDaysAgo.filter( ( user ) => !userPendingBookings.includes( user ) );
    console.log("usersToGetPN", usersToGetPN.length)
  
    // send PN or email
    for (let i = 0; i< usersToGetPN.length; i++) {

      let user = await GetElasticUserById(usersToGetPN[i])
      console.log('user', user)

      const myPn = ["03e5936f-a1ce-41f6-aeff-cd1223e4a145", "84889c63-b38e-429f-a8ec-3c3eb034e984"]
      const message = {
          "title": "Busy week?",
          "body": "You deserve a fresh do. Schedule your next appointment!"
        }

      if (typeof user !== 'undefined') {
        if (user.notification.push === true &&
          typeof user.push !== 'undefiend' && 
          typeof user.push.onesignal !== 'undefined') {
            // change myPn to user.push.onesignal.push_ids
            // need to have SendPushOneSignal available
            let pnSent = await SendPushOneSignal(myPn, message)
            if (pnSent.errors &&
              pnSent.errors.invalid_player_ids.length > 0 && 
              user.notification.email === true
              && typeof user.email !== 'undefined') {
                //send email
                  let mailOptions = {
                    from: 'appointment@trim.co',
                    to: user.email,
                    subject: "Freshness is only a click away!",
                    text: "Busy week? You deserve a fresh do. Schedule your next appointment!",
                    html: "Busy week? You deserve a fresh do. Schedule your next appointment!",
                  }
                  transporter.sendMail(mailOptions, (err, info) => {
                    if (err) {
                      throw new Error("Problem sending email", err);
                      }
                    })
              }
          } else if (user.notification.email === true && typeof user.email !== 'undefined' ) {
            // send email
            let mailOptions = {
              from: 'appointment@trim.co',
              to: user.email,
              subject: "Freshness is only a click away!",
              text: "Busy week? You deserve a fresh do. Schedule your next appointment!",
              html: "Busy week? You deserve a fresh do. Schedule your next appointment!",
            }
            transporter.sendMail(mailOptions, (err, info) => {
              if (err) {
                throw new Error("Problem sending email", err);
                }
              })
          }
      } else {
        throw('no user defiend')
      }

    }
  

  
}

GetElasticUserById = async (id) => {
  try {
    if(typeof id !== 'undefined') {
      let userQuery = {
        "size": 10,
        "query": {
          "bool": {
            "must": {"match": {"uid": id}}
          }
        }
      }
      const user = await ElasticQuery(userQuery, "trimco.users")
      return user
    } else {
      throw("no id")
    }
  } catch (e) {
    console.log("GetElasticUserById error")
    throw new Error(e)
  }
}
