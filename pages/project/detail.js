Page({
  data: {
    loading: true,
    project: null
  },

  onLoad: function (options) {
    var projectId = options.id || ''
    if (projectId) {
      this.loadDetail(projectId)
    } else {
      this.setData({ loading: false })
    }
  },

  loadDetail: function (projectId) {
    var that = this
    wx.cloud.callFunction({
      name: 'demandService',
      data: { action: 'detail', project_id: projectId },
      success: function (res) {
        if (res.result && res.result.success) {
          that.setData({ loading: false, project: res.result.project })
        } else {
          that.setData({ loading: false })
          wx.showToast({
            title: (res.result && res.result.error) || '加载失败',
            icon: 'none'
          })
        }
      },
      fail: function () {
        that.setData({ loading: false })
      }
    })
  },

  previewMaterial: function (e) {
    var url = e.currentTarget.dataset.url
    var urls = this.data.project && this.data.project.materials
    if (!url || !urls || urls.length === 0) return
    wx.previewImage({ current: url, urls: urls })
  },

  previewDeliver: function (e) {
    var url = e.currentTarget.dataset.url
    var urls = this.data.project && this.data.project.deliver_files
    if (!url || !urls || urls.length === 0) return
    wx.previewImage({ current: url, urls: urls })
  },

  contactDesigner: function () {
    wx.showToast({ title: '请等待设计师联系', icon: 'none' })
  },

  goBack: function () {
    wx.navigateBack()
  },

  onShareAppMessage: function () {
    var proj = this.data.project
    return {
      title: proj ? proj.project_name : '项目详情',
      path: '/pages/project/detail?id=' + (proj ? proj.id : '')
    }
  }
})
