const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

const DEFAULT_SERVICES = [
  {
    _id: 'svc_local_life',
    name: '本地生活',
    desc: '帮本地商家搭建线上引流、到店核销运营体系',
    price_min: 999,
    price_max: 9999,
    delivery_days: 7,
    cover: '',
    sort: 1,
    features: [
      '本地化线上引流方案',
      '到店核销系统搭建',
      '门店运营全流程指导',
      '本地生活场景获客提升'
    ],
    detail_images: [],
    process: [
      { title: '门店诊断', desc: '分析门店现状，定位获客痛点' },
      { title: '方案设计', desc: '定制本地化线上引流策略' },
      { title: '系统搭建', desc: '搭建到店核销运营体系' },
      { title: '运营指导', desc: '全流程陪跑，持续优化' }
    ]
  },
  {
    _id: 'svc_boss_ip',
    name: '老板IP',
    desc: '为实体店老板打造个人品牌IP，带动门店客流',
    price_min: 2999,
    price_max: 19999,
    delivery_days: 15,
    cover: '',
    sort: 2,
    features: [
      '个人品牌定位与包装',
      '内容打造与发布',
      '流量运营与粉丝增长',
      'IP效应带动门店客流'
    ],
    detail_images: [],
    process: [
      { title: 'IP定位', desc: '挖掘老板个人特色，确立品牌方向' },
      { title: '内容规划', desc: '制定内容策略和发布计划' },
      { title: '流量运营', desc: '多渠道内容分发，持续涨粉' },
      { title: '变现转化', desc: 'IP影响力转化为门店客流' }
    ]
  },
  {
    _id: 'svc_ai_customer',
    name: 'AI获客',
    desc: '借助AI技术工具，实现自动化精准获客',
    price_min: 1999,
    price_max: 9999,
    delivery_days: 5,
    cover: '',
    sort: 3,
    features: [
      'AI精准客户画像',
      '自动化获客工具部署',
      '降低人工获客成本',
      '提升获客效率和精准度'
    ],
    detail_images: [],
    process: [
      { title: '需求分析', desc: '了解目标客户群体和获客场景' },
      { title: '工具部署', desc: '配置AI获客工具和流程' },
      { title: '测试优化', desc: '小范围测试，优化获客策略' },
      { title: '全面上线', desc: '正式运行，持续监控效果' }
    ]
  },
  {
    _id: 'svc_mini_program',
    name: '小程序开发',
    desc: '定制开发各类小程序：广告设计、门店预约、电商等',
    price_min: 2999,
    price_max: 29999,
    delivery_days: 30,
    cover: '',
    sort: 4,
    features: [
      '定制化需求开发',
      '适配商家各类场景',
      '前后端全栈开发',
      '持续维护与迭代'
    ],
    detail_images: [],
    process: [
      { title: '需求梳理', desc: '了解商家业务需求和功能规划' },
      { title: 'UI设计', desc: '设计界面和交互流程' },
      { title: '开发实现', desc: '前后端编码开发，功能联调' },
      { title: '上线维护', desc: '部署上线，持续维护迭代' }
    ]
  }
]

const DEFAULT_CASES = [
  { id: 'case1', title: '南康家具店本地生活运营', cover: '', service_id: 'svc_local_life' },
  { id: 'case2', title: '餐饮老板个人IP打造', cover: '', service_id: 'svc_boss_ip' },
  { id: 'case3', title: '美业门店AI获客系统', cover: '', service_id: 'svc_ai_customer' }
]

exports.main = async (event, context) => {
  const { action, service_id } = event

  try {
    let services = []
    try {
      const result = await db.collection('daian_design_services')
        .orderBy('sort', 'asc')
        .limit(50)
        .get()
      services = result.data
    } catch (e) {
      // 表不存在，使用默认数据
    }

    if (action === 'list') {
      let list = services.length > 0 ? services : DEFAULT_SERVICES
      let cases = DEFAULT_CASES
      return {
        success: true,
        services: list.map(function (s) {
          return {
            id: s._id,
            name: s.name,
            desc: s.desc,
            price_min: s.price_min,
            price_max: s.price_max,
            delivery_days: s.delivery_days,
            cover: s.cover || ''
          }
        }),
        cases: cases
      }
    }

    if (action === 'detail') {
      if (!service_id) {
        return { success: false, error: '缺少服务ID' }
      }
      let detail = null
      if (services.length > 0) {
        for (var i = 0; i < services.length; i++) {
          if (services[i]._id === service_id) {
            detail = services[i]
            break
          }
        }
      }
      if (!detail) {
        for (var j = 0; j < DEFAULT_SERVICES.length; j++) {
          if (DEFAULT_SERVICES[j]._id === service_id) {
            detail = DEFAULT_SERVICES[j]
            break
          }
        }
      }
      if (!detail) {
        return { success: false, error: '服务不存在' }
      }
      return {
        success: true,
        service: {
          id: detail._id,
          name: detail.name,
          desc: detail.desc,
          price_min: detail.price_min,
          price_max: detail.price_max,
          delivery_days: detail.delivery_days,
          cover: detail.cover || '',
          features: detail.features || [],
          detail_images: detail.detail_images || [],
          process: detail.process || []
        }
      }
    }

    return { success: false, error: '未知操作' }
  } catch (err) {
    return { success: false, error: err.message || '操作失败' }
  }
}
