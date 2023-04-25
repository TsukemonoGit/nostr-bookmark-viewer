<script>
    import { getBookmarks ,toHex} from '../functions.js'
    
    let pubkey = "";
    let author="";
    let relay="";
    /**
     * @type {string | any[]}
     */
    let relays=[];
    let bookmarkTags = ["test1","test2"];
    let selectedTag="";

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
    <div class="dropdownTags">
        tag:
        <select bind:value={selectedTag}>
            {#each bookmarkTags as tag}
                <option value={selectedTag}>
                    {tag}
                </option>
            {/each}
        </select>
    </div>

    <div class = "list">
        <div class = "note">

        </div>
    </div>
    
</main>

<!------------------------------------------------------>
<style>
</style>
