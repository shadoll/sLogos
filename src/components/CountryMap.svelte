<script>
    import { afterUpdate, onMount } from "svelte";
    import InlineSvg from "./InlineSvg.svelte";
    export let countryCodes = [];
    export let forceCenterKey = 0;
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
    lastUserInteraction = Date.now();
    manualInteractionUntil = Date.now() + AUTO_CENTER_IGNORE_MS;
    }
    function zoomOut() {
        zoom(0.8);
    lastUserInteraction = Date.now();
    manualInteractionUntil = Date.now() + AUTO_CENTER_IGNORE_MS;
    }
    function recenter() {
        // force recentering when user explicitly clicks the recenter button
        highlightCountries(true);
    }

    // Highlight countries after SVG loads, using MutationObserver for reliability
    let observer;
    // Track recent user interaction to avoid clobbering manual pan/zoom
    let lastUserInteraction = 0;
    // Increase grace window so auto-centering won't fight quick drags/releases.
    // 2000ms prevents immediate snapping after pointerup but is short enough
    // to allow programmatic centering shortly after.
    const AUTO_CENTER_IGNORE_MS = 2000; // ms to ignore automatic recenters after user interaction
    // If the user manually changed the viewBox (pan/zoom), set this to a timestamp
    // until which auto-centering must not override the user's viewBox.
    let manualInteractionUntil = 0;
    let svgSeen = false; // whether we've already run the initial highlight for the inlined SVG

    function highlightCountries() {
        const args = Array.from(arguments);
        const forceCenter = args && args[0] === true;
        if (!wrapperRef) return;
        const svgEl = wrapperRef.querySelector("svg");
        if (!svgEl) return;
        // Simple cleanup: remove any inline fill/stroke/filter and any
        // data-geo* helper attributes on all path and g elements. We don't
        // keep or restore previous values; just clear styling before
        // applying new highlight styles.
        try {
            const els = Array.from(svgEl.querySelectorAll('path, g'));
            els.forEach((el) => {
                try {
                    // Clear basic inline styling
                    el.removeAttribute('fill');
                    el.removeAttribute('stroke');
                    if (el.style) el.style.filter = '';

                    // Remove any attributes that start with 'data-geo'
                    try {
                        const attrs = Array.from(el.attributes || []);
                        attrs.forEach((a) => {
                            try {
                                if (a && typeof a.name === 'string' && a.name.indexOf('data-geo') === 0) {
                                    el.removeAttribute(a.name);
                                }
                            } catch (e) {}
                        });
                    } catch (e) {}
                } catch (e) {}
            });
        } catch (err) {}

        // Highlight by country ISO using data-iso attribute only (case-insensitive via uppercasing)
        let highlighted = [];
        countryCodes.forEach((code) => {
            try {
                if (!code) return;
                const iso = String(code).trim().toUpperCase();
                // Prefer elements that explicitly declare data-iso
                let countryPath = null;
                try {
                    countryPath = svgEl.querySelector(`[data-iso="${iso}"]`);
                } catch (err) {
                    // Fallback: try lowercase attribute selector
                    try {
                        countryPath = svgEl.querySelector(`[data-iso='${iso.toLowerCase()}']`);
                    } catch (err2) {
                        countryPath = null;
                    }
                }

                if (countryPath) {
                    countryPath.setAttribute('fill', '#4f8cff');
                    countryPath.setAttribute('stroke', '#222');
                    countryPath.style.filter = 'drop-shadow(0 0 4px #4f8cff44)';
                    countryPath.setAttribute('data-geo-highlight', '1');
                    highlighted.push(countryPath);
                }
            } catch (err) {}
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
                // Only auto-center if the parent forced it, or the user hasn't
                // manually adjusted the viewBox recently (manualInteractionUntil).
                const now = Date.now();
                const allowAutoCenter = forceCenter || now > manualInteractionUntil;
                if (allowAutoCenter) {
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
    }

    // Watch for forceCenterKey changes to override user interactions
    $: if (typeof forceCenterKey !== 'undefined') {
        // When parent toggles forceCenterKey it intends to request a recenter.
        // However, if the user interacted recently we should avoid snapping the
        // map back immediately. Only force if manualInteractionUntil has passed.
        setTimeout(() => {
            const now = Date.now();
            if (now > manualInteractionUntil) {
                // reset interaction guard so auto-center is allowed and force center
                manualInteractionUntil = 0;
                highlightCountries(true);
            } else {
                // skip forcing center because the user just interacted; the quiz
                // can try again (parent may choose to re-request centering later).
            }
        }, 30);
    }
    // --- Map drag/move by mouse ---
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };
    let viewBoxStart = null;

    function onPointerDown(e) {
        // Use pointer events for unified mouse/touch support
        if (e && e.preventDefault) e.preventDefault();
        const svgEl = getSvgEl();
        if (!svgEl) return;
    isDragging = true;
    lastUserInteraction = Date.now();
    manualInteractionUntil = Date.now() + AUTO_CENTER_IGNORE_MS;
        const clientX = e.clientX;
        const clientY = e.clientY;
        dragStart = { x: clientX, y: clientY };
        const vb = svgEl.getAttribute("viewBox");
        if (vb) {
            const [x, y, w, h] = vb.split(" ").map(Number);
            viewBoxStart = { x, y, w, h };
        }
        // set cursor to grabbing
        try {
            if (wrapperRef && wrapperRef.style) wrapperRef.style.cursor = 'grabbing';
        } catch (err) {}

        // Try to capture the pointer on the svg so we keep receiving events
        try {
            if (svgEl.setPointerCapture && typeof e.pointerId === 'number') {
                svgEl.setPointerCapture(e.pointerId);
            }
        } catch (err) {}

        window.addEventListener('pointermove', onPointerMove, { passive: false });
        window.addEventListener('pointerup', onPointerUp);
    }

    function onPointerMove(e) {
        if (!isDragging || !viewBoxStart) return;
        if (e && e.cancelable) {
            try { e.preventDefault(); } catch (err) {}
        }
    // refresh interaction timestamp while the user is actively dragging
    lastUserInteraction = Date.now();
    manualInteractionUntil = Date.now() + AUTO_CENTER_IGNORE_MS;
        const clientX = e.clientX;
        const clientY = e.clientY;
        const svgEl = getSvgEl();
        if (!svgEl) return;
        const dx = clientX - dragStart.x;
        const dy = clientY - dragStart.y;
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

    function onPointerUp(e) {
        isDragging = false;
    viewBoxStart = null;
    // mark the time of the user's final interaction so auto-centering is suppressed
    lastUserInteraction = Date.now();
    manualInteractionUntil = Date.now() + AUTO_CENTER_IGNORE_MS;
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        try {
            const svgEl = getSvgEl();
            if (svgEl && svgEl.releasePointerCapture && typeof e.pointerId === 'number') {
                svgEl.releasePointerCapture(e.pointerId);
            }
        } catch (err) {}
        try {
            if (wrapperRef && wrapperRef.style) wrapperRef.style.cursor = 'grab';
        } catch (err) {}
    }

    function observeSvg() {
        if (!wrapperRef) return;
        if (observer) observer.disconnect();
        observer = new MutationObserver(() => {
            highlightCountries();
        });
        observer.observe(wrapperRef, { childList: true, subtree: true });
        // Initial run only once when the SVG appears to avoid re-highlighting
        // after user interactions which can trigger component updates.
        if (!svgSeen) {
            const svgEl = wrapperRef.querySelector('svg');
            if (svgEl) {
                svgSeen = true;
                highlightCountries();
            }
        }
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
    <div bind:this={wrapperRef} role="application" tabindex="-1" class="svg-wrapper-inner" on:pointerdown={onPointerDown}>
        <InlineSvg path={mapPath} alt="World map" color={undefined} />
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
        /* allow the section to fill parent's height so the svg can scale */
        padding: 0.5rem;
        box-shadow: 0 2px 8px 2px rgba(0, 0, 0, 0.08);
        height: 100%;
        display: flex;
        align-items: stretch;
    }

    /* inner wrapper that holds the InlineSvg should fill available space */
    .svg-wrapper-inner {
        width: 100%;
        height: 100%;
        position: relative;
        cursor: grab;
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
