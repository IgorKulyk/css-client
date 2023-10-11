import axios from "axios";

// const api_url = "http://127.0.0.1:5000";
const api_url = "https://www.carshipsimple.us";
// grab the form
const form = document.querySelector(".login-form");
// grab the country name
const username = document.querySelector("#username");
const password = document.querySelector("#password");

const pdf_test = [];

[
  {
    key: 1,
    value: "New Customer Arrangement Sonic",
  },
  {
    key: 5,
    value: "Order Receipt Sonic",
  },
  {
    key: 7,
    value: "Order form Sonic w/o Card",
  },
  {
    key: 12,
    value: "Sonic First Page The Final Rate Confirmation",
  },
];

const login = async (user_data) => {
  try {
    const response = await axios.post(`${api_url}/login`, user_data);
    if (response.data && response.data.status === "ok") {
      // Transform response to fit content-script required strusture
      // TODO: Change structure in content-script to use API response without transformation
      let user = {
        username: response.data.user.username,
        first_name: response.data.user.first_name,
        last_name: response.data.user.last_name,
        phone: response.data.user.phone,
        public_email: response.data.user.contact_email,
      };
      chrome.storage.local.set({ user: JSON.stringify(user) });
      chrome.storage.local.set({ token: response.data.token });
      get_sms_templates(response.data.token);

      show_user_data(user);
    }
  } catch (error) {
    console.log("🚀 ~ error:", error);
  }
};

const get_sms_templates = async (token) => {
  try {
    const config = {
      headers: { Authorization: `Bearer ${token}` },
    };

    const response = await axios.get(`${api_url}/sms_templates`, config);
    if (response.data && response.data.length > 0) {
      // Transform response to fit content-script required strusture
      // TODO: Change structure in content-script to use API response without transformation
      let sms_templates = response.data.map((sms) => {
        return {
          key: sms.idsms_templates,
          value: sms.template_name,
          description: sms.template_data,
        };
      });
      chrome.storage.local.set({ messages: JSON.stringify(sms_templates) });
      get_pdf_templates(token);
    }
  } catch (error) {
    console.log("🚀 ~ error:", error);
  }
};

const get_pdf_templates = async (token) => {
  try {
    const config = {
      headers: { Authorization: `Bearer ${token}` },
    };

    const response = await axios.get(`${api_url}/pdf_templates`, config);
    if (response.data && response.data.length > 0) {
      // Transform response to fit content-script required strusture
      // TODO: Change structure in content-script to use API response without transformation
      let pdf_templates = response.data.map((pdf) => {
        return {
          key: pdf.idpdf_templates,
          value: pdf.template_name,
          data: pdf.template_data,
        };
      });
      chrome.storage.local.set({ pdf: JSON.stringify(pdf_templates) });
    }
  } catch (error) {
    console.log("🚀 ~ error:", error);
  }
};

const show_user_data = async (user) => {
  let login_form = document.querySelector(".login-form");
  login_form.remove();

  let user_data_container = document.createElement("div");
  user_data_container.id = "user_data_container";
  user_data_container.innerHTML = `          
          <div class="user-data-container">
            <div class="labels-container">
              <h2 class="label">Username:</h2>
              <h2 class="label">First name:</h2>
              <h2 class="label">Last name:</h2>
              <h2 class="label">Phone:</h2>
              <h2 class="label">Email:</h2>
            </div>

            <div class="values-container">
              <h2 class="value">${user.username}</h2>
              <h2 class="value">${user.first_name}</h2>
              <h2 class="value">${user.last_name}</h2>
              <h2 class="value">${user.phone}</h2>
              <h2 class="value">${user.public_email}</h2>
            </div>
          </div>
          `;

  let logout_button = document.createElement("button");
  logout_button.innerHTML = "logout";
  logout_button.id = "logout_button";
  logout_button.onclick = () => logout(login_form);

  let logo_container = document.querySelector(".logo-container");
  logo_container.after(logout_button);
  logo_container.after(user_data_container);
};

const logout = async (login_form) => {
  let logout_button = document.getElementById("logout_button");
  logout_button.remove();
  let user_data_container = document.getElementById("user_data_container");
  user_data_container.remove();

  let logo_container = document.querySelector(".logo-container");
  logo_container.after(login_form);

  clear_storage();
};

const check_login = async () => {
  chrome.storage.local.get(["user"], (result) => {
    if (result && result.user) {
      chrome.storage.local.get(["token"], (token_result) => {
        const decoded_token = parse_jwt(token_result.token);
        let exp_date = new Date(0);
        exp_date.setUTCSeconds(decoded_token.exp);
        let now = new Date();

        if (exp_date > now) {
          let current_user = JSON.parse(result.user);
          show_user_data(current_user);
        } else {
          clear_storage();
        }
      });
    }
  });
};

function parse_jwt(token) {
  var base64Url = token.split(".")[1];
  var base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  var jsonPayload = decodeURIComponent(
    window
      .atob(base64)
      .split("")
      .map(function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join("")
  );

  return JSON.parse(jsonPayload);
}

function clear_storage() {
  chrome.storage.local.remove("user");
  chrome.storage.local.remove("token");
  chrome.storage.local.remove("messages");
  chrome.storage.local.remove("pdf");
}

// declare a function to handle form submission
const handleSubmit = async (e) => {
  e.preventDefault();
  let user_data = {
    username: username.value,
    password: password.value,
  };
  login(user_data);
};

document.addEventListener("DOMContentLoaded", (event) => {
  console.log("DOM fully loaded and parsed");
  check_login();
});

form.addEventListener("submit", (e) => handleSubmit(e));
