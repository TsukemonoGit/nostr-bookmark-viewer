<script>
    import Modal from "./Modal.svelte";
    import { show } from "./stores.js";
    import { nip19 } from "nostr-tools";
    import {
        getBookmarks,
        pubToHex,
        formatBookmark,
        getEvent,
        getProfile,
        postEvent,
        noteToHex,
        getSingleEvent,
    } from "../functions.js";

    let showModal = false;

    let pubkey = "";
    let author = "";
    let relay = "";
    let message = "";
    let message2 = "";
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
     * @type {string[]} eventIDリスト
     */
    let bookmark = [];
    /**
     * @type {{ [key:string] : import("nostr-tools").Event }}
     */
    let eventList;
    /**
     * @type {{ [key:string] : import("nostr-tools").Event }}
     */
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
     * @type {{ [x: string]: string[]}}　タグごとのイベントIDリスト
     */
    let bookmarkList;
    /**
     * @type {string}
     */
    let noteID = "";
    /**
     * @type {string}
     */
    let noteHex = "";
    /**
     * @type {import("nostr-tools").Event[]}
     */
    let bookmarks;
    /**
     * @type {string}
     */
    let showModalData = "";
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
        //初期化
        message2 = "";
        viewbm = [];
        message = "通信中";

        //npubチェック
        try {
            author = pubToHex(pubkey);
            console.log(author);
        } catch (error) {
            console.log("pubkeyを確認してください");
        }

        //kind30001にイベントリクエストした結果eventリスト
        bookmarks = await getBookmarks(author, relay);
        console.log(bookmarks);

        if (Object.keys(bookmarks).length === 0) {
            message = "このリレーのkind30001にはなんもないかも";
            return;
        }

        //eventIDからnoteを検索するために、タグごとのeventIDをまとめる
        bookmarkList = formatBookmark(bookmarks);
        console.log(bookmarkList);

        //tagによらず全部のnoteを取ってくる
        const bookmarkListEvent = await getEvent(bookmarkList); //[{key=ID,value=event],,},{}]

        bookmarkTags = Object.keys(bookmarkList);
        console.log(selectedTag);

        //{eventid:event}
        eventList = bookmarkListEvent[0];

        //string[] pubkeyList
        const pubkeyList = bookmarkListEvent[1]; //pubkeyLIst
        console.log(pubkeyList);
        console.log(pubkeyList.length);
           
        //localstrageから読む
        const localProfilesString = await localStorage.getItem("profile");
        let localProfiles;
        let getPubkeyList=[];
        if (localProfilesString !== null) {
            localProfiles = await JSON.parse(localProfilesString);
            console.log(localProfiles);
            console.log(localProfiles.length);

            
            for (let i = 0; i < pubkeyList.length; i++) {
            
                if ( pubkeyList[i] in localProfiles  && localProfiles[i]!=="") {
                }else{
                    getPubkeyList.push(pubkeyList[i]);
                }
            }
        }else{getPubkeyList=pubkeyList;}
        console.log(getPubkeyList.length);
  
        if(getPubkeyList.length>0){
        profiles = await getProfile(getPubkeyList); //key=pubkey,value=profile
        }
        if (localProfilesString !== null) {
           // profiles = { ...localProfiles, ...profiles };
           profiles = Object.assign({},localProfiles, profiles );
        }
        //localstorageに保存
        localStorage.setItem("profile", JSON.stringify(profiles));

        console.log(eventList);
        //console.log(pubkeyList);
        console.log(profiles);

        //（セレクトタグの初期値）とりあえずゼロ個目をセレクトタグにしておく
        selectedTag = bookmarkTags[0];
        //bookmark = bookmarkList[selectedTag];

        //{#for each~~}につかうためのArray型に表示させるアレコレを入れる
        for (let j = 0; j < bookmarkTags.length; j++) {
            //console.log(bookmarkList[bookmarkTags[j]]);
            bookmark = bookmarkList[bookmarkTags[j]];
            viewbms[j] = [];
            for (let i = 0; i < bookmark.length; i++) {
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

        console.log(getNote(bookmark[0]));
    }

    /**
     * @param {string} noteID
     */
    function getNote(noteID) {
        let note = {};
        note.noteid = nip19.noteEncode(noteID);
        try {
            const thisEvent = eventList[noteID];
            note.content = thisEvent.content;
            note.date = new Date(thisEvent.created_at * 1000).toLocaleString();

            const thisProfile = profiles[thisEvent.pubkey];
            note.pubkey = nip19.npubEncode(thisProfile.pubkey);
            note.name = JSON.parse(thisProfile.content).name;
            note.display_name = JSON.parse(thisProfile.content).display_name;
            note.icon = JSON.parse(thisProfile.content).picture;
        } catch {
            console.log("getnoteでエラー出てる");
        }
        return note;
    }

    async function clickAddBookmark() {
        message2 = "";
        if (noteID.length < 10) {
            message2 = "noteIDを確認してください";
            return;
        }
        console.log(show);

        //noteIDをHexにしてイベントを取得
        noteHex = noteToHex(noteID);
        // @ts-ignore
        if (bookmarkList[selectedTag].includes(noteHex)) {
            message2 = "そのIDはすでにリストの中にあるよ";
            console.log(message2);
            return;
        }
        show.set(true);
        const thisEvent = await getSingleEvent(noteHex);
        console.log(thisEvent);
        showModalData = thisEvent.content;

        //イベントプレビューを表示して
        //このリレーのこのタグに追加しますかYesOrNo表示
        //イエスで追加させる
    }
    function closeModal() {
        show.set(false);
        console.log($show);
    }
    async function WriteEvent() {
        show.set(false);
        //イエスで追加させる
        const pushEvent = bookmarks[bookmarkTags.indexOf(selectedTag)];

        await postEvent(noteHex, pushEvent, [relay]);
        onClickGetTags();
    }
</script>

<!------------------------------------------------------>
<main>
    <div class="top" style="color:red">消えるかも注意</div>
    <div class="input">
        pubkey:
        <input type="text" bind:value={pubkey} placeholder="npub or hex" />
        or get with NIP-07
        <button on:click={onClickGetPubkey}>GetPubkey</button>
    </div>
    <div class="setRelay">
        setRelay:
        <input type="text" bind:value={relay} placeholder="wss://..." />
        or set with list (NIP-07)

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
        <hr />

        <div class="input">
            noteID:
            <input type="text" bind:value={noteID} placeholder="note1..." />

            <button on:click={clickAddBookmark}>AddList</button>
        </div>
        <Modal data={showModalData}>
            <div class="modal-footer">
                relay [{relay}] の ListTag [{selectedTag}] に追加
                <button on:click={WriteEvent}>OK </button>
                <button on:click={closeModal}>Cancel </button>
            </div>
        </Modal>
        <div>{message2}</div>
        <!---------------------------------------------------------------------------->
        <hr />
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
                    <div class="icon-area">
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
                                <a
                                    href="https://nostx.shino3.net/{book.noteid}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="date">{book.date}</a
                                >
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
    hr {
        margin: 20px 0;
    }
    .note {
        display: flex;
        align-items: center;
        padding: 15px;
        margin: 5px;
        border: solid 1px lightgray;
        word-break: break-all;
        border-radius: 10px;
    }
    .note-area {
        width: 100%;
        margin-left: 10px;
        margin-right: 5px;
    }
    .note-top-area {
        display: flex;
    }
    .icon-area {
        margin: 5px 5px auto 5px;
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
        margin-top: 10px;

        white-space: pre-wrap;
    }
    .date {
        display: inline;
        text-align: right;
        font-weight: bold;
        font-size: smaller;
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
    a {
        color: rgb(74, 115, 168);
        text-decoration: none;
    }
</style>
