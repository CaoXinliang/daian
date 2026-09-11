const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const { phone, content } = event

    if (!phone || !content) {
      return {
        success: false,
        errmsg: '参数不完整'
      }
    }

    const now = new Date()

    function formatDateTime(date) {
      var y = date.getFullYear()
      var m = ('' + (date.getMonth() + 1)).padStart(2, '0')
      var d = ('' + date.getDate()).padStart(2, '0')
      var h = ('' + date.getHours()).padStart(2, '0')
      var mi = ('' + date.getMinutes()).padStart(2, '0')
      var s = ('' + date.getSeconds()).padStart(2, '0')
      return y + '-' + m + '-' + d + ' ' + h + ':' + mi + ':' + s
    }

    await db.collection('feedback_info').add({
      data: {
        phone: phone,
        content: content,
        createTime: formatDateTime(now)
      }
    })

    return {
      success: true
    }
  } catch (err) {
    return {
      success: false,
      errmsg: err.errMsg || err.message || '提交失败'
    }
  }
}
