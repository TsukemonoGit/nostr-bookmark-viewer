import { nip19, relayInit ,SimplePool} from 'nostr-tools'

/**
 * @param {string} author
 * @param {string} relay
 */
export async function getBookmarks(author, relay) {

    const relayIni = relayInit(relay);
    try {
        await relayIni.connect();
    } catch (error) {
        throw new Error("error");
    }
    const result = new Promise((resolve) => {
        let isSuccess = false;
        const timeoutID = setTimeout(() => {
            resolve(isSuccess);
        }, 5000);
        relayIni.on("connect", () => {
            console.log("is connected");
            isSuccess = true;

            clearTimeout(timeoutID);
        });
        relayIni.on("error", () => {
            console.log("failed to coneccted")
            isSuccess = false;

            clearTimeout(timeoutID);
        })
    });
    result.then(result => {
        if (!result) {
            throw new Error("failed to connect relay")
        }
        else {
            return true;
        }
    });
    if (!result) {
        throw new Error("failed to connect relay")
    }
    //以下コネクト成功？
    const sub = relayIni.sub([
        {
            kinds: [30001],
            authors: [author],
        },
    ]);

    const result2 = new Promise((resolve) => {
        /**
         * @type {import("nostr-tools").Event[]}
         */
        let _bookmarks = [];
        const timeoutID = setTimeout(() => {

            resolve(_bookmarks);
        }, 5000);
        sub.on("event", (event) => {

            _bookmarks.push(event);

        });
        sub.on("eose", () => {
            resolve(_bookmarks);
            clearTimeout(timeoutID);
        });
    });

    await result2.then(result => {
        console.log(result)
        return result;
    });//このリザルトはプロミスの結果に入る
    return result2;
}

/**
 * @param {string} pubkey
 */
export function toHex(pubkey) {
    let author = pubkey;
    console.log(pubkey.slice(0, 4))
    if (pubkey.slice(0, 4) == "npub") {
        console.log(pubkey.slice(0, 4))
        try {
            author = nip19.decode(pubkey).data.toString();
        } catch (error) {
            throw new Error("error");
        }
    }
    return author
}

/**
 * @param {string | any[]} bookmark
 */
export function formatBookmark(bookmark) {
    /*
    * @param {string | any[]} formatBookmark
    */
    let formatBookmark = {};

    for (let i = 0; i < bookmark.length; i++) {
        const bookmarkObjs = bookmark[i].tags.slice(1).map((/** @type {string[]} */ tag) => tag[1]);
        // @ts-ignore
       // formatBookmark[bookmark[i].tags[0][1]] = bookmarkObjs
       formatBookmark[bookmark[i].tags[0][1]] = bookmarkObjs
   
    }
    return formatBookmark;
}


//イベント内容検索用リレーたち
let RelaysforSeach = [
    "wss://nostr.wine",
    "wss://universe.nostrich.land",
    "wss://relay.nostr.band",
    "wss://relay.damus.io"
];

/**
* @param {any} bookmarkList
*/
export function getEvent(bookmarkList) {
    let bookmarkEvent={};

    let filter = [{ ids: [] }];
    //let eventIds={};
    //eventIds[0] = bookmarkList[Object.keys(bookmarkList)[0]];
    let idList = [];
    
    // @ts-ignore
    idList=(bookmarkList[Object.keys(bookmarkList)[0]]);
    //idList[bookmarkList[Object.keys(bookmarkList)[0]]]="";
    if (Object.keys(bookmarkList).length > 0) {
        for (let i = 1; i < Object.keys(bookmarkList).length; i++) {
            // @ts-ignore
            idList=[...idList, ...bookmarkList[Object.keys(bookmarkList)[i]]];
      //      idList[bookmarkList[Object.keys(bookmarkList)[i]]]="";
        //    eventIds[i] = bookmarkList[Object.keys(bookmarkList)[i]];

        }
    }
    const eventList = idList.reduce((/** @type {{ [x: string]: string; }} */ list, /** @type {string | number} */ id) => {
        list[id] = "";
        return list;
      }, {});

  
    // @ts-ignore
    filter[0].ids = idList;
   
    const pool = new SimplePool();
    let sub = pool.sub(RelaysforSeach,filter);
    const result = new Promise((resolve) => {
        let isSuccess = false;
        const timeoutID = setTimeout(() => {
            resolve(eventList);
        }, 5000);
        sub.on('event', event => {
            eventList[event.id]=event;
            // this will only be called once the first time the event is received
            // ...
          });
          sub.on("eose", () => {
            
            sub.unsub(); //イベントの購読を停止
            clearTimeout(timeoutID); //settimeoutのタイマーより早くeoseを受け取ったら、setTimeoutをキャンセルさせる。
            resolve(eventList);
            clearTimeout(timeoutID);
        });

        });
        console.log(eventList);
}

/**
* @param {any} eventList
*/
export function getPubkeyList(eventList) {

}
/**
* @param {any} pubkeyList
*/
export function getProfile(pubkeyList) {

}
