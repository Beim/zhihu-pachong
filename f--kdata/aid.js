let transArr = require('./trans-data.json')
let data3 = require('./data.json')
let data4 = require('./data4.json')
let data5 = require('./data5.json')


const run = (gen) => {
    let g = gen()
    let next = (data) => {
        let result = g.next(data)
        // if (result.done) return result.value;
        if (result.done) return ;
        result.value.then((data) => {
            next(data)
        })
    }
    next()
}

const print = (obj) => {
    if (typeof obj === 'object') 
        console.log(JSON.stringify(obj, null, 4))
    else 
        console.log(obj)
}


const whichLevel = (idx) => {
    if (idx === 1) return 1;
    let flag = true
    let res = 0
    for (let i = 0; i < transArr.length; i++) {
        if (idx <= transArr[i] && idx > transArr[i - 1]) {
            res = i * 2 + 1
            break;
        }
    }
    return res
}

const levelNum = (level) => {
    if (level === 1) {
        return 1
    } else {
        return (level - 1) * 4
    }
}

const calcCols = (obj) => {
    let num = 0
    for (let i in obj) num++
    console.log(`共有${num} 个数据`)
    let res = whichLevel(num)
    console.log(`分配${res} 列`)
    return res
}

const nextPos = () => {
    let index = 1
    return (newIndex = 0) => {
        if (newIndex) index = newIndex
        if (index === 1) {
            index++
            return [0, 0]
        }
        let level = whichLevel(index)
        let lnum = levelNum(level)
        let [x, y] = [0, 0]
        let halfLevel = (level - 1) / 2 + 1
        let [pos1, pos2, pos3] = [halfLevel, 2 * halfLevel - 1, 3 * halfLevel - 2]
        let idx = index - transArr[halfLevel - 2]
        // console.log(`halfLevel: ${halfLevel}`)
        // console.log(`pos1: ${pos1}, pos2: ${pos2}, pos3: ${pos3}`)
        // console.log(`idx: ${idx}`)
        if (idx <= pos2) {
            y = halfLevel - idx
        } else {
            y = 1 - halfLevel + (idx - pos2)
        }
        if (idx <= pos1) {
            x = 1 - idx
        } else if (idx <= pos2) {
            x = idx - pos2
        } else if (idx <= pos3) {
            x = idx - pos2
        } else {
            x = halfLevel - 1 - (idx - pos3)
        }
        index++
        return [x, y]
    }
}

const hookPos = (data) => {
    let owner = ''
    for (let i in data) {
        if (!data[i].name) {
            owner = data[i].account
            break;
        }
    }
    let n = nextPos()
    let [queue, newQueue, hash] = [[owner], [], {}]
    hash[owner] = true
    while (queue.length > 0) {
        for (let account of queue) {
            data[account].pos = n()
            data[account].clicks = 0
            let friends = data[account].friends
            for (let i in friends) {
                if (!hash[i]) {
                    newQueue.push(i)
                    hash[i] = true
                }
            }
        }
        [queue, newQueue] = [newQueue, []]
    }
    return data
}

// let res = hookPos(data4)
// console.log(data4)

// let t = nextPos()
// for (let i = 1; i < 20; i++) {
//     console.log(i + ': ', t())
// }

module.exports = {
    calcCols,
    hookPos,
    run,
    print,
}