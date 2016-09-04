const request = require('./request.js')
const fs = require('fs')
const readline = require('readline')
const util = require('./util.js')
const path = require('path')
const config = require('./config.json')

util.run(function *() {
    let startTime = new Date()
    startTime = startTime.toLocaleString()

    let session = yield request.getSession()
    const fetchFriends = (account) => {
        return new Promise((resolve, reject) => {
            request.getFriends(session, account)
                .then(([infoList, cookie]) => {
                    session = util.updateCookie(session, cookie)
                    resolve(infoList)
                })
        })
    }
    let account = config.account
    let relation = {}
    relation[account] = {account}
    let queue = [account]
    let newQueue = []
    for (let index = 0; index < 4; index++) {
        for (let account of queue) {
            let d = new Date()
            d = d.toLocaleString()
            fs.writeFileSync(path.resolve('./data/temp', config.data), JSON.stringify(util.parseRelation(relation), null, 4))
            console.log(`start: ${startTime}, now: ${d}`)
            let list = yield fetchFriends(account)
            relation[account].friends = list
            for (let i in list) {
                if (!relation[i]) {
                    newQueue.push(list[i].account)
                    relation[i] = list[i]
                }
            }
        }
        queue = newQueue
        newQueue = []
    }
    let x = util.parseRelation(relation)
    x = JSON.stringify(x, null, 4)
    fs.write(path.resolve(__dirname, 'data', config.data))

})
