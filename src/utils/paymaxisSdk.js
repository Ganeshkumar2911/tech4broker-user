const SDK_SANDBOX_URL = "https://app-sandbox.paymaxis.com/hf/sdk/lib/umd/index.js";
const SDK_PROD_URL = "https://app.paymaxis.com/hf/sdk/lib/umd/index.js";
const SDK_BEAST_URL = "https://app.paymentbeast.com/hf/sdk/lib/umd/index.js";

export const loadPaymaxisSdk = (isProduction = false) => {
  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && window.HostedFieldsSDK) {
      resolve(window.HostedFieldsSDK);
      return;
    }
    const urlsToTry = [
      SDK_BEAST_URL,
      isProduction ? SDK_PROD_URL : SDK_SANDBOX_URL,
      SDK_SANDBOX_URL,
    ];
    let index = 0;
    const tryNext = () => {
      if (index >= urlsToTry.length) {
        reject(new Error("HostedFieldsSDK script failed to load from all sources."));
        return;
      }
      const sdkUrl = urlsToTry[index++];
      const existingScript = document.querySelector(`script[src="${sdkUrl}"]`);
      if (existingScript) {
        if (window.HostedFieldsSDK) {
          resolve(window.HostedFieldsSDK);
          return;
        }
        existingScript.addEventListener("load", () => {
          if (window.HostedFieldsSDK) resolve(window.HostedFieldsSDK);
          else tryNext();
        });
        existingScript.addEventListener("error", () => tryNext());
        return;
      }
      const script = document.createElement("script");
      script.src = sdkUrl;
      script.async = true;
      script.onload = () => {
        if (window.HostedFieldsSDK) resolve(window.HostedFieldsSDK);
        else tryNext();
      };
      script.onerror = () => tryNext();
      document.head.appendChild(script);
    };
    tryNext();
  });
};
