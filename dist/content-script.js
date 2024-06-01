class Content {
  // does it collect usage data?
  static SITE = "www.jtracker.com";
  static SITE_BATS = "www.batscrm.com";

  // static BASE_URL = "http://127.0.0.1:5000";
  static BASE_URL = "https://www.carshipsimple.us";

  static CRYSTAL_TEAM = 1;
  static SONIC_TEAM = 2;
  static ASSISTANT_TEAM = 4;

  host = undefined;

  message = "";

  messageReplace = "";

  error = null;

  chromeRun = null;

  allCars = {};

  currentUser = {};

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

    this.chromeRun = chrome.runtime;

    this.host = this.getCurrentHost();
  }

  /**
   * Get current host name site
   *
   * @returns {string}
   */
  getCurrentHost() {
    return window.location.host;
  }

  createSamplePriceLink(id, originZip, destinationZip, transportType) {
    fetch("https://www.batscrm.com/_invoke/GetPage", {
      headers: {
        accept: "text/plain, */*; q=0.01",
        "accept-language": "en,uk-UA;q=0.9,uk;q=0.8,en-US;q=0.7,ru;q=0.6",
        "cache-control": "no-cache",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        pragma: "no-cache",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-requested-with": "XMLHttpRequest",
      },
      referrer: "https://www.batscrm.com/pages/my-leads",
      referrerPolicy: "strict-origin-when-cross-origin",
      body:
        '{"controller":"OpportunityVehicles","view":"grid1","request":{"PageIndex":-1,"PageSize":30,"PageOffset":0,"Filter":["OpportunityID:=' +
        id +
        '"],"ContextKey":"view1_Vehicles","FilterIsExternal":true,"ExternalFilter":[{"Name":"OpportunityID","Value":' +
        id +
        '}],"Tag":"view-style-list,view-style-listonecolumn,view-style-grid-disabled,view-style-cards-disabled,fee0","SupportsCaching":true}}',
      method: "POST",
      mode: "cors",
      credentials: "include",
    })
      .then((res) => res.json())
      .then((response) => {
        const findNameVeh = (name) => {
          return response.d.Fields.findIndex((el, key) => el.Name === name);
        };
        const keysVeh = {
          VehicleType: findNameVeh("VehicleType"),
          VehicleInop: findNameVeh("VehicleInop"),
        };

        let typesVeh = [];
        Object.values(response.d.Rows).forEach((el, index) => {
          typesVeh.push(el[keysVeh["VehicleType"]]);
        });

        let inoperable = true;
        Object.values(response.d.Rows).forEach((el, index) => {
          inoperable = inoperable && el[keysVeh["VehicleInop"]];
        });
        const url = this.generateLinkFoSamplePrice(
          originZip,
          destinationZip,
          typesVeh,
          transportType,
          inoperable
        );

        this.openNewWindows(url);
      });
  }

  /**
   *
   * @param originZip
   * @param destinationZip
   * @param typesVeh
   * @param transportType
   * @param inoperable
   * @returns {string}
   */
  generateLinkFoSamplePrice(
    originZip,
    destinationZip,
    typesVeh,
    transportType,
    inoperable
  ) {
    const inoperableText = inoperable ? "NotRunning" : "Running";
    // false = Running
    // true = Not Running
    return (
      `https://site.centraldispatch.com/protected/listing/post-listing?` +
      `originZip=${originZip}&` +
      `destinationZip=${destinationZip}&` +
      `ymmVehicleType=${typesVeh.join(",")}&` +
      `inoperable=${inoperableText}&` +
      `transportType=${transportType}`
    );
  }

  setListSamplePrice(list) {
    if (list && list.getElementsByTagName("li")) {
      Object.values(list.getElementsByTagName("li")).forEach((el, index) => {
        if (index > 0 && !el.classList.contains("app-has-column")) {
          el.setAttribute(
            "style",
            "display: flex;color: red;align-items: center;"
          );
          const a = el.getElementsByTagName("a");
          if (
            el.getElementsByClassName("app-field-ID")[0] &&
            !el.querySelector("#sample__price")
          ) {
            let originZip = null;
            let destinationZip = null;
            const id = el.getElementsByClassName("app-field-ID")[0].textContent;
            if (
              el.getElementsByClassName("app-field-Origin") &&
              el.getElementsByClassName("app-field-Origin")[0] &&
              el
                .getElementsByClassName("app-field-Origin")[0]
                .textContent.toLowerCase() !== "n/a" &&
              el.getElementsByClassName("app-field-Origin").length
            ) {
              const origin =
                el.getElementsByClassName("app-field-Origin")[0].textContent;
              const destination = el.getElementsByClassName(
                "app-field-Destination"
              )[0].textContent;
              originZip = origin.split(",")[1].split(" ")[2];
              if (destination.split(",")[1]) {
                destinationZip = destination.split(",")[1].split(" ")[2];
              }
            } else if (
              el.getElementsByClassName("app-field-OriginPostalCode").length &&
              el.getElementsByClassName("app-field-OriginPostalCode")[0]
            ) {
              originZip = el.getElementsByClassName(
                "app-field-OriginPostalCode"
              )[0].textContent;
              destinationZip = el.getElementsByClassName(
                "app-field-DestinationPostalCode"
              )[0].textContent;
            } else if (
              el.getElementsByClassName("app-field-OriginString").length &&
              el.getElementsByClassName("app-field-OriginString")[0]
            ) {
              const origin = el.getElementsByClassName(
                "app-field-OriginString"
              )[0].textContent;
              const destination = el.getElementsByClassName(
                "app-field-DestinationString"
              )[0].textContent;
              originZip = origin.split(",")[1].split(" ")[2];
              destinationZip = destination.split(",")[1].split(" ")[2];
            } else if (
              el.getElementsByClassName("app-field-Route").length &&
              el.getElementsByClassName("app-field-Route")[0]
            ) {
              const text = el
                .getElementsByClassName("app-field-Route")[0]
                .title.split("Dest: ");
              originZip = (
                text[0].split("Origin:")[1].trim().split(",")[1] ?? ""
              )
                .trim()
                .split(" ")[1];
              destinationZip = text[1]
                .trim()
                .split(",")[1]
                .trim()
                .split(" ")[1];
            }
            let transportType = "";
            if (
              el.getElementsByClassName("app-field-TransportTypeName").length &&
              el.getElementsByClassName("app-field-TransportTypeName")[0]
            ) {
              transportType = el.getElementsByClassName(
                "app-field-TransportTypeName"
              )[0].textContent;
            }
            if (originZip && destinationZip) {
              const linkHtml = document.createElement("span");
              linkHtml.setAttribute(
                "style",
                "cursor: pointer; color: #0088cc; position: relative; top: 40%; transform: translateY(-50%);"
              );
              linkHtml.innerHTML = "Sample Price";
              linkHtml.id = "sample__price";
              linkHtml.onclick = () =>
                id &&
                originZip &&
                destinationZip &&
                this.createSamplePriceLink(
                  id,
                  originZip,
                  destinationZip,
                  transportType
                );

              const windowSize = document.body.scrollWidth;
              const linkContainer = document.createElement("span");
              linkContainer.setAttribute(
                "style",
                "z-index: 1; text-align: center;white-space: nowrap;position: absolute; left: " +
                  (windowSize - 125) +
                  "px;height: 100%; background: white;width: 125px; max-width: 125px; font-size: 14px;"
              );
              linkContainer.setAttribute(
                "class",
                "rg_view1_v_grid1_f_OppVehiclesStringOppVehiclesDetail app-field app-field-OppVehiclesStringOppVehiclesDetail sample__price__" +
                  id
              );
              linkContainer.setAttribute("data-draggable", "data-item");
              linkContainer.setAttribute("title", "Link");

              linkContainer.appendChild(linkHtml);
              a[0].after(linkContainer);
            }
          }
        }
      });
    }
  }

  setListInput = (listForInput) => {
    if (
      !!listForInput &&
      listForInput.getElementsByTagName("li") &&
      listForInput.getElementsByTagName("li")[0]
    ) {
      if (
        Object.values(listForInput.getElementsByTagName("li")).length >
        document.getElementsByName("input__price").length
      ) {
        if (
          Object.values(listForInput.getElementsByTagName("li")).length - 2 >=
          document.getElementsByClassName("input__price").length
        ) {
          Object.values(listForInput.getElementsByTagName("li")).forEach(
            (el, index) => {
              if (
                index > 0 &&
                !el.classList.contains("app-has-column") &&
                !el.querySelector(".input__price")
              ) {
                el.setAttribute(
                  "style",
                  "display: flex;color: red;align-items: center;"
                );
                const a = el.getElementsByTagName("a");
                if (el.getElementsByClassName("app-field-ID")[0]) {
                  const id =
                    el.getElementsByClassName("app-field-ID")[0].textContent;

                  let input = document.createElement("input");
                  input.setAttribute("type", "text");
                  input.setAttribute("placeholder", "Price");
                  input.setAttribute("class", "input__price");
                  input.setAttribute(
                    "style",
                    "font-size: 14px; width: 40px; margin-left: 5px; margin-right: 10px; top: 50%; position: relative; transform: translateY(-50%);"
                  );

                  let inputFee = document.createElement("input");
                  inputFee.setAttribute("type", "text");
                  inputFee.setAttribute("placeholder", "Fee");
                  inputFee.setAttribute("class", "input__fee");
                  inputFee.setAttribute(
                    "style",
                    "font-size: 14px; width: 40px; margin-left: 10px; margin-right: 5px; top: 50%; position: relative; transform: translateY(-50%);"
                  );

                  let btn = document.createElement("button");
                  btn.innerText = "Convert";
                  btn.setAttribute(
                    "style",
                    "font-size: 14px; cursor: pointer; width: 65px; margin-left: 10px; margin-right: 5px; top: 50%; position: relative; transform: translateY(-50%);"
                  );
                  btn.onclick = () =>
                    this.changePrice(el, id, +input.value, +inputFee.value);

                  let btnSave = document.createElement("button");
                  btnSave.innerText = "Save";
                  btnSave.setAttribute(
                    "style",
                    "font-size: 14px; cursor: pointer; width: 65px; margin-left: 10px; margin-right: 5px; top: 50%; position: relative; transform: translateY(-50%);"
                  );
                  btnSave.onclick = () =>
                    this.changePrice(
                      el,
                      id,
                      +input.value,
                      +inputFee.value,
                      false
                    );

                  let linkContainer = document.createElement("span");
                  linkContainer.setAttribute(
                    "style",
                    "font-size: 14px; white-space: nowrap; text-align: center; height: 100%; position: absolute; right: 140px; width: 320px; max-width: 320px; background: white;"
                  );
                  linkContainer.setAttribute(
                    "class",
                    "rg_view1_v_grid1_f_OppVehiclesStringOppVehiclesDetail app-field app-field-OppVehiclesStringOppVehiclesDetail"
                  );
                  linkContainer.setAttribute("data-draggable", "data-item");
                  linkContainer.setAttribute("title", "Link");
                  linkContainer.setAttribute("id", "block__" + id);

                  linkContainer.appendChild(input);
                  linkContainer.appendChild(inputFee);
                  linkContainer.appendChild(inputFee);
                  linkContainer.appendChild(btn);
                  linkContainer.appendChild(btnSave);
                  a[0].after(linkContainer);
                }
              }
            }
          );
        }
      }
    }
  };

  changePrice(el, id, price, fee, convertToQuote = true) {
    fetch("https://www.batscrm.com/_invoke/GetPage", {
      headers: {
        accept: "text/plain, */*; q=0.01",
        "accept-language": "en,uk-UA;q=0.9,uk;q=0.8,en-US;q=0.7,ru;q=0.6",
        "cache-control": "no-cache",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        pragma: "no-cache",
        "sec-ch-ua":
          '" Not;A Brand";v="99", "Google Chrome";v="97", "Chromium";v="97"',
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-requested-with": "XMLHttpRequest",
      },
      referrerPolicy: "strict-origin-when-cross-origin",

      body:
        '{"controller":"Leads","view":"editForm1","request":' +
        '{"PageIndex":-1,"PageSize":30,"PageOffset":0,"Filter":["_controller:=Leads","_commandName:=Edit","_commandArgument:=editForm1","ID:=' +
        id +
        '"],' +
        '"ContextKey":"view1","FilterIsExternal":true,"LastCommandName":"Edit","LastCommandArgument":"editForm1","ExternalFilter":[' +
        '{"Name":"_controller","Value":"Leads"},' +
        '{"Name":"_commandName","Value":"Edit"},' +
        '{"Name":"_commandArgument","Value":"editForm1"},' +
        '{"Name":"ID","Value":"' +
        id +
        '"}],' +
        '"SupportsCaching":true}}',
      method: "POST",
      mode: "cors",
      credentials: "include",
    })
      .then((response) => {
        return response.json();
      })
      .then((json) => {
        const findNameCar = (name) => {
          return json.d.Fields.findIndex((el, key) => el.Name === name);
        };
        const resultData = {
          PrimaryRepid: json.d.Rows[0][findNameCar("PrimaryRepid")],
          LastUpdatedToken: json.d.Rows[0][findNameCar("LastUpdatedToken")],
        };
        fetch("https://www.batscrm.com/_invoke/GetPage", {
          headers: {
            accept: "text/plain, */*; q=0.01",
            "accept-language": "en,uk-UA;q=0.9,uk;q=0.8,en-US;q=0.7,ru;q=0.6",
            "cache-control": "no-cache",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            pragma: "no-cache",
            "sec-ch-ua":
              '" Not;A Brand";v="99", "Google Chrome";v="97", "Chromium";v="97"',
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-requested-with": "XMLHttpRequest",
          },
          referrerPolicy: "strict-origin-when-cross-origin",
          body:
            '{"controller":"OpportunityVehicles","view":"grid1","request":' +
            '{"PageIndex":-1,"PageSize":30,"PageOffset":0,"Filter":' +
            '["OpportunityID:=' +
            id +
            '"],"ContextKey":"view1_Vehicles","FilterIsExternal":true,"ExternalFilter":' +
            '[{"Name":"OpportunityID","Value":' +
            id +
            "}]," +
            '"Tag":"view-style-list,view-style-listonecolumn,view-style-grid-disabled,view-style-cards-disabled,fee0","SupportsCaching":true}}',
          method: "POST",
          mode: "cors",
          credentials: "include",
        })
          .then((response) => {
            return response.json();
          })
          .then((json) => {
            const findNameCar = (name) => {
              return json.d.Fields.findIndex((el, key) => el.Name === name);
            };
            const vehicleId = json.d.Rows[0][findNameCar("ID")];

            const resultVehicle = {
              TenantID: json.d.Rows[0][findNameCar("TenantID")],
            };

            fetch("https://www.batscrm.com/_invoke/Execute", {
              headers: {
                accept: "text/plain, */*; q=0.01",
                "accept-language":
                  "en,uk-UA;q=0.9,uk;q=0.8,en-US;q=0.7,ru;q=0.6",
                "cache-control": "no-cache",
                "content-type":
                  "application/x-www-form-urlencoded; charset=UTF-8",
                pragma: "no-cache",
                "sec-ch-ua":
                  '" Not;A Brand";v="99", "Google Chrome";v="97", "Chromium";v="97"',
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": '"Linux"',
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-requested-with": "XMLHttpRequest",
              },
              referrer: "https://www.batscrm.com/pages/my-leads",
              referrerPolicy: "strict-origin-when-cross-origin",
              body:
                '{"controller":"OpportunityVehicles","view":"grid1","args":' +
                '{"CommandName":"Update","Path":"ag8/a4","LastCommandName":"Edit","Values":[' +
                '{"Name":"OpportunityID","OldValue":' +
                id +
                ',"Modified":false,"NewValue":' +
                id +
                "}," +
                '{"Name":"VehicleCarrierPay","OldValue": 0,"Modified":true,"NewValue":' +
                price +
                "}," +
                '{"Name":"VehicleBrokerFee","OldValue": 0,"Modified":true,"NewValue": ' +
                fee +
                "}," +
                '{"Name":"ID","OldValue":' +
                vehicleId +
                ',"Modified":false,"ReadOnly":true,"NewValue":' +
                vehicleId +
                "}" +
                '],"ContextKey":"opportunityvehicles","Controller":"OpportunityVehicles","View":"grid1",' +
                '"LastView":"grid1","Tag":"view-style-list,view-style-grid-disabled,view-style-cards-disabled,inline-editing,view-style-calendar-disabled,view-style-charts-disabled,multi-select-none modal-fit-content inline-editing-mode view-style-list view-style-grid-disabled view-style-cards-disabled inline-editing view-style-calendar-disabled view-style-charts-disabled multi-select-none view-style-list view-style-listonecolumn view-style-grid-disabled view-style-cards-disabled fee0 transition-none action-buttons-none content-stub-none page-header-none modal-always modal-title-none modal-tap-out modal-dock-top modal-auto-grow modal-background-transparent modal-max-xs system-replacegetpagetemplate view-type-inline-editor",' +
                '"Filter":["ID:=%js%' +
                vehicleId +
                '","OpportunityID:=5309141"],"SelectedValues":["' +
                vehicleId +
                '"],"ExternalFilter":[{"Name":"OpportunityID","Value":' +
                id +
                "}]}}",
              method: "POST",
              mode: "cors",
              credentials: "include",
            })
              .then((response) => {
                return response.json();
              })
              .then((json) => {
                if (convertToQuote) {
                  const body =
                    '{"controller":"Leads","view":"editForm1",' +
                    '"args":{"CommandName":"Update","CommandArgument":"ConvertToQuote","Path":"ag2/a101",' +
                    '"LastCommandName":"Edit","Values":[' +
                    '{"Name":"ID","OldValue":' +
                    id +
                    ',"Modified":false,"ReadOnly":true,"NewValue":' +
                    id +
                    "}," +
                    '{"Name":"TenantID","OldValue":' +
                    resultVehicle["TenantID"] +
                    ',"Modified":false,"ReadOnly":true,"NewValue":' +
                    resultVehicle["TenantID"] +
                    "}," +
                    '{"Name":"AutoEnableSalesEmailsOnNewQuote","OldValue":true,"Modified":false,"NewValue":true},' +
                    '{"Name":"OppvehiclesstringOpportunityid","OldValue":' +
                    id +
                    ',"Modified":false,"ReadOnly":true,"NewValue":' +
                    id +
                    "}," +
                    '{"Name":"PrimaryRepid","OldValue":"' +
                    resultData["PrimaryRepid"] +
                    '","Modified":false,"NewValue":"' +
                    resultData["PrimaryRepid"] +
                    '"},' +
                    '{"Name":"Team","Modified":false,"NewValue":null},' +
                    '{"Name":"ShipperNote","Modified":false,"ReadOnly":true,"NewValue":null},' +
                    '{"Name":"AutoQuoterRejectReason","Modified":false,"ReadOnly":true,"NewValue":null},' +
                    '{"Name":"Archived","OldValue":true,"Modified":false,"ReadOnly":true,"NewValue":true},' +
                    '{"Name":"CustomerEmailStatus","OldValue":"OK","Modified":false,"NewValue":"OK"},' +
                    '{"Name":"LastUpdatedToken","OldValue":"' +
                    resultData["LastUpdatedToken"] +
                    '","Modified":false,"NewValue":"' +
                    resultData["LastUpdatedToken"] +
                    '"},' +
                    '{"Name":"DuplicateId","Modified":false,"NewValue":null},' +
                    '{"Name":"IsDuplicate","OldValue":false,"Modified":false,"NewValue":false},' +
                    '{"Name":"DuplicateType","Modified":false,"ReadOnly":true,"NewValue":null},' +
                    '{"Name":"DuplicateLink","Modified":false,"ReadOnly":true,"NewValue":null},' +
                    '{"Name":"SamplePrice","Modified":false,"NewValue":null},' +
                    '{"Name":"TransportTypeName","OldValue":"Open","Modified":false,"ReadOnly":true,"NewValue":"Open"},' +
                    '{"Name":"TeamName","Modified":false,"NewValue":null},' +
                    '{"Name":"Status","Modified":false,"ReadOnly":true}],' +
                    '"ContextKey":"view1","Controller":"Leads","View":"editForm1","Tag":"inline-editing-mode modal-never discard-changes-prompt-none page-header-none",' +
                    '"Filter":["_controller:=Leads","_commandName:=Edit","_commandArgument:=editForm1","ID:=' +
                    id +
                    '"],' +
                    '"ExternalFilter":[{"Name":"_controller","Value":"Leads"},{"Name":"_commandName","Value":"Edit"},' +
                    '{"Name":"_commandArgument","Value":"editForm1"},' +
                    '{"Name":"ID","Value":"' +
                    id +
                    '"}]}}';

                  fetch("https://www.batscrm.com/_invoke/Execute", {
                    headers: {
                      accept: "text/plain, */*; q=0.01",
                      "accept-language":
                        "en,uk-UA;q=0.9,uk;q=0.8,en-US;q=0.7,ru;q=0.6",
                      "cache-control": "no-cache",
                      "content-type":
                        "application/x-www-form-urlencoded; charset=UTF-8",
                      pragma: "no-cache",
                      "sec-ch-ua":
                        '" Not;A Brand";v="99", "Google Chrome";v="97", "Chromium";v="97"',
                      "sec-ch-ua-mobile": "?0",
                      "sec-ch-ua-platform": '"Linux"',
                      "sec-fetch-dest": "empty",
                      "sec-fetch-mode": "cors",
                      "sec-fetch-site": "same-origin",
                      "x-requested-with": "XMLHttpRequest",
                    },

                    referrerPolicy: "strict-origin-when-cross-origin",
                    body: body,
                    method: "POST",
                    mode: "cors",
                    credentials: "include",
                  })
                    .then((r) => r.json())
                    .then((jsonResponse) => {
                      el.getElementsByTagName("a")[0].setAttribute(
                        "style",
                        "display: none;"
                      );
                      document
                        .getElementById("block__" + id)
                        .setAttribute("style", "display: none;");
                      document
                        .getElementsByClassName("sample__price__" + id)[0]
                        .setAttribute("style", "display: none;");
                    });
                }
              });
          });
      });
  }

  insideSamplePrice() {
    let origin = "";
    if (
      document.getElementsByClassName("app-field-OriginPostalCode") &&
      document.getElementsByClassName("app-field-OriginPostalCode")[0]
    ) {
      origin = document.getElementsByClassName("app-field-OriginPostalCode")[0]
        .textContent;
    } else {
      let originText = document
        .getElementsByClassName("app-field-Origin")[0]
        .textContent.split(",");
      origin = originText[1].trim().split(" ")[1];
    }
    let destination = "";
    if (
      document.getElementsByClassName("app-field-DestinationPostalCode") &&
      document.getElementsByClassName("app-field-DestinationPostalCode")[0]
    ) {
      destination = document.getElementsByClassName(
        "app-field-DestinationPostalCode"
      )[0].textContent;
    } else {
      let destinationText = document
        .getElementsByClassName("app-field-Destination")[0]
        .textContent.split(",");
      destination = destinationText[1].trim().split(" ")[1];
    }

    let transportType = "Open";
    if (
      document.getElementsByClassName("app-field-TransportType") &&
      document.getElementsByClassName("app-field-TransportType")[0]
    ) {
      transportType = document.getElementsByClassName(
        "app-field-TransportType"
      )[0].textContent;
    }

    let id = document.getElementsByClassName("app-field-ID")[0].textContent;

    fetch("https://www.batscrm.com/_invoke/GetPage", {
      headers: {
        accept: "text/plain, */*; q=0.01",
        "accept-language": "en,uk-UA;q=0.9,uk;q=0.8,en-US;q=0.7,ru;q=0.6",
        "cache-control": "no-cache",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        pragma: "no-cache",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-requested-with": "XMLHttpRequest",
      },
      referrerPolicy: "strict-origin-when-cross-origin",
      body:
        '{"controller":"OpportunityVehicles","view":"grid1","request":{"PageIndex":-1,"PageSize":30,"PageOffset":0,"Filter":' +
        '["OpportunityID:=' +
        id +
        '"],"ContextKey":"view1_Vehicles","FilterIsExternal":true,"ExternalFilter":' +
        '[{"Name":"OpportunityID","Value":' +
        id +
        '}],"Tag":"view-style-list,view-style-listonecolumn,view-style-grid-disabled,view-style-cards-disabled,fee0","SupportsCaching":true}}',
      method: "POST",
      mode: "cors",
      credentials: "include",
    })
      .then((response) => {
        return response.json();
      })
      .then((json) => {
        const findNameCar = (name) => {
          return json.d.Fields.findIndex((el, key) => el.Name === name);
        };

        const keyCars = {
          VehicleInop: findNameCar("VehicleModelYear"),
          VehicleType: findNameCar("VehicleType"),
        };

        let typesVeh = [];
        let inoperable = true;
        json.d.Rows.forEach((el, key) => {
          typesVeh.push(el[keyCars["VehicleType"]]);
          inoperable = inoperable && el[keyCars["VehicleInop"]] === "Yes";
        });

        const url = this.generateLinkFoSamplePrice(
          origin,
          destination,
          typesVeh,
          transportType,
          inoperable
        );
        this.openNewWindows(url);
      });
  }

  setToLocal(item, idOrder, pdf, result, keys) {
    const pageData = JSON.parse(item);

    /*global chrome*/
    chrome.storage.local.set({
      [idOrder + "_pageData"]: JSON.stringify({
        ...pageData,
        firstName: result.d.Rows[0][keys["FirstName"]],
        lastName: result.d.Rows[0][keys["LastName"]],
        fullName: result.d.Rows[0][keys["FullName"]],
        firstPickupDate: result.d.Rows[0][keys["FirstAvailablePickupDate"]],
        firstAvailablePickupDate:
          result.d.Rows[0][keys["FirstAvailablePickupDate"]],
        customerPhone: result.d.Rows[0][keys["CustomerPhone"]],
        customerPhone2Mobile: result.d.Rows[0][keys["CustomerPhone2Mobile"]],
        customerFax: result.d.Rows[0][keys["CustomerFax"]],
        customerAddress: result.d.Rows[0][keys["CustomerAddress"]],
        customerAddress2: result.d.Rows[0][keys["CustomerAddress2"]],
        customerCity: result.d.Rows[0][keys["CustomerCity"]],
        customerPostalCode: result.d.Rows[0][keys["CustomerPostalCode"]],
        customerCountry: result.d.Rows[0][keys["CustomerCountry"]],
        customerProvince: result.d.Rows[0][keys["CustomerProvince"]],
      }),
    });
    const referenceNode = document
      .getElementsByClassName("app-page-header")[0]
      .getElementsByTagName("h2")[0];

    document
      .getElementsByClassName("app-page-header")[0]
      .setAttribute(
        "style",
        "display: flex; flex-direction: row;visibility: visible;justify-content: flex-end;background-color: cadetblue;padding: 1rem;"
      );

    let bodyBlackout = document.createElement("div");
    bodyBlackout.setAttribute("class", "body-blackout");

    let modal = document.createElement("div");
    modal.setAttribute("class", "modal");
    modal.id = "myModal";
    modal.style = "z-index: 1000;";
    let modalDiv = document.createElement("div");
    modalDiv.setAttribute("class", "modal-content");

    let modalSpan = document.createElement("span");
    modalSpan.setAttribute("class", "close");
    modalSpan.id = "close__modal";
    modalSpan.innerHTML = "&times;";

    let modalP = document.createElement("button");
    modalP.id = "copy_and_close";
    modalP.innerHTML = "Copy and close";
    modalP.setAttribute("class", "btn btn-default");

    let modalTextArea = document.createElement("textarea");
    modalTextArea.row = 10;
    modalTextArea.cols = 100;
    modalTextArea.id = "textarea__message";

    modalDiv.appendChild(modalSpan);
    modalDiv.appendChild(modalTextArea);
    modalDiv.appendChild(modalP);
    modal.appendChild(modalDiv);

    document.getElementById("PageContent").after(modal);
    document.getElementById("PageContent").after(bodyBlackout);

    let blockFlex = document.createElement("div");
    blockFlex.style = "display: flex;";

    let label = document.createElement("label");
    label.innerHTML = "Sms";
    label.setAttribute("class", "label__my__label");

    let clone = document.createElement("select");
    clone.id = "email_options_crystal";
    clone.name = "email_options_crystal";
    clone.setAttribute("class", "select__my__select");

    clone.getElementsByTagName("option").innerHTML = "";
    let length = clone.options ? clone.options.length : 0;
    for (let i = length - 1; i >= 0; i--) {
      clone.options[i] = null;
    }

    /*global chrome*/
    chrome.storage.local.get(["messages", "pdf"], (result) => {
      if (
        !document.getElementById("open_modal_crystal") &&
        result.messages &&
        result.pdf
      ) {
        this.startSms(
          JSON.parse(result.messages),
          blockFlex,
          label,
          clone,
          modalSpan,
          referenceNode,
          modalP,
          JSON.parse(result.pdf)
        );
      }
    });
  }

  startSms(
    list,
    blockFlex,
    label,
    clone,
    modalSpan,
    referenceNode,
    modalP,
    pdf
  ) {
    console.log("🚀 ~ startSms");
    console.log("🚀 ~ list:", list);
    /*global chrome*/
    chrome.storage.local.set({ messages: JSON.stringify(list) }, () => {
      //START ADD
      // Catch a list from Sonic and convert replace string to CSS
      let changedList = list.map((letter) => {
        letter.value = letter.value.replace("Sonic", "CSS");
        letter.description = letter.description.replace(
          "Sonic Auto Transportation",
          "Car Ship Simple"
        );
        letter.description = letter.description.replace(
          "Sonic Auto",
          "Car Ship Simple"
        );
        return letter;
      });
      console.log("🚀 ~ changedList:", changedList);
      // END ADD

      chrome.storage.local.set({ pdf: JSON.stringify(pdf) });
      this.addButtonToPage(list);

      for (let i = 0; i < list.length; i++) {
        let option = document.createElement("option");
        option.value = list[i].key;
        option.textContent = list[i].value;
        clone.appendChild(option);
      }

      let button = document.createElement("button");
      button.innerHTML = "Open modal";
      button.setAttribute("class", "btn btn-default button__modal");
      button.setAttribute("data-popup-trigger", "one");
      button.id = "open_modal_crystal";

      let buttonPayment = document.createElement("button");
      buttonPayment.setAttribute("class", "btn btn-default button__modal");
      buttonPayment.setAttribute("data-popup-trigger", "one");
      buttonPayment.id = "open_modal_payment";
      if (this.currentUser.team_id === Content.ASSISTANT_TEAM) {
        buttonPayment.innerHTML = "Payment Sonic";
        buttonPayment.onclick = () =>
          this.sendOrderDataToPayment(Content.SONIC_TEAM);
      } else {
        buttonPayment.innerHTML = "Payment";
        buttonPayment.onclick = () => this.sendOrderDataToPayment();
      }

      let buttonPaymentCrystal = null;
      if (this.currentUser.team_id === Content.ASSISTANT_TEAM) {
        buttonPaymentCrystal = document.createElement("button");
        buttonPaymentCrystal.innerHTML = "Payment Crystal";
        buttonPaymentCrystal.setAttribute(
          "class",
          "btn btn-default button__modal"
        );
        buttonPaymentCrystal.setAttribute("data-popup-trigger", "one");
        buttonPaymentCrystal.id = "open_modal_payment_second";
        buttonPaymentCrystal.onclick = () =>
          this.sendOrderDataToPayment(Content.CRYSTAL_TEAM);
      }

      blockFlex.appendChild(label);
      blockFlex.appendChild(clone);
      blockFlex.appendChild(button);
      //TODO: Uncomment when Payment will be ready
      // blockFlex.appendChild(buttonPayment);
      // if (buttonPaymentCrystal) {
      //   blockFlex.appendChild(buttonPaymentCrystal);
      // }

      referenceNode.parentNode.insertBefore(
        blockFlex,
        referenceNode.nextSibling
      );

      this.changeSelect(list, list[0]);
      clone.onchange = (item) => this.changeSelect(list, item);

      modalSpan.onclick = () => this.closeModal();

      modalP.onclick = () => this.copyAndClose();

      button.onclick = () => this.clickOpenModal();

      // this.checkPaymentStatus();

      if (
        window.location.href.split("?")[0] ===
        "https://www.batscrm.com/pages/my-orders"
      ) {
        let blockFlexPdf = document.createElement("div");
        blockFlexPdf.style = "display: flex;";

        let buttonPdf = document.createElement("button");
        buttonPdf.innerHTML = "PDF";
        buttonPdf.setAttribute("class", "btn btn-default button__pdf");
        buttonPdf.setAttribute("data-popup-trigger", "one");
        buttonPdf.id = "open_modal_crystal";

        let labelPdf = document.createElement("label");
        labelPdf.innerHTML = "PDF";
        labelPdf.setAttribute("class", "label__my__label");
        labelPdf.setAttribute("style", "border: 0;");

        let selectPdf = document.createElement("select");
        selectPdf.id = "pdf_options_crystal";
        selectPdf.name = "pdf_options_crystal";
        selectPdf.setAttribute("class", "select__my__select");

        selectPdf.getElementsByTagName("option").innerHTML = "";
        let lengthPdf = selectPdf.options ? selectPdf.options.length : 0;
        for (let i = lengthPdf - 1; i >= 0; i--) {
          selectPdf.options[i] = null;
        }

        for (let i = 0; i < pdf.length; i++) {
          console.log("🚀 ~ pdf:", pdf);
          let option = document.createElement("option");
          if (!i) {
            option.selected = "selected";
          }

          //START ADD
          option.value = pdf[i].key;
          let changedValue = pdf[i].value.replace(".pdf", "");
          option.textContent = changedValue;
          //END ADD
          // option.textContent = pdf[i].value;
          selectPdf.appendChild(option);
        }

        //TODO: Uncomment when PDF templates will be ready
        blockFlexPdf.appendChild(labelPdf);
        blockFlexPdf.appendChild(selectPdf);
        blockFlexPdf.appendChild(buttonPdf);
        let selected = selectPdf.value;

        buttonPdf.onclick = () => this.getPdf();
        referenceNode.parentNode.insertBefore(
          blockFlexPdf,
          referenceNode.nextSibling
        );
      }
      let blockFlexSample = document.createElement("div");
      blockFlexSample.style = "display: flex;align-items: center;flex: 1;";

      let link = document.createElement("a");
      link.innerHTML = "Sample Price";
      link.style = "color: white;border: 0; padding: 0; cursor: pointer;";
      link.onclick = () => this.insideSamplePrice();
      link.setAttribute("class", "label__my__label");

      blockFlexSample.appendChild(link);

      referenceNode.parentNode.insertBefore(
        blockFlexSample,
        referenceNode.nextSibling
      );
    });
  }

  sendOrderDataToPayment(team_id = null) {
    let idOrder = null;

    try {
      idOrder = document.getElementsByClassName("app-field-ID")[0].textContent;
    } catch (e) {
      idOrder = null;
    }
    /*global chrome*/
    chrome.storage.local.get([idOrder + "_pageData"], (el) => {
      const decodeEl = JSON.parse(el[idOrder + "_pageData"]);
      const data = {
        idOrder: idOrder,
        firstName: decodeEl["firstName"],
        lastName: decodeEl["lastName"],
        email: decodeEl["customerEmail"],
        phone: decodeEl["customerPhone"],
        price: decodeEl["totalTariff"],
        transportType: decodeEl["shipVia"],
        firstAvailablePickupDate:
          decodeEl["firstAvailablePickupDate"] ??
          document.getElementsByClassName(
            "app-field-FirstAvailablePickupDate"
          )[0].innerText,
        cars: decodeEl["cars"],
        pickUpAddress: {
          state: decodeEl["originState"],
          zip: decodeEl["originZip"],
          city: decodeEl["originCity"],
          phone: decodeEl["originContactPhone"],
          street: decodeEl["originAddress"],
          contactName: decodeEl["originContactName"],
        },
        deliveryUpAddress: {
          state: decodeEl["destinationState"],
          zip: decodeEl["destinationZip"],
          city: decodeEl["destinationCity"],
          phone: decodeEl["destinationContactPhone"],
          street: decodeEl["destinationAddress"],
          contactName: decodeEl["destinationContactName"],
        },
      };
      this.sendOrderForPaymentSite(data, team_id);
    });
  }

  getUrlTeam(team_id = null) {
    let urlTeam = null;
    if (
      +this.currentUser.team_id === Content.CRYSTAL_TEAM ||
      team_id === Content.CRYSTAL_TEAM
    ) {
      urlTeam = "https://secure.crystalcarshipping.com";
    } else if (
      +this.currentUser.team_id === Content.SONIC_TEAM ||
      team_id === Content.SONIC_TEAM
    ) {
      urlTeam = "https://secure.sonic-auto.com";
    }

    return urlTeam;
  }

  sendOrderForPaymentSite(data, team_id = null) {
    const urlTeam = this.getUrlTeam(team_id);
    fetch(urlTeam + "/wp-json/api/v1/create-invoice", {
      body: JSON.stringify(data),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })
      .then((response) => {
        return response.json();
      })
      .then((json) => {
        if (json.uid && json.status === 201) {
          document.getElementById(
            "textarea__message"
          ).value = `${urlTeam}/payment/${json.uid}/`;

          this.clickOpenModal();
        } else if (json.status === 422) {
          alert(
            "Customer inserted card and payment account created is successful!"
          );
        }
      });
  }

  deletePaymentAccount(urlTeam, idOrder, both) {
    fetch(urlTeam + "/wp-json/api/v1/delete-account", {
      body: JSON.stringify({ id: idOrder }),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })
      .then((response) => {
        return response.json();
      })
      .then((json) => {
        if (json.status === 204) {
          document
            .getElementById("open_modal_payment")
            .removeAttribute("style");
          document
            .getElementById("open_modal_payment")
            .removeAttribute("disabled");

          if (both) {
            document
              .getElementById("open_modal_payment_second")
              .removeAttribute("style");
            document
              .getElementById("open_modal_payment_second")
              .removeAttribute("disabled");
          }

          let selectorForCCNumber = null;
          if (document.getElementsByClassName("app-field-LastFourCC").length) {
            selectorForCCNumber = document.getElementsByClassName(
              "app-field-LastFourCC"
            );
          } else {
            selectorForCCNumber = document.getElementsByClassName(
              "app-field-LastFourCC_NotOnFile"
            );
          }

          selectorForCCNumber[0]
            .getElementsByClassName("app-field-data")[0]
            .getElementsByTagName("span")[0]
            .remove();

          selectorForCCNumber[0].getElementsByClassName(
            "app-field-data"
          )[0].textContent = "";

          window.location.reload();
        } else if (json.status === 422) {
          alert("Can't delete payment account!");
        }
      });
  }

  checkPaymentStatus() {
    let idOrder =
      document.getElementsByClassName("app-field-ID")[0].textContent;
    if (this.currentUser.team_id === Content.ASSISTANT_TEAM) {
      let urlTeam = this.getUrlTeam(1);
      this.checkPaymentStatusRequest(urlTeam, idOrder, true);
      urlTeam = this.getUrlTeam(2);
      this.checkPaymentStatusRequest(urlTeam, idOrder, true);
    } else {
      const urlTeam = this.getUrlTeam(+this.currentUser.team_id);
      this.checkPaymentStatusRequest(urlTeam, idOrder);
    }
  }

  checkPaymentStatusRequest(urlTeam, idOrder, both = false) {
    fetch(urlTeam + "/wp-json/api/v1/check-invoice/" + idOrder, {
      headers: {
        "Content-Type": "application/json",
        // 'Accept': 'application/json',
      },
    })
      .then((response) => {
        return response.json();
      })
      .then((json) => {
        if (json.status === 200) {
          document
            .getElementById("open_modal_payment")
            .setAttribute("style", "background: red;");
          document
            .getElementById("open_modal_payment")
            .setAttribute("disabled", "disabled");

          if (both) {
            document
              .getElementById("open_modal_payment_second")
              .setAttribute("style", "background: red;");
            document
              .getElementById("open_modal_payment_second")
              .setAttribute("disabled", "disabled");
          }

          if (json.data) {
            let selectorForCCNumber = null;
            if (
              document.getElementsByClassName("app-field-LastFourCC").length
            ) {
              selectorForCCNumber = document.getElementsByClassName(
                "app-field-LastFourCC"
              );
            } else {
              selectorForCCNumber = document.getElementsByClassName(
                "app-field-LastFourCC_NotOnFile"
              );
            }
            //
            selectorForCCNumber[0].getElementsByClassName(
              "app-field-data"
            )[0].textContent = json.data.card.replace("XXXX", "");
            selectorForCCNumber[0].getElementsByClassName(
              "app-field-data"
            )[0].style = "color: green; ";
            let span = document.createElement("span");
            span.style =
              "color: red; position: absolute; right: 0; cursor: pointer;";
            span.textContent = "DELETE & Gen. new payment";
            span.onclick = () =>
              this.clickForDeletePaymentAccount(urlTeam, idOrder, both);
            selectorForCCNumber[0]
              .getElementsByClassName("app-field-data")[0]
              .appendChild(span);
          }
        }
      });
  }

  clickForDeletePaymentAccount(urlTeam, idOrder, both) {
    if (
      window.confirm(
        "Do you really want to Delete Customer Payment Account and Credit Card?"
      )
    ) {
      this.deletePaymentAccount(urlTeam, idOrder, both);
    }
  }

  /**
   * Start all logic for start logic and send to backend
   */
  start() {
    let pdf = [];

    /*global chrome*/
    chrome.storage.local.get(["messages", "user", "pdf"], (result) => {
      if (Object.keys(result).length) {
        console.log("🚀 ~ start ~ result:", result);
        this.currentUser = JSON.parse(result?.user ?? "");

        let messages = JSON.parse(result.messages);
        console.log("🚀 ~ messages:", messages);
        /*global chrome*/
        let changedMessages = messages.map((letter) => {
          console.log("🚀 ~ letter:", letter);
          // console.log("🚀 ~ letter:", letter);
          letter.value = letter.value.replace("Sonic", "CSS");
          letter.description = letter.description.replace(
            "Sonic Auto Transportation",
            "CSS"
          );
          return letter;
        });

        chrome.storage.local.set(
          { messages: result ? JSON.stringify(changedMessages) : null },
          () => {}
        );

        chrome.storage.local.get("messages", (res) => {
          console.log("🚀 ~ res:", res);
        });

        this.addButtonToPage(JSON.parse(result.messages));

        pdf = JSON.parse(result?.pdf);

        if (this.host === "site.centraldispatch.com") {
          if (
            window.location.href.split("?")[0] ===
            "https://site.centraldispatch.com/protected/listing/post-listing"
          ) {
            setTimeout(() => {
              const url = new URL(window.location.href);
              const originZip = url.searchParams.get("originZip");
              const destinationZip = url.searchParams.get("destinationZip");
              const ymmVehicleType =
                url.searchParams.get("ymmVehicleType") &&
                url.searchParams.get("ymmVehicleType").split(",");

              const inoperable =
                url.searchParams.get("inoperable") === "Running" ? "0" : "1";

              const hash = document.getElementById("b_t").value;
              window.location.href =
                "https://site.centraldispatch.com/protected/cargo/sample-prices-lightbox?" +
                `num_vehicles=${ymmVehicleType.length}&` +
                `ozip=${originZip}&dzip=${destinationZip}` +
                `&enclosed=0` +
                `&inop=${inoperable}&vehicle_types=${
                  Object.values(ymmVehicleType)[0]
                }&miles=0&${hash}`;
            }, Math.random() * (5000 - 1000) + 1000);
          }
        } else if (this.host === Content.SITE_BATS) {
          setTimeout(() => {
            let list = null;
            if (document.getElementById("view1")) {
              list = document
                .getElementById("view1")
                .getElementsByClassName("app-listview")[0];
            }
            if (!!list && list.getElementsByTagName("li")[0]) {
              this.setListSamplePrice(list);
            }
            setInterval(() => {
              if (document.getElementById("view1")) {
                list = document
                  .getElementById("view1")
                  .getElementsByClassName("app-listview")[0];
                this.setListSamplePrice(list);
              }
            }, 2000);

            document.head.insertAdjacentHTML(
              "beforeend",
              `
                                    <style>
                                        .button__pdf {
                                            border-radius: 5px;
                                            background: #baba3d;
                                            color: white;
                                            font-size: 16px;
                                            font-weight: 700;
                                            margin-left: 15px;
                                            margin-right: 15px;
                                        }

                                        .button__modal {
                                            border-radius: 5px;
                                            background: #613fc6;
                                            color: white;
                                            font-size: 16px;
                                            font-weight: 700;
                                            margin-left: 15px;
                                        }

                                        .select__my__select {
                                            width: 100%;
                                            font-family: inherit;
                                            font-size: inherit;
                                            cursor: inherit;
                                            line-height: inherit;
                                            margin-left: 15px;
                                            border: 1px solid grey;
                                            background: white;
                                            padding-left: 15px;
                                            border-radius: 5px;
                                            margin-right: 15px;
                                        }

                                        .label__my__label {
                                            font-size: 16px;
                                            font-weight: 700;
                                            border-left-width: 2px;
                                            border-left-style: solid;
                                            padding-left: 15px;
                                        }

                                    </style>
                                `
            );
            if (
              window.location.href.split("?")[0] ===
                "https://www.batscrm.com/pages/other-leads" ||
              window.location.href.split("?")[0] ===
                "https://www.batscrm.com/pages/global-search"
            ) {
              let listForInput = null;
              if (document.getElementById("view1")) {
                listForInput = document
                  .getElementById("view1")
                  .getElementsByClassName("app-listview")[0];
              }
              if (
                !!listForInput &&
                listForInput.getElementsByTagName("li")[0]
              ) {
                this.setListInput(listForInput);
              }
              setInterval(() => {
                if (document.getElementById("view1")) {
                  listForInput = document
                    .getElementById("view1")
                    .getElementsByClassName("app-listview")[0];
                  this.setListInput(listForInput);
                }
              }, 2000);
            }

            if (
              window.location.href.split("?")[0] ===
                "https://www.batscrm.com/pages/my-leads" &&
              window.location.search.substr(1).split("=")[0] === "_link"
            ) {
              const referenceNode = document
                .getElementsByClassName("app-page-header")[0]
                .getElementsByTagName("h2")[0];

              document
                .getElementsByClassName("app-page-header")[0]
                .setAttribute(
                  "style",
                  "display: flex; flex-direction: row;visibility: visible;justify-content: flex-end;background-color: cadetblue;padding: 1rem;"
                );

              let blockFlexSample = document.createElement("div");
              blockFlexSample.style =
                "display: flex;align-items: center;flex: 1;";

              let link = document.createElement("a");
              link.innerHTML = "Sample Price";
              link.style =
                "color: white;border: 0; padding: 0; cursor: pointer;";
              link.onclick = () => this.insideSamplePrice();
              link.setAttribute("class", "label__my__label");

              blockFlexSample.appendChild(link);

              referenceNode.parentNode.insertBefore(
                blockFlexSample,
                referenceNode.nextSibling
              );

              setTimeout(() => {
                document
                  .getElementsByClassName("app-feedback")
                  [
                    document.getElementsByClassName("app-feedback").length - 1
                  ].click();
              }, 1000);
              setTimeout(() => {
                document
                  .getElementsByClassName("app-feedback")
                  [
                    document.getElementsByClassName("app-feedback").length - 1
                  ].click();
              }, 1500);
            }

            if (
              (window.location.href.split("?")[0] ===
                "https://www.batscrm.com/pages/my-quotes" &&
                window.location.search.substr(1).split("=")[0] === "_link") ||
              (window.location.href.split("?")[0] ===
                "https://www.batscrm.com/pages/my-orders" &&
                window.location.search.substr(1).split("=")[0] === "_link")
            ) {
              let first = null;
              let orderId = null;
              try {
                //Changed location of script in array.
                //Probably some update on frontend of batscrm changed location of script
                // first = document.getElementsByTagName("script")[0];
                first = document.getElementsByTagName("script")[3];
                orderId = first.innerHTML.split("'")[1].split("=")[4];
              } catch (e) {
                first = document.getElementsByTagName("script")[1];
                orderId = first.innerHTML.split("'")[1].split("=")[4];
              }

              fetch("https://www.batscrm.com/_invoke/GetPage", {
                headers: {
                  accept: "text/plain, */*; q=0.01",
                  "accept-language":
                    "en,uk-UA;q=0.9,uk;q=0.8,en-US;q=0.7,ru;q=0.6",
                  "cache-control": "no-cache",
                  "content-type":
                    "application/x-www-form-urlencoded; charset=UTF-8",
                  pragma: "no-cache",
                  "sec-ch-ua":
                    '" Not A;Brand";v="99", "Chromium";v="96", "Google Chrome";v="96"',
                  "sec-ch-ua-mobile": "?0",
                  "sec-ch-ua-platform": '"Linux"',
                  "sec-fetch-dest": "empty",
                  "sec-fetch-mode": "cors",
                  "sec-fetch-site": "same-origin",
                  "x-requested-with": "XMLHttpRequest",
                },
                referrer:
                  "https://www.batscrm.com/pages/my-leads?_link=" +
                  window.location.search.substr(1).split("=")[1],
                referrerPolicy: "strict-origin-when-cross-origin",
                body:
                  '{"controller":"OpportunityVehicles","view":"grid1","request":{"PageIndex":-1,"PageSize":30,"PageOffset":0,"Filter":["OpportunityID:=' +
                  orderId +
                  '"],"ContextKey":"view1_Vehicles","FilterIsExternal":true,"ExternalFilter":[{"Name":"OpportunityID","Value":' +
                  orderId +
                  '}],"Tag":"view-style-list,view-style-listonecolumn,view-style-grid-disabled,view-style-cards-disabled,fee0","SupportsCaching":true}}',
                method: "POST",
                mode: "cors",
                credentials: "include",
              })
                .then((response) => {
                  return response.json();
                })
                .then((json) => {
                  const findNameCar = (name) => {
                    return json.d.Fields.findIndex(
                      (el, key) => el.Name === name
                    );
                  };

                  const keyCars = {
                    VehicleModelYear: findNameCar("VehicleModelYear"),
                    VehicleMake: findNameCar("VehicleMake"),
                    VehicleModel: findNameCar("VehicleModel"),
                    VehicleType: findNameCar("VehicleType"),
                    VehicleInop: findNameCar("VehicleInop"),
                    VehicleVin: findNameCar("VehicleVin"),
                    VehiclePlateNumber: findNameCar("VehiclePlateNumber"),
                    VehiclePlateState: findNameCar("VehiclePlateState"),
                    VehicleLotNumber: findNameCar("VehicleLotNumber"),
                    VehicleWeight: findNameCar("VehicleWeight"),
                    VehicleLength: findNameCar("VehicleLength"),
                    VehicleHeight: findNameCar("VehicleHeight"),
                    VehicleWidth: findNameCar("VehicleWidth"),
                    VehicleWeightMeasure: findNameCar("VehicleWeightMeasure"),
                    VehicleCarrierPay: findNameCar("VehicleCarrierPay"),
                  };

                  json.d.Rows.forEach((el, key) => {
                    this.allCars = {
                      ...this.allCars,
                      [key]: {
                        vehicleModelYear: el[keyCars["VehicleModelYear"]],
                        vehicleMake: el[keyCars["VehicleMake"]].trim(),
                        vehicleModel: el[keyCars["VehicleModel"]],
                        vehicleType: el[keyCars["VehicleType"]],
                        vehicleInop: el[keyCars["VehicleInop"]],
                        vehicleVin: el[keyCars["VehicleVin"]],
                        vehiclePlateNumber: el[keyCars["VehiclePlateNumber"]],
                        vehiclePlateState: el[keyCars["VehiclePlateState"]],
                        vehicleLotNumber: el[keyCars["VehicleLotNumber"]],
                        vehicleWeight: el[keyCars["VehicleWeight"]],
                        vehicleLength: el[keyCars["VehicleLength"]],
                        vehicleHeight: el[keyCars["VehicleHeight"]],
                        vehicleWidth: el[keyCars["VehicleWidth"]],
                        vehicleWeightMeasure:
                          el[keyCars["VehicleWeightMeasure"]],
                        vehicleCarrierPay: el[keyCars["VehicleCarrierPay"]],
                      },
                    };
                  });
                  let typeController = "";
                  if (
                    window.location.href.split("?")[0] ===
                    "https://www.batscrm.com/pages/my-quotes"
                  ) {
                    typeController = "Quotes";
                  } else {
                    typeController = "Orders";
                  }
                  fetch("https://www.batscrm.com/_invoke/GetPage", {
                    headers: {
                      accept: "text/plain, */*; q=0.01",
                      "accept-language":
                        "en,uk-UA;q=0.9,uk;q=0.8,en-US;q=0.7,ru;q=0.6",
                      "cache-control": "no-cache",
                      "content-type":
                        "application/x-www-form-urlencoded; charset=UTF-8",
                      pragma: "no-cache",
                      "sec-ch-ua":
                        '" Not A;Brand";v="99", "Chromium";v="96", "Google Chrome";v="96"',
                      "sec-ch-ua-mobile": "?0",
                      "sec-ch-ua-platform": '"Linux"',
                      "sec-fetch-dest": "empty",
                      "sec-fetch-mode": "cors",
                      "sec-fetch-site": "same-origin",
                      "x-requested-with": "XMLHttpRequest",
                    },
                    referrer:
                      "https://www.batscrm.com/pages/my-leads?_link=PVE6JRGnYPYASeWMCTFJkbtik5x6309wgaoeo3j495hzTmWRUokP1ZSHdiH%2bZMIWMs8yo2htKpv42JpKBfTIiwWE16%2bbq9YUG6MmBwkAmHJUukRFrpFtJQJFWqW9Yg86DqGTWNIN1k5cSeJfjkhL4A%3d%3d",
                    referrerPolicy: "strict-origin-when-cross-origin",
                    body:
                      '{"controller":"' +
                      typeController +
                      '","view":"editForm1","request":{"PageIndex":-1,"PageSize":30,"PageOffset":0,"Filter":["_controller:=Leads","_commandName:=Edit","_commandArgument:=editForm1","ID:=' +
                      orderId +
                      '"],"ContextKey":"view1","FilterIsExternal":true,"LastCommandName":"Edit","LastCommandArgument":"editForm1","ExternalFilter":[{"Name":"_controller","Value":"' +
                      typeController +
                      '"},{"Name":"_commandName","Value":"Edit"},{"Name":"_commandArgument","Value":"editForm1"},{"Name":"ID","Value":"' +
                      orderId +
                      '"}],"SupportsCaching":true}}',
                    method: "POST",
                    mode: "cors",
                    credentials: "include",
                  })
                    .then((result) => {
                      return result.json();
                    })
                    .then((result) => {
                      const findName = (name) => {
                        return result.d.Fields.findIndex(
                          (el, key) => el.Name === name
                        );
                      };

                      const keys = {
                        ID: findName("ID"),
                        CustomerID: findName("CustomerID"),
                        AssignedUserName: findName("AssignedUserName"),
                        Name: findName("Name"),
                        FirstAvailablePickupDate: findName(
                          "FirstAvailablePickupDate"
                        ),
                        TransportTypeName: findName("TransportTypeName"),
                        CustomerPhone: findName("CustomerPhone"),
                        Company: findName("Company"),
                        ShipDate: findName("ShipDate"),
                        CustomerEmail: findName("CustomerEmail"),
                        CustomerPhoneMasked: findName("CustomerPhoneMasked"),
                        TotalTariff: findName("TotalTariff"),
                        TotalCarrierPay: findName("TotalCarrierPay"),
                        TotalBrokerFee: findName("TotalBrokerFee"),
                        CustomerBalance: findName("CustomerBalance"),
                        LinkToeDoc: findName("LinkToeDoc"),

                        OriginContactName: findName("OriginContactName"),
                        OriginContactPhone: findName("OriginContactPhone"),
                        OriginContactPhone2: findName("OriginContactPhone2"),
                        OriginContactPhone3: findName("OriginContactPhone3"),
                        OriginContactPhoneCell: findName(
                          "OriginContactPhoneCell"
                        ),
                        OriginContactEmail: findName("OriginContactEmail"),
                        OriginAddress: findName("OriginAddress"),
                        OriginAddress2: findName("OriginAddress2"),
                        OriginCompanyName: findName("OriginCompanyName"),
                        OriginBuyerNumber: findName("OriginBuyerNumber"),
                        OriginCity: findName("OriginCity"),
                        OriginState: findName("OriginState"),
                        OriginPostalCode: findName("OriginPostalCode"),
                        OriginCountry: findName("OriginCountry"),

                        DestinationContactName: findName(
                          "DestinationContactName"
                        ),
                        DestinationContactPhone: findName(
                          "DestinationContactPhone"
                        ),
                        DestinationContactPhone2: findName(
                          "DestinationContactPhone2"
                        ),
                        DestinationContactPhone3: findName(
                          "DestinationContactPhone3"
                        ),
                        DestinationContactPhoneCell: findName(
                          "DestinationContactPhoneCell"
                        ),
                        DestinationContactEmail: findName(
                          "DestinationContactEmail"
                        ),
                        DestinationAddress: findName("DestinationAddress"),
                        DestinationAddress2: findName("DestinationAddress2"),
                        DestinationCompanyName: findName(
                          "DestinationCompanyName"
                        ),
                        DestinationBuyerNumber: findName(
                          "DestinationBuyerNumber"
                        ),
                        DestinationCity: findName("DestinationCity"),
                        DestinationState: findName("DestinationState"),
                        DestinationPostalCode: findName(
                          "DestinationPostalCode"
                        ),
                        DestinationCountry: findName("DestinationCountry"),
                      };
                      const curtomerID = result.d.Rows[0][keys["CustomerID"]];

                      let idOrder = 0;
                      try {
                        idOrder =
                          document.getElementsByClassName("app-field-ID")[0]
                            .textContent;
                      } catch (e) {
                        idOrder = result.d.Rows[0][keys["ID"]];
                      }

                      /*global chrome*/
                      chrome.storage.local.get(idOrder + "_pageData", (el) => {
                        const startSecondStep = (
                          idOrder,
                          result,
                          curtomerID
                        ) => {
                          /*global chrome*/
                          chrome.storage.local.set(
                            {
                              [idOrder + "_pageData"]: JSON.stringify({
                                orderId: result.d.Rows[0][keys["ID"]],
                                linkToeDoc:
                                  result.d.Rows[0][keys["LinkToeDoc"]],
                                customerID: curtomerID,
                                customerFullName:
                                  result.d.Rows[0][keys["Name"]],
                                assignedUserName:
                                  result.d.Rows[0][keys["AssignedUserName"]],
                                firstPickupDate:
                                  result.d.Rows[0][
                                    keys["FirstAvailablePickupDate"]
                                  ],
                                firstAvailablePickupDate:
                                  result.d.Rows[0][keys["shipDate"]],
                                shipVia:
                                  result.d.Rows[0][keys["TransportTypeName"]],
                                shipDate: result.d.Rows[0][keys["ShipDate"]],
                                customerPhone:
                                  result.d.Rows[0][keys["CustomerPhone"]],
                                company: result.d.Rows[0][keys["Company"]],
                                customerPhone2: "",
                                customerEmail:
                                  result.d.Rows[0][keys["CustomerEmail"]],
                                totalTariff:
                                  result.d.Rows[0][keys["TotalTariff"]],
                                totalCarrierPay:
                                  result.d.Rows[0][keys["TotalCarrierPay"]],
                                totalBrokerFee:
                                  result.d.Rows[0][keys["TotalBrokerFee"]],
                                customerBalance:
                                  result.d.Rows[0][keys["CustomerBalance"]],

                                originContactName:
                                  result.d.Rows[0][keys["OriginContactName"]],
                                originContactPhone:
                                  result.d.Rows[0][keys["OriginContactPhone"]],
                                originContactPhone2:
                                  result.d.Rows[0][keys["OriginContactPhone2"]],
                                originContactPhone3:
                                  result.d.Rows[0][keys["OriginContactPhone3"]],
                                originContactPhoneCell:
                                  result.d.Rows[0][
                                    keys["OriginContactPhoneCell"]
                                  ],
                                originContactEmail:
                                  result.d.Rows[0][keys["OriginContactEmail"]],
                                originAddress:
                                  result.d.Rows[0][keys["OriginAddress"]],
                                originAddress2:
                                  result.d.Rows[0][keys["OriginAddress2"]],
                                originCompanyName:
                                  result.d.Rows[0][keys["OriginCompanyName"]],
                                originBuyerNumber:
                                  result.d.Rows[0][keys["OriginBuyerNumber"]],
                                originCity:
                                  result.d.Rows[0][keys["OriginCity"]],
                                originState:
                                  result.d.Rows[0][keys["OriginState"]],
                                originZip:
                                  result.d.Rows[0][keys["OriginPostalCode"]],
                                originCountry:
                                  result.d.Rows[0][keys["OriginCountry"]],

                                destinationContactName:
                                  result.d.Rows[0][
                                    keys["DestinationContactName"]
                                  ],
                                destinationContactPhone:
                                  result.d.Rows[0][
                                    keys["DestinationContactPhone"]
                                  ],
                                destinationContactPhone2:
                                  result.d.Rows[0][
                                    keys["DestinationContactPhone2"]
                                  ],
                                destinationContactPhone3:
                                  result.d.Rows[0][
                                    keys["DestinationContactPhone3"]
                                  ],
                                destinationContactPhoneCell:
                                  result.d.Rows[0][
                                    keys["DestinationContactPhoneCell"]
                                  ],
                                destinationContactEmail:
                                  result.d.Rows[0][
                                    keys["DestinationContactEmail"]
                                  ],
                                destinationAddress:
                                  result.d.Rows[0][keys["DestinationAddress"]],
                                destinationAddress2:
                                  result.d.Rows[0][keys["DestinationAddress2"]],
                                destinationCompanyName:
                                  result.d.Rows[0][
                                    keys["DestinationCompanyName"]
                                  ],
                                destinationBuyerNumber:
                                  result.d.Rows[0][
                                    keys["DestinationBuyerNumber"]
                                  ],
                                destinationCity:
                                  result.d.Rows[0][keys["DestinationCity"]],
                                destinationState:
                                  result.d.Rows[0][keys["DestinationState"]],
                                destinationZip:
                                  result.d.Rows[0][
                                    keys["DestinationPostalCode"]
                                  ],
                                destinationCountry:
                                  result.d.Rows[0][keys["DestinationCountry"]],
                                cars: this.allCars,
                              }),
                            },
                            () => {
                              fetch("https://www.batscrm.com/_invoke/GetPage", {
                                headers: {
                                  accept: "text/plain, */*; q=0.01",
                                  "accept-language":
                                    "en,uk-UA;q=0.9,uk;q=0.8,en-US;q=0.7,ru;q=0.6",
                                  "cache-control": "no-cache",
                                  "content-type":
                                    "application/x-www-form-urlencoded; charset=UTF-8",
                                  pragma: "no-cache",
                                  "sec-ch-ua":
                                    '" Not A;Brand";v="99", "Chromium";v="96", "Google Chrome";v="96"',
                                  "sec-ch-ua-mobile": "?0",
                                  "sec-ch-ua-platform": '"Linux"',
                                  "sec-fetch-dest": "empty",
                                  "sec-fetch-mode": "cors",
                                  "sec-fetch-site": "same-origin",
                                  "x-requested-with": "XMLHttpRequest",
                                },
                                referrer:
                                  "https://www.batscrm.com/pages/my-orders",
                                referrerPolicy:
                                  "strict-origin-when-cross-origin",
                                body:
                                  '{"controller":"Customer","view":"editForm1","request":{"PageIndex":-1,"PageSize":30,"PageOffset":0,"Filter":["CustomerID:=%js%' +
                                  curtomerID +
                                  '"],"ContextKey":"customer","FilterIsExternal":true,"ExternalFilter":[{"Name":"CustomerID","Value":"%js%' +
                                  curtomerID +
                                  '"}],"SupportsCaching":true}}',
                                method: "POST",
                                mode: "cors",
                                credentials: "include",
                              })
                                .then((response) => response.json())
                                .then((result) => {
                                  const findName = (name) => {
                                    return result.d.Fields.findIndex(
                                      (el, key) => el.Name === name
                                    );
                                  };

                                  const keys = {
                                    FirstName: findName("FirstName"),
                                    LastName: findName("LastName"),
                                    FullName: findName("FullName"),
                                    CustomerPhone: findName("CustomerPhone"),
                                    CustomerPhone2Mobile: findName(
                                      "CustomerPhone2Mobile"
                                    ),
                                    CustomerFax: findName("CustomerFax"),
                                    CustomerAddress:
                                      findName("CustomerAddress"),
                                    CustomerAddress2:
                                      findName("CustomerAddress2"),
                                    CustomerCity: findName("CustomerCity"),
                                    CustomerPostalCode:
                                      findName("CustomerPostalCode"),
                                    CustomerCountry:
                                      findName("CustomerCountry"),
                                    CustomerProvince:
                                      findName("CustomerProvince"),
                                  };
                                  const idOrder =
                                    document.getElementsByClassName(
                                      "app-field-ID"
                                    )[0].textContent;
                                  /*global chrome*/
                                  chrome.storage.local.get(
                                    [idOrder + "_pageData"],
                                    (el) => {
                                      this.setToLocal(
                                        el[idOrder + "_pageData"],
                                        idOrder,
                                        pdf,
                                        result,
                                        keys
                                      );

                                      setTimeout(() => {
                                        document
                                          .getElementsByClassName(
                                            "app-feedback"
                                          )
                                          [
                                            document.getElementsByClassName(
                                              "app-feedback"
                                            ).length - 1
                                          ].click();
                                      }, 1000);
                                      setTimeout(() => {
                                        document
                                          .getElementsByClassName(
                                            "app-feedback"
                                          )
                                          [
                                            document.getElementsByClassName(
                                              "app-feedback"
                                            ).length - 1
                                          ].click();
                                      }, 1500);
                                    }
                                  );
                                });
                            }
                          );
                        };

                        if (el[idOrder + "_pageData"]) {
                          chrome.storage.local.remove(
                            idOrder + "_pageData",
                            () => {
                              startSecondStep(idOrder, result, curtomerID);
                            }
                          );
                        } else {
                          startSecondStep(idOrder, result, curtomerID);
                        }
                      });
                      // This
                    });
                });
            }
          }, 5000);
        }
      }
    });
  }

  openNewWindows = (url) => window.open(url, "_blank");

  getPdf() {
    chrome.storage.local.get("pdf", (pdf_res) => {
      const e = document.getElementById("pdf_options_crystal");
      const selected_template_id = +e.options[e.selectedIndex].value;
      let pdf_templates = JSON.parse(pdf_res.pdf);
      let selected_template = pdf_templates.find(
        (pdf) => pdf.key === selected_template_id
      );

      const idOrder =
        document.getElementsByClassName("app-field-ID")[0].textContent;
      /*global chrome*/
      chrome.storage.local.get([idOrder + "_pageData"], (el) => {
        const pageData = el[idOrder + "_pageData"];
        const pageDataJson = JSON.parse(pageData);
        const data = {
          ...pageDataJson,
          templateId: +e.options[e.selectedIndex].value,
          firstPickupDate:
            pageDataJson.firstAvailablePickupDate ??
            document.getElementsByClassName(
              "app-field-FirstAvailablePickupDate"
            )[0].innerText,
          userId: this.currentUser.id,
        };

        fetch("https://www.batscrm.com/_invoke/GetPage", {
          headers: {
            accept: "text/plain, */*; q=0.01",
            "accept-language": "en,uk-UA;q=0.9,uk;q=0.8,en-US;q=0.7,ru;q=0.6",
            "cache-control": "no-cache",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            pragma: "no-cache",
            "x-requested-with": "XMLHttpRequest",
          },
          body:
            '{"controller":"CarriersInterestedInOrder","view":"grid1","request":{' +
            '"PageIndex":-1,"PageSize":30,"PageOffset":0,"Filter":' +
            '["OpportunityID:=' +
            idOrder +
            '"],"ContextKey":"view1_InterestedCarriers","FilterIsExternal":true,"ExternalFilter":[{' +
            '"Name":"OpportunityID","Value":' +
            idOrder +
            '}],"Tag":"view-style-grid,view-style-calendar-disabled,view-style-list-disabled,view-style-cards-disabled,view-style-charts-disabled","SupportsCaching":true}}',
          method: "POST",
          Host: "www.batscrm.com",
          Origin: "https://www.batscrm.com",
        })
          .then((response) => response.json())
          .then((response) => {
            const findName = (name) => {
              return response.d.Fields.findIndex((el, key) => el.Name === name);
            };
            const keys = {
              PickupDate: findName("PickupDate"),
              DeliveryDate: findName("DeliveryDate"),
              AssignedWhere: findName("AssignedWhere"),
            };

            let key = response.d.Rows.findIndex(
              (el) => el[keys["AssignedWhere"]] === 1
            );
            let dataWith = {
              PickupDate:
                key >= 0
                  ? response.d.Rows[key][keys["PickupDate"]].split("T")[0]
                  : "",
              DeliveryDate:
                key >= 0
                  ? response.d.Rows[key][keys["DeliveryDate"]].split("T")[0]
                  : "",
            };

            fetch("https://www.batscrm.com/_invoke/GetPage", {
              headers: {
                accept: "text/plain, */*; q=0.01",
                "accept-language":
                  "en,uk-UA;q=0.9,uk;q=0.8,en-US;q=0.7,ru;q=0.6",
                "cache-control": "no-cache",
                "content-type":
                  "application/x-www-form-urlencoded; charset=UTF-8",
                pragma: "no-cache",
                "x-requested-with": "XMLHttpRequest",
              },
              body:
                '{"controller": "UserForTenantAdmin", "view": "editForm1",' +
                '"request": {"PageIndex": -1, "PageSize": 30, "PageOffset": 0,' +
                // '"Filter": ["UserID:=%js%"de4bde73-9f64-45c5-a1a6-b8fde7c1e482""],' +
                '"ContextKey": "userfortenantadmin",' +
                '"LastCommandName": "Select",' +
                '"LastCommandArgument": "editForm1",' +
                '"LastView": "grid1",' +
                '"Tag": "view-style-grid,view-style-list-disabled,view-style-cards-disabled,view-style-calendar-disabled,view-style-charts-disabled,page-header-none,inline-editing-option-none,inline-editing-none optimistic-default-values-none",' +
                '"SupportsCaching": true' +
                "}}",
              method: "POST",
              Host: "www.batscrm.com",
              Origin: "https://www.batscrm.com",
            })
              .then((users) => users.json())
              .then((users) => {
                console.log("🚀 ~ users:", users.d.Rows);

                let users_list = users.d.Rows.map((user) => {
                  return {
                    email: user[0],
                    first_name: user[3],
                    last_name: user[4],
                    phone: user[5],
                  };
                });
                console.log("🚀 ~ users_list:", users_list);

                console.log({
                  ...data,
                  ...dataWith,
                  users: users_list,
                });

                chrome.storage.local.get("token", (token) => {
                  if (token) {
                    fetch(
                      Content.BASE_URL +
                        "/filled_pdf_template/" +
                        selected_template_id,
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Accept: "application/json",
                          Authorization: `Bearer ${token.token}`,
                        },
                        body: JSON.stringify({
                          ...data,
                          ...dataWith,
                          users: users_list,
                        }),
                      }
                    )
                      .then((response) => {
                        return response.json();
                      })
                      .then((resp) => {
                        this.downloadPDF(
                          resp.template_data,
                          resp.template_name
                        );
                      });
                  }
                });

                // fetch(
                //   "https://pdf-lib.js.org/assets/with_update_sections.pdf",
                //   {
                //     method: "GET",
                //   }
                // )
                //   .then((resp) => resp.blob())
                //   .then((blob) => {
                //     const url = window.URL.createObjectURL(blob);
                //     const a = document.createElement("a");
                //     a.style.display = "none";
                //     a.href = url;
                //     a.download = "name"; // the filename you want
                //     document.body.appendChild(a);
                //     a.click();
                //     window.URL.revokeObjectURL(url);
                //   });
              });
            console.log("🚀 ~ data:", data);
            console.log("🚀 ~ dataWith:", dataWith);
            console.log("🚀 ~ selected_template:", selected_template);

            // this.downloadPDF(selected_template.data, selected_template.value);

            // fetch(Content.BASE_URL + "/pdf/", {
            //   method: "POST",
            //   headers: {
            //     "Content-Type": "application/json",
            //     Accept: "application/json",
            //   },
            //   body: JSON.stringify({ ...data, ...dataWith }),
            // })
            //   .then((response) => {
            //     return response.json();
            //   })
            //   .then((resp) => {
            //     window.open(Content.BASE_URL_FILE + resp.data, "_blank");
            //   });

            // fetch("https://pdf-lib.js.org/assets/with_update_sections.pdf", {
            //   method: "GET",
            // })
            //   .then((resp) => resp.blob())
            //   .then((blob) => {
            //     const url = window.URL.createObjectURL(blob);
            //     const a = document.createElement("a");
            //     a.style.display = "none";
            //     a.href = url;
            //     a.download = "name"; // the filename you want
            //     document.body.appendChild(a);
            //     a.click();
            //     window.URL.revokeObjectURL(url);
            //   });
          });
      });
    });
  }

  /**
   * Creates an anchor element `<a></a>` with
   * the base64 pdf source and a filename with the
   * HTML5 `download` attribute then clicks on it.
   * @param  {string} pdf
   * @param  {string} filename
   * @return {void}
   */
  downloadPDF(pdf, filename) {
    const linkSource = `data:application/pdf;base64,${pdf}`;
    const downloadLink = document.createElement("a");
    const fileName = filename;

    downloadLink.href = linkSource;
    downloadLink.download = fileName;
    downloadLink.click();
  }

  sendReport(id, deposit, idOrder, status, on_cd = false, order = {}) {
    try {
      this.chromeRun.sendMessage(
        {
          action: "sendReport",
          data: { id, deposit, id_order: idOrder, status, on_cd, order },
        },
        (response) => {
          if (
            response !== undefined &&
            response !== "" &&
            response.action === "sendReport"
          ) {
            if (+response.response.status === 200) {
              /*global chrome*/
              chrome.storage.local.set({
                [response.response.data.jtracker_id + "_on_cd"]:
                  response.response.data.on_cd,
              });
              if (response.response.hash) {
                chrome.storage.local.set({
                  [response.response.data.jtracker_id + "_hash"]:
                    response.response.hash,
                });
              }
              this.addButtonForDailyReport(
                id,
                deposit,
                idOrder,
                response.response.data.status
              );
              setTimeout(() => {
                if (confirm(response.response.message)) {
                  window.location.reload();
                }
              }, 1000);
            }
            return null;
          }
        }
      );
    } catch (e) {
      console.log(e.getMessageAll());
    }
  }

  sendReportCashOpenModal(id, idOrder, statusValue) {
    if (document.getElementById("cash_card_check") === null) {
      let bodyBlackout = document.createElement("div");
      bodyBlackout.setAttribute("class", "body-blackout");

      let modal = document.createElement("div");
      modal.setAttribute("class", "modal");
      modal.id = "cash_check_modal";
      let modalDiv = document.createElement("div");
      modalDiv.setAttribute("class", "modal-content modal-content-card");

      let modalSpan = document.createElement("span");
      modalSpan.setAttribute("class", "close");
      modalSpan.id = "close__modal__cash";
      modalSpan.innerHTML = "&times;";

      let cashNumber = document.createElement("input");
      cashNumber.setAttribute("value", "");
      cashNumber.setAttribute("type", "text");
      cashNumber.setAttribute("placeholder", "$ 100");
      cashNumber.setAttribute("id", "cash");
      cashNumber.setAttribute("name", "cash");

      let labelCardNumber = document.createElement("label");
      labelCardNumber.setAttribute("fot", "cash");
      labelCardNumber.setAttribute("class", "dpf-input-label");
      labelCardNumber.innerHTML = "Test Amount";

      let divCardNumber = document.createElement("div");
      divCardNumber.setAttribute("class", "row__input");
      divCardNumber.setAttribute("style", "margin: 0; width: 100%;");
      divCardNumber.appendChild(labelCardNumber);
      divCardNumber.appendChild(cashNumber);

      let selectInput = document.createElement("select");
      selectInput.setAttribute("style", "margin: 0; width: 100%;");
      selectInput.setAttribute("id", "cash_select");
      selectInput.setAttribute("name", "cash_select");

      const array = [
        {
          key: "credit_card",
          value: "Credit card",
        },
        {
          key: "pay_pal",
          value: "Pay Pal",
        },
        {
          key: "zelle",
          value: "Zelle",
        },
        {
          key: "cash_up",
          value: "Cash up",
        },
        {
          key: "check",
          value: "Check",
        },
      ];

      for (var i = 0; i < array.length; i++) {
        var option = document.createElement("option");
        option.value = array[i].key;
        option.text = array[i].value;
        selectInput.appendChild(option);
      }

      let labelSelect = document.createElement("label");
      labelSelect.setAttribute("fot", "cash_select");
      labelSelect.setAttribute("class", "dpf-input-label");
      labelSelect.innerHTML = "Select payment method";

      let divLabelSelect = document.createElement("div");
      divLabelSelect.setAttribute(
        "style",
        "margin-top: 40px;margin-left: 0; margin-right: 0;"
      );
      divLabelSelect.setAttribute("class", "row__input");
      divLabelSelect.appendChild(labelSelect);
      divLabelSelect.appendChild(selectInput);

      let button = document.createElement("button");
      button.innerHTML = "Sent";
      button.setAttribute("class", "btn btn-default btn-w-100");
      button.setAttribute("style", "margin-left: 20px;");
      button.setAttribute("id", "cash_request");

      let status = document.createElement("div");
      status.setAttribute("class", "card_status");
      status.setAttribute("id", "cash_status");

      let divMain = document.createElement("div");
      divMain.setAttribute("class", "row__block row__second__block");

      divMain.appendChild(divCardNumber);
      divMain.appendChild(divLabelSelect);

      modalDiv.appendChild(modalSpan);
      modalDiv.appendChild(status);
      modalDiv.appendChild(divMain);
      modalDiv.appendChild(button);
      modal.appendChild(modalDiv);

      document.getElementById("pageHeader").after(modal);
      document.getElementById("pageHeader").after(bodyBlackout);

      button.onclick = () => {
        this.sendReportCash(
          id,
          idOrder,
          statusValue,
          cashNumber.value,
          selectInput.value
        );
      };

      modalSpan.onclick = () => this.openCashModal("none");
    }
  }

  /**
   * open model
   */
  openCashModal(status) {
    if (document.getElementById("cash")) {
      document.getElementById("cash").value = "";
    }
    if (document.getElementById("cash_check_modal")) {
      document
        .getElementById("cash_check_modal")
        .setAttribute("style", "display: " + status + ";");
    }
  }

  sendReportCash(id, idOrder, statusValue, cashNumberValue, selectInputValue) {
    try {
      this.chromeRun.sendMessage(
        {
          action: "sendCashReport",
          data: {
            id,
            deposit: cashNumberValue,
            order_id: idOrder,
            status: statusValue,
            payment_method: selectInputValue,
          },
        },
        (response) => {
          if (
            response !== undefined &&
            response !== "" &&
            response.action === "sendCashReport"
          ) {
            if (+response.response.status === 200) {
              this.openCashModal("none");

              if (statusValue === "need_to_charged") {
                /*global chrome*/
                chrome.storage.local.set({ [`cash-charged-${idOrder}`]: 1 });
              } else if (statusValue === "need_to_authorize") {
                /*global chrome*/
                chrome.storage.local.set({ [`cash-${idOrder}`]: 1 });
              }
              document.getElementById("add_report_second").style =
                "display:none";
              setTimeout(() => {
                alert(response.response.message);
              }, 1000);
            }
            return null;
          }
        }
      );
    } catch (e) {
      console.log(e.getMessageAll());
    }
  }

  /**
   *
   * @param id
   * @param deposit
   * @param idOrder
   * @param orderStatus
   */
  addButtonForDailyReport(id, deposit, idOrder, orderStatus = null) {
    const status = document
      .getElementById("col3")
      .getElementsByClassName("detailBoxThin")[0]
      .getElementsByTagName("strong");
    /*global chrome*/
    chrome.storage.local.get(["orderStatus"], (el) => {
      const orderStatusLocal = el.orderStatus;

      if (
        (status && document.getElementById("add_report") === null) ||
        orderStatusLocal !== orderStatus
      ) {
        let button = document.createElement("span");

        chrome.storage.local.get(
          [
            idOrder + "_on_cd",
            "orderStatus" + id,
            `cash-${idOrder}`,
            `cash-charged-${idOrder}`,
            `${idOrder}_hash`,
          ],
          (el) => {
            let idOrderHash = el[`${idOrder}_hash`];
            let cashIdOrder = el[`cash-${idOrder}`];
            let cashChargedIdOrder = el[`cash-charged-${idOrder}`];
            let orderStatusId = el[`orderStatus${id}`];
            let onCd = el[`${idOrder}_on_cd`] === "true";

            button.setAttribute("style", "margin-top: 0;");

            const styleCss =
              "<style>#actionTabMenuMy {\n" +
              "\tfont-size: 12px;\n" +
              "\tcolor: white;\n" +
              "\tfloat: right;\n" +
              "\tmargin-top: -10px;\n" +
              "}\n" +
              "#actionTabMenuMy ul { display: inline; }\n" +
              "#actionTabMenuMy ul li {\n" +
              "\tlist-style: none;\n" +
              "\tdisplay: inline;\n" +
              "\theight: 25px;\n" +
              "\tline-height: 25px;\n" +
              "\tpadding: 5px;\n" +
              "}\n" +
              "#actionTabMenuMy ul li.inactive { background-color: " +
              (onCd ? "red" : "#555") +
              "; }\n" +
              "#actionTabMenuMy ul li.active { background-color: #999; }\n</style>";

            let buttonSecond = null;
            if (document.getElementById("daily_report")) {
              document.getElementById("daily_report").remove();
            }
            if (document.getElementById("status-tab")) {
              document.getElementById("status-tab").remove();
            }

            /* Show current status */
            const __html =
              '<span id="status-tab" class="tab" style="color: #fff; background-color: #28a745;">' +
              '<a style="background: none;color: #fff; background-color: #28a745;">' +
              "Status: " +
              (orderStatus !== null
                ? orderStatus.toString().replaceAll("_", " ")
                : "N/A") +
              "</a></span>";
            document
              .getElementsByClassName("actionTab")[0]
              .insertAdjacentHTML("afterend", __html);

            const __html2list =
              '<div id="actionTabMenuMy" style="display: none;"><ul><li></li></ul></div>';
            const menuButton =
              '<span class="actionTab" id="actionTabMy"><a href="#">My Actions</a></span>';

            if (!document.getElementById("actionTabMy")) {
              document
                .getElementsByClassName("tabMenu")[0]
                .getElementsByClassName("tabMenu")[0]
                .insertAdjacentHTML("beforeend", menuButton);
            }
            document
              .getElementById("actionTabMenu")
              .insertAdjacentHTML("afterend", styleCss + __html2list);

            const actionTabMenuMy = document.getElementById("actionTabMenuMy");

            document.getElementById("actionTabMy").onclick = (e) => {
              e.preventDefault();
              document
                .getElementById("actionTabMenu")
                .setAttribute("style", "display: none;");
              let myBlock = document.getElementById("actionTabMenuMy");

              if (myBlock.style.display === "block") {
                myBlock.setAttribute("style", "display: none;");
              } else {
                myBlock.setAttribute("style", "display: block;");
              }
            };

            document.getElementsByClassName("actionTab")[0].onclick = (e) => {
              e.preventDefault();
              let myBlock = document.getElementById("actionTabMenu");
              let myBlockMy = document.getElementById("actionTabMenuMy");

              if (
                !myBlock.style.display ||
                myBlockMy.style.display === "block"
              ) {
                myBlockMy.setAttribute("style", "display: none;");
              }
            };

            const statusText = status[status.length - 1].textContent;
            let statusValue = "";
            let buttonVoid = null;
            if (
              ((statusText === "Posted to CD:" ||
                statusText === "New order:" ||
                statusText === "Not Signed:" ||
                statusText === "Dispatched:" ||
                onCd) &&
                orderStatus === null &&
                orderStatus !== "booked_with_contract" &&
                orderStatusId === null &&
                orderStatusId !== "booked_with_contract") ||
              ((statusText === "Dispatched:" || statusText === "Picked-up:") &&
                orderStatus === null) ||
              ((statusText === "Posted to CD:" ||
                statusText === "New order:" ||
                statusText === "Not Signed:") &&
                orderStatus === null)
            ) {
              button.innerHTML = "Mark as Booked" + (onCd ? " (CD)" : "");
              statusValue = "booked_with_contract";
            } else if (
              ((statusText === "Dispatched:" ||
                statusText === "Picked-up:" ||
                statusText === "Posted to CD:" ||
                onCd) &&
                orderStatus === "booked_with_contract") ||
              orderStatus === "voided"
            ) {
              button.innerHTML = "Mark as Dispatched" + (onCd ? " (CD)" : "");
              statusValue = "dispatched";
            } else if (
              (statusText === "Dispatched:" ||
                statusText === "Picked-up:" ||
                statusText === "Posted to CD:" ||
                onCd) &&
              orderStatus === "dispatched"
            ) {
              button.innerHTML = "Need to Authorize" + (onCd ? " (CD)" : "");
              statusValue = "need_to_authorize";

              if (!cashIdOrder) {
                buttonSecond = document.createElement("span");
                buttonSecond.setAttribute("style", "margin-top: 0;");
                buttonSecond.innerHTML =
                  "Mark as Cash payment" + (onCd ? " (CD)" : "");

                buttonSecond.onclick = (e) => {
                  e.preventDefault();
                  if ("$0.00" === deposit) {
                    this.openCashModal("block");
                  } else {
                    alert("Sorry, but you deposit is not $0.00");
                  }
                };
                buttonSecond.setAttribute("id", "add_report_second");
              }
            } else if (
              (statusText === "Picked-up:" ||
                statusText === "Posted to CD:" ||
                onCd) &&
              orderStatus === "authorized"
            ) {
              button.innerHTML = "Need to Charge" + (onCd ? " (CD)" : "");
              statusValue = "need_to_charged";

              if (!cashChargedIdOrder) {
                buttonSecond = document.createElement("span");
                buttonSecond.setAttribute("style", "margin-top: 0;");
                buttonSecond.innerHTML =
                  "Receive Cash payment" + (onCd ? " (CD)" : "");
                buttonSecond.onclick = (e) => {
                  e.preventDefault();
                  if ("$0.00" === deposit) {
                    this.openCashModal("block");
                  } else {
                    alert("Sorry, but you deposit is not $0.00");
                  }
                };
                buttonSecond.setAttribute("id", "add_report_second");
              }
            } else if (
              (statusText === "Dispatched:" ||
                statusText === "Picked-up:" ||
                statusText === "Outstanding Issue - Payment:" ||
                onCd) &&
              orderStatus === "charged"
            ) {
              button.innerHTML = "Need to Refund" + (onCd ? " (CD)" : "");
              statusValue = "need_to_refund";
            } else {
              button = null;
            }

            let buttonHash = null;
            if (idOrderHash) {
              buttonHash = document.createElement("span");
              buttonHash.innerHTML = "Get link";
              buttonHash.setAttribute("style", "margin-top: 0;");
              buttonHash.onclick = (e) => {
                e.preventDefault();

                this.openModalWithHash(idOrderHash);

                this.clickOpenModalHash();
              };
              buttonHash.setAttribute("id", "add_report_void");
            }

            if (orderStatus === "authorized") {
              buttonVoid = document.createElement("span");
              buttonVoid.innerHTML = "Need to Void" + (onCd ? " (CD)" : "");
              buttonVoid.setAttribute("style", "margin-top: 0;");
              buttonVoid.onclick = (e) => {
                e.preventDefault();
                this.sendReport(id, deposit, idOrder, "need_to_void");
              };
              buttonVoid.setAttribute("id", "add_report_void");
            } else if (orderStatus === "need_to_charged") {
              buttonVoid = document.createElement("span");
              buttonVoid.innerHTML =
                "Back to Authorized" + (onCd ? " (CD)" : "");
              buttonVoid.setAttribute("style", "margin-top: 0;");
              buttonVoid.onclick = (e) => {
                e.preventDefault();
                this.sendReport(id, deposit, idOrder, "authorized");
              };
              buttonVoid.setAttribute("id", "add_report_void");
            } else if (orderStatus === "need_to_authorize") {
              buttonVoid = document.createElement("span");
              buttonVoid.innerHTML =
                "Back to Dispatched" + (onCd ? " (CD)" : "");
              buttonVoid.setAttribute("style", "margin-top: 0;");
              buttonVoid.onclick = (e) => {
                e.preventDefault();
                this.sendReport(id, deposit, idOrder, "dispatched");
              };
              buttonVoid.setAttribute("id", "add_report_void");
            } else if (orderStatus === "need_to_void") {
              buttonVoid = document.createElement("span");
              buttonVoid.innerHTML =
                "Back to Authorized" + (onCd ? " (CD)" : "");
              buttonVoid.setAttribute("style", "margin-top: 0;");
              buttonVoid.onclick = (e) => {
                e.preventDefault();
                this.sendReport(id, deposit, idOrder, "authorized");
              };
              buttonVoid.setAttribute("id", "add_report_void");
            } else if (orderStatus === "booked_with_contract") {
              buttonVoid = document.createElement("span");
              buttonVoid.innerHTML = "Unbook" + (onCd ? " (CD)" : "");
              buttonVoid.setAttribute("style", "margin-top: 0;");
              buttonVoid.onclick = (e) => {
                e.preventDefault();
                this.sendReport(id, deposit, idOrder, "unbook");
              };
              buttonVoid.setAttribute("id", "add_report_void");
            } else if (orderStatus === "dispatched") {
              buttonVoid = document.createElement("span");
              buttonVoid.innerHTML = "Undispatch" + (onCd ? " (CD)" : "");
              buttonVoid.setAttribute("style", "margin-top: 0;");
              buttonVoid.onclick = (e) => {
                e.preventDefault();
                this.sendReport(id, deposit, idOrder, "booked_with_contract");
              };
              buttonVoid.setAttribute("id", "add_report_void");
            }

            let buttonCD = null;

            if (!onCd) {
              buttonCD = document.createElement("span");
              buttonCD.innerHTML = "Proceed with CD";
              buttonCD.setAttribute("style", "margin-top: 0;");
              buttonCD.onclick = (e) => {
                e.preventDefault();
                if (orderStatus) {
                  this.sendReport(id, deposit, idOrder, orderStatus, true);
                } else {
                  this.sendReport(
                    id,
                    deposit,
                    idOrder,
                    "booked_with_contract",
                    true
                  );
                }
              };
              buttonCD.setAttribute("id", "add_report_proceed_cd");

              let modalDivCd = document.createElement("li");
              modalDivCd.setAttribute("class", "actions inactive");
              modalDivCd.setAttribute(
                "style",
                "cursor: pointer;margin-left: 5px;"
              );
              modalDivCd.setAttribute("id", "daily_report");
              modalDivCd.appendChild(buttonCD);

              actionTabMenuMy
                .getElementsByTagName("ul")[0]
                .getElementsByTagName("li")[0]
                .after(modalDivCd);
            }

            if (orderStatus === null) {
              chrome.storage.local.set({ ["orderStatus" + id]: orderStatus });
            }
            if (button) {
              button.onclick = (e) => {
                e.preventDefault();
                if (statusValue === "booked_with_contract") {
                  const data = {
                    full_name: "",
                    phone: "",
                    email: "",
                    origin: "",
                    destination: "",
                    cars: [],
                  };
                  document
                    .querySelectorAll('td[valign="top"]')
                    .forEach((el) => {
                      const text = el.innerText.split("\n");
                      if (text[0] === "Shipper:") {
                        data["full_name"] = text[1].trim().toString();
                        data["phone"] = text[2].trim().toString();
                        data["email"] = text[3].trim().toString();
                      }
                      if (text[0].includes("Origin")) {
                        const origin = text[0].split(":");
                        data["origin"] = origin[1].trim().toString();
                      }
                      if (text[1] && text[1].includes("Destination:")) {
                        const dest = text[1].split(":");
                        data["destination"] = dest[1].trim().toString();
                      }
                      if (
                        text[0].includes("Origin") &&
                        text[1] &&
                        text[1].includes("Destination:")
                      ) {
                        for (let i = 0; i < text.length; i++) {
                          if (i === 5) {
                            data["cars"].push({
                              model: text[4].trim().toString(),
                              type: text[5].trim().toString(),
                            });
                          }
                          if (i === 8) {
                            data["cars"].push({
                              model: text[7].trim().toString(),
                              type: text[8].trim().toString(),
                            });
                          }
                          if (i === 11) {
                            data["cars"].push({
                              model: text[10].trim().toString(),
                              type: text[11].trim().toString(),
                            });
                          }
                          if (i === 14) {
                            data["cars"].push({
                              model: text[13].trim().toString(),
                              type: text[14].trim().toString(),
                            });
                          }
                          if (i === 17) {
                            data["cars"].push({
                              model: text[16].trim().toString(),
                              type: text[17].trim().toString(),
                            });
                          }
                        }
                      }
                    });
                  this.sendReport(
                    id,
                    deposit,
                    idOrder,
                    statusValue,
                    false,
                    data
                  );
                } else {
                  this.sendReport(id, deposit, idOrder, statusValue);
                }
              };
              button.setAttribute("id", "add_report");
            }

            let buttonCancellationFee = document.createElement("span");
            if (document.getElementById("button_cancellation") === null) {
              this.addButtonToCancellationFee();
              buttonCancellationFee.setAttribute("style", "margin-top: 0;");
              buttonCancellationFee.innerHTML = "Cancellation Fee";
              buttonCancellationFee.onclick = (e) => {
                e.preventDefault();
                this.openCancellationModal("block");
              };
              buttonCancellationFee.setAttribute("id", "button_cancellation");
            }

            let modalDiv = document.createElement("li");
            modalDiv.setAttribute("class", "actions inactive");
            modalDiv.setAttribute("style", "cursor: pointer;margin-left: 5px;");
            modalDiv.setAttribute("id", "daily_report");

            if (button) {
              modalDiv.appendChild(button);
            }
            this.sendReportCashOpenModal(id, idOrder, statusValue);

            if (buttonSecond) {
              let modalDivSecond = document.createElement("li");
              modalDivSecond.setAttribute("class", "actions inactive");
              modalDivSecond.setAttribute(
                "style",
                "cursor: pointer;margin-left: 5px;"
              );
              modalDivSecond.appendChild(buttonSecond);
              actionTabMenuMy
                .getElementsByTagName("ul")[0]
                .getElementsByTagName("li")[0]
                .after(modalDivSecond);
            }
            if (
              orderStatus &&
              document.getElementById("button_cancellation") === null
            ) {
              let modalDivThird = document.createElement("li");
              modalDivThird.setAttribute("class", "actions inactive");
              modalDivThird.setAttribute(
                "style",
                "cursor: pointer;margin-left: 5px;"
              );
              modalDivThird.appendChild(buttonCancellationFee);
              actionTabMenuMy
                .getElementsByTagName("ul")[0]
                .getElementsByTagName("li")[0]
                .after(modalDivThird);
            }

            if (buttonVoid) {
              let modalDivFour = document.createElement("li");
              modalDivFour.setAttribute("class", "actions inactive");
              modalDivFour.setAttribute(
                "style",
                "cursor: pointer;margin-left: 5px;"
              );
              modalDivFour.appendChild(buttonVoid);
              actionTabMenuMy
                .getElementsByTagName("ul")[0]
                .getElementsByTagName("li")[0]
                .after(modalDivFour);
            }

            if (buttonHash) {
              let modalDivFive = document.createElement("li");
              modalDivFive.setAttribute("class", "actions inactive");
              modalDivFive.setAttribute(
                "style",
                "cursor: pointer;margin-left: 5px;"
              );
              modalDivFive.appendChild(buttonHash);
              actionTabMenuMy
                .getElementsByTagName("ul")[0]
                .getElementsByTagName("li")[0]
                .after(modalDivFive);
            }

            if (button) {
              document.getElementsByClassName("pageheader")[0].after(modalDiv);
              actionTabMenuMy
                .getElementsByTagName("ul")[0]
                .getElementsByTagName("li")[0]
                .after(modalDiv);
            }
          }
        );
      }
    });
  }

  /**
   * Modal for show payment form link
   * @param hashValue
   */
  openModalWithHash(hashValue) {
    if (
      document.getElementById("hash_open_modal_crystal") === null &&
      document.getElementById("email_options")
    ) {
      let bodyBlackout = document.createElement("div");
      bodyBlackout.setAttribute("class", "body-blackout");

      let modal = document.createElement("div");
      modal.setAttribute("class", "modal");
      modal.id = "myModalHash";
      let modalDiv = document.createElement("div");
      modalDiv.setAttribute("class", "modal-content");

      let modalSpan = document.createElement("span");
      modalSpan.setAttribute("class", "close");
      modalSpan.id = "close__modal";
      modalSpan.innerHTML = "&times;";

      let modalP = document.createElement("button");
      modalP.id = "copy_and_close";
      modalP.innerHTML = "Copy and close";
      modalP.setAttribute("class", "btn btn-default");

      let modalTextArea = document.createElement("textarea");
      modalTextArea.row = 10;
      modalTextArea.cols = 100;
      modalTextArea.id = "hash__textarea__message";
      modalTextArea.value = hashValue;

      modalDiv.appendChild(modalSpan);
      modalDiv.appendChild(modalTextArea);
      modalDiv.appendChild(modalP);
      modal.appendChild(modalDiv);

      document.getElementById("pageHeader").after(modal);
      document.getElementById("pageHeader").after(bodyBlackout);

      modalSpan.onclick = () => this.clickOpenModalHash("none");

      modalP.onclick = () => {
        document.getElementById("hash__textarea__message").select();
        document.execCommand("copy");

        this.clickOpenModalHash("none");
      };
    }
  }

  clickOpenModalHash(style = "block") {
    const modal = document.getElementById("myModalHash");

    modal.style.display = style;
  }

  /**
   * open model
   */
  openCancellationModal(status) {
    if (document.getElementById("cancellation_fee")) {
      document.getElementById("cancellation_fee").value = "";
    }
    document
      .getElementById("cancellation_fee_modal")
      .setAttribute("style", "display: " + status + ";");
  }

  /**
   * Open modal with message
   *
   * @param item
   */
  clickOpenModal(item) {
    console.log("🚀 ~ clickOpenModal:");
    const modal = document.getElementById("myModal");

    modal.style.display = "block";
  }

  /**
   * Change selected message and change tags
   *
   * @param list
   * @param item
   */
  changeSelect(list, item) {
    console.log("🚀 ~ changeSelect:");
    let itemValue = undefined;

    if (item && item.target && item.target.value) {
      itemValue = list.find((el) => +el.key === +item.target.value);
    } else {
      itemValue = item;
    }
    this.message = itemValue;
    const idOrder =
      document.getElementsByClassName("app-field-ID")[0].textContent;
    let pageData = null;
    /*global chrome*/
    chrome.storage.local.get([idOrder + "_pageData"], (result) => {
      pageData = JSON.parse(result[idOrder + "_pageData"]);

      if (pageData && Object.keys(pageData).length) {
        const makeAndModel = (
          pageData.cars[0].vehicleModelYear +
          " " +
          pageData.cars[0].vehicleMake +
          " " +
          pageData.cars[0].vehicleModel
        )
          .toString()
          .trim()
          .replaceAll("  ", " ");

        chrome.storage.local.get(["user"], (result) => {
          if (result && result.user) {
            let current_user = JSON.parse(result.user);
            if (itemValue && itemValue.description) {
              this.messageReplace = itemValue.description
                .replaceAll("{firstName}", this.currentUser.first_name) // my first name
                .replaceAll("{lastName}", this.currentUser.last_name) // my last name
                .replaceAll("{shipperName}", pageData.customerFullName)
                .replaceAll("{state}", pageData.originState)
                .replaceAll("{destinationState}", pageData.destinationState)
                .replaceAll(
                  "{tariff}",
                  "$ " + (+pageData.totalTariff).toFixed(2)
                )
                .replaceAll("{makeAndModel}", makeAndModel)
                .replaceAll("{linkToeDoc}", pageData.linkToeDoc)
                .replaceAll("{directPhone}", current_user.phone);

              console.log(
                "🚀 ~ changeSelect ~ this.messageReplace:",
                this.messageReplace
              );
              document.getElementById("textarea__message").value =
                this.messageReplace;
            }
          }
        });
      }
    });
  }

  /**
   * Change selected message and change tags
   *
   * @param list
   * @param item
   */
  changeSelectJT(list, item) {
    console.log("🚀 ~ changeSelectJT:");
    let itemValue = undefined;
    let firstName = "";
    let lastName = "";
    let shipperName = "";
    let state = "";
    let destinationState = "";
    let makeAndModel = "";
    let tariff = "";

    /* Full Name */
    const fullNameObj = document.getElementsByClassName("nobg");
    if (fullNameObj && fullNameObj[0]) {
      const fullName = fullNameObj[0].innerHTML
        .replace("Welcome,", "")
        .trim()
        .split(" ");
      firstName = fullName[0];
      lastName = fullName[1];
    }

    /* Make and Model */
    const makeY = document.getElementById("vehicle1_year");
    if (makeY) {
      makeAndModel += makeY.innerText.trim();
    }
    const makeM = document.getElementById("vehicle1_make");
    if (makeM) {
      makeAndModel += " " + makeM.innerText.trim();
    }
    const makeModel = document.getElementById("vehicle1_model");
    if (makeModel) {
      makeAndModel += " " + makeModel.innerText.trim();
    }
    const shipObj = document.getElementById("col1");

    /* State */
    const shipperNameOrigin = document.getElementById("quote_customer_name");
    if (shipperNameOrigin) {
      shipperName = shipperNameOrigin.innerText.trim().split(" ")[0];
    }

    /* State */
    const stateOrigin = document.getElementById("quote_origin");
    if (stateOrigin) {
      state = stateOrigin.innerText.trim().split(",")[1].split(" ")[1].trim();
    }

    /* Destination State */
    const stateDestination = document.getElementById("quote_destination");
    if (stateDestination) {
      destinationState = stateDestination.innerText
        .trim()
        .split(",")[1]
        .split(" ")[1]
        .trim();
    }

    /* Tariff */
    const tariffObj = document.getElementsByClassName("detailBoxThin");
    if (tariffObj) {
      try {
        tariff = tariffObj[0]
          .getElementsByTagName("div")[0]
          .innerHTML.split("<br />")[0]
          .split("</strong>")[1]
          .split("<br>")[0]
          .trim();
      } catch (error) {
        tariff = 0;
      }
    }

    this.pageData = {
      firstName,
      lastName,
      shipperName,
      state,
      destinationState,
      tariff,
      makeAndModel,
    };

    if (item && item.target && item.target.value) {
      itemValue = list.find((el) => +el.key === +item.target.value);
    } else {
      itemValue = item;
    }

    this.message = itemValue;

    chrome.storage.local.get(["user"], (result) => {
      if (result && result.user) {
        let current_user = JSON.parse(result.user);
        if (itemValue && itemValue.description) {
          this.messageReplace = itemValue.description
            .replaceAll("{firstName}", this.pageData.firstName)
            .replaceAll("{lastName}", this.pageData.lastName)
            .replaceAll("{shipperName}", this.pageData.shipperName)
            .replaceAll("{state}", this.pageData.state)
            .replaceAll("{destinationState}", this.pageData.destinationState)
            .replaceAll("{tariff}", this.pageData.tariff)
            .replaceAll("{makeAndModel}", this.pageData.makeAndModel)
            .replaceAll("{directPhone}", current_user.phone);

          console.log(
            "🚀 ~ changeSelectJT ~ this.messageReplace:",
            this.messageReplace
          );
          document.getElementById("textarea__message").value =
            this.messageReplace;
        }
      }
    });

    if (itemValue && itemValue.description) {
      this.messageReplace = itemValue.description
        .replaceAll("{firstName}", this.pageData.firstName)
        .replaceAll("{lastName}", this.pageData.lastName)
        .replaceAll("{shipperName}", this.pageData.shipperName)
        .replaceAll("{state}", this.pageData.state)
        .replaceAll("{destinationState}", this.pageData.destinationState)
        .replaceAll("{tariff}", this.pageData.tariff)
        .replaceAll("{makeAndModel}", this.pageData.makeAndModel);

      console.log(
        "🚀 ~ changeSelectJT ~ this.messageReplace:",
        this.messageReplace
      );
      document.getElementById("textarea__message").value = this.messageReplace;
    }
  }

  closeModal() {
    document.getElementById("myModal").style.display = "none";
    document.getElementById("textarea__message").value = "";
  }

  copyAndClose() {
    document.getElementById("textarea__message").select();
    document.execCommand("copy");

    this.closeModal();
  }

  /**
   * Add button in current page
   */
  addButtonToPage(list) {
    if (
      document.getElementById("open_modal_crystal") === null &&
      document.getElementById("email_options")
    ) {
      let bodyBlackout = document.createElement("div");
      bodyBlackout.setAttribute("class", "body-blackout");

      let modal = document.createElement("div");
      modal.setAttribute("class", "modal");
      modal.id = "myModal";
      let modalDiv = document.createElement("div");
      modalDiv.setAttribute("class", "modal-content");

      let modalSpan = document.createElement("span");
      modalSpan.setAttribute("class", "close");
      modalSpan.id = "close__modal";
      modalSpan.innerHTML = "&times;";

      let modalP = document.createElement("button");
      modalP.id = "copy_and_close";
      modalP.innerHTML = "Copy and close";
      modalP.setAttribute("class", "btn btn-default");

      let modalTextArea = document.createElement("textarea");
      modalTextArea.row = 10;
      modalTextArea.cols = 100;
      modalTextArea.id = "textarea__message";

      modalDiv.appendChild(modalSpan);
      modalDiv.appendChild(modalTextArea);
      modalDiv.appendChild(modalP);
      modal.appendChild(modalDiv);

      document.getElementById("pageHeader").after(modal);
      document.getElementById("pageHeader").after(bodyBlackout);

      let img = document.createElement("img");
      img.src = "/images/icn_email_sm.gif";
      img.style = "vertical-align: middle;";

      let label = document.createElement("label");
      label.innerHTML = "Sms";

      let clone = document.getElementById("email_options").cloneNode(true);
      clone.id = "email_options_crystal";
      clone.name = "email_options_crystal";

      clone.getElementsByTagName("option").innerHTML = "";
      let length = clone.options ? clone.options.length : 0;
      for (let i = length - 1; i >= 0; i--) {
        clone.options[i] = null;
      }

      for (let i = 0; i < list.length; i++) {
        let option = document.createElement("option");
        option.value = list[i].key;
        option.textContent = list[i].value;
        clone.appendChild(option);
      }

      let button = document.createElement("button");
      button.innerHTML = "Open modal";
      button.setAttribute("class", "btn btn-default");
      button.setAttribute("data-popup-trigger", "one");
      button.id = "open_modal_crystal";

      document.getElementById("email_options").after(button);
      document.getElementById("email_options").after(clone);
      document.getElementById("email_options").after(label);
      document.getElementById("email_options").after(img);

      this.changeSelectJT(list, list[0]);
      clone.onchange = (item) => this.changeSelectJT(list, item);

      modalSpan.onclick = () => this.closeModal();

      modalP.onclick = () => this.copyAndClose();

      button.onclick = () => this.clickOpenModal();
    }
  }
}

new Content().start();
