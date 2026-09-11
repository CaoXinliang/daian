function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    var d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    var y = d.getFullYear()
    var m = ('' + (d.getMonth() + 1)).padStart(2, '0')
    var day = ('' + d.getDate()).padStart(2, '0')
    var h = ('' + d.getHours()).padStart(2, '0')
    var mi = ('' + d.getMinutes()).padStart(2, '0')
    return y + '-' + m + '-' + day + ' ' + h + ':' + mi
  } catch (e) {
    return ''
  }
}

Page({
  data: {
    statusBarHeight: 20,
    navTotalHeight: 64,
    loading: true,
    favorites: []
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
    this.loadFavorites()
  },

  onShow: function () {
    if (this._needRefresh) {
      this._needRefresh = false
      this.loadFavorites()
    }
  },

  loadFavorites: function () {
    var that = this
    if (!wx.cloud) {
      this.setData({ loading: false })
      return
    }

    wx.cloud.callFunction({
      name: 'favoriteService',
      data: { action: 'list' },
      success: function (res) {
        if (res.result && res.result.success) {
          var favorites = (res.result.favorites || []).map(function (item) {
            return {
              id: item.id,
              product_id: item.product_id,
              product_title: item.product_title,
              product_banner: item.product_banner,
              create_time: formatDate(item.create_time)
            }
          })
          that.setData({ loading: false, favorites: favorites })
        } else {
          that.setData({ loading: false })
        }
      },
      fail: function () {
        that.setData({ loading: false })
      }
    })
  },

  onFavoriteTap: function (e) {
    var productId = e.currentTarget.dataset.id
    if (!productId) return
    wx.navigateTo({
      url: '/pages/product/template?product_id=' + productId
    })
  },

  onRemoveFavorite: function (e) {
    var that = this
    var productId = e.currentTarget.dataset.id
    var index = e.currentTarget.dataset.index
    if (!productId) return

    var favorites = that.data.favorites.slice()
    favorites.splice(index, 1)
    that.setData({ favorites: favorites })

    wx.cloud.callFunction({
      name: 'favoriteService',
      data: {
        action: 'toggle',
        product_id: productId
      },
      success: function (res2) {
        if (res2.result && res2.result.success) {
          wx.showToast({ title: '已取消收藏', icon: 'none' })
        } else {
          that.loadFavorites()
        }
      },
      fail: function () {
        that.loadFavorites()
      }
    })
  },

  goBack: function () {
    wx.navigateBack()
  },

  onShareAppMessage: function () {
    return { title: '我的收藏', path: '/pages/favorites/favorites' }
  }
})
