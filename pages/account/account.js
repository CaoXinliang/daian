Page({
  data: {
    userInfo: {
      nickname: '',
      phone: ''
    }
  },

  onLoad: function () {
    this.loadUserInfo()
  },

  onShow: function () {
    this.loadUserInfo()
  },

  loadUserInfo: function () {
    var userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({
        userInfo: userInfo
      })
    }
  },

  // 修改昵称
  onNicknameTap: function () {
    var that = this
    wx.showModal({
      title: '修改昵称',
      editable: true,
      placeholderText: '请输入新昵称',
      content: this.data.userInfo.nickname,
      success: function (res) {
        if (res.confirm && res.content) {
          var newNickname = res.content.trim()
          if (!newNickname) {
            wx.showToast({ title: '昵称不能为空', icon: 'none' })
            return
          }
          if (newNickname.length > 20) {
            wx.showToast({ title: '昵称不能超过20个字符', icon: 'none' })
            return
          }
          that.updateNickname(newNickname)
        }
      }
    })
  },

  updateNickname: function (nickname) {
    var that = this
    wx.showLoading({ title: '保存中...' })

    wx.cloud.callFunction({
      name: 'updateNickname',
      data: {
        phone: this.data.userInfo.phone,
        nickname: nickname
      },
      success: function (res) {
        wx.hideLoading()
        if (res.result && res.result.success) {
          var userInfo = Object.assign({}, that.data.userInfo, { nickname: nickname })
          wx.setStorageSync('userInfo', userInfo)
          that.setData({
            userInfo: userInfo
          })
          wx.showToast({ title: '修改成功', icon: 'success' })
        } else {
          wx.showToast({ title: (res.result && res.result.errmsg) || '修改失败', icon: 'none' })
        }
      },
      fail: function () {
        wx.hideLoading()
        wx.showToast({ title: '网络错误', icon: 'none' })
      }
    })
  },

  // 退出登录
  onLogout: function () {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: function (res) {
        if (res.confirm) {
          wx.removeStorageSync('userInfo')
          wx.showToast({ title: '已退出登录', icon: 'success' })
          setTimeout(function () {
            wx.switchTab({
              url: '/pages/mine/mine'
            })
          }, 1000)
        }
      }
    })
  },

  // 注销账号
  onDeleteAccount: function () {
    wx.navigateTo({
      url: '/pages/deleteAccount/deleteAccount'
    })
  }
})
