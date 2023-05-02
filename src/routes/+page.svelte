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
        removeEvent,
        createNewTag,
        DereteTag,
        formatPubkeyList,
    } from "../functions.js";

    //let showModal = false;

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
    let newCategoryName = "";
    let cantSetting = false;
    
  
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
        if (pubkey == "" || relay == "") {
            message = "pubkey,relayを設定してください";
            return;
        }
        //初期化
        cantSetting = true;
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
        areyakoreya();
    }
        async function areyakoreya(){
        //eventIDからnoteを検索するために、タグごとのeventIDをまとめる
        bookmarkList = formatBookmark(bookmarks);
        console.log(bookmarkList);

        //取得するイベントIDリストを作る
        let idList = [];
      
        idList = bookmarkList[Object.keys(bookmarkList)[0]];
        //idList[bookmarkList[Object.keys(bookmarkList)[0]]]="";
        if (Object.keys(bookmarkList).length > 0) {
            for (let i = 1; i < Object.keys(bookmarkList).length; i++) {
                idList = [
                    ...idList,
                    ...bookmarkList[Object.keys(bookmarkList)[i]],
                ];

            }
        }
        //ここで、すでに取得しているイベントIDととってないIDを分ける
        
        if(eventList!=null){
            console.log(eventList);
            let tmpidList=[];
            for (let item of idList){
                if(!(item in eventList)){
                    tmpidList.push(item);
                // @ts-ignore
                }else if(eventList[item]===""){
                    //イベントリストにあってもイベント取れてなかったら追加する
                    tmpidList.push(item);
                    console.log(eventList[item]);
                }
            }
            idList=tmpidList;
        }
       // console.log(idList);
        //tagによらず全部のnoteを取ってくる
        const newBookmarkListEvent = await getEvent(idList); //[{key=ID,value=event],,},{}]
        
        bookmarkTags = Object.keys(bookmarkList);
     

        //{eventid:event}
        eventList = Object.assign({},eventList,newBookmarkListEvent);
        console.log(eventList)
        //string[] pubkeyList
        const pubkeyList = await formatPubkeyList(eventList);//newBookmarkListEvent;//[1]; //pubkeyLIst
        // console.log(pubkeyList);
        // console.log(pubkeyList.length);
        console.log(pubkeyList)
        //localstrageから読む
        const localProfilesString = await localStorage.getItem("profile");
        
        let localProfiles;
        let getPubkeyList = [];
        if (localProfilesString !== null) {
            localProfiles = await JSON.parse(localProfilesString);
            //    console.log(localProfiles);
            //    console.log(localProfiles.length);

            for (let i = 0; i < pubkeyList.length; i++) {
                console.log(pubkeyList[i] );
                if (pubkeyList[i] in localProfiles && localProfiles[i] !== "") {//ローカルストレージにデータがあるということ
                } else {
                  
                    getPubkeyList.push(pubkeyList[i]);
                }
            }
        } else {
          
            getPubkeyList = pubkeyList;
            
        }
        console.log(getPubkeyList.length);

        if (getPubkeyList.length > 0) {
            profiles = await getProfile(getPubkeyList); //key=pubkey,value=profile
        }
        if (localProfilesString !== null) {
            // profiles = { ...localProfiles, ...profiles };
            profiles = Object.assign({}, localProfiles, profiles);
        }
        //localstorageに保存
        localStorage.setItem("profile", JSON.stringify(profiles));

        console.log(eventList);
        //console.log(pubkeyList);
        //   console.log(profiles);

        //（セレクトタグの初期値）とりあえずゼロ個目をセレクトタグにしておく
        if(selectedTag===""){
        selectedTag = bookmarkTags[0];}
        console.log(selectedTag);
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
        if (noteID == null) return;
        let note = {};
        note.id = noteID;
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
            note.isMenuOpen = false; // メニューの開閉状態を追跡するフラグ
        } catch {
            console.log("getnoteでエラー出てる");
            note.isMenuOpen = false; // メニューの開閉状態を追跡するフラグ
        }
        return note;
    }

    async function clickAddBookmark() {
        showModalData = "";
        message2 = "";
        if (noteID.length < 10) {
            message2 = "noteIDを確認してください";
            return;
        }
        console.log(show);

        //noteIDをHexにしてイベントを取得
        noteHex = noteToHex(noteID);
        console.log(noteHex);
        // @ts-ignore
        if (bookmarkList[selectedTag].includes(noteHex)) {
            message2 = "そのIDはすでにリストの中にあるよ";
            console.log(message2);
            return;
        }
        show.set(true);
        const thisEvent = await getSingleEvent(noteHex);
        console.log(thisEvent.id);
        /**
         * @type {{[key:string]:import("nostr-tools").Event}}
         */
        const pushE={};
        pushE[thisEvent.id]=thisEvent;
        console.log(pushE);
       eventList={...eventList, ...pushE};
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

        const event = await postEvent(noteHex, pushEvent, [relay]);
        console.log(event);
        if(event!=null)
        {
        bookmarks[bookmarkTags.indexOf(selectedTag)]=event;
        
        areyakoreya();
        }else{message2="書き込み失敗したかも"}
        // 0.5秒待機する
       // setTimeout(() => {
       //     onClickGetTags();
       // }, 500);
    }

    /**
     * @type {number}
     */
    let preIndex;

    let menuItems = [
        { label: "Copy noteID" },
        { label: "Open nosTx" },
        { label: "Remove from list" },
    ];
    /**
     * @param {number} index
     */
    function toggleMenu(index) {
        // console.log(viewbm);
        if (preIndex !== null && index !== preIndex) {
            try {
                viewbm[preIndex].isMenuOpen = false;
            } catch {}
            viewbm[index].isMenuOpen = !viewbm[index].isMenuOpen;
        } else {
            viewbm[index].isMenuOpen = !viewbm[index].isMenuOpen;
        }
        preIndex = index;
    }

    /**
     * @param {number} menu
     * @param {number} index
     */
    async function onClickMenuItem(index, menu) {
        switch (menu) {
            case 0: // "Copy neventID"
                navigator.clipboard.writeText(viewbm[index].noteid).then(
                    () => {
                        // コピーに成功したときの処理
                        console.log("copyed: " + viewbm[index].noteid);
                    },
                    () => {
                        // コピーに失敗したときの処理
                        console.log("コピー失敗");
                    }
                );
                break;
            case 1: //  label: "Open nosTx" },
                window.open(
                    "https://nostx.shino3.net/" + viewbm[index].noteid,
                    "_blank"
                );

                break;
            case 2: // label: "Remove from list" }
                const pushEvent = bookmarks[bookmarkTags.indexOf(selectedTag)];
               const event =  await removeEvent(viewbm[index].id, pushEvent, [relay]);
               console.log(event); 

               if(event!=null){
               bookmarks[bookmarkTags.indexOf(selectedTag)]=event;
               areyakoreya();

               }else{message2="削除に失敗したかも"}
                break;
            default:
                console.log("errorかも");
        }
    }
    function onClicksStting() {
        cantSetting = false;
        console.log(cantSetting);
    }
    async function clickCreateTag() {
        //カテゴリ名チェック
        if (newCategoryName === "") {
            message = "カテゴリ名を入力してください";
            console.log(message);
            return;
        } else if (bookmarkTags.includes(newCategoryName)) {
            message =
                "すでに存在するカテゴリーです。別の名前を入力してください";
            console.log(message);
            return;
        }
        await createNewTag(newCategoryName, author, [relay]);
        //再読込
        setTimeout(() => {
            onClickGetTags();
        }, 500);
    }

    /**
     * @param {{ target: { value: any; }; }} event
     */
    function validateInput(event) {
        const pattern = /^[a-zA-Z0-9]+$/;
        const input = event.target.value;
        if (!pattern.test(input)) {
            event.target.value = input.replace(/[^a-zA-Z0-9]/g, "");
        }
    }

    async function deleteTagEvent() {
        deleteCheckMenu = false;
        const deleteTag = selectedTag;
        console.log(deleteTag);
        const deleteEventId = bookmarks[bookmarkTags.indexOf(deleteTag)].id;
        console.log(deleteEventId);
        await DereteTag(deleteEventId, author, [relay]);
        
    }
    let deleteCheckMenu = false;
    function deleteCheck() {
        deleteCheckMenu = !deleteCheckMenu;
    }
</script>

<!------------------------------------------------------>
<main>
    <div class="top" style="color:red">消えるかも注意</div>
    <div class="input">
        pubkey:
        <input
            type="text"
            bind:value={pubkey}
            placeholder="npub or hex"
            disabled={cantSetting}
        />
        or get with NIP-07
        <button on:click={onClickGetPubkey} disabled={cantSetting}
            >GetPubkey</button
        >
    </div>
    <div class="setRelay">
        setRelay:
        <input
            type="text"
            bind:value={relay}
            placeholder="wss://..."
            disabled={cantSetting}
        />
        or set with list (NIP-07)

        <select bind:value={relay} class="relayList" disabled={cantSetting}>
            {#each relays as relaylist}
                <option value={relaylist}>
                    {relaylist}
                </option>
            {/each}
        </select>
    </div>
    <div
        class="getTags"
        style="display: inline; margin-left:auto; margin-right:40px"
    >
        <button on:click={onClickGetTags}>GetCategories</button>
    </div>
    <div class="setting" style="display: inline; margin-left:auto;">
        <button on:click={onClicksStting}>↑設定変更</button>
    </div>

    {#if !cantSetting}
        <div />
    {:else}
        <div style="color:red;">{message}</div>
        <hr />

        <div class="category">カテゴリー新規作成</div>
        <div class="input">
            Category name:
            <input
                type="text"
                on:input={validateInput}
                bind:value={newCategoryName}
                placeholder="bookmark"
            />

            <button on:click={clickCreateTag}>create</button>
            <div class="category-right">
                <ul>
                    ※一般的なカテゴリー
                    <li>bookmark: snort,amethystでのブックマーク</li>
                    <li>pin: snortでのピン留め</li>
                </ul>
            </div>
        </div>

        <hr />

        <div class="input">
            noteID:
            <input
                type="text"
                bind:value={noteID}
                placeholder="note1...|nevent..."
            />

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
        <div class="setTag" style="display: inline; margin-left:auto;">
            <div
                class="dropdownTags"
                style="display: inline; margin-left:auto;"
            >
                category:
                <select bind:value={selectedTag} on:change={onChangeTag}>
                    {#each bookmarkTags as tag}
                        <option value={tag} selected>
                            {tag}
                        </option>
                    {/each}
                </select>
            </div>
        </div>
        <!---------------------------------------------------------------------->
        <div class="delete" style="display: inline; margin-left:40px;">
            <button on:click={deleteCheck}
                >表示中のカテゴリー全消しdelete category'{selectedTag}'</button
            >
            {#if deleteCheckMenu}
                消していいの？
                <button on:click={deleteTagEvent}>OK</button>
            {/if}
        </div>
        <!---------------------------------------------------------------------->
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
                                    class="date">{book.date} 🔗</a
                                >
                            </div>
                            <div class="note-menu" style="position: relative;">
                                <button
                                    on:click={() => toggleMenu(index)}
                                    class="menu-button">▼</button
                                >
                                <!-- メニューの内容 -->
                                {#if book.isMenuOpen === true}
                                    <div class="menu-overlay">
                                        <!-- メニューのコンテンツ -->
                                        {#each menuItems as item, menu}
                                            <div class="menu-item">
                                                <!-- svelte-ignore a11y-click-events-have-key-events -->
                                                <div
                                                    on:click={() =>
                                                        onClickMenuItem(
                                                            index,
                                                            menu
                                                        )}
                                                >
                                                    {item.label}
                                                </div>
                                            </div>
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                        </div>
                        <div class="content">{book.content}</div>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
    <hr />
    <div id="footer">
        Github: <a
            href="https://github.com/TsukemonoGit/nostr-bookmark-viewer"
            target="_blank"
            rel="noopener noreferrer">TsukemonoGit/nostr-bookmark-viewer</a
        > <br />
        Author:
        <a
            href="https://nostx.shino3.net/npub1sjcvg64knxkrt6ev52rywzu9uzqakgy8ehhk8yezxmpewsthst6sw3jqcw"
            target="_blank"
            rel="noopener noreferrer">mono(Nostr)</a
        >
    </div>
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
        width: 100%;
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
        font-weight: bold;
    }
    .note-date {
        margin-left: auto;
        text-align: end;

        /*  text-shadow: 0.5px 0.5px 0.5px gray;
        text-shadow: 1px 1px 2px black, 0 0 0em blue, 0 0 0.2em lightgray;*/
    }
    .note-menu {
        width: fit-content;
        font-weight: bold;
        margin-left: 5px;

        /*text-shadow: 0.5px 0.5px 0.5px gray;*/
    }
    .content {
        margin-top: 10px;

        white-space: pre-wrap;
    }
    .date {
        font-weight: bold;
        font-size: smaller;
        padding: 5px;
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
        color: cadetblue;
        text-decoration: none;
    }

    /* メニューのスタイル */
    .menu-overlay {
        position: absolute;
        top: 100%;
        right: 0;
        width: 350%;
        background-color: white;
        border: 1px solid black;
        padding: 2px 5px 2px 5px;
        z-index: 10;
    }

    .menu-item {
        font-weight: normal;
        font-size: smaller;
        margin: 2px 0px 2px 0px;
        padding-right: 5px;
        cursor: pointer;
    }

    .menu-item:hover {
        background-color: gray;
        color: white;
    }
    .menu-button {
        padding: 3px 8px 3px 8px;
    }
</style>
