const getCurrentDateTime = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = date.getMonth()+1
    const day = date.getDate()
    const hour = date.getHours()
    const minute = date.getMinutes()
    const seconds = date.getSeconds()

    const createdAtDate = `${year}-${month}-${day} ${hour}-${minute}-${seconds}`
    return createdAtDate
}

module.exports = getCurrentDateTime