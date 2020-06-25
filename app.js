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
  const resFromES = await ElasticTest(searchKeyword, query, table)
  reply.send({hello: "world", resFromES: resFromES})
})

// Run the server!
fastify.listen(3000, (err, address) => {
  if (err) throw err
  fastify.log.info(`server listening on ${address}`)
})

ElasticTest = async (searchKeyword, query, table) => {
  try {
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
      return _choices
    }
  } catch (e) {
    console.log(e)
  }
}

workingFunction = async () => {
    let timeNow = Date.now()
    //asssunmes cron job at 9am
    let threedaysMili = 14 * 24 * 60 * 60 * 1000 // change 14 -> 3
    let threedaysStartMili = threedaysMili - (6 * 60 * 60 * 1000) // minus 6 hours on 3rd day
    let threedaysEndMili = threedaysMili + (12 * 60 * 60 * 1000)  // plus 12 hrs on 3rd day
    const threeDaysAgoStart = timeNow - threedaysStartMili
    const threeDaysAgoEnd = timeNow - threedaysEndMili
    let userThereDaysAgo = []
    let userPendingBookings = []

/**   
    let allBookings = db.get('bookings')

    let bookingsThreeDaysago = await allBookings.find({
        $and:[{status: {$in : [4, 7] } },
          {start_time: {$gte: threeDaysAgoStart, $lt: timeNow}}]})


    for (let i = 0; i < bookingsThreeDaysago.length; i++){
      userThereDaysAgo.push(bookingsThreeDaysago[i].uid)
    }
    let uniqueThreeDayUsers = new Set(userThereDaysAgo)
    userThereDaysAgo = [...uniqueThreeDayUsers]


    let allPendingBookings = await allBookings.find({
        $and:[{status: 2},
        {start_time: {$gte: threeDaysAgoStart}}]})
    for (let i = 0; i < allPendingBookings.length; i++){
      userPendingBookings.push(allPendingBookings[i].uid)
    }
    let uniquePendingUsers = new Set(userPendingBookings)
    userPendingBookings = [...uniquePendingUsers]

    let usersToGetPN = userThereDaysAgo.filter( ( user ) => !userPendingBookings.includes( user ) );
    // send PN or email
    for (let i = 0; i< usersToGetPN.length; i++) {

      let user = await GetUserById(usersToGetPN[i])
      const myPn = ["03e5936f-a1ce-41f6-aeff-cd1223e4a145", "84889c63-b38e-429f-a8ec-3c3eb034e984"]
      const message = {
          "title": "Busy week?",
          "body": "You deserve a fresh do. Schedule your next appointment!"
        }
*/
    /**
      if (typeof user !== 'undefined') {
        if (user.notification.push === true &&
          typeof user.push !== 'undefiend' && 
          typeof user.push.onesignal !== 'undefined') {
            // change myPn to user.push.onesignal.push_ids
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
        console.log('no user defiend')
      }
    }
  */

  
    }
