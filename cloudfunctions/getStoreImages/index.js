const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  try {
    const db = cloud.database()
    const PAGE_SIZE = 20
    let allData = []
    let skip = 0
    let hasMore = true

    while (hasMore) {
      const res = await db.collection('cloudImages')
        .orderBy('sort', 'asc')
        .skip(skip)
        .limit(PAGE_SIZE)
        .get()

      allData = allData.concat(res.data)

      if (res.data.length === PAGE_SIZE) {
        skip += PAGE_SIZE
      } else {
        hasMore = false
      }
    }

    if (allData.length > 0) {
      const fileIDs = allData.map(function (item) {
        return item.fileID
      })

      const urlRes = await cloud.getTempFileURL({
        fileList: fileIDs
      })

      var urlMap = {}
      urlRes.fileList.forEach(function (item) {
        if (item.tempFileURL) {
          urlMap[item.fileID] = item.tempFileURL
        }
      })

      var images = allData.map(function (item, index) {
        return {
          url: urlMap[item.fileID] || '',
          fileID: item.fileID,
          sort: item.sort || index,
          category: item.category || '',
          productName: item.productName || '',
          specs: item.specs || null,
          isDetail: item.isDetail || false
        }
      }).filter(function (item) {
        return item.url
      })

      return {
        success: true,
        images: images
      }
    } else {
      return {
        success: false,
        error: '云存储中暂无图片'
      }
    }
  } catch (err) {
    return {
      success: false,
      error: err.message || '加载图片失败'
    }
  }
}
