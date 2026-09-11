Page({
  data: {
    showAbout: false
  },

  onAbout: function () {
    this.setData({
      showAbout: true
    })
  },

  closeAbout: function () {
    this.setData({
      showAbout: false
    })
  },

  onUserAgreement: function () {
    wx.navigateTo({
      url: '/pages/userAgreement/userAgreement'
    })
  },

  onPrivacyPolicy: function () {
    wx.navigateTo({
      url: '/pages/privacyPolicy/privacyPolicy'
    })
  },

  preventTouchMove: function () {}
})
