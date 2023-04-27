<script>
    import { getContext, identity } from "svelte/internal";
    import { nip19 } from "nostr-tools";
    import {
        getBookmarks,
        toHex,
        formatBookmark,
        getEvent,
        getProfile,
    } from "../functions.js";

    let pubkey = "";
    let author = "";
    let relay = "";
    /**
     * @type {string | any[]}
     */
    let relays = [];
    let bookmarkTags = ["test1", "test2"];
    let selectedTag = "";
    /**
     * @type {string[]}
     */
    let bookmark = [];
    /**
     * @type {import("nostr-tools").Event[]}
     */
    let eventList;
    let profiles = {};

    /**
     * @type {any[][]}
     */
    let viewbms = [];
    /**
     * @type {any[]}
     */
    let viewbm = [];

    /**
     * @type {{ [x: string]: string[]}}
     */
    let bookmarkList;
    async function onClickGetPubkey() {
        // @ts-ignore
        pubkey = await window.nostr.getPublicKey();
        console.log(pubkey);
        // @ts-ignore
        const tmp = await window.nostr.getRelays();
        relays = Object.keys(tmp);
        console.log(relays);
    }

    async function onClickGetTags() {
        try {
            author = toHex(pubkey);
            console.log(author);
        } catch (error) {
            console.log("pubkeyを確認してください");
        }
        const bookmarks = await getBookmarks(author, relay);
        console.log(bookmarks);
        // @ts-ignore
        bookmarkList = formatBookmark(bookmarks); //[{tag1},{tag2},...]
        console.log(bookmarkList);
        bookmarkTags = Object.keys(bookmarkList);
        console.log(selectedTag);
        // @ts-ignore
        selectedTag = bookmarkTags[0];
        // @ts-ignore
        bookmark = bookmarkList[selectedTag];
        const bookmarkListEvent = await getEvent(bookmarkList); //[{key=ID,value=event],,},{}]
        // @ts-ignore
        eventList = bookmarkListEvent[0];
        // @ts-ignore
        const pubkeyList = bookmarkListEvent[1]; //pubkeyLIstつくる
        profiles = await getProfile(pubkeyList); //key=pubkey,value=profile

        console.log(eventList);
        //console.log(pubkeyList);
        console.log(profiles);

        for (let j = 0; j < bookmarkTags.length; j++) {
            //console.log(bookmarkList[bookmarkTags[j]]);
            bookmark = bookmarkList[bookmarkTags[j]];
            viewbms[j] = [];
            for (let i = 0; i < bookmark.length; i++) {
                //   console.log( viewbms[j][i]);
                viewbms[j][i] = getNote(bookmark[i]);
            }
        }
        viewbm = viewbms[bookmarkTags.indexOf(selectedTag)];
    }

    function onChangeTag() {
        bookmark = bookmarkList[selectedTag];
        viewbm = viewbms[bookmarkTags.indexOf(selectedTag)];
        console.log(typeof bookmark);
        //console.log( eventList[bookmark[0]].content);
        console.log(getNote(bookmark[0]));
    }

    /**
     * @param {string} noteID
     */
    function getNote(noteID) {
        let note = {};
        note.noteid = nip19.noteEncode(noteID);
        try {
            // @ts-ignore
            const thisEvent = eventList[noteID];
            note.content = thisEvent.content;
            note.date = new Date(thisEvent.created_at * 1000).toLocaleString();
            // @ts-ignore
            const thisProfile = profiles[thisEvent.pubkey];
            note.pubkey = nip19.npubEncode(thisProfile.pubkey);
            note.name = JSON.parse(thisProfile.content).name;
            note.display_name = JSON.parse(thisProfile.content).display_name;
            note.icon = JSON.parse(thisProfile.content).picture;
        } catch {}
        return note;
    }
</script>

<!------------------------------------------------------>
<main>
    <div class="input">
        pubkey:
        <input type="text" bind:value={pubkey} placeholder="npub or hex" />
        or get with nip07
        <button on:click={onClickGetPubkey}>GetPubkey</button>
    </div>
    <div class="setRelay">
        setRelay:
        <input type="text" bind:value={relay} placeholder="wss://..." />
        or set with list

        <select bind:value={relay} class="relayList">
            {#each relays as relaylist}
                <option value={relaylist}>
                    {relaylist}
                </option>
            {/each}
        </select>
    </div>
    <div class="getTags">
        <button on:click={onClickGetTags}>GetTags</button>
    </div>
    <div class="setTag">
        <div class="dropdownTags">
            tag:
            <select bind:value={selectedTag} on:change={onChangeTag}>
                {#each bookmarkTags as tag}
                    <option value={tag} selected>
                        {tag}
                    </option>
                {/each}
            </select>
        </div>
    </div>
    <div class="list">
        {#each viewbm as book, index}
            <div class="note">
                <img class="icon" src={book.icon} alt="icon" />
                <div class="contentArea">
                    <div class="display_name"><strong>{book.display_name}</strong> &nbsp; <small> @{book.name}</small></div>

                    <div class="content">{book.content}</div>
                </div>
            </div>
        {/each}
    </div>
</main>

<!------------------------------------------------------>
<style>
    .note {
        display: flex;
        align-items: center;
        padding: 10px;
        margin: 5px;
        border: solid 1px lightgray;
    }

    .contentArea {
        margin-left: 10px;

    }

    .icon {
       
        width: 50px;
        height: 50px;
        border-radius: 50%;
        margin-bottom: auto;
    }

    .display_name {
        font-weight: bold;
      
 
    }


    .content {
        margin-top: 5px;
        margin-left: 10px;
        white-space: pre-wrap
    }
    /* 
.note {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.iconArea {
  margin-right: 10px;
   width: 100px;
}

.icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.content, .name {
  margin: 0;
}

.name {
  font-weight: bold;
  font-size: 18px;
  margin-bottom: 5px;
}

.content {
  
  font-size: 14px;
  color: gray;
}  */
</style>
