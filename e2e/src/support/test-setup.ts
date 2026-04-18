import axios from "axios";

const baseURL = process.env.BILLING_SERVICE_URL || "http://localhost:3003";
axios.defaults.baseURL = baseURL;
