function formatTime(date) {
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate()
  var hour = date.getHours()
  var minute = date.getMinutes()
  var second = date.getSeconds()

  month = month < 10 ? '0' + month : month
  day = day < 10 ? '0' + day : day
  hour = hour < 10 ? '0' + hour : hour
  minute = minute < 10 ? '0' + minute : minute
  second = second < 10 ? '0' + second : second

  return year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second
}

Page({
  handleGetPhone: function (e) {
    if (e.detail.errMsg !== 'getPhoneNumber:ok') {
      wx.showToast({ title: '需要授权手机号才能登录', icon: 'none' })
      return
    }

    var code = e.detail.code
    if (!code) {
      wx.showToast({ title: '获取手机号凭证失败', icon: 'none' })
      return
    }

    wx.showLoading({ title: '登录中...' })

    wx.cloud.callFunction({
      name: 'getPhone',
      data: { code: code },
      success: function (res) {
        var result = res.result
        if (!result.success || !result.phone) {
          wx.hideLoading()
          wx.showToast({ title: result.errmsg || '获取手机号失败', icon: 'none' })
          return
        }

        var phone = result.phone
        var db = wx.cloud.database()

        db.collection('users').where({ phone: phone }).get({
          success: function (res) {
            if (res.data.length > 0) {
              var user = res.data[0]
              wx.setStorageSync('currentUser', {
                phone: user.phone,
                nickname: user.nickname
              })
              wx.hideLoading()
              wx.showToast({ title: '登录成功', icon: 'success' })
              setTimeout(function () {
                wx.redirectTo({ url: '/pages/index/index' })
              }, 1500)
            } else {
              db.collection('users').add({
                data: {
                  phone: phone,
                  nickname: '用户' + phone.slice(-4),
                  createTime: formatTime(new Date())
                },
                success: function () {
                  wx.setStorageSync('currentUser', {
                    phone: phone,
                    nickname: '用户' + phone.slice(-4)
                  })
                  wx.hideLoading()
                  wx.showToast({ title: '注册并登录成功', icon: 'success' })
                  setTimeout(function () {
                    wx.redirectTo({ url: '/pages/index/index' })
                  }, 1500)
                },
                fail: function (err) {
                  wx.hideLoading()
                  wx.showToast({ title: '注册失败，请重试', icon: 'none' })
                  console.error('注册失败:', err)
                }
              })
            }
          },
          fail: function (err) {
            wx.hideLoading()
            wx.showToast({ title: '网络错误，请重试', icon: 'none' })
            console.error('查询失败:', err)
          }
        })
      },
      fail: function (err) {
        wx.hideLoading()
        wx.showToast({ title: '获取手机号失败', icon: 'none' })
        console.error('云函数调用失败:', err)
      }
    })
  }
})
