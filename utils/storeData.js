/**
 * 店铺产品分类数据模块
 * 定义分类结构、产品信息和云图片映射逻辑
 */

var storeInfo = {
  name: '北欧灯具',
  tagline: '欢迎了解咨询',
  bannerTitle: '产品图册合集',
  bannerSubtitle: '探索各类精选，找到属于自己的心动之选'
};

var sections = [
  {
    title: '产品类型',
    subtitle: '多种场景，覆盖全区域照明',
    categories: [
      { id: 'dadiaodeng', name: '大吊灯' },
      { id: 'fengshan', name: '吸顶风扇灯' },
      { id: 'canting', name: '餐厅吊灯' },
      { id: 'luodi', name: '落地灯' },
      { id: 'bihua', name: '壁画灯' },
      { id: 'xiding', name: '吸顶灯' }
    ]
  },
  {
    title: '产品系列',
    subtitle: '多种风格，样式精美，价格优惠',
    categories: [
      { id: 'fugu', name: '复古系列' },
      { id: 'beiou', name: '北欧系列' },
      { id: 'jianyue', name: '简约风系列' },
      { id: 'xinzhongshi', name: '新中式系列' },
      { id: 'qingshe', name: '轻奢风系列' },
      { id: 'wanghong', name: '网红爆款系列' }
    ]
  }
];

var products = {
  'dadiaodeng': [
    {
      id: 'sl-sdh',
      name: '法式水晶吊灯 SL-SDH',
      specs: [
        { label: '品名', value: '法式水晶吊灯' },
        { label: '型号', value: 'SL-SDH' },
        { label: '光源', value: 'LED' },
        { label: '色温', value: '三色温' },
        { label: '颜色', value: '黄铜色' },
        { label: '材质', value: '全铜+铜吊灯' }
      ]
    },
    {
      id: 'sl-ash',
      name: '法式水晶吊灯 SL-ASH',
      specs: [
        { label: '品名', value: '法式水晶吊灯' },
        { label: '型号', value: 'SL-ASH' },
        { label: '光源', value: 'LED' },
        { label: '色温', value: '三色温' },
        { label: '颜色', value: '黄铜色' },
        { label: '材质', value: '全铜+铜吊灯' }
      ]
    }
  ]
};

var categoryOrder = [];
sections.forEach(function (sec) {
  sec.categories.forEach(function (cat) {
    categoryOrder.push(cat.id);
  });
});

function getSectionByCategoryId(categoryId) {
  for (var i = 0; i < sections.length; i++) {
    for (var j = 0; j < sections[i].categories.length; j++) {
      if (sections[i].categories[j].id === categoryId) {
        return sections[i];
      }
    }
  }
  return null;
}

function getCategoryById(categoryId) {
  for (var i = 0; i < sections.length; i++) {
    for (var j = 0; j < sections[i].categories.length; j++) {
      if (sections[i].categories[j].id === categoryId) {
        return sections[i].categories[j];
      }
    }
  }
  return null;
}

function getCategoryName(categoryId) {
  var cat = getCategoryById(categoryId);
  return cat ? cat.name : '';
}

function getProductsByCategory(categoryId) {
  return products[categoryId] || [];
}

function getProductById(categoryId, productId) {
  var list = products[categoryId] || [];
  for (var i = 0; i < list.length; i++) {
    if (list[i].id === productId) {
      return list[i];
    }
  }
  return null;
}

function mapImagesToCategories(cloudImages) {
  var result = {};
  categoryOrder.forEach(function (catId) {
    result[catId] = {
      categoryImage: '',
      productImages: {},
      detailImages: {}
    };
  });

  if (!cloudImages || cloudImages.length === 0) {
    return result;
  }

  var hasCategoryMeta = cloudImages.some(function (img) {
    return img.category && img.category.length > 0;
  });

  if (hasCategoryMeta) {
    cloudImages.forEach(function (img) {
      var catId = img.category;
      if (!result[catId]) return;

      if (img.isDetail && img.productName) {
        var prodKey = img.productName;
        if (!result[catId].detailImages[prodKey]) {
          result[catId].detailImages[prodKey] = [];
        }
        result[catId].detailImages[prodKey].push(img.url);
      } else if (img.productName) {
        if (!result[catId].productImages[img.productName]) {
          result[catId].productImages[img.productName] = img.url;
        }
      } else {
        if (!result[catId].categoryImage) {
          result[catId].categoryImage = img.url;
        }
      }
    });

    for (var catId in result) {
      if (!result[catId].categoryImage) {
        var firstProd = result[catId].productImages;
        for (var prodName in firstProd) {
          result[catId].categoryImage = firstProd[prodName];
          break;
        }
      }
    }
  } else {
    var allCats = [];
    sections.forEach(function (sec) {
      sec.categories.forEach(function (cat) {
        allCats.push(cat);
      });
    });

    var imagesPerCat = Math.max(1, Math.floor(cloudImages.length / allCats.length));
    var idx = 0;

    allCats.forEach(function (cat) {
      var catImages = cloudImages.slice(idx, idx + imagesPerCat).map(function (img) {
        return img.url || img;
      });
      idx += imagesPerCat;

      if (catImages.length > 0) {
        result[cat.id].categoryImage = catImages[0];
        if (catImages.length > 1) {
          result[cat.id].detailImages._default = catImages.slice(1);
        }
      }
    });
  }

  return result;
}

function getDisplayProducts(categoryId, imageMap) {
  var prods = getProductsByCategory(categoryId);
  var catMap = imageMap ? (imageMap[categoryId] || {}) : {};

  if (prods.length > 0) {
    return prods.map(function (p) {
      var thumb = '';
      var details = [];
      if (catMap.productImages && catMap.productImages[p.name]) {
        thumb = catMap.productImages[p.name];
      }
      if (catMap.detailImages && catMap.detailImages[p.name]) {
        details = catMap.detailImages[p.name];
      }
      if (!thumb && catMap.detailImages && catMap.detailImages._default) {
        thumb = catMap.detailImages._default[0] || '';
        details = catMap.detailImages._default;
      }
      return {
        id: p.id,
        name: p.name,
        thumbnail: thumb,
        detailImages: details
      };
    });
  }

  if (catMap.detailImages && catMap.detailImages._default) {
    var imgs = catMap.detailImages._default;
    return imgs.map(function (url, i) {
      return {
        id: 'img_' + i,
        name: '产品 ' + (i + 1),
        thumbnail: url,
        detailImages: [url]
      };
    });
  }

  return [];
}

function getDisplayProductDetail(categoryId, productId, imageMap) {
  var product = getProductById(categoryId, productId);
  var catMap = imageMap ? (imageMap[categoryId] || {}) : {};
  var images = [];

  if (product && catMap.detailImages && catMap.detailImages[product.name]) {
    images = catMap.detailImages[product.name];
  } else if (catMap.detailImages && catMap.detailImages._default) {
    images = catMap.detailImages._default;
  }

  if (product) {
    return {
      id: product.id,
      name: product.name,
      specs: product.specs,
      images: images
    };
  }

  return {
    id: productId,
    name: '产品详情',
    specs: [],
    images: images
  };
}

module.exports = {
  storeInfo: storeInfo,
  sections: sections,
  getSectionByCategoryId: getSectionByCategoryId,
  getCategoryById: getCategoryById,
  getCategoryName: getCategoryName,
  getProductsByCategory: getProductsByCategory,
  getProductById: getProductById,
  mapImagesToCategories: mapImagesToCategories,
  getDisplayProducts: getDisplayProducts,
  getDisplayProductDetail: getDisplayProductDetail
};
