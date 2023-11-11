// const BASE_URL = "http://127.0.0.1:5000";
const BASE_URL = "https://www.carshipsimple.us";

/**
 * The task of background is to make requests to API with some interval
 * and get sms templates from it.
 *
 * To make GET request it needs to take API token from chrome.storage.sync
 */
class Background {
  constructor() {
    if (!chrome.runtime) {
      // Chrome 20-21
      chrome.runtime = chrome.extension;
    } else if (!chrome.runtime.onMessage) {
      // Chrome 22-25
      chrome.runtime.onMessage = chrome.extension.onMessage;
      chrome.runtime.sendMessage = chrome.extension.sendMessage;
      chrome.runtime.onConnect = chrome.extension.onConnect;
      chrome.runtime.connect = chrome.extension.connect;
    }
  }

  /**
   * Run get fetch all message for current user
   */
  start() {
    setInterval(() => {
      this.update_token();
    }, 1000 * 60 * 60 * 24);
  }

  async update_token() {
    chrome.storage.local.get(["user"], (result) => {
      if (result && result.user) {
        let current_user = JSON.parse(result.user);

        chrome.storage.local.get(["token"], (token_result) => {
          if (token_result.token) {
            try {
              fetch(BASE_URL + "/update_token", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: "Bearer " + token_result.token,
                },
                body: JSON.stringify({ username: current_user.username }),
              })
                .then((response) => {
                  return response.json();
                })
                .then((res) => {
                  console.log("🚀 ~ res:", res);
                  if (res.status === "ok") {
                    chrome.storage.local.set({ token: res.token });
                  }
                });
            } catch (error) {
              console.error("Error:", error);
            }
          }
        });
      }
    });
  }
}

new Background().start();
