var app = getApp()

Page({
  data: {
    tabs: [
      { key: 'all', text: '全部' },
      { key: 'pending', text: '待接单' },
      { key: 'designing', text: '设计中' },
      { key: 'confirming', text: '待确认' },
      { key: 'delivered', text: '已交付' }
    ],
    activeTab: 'all',
    loading: true,
    list: []
  },

  onLoad: function () {
    this.loadList()
  },

  onShow: function () {
    if (this._needRefresh) {
      this._needRefresh = false
      this.loadList()
    }
  },

  onTabTap: function (e) {
    var key = e.currentTarget.dataset.key
    if (key === this.data.activeTab) return
    this.setData({ activeTab: key, loading: true, list: [] })
    this.loadList()
  },

  loadList: function () {
    var that = this
    if (!wx.cloud) {
      this.setData({ loading: false })
      return
    }

    wx.cloud.callFunction({
      name: 'demandService',
      data: { action: 'list', status: this.data.activeTab },
      success: function (res) {
        if (res.result && res.result.success) {
          that.setData({
            list: res.result.list || [],
            loading: false
          })
        } else {
          that.setData({ loading: false })
        }
      },
      fail: function () {
        that.setData({ loading: false })
      }
    })
  },

  onProjectTap: function (e) {
    var id = e.currentTarget.dataset.id
    if (!id) return
    this._needRefresh = true
    wx.navigateTo({ url: '/pages/project/detail?id=' + id })
  },

  goBack: function () {
    wx.navigateBack()
  },

  onPullDownRefresh: function () {
    var that = this
    this.loadList()
    setTimeout(function () {
      wx.stopPullDownRefresh()
    }, 500)
  },

  onShareAppMessage: function () {
    return { title: '我的项目', path: '/pages/project/list' }
  }
})
