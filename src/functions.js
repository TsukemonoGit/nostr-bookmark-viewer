import { nip19, relayInit } from 'nostr-tools'

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