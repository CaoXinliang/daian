const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const { phone, avatarUrl, oldAvatarUrl } = event

    if (!phone || !avatarUrl) {
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

    // 更新头像
    await db.collection('users').doc(userId).update({
      data: {
        avatarUrl: avatarUrl
      }
    })

    // 删除旧头像（仅删除云存储文件，微信头像URL不删）
    if (oldAvatarUrl && oldAvatarUrl.indexOf('cloud://') === 0) {
      try {
        await cloud.deleteFile({
          fileList: [oldAvatarUrl]
        })
      } catch (e) {
        console.warn('删除旧头像失败:', e)
      }
    }

    return {
      success: true,
      avatarUrl: avatarUrl
    }
  } catch (err) {
    return {
      success: false,
      errmsg: err.errMsg || err.message || '修改头像失败'
    }
  }
}
