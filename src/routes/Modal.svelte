<script>
         import {show } from './stores.js';
  export let data = "";

function closeModal(){
 
    show.set(false);
    console.log($show);
}

</script>

{#if $show}
    <div class="modal">
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div class="modal-overlay" on:click={closeModal}></div>
        
        <div class="modal-content">
            
            <div class ="note-content">
                content:<br>{data}</div>
            
            <slot />
            
        </div>
        <div class="modal-footer"> 
            
           
            
        </div>
    </div>
{/if}

<style>
    .modal {
      
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    }

    .modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
    }

    .modal-content {
        background-color: white;
        padding: 1rem;
        border-radius: 0.25rem;
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
        z-index: 99999;
        word-break: break-all;
        white-space: pre-wrap;
        
    }
    .note-content{
        border: solid 1px lightgray;
        border-radius: 10px;
    }
</style>
