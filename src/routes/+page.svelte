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
    let message = "";
    /**
     * @type {string | any[]}
     */
    let relays = [];
    /**
     * @type {string | any[]}
     */
    let bookmarkTags = [];
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
        viewbm = [];
        message = "通信中";
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
        // @ts-ignore
        if (Object.keys(bookmarkList).length === 0) {
            message = "このリレーのkind30001にはなんもないかも";
            return;
        }
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
        message = "";
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

    {#if viewbm.length === 0}
        <div>{message}</div>
    {:else}
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
                    <div class ="icon-area">
                    <img class="icon" src={book.icon} alt="icon" />
                </div>
                    <div class="note-area">
                        <div class="note-top-area">
                            <div class="note-top">
                                <div class="display_name">
                                    {book.display_name}
                                </div>
                                <div class="name">@{book.name}</div>
                            </div>
                            <div class="note-date">
                                <a href='https://nostx.shino3.net/{book.noteid}' target="_blank"
                                rel="noopener noreferrer" class="date">{book.date}</a>
                            </div>
                        </div>
                        <div class="content">{book.content}</div>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</main>

<!------------------------------------------------------>
<style>
    .note {
        display: flex;
        align-items: center;
        padding: 15px;
        margin: 5px;
        border: solid 1px lightgray;
        word-break: break-all;
        border-radius: 10px;
    }
.note-area{
    
        width: 100%;
        margin-left: 10px;
        margin-right: 5px;
}
    .note-top-area {
        display: flex;
    }
.icon-area{
    margin:5px 5px  auto 5px;
    
}
    .icon {
        width: 50px;
        height: 50px;
        border-radius: 50%;
         }

    .note-top {
        width: 70%;
        font-weight: bold;
    }
    .note-date {
        width: 30%;
        text-align: end;
    }

    .content {
        margin-top: 5px;
        margin-left: 10px;
        white-space: pre-wrap;
    }
    .date {
        display: inline;
        text-align: right;
        font-weight: bold;
        font-size:smaller;
    }
    .display_name {
        display: inline;
        font-weight: bold;
    }
    .name {
        display: inline;
        margin-left: 5px;
        color: gray;
        font-weight: normal;
        font-size: smaller;
    }
    a{
        color:rgb(74, 115, 168) ;
        text-decoration: none;
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
