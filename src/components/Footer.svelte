<script>
  // No props needed for this simple footer
</script>

<footer>
  <div class="footer-flex">
    <span class="footer-center">All logos are property of their respective owners.</span>
    <div class="footer-bottom">
      <span class="footer-left">shadoll Logo Gallery and Quiz game</span>
      <a
        href="https://github.com/shadoll/sLogos"
        target="_blank"
        rel="noopener noreferrer"
        class="footer-github"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="#ccc"
          style="margin-right:0.3em;"
        ><path
            d="M12 0.297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.387 0.6 0.113 0.82-0.258 0.82-0.577 0-0.285-0.011-1.04-0.017-2.04-3.338 0.726-4.042-1.61-4.042-1.61-0.546-1.387-1.333-1.756-1.333-1.756-1.089-0.745 0.084-0.729 0.084-0.729 1.205 0.084 1.84 1.236 1.84 1.236 1.07 1.834 2.809 1.304 3.495 0.997 0.108-0.775 0.418-1.305 0.762-1.605-2.665-0.305-5.466-1.334-5.466-5.931 0-1.311 0.469-2.381 1.236-3.221-0.124-0.303-0.535-1.523 0.117-3.176 0 0 1.008-0.322 3.301 1.23 0.957-0.266 1.983-0.399 3.003-0.404 1.02 0.005 2.047 0.138 3.006 0.404 2.291-1.553 3.297-1.23 3.297-1.23 0.653 1.653 0.242 2.873 0.119 3.176 0.77 0.84 1.235 1.91 1.235 3.221 0 4.609-2.803 5.624-5.475 5.921 0.43 0.372 0.823 1.102 0.823 2.222 0 1.606-0.015 2.898-0.015 3.293 0 0.322 0.216 0.694 0.825 0.576 4.765-1.589 8.199-6.085 8.199-11.386 0-6.627-5.373-12-12-12z"
        /></svg>
      </a>
    </div>
  </div>
</footer><style>
  footer {
    padding: 1.5rem;
    background: var(--color-background);
    color: var(--color-text-secondary);
    border-top: 1px solid var(--color-border);
    font-size: 0.9rem;
    margin-top: auto;
  }

  .footer-flex {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 1em;
  }

  .footer-center {
    flex: 2;
    text-align: center;
  }

  .footer-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex: 1;
    gap: 1em;
  }

  .footer-left {
    text-align: left;
  }

  .footer-github {
    display: inline-flex;
    align-items: center;
  }

  @media (max-width: 700px) {
    .footer-flex {
      flex-direction: column;
      align-items: center;
      gap: 0.5em;
    }

    .footer-center {
      text-align: center;
      width: 100%;
      margin-bottom: 0.3em;
    }

    .footer-bottom {
      width: 100%;
      justify-content: space-between;
    }

    .footer-left {
      text-align: left;
    }

    .footer-github {
      margin-left: auto;
    }
  }
</style>
