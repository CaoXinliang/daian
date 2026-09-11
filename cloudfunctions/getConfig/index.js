const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const { paramName } = event

    if (!paramName) {
      return {
        success: false,
        errmsg: '参数名不能为空'
      }
    }

    const result = await db.collection('daian_config').where({
      paramName: paramName
    }).get()

    if (result.data.length > 0) {
      return {
        success: true,
        paramValue: result.data[0].paramValue
      }
    } else {
      return {
        success: false,
        errmsg: '配置项不存在'
      }
    }
  } catch (err) {
    return {
      success: false,
      errmsg: err.errMsg || err.message || '获取配置失败'
    }
  }
}
