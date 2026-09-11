Page({
  data: {
    content: '',
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

  onInput: function (e) {
    this.setData({
      content: e.detail.value
    })
  },

  onSubmit: function () {
    var content = this.data.content.trim()
    if (!content) {
      wx.showToast({ title: '请输入意见或建议', icon: 'none' })
      return
    }

    var that = this
    wx.showLoading({ title: '提交中...' })

    wx.cloud.callFunction({
      name: 'submitFeedback',
      data: {
        phone: this.data.phone,
        content: content
      },
      success: function (res) {
        wx.hideLoading()
        if (res.result && res.result.success) {
          wx.showToast({ title: '提交成功', icon: 'success' })
          that.setData({ content: '' })
          setTimeout(function () {
            wx.navigateBack()
          }, 1500)
        } else {
          wx.showToast({ title: (res.result && res.result.errmsg) || '提交失败', icon: 'none' })
        }
      },
      fail: function () {
        wx.hideLoading()
        wx.showToast({ title: '网络错误', icon: 'none' })
      }
    })
  }
})
