const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  try {
    const uploadRes = await cloud.uploadFile({
      cloudPath: 'images/_temp_probe.txt',
      fileContent: Buffer.from('1')
    })

    const tempFileID = uploadRes.fileID
    const prefix = tempFileID.replace(/^cloud:\/\/([^/]+)\/.*$/, '$1')

    await cloud.deleteFile({
      fileList: [tempFileID]
    })

    const fileIDs = [
      'cloud://' + prefix + '/images/daianlogo.png',
      'cloud://' + prefix + '/images/banner1.jpg',
      'cloud://' + prefix + '/images/list_img1.jpg'
    ]

    const urlRes = await cloud.getTempFileURL({
      fileList: fileIDs
    })

    return {
      success: true,
      logoUrl: urlRes.fileList[0].tempFileURL,
      bannerUrl: urlRes.fileList[1].tempFileURL,
      productUrl: urlRes.fileList[2].tempFileURL,
      logoFileID: fileIDs[0],
      bannerFileID: fileIDs[1],
      productFileID: fileIDs[2]
    }
  } catch (err) {
    return {
      success: false,
      error: err.message || '获取图片URL失败'
    }
  }
}
