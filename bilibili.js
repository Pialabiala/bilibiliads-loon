const url = $request.url;
let body = $response.body;

if (!body) {
    $done({});
}

try {
    let obj = JSON.parse(body);

    // 1. 去除开屏广告 (Splash)
    if (url.includes("/x/v2/splash")) {
        if (obj.data && obj.data.show) {
            obj.data.show = []; 
        }
    }
    
    // 2. 净化首页推荐信息流 (Feed)
    else if (url.includes("/x/v2/feed/index")) {
        if (obj.data && obj.data.items) {
            obj.data.items = obj.data.items.filter(item => {
                return !item.ad_info && !item.banner_item && item.card_type !== "cm_v1";
            });
        }
    }
    
    // 3. 精简“我的”页面 UI 布局 (Mine)
    else if (url.includes("/x/v2/account/mine")) {
        if (obj.data && obj.data.sections_v2) {
            obj.data.sections_v2 = obj.data.sections_v2.filter(section => {
                return !["推荐服务", "更多服务"].includes(section.title); 
            });
        }
    }
    
    // 4. [新增] 拦截开屏与品牌广告物料预下载 (Peak Download)
    else if (url.includes("/x/resource/peak/download")) {
        if (obj.data && obj.data.resource) {
            // 遍历所有资源类型（如 brand_splash, egg 等），清空它们的 list
            for (let i = 0; i < obj.data.resource.length; i++) {
                if (obj.data.resource[i].list) {
                    obj.data.resource[i].list = [];
                }
            }
        }
    }

    $done({ body: JSON.stringify(obj) });
} catch (e) {
    console.log("Bilibili 去广告脚本解析失败: " + e);
    $done({ body });
}
