App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      return;
    }
    wx.cloud.init({
      env: 'cloud1-d8gk6u62fe4b07338',
      traceUser: true
    });
  },

  globalData: {
    userInfo: null,
    productData: null,
    currentProductId: '',
    returnToTemplate: null
  },

  // 检查登录状态
  checkLogin: function () {
    var userInfo = wx.getStorageSync('userInfo');
    if (userInfo && userInfo.phone) {
      this.globalData.userInfo = userInfo;
      return true;
    }
    return false;
  },

  // 获取用户信息
  getUserInfo: function () {
    return wx.getStorageSync('userInfo') || null;
  },

  // 设置用户信息
  setUserInfo: function (userInfo) {
    this.globalData.userInfo = userInfo;
    wx.setStorageSync('userInfo', userInfo);
  },

  // 退出登录
  logout: function () {
    this.globalData.userInfo = null;
    wx.removeStorageSync('userInfo');
  }
})
