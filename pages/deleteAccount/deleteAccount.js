Page({
  data: {
    phone: ''
  },

  onLoad: function () {
    var userInfo = wx.getStorageSync('userInfo')
    if (userInfo && userInfo.phone) {
      this.setData({
        phone: userInfo.phone
      })
    }
  },

  // 取消
  onCancel: function () {
    wx.navigateBack()
  },

  // 确定注销
  onConfirm: function () {
    var that = this
    wx.showModal({
      title: '再次确认',
      content: '注销后所有数据将无法恢复，确定继续吗？',
      confirmText: '确定注销',
      confirmColor: '#ff4d4f',
      success: function (res) {
        if (res.confirm) {
          that.doDelete()
        }
      }
    })
  },

  doDelete: function () {
    var that = this
    wx.showLoading({ title: '注销中...' })

    wx.cloud.callFunction({
      name: 'deleteAccount',
      data: {
        phone: this.data.phone
      },
      success: function (res) {
        wx.hideLoading()
        if (res.result && res.result.success) {
          wx.removeStorageSync('userInfo')
          wx.showToast({ title: '注销成功', icon: 'success' })
          setTimeout(function () {
            wx.switchTab({
              url: '/pages/mine/mine'
            })
          }, 1500)
        } else {
          wx.showToast({ title: (res.result && res.result.errmsg) || '注销失败', icon: 'none' })
        }
      },
      fail: function () {
        wx.hideLoading()
        wx.showToast({ title: '网络错误', icon: 'none' })
      }
    })
  }
})
