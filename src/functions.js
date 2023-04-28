import { nip19, relayInit, SimplePool ,getEventHash} from 'nostr-tools'

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
export function pubToHex(pubkey) {
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
 * @param {string} noteId
 */
export function noteToHex(noteId) {
    let noteHex = noteId;
    console.log(noteId.slice(0, 4))
    if (noteId.slice(0, 4) == "note") {
        console.log(noteId.slice(0, 4))
        try {
            noteHex = nip19.decode(noteId).data.toString();
        } catch (error) {
            throw new Error("error");
        }
    }
    return noteHex;
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
    "wss://relay.nostr.band",
    "wss://nostr.wine",
    "wss://universe.nostrich.land",
    "wss://relay.damus.io"
];

/**
* @param {any} bookmarkList
*/
export async function getEvent(bookmarkList) {
    /**
     * @type {string[]}
     */
    let pubkeys = [];

    let filter = [{ ids: [] }];
    //let eventIds={};
    //eventIds[0] = bookmarkList[Object.keys(bookmarkList)[0]];
    let idList = [];

    // @ts-ignore
    idList = (bookmarkList[Object.keys(bookmarkList)[0]]);
    //idList[bookmarkList[Object.keys(bookmarkList)[0]]]="";
    if (Object.keys(bookmarkList).length > 0) {
        for (let i = 1; i < Object.keys(bookmarkList).length; i++) {
            // @ts-ignore
            idList = [...idList, ...bookmarkList[Object.keys(bookmarkList)[i]]];
            //      idList[bookmarkList[Object.keys(bookmarkList)[i]]]="";
            //    eventIds[i] = bookmarkList[Object.keys(bookmarkList)[i]];

        }
    }
    let eventList = idList.reduce((/** @type {{ [x: string]: string; }} */ list, /** @type {string | number} */ id) => {
        list[id] = "";
        return list;
    }, {});
    

    // @ts-ignore
    filter[0].ids = idList;

    const pool = new SimplePool();
    let sub = pool.sub(RelaysforSeach, filter);
    const result = new Promise((resolve) => {

        const timeoutID = setTimeout(() => {
            resolve([eventList, pubkeys]);
        }, 5000);

        sub.on('event', event => {
            eventList[event.id] = event;
            if (!pubkeys.includes(event.pubkey)) {
                pubkeys.push(event.pubkey);
            }
            // this will only be called once the first time the event is received
            // ...
        });
        sub.on("eose", () => {
            sub.unsub(); //イベントの購読を停止
            clearTimeout(timeoutID); //settimeoutのタイマーより早くeoseを受け取ったら、setTimeoutをキャンセルさせる。
            resolve([eventList, pubkeys]);
            clearTimeout(timeoutID);
        });

    });
    console.log(eventList);

    await result;// result プロミスの解決を待つ
    return result;
}


/**
* @param {string[]} pubkeyList
*/
export async function getProfile(pubkeyList) {
    let profiles = pubkeyList.reduce((list, id) => {
        // @ts-ignore
        list[id] = "";
        return list;
    }, {});

    let filter = [
        {
            authors: pubkeyList,
            kinds: [0]
        }];
    const pool = new SimplePool();
    let sub = pool.sub(RelaysforSeach, filter);
    const result = new Promise((resolve) => {

        const timeoutID = setTimeout(() => {
            resolve(profiles);
        }, 5000);

        sub.on('event', event => {
            // @ts-ignore
            profiles[event.pubkey] = event;
        });

        sub.on("eose", () => {
            sub.unsub(); //イベントの購読を停止
            clearTimeout(timeoutID); //settimeoutのタイマーより早くeoseを受け取ったら、setTimeoutをキャンセルさせる。
            resolve(profiles);
            clearTimeout(timeoutID);
        });

    });
    //    console.log(eventList);

    await result;// result プロミスの解決を待つ
    return result;
}


//ブクマに追加
/**
 * @param {any} noteID
 * @param {import("nostr-tools").Event} _event
 * @param {any} relays
 */
export async function postEvent(noteID, _event, relays) {
    console.log(_event);
    console.log(noteID);
    console.log(relays);
    
    const pushNote = ['e', noteID];
    _event.tags.push(pushNote);
   
    // @ts-ignore
    const event = await window.nostr.signEvent({
        content: _event.content,
        kind: _event.kind,
        pubkey: _event.pubkey,
        created_at: Math.floor(Date.now() / 1000),
        tags: _event.tags,
    });
    event.id = getEventHash(event);
    const pool = new SimplePool();
    let pub = pool.publish(relays,event);
    pub.on("ok", () => {
        console.log(`${relays.url} has accepted our event`);
     });
    // @ts-ignore
    pub.on("failed", (reason) => {
        console.log(
            `failed to publish to: ${reason}`
        );
      
    });

   
    return;
}

/**
 * @param {any} noteHexId
 */
export async function getSingleEvent(noteHexId){
   /**
   * @type {import("nostr-tools").Event}
   */
    // @ts-ignore
    let _event={};
    let filter = [{ ids: [noteHexId] }];
    const pool = new SimplePool();
    let sub = pool.sub(RelaysforSeach, filter);
    const result = new Promise((resolve) => {

        const timeoutID = setTimeout(() => {
            sub.unsub();
            resolve(_event);
        }, 5000);

        sub.on('event', event => {
            console.log(event);
            _event=event;
            resolve(event);
            
        });
        sub.on("eose", () => {
            console.log("eose");
            sub.unsub(); //イベントの購読を停止
            clearTimeout(timeoutID); //settimeoutのタイマーより早くeoseを受け取ったら、setTimeoutをキャンセルさせる。
        });

    });
    console.log(_event);

    await result;// result プロミスの解決を待つ
    return result;
}
