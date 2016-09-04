const Canvas = require('canvas')
const fs = require('fs')


const drawPoint = function([x, y], user) {
    let ctx = this
    ctx.beginPath()
    let size = user.clicks > 30 ? 30 : user.clicks
    ctx.arc(x, y, size, 0, 2*Math.PI)
    ctx.fill()

    ctx.font = '15px Impact';
    let name = user.name ? user.name : '我'
    ctx.fillStyle = 'red'
    ctx.fillText(name, x + 10, y - 20);
    ctx.fillStyle = '#000'
}

const linkPoint = function([x1, y1], [x2, y2]) {
    let ctx = this
    ctx.lineWidth = 0.1
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()


}

const savePng = function(path) {
    return new Promise((res, rej) => {
        let out = fs.createWriteStream(path)
        let stream = this.pngStream()
        stream.on('data', (c) => {
            out.write(c)
        })
        stream.on('end', () => {
            console.log('save png')
            res()
        })
        stream.on('error', (e) => {
            console.log('error: ', e)
        })

    })
}

module.exports = (width, height) => {
    let canvas = new Canvas(width, height)
    let ctx = canvas.getContext('2d')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, width, height)
    ctx.fillStyle = '#000'
    return {
        drawPoint: drawPoint.bind(ctx),
        linkPoint: linkPoint.bind(ctx),
        savePng: savePng.bind(canvas),
    }

}