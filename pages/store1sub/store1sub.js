var storeData = require('../../utils/storeData.js')

Page({
  data: {
    navTotalHeight: 64,
    statusBarHeight: 20,
    categoryId: '',
    categoryName: '',
    products: [],
    isFavorited: false
  },

  onLoad: function (options) {
    var categoryId = options.categoryId || ''
    var categoryName = storeData.getCategoryName(categoryId)

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
      categoryId: categoryId,
      categoryName: categoryName
    })

    this.loadImages()
  },

  goBack: function () {
    wx.navigateBack()
  },

  loadImages: function () {
    var that = this

    if (!wx.cloud) {
      that.updateProducts(null)
      return
    }

    wx.cloud.callFunction({
      name: 'getStoreImages',
      success: function (res) {
        if (res.result && res.result.success) {
          var imageMap = storeData.mapImagesToCategories(res.result.images)
          that.updateProducts(imageMap)
        } else {
          that.updateProducts(null)
        }
      },
      fail: function (err) {
        console.error('调用云函数getStoreImages失败', err)
        that.updateProducts(null)
      }
    })
  },

  updateProducts: function (imageMap) {
    var products = storeData.getDisplayProducts(this.data.categoryId, imageMap)
    this.setData({ products: products })
  },

  onProductTap: function (e) {
    var productId = e.currentTarget.dataset.productId
    wx.navigateTo({
      url: '/pages/store1detail/store1detail?categoryId=' + this.data.categoryId + '&productId=' + productId
    })
  },

  onFavorite: function () {
    this.setData({ isFavorited: !this.data.isFavorited })
    wx.showToast({
      title: this.data.isFavorited ? '已收藏' : '已取消收藏',
      icon: 'none'
    })
  },

  onMore: function () {
    wx.showActionSheet({
      itemList: ['复制链接', '投诉反馈'],
      success: function (res) {
        if (res.tapIndex === 0) {
          wx.setClipboardData({ data: '小程序店铺链接' })
        } else if (res.tapIndex === 1) {
          wx.navigateTo({ url: '/pages/feedback/feedback' })
        }
      }
    })
  },

  onShareAppMessage: function () {
    return {
      title: storeData.storeInfo.name + ' - ' + this.data.categoryName,
      path: '/pages/store1sub/store1sub?categoryId=' + this.data.categoryId
    }
  }
})
