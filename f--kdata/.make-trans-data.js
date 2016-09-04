let fs = require('fs')
let arr = []
for (let i = 1; i < 1000; i += 2) {
    let n = (i * i + 1) / 2
    arr.push(n)
}
fs.writeFile('./trans-data.json', JSON.stringify(arr))