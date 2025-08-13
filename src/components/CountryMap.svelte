<script>
    import { afterUpdate, onMount } from "svelte";
    import InlineSvg from "./InlineSvg.svelte";
    export let countryCodes = [];
    export let countryNames = [];
    export let mapPath = "/data/world.svg";
    let wrapperRef;

    // Highlight countries after SVG loads, using MutationObserver for reliability
    let observer;
    function highlightCountries() {
        if (!wrapperRef) return;
        const svgEl = wrapperRef.querySelector("svg");
        if (!svgEl) return;
        // Highlight by country code (id)
        countryCodes.forEach((code) => {
            const countryPath = svgEl.querySelector(`#${code}`);
            if (countryPath) {
                countryPath.setAttribute("fill", "#4f8cff");
                countryPath.setAttribute("stroke", "#222");
                countryPath.style.filter = "drop-shadow(0 0 4px #4f8cff44)";
            }
        });
        // Highlight by country name (name attribute)
        const names = Array.isArray(countryNames)
            ? countryNames
            : countryNames
              ? [countryNames]
              : [];
        names.forEach((name) => {
            const pathsByName = svgEl.querySelectorAll(`[name='${name}']`);
            const pathsByClass = svgEl.querySelectorAll(
                `.${name.replace(/ /g, ".")}`,
            );
            const allPaths = [...pathsByName, ...pathsByClass];
            allPaths.forEach((countryPath) => {
                countryPath.setAttribute("fill", "#4f8cff");
                countryPath.setAttribute("stroke", "#222");
                countryPath.style.filter = "drop-shadow(0 0 4px #4f8cff44)";
            });
        });
    }

    function observeSvg() {
        if (!wrapperRef) return;
        if (observer) observer.disconnect();
        observer = new MutationObserver(() => {
            highlightCountries();
        });
        observer.observe(wrapperRef, { childList: true, subtree: true });
        // Initial run in case SVG is already present
        highlightCountries();
    }

    onMount(() => {
        observeSvg();
        return () => {
            if (observer) observer.disconnect();
        };
    });

    afterUpdate(() => {
        observeSvg();
    });
</script>

<div class="country-map-section">
    <div class="svg-wrapper" bind:this={wrapperRef}>
        <InlineSvg path={mapPath} alt="World map" color={undefined} />
    </div>
</div>

<style>
    .country-map-section {
        background: var(--color-card);
        border-radius: 12px;
        padding: 1rem;
        box-shadow: 0 2px 8px 2px rgba(0, 0, 0, 0.08);
    }
    .svg-wrapper {
        width: 100%;
        height: 180px;
        margin: 0 auto;
        background: var(--color-bg);
        border-radius: 8px;
        box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.04);
    }
</style>
