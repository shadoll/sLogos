<script>
  import InlineSvg from './InlineSvg.svelte';
</script>

<footer>
  <div class="footer-content">
    <span class="footer-left">shadoll Logo Gallery and Quiz game</span>
    <span class="footer-center">All logos are property of their respective owners.</span>
    <a
      href="https://github.com/shadoll/sLogos"
      target="_blank"
      rel="noopener noreferrer"
      class="footer-right"
    >
      <InlineSvg path="/icons/github.svg" alt="GitHub" />
    </a>
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

  .footer-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .footer-left {
    order: 1;
    flex: 0 0 auto;
  }

  .footer-center {
    order: 2;
    flex: 1;
    text-align: center;
    min-width: 250px;
  }

  .footer-right {
    order: 3;
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    width: 22px;
    height: 22px;
  }

  @media (max-width: 700px) {
    .footer-content {
      flex-direction: column;
      gap: 0.75rem;
    }

    .footer-center {
      order: 1;
      text-align: center;
      width: 100%;
      flex: none;
    }

    .footer-left {
      order: 2;
      text-align: left;
    }

    .footer-right {
      order: 3;
      text-align: right;
    }

    /* Second row with left-right layout */
    .footer-left,
    .footer-right {
      width: 50%;
    }

    .footer-content::after {
      content: '';
      width: 100%;
      order: 1.5;
    }
  }
</style>
