let sdkPromise;

export const loadScript = (src) => {
  if (typeof window.Razorpay === "function") return Promise.resolve(true);
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve) => {
    let script = document.querySelector("script[data-razorpay-checkout]");
    const isNew = !script;
    if (!script) {
      script = document.createElement("script");
      script.src = src;
      script.dataset.razorpayCheckout = "true";
      script.async = true;
    }
    const finish = (success) => {
      clearTimeout(timer);
      script.removeEventListener("load", loaded);
      script.removeEventListener("error", failed);
      if (!success) script.remove();
      resolve(success);
    };
    const loaded = () => finish(typeof window.Razorpay === "function");
    const failed = () => finish(false);
    const timer = setTimeout(failed, 15000);
    script.addEventListener("load", loaded, { once: true });
    script.addEventListener("error", failed, { once: true });
    if (isNew) document.body.appendChild(script);
  }).then((success) => {
    if (!success) sdkPromise = undefined;
    return success;
  });
  return sdkPromise;
};
