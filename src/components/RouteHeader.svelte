<script>
    export let searchQuery = "";
    export let setSearchQuery = () => {};
    export const viewMode = "grid";
    // eslint-disable-next-line
    export let theme = "system";
    export let setTheme = () => {};

    function onInput(event) {
        searchQuery = event.target.value;
        setSearchQuery(searchQuery);
        // Update URL with search param
        const params = new URLSearchParams(window.location.search);
        if (searchQuery) {
            params.set("search", searchQuery);
        } else {
            params.delete("search");
        }
        const newUrl =
            window.location.pathname +
            (params.toString() ? "?" + params.toString() : "");
        history.replaceState(null, "", newUrl);
    }
</script>

<header class="main-header">
    <div class="header-row">
        <div class="header-title">
            <h1>Logo Gallery</h1>
        </div>

        <div class="theme-switcher">
            <div class="theme-switch-group">
                <button
                    on:click={() => setTheme("system")}
                    class:active={theme === "system"}
                    aria-label="System theme"
                >
                    System
                </button>
                <button
                    on:click={() => setTheme("light")}
                    class:active={theme === "light"}
                    aria-label="Light mode"
                >
                    Light
                </button>
                <button
                    on:click={() => setTheme("dark")}
                    class:active={theme === "dark"}
                    aria-label="Dark mode"
                >
                    Dark
                </button>
            </div>
        </div>
    </div>
    <div class="header-row">
        <div class="search-bar">
            <input
                type="text"
                placeholder="Search logos..."
                bind:value={searchQuery}
                on:input={onInput}
                aria-label="Search logos"
            />
        </div>
    </div>
</header>

<style>
    .main-header {
        padding: 1rem;
        background: var(--color-card);
        border-bottom: 1px solid var(--color-border);
        margin-bottom: 1rem;
    }

    .header-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1rem;
    }

    .header-title h1 {
        margin: 0;
    }

    .search-bar input {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid var(--color-border);
        border-radius: 4px;
        background: var(--color-bg);
        color: var(--color-text);
    }

    .theme-switch-group {
        display: flex;
        gap: 0.5rem;
    }

    button {
        padding: 0.5rem 1rem;
        background: var(--color-bg);
        border: 1px solid var(--color-border);
        border-radius: 4px;
        cursor: pointer;
    }

    button.active {
        background: var(--color-accent);
        color: white;
    }
</style>
