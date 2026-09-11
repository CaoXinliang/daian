var app = getApp()

Page({
  data: {
    services: [],
    cases: [],
    loading: true,
    showBackBtn: false,
    showTitle: false,
    statusBarHeight: 20,
    navTotalHeight: 64
  },

  onLoad: function () {
    var sysInfo = wx.getSystemInfoSync()
    var statusBarHeight = sysInfo.statusBarHeight || 20
    var navTotalHeight = statusBarHeight + 44
    try {
      var menuButton = wx.getMenuButtonBoundingClientRect()
      if (menuButton && menuButton.bottom) {
        navTotalHeight = menuButton.bottom + (menuButton.top - statusBarHeight)
      }
    } catch (e) {}
    this.setData({ statusBarHeight: statusBarHeight, navTotalHeight: navTotalHeight })

    this.loadServices()
    this.loadCases()
  },

  onShow: function () {
    var returnData = app.globalData.returnToTemplate
    if (returnData && returnData.productId) {
      this.setData({ showBackBtn: true })
    } else {
      this.setData({ showBackBtn: false })
    }
  },

  onPageScroll: function (e) {
    var threshold = 200
    if (e.scrollTop > threshold && !this.data.showTitle) {
      this.setData({ showTitle: true })
    } else if (e.scrollTop <= threshold && this.data.showTitle) {
      this.setData({ showTitle: false })
    }
  },

  loadServices: function () {
    var that = this
    if (!wx.cloud) {
      this.setData({ loading: false })
      return
    }

    wx.cloud.callFunction({
      name: 'designService',
      data: { action: 'list' },
      success: function (res) {
        if (res.result && res.result.success) {
          that.setData({
            services: res.result.services || []
          })
        }
      }
    })
  },

  loadCases: function () {
    var that = this
    if (!wx.cloud) {
      this.setData({ loading: false })
      return
    }

    wx.cloud.callFunction({
      name: 'getProductInfo',
      data: { action: 'list' },
      success: function (res) {
        if (res.result && res.result.success) {
          var products = (res.result.products || []).map(function (p) {
            return {
              id: p._id,
              title: p.title || '未命名产品',
              cover: p.banner || '',
              product_id: p._id
            }
          })
          that.setData({
            cases: products,
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

  onServiceTap: function (e) {
    var id = e.currentTarget.dataset.id
    if (!id) return
    wx.navigateTo({
      url: '/pages/service/detail?id=' + id
    })
  },

  onCaseTap: function (e) {
    var productId = e.currentTarget.dataset.pid
    if (!productId) return
    wx.navigateTo({
      url: '/pages/product/template?product_id=' + productId
    })
  },

  goBackToTemplate: function () {
    var returnData = app.globalData.returnToTemplate
    app.globalData.returnToTemplate = null
    if (returnData && returnData.productId) {
      if (returnData.fromStart) {
        wx.reLaunch({
          url: '/pages/product/template?product_id=' + returnData.productId
        })
      } else {
        wx.navigateTo({
          url: '/pages/product/template?product_id=' + returnData.productId
        })
      }
    }
  },

  onSubmitDemand: function () {
    wx.navigateTo({ url: '/pages/demand/form' })
  },

  onShareAppMessage: function () {
    return {
      title: '岱安传媒 - 实体店商业赋能专家',
      path: '/pages/index/index'
    }
  },

  onShareTimeline: function () {
    return {
      title: '岱安传媒 - 实体店商业赋能专家',
      query: ''
    }
  }
})
