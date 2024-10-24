import * as utilities from "./utilities.js";
import * as serverVariables from "./serverVariables.js";

const CACHES_EXPIRATION_TIME = serverVariables.get("main.requests.CacheExpirationTime");

global.requestsCaches = [];
global.cachedRequestsCleanerStarted = false;

export default class CachedRequestsManager {


    static startCachedRequestsCleaner() {
        setInterval(CachedRequestsManager.flushExpired, CACHES_EXPIRATION_TIME * 1000);
        console.log(BgWhite + FgBlue, "[Periodic requests caches cleaning process started...]");
    }

    static add(url, content, ETag="") {
        if (!cachedRequestsCleanerStarted) {
            cachedRequestsCleanerStarted = true;
            CachedRequestsManager.startCachedRequestsCleaner();
        }
        if (url != "") {
            CachedRequestsManager.clear(url);
            requestsCaches.push({
                url,
                content,
                ETag,
                Expire_Time: utilities.nowInSeconds() + CACHES_EXPIRATION_TIME
            });
            console.log(BgWhite + FgBlue, `[Data of ${url} request has been cached]`);
        }
    }
    
    static find(url) {
        try {
            if (url != "") {
                for (let cache of requestsCaches) {
                    if (cache.url == url) {
                        cache.Expire_Time = utilities.nowInSeconds() + CACHES_EXPIRATION_TIME;
                        console.log(BgWhite + FgBlue, `[${cache.url} data retrieved from cache]`);
                        return cache;
                    }
                }
            }
        } catch (error) {
            console.log(BgWhite + FgRed, "[request cache error!]", error);
        }
        return null;
    }
    static clear(url) {
        if (url != "") {
            let indexToDelete = [];
            let index = 0;
            for (let cache of requestsCaches) {
                if (cache.url == url) indexToDelete.push(index);
                index++;
            }
            utilities.deleteByIndex(requestsCaches, indexToDelete);
        }
    }
    static flushExpired() {
        let now = utilities.nowInSeconds();
        for (let cache of requestsCaches) {
            if (cache.Expire_Time <= now) {
                console.log(BgWhite + FgBlue, "Cached request data of " + cache.url + " expired");
            }
        }
        requestsCaches = requestsCaches.filter( cache => cache.Expire_Time > now);
    }
    static get(HttpContext) {
        if (HttpContext.isCacheable)
            return false;

        let cache = CachedRequestsManager.find(HttpContext.req.url);
        if (!cache)
            return false;
        
        HttpContext.response.JSON(cache.content, cache.ETag, true);
        return true;
    }
}