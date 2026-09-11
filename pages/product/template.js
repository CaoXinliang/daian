var app = getApp()

Page({
  data: {
    statusBarHeight: 20,
    navTotalHeight: 64,
    canBack: false,
    navBarVisible: false,
    loading: true,
    error: '',
    productId: '',
    productData: null,
    isFavorited: false,
    showEmailModal: false
  },

  onLoad: function (options) {
    var productId = options.product_id || ''
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
    this._nameThreshold = 0

    if (productId) {
      this.loadProductData(productId)
    } else {
      this.setData({ loading: false, error: '缺少产品ID' })
    }
  },

  onPageScroll: function (res) {
    var threshold = this._nameThreshold || 0
    var navHeight = this.data.navTotalHeight
    var scrollTop = res.scrollTop
    var shouldShow = scrollTop > (threshold - navHeight)

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

  loadProductData: function (productId) {
    var that = this
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
          that.setData({ loading: false, productData: data })
          that.queryNamePosition()
          that.checkFavorite(productId, data.title, data.banner_url)
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

  checkFavorite: function (productId, title, banner) {
    var that = this
    this._favTitle = title || ''
    this._favBanner = banner || ''
    wx.cloud.callFunction({
      name: 'favoriteService',
      data: { action: 'check', product_id: productId },
      success: function (res) {
        if (res.result && res.result.success) {
          that.setData({ isFavorited: res.result.favorited })
        }
      }
    })
  },

  onTypeTap: function (e) {
    var index = e.currentTarget.dataset.index
    var productData = this.data.productData
    if (!productData || !productData.product_types[index]) return

    var pt = productData.product_types[index]
    var goods = pt.goods || []

    if (goods.length === 1) {
      wx.navigateTo({
        url: '/pages/product/detail?product_id=' + this.data.productId +
          '&good_id=' + goods[0].id
      })
    } else {
      wx.navigateTo({
        url: '/pages/product/list?product_id=' + this.data.productId +
          '&type=pt&index=' + index
      })
    }
  },

  onGoodTap: function (e) {
    var goodId = e.currentTarget.dataset.id
    if (!goodId) return
    wx.navigateTo({
      url: '/pages/product/detail?product_id=' + this.data.productId +
        '&good_id=' + goodId
    })
  },

  onCallPhone: function () {
    var phone = this.data.productData && this.data.productData.contact_phone
    if (!phone) return
    wx.makePhoneCall({ phoneNumber: phone })
  },

  onSendEmail: function () {
    var email = this.data.productData && this.data.productData.contact_email
    if (!email) return
    this.setData({ showEmailModal: true })
  },

  closeEmailModal: function () {
    this.setData({ showEmailModal: false })
  },

  copyEmail: function () {
    var email = this.data.productData && this.data.productData.contact_email
    if (!email) return
    var that = this
    wx.setClipboardData({
      data: email,
      success: function () {
        wx.showToast({ title: '邮箱已复制', icon: 'none' })
        that.setData({ showEmailModal: false })
      }
    })
  },

  onNavigate: function () {
    var address = this.data.productData && this.data.productData.contact_address
    if (!address) return
    wx.openLocation({
      latitude: 0,
      longitude: 0,
      name: address,
      address: address,
      scale: 18
    })
  },

  onFavorite: function () {
    var that = this
    var productId = this.data.productId
    if (!productId) return

    wx.cloud.callFunction({
      name: 'favoriteService',
      data: {
        action: 'toggle',
        product_id: productId,
        product_title: this._favTitle || '',
        product_banner: this._favBanner || ''
      },
      success: function (res) {
        if (res.result && res.result.success) {
          var favorited = res.result.favorited
          that.setData({ isFavorited: favorited })
          wx.showToast({
            title: favorited ? '已收藏' : '已取消收藏',
            icon: 'none'
          })
        } else {
          wx.showToast({ title: '操作失败', icon: 'none' })
        }
      },
      fail: function () {
        wx.showToast({ title: '网络错误', icon: 'none' })
      }
    })
  },

  onMore: function () {
    var that = this
    wx.showActionSheet({
      itemList: ['刷新页面', '前往小程序首页'],
      success: function (res) {
        if (res.tapIndex === 0) {
          wx.redirectTo({
            url: '/pages/product/template?product_id=' + that.data.productId
          })
        } else if (res.tapIndex === 1) {
          var pages = getCurrentPages()
          app.globalData.returnToTemplate = {
            productId: that.data.productId,
            fromStart: pages.length === 1
          }
          if (pages.length > 1) {
            wx.navigateBack()
          } else {
            wx.switchTab({ url: '/pages/index/index' })
          }
        }
      }
    })
  },

  onShareAppMessage: function () {
    var title = (this.data.productData && this.data.productData.title) || '产品展示'
    return {
      title: title,
      path: '/pages/product/template?product_id=' + this.data.productId
    }
  },

  onShareTimeline: function () {
    var title = (this.data.productData && this.data.productData.title) || '产品展示'
    return {
      title: title,
      query: 'product_id=' + this.data.productId
    }
  }
})
