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
    goodId: '',
    good: null,
    isFavorited: false,
    previewImages: []
  },

  onLoad: function (options) {
    var productId = options.product_id || ''
    var goodId = options.good_id || ''
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
      productId: productId,
      goodId: goodId
    })
    this._nameThreshold = 0

    if (goodId) {
      this.loadGoodData(productId, goodId)
    } else {
      this.setData({ loading: false, error: '缺少商品ID' })
    }
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

  loadGoodData: function (productId, goodId) {
    var that = this

    if (app.globalData.productData && app.globalData.currentProductId === productId) {
      var allGoods = app.globalData.productData.all_goods || []
      for (var i = 0; i < allGoods.length; i++) {
        if (allGoods[i].id === goodId) {
          this.processGood(allGoods[i])
          return
        }
      }
    }

    if (!wx.cloud) {
      this.setData({ loading: false, error: '不支持云开发' })
      return
    }

    wx.cloud.callFunction({
      name: 'getProductInfo',
      data: { good_id: goodId },
      success: function (res) {
        if (res.result && res.result.success) {
          that.processGood(res.result.data)
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

  processGood: function (good) {
    var previewImages = good.all_images || []
    if (good.cover_url && previewImages.indexOf(good.cover_url) === -1) {
      previewImages.unshift(good.cover_url)
    }

    this.setData({
      loading: false,
      good: good,
      previewImages: previewImages
    })
    this.queryNamePosition()
  },

  onPreviewImage: function (e) {
    var current = e.currentTarget.dataset.src
    var urls = this.data.previewImages
    if (!current || urls.length === 0) return
    wx.previewImage({ current: current, urls: urls })
  },

  onFavorite: function () {
    this.setData({ isFavorited: !this.data.isFavorited })
    wx.showToast({
      title: this.data.isFavorited ? '已收藏' : '已取消收藏',
      icon: 'none'
    })
  },

  onMore: function () {
    var that = this
    wx.showActionSheet({
      itemList: ['刷新页面', '前往小程序首页'],
      success: function (res) {
        if (res.tapIndex === 0) {
          wx.redirectTo({
            url: '/pages/product/detail?product_id=' + that.data.productId +
              '&good_id=' + that.data.goodId
          })
        } else if (res.tapIndex === 1) {
          wx.switchTab({ url: '/pages/index/index' })
        }
      }
    })
  },

  onShareAppMessage: function () {
    var title = (this.data.good && this.data.good.name) || '商品详情'
    return {
      title: title,
      path: '/pages/product/detail?product_id=' + this.data.productId +
        '&good_id=' + this.data.goodId
    }
  }
})
