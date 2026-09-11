Page({
  data: {
    loading: true,
    error: '',
    service: null
  },

  onLoad: function (options) {
    var serviceId = options.id || ''
    if (serviceId) {
      this.loadDetail(serviceId)
    } else {
      this.setData({ loading: false, error: '缺少服务ID' })
    }
  },

  loadDetail: function (serviceId) {
    var that = this
    wx.cloud.callFunction({
      name: 'designService',
      data: { action: 'detail', service_id: serviceId },
      success: function (res) {
        if (res.result && res.result.success) {
          that.setData({ loading: false, service: res.result.service })
          wx.setNavigationBarTitle({
            title: res.result.service.name || '服务详情'
          })
        } else {
          that.setData({
            loading: false,
            error: (res.result && res.result.error) || '加载失败'
          })
        }
      },
      fail: function () {
        that.setData({ loading: false, error: '网络错误' })
      }
    })
  },

  onSubmitDemand: function () {
    var svc = this.data.service
    if (!svc) return
    wx.navigateTo({
      url: '/pages/demand/form?service_id=' + svc.id + '&service_name=' + encodeURIComponent(svc.name)
    })
  },

  goBack: function () {
    wx.navigateBack()
  },

  onShareAppMessage: function () {
    var svc = this.data.service
    return {
      title: svc ? svc.name : '设计服务',
      path: '/pages/service/detail?id=' + (svc ? svc.id : '')
    }
  }
})
