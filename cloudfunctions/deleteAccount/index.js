const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const { phone } = event

    if (!phone) {
      return {
        success: false,
        errmsg: '手机号不能为空'
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
    const avatarUrl = userResult.data[0].avatarUrl || ''

    // 删除用户
    await db.collection('users').doc(userId).remove()

    // 删除云存储中的头像
    if (avatarUrl && avatarUrl.indexOf('cloud://') === 0) {
      try {
        await cloud.deleteFile({
          fileList: [avatarUrl]
        })
      } catch (e) {
        console.warn('删除头像失败:', e)
      }
    }

    return {
      success: true
    }
  } catch (err) {
    return {
      success: false,
      errmsg: err.errMsg || err.message || '注销失败'
    }
  }
}
