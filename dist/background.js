const BASE_URL = "http://127.0.0.1:5000";
// const BASE_URL = 'http://localhost:8080/api';
const GET_LETTERS = "/sms_templates";
// const GET_REPORT = "/daily/";
// const SET_CANCELLATION_REPORT = "/daily/set-cancellation-fee";

/**
 * The task of background is to make requests to API with some interval
 * and get sms templates from it.
 *
 * To make GET request it needs to take API token from chrome.storage.sync
 */
class Background {
  token = null;

  messages = {};
  user = {};

  setMsg(item) {
    this.messages = item;
  }

  setTkn(item) {
    this.token = item;
  }

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

    /*global chrome*/
    chrome.storage.sync.get(["token"], (result) => {
      if (result.token) {
        this.setTkn(result.token);
      }
    });

    chrome.storage.sync.get(["user"], (result) => {
      if (result.user) {
        chrome.storage.local.set({ user: result.user });
        this.user = result.user;
      }
    });

    chrome.storage.sync.get(["message"], (result) => {
      if (result.message) {
        chrome.storage.local.set({ message: result.message });
        this.setMsg(result.message);
      }
    });
  }

  /**
   * Run get fetch all message for current user
   */
  start() {
    this.getMessageToApi();

    // this.setMessageToContentScript();

    setTimeout(() => {
      this.getMessageToApi();
    }, 1000);

    setInterval(() => {
      this.getMessageToApi();
    }, 3000);
  }

  // async getStatusOrder(url = "") {
  //   try {
  //     const response = await fetch(url, {
  //       method: "GET",
  //       mode: "cors",
  //       cache: "no-cache",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: "Bearer " + this.token,
  //       },
  //     });
  //     return await response.json();
  //   } catch (e) {
  //     return null;
  //   }
  // }

  onMessage(msg, port) {
    console.log("received", msg, "from", port.sender);
  }

  deleteTimer(port) {
    if (port._timer) {
      //clearTimeout(port._timer);
      delete port._timer;
    }
  }

  forceReconnect(port) {
    // this.deleteTimer(port);
    port.disconnect();
  }

  // setMessageToContentScript() {
  //   /*global chrome*/
  //   chrome.runtime.onConnect.addListener((port) => {
  //     if (port.name !== "foo") return "Test";
  //     port.onMessage.addListener(this.onMessage);
  //     port.onDisconnect.addListener(this.deleteTimer);
  //     port._timer = setTimeout(this.forceReconnect, 2500, port);
  //   });

  //   /*global chrome*/
  //   chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  //     if (request.action === "cancellationData") {
  //       fetch(BASE_URL + SET_CANCELLATION_REPORT, {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //           Accept: "application/json",
  //           Authorization: "Bearer " + this.token,
  //         },
  //         body: JSON.stringify(request.data),
  //       })
  //         .then((response) => {
  //           return response.json();
  //         })
  //         .then((response) => {
  //           sendResponse({ action: "cancellationData", response });
  //         })
  //         .catch((error) => {
  //           sendResponse({ action: "cancellationData", response: {} });
  //         });
  //       return true;
  //     } else if (request.action === "sendReport") {
  //       fetch(BASE_URL + GET_REPORT + "store", {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //           Accept: "application/json",
  //           Authorization: "Bearer " + this.token,
  //         },
  //         body: JSON.stringify(request.data),
  //       })
  //         .then((response) => {
  //           return response.json();
  //         })
  //         .then((response) => {
  //           sendResponse({ action: "sendReport", response });
  //         })
  //         .catch((error) => {
  //           sendResponse({ action: "sendReport", response: {} });
  //         });
  //       return true;
  //     } else if (request.action === "sendCashReport") {
  //       fetch(BASE_URL + GET_REPORT + "set-cash", {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //           Accept: "application/json",
  //           Authorization: "Bearer " + this.token,
  //         },
  //         body: JSON.stringify(request.data),
  //       })
  //         .then((response) => {
  //           return response.json();
  //         })
  //         .then((response) => {
  //           sendResponse({ action: "sendCashReport", response });
  //         })
  //         .catch((error) => {
  //           sendResponse({ action: "sendCashReport", response: {} });
  //         });
  //       return true;
  //     } else if (request.action === "generate-pdf") {
  //       fetch(BASE_URL + "/pdf", {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //           Accept: "application/json",
  //           Authorization: "Bearer " + this.token,
  //         },
  //         body: JSON.stringify(request.data),
  //       })
  //         .then((response) => {
  //           return response.blob();
  //         })
  //         .then((response) => {
  //           sendResponse({ action: "generate-pdf", response });
  //         })
  //         .catch(() => {
  //           sendResponse({ action: "generate-pdf", response: {} });
  //         });
  //       return true;
  //     } else {
  //       if (
  //         Object.keys(this.messages).length &&
  //         Object.keys(this.user).length
  //       ) {
  //         sendResponse({
  //           action: "message",
  //           messages: this.messages,
  //           user: this.user,
  //         });
  //       } else {
  //         sendResponse({ action: "message", messages: null, user: null });
  //       }
  //     }
  //   });
  // }

  getMessageToApi() {
    /*global chrome*/
    chrome.storage.sync.get(["token"], (result) => {
      if (result.token) {
        try {
          fetch(BASE_URL + GET_LETTERS, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + result.token,
            },
          })
            .then((response) => {
              if (response.status === 400) {
                /*global chrome*/
                chrome.storage.sync.remove(["token", "user"]);
                chrome.storage.local.remove(["message", "pdf-list"]);
                return null;
              }
              if (response.status === 200) {
                return response.json();
              }
              return null;
            })
            .then((data) => {
              if (data) {
                if (data.length > 0) {
                  /*global chrome*/
                  chrome.storage.local.set({ message: JSON.stringify(data) });
                  this.messages = JSON.stringify(data);
                }
                // if (data.data && data.data.pdf) {
                //   /*global chrome*/
                //   chrome.storage.local.set({
                //     "pdf-list": JSON.stringify(data.data.pdf),
                //   });
                // }

                this.messages = JSON.stringify(data);
              }
            });
        } catch (error) {
          console.error("Error:", error);
        }
      } else {
        /*global chrome*/
        chrome.storage.sync.get(["token"], (t) => this.setTkn(t.token));
      }
    });
  }
}

new Background().start();
