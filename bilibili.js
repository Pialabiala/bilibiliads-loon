const url = $request.url || "";
const body = $response.body;
if (!body) { $done({}); }

function removeAds(value) {
    if (Array.isArray(value)) {
        return value.filter(function (item) {
            if (!item || typeof item !== "object") return true;
            return !(item.ad_info || item.adInfo || item.cm_info || item.cmInfo ||
                String(item.card_type || item.cardType || "").indexOf("cm_") === 0 ||
                item.card_goto === "ad_av" || item.card_goto === "ad_inline_combo" ||
                item.is_ad === true || item.isAd === true);
        }).map(removeAds);
    }
    if (!value || typeof value !== "object") return value;
    Object.keys(value).forEach(function (key) {
        if (/^(ad|ads|advertisement|advertisements|ad_list|adList|banner_ad|bannerAd)$/i.test(key)) {
            if (Array.isArray(value[key])) value[key] = [];
            else if (value[key] && typeof value[key] === "object") value[key] = {};
            return;
        }
        value[key] = removeAds(value[key]);
    });
    return value;
}

try {
    let obj = JSON.parse(body);
    if (/\/x\/v2\/splash\//.test(url)) {
        if (obj.data) {
            ["show", "list", "event_list", "preload", "query_list", "keep_ids"].forEach(function (key) {
                if (Array.isArray(obj.data[key])) obj.data[key] = [];
            });
            if (obj.data.account && typeof obj.data.account === "object") obj.data.account = {};
        }
    } else if (/\/x\/v2\/feed\/index/.test(url)) {
        obj = removeAds(obj);
    } else if (/\/x\/resource\/(peak\/download|show(?:\/tab\/v2)?)/.test(url)) {
        const d = obj.data || obj;
        if (Array.isArray(d.resource)) d.resource.forEach(function (r) { if (r && Array.isArray(r.list)) r.list = []; });
        if (Array.isArray(d.list)) d.list = [];
        if (d.config && d.config.banner) d.config.banner = [];
        obj = removeAds(obj);
    } else if (/\/x\/v2\/feed\/(index|region|popular)/.test(url)) {
        obj = removeAds(obj);
    } else if (/\/x\/v2\/account\/mine/.test(url)) {
        obj = removeAds(obj);
        if (obj.data && Array.isArray(obj.data.sections_v2)) {
            obj.data.sections_v2 = obj.data.sections_v2.filter(function (s) {
                return !s || !["推荐服务", "更多服务"].includes(s.title);
            });
        }
    }
    $done({ body: JSON.stringify(obj) });
} catch (e) { $done({ body: body }); }
