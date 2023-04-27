<script>
    import { getContext, identity } from 'svelte/internal';
    import { nip19} from 'nostr-tools'
    import { getBookmarks ,toHex, formatBookmark,
        getEvent,getProfile} from '../functions.js'
    
    let pubkey = "";
    let author="";
    let relay="";
    /**
     * @type {string | any[]}
     */
    let relays=[];
    let bookmarkTags = ["test1","test2"];
    let selectedTag="";
    /**
     * @type {string[]}
     */
    let bookmark=[];
    /**
     * @type {import("nostr-tools").Event[]}
     */
    let eventList;
    let profiles={};
   
    /**
     * @type {{ [x: string]: string[]}}
     */
    let bookmarkList;
    async function onClickGetPubkey(){
        // @ts-ignore
        pubkey = await window.nostr.getPublicKey();
        console.log(pubkey);
        // @ts-ignore
        const tmp = await window.nostr.getRelays();
        relays=Object.keys(tmp);
        console.log(relays);
    }

    async function onClickGetTags(){
        try{
            author = toHex(pubkey);
            console.log(author)
        }catch(error){
            console.log("pubkeyを確認してください")
        }
        const bookmarks = await getBookmarks(author,relay);
        console.log(bookmarks);
        // @ts-ignore
        bookmarkList=formatBookmark(bookmarks);//[{tag1},{tag2},...]
        console.log(bookmarkList)
        bookmarkTags=Object.keys(bookmarkList);
        console.log(selectedTag);
        // @ts-ignore
        selectedTag=bookmarkTags[0];
        // @ts-ignore
        bookmark=bookmarkList[selectedTag];
        const bookmarkListEvent = await getEvent(bookmarkList);//[{key=ID,value=event],,},{}]
        // @ts-ignore
        eventList=bookmarkListEvent[0];
        // @ts-ignore
        const pubkeyList=bookmarkListEvent[1];//pubkeyLIstつくる
        profiles=await getProfile(pubkeyList);//key=pubkey,value=profile

        console.log(eventList);
        //console.log(pubkeyList);
        console.log(profiles);
        
        for (let i = 0;i<bookmark.length;i++){
            viewbm[i]=getNote(bookmark[i]);
        }
    }
    /**
     * @type {any[]}
     */
    let viewbm=[];
    function onChangeTag(){
        bookmark=bookmarkList[selectedTag];
        for (let i = 0;i<bookmark.length;i++){
            viewbm[i]=getNote(bookmark[i]);
        }
        console.log(typeof bookmark);
        //console.log( eventList[bookmark[0]].content);
        console.log( getNote(bookmark[0]));
    
    }
    
    /**
     * @param {string} noteID
     */
    function getNote(noteID){
        let note={};
        note.noteid=nip19.noteEncode(noteID);
        try{
        // @ts-ignore
        const thisEvent=eventList[noteID];
        note.content=thisEvent.content;
        note.date=new Date(thisEvent.created_at * 1000 ) .toLocaleString();
        // @ts-ignore
        const thisProfile =profiles[thisEvent.pubkey];
        note.pubkey=nip19.npubEncode(thisProfile.pubkey);
        note.name=JSON.parse(thisProfile.content).name;
        note.display_name=JSON.parse(thisProfile.content).display_name;
        note.icon=JSON.parse(thisProfile.content).picture;
        }catch{}
        return note
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
    <div class ="setRelay">
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
    <div class = "getTags">
        <button on:click={onClickGetTags}>GetTags</button>
    </div>
    <div class ="setTag">
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
    <div class = "list">
        {#each viewbm as book ,index}
        {book.content}
      <div class="note"></div>
   

        {/each}
    </div>
    
</main>

<!------------------------------------------------------>
<style>
</style>
