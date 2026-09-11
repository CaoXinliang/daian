const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID || ''

    const { phone } = event

    if (!phone) {
      return {
        success: false,
        exists: false
      }
    }

    const result = await db.collection('users').where({
      phone: phone
    }).orderBy('createTime', 'asc').get()

    // 清理重复记录
    if (result.data.length > 1) {
      var deletePromises = []
      for (var i = 1; i < result.data.length; i++) {
        deletePromises.push(
          db.collection('users').doc(result.data[i]._id).remove()
        )
      }
      await Promise.all(deletePromises)
    }

    if (result.data.length > 0) {
      // 如果有 openid 且与当前不同，更新
      if (openid && result.data[0].openid !== openid) {
        await db.collection('users').doc(result.data[0]._id).update({
          data: { openid: openid }
        })
      }

      return {
        success: true,
        exists: true,
        userInfo: {
          nickname: result.data[0].nickname,
          phone: result.data[0].phone,
          avatarUrl: result.data[0].avatarUrl || '',
          openid: result.data[0].openid || openid,
          createTime: result.data[0].createTime,
          lastLoginTime: result.data[0].lastLoginTime
        }
      }
    }

    return {
      success: true,
      exists: false,
      userInfo: null
    }
  } catch (err) {
    return {
      success: false,
      exists: false,
      errmsg: err.errMsg || err.message || '查询失败'
    }
  }
}
