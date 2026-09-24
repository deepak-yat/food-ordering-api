let googleScriptPromise = null;

export function loadGoogleIdentity() {
    if (window.google?.accounts?.id) {
        return Promise.resolve(window.google);
    }

    if (googleScriptPromise) {
        return googleScriptPromise;
    }

    googleScriptPromise = new Promise((resolve, reject) => {
        const existingScript = document.querySelector(
            'script[src="https://accounts.google.com/gsi/client"]'
        );

        if (existingScript) {
            existingScript.addEventListener("load", () => resolve(window.google));
            existingScript.addEventListener("error", reject);
            return;
        }

        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;

        script.onload = () => resolve(window.google);
        script.onerror = reject;

        document.head.appendChild(script);
    });

    return googleScriptPromise;
}