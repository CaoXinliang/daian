const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const action = event.action || ''
  const productId = event.product_id || ''
  const goodId = event.good_id || ''

  if (action === 'list') {
    return await getProductList()
  }

  if (goodId) {
    return await getGoodDetail(goodId)
  }

  if (!productId) {
    return { success: false, error: '缺少 product_id 参数' }
  }

  return await getProductData(productId)
}

async function getProductList() {
  try {
    var res = await db.collection('daian_product_info')
      .where({ is_listed: 1 })
      .field({ _id: true, title: true, banner: true })
      .orderBy('sortValue', 'desc')
      .limit(20)
      .get()
    return {
      success: true,
      products: res.data
    }
  } catch (err) {
    return {
      success: false,
      error: err.message || '获取产品列表失败'
    }
  }
}

async function getProductData(productId) {
  try {
    const productRes = await db.collection('daian_product_info').doc(productId).get()
    const product = productRes.data
    if (!product) {
      return { success: false, error: '产品不存在' }
    }

    let template = null
    if (product.template_id) {
      try {
        const tplRes = await db.collection('daian_product_template').doc(product.template_id).get()
        template = tplRes.data
      } catch (e) {
        template = null
      }
    }

    let goods = []
    try {
      const goodsRes = await db.collection('daian_product_goods')
        .where({ product_id: productId })
        .orderBy('sortValue', 'desc')
        .limit(200)
        .get()
      goods = goodsRes.data
    } catch (e) {
      goods = []
    }

    const fileIds = collectFileIds(product, goods)
    const urlMap = await getTempUrls(fileIds)

    const productTypes = buildProductTypes(product, urlMap, goods)
    const productSeries = buildProductSeries(product, urlMap, goods)
    const goodsList = buildGoodsList(goods, urlMap)

    const modules = (template && template.modules) || {}
    const bannerUrl = product.banner ? (urlMap[product.banner] || '') : ''

    return {
      success: true,
      data: {
        product_id: productId,
        title: product.title || '',
        banner: product.banner || '',
        banner_url: bannerUrl,
        banner_sub_title: product.banner_sub_title || '',
        pt_module_name: product.pt_module_name || '',
        pt_sub_title: product.pt_sub_title || '',
        product_types: productTypes,
        ps_module_name: product.ps_module_name || '',
        ps_sub_title: product.ps_sub_title || '',
        product_series: productSeries,
        contact_phone: product.contact_phone || '',
        contact_email: product.contact_email || '',
        contact_address: product.contact_address || '',
        modules: {
          banner: !!modules.banner,
          product_type: !!modules.product_type,
          product_series: !!modules.product_series,
          contact_us: !!modules.contact_us
        },
        all_goods: goodsList
      }
    }
  } catch (err) {
    return { success: false, error: err.message || '获取产品信息失败' }
  }
}

async function getGoodDetail(goodId) {
  try {
    const res = await db.collection('daian_product_goods').doc(goodId).get()
    const good = res.data
    if (!good) {
      return { success: false, error: '商品不存在' }
    }

    const fileIds = []
    if (good.cover) fileIds.push(good.cover)
    if (good.images && Array.isArray(good.images)) {
      good.images.forEach(function (img) {
        if (img) fileIds.push(img)
      })
    }
    const urlMap = await getTempUrls(fileIds)

    const coverUrl = good.cover ? (urlMap[good.cover] || '') : ''
    const imageUrls = (good.images || []).map(function (fid) {
      return { file_id: fid, url: urlMap[fid] || '' }
    })

    const allImages = []
    if (coverUrl) allImages.push(coverUrl)
    imageUrls.forEach(function (item) {
      if (item.url && item.url !== coverUrl) allImages.push(item.url)
    })

    return {
      success: true,
      data: {
        id: good._id,
        name: good.name || '',
        cover: good.cover || '',
        cover_url: coverUrl,
        images: imageUrls,
        all_images: allImages,
        category_name: good.category_name || '',
        module_name: good.module_name || '',
        specs: good.specs || null,
        model: good.model || '',
        light_source: good.light_source || '',
        color_temp: good.color_temp || '',
        color: good.color || '',
        material: good.material || ''
      }
    }
  } catch (err) {
    return { success: false, error: err.message || '获取商品详情失败' }
  }
}

function collectFileIds(product, goods) {
  var ids = []
  if (product.banner) ids.push(product.banner)
  if (product.product_types && Array.isArray(product.product_types)) {
    product.product_types.forEach(function (pt) {
      if (pt.cover) ids.push(pt.cover)
    })
  }
  if (product.product_series && Array.isArray(product.product_series)) {
    product.product_series.forEach(function (ps) {
      if (ps.cover) ids.push(ps.cover)
    })
  }
  goods.forEach(function (g) {
    if (g.cover) ids.push(g.cover)
    if (g.images && Array.isArray(g.images)) {
      g.images.forEach(function (img) {
        if (img) ids.push(img)
      })
    }
  })
  return ids.filter(function (v, i, arr) {
    return v && arr.indexOf(v) === i
  })
}

async function getTempUrls(fileIds) {
  if (!fileIds || fileIds.length === 0) return {}
  var urlMap = {}
  var batch = 50
  for (var i = 0; i < fileIds.length; i += batch) {
    var chunk = fileIds.slice(i, i + batch)
    try {
      var res = await cloud.getTempFileURL({ fileList: chunk })
      if (res.fileList) {
        res.fileList.forEach(function (item) {
          if (item.tempFileURL) {
            urlMap[item.fileID] = item.tempFileURL
          }
        })
      }
    } catch (e) {}
  }
  return urlMap
}

function buildGoodsList(goods, urlMap) {
  return goods.map(function (g) {
    var coverUrl = g.cover ? (urlMap[g.cover] || '') : ''
    var imageUrls = (g.images || []).map(function (fid) {
      return { file_id: fid, url: urlMap[fid] || '' }
    })
    var allImages = []
    if (coverUrl) allImages.push(coverUrl)
    imageUrls.forEach(function (item) {
      if (item.url && item.url !== coverUrl) allImages.push(item.url)
    })
    return {
      id: g._id,
      name: g.name || '',
      cover: g.cover || '',
      cover_url: coverUrl,
      images: imageUrls,
      all_images: allImages,
      category_name: g.category_name || '',
      module_name: g.module_name || '',
      specs: g.specs || null,
      model: g.model || '',
      light_source: g.light_source || '',
      color_temp: g.color_temp || '',
      color: g.color || '',
      material: g.material || ''
    }
  })
}

function buildProductTypes(product, urlMap, goods) {
  var types = product.product_types
  if (!types || !Array.isArray(types)) return []
  var goodsMap = {}
  goods.forEach(function (g) {
    goodsMap[g._id] = g
  })

  return types.map(function (pt) {
    var coverUrl = pt.cover ? (urlMap[pt.cover] || '') : ''
    var ptGoods = (pt.goods || []).map(function (gid) {
      var g = goodsMap[gid]
      if (!g) return null
      var gCoverUrl = g.cover ? (urlMap[g.cover] || '') : ''
      return {
        id: g._id,
        name: g.name || '',
        cover_url: gCoverUrl,
        model: g.model || ''
      }
    }).filter(function (v) { return v !== null })

    return {
      cover: pt.cover || '',
      cover_url: coverUrl,
      name: pt.name || '',
      goods: ptGoods
    }
  })
}

function buildProductSeries(product, urlMap, goods) {
  var series = product.product_series
  if (!series || !Array.isArray(series)) return []
  var goodsMap = {}
  goods.forEach(function (g) {
    goodsMap[g._id] = g
  })

  return series.map(function (ps) {
    var coverUrl = ps.cover ? (urlMap[ps.cover] || '') : ''
    var psGoods = (ps.goods || []).map(function (gid) {
      var g = goodsMap[gid]
      if (!g) return null
      var gCoverUrl = g.cover ? (urlMap[g.cover] || '') : ''
      return {
        id: g._id,
        name: g.name || '',
        cover_url: gCoverUrl,
        model: g.model || ''
      }
    }).filter(function (v) { return v !== null })

    return {
      cover: ps.cover || '',
      cover_url: coverUrl,
      name: ps.name || '',
      goods: psGoods
    }
  })
}
