<script>
    import { afterUpdate, onMount } from "svelte";
    import InlineSvg from "./InlineSvg.svelte";
    export let countryCodes = [];
    export let countryNames = [];
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
        // backward-compatible signature: allow passing a force flag
        const args = Array.from(arguments);
        const forceCenter = args && args[0] === true;
        if (!wrapperRef) return;
        const svgEl = wrapperRef.querySelector("svg");
        if (!svgEl) return;
        // Clear previous highlights robustly. Try to restore any saved inline
        // attributes; if they are missing (e.g. due to re-mounts) also remove
        // the highlight styling if present.
        try {
            const candidateSelectors = 'path, g, polygon, rect, circle, ellipse, use';
            const allEls = Array.from(svgEl.querySelectorAll(candidateSelectors));
            allEls.forEach((el) => {
                try {
                    const prevFill = el.getAttribute('data-geo-prev-fill');
                    const prevStroke = el.getAttribute('data-geo-prev-stroke');
                    const prevFilter = el.getAttribute('data-geo-prev-filter');

                    // If we saved explicit previous values, restore them (empty string means remove attr)
                    if (prevFill !== null) {
                        if (prevFill === '') el.removeAttribute('fill');
                        else el.setAttribute('fill', prevFill);
                    } else {
                        // no saved value: if the element currently has the highlight color, remove it
                        try {
                            const curFill = el.getAttribute && el.getAttribute('fill');
                            if (curFill && curFill.toLowerCase() === '#4f8cff') el.removeAttribute('fill');
                        } catch (e) {}
                    }

                    if (prevStroke !== null) {
                        if (prevStroke === '') el.removeAttribute('stroke');
                        else el.setAttribute('stroke', prevStroke);
                    } else {
                        try {
                            const curStroke = el.getAttribute && el.getAttribute('stroke');
                            if (curStroke && curStroke.toLowerCase() === '#222') el.removeAttribute('stroke');
                        } catch (e) {}
                    }

                    if (prevFilter !== null) {
                        if (prevFilter === '') el.style.filter = '';
                        else el.style.filter = prevFilter;
                    } else {
                        try {
                            const cf = el.style && el.style.filter;
                            if (cf && cf.indexOf('4f8cff') !== -1) el.style.filter = '';
                        } catch (e) {}
                    }

                    // Clean up helper attributes if present
                    try {
                        el.removeAttribute('data-geo-prev-fill');
                        el.removeAttribute('data-geo-prev-stroke');
                        el.removeAttribute('data-geo-prev-filter');
                        el.removeAttribute('data-geo-highlight');
                    } catch (e) {}
                } catch (err) {}
            });
        } catch (err) {}

        // Highlight by country code (id)
        let highlighted = [];
        countryCodes.forEach((code) => {
            const countryPath = svgEl.querySelector(`#${code}`);
            if (countryPath) {
                // Save previous inline attributes so we can restore later
                const prevFill = countryPath.getAttribute('fill');
                const prevStroke = countryPath.getAttribute('stroke');
                const prevFilter = countryPath.style.filter || '';
                if (prevFill !== null) countryPath.setAttribute('data-geo-prev-fill', prevFill);
                else countryPath.setAttribute('data-geo-prev-fill', '');
                if (prevStroke !== null) countryPath.setAttribute('data-geo-prev-stroke', prevStroke);
                else countryPath.setAttribute('data-geo-prev-stroke', '');
                countryPath.setAttribute('data-geo-prev-filter', prevFilter);

                countryPath.setAttribute("fill", "#4f8cff");
                countryPath.setAttribute("stroke", "#222");
                countryPath.style.filter = "drop-shadow(0 0 4px #4f8cff44)";
                countryPath.setAttribute('data-geo-highlight', '1');
                highlighted.push(countryPath);
            }
        });
        // Highlight by country name (try many fallbacks: attributes, class names, <title> children)
        const names = Array.isArray(countryNames) ? countryNames : countryNames ? [countryNames] : [];
        if (names.length > 0) {
            // candidate elements to check for name matches
            const candidateSelectors = 'path, g, polygon, rect, circle, ellipse, use';
            const candidates = Array.from(svgEl.querySelectorAll(candidateSelectors));

            names.forEach((nameRaw) => {
                if (!nameRaw) return;
                const name = String(nameRaw).trim();
                if (!name) return;
                const nameLower = name.toLowerCase();

                    const matched = new Set();

                    // First pass: strict attribute/title/id matches (case-insensitive)
                    try {
                        const attrsToCheck = ['name', 'data-name', 'id', 'title', 'inkscape:label'];
                        candidates.forEach((el) => {
                            for (const a of attrsToCheck) {
                                try {
                                    const val = el.getAttribute && el.getAttribute(a);
                                    if (val && String(val).trim().toLowerCase() === nameLower) {
                                        matched.add(el);
                                        return;
                                    }
                                } catch (err) {}
                            }
                            // child <title> element (redundant with 'title' attr check but kept safe)
                            try {
                                const titleEl = el.querySelector && el.querySelector('title');
                                if (titleEl && titleEl.textContent && titleEl.textContent.trim().toLowerCase() === nameLower) {
                                    matched.add(el);
                                    return;
                                }
                            } catch (err) {}
                        });
                    } catch (err) {}

                    // If we didn't find any strict matches, fall back to class/slug heuristics
                    if (matched.size === 0) {
                        try {
                            // Try direct selectors only when safe
                            try {
                                const byNameAttr = svgEl.querySelectorAll(`[name='${name}']`);
                                byNameAttr.forEach((el) => matched.add(el));
                            } catch (err) {}
                            try {
                                const byClassDot = svgEl.querySelectorAll(`.${name.replace(/\s+/g, '.')}`);
                                byClassDot.forEach((el) => matched.add(el));
                            } catch (err) {}

                            // class list heuristics: slug (lower, dashes)
                            candidates.forEach((el) => {
                                try {
                                    const cls = (el.className && (typeof el.className === 'string' ? el.className : el.className.baseVal)) || '';
                                    if (cls) {
                                        const parts = cls.split(/\s+/).map((c) => c.trim()).filter(Boolean);
                                        const slug = nameLower.replace(/[^a-z0-9]+/g, '-').replace(/^\-+|\-+$/g, '');
                                        if (parts.includes(name) || parts.includes(nameLower) || parts.includes(slug)) matched.add(el);
                                    }
                                } catch (err) {}
                            });
                        } catch (err) {}
                    }

                    // Apply highlighting to matched elements
                    matched.forEach((countryPath) => {
                    const prevFill = countryPath.getAttribute('fill');
                    const prevStroke = countryPath.getAttribute('stroke');
                    const prevFilter = countryPath.style.filter || '';
                    if (prevFill !== null) countryPath.setAttribute('data-geo-prev-fill', prevFill);
                    else countryPath.setAttribute('data-geo-prev-fill', '');
                    if (prevStroke !== null) countryPath.setAttribute('data-geo-prev-stroke', prevStroke);
                    else countryPath.setAttribute('data-geo-prev-stroke', '');
                    countryPath.setAttribute('data-geo-prev-filter', prevFilter);

                    countryPath.setAttribute('fill', '#4f8cff');
                    countryPath.setAttribute('stroke', '#222');
                    countryPath.style.filter = 'drop-shadow(0 0 4px #4f8cff44)';
                    countryPath.setAttribute('data-geo-highlight', '1');
                    highlighted.push(countryPath);
                });
            });
        }
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
