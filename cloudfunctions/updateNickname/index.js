const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const { phone, nickname } = event

    if (!phone || !nickname) {
      return {
        success: false,
        errmsg: '参数不完整'
      }
    }

    // 查询用户
    const userResult = await db.collection('users').where({
      phone: phone
    }).get()

    if (userResult.data.length === 0) {
      return {
        success: false,
        errmsg: '用户不存在'
      }
    }

    const userId = userResult.data[0]._id

    // 更新昵称
    await db.collection('users').doc(userId).update({
      data: {
        nickname: nickname
      }
    })

    return {
      success: true,
      nickname: nickname
    }
  } catch (err) {
    return {
      success: false,
      errmsg: err.errMsg || err.message || '修改昵称失败'
    }
  }
}
