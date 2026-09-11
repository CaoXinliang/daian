const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  try {
    const result = await cloud.openapi.phonenumber.getPhoneNumber({
      code: event.code
    })

    if (result.errcode && result.errcode !== 0) {
      return {
        success: false,
        errmsg: result.errmsg || '获取手机号失败',
        errcode: result.errcode
      }
    }

    var phoneInfo = result.phoneInfo || {}
    return {
      success: true,
      phone: phoneInfo.purePhoneNumber || phoneInfo.phoneNumber || ''
    }
  } catch (err) {
    return {
      success: false,
      errmsg: err.errMsg || '获取手机号失败',
      errcode: err.errCode || -1
    }
  }
}
