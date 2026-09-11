const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return { success: false, error: '无法获取用户标识' }
  }

  const { action, product_id, product_title, product_banner } = event

  try {
    if (action === 'toggle') {
      if (!product_id) {
        return { success: false, error: '缺少产品ID' }
      }

      const existing = await db.collection('daian_product_collect')
        .where({ openid: openid, product_id: product_id })
        .get()

      if (existing.data.length > 0) {
        await db.collection('daian_product_collect')
          .doc(existing.data[0]._id)
          .remove()
        return { success: true, favorited: false }
      } else {
        const now = new Date()
        await db.collection('daian_product_collect').add({
          data: {
            openid: openid,
            product_id: product_id,
            product_title: product_title || '',
            product_banner: product_banner || '',
            create_time: now
          }
        })
        return { success: true, favorited: true }
      }

    } else if (action === 'check') {
      if (!product_id) {
        return { success: false, error: '缺少产品ID' }
      }
      const existing = await db.collection('daian_product_collect')
        .where({ openid: openid, product_id: product_id })
        .get()
      return { success: true, favorited: existing.data.length > 0 }

    } else if (action === 'list') {
      const result = await db.collection('daian_product_collect')
        .where({ openid: openid })
        .orderBy('create_time', 'desc')
        .get()

      var favorites = result.data.map(function (item) {
        return {
          id: item._id,
          product_id: item.product_id,
          product_title: item.product_title,
          product_banner: item.product_banner,
          create_time: item.create_time
        }
      })

      if (product_id) {
        // If product_id provided with list action, also check if it's favorited
        var isFavorited = favorites.some(function (f) {
          return f.product_id === product_id
        })
        return { success: true, favorites: favorites, isFavorited: isFavorited }
      }

      return { success: true, favorites: favorites }
    }

    return { success: false, error: '未知操作' }
  } catch (err) {
    return { success: false, error: err.message || '操作失败' }
  }
}
