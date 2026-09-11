function formatTime(date) {
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate()
  var hour = date.getHours()
  var minute = date.getMinutes()
  var second = date.getSeconds()
  month = month < 10 ? '0' + month : month
  day = day < 10 ? '0' + day : day
  hour = hour < 10 ? '0' + hour : hour
  minute = minute < 10 ? '0' + minute : minute
  second = second < 10 ? '0' + second : second
  return year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second
}

var TOTAL_IMAGES = 48

Page({
  data: {
    uploading: false,
    currentNum: 0,
    uploadedCount: 0,
    totalNum: TOTAL_IMAGES,
    progress: 0,
    uploadLog: [],
    done: false
  },

  startUpload: function () {
    if (this.data.uploading) return

    var that = this
    this.setData({
      uploading: true,
      currentNum: 0,
      uploadedCount: 0,
      progress: 0,
      uploadLog: [],
      done: false
    })

    var db = wx.cloud.database()
    db.collection('cloudImages').where({}).get({
      success: function (res) {
        if (res.data.length > 0) {
          var deleteCount = res.data.length
          var deleted = 0
          res.data.forEach(function (item) {
            db.collection('cloudImages').doc(item._id).remove({
              success: function () {
                deleted++
                if (deleted >= deleteCount) {
                  that.uploadImage(1)
                }
              },
              fail: function () {
                deleted++
                if (deleted >= deleteCount) {
                  that.uploadImage(1)
                }
              }
            })
          })
        } else {
          that.uploadImage(1)
        }
      },
      fail: function () {
        that.uploadImage(1)
      }
    })
  },

  uploadImage: function (num) {
    if (num > TOTAL_IMAGES) {
      this.setData({ uploading: false, done: true })
      wx.showToast({ title: '全部上传完成', icon: 'success' })
      return
    }

    var that = this
    var cloudPath = 'store/store1/img' + num + '.jpg'
    var tempPath = wx.env.USER_DATA_PATH + '/temp_img' + num + '.jpg'

    this.setData({ currentNum: num })

    var fs = wx.getFileSystemManager()

    fs.copyFile({
      srcPath: 'images/img' + num + '.jpg',
      destPath: tempPath,
      success: function () {
        that.doUpload(num, tempPath, cloudPath)
      },
      fail: function () {
        fs.copyFile({
          srcPath: '/images/img' + num + '.jpg',
          destPath: tempPath,
          success: function () {
            that.doUpload(num, tempPath, cloudPath)
          },
          fail: function (err) {
            console.error('copyFile fail:', err)
            that.onUploadFail(num, 'copy')
          }
        })
      }
    })
  },

  doUpload: function (num, filePath, cloudPath) {
    var that = this
    wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: filePath,
      success: function (uploadRes) {
        var db = wx.cloud.database()
        db.collection('cloudImages').add({
          data: {
            fileID: uploadRes.fileID,
            sort: num,
            cloudPath: cloudPath,
            createTime: formatTime(new Date())
          },
          success: function () {
            that.onUploadSuccess(num)
          },
          fail: function () {
            that.onUploadSuccess(num)
          }
        })
      },
      fail: function (err) {
        console.error('upload fail:', err)
        that.onUploadFail(num, 'upload')
      }
    })
  },

  onUploadSuccess: function (num) {
    var tempPath = wx.env.USER_DATA_PATH + '/temp_img' + num + '.jpg'
    try {
      wx.getFileSystemManager().unlink({ filePath: tempPath })
    } catch (e) {}

    this.setData({
      uploadedCount: num,
      progress: Math.round(num / TOTAL_IMAGES * 100),
      uploadLog: this.data.uploadLog.concat(['img' + num + '.jpg OK'])
    })
    this.uploadImage(num + 1)
  },

  onUploadFail: function (num, type) {
    this.setData({
      uploadLog: this.data.uploadLog.concat(['img' + num + '.jpg ' + type + ' FAIL'])
    })
    this.uploadImage(num + 1)
  },

  goBack: function () {
    wx.navigateBack()
  }
})
