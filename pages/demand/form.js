var app = getApp()

var BUDGET_OPTIONS = [
  { value: '500以下', label: '500元以下' },
  { value: '500-1000', label: '500-1000元' },
  { value: '1000-3000', label: '1000-3000元' },
  { value: '3000-5000', label: '3000-5000元' },
  { value: '5000-10000', label: '5000-10000元' },
  { value: '10000以上', label: '10000元以上' }
]

Page({
  data: {
    serviceId: '',
    serviceName: '',
    services: [],
    serviceIndex: 0,
    projectName: '',
    budgetOptions: BUDGET_OPTIONS,
    budgetIndex: 0,
    deadline: '',
    description: '',
    materials: [],
    submitting: false
  },

  onLoad: function (options) {
    var serviceId = options.service_id || ''
    var serviceName = options.service_name || ''

    this.setData({
      serviceId: serviceId,
      serviceName: decodeURIComponent(serviceName || '')
    })

    this.loadServices(serviceId)
  },

  loadServices: function (currentServiceId) {
    var that = this
    wx.cloud.callFunction({
      name: 'designService',
      data: { action: 'list' },
      success: function (res) {
        if (res.result && res.result.success) {
          var services = res.result.services || []
          var idx = 0
          if (currentServiceId) {
            for (var i = 0; i < services.length; i++) {
              if (services[i].id === currentServiceId) {
                idx = i
                break
              }
            }
          }
          that.setData({ services: services, serviceIndex: idx })
        }
      }
    })
  },

  onServiceChange: function (e) {
    var idx = parseInt(e.detail.value)
    var svc = this.data.services[idx]
    this.setData({
      serviceIndex: idx,
      serviceId: svc ? svc.id : '',
      serviceName: svc ? svc.name : ''
    })
  },

  onProjectNameInput: function (e) {
    this.setData({ projectName: e.detail.value })
  },

  onBudgetChange: function (e) {
    this.setData({ budgetIndex: parseInt(e.detail.value) })
  },

  onDeadlineChange: function (e) {
    this.setData({ deadline: e.detail.value })
  },

  onDescInput: function (e) {
    this.setData({ description: e.detail.value })
  },

  chooseImages: function () {
    var that = this
    var remaining = 9 - this.data.materials.length
    if (remaining <= 0) {
      wx.showToast({ title: '最多上传9张', icon: 'none' })
      return
    }
    wx.chooseImage({
      count: remaining,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        var newFiles = res.tempFilePaths.map(function (p, i) {
          return {
            id: 'img_' + Date.now() + '_' + i,
            tempPath: p
          }
        })
        var materials = that.data.materials.concat(newFiles)
        that.setData({ materials: materials })
      }
    })
  },

  previewImage: function (e) {
    var index = e.currentTarget.dataset.index
    var urls = this.data.materials.map(function (m) { return m.tempPath })
    wx.previewImage({ current: urls[index], urls: urls })
  },

  removeImage: function (e) {
    var id = e.currentTarget.dataset.id
    var materials = this.data.materials.filter(function (m) { return m.id !== id })
    this.setData({ materials: materials })
  },

  uploadAllImages: function () {
    var that = this
    return new Promise(function (resolve, reject) {
      var materials = that.data.materials
      if (materials.length === 0) {
        resolve([])
        return
      }

      var uploaded = 0
      var fileIds = []
      var failed = false

      materials.forEach(function (file, idx) {
        var cloudPath = 'demand/' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substr(2, 8) + '.jpg'
        wx.cloud.uploadFile({
          cloudPath: cloudPath,
          filePath: file.tempPath,
          success: function (res) {
            if (failed) return
            fileIds[idx] = res.fileID
            uploaded++
            if (uploaded === materials.length) {
              resolve(fileIds.filter(function (f) { return f }))
            }
          },
          fail: function () {
            if (failed) return
            failed = true
            reject(new Error('图片上传失败'))
          }
        })
      })
    })
  },

  onSubmit: function () {
    if (this.data.submitting) return

    if (!this.data.serviceId) {
      wx.showToast({ title: '请选择设计服务', icon: 'none' })
      return
    }
    if (!this.data.projectName.trim()) {
      wx.showToast({ title: '请输入项目名称', icon: 'none' })
      return
    }
    if (!this.data.deadline) {
      wx.showToast({ title: '请选择期望交付时间', icon: 'none' })
      return
    }

    var that = this
    this.setData({ submitting: true })
    wx.showLoading({ title: '提交中...', mask: true })

    this.uploadAllImages()
      .then(function (fileIds) {
        var budget = BUDGET_OPTIONS[that.data.budgetIndex].value

        wx.cloud.callFunction({
          name: 'demandService',
          data: {
            action: 'submit',
            formData: {
              service_id: that.data.serviceId,
              service_name: that.data.serviceName,
              project_name: that.data.projectName.trim(),
              budget: budget,
              deadline: that.data.deadline,
              description: that.data.description.trim(),
              materials: fileIds
            }
          },
          success: function (res) {
            wx.hideLoading()
            that.setData({ submitting: false })
            if (res.result && res.result.success) {
              wx.redirectTo({
                url: '/pages/demand/success?order_no=' + res.result.order_no +
                  '&project_id=' + res.result.project_id
              })
            } else {
              wx.showToast({
                title: (res.result && res.result.error) || '提交失败',
                icon: 'none'
              })
            }
          },
          fail: function () {
            wx.hideLoading()
            that.setData({ submitting: false })
            wx.showToast({ title: '网络错误', icon: 'none' })
          }
        })
      })
      .catch(function () {
        wx.hideLoading()
        that.setData({ submitting: false })
        wx.showToast({ title: '图片上传失败，请重试', icon: 'none' })
      })
  },

  onShareAppMessage: function () {
    return { title: '提交设计需求', path: '/pages/demand/form' }
  }
})
