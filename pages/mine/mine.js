Page({
  data: {
    isLogin: false,
    userInfo: {
      nickname: '',
      phone: '',
      avatarUrl: ''
    },
    showContact: false,
    version: 'v1.0.3'
  },

  onLoad: function () {
    this.checkLogin()
    this.loadVersion()
  },

  onShow: function () {
    this.checkLogin()
  },

  loadVersion: function () {
    var that = this
    wx.cloud.callFunction({
      name: 'getConfig',
      data: {
        paramName: 'version'
      },
      success: function (res) {
        if (res.result && res.result.success && res.result.paramValue) {
          that.setData({
            version: res.result.paramValue
          })
        }
      },
      fail: function () {
        console.error('获取版本号失败')
      }
    })
  },

  checkLogin: function () {
    var that = this
    var userInfo = wx.getStorageSync('userInfo')
    if (userInfo && userInfo.phone) {
      wx.cloud.callFunction({
        name: 'checkUser',
        data: {
          phone: userInfo.phone
        },
        success: function (res) {
          if (res.result && res.result.success && res.result.exists) {
            var dbUserInfo = res.result.userInfo
            wx.setStorageSync('userInfo', dbUserInfo)
            that.setData({
              isLogin: true,
              userInfo: dbUserInfo
            })
          } else {
            wx.removeStorageSync('userInfo')
            that.setData({
              isLogin: false,
              userInfo: {
                nickname: '',
                phone: '',
                avatarUrl: ''
              }
            })
          }
        },
        fail: function () {
          that.setData({
            isLogin: true,
            userInfo: userInfo
          })
        }
      })
    } else {
      this.setData({
        isLogin: false,
        userInfo: {
          nickname: '',
          phone: '',
          avatarUrl: ''
        }
      })
    }
  },

  onChooseAvatar: function (e) {
    if (e.detail.avatarUrl) {
      this.uploadAvatar(e.detail.avatarUrl)
    }
  },

  uploadAvatar: function (tempFilePath) {
    var that = this
    wx.showLoading({ title: '上传中...' })
    var phone = this.data.userInfo.phone
    var cloudPath = 'avatars/' + phone + '_' + Date.now() + '.jpg'

    wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: tempFilePath,
      success: function (uploadRes) {
        that.updateAvatarToServer(uploadRes.fileID)
      },
      fail: function () {
        wx.hideLoading()
        wx.showToast({ title: '上传失败', icon: 'none' })
      }
    })
  },

  updateAvatarToServer: function (avatarUrl) {
    var that = this
    var oldAvatarUrl = this.data.userInfo.avatarUrl || ''
    wx.cloud.callFunction({
      name: 'updateAvatar',
      data: {
        phone: this.data.userInfo.phone,
        avatarUrl: avatarUrl,
        oldAvatarUrl: oldAvatarUrl
      },
      success: function (res) {
        wx.hideLoading()
        if (res.result && res.result.success) {
          var userInfo = Object.assign({}, that.data.userInfo, { avatarUrl: avatarUrl })
          wx.setStorageSync('userInfo', userInfo)
          that.setData({
            userInfo: userInfo
          })
          wx.showToast({ title: '头像更新成功', icon: 'success' })
        } else {
          wx.showToast({ title: (res.result && res.result.errmsg) || '更新失败', icon: 'none' })
        }
      },
      fail: function () {
        wx.hideLoading()
        wx.showToast({ title: '网络错误', icon: 'none' })
      }
    })
  },

  goAccount: function () {
    if (!this.data.isLogin) {
      return
    }
    wx.navigateTo({
      url: '/pages/account/account'
    })
  },

  // 我的项目
  goProjects: function () {
    wx.navigateTo({
      url: '/pages/project/list'
    })
  },

  // 我的收藏
  goFavorites: function () {
    wx.navigateTo({
      url: '/pages/favorites/favorites'
    })
  },

  onGetPhone: function (e) {
    var that = this
    if (!e.detail.code) {
      wx.showToast({ title: '已取消授权', icon: 'none' })
      return
    }

    wx.showLoading({ title: '登录中...' })

    wx.cloud.callFunction({
      name: 'login',
      data: {
        code: e.detail.code
      },
      success: function (res) {
        wx.hideLoading()
        if (res.result && res.result.success) {
          var userInfo = res.result.userInfo
          wx.setStorageSync('userInfo', userInfo)
          that.setData({
            isLogin: true,
            userInfo: userInfo
          })
          wx.showToast({ title: '登录成功', icon: 'success' })
        } else {
          wx.showToast({ title: (res.result && res.result.errmsg) || '登录失败', icon: 'none' })
        }
      },
      fail: function (err) {
        wx.hideLoading()
        console.error('登录失败', err)
        wx.showToast({ title: '登录失败', icon: 'none' })
      }
    })
  },

  onContact: function () {
    this.setData({
      showContact: true
    })
  },

  closeContact: function () {
    this.setData({
      showContact: false
    })
  },

  makePhoneCall: function () {
    wx.makePhoneCall({
      phoneNumber: '18779728272'
    })
  },

  onFeedback: function () {
    if (!this.data.isLogin) {
      wx.showToast({ title: '请先点击立即登录', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: '/pages/feedback/feedback'
    })
  },

  onAbout: function () {
    wx.navigateTo({
      url: '/pages/about/about'
    })
  },

  preventTouchMove: function () {}
})
