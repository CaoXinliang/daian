var storeData = require('../../utils/storeData.js')

Page({
  data: {
    navTotalHeight: 64,
    statusBarHeight: 20,
    categoryId: '',
    productId: '',
    product: {
      name: '',
      specs: []
    },
    heroImage: '',
    detailImages: [],
    allImages: [],
    isFavorited: false
  },

  onLoad: function (options) {
    var categoryId = options.categoryId || ''
    var productId = options.productId || ''

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
      productId: productId
    })

    this.loadProduct()
  },

  goBack: function () {
    wx.navigateBack()
  },

  loadProduct: function () {
    var that = this

    if (!wx.cloud) {
      that.updateProduct(null)
      return
    }

    wx.cloud.callFunction({
      name: 'getStoreImages',
      success: function (res) {
        if (res.result && res.result.success) {
          var imageMap = storeData.mapImagesToCategories(res.result.images)
          that.updateProduct(imageMap)
        } else {
          that.updateProduct(null)
        }
      },
      fail: function (err) {
        console.error('调用云函数getStoreImages失败', err)
        that.updateProduct(null)
      }
    })
  },

  updateProduct: function (imageMap) {
    var detail = storeData.getDisplayProductDetail(this.data.categoryId, this.data.productId, imageMap)

    var heroImage = ''
    var detailImages = []
    var allImages = []

    if (detail.images && detail.images.length > 0) {
      heroImage = detail.images[0]
      detailImages = detail.images.slice(1)
      allImages = detail.images.slice()
    }

    this.setData({
      product: {
        name: detail.name,
        specs: detail.specs || []
      },
      heroImage: heroImage,
      detailImages: detailImages,
      allImages: allImages
    })
  },

  previewImage: function (e) {
    var index = e.currentTarget.dataset.index
    if (this.data.allImages.length === 0) return

    if (wx.previewMedia) {
      var sources = this.data.allImages.map(function (url) {
        return { url: url, type: 'image' }
      })
      wx.previewMedia({
        current: index,
        sources: sources
      })
    } else {
      wx.previewImage({
        current: this.data.allImages[index] || this.data.allImages[0],
        urls: this.data.allImages
      })
    }
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
      title: this.data.product.name,
      path: '/pages/store1detail/store1detail?categoryId=' + this.data.categoryId + '&productId=' + this.data.productId
    }
  }
})
