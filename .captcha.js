// http://think2011.net/2016/01/31/node-ocr/
// convert 1.gif 1.jpg
// tesseract 1.jpg -psm 7 result.txt
const fs = require('fs')
const tesseract = require('node-tesseract')
const gm = require('gm')

const processImg = (imgPath, newPath, thresholdVal) => {
    return new Promise((resolve, reject) => {
        // gm(imgPath)
        //     .threshold(thresholdVal || 45)
        //     .write(newPath, (err) => {
        //         if (err) return reject(err)
        //         resolve(newPath)
        //     })
        resolve(imgPath)
    })
}

const recognizer = (imgPath, options) => {
    options = Object.assign({psm: 7}, options)

    return new Promise((resolve, reject) => {
        tesseract
            .process(imgPath, options, (err, text) => {
                if (err) return reject(err)
                resolve(text.replace(/[\r\n\s]/gm), '')
            })
    })
}

processImg('1.jpg', 'test1.jpg')
    .then(recognizer)
    .then(text => {
        console.log(`识别结果: ${text}`)
    })
    .catch(err => {
        console.log(`识别失败: ${err}`)
    })