const aid = require('./aid.js')
const data = require('../data/data4.json')
const Pen = require('./pen.js')
const exec = require('child_process').exec

const cols = aid.calcCols(data)
const distance = 100
const width = distance * (cols + 1)
const pen = Pen(width, width)
const parsePosToReal = ([x, y]) => {
    x = ((cols + 1) / 2 + x) * distance
    y = ((cols + 1) / 2 + y) * distance
    return [x, y]
} 
const traversal = (fn) => {
    for (let i in data) {
        fn(data[i])
        for (let j in data[i].friends) {
            fn(data[j])
        }
    }
}

aid.hookPos(data)
traversal((user) => {
    user.clicks++
})

for (let i in data) {
    pen.drawPoint(parsePosToReal(data[i].pos), data[i])
    for (let j in data[i].friends) {
        let pos1 = parsePosToReal(data[i].pos)
        let pos2 = parsePosToReal(data[j].pos)
        pen.linkPoint(pos1, pos2)
    } 
}
pen.savePng(__dirname + '/main.png').then(() => {
    exec('gnome-open ./main.png')
})