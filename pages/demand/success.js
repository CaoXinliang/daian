Page({
  data: {
    orderNo: '',
    projectId: ''
  },

  onLoad: function (options) {
    this.setData({
      orderNo: options.order_no || '',
      projectId: options.project_id || ''
    })
  },

  goToProjects: function () {
    wx.redirectTo({ url: '/pages/project/list' })
  },

  goHome: function () {
    wx.switchTab({ url: '/pages/index/index' })
  },

  onShareAppMessage: function () {
    return { title: '需求提交成功', path: '/pages/index/index' }
  }
})
