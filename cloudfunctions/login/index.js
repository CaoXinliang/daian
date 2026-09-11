const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

function formatDateTime(date) {
  var y = date.getFullYear()
  var m = ('' + (date.getMonth() + 1)).padStart(2, '0')
  var d = ('' + date.getDate()).padStart(2, '0')
  var h = ('' + date.getHours()).padStart(2, '0')
  var mi = ('' + date.getMinutes()).padStart(2, '0')
  var s = ('' + date.getSeconds()).padStart(2, '0')
  return y + '-' + m + '-' + d + ' ' + h + ':' + mi + ':' + s
}

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID || ''

    const { code } = event

    const phoneResult = await cloud.openapi.phonenumber.getPhoneNumber({
      code: code
    })

    if (phoneResult.errcode && phoneResult.errcode !== 0) {
      return {
        success: false,
        errmsg: phoneResult.errmsg || '获取手机号失败'
      }
    }

    const phoneInfo = phoneResult.phoneInfo || {}
    const phone = phoneInfo.purePhoneNumber || phoneInfo.phoneNumber || ''

    if (!phone) {
      return {
        success: false,
        errmsg: '手机号获取失败'
      }
    }

    const now = new Date()
    const loginTimeStr = formatDateTime(now)

    // 查询是否已存在该手机号
    const userResult = await db.collection('users')
      .where({ phone: phone })
      .orderBy('createTime', 'asc')
      .get()

    let userInfo = null

    if (userResult.data.length > 0) {
      // 已存在 — 更新第一条记录
      const keepUser = userResult.data[0]
      const userId = keepUser._id

      await db.collection('users').doc(userId).update({
        data: {
          lastLoginTime: loginTimeStr,
          openid: openid
        }
      })

      // 删除重复记录
      if (userResult.data.length > 1) {
        var deletePromises = []
        for (var i = 1; i < userResult.data.length; i++) {
          deletePromises.push(
            db.collection('users').doc(userResult.data[i]._id).remove()
          )
        }
        await Promise.all(deletePromises)
      }

      userInfo = {
        ...keepUser,
        lastLoginTime: loginTimeStr,
        openid: openid
      }
      delete userInfo._id
    } else {
      // 不存在 — 注册新账号
      const newUser = {
        phone: phone,
        openid: openid,
        nickname: '微信用户',
        avatarUrl: '',
        createTime: loginTimeStr,
        lastLoginTime: loginTimeStr
      }
      const addResult = await db.collection('users').add({
        data: newUser
      })
      userInfo = {
        ...newUser
      }
    }

    return {
      success: true,
      userInfo: userInfo
    }
  } catch (err) {
    return {
      success: false,
      errmsg: err.errMsg || err.message || '登录失败'
    }
  }
}
