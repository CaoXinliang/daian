var storeData = require('../../utils/storeData.js')

Page({
  data: {
    navTotalHeight: 64,
    statusBarHeight: 20,
    canBack: false,
    isFavorited: false,
    storeInfo: storeData.storeInfo,
    sections: storeData.sections,
    categoryImages: {}
  },

  onLoad: function () {
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
      canBack: canBack
    })

    this.loadImages()
  },

  goBack: function () {
    wx.navigateBack()
  },

  loadImages: function () {
    var that = this

    if (!wx.cloud) {
      wx.showToast({ title: '不支持云开发', icon: 'none' })
      return
    }

    wx.cloud.callFunction({
      name: 'getStoreImages',
      success: function (res) {
        if (res.result && res.result.success) {
          that.processImages(res.result.images)
        }
      },
      fail: function (err) {
        console.error('调用云函数getStoreImages失败', err)
      }
    })
  },

  processImages: function (images) {
    var imageMap = storeData.mapImagesToCategories(images)

    var categoryImages = {}
    for (var catId in imageMap) {
      if (imageMap[catId].categoryImage) {
        categoryImages[catId] = imageMap[catId].categoryImage
      }
    }

    this.setData({
      categoryImages: categoryImages
    })

    this._imageMap = imageMap
  },

  onCategoryTap: function (e) {
    var categoryId = e.currentTarget.dataset.categoryId
    var products = storeData.getDisplayProducts(categoryId, this._imageMap)

    if (products.length === 0) {
      wx.showToast({ title: '该分类暂无产品', icon: 'none' })
      return
    }

    if (products.length === 1) {
      var product = products[0]
      wx.navigateTo({
        url: '/pages/store1detail/store1detail?categoryId=' + categoryId + '&productId=' + product.id
      })
    } else {
      wx.navigateTo({
        url: '/pages/store1sub/store1sub?categoryId=' + categoryId
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

  onCallPhone: function () {
    wx.showModal({
      title: '联系我们',
      content: '电话咨询请添加微信',
      showCancel: false
    })
  },

  onContact: function () {
    wx.showModal({
      title: '在线咨询',
      content: '请添加微信进行咨询',
      showCancel: false
    })
  },

  onLocation: function () {
    wx.showToast({ title: '店铺位置功能开发中', icon: 'none' })
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
      title: storeData.storeInfo.name + ' - ' + storeData.storeInfo.bannerTitle,
      path: '/pages/store1/store1'
    }
  }
})
