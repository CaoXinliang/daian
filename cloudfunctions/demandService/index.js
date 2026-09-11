const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

function generateOrderNo() {
  var now = new Date()
  var y = now.getFullYear()
  var m = ('' + (now.getMonth() + 1)).padStart(2, '0')
  var d = ('' + now.getDate()).padStart(2, '0')
  var rand = Math.floor(1000 + Math.random() * 9000)
  return 'DA' + y + m + d + rand
}

function formatDateTime(date) {
  var y = date.getFullYear()
  var m = ('' + (date.getMonth() + 1)).padStart(2, '0')
  var d = ('' + date.getDate()).padStart(2, '0')
  var h = ('' + date.getHours()).padStart(2, '0')
  var mi = ('' + date.getMinutes()).padStart(2, '0')
  var s = ('' + date.getSeconds()).padStart(2, '0')
  return y + '-' + m + '-' + d + ' ' + h + ':' + mi + ':' + s
}

const STATUS_MAP = {
  pending: { text: '待接单', color: '#ff9500' },
  designing: { text: '设计中', color: '#4AA39C' },
  confirming: { text: '待确认', color: '#ff6b35' },
  delivered: { text: '已交付', color: '#888888' }
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return { success: false, error: '无法获取用户标识' }
  }

  const { action, project_id, status, formData } = event

  try {
    // 提交需求
    if (action === 'submit') {
      if (!formData || !formData.service_id) {
        return { success: false, error: '请选择设计服务' }
      }
      if (!formData.budget) {
        return { success: false, error: '请选择预算区间' }
      }
      if (!formData.deadline) {
        return { success: false, error: '请选择期望交付时间' }
      }

      var orderNo = generateOrderNo()
      var now = new Date()
      var nowStr = formatDateTime(now)

      var maxSortValue = 0
      try {
        var sortRes = await db.collection('daian_projects')
          .orderBy('sortValue', 'desc')
          .limit(1)
          .get()
        if (sortRes.data && sortRes.data.length > 0 && sortRes.data[0].sortValue != null) {
          maxSortValue = sortRes.data[0].sortValue
        }
      } catch (e) {}

      var projectData = {
        order_no: orderNo,
        openid: openid,
        service_id: formData.service_id || '',
        service_name: formData.service_name || '',
        project_name: formData.project_name || '',
        budget: formData.budget || '',
        deadline: formData.deadline || '',
        description: formData.description || '',
        materials: formData.materials || [],
        status: 'pending',
        sortValue: maxSortValue + 1,
        create_time: nowStr,
        update_time: nowStr,
        designer_name: '',
        designer_avatar: '',
        deliver_files: [],
        timeline: [
          { status: 'pending', text: '需求已提交', time: nowStr, desc: '等待设计师接单', done: true }
        ]
      }

      var addResult = await db.collection('daian_projects').add({
        data: projectData
      })

      return {
        success: true,
        project_id: addResult._id,
        order_no: orderNo
      }
    }

    // 项目列表
    if (action === 'list') {
      var query = { openid: openid }
      if (status && status !== 'all') {
        query.status = status
      }

      var result = await db.collection('daian_projects')
        .where(query)
        .orderBy('create_time', 'desc')
        .limit(50)
        .get()

      var list = result.data.map(function (item) {
        var statusInfo = STATUS_MAP[item.status] || { text: '未知', color: '#999' }
        return {
          id: item._id,
          order_no: item.order_no,
          service_name: item.service_name,
          project_name: item.project_name || item.service_name,
          status: item.status,
          status_text: statusInfo.text,
          status_color: statusInfo.color,
          update_time: item.update_time,
          create_time: item.create_time
        }
      })

      return { success: true, list: list }
    }

    // 项目详情
    if (action === 'detail') {
      if (!project_id) {
        return { success: false, error: '缺少项目ID' }
      }

      var detailResult = await db.collection('daian_projects')
        .doc(project_id)
        .get()

      if (!detailResult.data || !detailResult.data._id) {
        return { success: false, error: '项目不存在' }
      }

      var proj = detailResult.data
      if (proj.openid !== openid) {
        return { success: false, error: '无权查看' }
      }

      var statusInfo = STATUS_MAP[proj.status] || { text: '未知', color: '#999' }

      return {
        success: true,
        project: {
          id: proj._id,
          order_no: proj.order_no,
          service_id: proj.service_id,
          service_name: proj.service_name,
          project_name: proj.project_name,
          budget: proj.budget,
          deadline: proj.deadline,
          description: proj.description,
          materials: proj.materials || [],
          status: proj.status,
          status_text: statusInfo.text,
          status_color: statusInfo.color,
          create_time: proj.create_time,
          update_time: proj.update_time,
          designer_name: proj.designer_name || '',
          designer_avatar: proj.designer_avatar || '',
          deliver_files: proj.deliver_files || [],
          timeline: proj.timeline || []
        }
      }
    }

    return { success: false, error: '未知操作' }
  } catch (err) {
    return { success: false, error: err.message || '操作失败' }
  }
}
