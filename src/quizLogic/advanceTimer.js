// Shared advance timer for quizzes
// createAdvanceTimer(onProgress, onComplete) -> { start(duration), cancel() }
export function createAdvanceTimer(onProgress, onComplete) {
  let timer = null;
  let startTime = 0;
  let duration = 0;

  function _clear() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  return {
    start(d) {
      duration = d || 0;
      // reset progress immediately
      try {
        onProgress(0);
      } catch (e) {
        // ignore
      }
      startTime = Date.now();
      _clear();
      timer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / duration) * 100, 100);
        try {
          onProgress(progress);
        } catch (e) {
          // ignore
        }
        if (progress >= 100) {
          _clear();
          try {
            onProgress(0);
          } catch (e) {}
          if (typeof onComplete === 'function') {
            try {
              onComplete();
            } catch (e) {
              console.error('advanceTimer onComplete error', e);
            }
          }
        }
      }, 50);
    },
    cancel() {
      _clear();
      try {
        onProgress(0);
      } catch (e) {}
    },
  };
}
