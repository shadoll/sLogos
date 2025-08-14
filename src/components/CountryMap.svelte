<script>
    import { afterUpdate, onMount } from "svelte";
    import InlineSvg from "./InlineSvg.svelte";
    export let countryCodes = [];
    export let countryNames = [];
    export let mapPath = "/data/world.svg";
    export let countryScale = false;
    export let scalePadding = 30;
    let wrapperRef;

    // --- Zoom and recenter logic ---
    let lastViewBox = null;
    function getSvgEl() {
        return wrapperRef ? wrapperRef.querySelector("svg") : null;
    }
    function zoom(factor) {
        const svgEl = getSvgEl();
        if (!svgEl) return;
        const vb = svgEl.getAttribute("viewBox");
        if (!vb) return;
        let [x, y, w, h] = vb.split(" ").map(Number);
        const cx = x + w / 2;
        const cy = y + h / 2;
        w /= factor;
        h /= factor;
        x = cx - w / 2;
        y = cy - h / 2;
        svgEl.setAttribute("viewBox", `${x} ${y} ${w} ${h}`);
        lastViewBox = `${x} ${y} ${w} ${h}`;
    }
    function zoomIn() {
        zoom(1.2);
    }
    function zoomOut() {
        zoom(0.8);
    }
    function recenter() {
        highlightCountries();
    }

    // Highlight countries after SVG loads, using MutationObserver for reliability
    let observer;
    function highlightCountries() {
        if (!wrapperRef) return;
        const svgEl = wrapperRef.querySelector("svg");
        if (!svgEl) return;
        // Highlight by country code (id)
        let highlighted = [];
        countryCodes.forEach((code) => {
            const countryPath = svgEl.querySelector(`#${code}`);
            if (countryPath) {
                countryPath.setAttribute("fill", "#4f8cff");
                countryPath.setAttribute("stroke", "#222");
                countryPath.style.filter = "drop-shadow(0 0 4px #4f8cff44)";
                highlighted.push(countryPath);
            }
        });
        // Highlight by country name (name attribute or class)
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
                highlighted.push(countryPath);
            });
        });
        // Smart scale/center if enabled and at least one country is highlighted
        if (countryScale && highlighted.length > 0) {
            // Compute bounding box of all highlighted paths
            let minX = Infinity,
                minY = Infinity,
                maxX = -Infinity,
                maxY = -Infinity;
            highlighted.forEach((path) => {
                let bbox;
                try {
                    bbox = path.getBBox();
                } catch (e) {
                    return;
                }
                if (bbox.x < minX) minX = bbox.x;
                if (bbox.y < minY) minY = bbox.y;
                if (bbox.x + bbox.width > maxX) maxX = bbox.x + bbox.width;
                if (bbox.y + bbox.height > maxY) maxY = bbox.y + bbox.height;
            });
            // Center and scale the SVG viewBox to the highlighted country
            if (
                isFinite(minX) &&
                isFinite(minY) &&
                isFinite(maxX) &&
                isFinite(maxY)
            ) {
                minX -= scalePadding;
                minY -= scalePadding;
                maxX += scalePadding;
                maxY += scalePadding;
                const width = maxX - minX;
                const height = maxY - minY;
                svgEl.setAttribute(
                    "viewBox",
                    `${minX} ${minY} ${width} ${height}`,
                );
            }
        }
    }
    // --- Map drag/move by mouse ---
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };
    let viewBoxStart = null;

    function onMouseDown(e) {
        const svgEl = wrapperRef.querySelector("svg");
        if (!svgEl) return;
        isDragging = true;
        dragStart = { x: e.clientX, y: e.clientY };
        const vb = svgEl.getAttribute("viewBox");
        if (vb) {
            const [x, y, w, h] = vb.split(" ").map(Number);
            viewBoxStart = { x, y, w, h };
        }
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
    }

    function onMouseMove(e) {
        if (!isDragging || !viewBoxStart) return;
        const svgEl = wrapperRef.querySelector("svg");
        if (!svgEl) return;
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        // Scale drag to SVG units
        const scaleX = viewBoxStart.w / wrapperRef.offsetWidth;
        const scaleY = viewBoxStart.h / wrapperRef.offsetHeight;
        const newX = viewBoxStart.x - dx * scaleX;
        const newY = viewBoxStart.y - dy * scaleY;
        svgEl.setAttribute(
            "viewBox",
            `${newX} ${newY} ${viewBoxStart.w} ${viewBoxStart.h}`,
        );
    }

    function onMouseUp() {
        isDragging = false;
        viewBoxStart = null;
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
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
    <div bind:this={wrapperRef} role="application" style="width:100%;height:100%;position:relative; cursor: grab;">
        <InlineSvg path={mapPath} alt="World map" color={undefined} on:mousedown={onMouseDown} />
        {#if countryScale}
        <div class="map-controls-on-map">
            <button class="zoom-btn-on-map" on:click={zoomIn}>+</button>
            <button class="zoom-btn-on-map" on:click={recenter}>⦿</button>
            <button class="zoom-btn-on-map" on:click={zoomOut}>-</button>
        </div>
        {/if}
    </div>
</div>

<style>
    .country-map-section {
        background: var(--color-card);
        border-radius: 12px;
        padding: 1rem;
        box-shadow: 0 2px 8px 2px rgba(0, 0, 0, 0.08);
    }

    .map-controls-on-map {
        position: absolute;
        right: 0.5em;
        bottom: 0.5em;
        display: flex;
        flex-direction: column;
        gap: 0.5em;
        z-index: 10;
    }
    .zoom-btn-on-map {
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        padding: 0;
    }
    .zoom-btn-on-map:hover {
        background: var(--color-bg, #4f8cff);
        color: var(--color-text, #fff);
    }
</style>
