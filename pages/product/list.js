var app = getApp()

Page({
  data: {
    statusBarHeight: 20,
    navTotalHeight: 64,
    canBack: true,
    navBarVisible: false,
    loading: true,
    error: '',
    productId: '',
    categoryName: '',
    goods: []
  },

  onLoad: function (options) {
    var productId = options.product_id || ''
    var type = options.type || 'pt'
    var index = parseInt(options.index || '0', 10)
    var pages = getCurrentPages()
    var canBack = pages.length > 1

    var sysInfo = wx.getSystemInfoSync()
    var statusBarHeight = sysInfo.statusBarHeight || 20
    var navTotalHeight = statusBarHeight + 44

    try {
      var menuButton = wx.getMenuButtonBoundingClientRect()
      if (menuButton && menuButton.bottom) {
        navTotalHeight = menuButton.bottom + (menuButton.top - statusBarHeight)
      }
    } catch (e) {}

    this.setData({
      statusBarHeight: statusBarHeight,
      navTotalHeight: navTotalHeight,
      canBack: canBack,
      productId: productId
    })
    this._type = type
    this._index = index
    this._nameThreshold = 0

    this.loadData(productId, type, index)
  },

  onPageScroll: function (res) {
    var threshold = this._nameThreshold || 0
    var navHeight = this.data.navTotalHeight
    var shouldShow = res.scrollTop > (threshold - navHeight)

    if (shouldShow !== this.data.navBarVisible) {
      this.setData({ navBarVisible: shouldShow })
    }
  },

  queryNamePosition: function () {
    var that = this
    setTimeout(function () {
      wx.createSelectorQuery()
        .select('.page-name')
        .boundingClientRect(function (rect) {
          if (rect) {
            that._nameThreshold = rect.bottom
          }
        })
        .exec()
    }, 300)
  },

  goBack: function () {
    wx.navigateBack()
  },

  loadData: function (productId, type, index) {
    var that = this

    if (app.globalData.productData && app.globalData.currentProductId === productId) {
      this.processData(app.globalData.productData, type, index)
      return
    }

    if (!wx.cloud) {
      this.setData({ loading: false, error: '不支持云开发' })
      return
    }

    wx.cloud.callFunction({
      name: 'getProductInfo',
      data: { product_id: productId },
      success: function (res) {
        if (res.result && res.result.success) {
          var data = res.result.data
          app.globalData.productData = data
          app.globalData.currentProductId = productId
          that.processData(data, type, index)
        } else {
          that.setData({
            loading: false,
            error: (res.result && res.result.error) || '加载失败'
          })
        }
      },
      fail: function () {
        that.setData({ loading: false, error: '网络错误，请重试' })
      }
    })
  },

  processData: function (data, type, index) {
    var categoryName = ''
    var goods = []

    if (type === 'pt') {
      var pt = data.product_types && data.product_types[index]
      if (pt) {
        categoryName = pt.name
        goods = pt.goods || []
      }
    } else {
      var ps = data.product_series && data.product_series[index]
      if (ps) {
        categoryName = ps.name
        goods = ps.goods || []
      }
    }

    this.setData({
      loading: false,
      categoryName: categoryName,
      goods: goods
    })
    this.queryNamePosition()
  },

  onGoodTap: function (e) {
    var goodId = e.currentTarget.dataset.id
    if (!goodId) return

    wx.navigateTo({
      url: '/pages/product/detail?product_id=' + this.data.productId +
        '&good_id=' + goodId
    })
  },

  onShareAppMessage: function () {
    return {
      title: this.data.categoryName || '商品列表',
      path: '/pages/product/list?product_id=' + this.data.productId +
        '&type=' + this._type + '&index=' + this._index
    }
  }
})
