const https = require('https')
const querystring = require('querystring')
const util = require('./util.js')
const path = require('path')
const fs = require('fs')
const exec = require('child_process').exec
const readline = require('readline')
const cheerio = require('cheerio')
const zlib = require('zlib')
const co = require('co')


const makeHeaders = (args) => {
    let commomHeaders = {
        'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Encoding':'gzip, deflate, sdch, br',
        'Accept-Language':'zh-CN,zh;q=0.8',
        'Cache-Control':'no-cache',
        'Connection':'keep-alive',
        'Host':'www.zhihu.com',
        'Pragma':'no-cache',
        'Referer':'https://www.zhihu.com/',
        'Upgrade-Insecure-Requests':'1',
        'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/51.0.2704.79 Chrome/51.0.2704.79 Safari/537.36',
    }
    for (let i in args) {
        commomHeaders[i] = args[i]
    }
    return commomHeaders
}

const getCaptcha = () => {
    return new Promise((resolve, reject) => {
        let dt = new Date()
        dt = dt.getTime()
        // let url = `https://www.zhihu.com/captcha.gif?r=${dt}`
        let url = `https://www.zhihu.com/captcha.gif?r=${dt}&type=login`
        https.get(url, (response) => {
            let data = []
            response.on('data', (chunk) => {
                data.push(chunk)
            })
            response.on('end', () => {
                // console.log(response.rawHeaders)
                let cookie = util.parseCookie(response.rawHeaders)
                let buf = Buffer.concat(data)
                fs.open(path.resolve(__dirname, './1.gif'), 'w', (err, fd) => {
                    if (err) throw err
                    fs.write(fd, buf, 0, buf.length, (err, written, buffer) => {
                        if (err) throw err
                        exec('gnome-open ./1.gif &')
                    })
                })               
                const rl = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout
                })
                rl.question('Tell me the captcha: \n', (answer) => {
                    resolve([answer, cookie])
                    exec('rm ./1.gif &')
                    rl.close()
                })
            })
        })
    })
}

const getXsrf = () => {
    return new Promise((resolve, reject) => {
        const url = 'https://www.zhihu.com/'
        https.get(url, (res) => {
            let data = ''
            res.setEncoding('utf8')
            res.on('data', (c) => {data += c})
            res.on('end', () => {
                let $ = cheerio.load(data)
                let xsrf = $(`input[name='_xsrf']`)[0].attribs.value
                resolve(xsrf)
            })
        })
    })
}

const login = (account, password, captcha, _xsrf, cookie = {}) => {
    return new Promise((resolve, reject) => {
        const postData = {
            _xsrf,
            password,
            captcha,
            remember_me: true,
            phone_num: account
        }
        cookie = util.stringifyCookie(cookie)
        let headers = makeHeaders({
            'Content-Length': Buffer.byteLength(querystring.stringify(postData)),
            'Cookie': cookie,
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        })
        const options = {
            hostname: 'www.zhihu.com',
            port: 443,
            path: '/login/phone_num',
            method: 'POST',
            headers
        }
        let req = https.request(options, resolve)
        req.on('error', (e) =>{
            console.log('something wrong: ', e.message)
        })
        req.write(querystring.stringify(postData))
        req.end()
    })
}

const getFollowees = (cookie, username) => {
    return new Promise((resolve, reject) => {
        cookie = util.stringifyCookie(cookie)
        let headers = makeHeaders({Cookie: cookie})
        const options = {
            hostname: 'www.zhihu.com',
            port: 443,
            path: `/people/${username}/followees`,
            method: 'GET',
            headers
        }
        let req = https.get(options, resolve)
        req.on('error', (e) => {
            console.log('somethin wrong1: ', e.message)
        })
        req.end()
    }).catch((err) => {
        console.log('something wrong: ', err)
    })
}

// params.offset 从0开始抓取20个
const getFolloweesOrFollowers = (flag) => {
    let urlPath = '/node/ProfileFolloweesListV2'
    if (flag !== 1) urlPath = '/node/ProfileFollowersListV2' 
    return (cookie, params) => {
        return new Promise((resolve, reject) => {
            let Cookie = util.stringifyCookie(cookie)
            let postData = {
                method: 'next',
                params: JSON.stringify(params)
            }
            let headers = makeHeaders({
                Cookie,
                'Content-Length': Buffer.byteLength(querystring.stringify(postData)),
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest',
                'X-Xsrftoken': cookie._xsrf
            })
            const options = {
                hostname: 'www.zhihu.com',
                // path: '/node/ProfileFolloweesListV2',
                path: urlPath,
                method: 'POST',
                headers
            }
            let req = https.request(options, resolve)
            req.on('error', (e) => {
                console.log('[request.js] something wrong: ', e.message)
            })
            req.write(querystring.stringify(postData))
            req.end()
        })
    }
}

const getFolloweesList = (cookie, params) => {
    return getFolloweesOrFollowers(1)(cookie, params)
}

const getFollowersList = (cookie, params) => {
    return getFolloweesOrFollowers(2)(cookie, params)
}

const isLogin = (cookie) => {
    cookie = util.stringifyCookie(cookie)
    let headers = makeHeaders({Cookie: cookie})
    url = `http://www.zhihu.com/settings/profile`
    const options = {
        hostname: 'www.zhihu.com',
        port: 443,
        path: `/settings/profile`,
        method: 'GET',
        headers
    }
    let req = https.request(options, (response) => {
        if (response.statusCode === 200) {
            console.log('成功登录')
        } else {
            console.log('未登录')
        }
    })
    req.end()
}


const getSession = () => {
    return new Promise((resolveOut, rejectOut) => {
        Promise.all([getCaptcha(), getXsrf()])
            .then(([[captcha, cookie], _xsrf]) => {
                return new Promise((resolve ,reject) => {
                    // session = cookie
                    // session['_xsrf'] = _xsrf
                    cookie['_xsrf'] = _xsrf
                    login('13224238804', 'msq402642', captcha, _xsrf, cookie)
                        .then((res) => {
                            resolve([res, cookie])
                        })
                        .catch((err) => {
                            console.log(err)
                        })
                })
            })
            .then(([response, session]) => {
                return new Promise((resolve, reject) => {
                    // 更新cookie
                    try {
                        let cookie = util.parseCookie(response.rawHeaders)
                        session = util.updateCookie(session, cookie)
                    }
                    catch (e) {
                        console.log('something wrong: ', e)
                    }
                    let data = ''
                    response.on('data', (c) => {data += c})
                    response.on('end', () => {
                        data = JSON.parse(data)
                        console.log(data)
                        if (data.r === 0) {
                            resolveOut(session)
                        } 
                        else reject('login failed')
                    })
                })
            })
    })
}

const getFriends = (session, user) => {
    return new Promise((resolveOut, rejectOut) => {
        getFollowees(session, user)
            .then((response) => {
                return new Promise((resolve, reject) => {
                    let cookie = util.parseCookie(response.rawHeaders)
                    session = util.updateCookie(session, cookie)
                    let data = []
                    response.on('data', (c) => {data.push(c)})
                    response.on('end', () => {
                        let buf = Buffer.concat(data)
                        zlib.gunzip(buf, (err, result) => {
                            if (err) throw err;
                            resolve(result.toString())
                        })
                    })
                })
            })
            .then((data) => {
                return new Promise((resolve, reject) => {
                    let $ = cheerio.load(data)
                    let watchingNum = parseInt($('.zm-profile-side-following strong')[0].children[0].data) 
                    let watchedNum = parseInt($('.zm-profile-side-following strong')[1].children[0].data) 
                    if (watchingNum > 1000 || watchedNum > 1000) return resolveOut([{}, session])
                    let params = JSON.parse($('.zh-general-list')[0].attribs['data-init'])['params']
                    util.run(function *() {
                        const parseInfo = (data) => {
                            let list = []
                            data.forEach((value) => {
                                list = list.concat(value)
                            })
                            let res = []
                            for (let i of list) {
                                let $ = cheerio.load(i)
                                let taga = $('.author-link')[0]
                                res.push({
                                    name: taga.attribs.title,
                                    account: taga.attribs.href.split('www.zhihu.com/people/')[1]
                                })
                            }
                            return res
                        }
                        const parseResponse = (response) => {
                            return new Promise((resolve, reject) => {
                                let data = []
                                response.on('data', (c) => {data.push(c)})
                                response.on('end', () => {
                                    let buf = Buffer.concat(data)
                                    zlib.gunzip(buf, (err, result) => {
                                        if (err) throw err;
                                        resolve(JSON.parse(result.toString()))
                                    })
                                })
                            })

                        }
                        let result = []
                        for (let i = 0; i < watchingNum; i += 20) {
                            let p = yield getFolloweesList(session, params).then(parseResponse)
                            result.push(p.msg)
                            params['offset'] += 20
                        }
                        let feeList = parseInfo(result)
                        result = []
                        params['offset'] = 0
                        for (let i = 0; i < watchedNum; i += 20) {
                            let p = yield getFollowersList(session, params).then(parseResponse)
                            result.push(p.msg)
                            params['offset'] += 20
                        }
                        let ferList = parseInfo(result)
                        let hash = {}
                        for (let i of feeList) {
                            hash[i.account] = true
                        }
                        result = []
                        for (let i of ferList) {
                            if (hash[i.account]) {
                                result.push(i)
                            }
                        }
                        let resultObj = {}
                        for (let i of result) {
                            resultObj[i.account] = i
                        }
                        resolveOut([resultObj, session])
                    })

                })
            })
    })
}

module.exports = {
    getSession,
    getFriends
}