// @ts-nocheck
// Kwh per byte Constants
const DATACENTER_AVERAGE_KW_PER_BYTE: number = 0.000000000002;
const NETWORK_AVERAGE_KW_PER_BYTE: number = 0.0000000000315;

// Devices Constants
const DEVICE_MOBILE_KWH_BY_MINUTE: number = 0.00011;
const DEVICE_TABLET_KWH_BY_MINUTE: number = 0.000215;
const DEVICE_DESKTOP_KWH_BY_MINUTE: number = 0.00032;

// Energy Country Constants
const CO2_PER_KWH_IN_GRAMS_WORLD: number = 463;
const CO2_PER_KWH_IN_GRAMS_EUROPE: number = 276;
const CO2_PER_KWH_IN_GRAMS_USA: number = 493;
const CO2_PER_KWH_IN_GRAMS_CHINA: number = 681;
const CO2_PER_KWH_IN_GRAMS_FRANCE: number = 33;

// Equivalence Constant
const CO2_TO_LIGHT_DURATION: number = 0.001;
const CO2_TO_GAZOILE_CAR_METER: number = 0.132;

// Get Timezone
const timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone;
let region: string;

// Choice of energy depending on the Timezone
let timezoneCo2PerKw: number = CO2_PER_KWH_IN_GRAMS_WORLD;

if (timezone == "Europe/Paris") {
  timezoneCo2PerKw = CO2_PER_KWH_IN_GRAMS_FRANCE;
  region = "France";
} else if (timezone.includes("Europe")) {
  timezoneCo2PerKw = CO2_PER_KWH_IN_GRAMS_EUROPE;
  region = "Europe";
} else if (timezone.includes("America")) {
  timezoneCo2PerKw = CO2_PER_KWH_IN_GRAMS_USA;
  region = "America";
} else if (timezone.includes("Asia")) {
  region = "Asia";
  timezoneCo2PerKw = CO2_PER_KWH_IN_GRAMS_CHINA;
}

// Get Device Type
const getDeviceType = () => {
  if (
    /(tablet|iPad|playbook|silk)|(android(?!.*mobi))/i.test(navigator.userAgent)
  ) {
    return "Tablet";
  } else if (
    /Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(
      navigator.userAgent
    )
  ) {
    return "Mobile";
  }
  return "Desktop";
};

// Format Bytes
function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "Kb", "Mb", "Gb", "Tb", "Pb", "Eb", "Zb", "Yb"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

function formatTime(duration: number) {
  const hrs = ~~(duration / 3600);
  const mins = ~~((duration % 3600) / 60);
  const secs = ~~duration % 60;
  const currentLanguage = navigator.language === "fr-FR" ? "fr" : "en";
  const timeI18n = {
    fr: {
      second: " seconde ",
      seconds: " secondes ",
      minute: " minute ",
      minutes: " minutes ",
      hour: " heure ",
      hours: " heures ",
    },
    en: {
      second: " second ",
      seconds: " seconds ",
      minute: " minute ",
      minutes: " minutes ",
      hour: " hour ",
      hours: " hours ",
    },
  };

  let formatedTime = "";
  if (hrs === 1) {
    formatedTime +=
      hrs + timeI18n[currentLanguage].hour + (mins < 10 ? "0" : "");
  }
  if (hrs > 1) {
    formatedTime +=
      hrs + timeI18n[currentLanguage].hours + (mins < 10 ? "0" : "");
  }
  if (mins === 1) {
    formatedTime +=
      mins + timeI18n[currentLanguage].minute + (secs < 10 ? "0" : "");
  }
  if (mins > 1) {
    formatedTime +=
      mins + timeI18n[currentLanguage].minutes + (secs < 10 ? "0" : "");
  }
  if (secs === 1) {
    formatedTime += secs + timeI18n[currentLanguage].second;
  }
  if (secs > 1) {
    formatedTime += secs + timeI18n[currentLanguage].seconds;
  }
  return formatedTime;
}

// Prepare HTML box & css
const carbonavBox = document.createElement("template");
carbonavBox.innerHTML = `
<style>

  .carbonav-container{
      position: fixed;
      right: 20px;
      bottom: 20px;
      z-index: 2;
      background: #FFFFFF 0% 0% no-repeat padding-box;
      box-shadow: 0px 5px 20px #00000029;
      border-radius: 20px;
      opacity: 1;
      margin: 0 10px;
      width: 375px;
      font-family: 'Poppins', sans-serif;
      display:flex;
      flex-direction: column;
      color: #7E84A3;
      overflow: hidden;
      line-height: 12px;
  }
  .carbonav-container > *{
  }

  .carbonav-container .leaf {
    position: relative;
    top: 2px;
    width: 10px;
    height: 10px;
    margin-right: 1px;
  }

  .carbonav-container .color-blue{
    color: #2C86FE;
  }
  
  .carbonav-container a.color-blue{
    text-decoration: none;
  }
  
  .carbonav-container span#carbon-score{
    font-weight: bold;
  }
  
  .carbonav-container .arrow-blue{
    width: 15px;
    height:15px;
    position: absolute;
    top: 11px;
    right: 11px;
  }
  
  .carbonav-container:hover .arrow-blue{
    visibility: hidden;
    height: 0px;;
  }

  .carbonav-header{
    border-bottom: 1px solid #eeeeee;
    text-align: center;
    color: #000;
    font-weight: bold;
  }
  
  .carbonav-header, .carbonav-subheader{
    color: #181B1F;
  }
  
  .carbonav-content{
    text-align: center;
    font-size: 10px;
  }

  .carbonav-header, .logo {
    transition: all .5s;
    opacity: 0;
    border-color: transparent;
  }
  .carbonav-container:hover .carbonav-header {
    border-color: #eeeeee;
  }
  .carbonav-container:hover .carbonav-header,
  .carbonav-container:hover .logo {
    opacity:1;
  }

  .carbonav-details {
    transition: all .35s;
    max-height: 0;
    overflow: hidden;
    opacity:0;
  }
  
  .carbonav-container:hover .carbonav-details {
    max-height: 350px;
    opacity:1;
    font-size: 10px;
    padding-left: 30px;
    padding-right: 20px;
    padding-bottom: 20px;
  }
  
  .carbonav-container:hover .impact{
    vertical-align: top;
    background: #F7FAFD;
    width: 133px;
    min-height: 80px;
    display: inline-block;
    text-align: center;
    font-size: 9px;
    padding: 20px 10px 10px 10px;
    line-height: 12px;
  }
  
  .carbonav-container:hover .impact .score-container{
    padding-top:8px;
  }
  
  .carbonav-container:hover .impact:first-child{
    margin-right: 5px;
  }
  
  .carbonav-container:hover .impact:last-child{
    margin-left:5px;
  }
  
  .carbonav-container .carbonav-details .row{
    line-height: 15px;
  }
  
  .carbonav-container:hover .row:last-child{
    margin-top:10px;
  }
  
  .carbonav-container .carbonav-details .category{
    line-height: 12px;
    font-size: 9px;
    margin-top:3px;
  }
  
  .carbonav-container .carbonav-details .details-value{
    color: #2C86FE;
    font-weight: 600;
    letter-spacing: 0.5px;
    font-size:10px;
  }
  
  .carbonav-container:hover .carbonav-subheader{
     font-size: 12px;
     color: #181B1F;
     font-weight: bold;
     margin-top: 20px;
     margin-bottom:10px;
  }

  .carbonav-content, .powered-by{
    text-align: center;
  }
  
  .carbonav-container .powered-by{
    font-size: 8px;
    line-height: 10px;
  }
  
  .carbonav-container:hover .powered-by{
    line-height: 37px;
    vertical-align: middle;
  }
  
  .carbonav-container:hover .powered-by a:hover{
    cursor: pointer;
  }
  
  .carbonav-container:hover .carbonav-footer{
    display: flex;
    align-content: center;
    justify-content: space-between;
    margin-bottom: 10px;
    padding-left: 30px;
  }
  
  .carbonav-container:hover {
    display: flex;
    align-content: center;
    font-size: 12px;
  }
  
  .carbonav-container:hover .carbonav-header{
    text-align: center;
    padding-top: 15px;
    padding-bottom: 15px;
  }
  
  .carbonav-container:hover .carbonav-content{
    background: #F7FAFD 0% 0% no-repeat padding-box;
    padding-top: 10px;
    padding-bottom: 10px;
  }
  
  .carbonav-container .gma-logo{
    visibility: hidden;
    height: 0px;
  }
  
  .carbonav-container:hover .gma-logo{
    margin-right:20px;
    height: 42px;
    visibility: visible;
  }
  
  .carbonav-container:hover .gma-logo:hover{
    cursor: pointer;
  }
  
  @media (max-width: 435px) and (min-width: 360px) {
    .carbonav-container{
      border-radius: inherit;
      width: 100%;
      position: fixed;
      right:0;
      bottom: 0;
      margin: 0;
    }
  }
  
  @media (max-width: 360px) {
    .carbonav-container:hover .impact{
      margin-left: 0px;
      margin-right: 0px;
    }
    .carbonav-container:hover .impact:last-child{
      margin-top: 10px;
    }
  }
    
</style>

<div class='carbonav-container'>
  <div class='carbonav-header'>
    <span id='header-title'></span>
  </div>
  <div class='carbonav-content'>
    <span id='introduction-phrase'></span>
    <span class='color-blue' id='carbon-score'></span>
    <img class='arrow-blue' src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNCIgaGVpZ2h0PSIxNCIgdmlld0JveD0iMCAwIDE0IDE0Ij4KICA8ZyBpZD0iR3JvdXBlXzIyMTUyIiBkYXRhLW5hbWU9Ikdyb3VwZSAyMjE1MiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTk4OS4wODEgLTk3MDEpIj4KICAgIDxjaXJjbGUgaWQ9IkVsbGlwc2VfMTM0NCIgZGF0YS1uYW1lPSJFbGxpcHNlIDEzNDQiIGN4PSI3IiBjeT0iNyIgcj0iNyIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoOTg5LjA4MSA5NzAxKSIgZmlsbD0iIzJjODZmZSIvPgogICAgPGcgaWQ9Ikdyb3VwZV8yMjEzNyIgZGF0YS1uYW1lPSJHcm91cGUgMjIxMzciIHRyYW5zZm9ybT0idHJhbnNsYXRlKDk5Mi44MzIgOTcwNi4xOTUpIj4KICAgICAgPHBhdGggaWQ9IlRyYWPDqV8yMjIwMSIgZGF0YS1uYW1lPSJUcmFjw6kgMjIyMDEiIGQ9Ik0xMjguNiw4NTMwLjcyMmwzLjI0OS0zLjI0OSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTEyOC42MDIgLTg1MjcuNDczKSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS13aWR0aD0iMS41Ii8+CiAgICAgIDxwYXRoIGlkPSJUcmFjw6lfMjIyMDIiIGRhdGEtbmFtZT0iVHJhY8OpIDIyMjAyIiBkPSJNMTMxLjg1LDg1MzAuNzIybC0zLjI0OS0zLjI0OSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTEyNS4zNTMgLTg1MjcuNDczKSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS13aWR0aD0iMS41Ii8+CiAgICA8L2c+CiAgPC9nPgo8L3N2Zz4K'/>
  </div>
  <div class='carbonav-details'>
      <div class='carbonav-subheader'>À propos de votre visite</div>
      <div class='row'><span id='device-label'></span> : <span class='details-value'><span id='device'></span></span></div>
      <div class='row'><span id='region-label'></span> : <span class='details-value'><span id='region'></span></span></div>
      <div class='row'><span id='dom-count-label'></span> : <span class='details-value'><span id='dom-count'></span></span></div>
      <div class='row'><span id='network-label'></span> : <span class='details-value'><span id='network'></span></span></div>
      <div class='row'><span id='duration-label'></span> : <span class='details-value'><span id='duration'></span> <span id='duration-units'></span></span></div>
      <div class='carbonav-subheader'>Impact de votre visite</div>
      <div class='row'>
        <div class='impact'>
          <img src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNy41MjEiIGhlaWdodD0iMTUuNjQ1IiB2aWV3Qm94PSIwIDAgMTcuNTIxIDE1LjY0NSI+CiAgPGcgaWQ9Ikdyb3VwZV8yMjEwMSIgZGF0YS1uYW1lPSJHcm91cGUgMjIxMDEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAuNCAwLjQpIj4KICAgIDxwYXRoIGlkPSJUcmFjw6lfMjIxODEiIGRhdGEtbmFtZT0iVHJhY8OpIDIyMTgxIiBkPSJNMTYuMDYzLDFIMi42NThBMS42NTgsMS42NTgsMCwwLDAsMSwyLjY1OFY0Ljg2OUgxNy43MjFWMi42NThBMS42NTgsMS42NTgsMCwwLDAsMTYuMDYzLDFaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMSAtMSkiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzBhZjFkMCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2Utd2lkdGg9IjAuOCIvPgogICAgPHBhdGggaWQ9IlRyYWPDqV8yMjE4MiIgZGF0YS1uYW1lPSJUcmFjw6kgMjIxODIiIGQ9Ik0xNS41MTEsMTguNjg3SDMuMjExQTIuMjEsMi4yMSwwLDAsMSwxLDE2LjQ3NlY3Ljc0OEgxNy43MjJ2OC43MjhBMi4yMSwyLjIxLDAsMCwxLDE1LjUxMSwxOC42ODdaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMSAtMy44NDMpIiBmaWxsPSJub25lIiBzdHJva2U9IiMwYWYxZDAiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLXdpZHRoPSIwLjgiLz4KICAgIDxwYXRoIGlkPSJUcmFjw6lfMjIxODMiIGRhdGEtbmFtZT0iVHJhY8OpIDIyMTgzIiBkPSJNMjAuNzYsMy45MzlhLjU1NC41NTQsMCwxLDEtLjU1NC0uNTU0LjU1NC41NTQsMCwwLDEsLjU1NC41NTQiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC04Ljg1OCAtMi4wMDUpIiBmaWxsPSIjMmM4NmZlIi8+CiAgICA8cGF0aCBpZD0iVHJhY8OpXzIyMTg0IiBkYXRhLW5hbWU9IlRyYWPDqSAyMjE4NCIgZD0iTTIzLjYzNSwzLjkzOWEuNTU0LjU1NCwwLDEsMS0uNTU0LS41NTQuNTU0LjU1NCwwLDAsMSwuNTU0LjU1NCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTEwLjA2OSAtMi4wMDUpIiBmaWxsPSIjMmM4NmZlIi8+CiAgICA8cGF0aCBpZD0iVHJhY8OpXzIyMTg1IiBkYXRhLW5hbWU9IlRyYWPDqSAyMjE4NSIgZD0iTTI2LjUxLDMuOTM5YS41NTQuNTU0LDAsMSwxLS41NTQtLjU1NC41NTQuNTU0LDAsMCwxLC41NTQuNTU0IiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMTEuMjgxIC0yLjAwNSkiIGZpbGw9IiMyYzg2ZmUiLz4KICAgIDxwYXRoIGlkPSJUcmFjw6lfMjIxODYiIGRhdGEtbmFtZT0iVHJhY8OpIDIyMTg2IiBkPSJNMTYuMjYsMTUuMDI0YTIuOTg4LDIuOTg4LDAsMSwxLTIuOTg4LTIuOTg4QTIuOTg4LDIuOTg4LDAsMCwxLDE2LjI2LDE1LjAyNFoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC00LjkxMiAtNS42NSkiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzBhZjFkMCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2Utd2lkdGg9IjAuOCIvPgogICAgPGxpbmUgaWQ9IkxpZ25lXzEiIGRhdGEtbmFtZT0iTGlnbmUgMSIgeDI9IjUuOTc1IiB0cmFuc2Zvcm09InRyYW5zbGF0ZSg1LjM3MyA5LjM3NCkiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzBhZjFkMCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2Utd2lkdGg9IjAuOCIvPgogICAgPHBhdGggaWQ9IlRyYWPDqV8yMjE4NyIgZGF0YS1uYW1lPSJUcmFjw6kgMjIxODciIGQ9Ik0xNS43ODIsMTUuMDI0YTUsNSwwLDAsMS0xLjIzLDIuOTg4LDUsNSwwLDAsMS0xLjIyOS0yLjk4OCw1LDUsMCwwLDEsMS4yMjktMi45ODhBNSw1LDAsMCwxLDE1Ljc4MiwxNS4wMjRaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtNi4xOTIgLTUuNjUpIiBmaWxsPSJub25lIiBzdHJva2U9IiMwYWYxZDAiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLXdpZHRoPSIwLjgiLz4KICA8L2c+Cjwvc3ZnPgo='/>
          <br />
          <span class='impact-header'>
            <span id='impact-device-label'></span><br />
            <b><span id='impact-device-type-label'></span></b>
          </span>
          <br />
          <div class='score-container'>
            <span class='details-value'><span id='impact-device'></span></span> CO&#x2082;e
          </div>
        </div>
        <div class='impact'>
          <img src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMi4wMjMiIGhlaWdodD0iMTUuNjQ0IiB2aWV3Qm94PSIwIDAgMjIuMDIzIDE1LjY0NCI+CiAgPGcgaWQ9Ikdyb3VwZV8yMjEwMiIgZGF0YS1uYW1lPSJHcm91cGUgMjIxMDIiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAuNCAwLjM5OSkiPgogICAgPHBhdGggaWQ9IlRyYWPDqV8yMjE4OCIgZGF0YS1uYW1lPSJUcmFjw6kgMjIxODgiIGQ9Ik02Ni4wMiw2LjI3MVYzLjQ1OGEyLjIyNSwyLjIyNSwwLDAsMC0yLjIyNS0yLjIyNUg1MEEyLjIyNSwyLjIyNSwwLDAsMCw0Ny43NywzLjQ1OHY3LjM1QTIuMjI1LDIuMjI1LDAsMCwwLDUwLDEzLjAzMmgxMy4xOCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTQ3Ljc3IC0xLjIzMykiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzBhZjFkMCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2Utd2lkdGg9IjAuOCIvPgogICAgPGxpbmUgaWQ9IkxpZ25lXzIiIGRhdGEtbmFtZT0iTGlnbmUgMiIgeTI9IjMuMDQ0IiB0cmFuc2Zvcm09InRyYW5zbGF0ZSg5LjEyNSAxMS44KSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMGFmMWQwIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS13aWR0aD0iMC44Ii8+CiAgICA8bGluZSBpZD0iTGlnbmVfMyIgZGF0YS1uYW1lPSJMaWduZSAzIiB4MT0iMy4wNDQiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDcuNjAzIDE0Ljg0MykiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzBhZjFkMCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2Utd2lkdGg9IjAuOCIvPgogICAgPHBhdGggaWQ9IlRyYWPDqV8yMjE4OSIgZGF0YS1uYW1lPSJUcmFjw6kgMjIxODkiIGQ9Ik02My41OTMsMTcuOWEuNTU4LjU1OCwwLDEsMS0uNTU4LS41NTguNTU4LjU1OCwwLDAsMSwuNTU4LjU1OCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTUzLjkxMSAtNy45NTkpIiBmaWxsPSIjMmM4NmZlIi8+CiAgICA8cmVjdCBpZD0iUmVjdGFuZ2xlXzI0NTQyIiBkYXRhLW5hbWU9IlJlY3RhbmdsZSAyNDU0MiIgd2lkdGg9IjUuNjg5IiBoZWlnaHQ9IjkuODA1IiByeD0iMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTUuNTMzIDUuMDM5KSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMGFmMWQwIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS13aWR0aD0iMC44Ii8+CiAgICA8cGF0aCBpZD0iVHJhY8OpXzIyMTkwIiBkYXRhLW5hbWU9IlRyYWPDqSAyMjE5MCIgZD0iTTc5LjQ3OCwyMy4yNDZhLjU1OC41NTgsMCwxLDEtLjU1OC0uNTU4LjU1OC41NTgsMCwwLDEsLjU1OC41NTgiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC02MC41NDMgLTEwLjE5KSIgZmlsbD0iIzJjODZmZSIvPgogIDwvZz4KPC9zdmc+Cg=='/>
          <br />
          <span class='impact-header'>
            <span id='impact-site-label'></span><br />
            <b><span id='impact-site-type-label'></span></b>
          </span>
          <br />
          <div class='score-container'>
            <span class='details-value'><span id='impact-site'></span></span> CO&#x2082;e
          </div>
        </div>
      </div>
      <div class='row'>Equivalence : <span class='details-value'><span id='equivalence-duration'></span></span></div>
  </div>
  <div class='carbonav-footer'>
      <div class='powered-by'>
        <img class='leaf' src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNjYuMDg3IiBoZWlnaHQ9IjMxOS42NzUiIHZpZXdCb3g9IjAgMCAyNjYuMDg3IDMxOS42NzUiPgogIDxwYXRoIGlkPSJUcmFjw6lfMjA4NDEiIGRhdGEtbmFtZT0iVHJhY8OpIDIwODQxIiBkPSJNMzUwMS42MzksMTc3LjgyNnMtMTM5Ljk0Ny01LjYtMjE4LjMxOCw4My45NzItMjQuNjMzLDE3MC4xNzQtMjQuNjMzLDE3MC4xNzQtMTMuMzU3LDMxLjM4Mi0xNC4zOTEsNjUuNDZjMCwwLDUxLjI4NS0xMzQuMjQ1LDE4My44NDItMjUwLjk3MSwwLDAtMTEzLjYxMywxMzcuODgtMTMxLjE3MiwyMDkuNjU3LDAsMCwxMTIuMDcsMjcuMjU0LDE3MC43MjMtOTYuNzgyczMzLjk0OS0xODEuNTExLDMzLjk0OS0xODEuNTExIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMzI0MC43MTUgLTE3Ny43NTcpIiBmaWxsPSIjMGFmMWQwIi8+Cjwvc3ZnPgo=' alt=''/>
        Powered by <a class='color-blue' 
        onclick="window.open('https://greenmetrics.io/greenmetrics-analytics?utm_source=carbonav_light&utm_referer='+window.location.hostname, '_blank');">Greenmetrics</a>
      </div>
      <div class='logo'>
        <img class='gma-logo' width='140' alt='Greenmetrics Analytics' title='Greenmetrics Analytics' onclick="window.open('https://greenmetrics.io/greenmetrics-analytics?utm_source=carbonav_light&utm_referer='+window.location.hostname, '_blank');" src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMTkuOTE1IiBoZWlnaHQ9IjIyLjAxNCIgdmlld0JveD0iMCAwIDExOS45MTUgMjIuMDE0Ij4KICA8ZyBpZD0iR3JvdXBlXzI1ODA2IiBkYXRhLW5hbWU9Ikdyb3VwZSAyNTgwNiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTEzMDIgLTIwNS44ODcpIj4KICAgIDxnIGlkPSJHcm91cGVfMjQ3ODkiIGRhdGEtbmFtZT0iR3JvdXBlIDI0Nzg5IiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgxMzAyIDIwNS44ODcpIj4KICAgICAgPGcgaWQ9Ikdyb3VwZV8yNDc4NiIgZGF0YS1uYW1lPSJHcm91cGUgMjQ3ODYiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDIxLjkwNCAwKSI+CiAgICAgICAgPHBhdGggaWQ9IlRyYWPDqV8yNjUwNCIgZGF0YS1uYW1lPSJUcmFjw6kgMjY1MDQiIGQ9Ik03MS44MDgsMjEuOTEybDEuNTI3LS4zNTJhMi4xNTcsMi4xNTcsMCwwLDAsLjY4OCwxLjQxOCwyLjEzMSwyLjEzMSwwLDAsMCwxLjUxLjU2MlE3OCwyMy41MzksNzgsMjAuOTIyVjE5Ljc2NWEyLjMyMywyLjMyMywwLDAsMS0uOTQ4Ljk1NiwzLjAwNywzLjAwNywwLDAsMS0xLjUxOC4zNjksMy41MTUsMy41MTUsMCwwLDEtMi42NTktMS4xLDMuOSwzLjksMCwwLDEtMS4wNDktMi44MSwzLjk3NCwzLjk3NCwwLDAsMSwxLjA0LTIuNzkzLDMuNDU4LDMuNDU4LDAsMCwxLDIuNjY3LTEuMTMzLDIuNTA3LDIuNTA3LDAsMCwxLDIuNDgzLDEuMjc1VjEzLjQwNmgxLjU2djcuNDY2YTUuMTg2LDUuMTg2LDAsMCwxLS4yMSwxLjUsMy45NjEsMy45NjEsMCwwLDEtLjY2MywxLjI4NCwzLDMsMCwwLDEtMS4yNjcuOTIzLDQuOTc3LDQuOTc3LDAsMCwxLTEuOS4zMzZBMy44ODIsMy44ODIsMCwwLDEsNzMsMjQuMDY4YTMuMTUzLDMuMTUzLDAsMCwxLTEuMTkxLTIuMTU2bTMuOTU5LTIuMTQ3YTIuMTI0LDIuMTI0LDAsMCwwLDEuNjYxLS43MTMsMi43LDIuNywwLDAsMCwuNjM4LTEuODcxLDIuNywyLjcsMCwwLDAtLjYzOC0xLjg3MSwyLjEyNCwyLjEyNCwwLDAsMC0xLjY2MS0uNzEzLDIuMTgsMi4xOCwwLDAsMC0xLjY4Ni43LDIuNjcyLDIuNjcyLDAsMCwwLS42NDYsMS44NzksMi43MDksMi43MDksMCwwLDAsLjYyOSwxLjg4NywyLjE4MSwyLjE4MSwwLDAsMCwxLjcuNyIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTcxLjgwOCAtOS4yMTIpIiBmaWxsPSIjMmEyYzM1Ii8+CiAgICAgICAgPHBhdGggaWQ9IlRyYWPDqV8yNjUwNSIgZGF0YS1uYW1lPSJUcmFjw6kgMjY1MDUiIGQ9Ik0xMTAsMTMuMzZ2MS42NzhhNC44NTksNC44NTksMCwwLDAtLjY4OC0uMDVxLTIuMjE1LDAtMi4yMTUsMi40ODN2NC4wNDNoLTEuNTc3di04LjA3aDEuNTQzdjEuNDA5YTIuNSwyLjUsMCwwLDEsMi40MTYtMS41NDMsMi42NDcsMi42NDcsMCwwLDEsLjUyLjA1IiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtOTUuMjM4IC05LjI1KSIgZmlsbD0iIzJhMmMzNSIvPgogICAgICAgIDxwYXRoIGlkPSJUcmFjw6lfMjY1MDYiIGRhdGEtbmFtZT0iVHJhY8OpIDI2NTA2IiBkPSJNMTI5LjYxMiwxOC40NzhsMS4zNTkuNDdhMy41NzQsMy41NzQsMCwwLDEtMS4zMDksMS44MzcsMy43NjMsMy43NjMsMCwwLDEtMi4zMTUuNzEzLDMuOTQ1LDMuOTQ1LDAsMCwxLTIuODc3LTEuMTY2LDQuMjE3LDQuMjE3LDAsMCwxLTEuMTgzLTMuMTQ2LDQuMjcsNC4yNywwLDAsMSwxLjE0MS0zLjA1MywzLjg3OCwzLjg3OCwwLDAsMSw1LjU3LS4wNTksNC40Niw0LjQ2LDAsMCwxLDEuMDIzLDMuMDc4LDMuMTUyLDMuMTUyLDAsMCwxLS4wMzQuNWgtNi4wNzNhMi40MjQsMi40MjQsMCwwLDAsLjcxMywxLjc2MiwyLjM0OSwyLjM0OSwwLDAsMCwxLjcyLjY4OCwyLjE4LDIuMTgsMCwwLDAsMi4yNjUtMS42MjdtLTQuNjQ3LTIuMWg0LjQxMmEyLjAzNCwyLjAzNCwwLDAsMC0yLjIxNS0yLjA2NCwyLjA3NCwyLjA3NCwwLDAsMC0xLjU0My42MTMsMi4xOTMsMi4xOTMsMCwwLDAtLjY1NSwxLjQ1MSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTEwNy41ODQgLTguOTgyKSIgZmlsbD0iIzJhMmMzNSIvPgogICAgICAgIDxwYXRoIGlkPSJUcmFjw6lfMjY1MDciIGRhdGEtbmFtZT0iVHJhY8OpIDI2NTA3IiBkPSJNMTU5LjQyMiwxOC40NzhsMS4zNTkuNDdhMy41NzMsMy41NzMsMCwwLDEtMS4zMDksMS44MzcsMy43NjMsMy43NjMsMCwwLDEtMi4zMTUuNzEzLDMuOTQ1LDMuOTQ1LDAsMCwxLTIuODc3LTEuMTY2LDQuMjE3LDQuMjE3LDAsMCwxLTEuMTgzLTMuMTQ2LDQuMjcsNC4yNywwLDAsMSwxLjE0MS0zLjA1MywzLjg3OCwzLjg3OCwwLDAsMSw1LjU3LS4wNTksNC40Niw0LjQ2LDAsMCwxLDEuMDIzLDMuMDc4LDMuMTUzLDMuMTUzLDAsMCwxLS4wMzQuNWgtNi4wNzNhMi40MjQsMi40MjQsMCwwLDAsLjcxMywxLjc2MiwyLjM0OSwyLjM0OSwwLDAsMCwxLjcyLjY4OCwyLjE4LDIuMTgsMCwwLDAsMi4yNjUtMS42MjdtLTQuNjQ3LTIuMWg0LjQxMmEyLjAzNCwyLjAzNCwwLDAsMC0yLjIxNS0yLjA2NCwyLjA3NCwyLjA3NCwwLDAsMC0xLjU0My42MTMsMi4xOTMsMi4xOTMsMCwwLDAtLjY1NSwxLjQ1MSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTEyOC4zMDEgLTguOTgyKSIgZmlsbD0iIzJhMmMzNSIvPgogICAgICAgIDxwYXRoIGlkPSJUcmFjw6lfMjY1MDgiIGRhdGEtbmFtZT0iVHJhY8OpIDI2NTA4IiBkPSJNMTg2LjYyOSwxNi42MjF2NC42NjRoLTEuNTc3di04LjA3SDE4Ni42djEuMTU4YTIuNjczLDIuNjczLDAsMCwxLDIuNDgzLTEuMzkyLDIuNjM4LDIuNjM4LDAsMCwxLDIuMTM5Ljg4OSwzLjQ1NSwzLjQ1NSwwLDAsMSwuNzQ2LDIuM3Y1LjExN2gtMS41NzdWMTYuNDM2cTAtMi4wMy0xLjg3OS0yLjAzYTEuNjYxLDEuNjYxLDAsMCwwLTEuMzg0LjYyOSwyLjQ4NSwyLjQ4NSwwLDAsMC0uNDk1LDEuNTg1IiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMTUwLjUwOCAtOS4wMjEpIiBmaWxsPSIjMmEyYzM1Ii8+CiAgICAgICAgPHBhdGggaWQ9IlRyYWPDqV8yNjUwOSIgZGF0YS1uYW1lPSJUcmFjw6kgMjY1MDkiIGQ9Ik0yMTcuNTIyLDIxLjI4NWgtMS41NnYtOC4wN2gxLjUxdjEuMDc0YTIuNDMyLDIuNDMyLDAsMCwxLDEuMDQtLjk3MywzLjExMiwzLjExMiwwLDAsMSwxLjQwOS0uMzM2LDIuNzksMi43OSwwLDAsMSwxLjQ0My4zODYsMi4zMzQsMi4zMzQsMCwwLDEsLjk3MywxLjE0MSwyLjg1NSwyLjg1NSwwLDAsMSwyLjctMS41MjcsMi43MjksMi43MjksMCwwLDEsMS45NzEuNzg5LDMuMDM0LDMuMDM0LDAsMCwxLC44MTQsMi4yODJ2NS4yMzRoLTEuNTYxVjE2LjIxOGEyLDIsMCwwLDAtLjQyOC0xLjM0MiwxLjU5MiwxLjU5MiwwLDAsMC0xLjI4NC0uNSwxLjcyMSwxLjcyMSwwLDAsMC0xLjM0Mi41NzksMi4wOTEsMi4wOTEsMCwwLDAtLjUyLDEuNDUxdjQuODgyaC0xLjU3N1YxNi4yMThhMiwyLDAsMCwwLS40MjgtMS4zNDIsMS41OTEsMS41OTEsMCwwLDAtMS4yODQtLjUsMS43NTMsMS43NTMsMCwwLDAtMS4zNTkuNTcsMi4xMDYsMi4xMDYsMCwwLDAtLjUyLDEuNDc2WiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTE3MS45OSAtOS4wMjEpIiBmaWxsPSIjMmEyYzM1Ii8+CiAgICAgICAgPHBhdGggaWQ9IlRyYWPDqV8yNjUxMCIgZGF0YS1uYW1lPSJUcmFjw6kgMjY1MTAiIGQ9Ik0yNjcuMjc2LDE4LjQ3OGwxLjM1OS40N2EzLjU3MywzLjU3MywwLDAsMS0xLjMwOSwxLjgzNywzLjc2MywzLjc2MywwLDAsMS0yLjMxNS43MTMsMy45NDUsMy45NDUsMCwwLDEtMi44NzctMS4xNjYsNC4yMTcsNC4yMTcsMCwwLDEtMS4xODMtMy4xNDYsNC4yNyw0LjI3LDAsMCwxLDEuMTQxLTMuMDUzLDMuODc4LDMuODc4LDAsMCwxLDUuNTctLjA1OSw0LjQ2LDQuNDYsMCwwLDEsMS4wMjMsMy4wNzgsMy4xNTMsMy4xNTMsMCwwLDEtLjAzNC41aC02LjA3M2EyLjQyNCwyLjQyNCwwLDAsMCwuNzEzLDEuNzYyLDIuMzQ5LDIuMzQ5LDAsMCwwLDEuNzIuNjg4LDIuMTgsMi4xOCwwLDAsMCwyLjI2NS0xLjYyN20tNC42NDctMi4xaDQuNDEyYTIuMDM0LDIuMDM0LDAsMCwwLTIuMjE1LTIuMDY0LDIuMDc0LDIuMDc0LDAsMCwwLTEuNTQzLjYxMywyLjE5MywyLjE5MywwLDAsMC0uNjU1LDEuNDUxIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMjAzLjI1NSAtOC45ODIpIiBmaWxsPSIjMmEyYzM1Ii8+CiAgICAgICAgPHBhdGggaWQ9IlRyYWPDqV8yNjUxMSIgZGF0YS1uYW1lPSJUcmFjw6kgMjY1MTEiIGQ9Ik0yOTIuNzI3LDUuMzlWNy45NGgxLjc0NVY5LjM2NmgtMS43NDVWMTMuNTZhMS4xNjYsMS4xNjYsMCwwLDAsLjI2LjgzOSwxLjE2NiwxLjE2NiwwLDAsMCwuODY0LjI2OCwyLjU2OSwyLjU2OSwwLDAsMCwuNjIxLS4wNjd2MS4zNDJhMy4xMywzLjEzLDAsMCwxLTEuMDc0LjE1MSwyLjIyMSwyLjIyMSwwLDAsMS0xLjY0NC0uNiwyLjI5LDIuMjksMCwwLDEtLjYtMS42OTRWOS4zNjZoLTEuNTQzVjcuOTRoLjQzNmExLjE5MSwxLjE5MSwwLDAsMCwuOTMxLS4zNDQsMS4yODcsMS4yODcsMCwwLDAsLjMxMS0uOVY1LjM5WiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTIyMy4xNjkgLTMuNzQ2KSIgZmlsbD0iIzJhMmMzNSIvPgogICAgICAgIDxwYXRoIGlkPSJUcmFjw6lfMjY1MTIiIGRhdGEtbmFtZT0iVHJhY8OpIDI2NTEyIiBkPSJNMzE2LjM1OSwxMy4zNnYxLjY3OGE0Ljg2LDQuODYsMCwwLDAtLjY4OC0uMDVxLTIuMjE1LDAtMi4yMTUsMi40ODN2NC4wNDNIMzExLjg4di04LjA3aDEuNTQzdjEuNDA5YTIuNSwyLjUsMCwwLDEsMi40MTYtMS41NDMsMi42NDcsMi42NDcsMCwwLDEsLjUyLjA1IiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMjM4LjY0OSAtOS4yNSkiIGZpbGw9IiMyYTJjMzUiLz4KICAgICAgICA8cGF0aCBpZD0iVHJhY8OpXzI2NTEzIiBkYXRhLW5hbWU9IlRyYWPDqSAyNjUxMyIgZD0iTTMzMS4yMzcsMS45MzhhMS4wODYsMS4wODYsMCwwLDEtLjMyNy0uOCwxLjExNCwxLjExNCwwLDAsMSwuMzI3LS44MDUsMS4wNzEsMS4wNzEsMCwwLDEsLjgtLjMzNiwxLjExMiwxLjExMiwwLDAsMSwuODA1LjMyNywxLjA5MSwxLjA5MSwwLDAsMSwuMzM2LjgxNCwxLjA3MSwxLjA3MSwwLDAsMS0uMzM2LjgsMS4xMTQsMS4xMTQsMCwwLDEtLjgwNS4zMjcsMS4wODYsMS4wODYsMCwwLDEtLjgtLjMyN20xLjU4NiwxMC4zMjZoLTEuNTZWNC4xOTRoMS41NloiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0yNTEuODc0IDApIiBmaWxsPSIjMmEyYzM1Ii8+CiAgICAgICAgPHBhdGggaWQ9IlRyYWPDqV8yNjUxNCIgZGF0YS1uYW1lPSJUcmFjw6kgMjY1MTQiIGQ9Ik0zNDcuODM5LDE0LjM4NWEyLjMyMywyLjMyMywwLDAsMC0xLjczNi43MzgsMi44NzIsMi44NzIsMCwwLDAtLjcxMywyLjA4LDIuOTA3LDIuOTA3LDAsMCwwLC43MTMsMi4wOCwyLjMxNywyLjMxNywwLDAsMCwxLjc1My43NTUsMi4xNDMsMi4xNDMsMCwwLDAsMS41MzUtLjUsMi41MzIsMi41MzIsMCwwLDAsLjcxMy0xLjE1OGwxLjM5Mi42YTMuODEsMy44MSwwLDAsMS0xLjI2NywxLjc2MiwzLjY0OSwzLjY0OSwwLDAsMS0yLjM3NC43NTUsMy44NDYsMy44NDYsMCwwLDEtMi45Mi0xLjIyNSw0LjI5Myw0LjI5MywwLDAsMS0xLjE1OC0zLjA3LDQuMjUyLDQuMjUyLDAsMCwxLDEuMTU4LTMuMDc5LDMuODY3LDMuODY3LDAsMCwxLDIuOS0xLjIsMy42MzQsMy42MzQsMCwwLDEsMi4zOTEuNzU1LDMuNSwzLjUsMCwwLDEsMS4yLDEuODEyTDM1MCwxNi4xYTIuNTU0LDIuNTU0LDAsMCwwLS43LTEuMjA4LDIuMDEyLDIuMDEyLDAsMCwwLTEuNDYtLjUiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0yNjAuODE4IC04Ljk4MikiIGZpbGw9IiMyYTJjMzUiLz4KICAgICAgICA8cGF0aCBpZD0iVHJhY8OpXzI2NTE1IiBkYXRhLW5hbWU9IlRyYWPDqSAyNjUxNSIgZD0iTTM3Mi42NTQsMTkuMTQ5bDEuNDI2LS41YTEuNjc2LDEuNjc2LDAsMCwwLC41NywxLjA4MiwxLjkwOSwxLjkwOSwwLDAsMCwxLjMwOS40MjgsMS41MTYsMS41MTYsMCwwLDAsMS4wMDctLjMxLjk2Mi45NjIsMCwwLDAsLjM2OS0uNzY0cTAtLjgwNS0xLjA0LTEuMDRsLTEuMzc2LS4zYTIuNjUsMi42NSwwLDAsMS0xLjQ3Ni0uODA1LDIuMTIsMi4xMiwwLDAsMS0uNTM3LTEuNDYsMi4zMjksMi4zMjksMCwwLDEsLjg0Ny0xLjgsMi45MzUsMi45MzUsMCwwLDEsMi4wMjEtLjc1NSwzLjksMy45LDAsMCwxLDEuMzc2LjIyNiwyLjM3LDIuMzcsMCwwLDEsLjk0LjYsMy40MiwzLjQyLDAsMCwxLC41LjY4OCwyLjk0OCwyLjk0OCwwLDAsMSwuMjUyLjY1NGwtMS4zOTIuNTJhMS42ODcsMS42ODcsMCwwLDAtLjExNy0uMzk0LDIuMjA5LDIuMjA5LDAsMCwwLS4yNi0uNDI4LDEuMjE5LDEuMjE5LDAsMCwwLS41MTItLjM3OCwyLjAxLDIuMDEsMCwwLDAtLjc4OS0uMTQyLDEuNDQ1LDEuNDQ1LDAsMCwwLS45NjUuMzE5Ljk2Mi45NjIsMCwwLDAtLjM3Ny43NTVxMCwuNzcyLjkyMy45NzNsMS4zMDkuMjg1YTMuMDY0LDMuMDY0LDAsMCwxLDEuNjUyLjg2NEEyLjE4MywyLjE4MywwLDAsMSwzNzguOSwxOWEyLjM3OSwyLjM3OSwwLDAsMS0uNzgsMS43MjgsMi45NTUsMi45NTUsMCwwLDEtMi4xNzIuNzcyLDMuMzg2LDMuMzg2LDAsMCwxLTIuMzMyLS43NDcsMi42NDcsMi42NDcsMCwwLDEtLjk1Ni0xLjYiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0yODAuODg1IC04Ljk4MikiIGZpbGw9IiMyYTJjMzUiLz4KICAgICAgPC9nPgogICAgICA8ZyBpZD0iR3JvdXBlXzI0Nzg1IiBkYXRhLW5hbWU9Ikdyb3VwZSAyNDc4NSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoNzcuNTY3IDE3LjIyMikiPgogICAgICAgIDxwYXRoIGlkPSJUcmFjw6lfMjY1MTYiIGRhdGEtbmFtZT0iVHJhY8OpIDI2NTE2IiBkPSJNMjU3LjYsNjAuNDUzaC0xLjk4N2wtLjMyOS45aC0xbDEuNzg2LTQuNjMxaDEuMDk0bDEuNzc5LDQuNjMxaC0xLjAxNFptLS4zMTUtLjg1My0uNjc3LTEuODU5LS42ODUsMS44NTlaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMjU0LjI4NyAtNTYuNjQpIiBmaWxsPSIjOGM0YmZlIi8+CiAgICAgICAgPHBhdGggaWQ9IlRyYWPDqV8yNjUxNyIgZGF0YS1uYW1lPSJUcmFjw6kgMjY1MTciIGQ9Ik0yNzcuNDQ1LDU2LjcyMXY0LjYzMWgtLjk0TDI3NC40LDU4LjMxMXYzLjA0MWgtLjkyNlY1Ni43MjFoLjk0bDIuMTA3LDMuMDQxVjU2LjcyMVoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0yNjcuNjE5IC01Ni42NCkiIGZpbGw9IiM4YzRiZmUiLz4KICAgICAgICA8cGF0aCBpZD0iVHJhY8OpXzI2NTE4IiBkYXRhLW5hbWU9IlRyYWPDqSAyNjUxOCIgZD0iTTI5My43MjYsNjAuNDUzSDI5MS43NGwtLjMyOS45aC0xbDEuNzg1LTQuNjMxaDEuMDk0bDEuNzc5LDQuNjMxaC0xLjAxNFptLS4zMTUtLjg1My0uNjc3LTEuODU5LS42ODUsMS44NTlaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMjc5LjM5MiAtNTYuNjQpIiBmaWxsPSIjOGM0YmZlIi8+CiAgICAgICAgPHBhdGggaWQ9IlRyYWPDqV8yNjUxOSIgZGF0YS1uYW1lPSJUcmFjw6kgMjY1MTkiIGQ9Ik0zMTIuNTQyLDYwLjQ4di44NzJIMzA5LjZWNTYuNzIxaC45MjZWNjAuNDhaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMjkyLjcyNCAtNTYuNjQpIiBmaWxsPSIjOGM0YmZlIi8+CiAgICAgICAgPHBhdGggaWQ9IlRyYWPDqV8yNjUyMCIgZGF0YS1uYW1lPSJUcmFjw6kgMjY1MjAiIGQ9Ik0zMjYuNDI5LDU2LjcyMWwtMS44MDYsMy4wMDd2MS42MjVIMzIzLjdWNTkuNzI3bC0xLjgwNi0zLjAwN2gxLjA2MWwxLjIyMSwyLjA2NywxLjIyMi0yLjA2N1oiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0zMDEuMjcgLTU2LjY0KSIgZmlsbD0iIzhjNGJmZSIvPgogICAgICAgIDxwYXRoIGlkPSJUcmFjw6lfMjY1MjEiIGRhdGEtbmFtZT0iVHJhY8OpIDI2NTIxIiBkPSJNMzQzLjA1Myw1Ny41OTRoLTEuMzM2djMuNzU4aC0uOTI2VjU3LjU5NGgtMS4zNDJ2LS44NzNoMy42WiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTMxMy40NzEgLTU2LjY0KSIgZmlsbD0iIzhjNGJmZSIvPgogICAgICAgIDxyZWN0IGlkPSJSZWN0YW5nbGVfMjU2MzAiIGRhdGEtbmFtZT0iUmVjdGFuZ2xlIDI1NjMwIiB3aWR0aD0iMC45MjYiIGhlaWdodD0iNC42MzEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDMwLjg3NiAwLjA4KSIgZmlsbD0iIzhjNGJmZSIvPgogICAgICAgIDxwYXRoIGlkPSJUcmFjw6lfMjY1MjIiIGRhdGEtbmFtZT0iVHJhY8OpIDI2NTIyIiBkPSJNMzYyLjk4OSw1OC44NTRhMi4zNzEsMi4zNzEsMCwwLDEsMi40NDMtMi40LDIuNDIzLDIuNDIzLDAsMCwxLDIuMDQsMS4wNGwtLjguNWExLjUsMS41LDAsMSwwLDAsMS43MThsLjguNWEyLjQyMiwyLjQyMiwwLDAsMS0yLjA0LDEuMDQsMi4zNzEsMi4zNzEsMCwwLDEtMi40NDMtMi40IiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMzI5LjgzMSAtNTYuNDU4KSIgZmlsbD0iIzhjNGJmZSIvPgogICAgICAgIDxwYXRoIGlkPSJUcmFjw6lfMjY1MjMiIGRhdGEtbmFtZT0iVHJhY8OpIDI2NTIzIiBkPSJNMzgwLjg1Miw2MC41MjRsLjQ3Ni0uN2EyLjIwOCwyLjIwOCwwLDAsMCwxLjQ1LjZjLjQ2MywwLC44NTItLjIxNS44NTItLjUzNywwLS4zODktLjUyMy0uNTEtMS0uNjI0LS44ODYtLjIwOC0xLjYxMS0uNjMxLTEuNjExLTEuNDQzcy43MTgtMS4zNjMsMS43NTktMS4zNjNhMi4zLDIuMywwLDAsMSwxLjYuNTc3bC0uNDI5LjdhMS43ODksMS43ODksMCwwLDAtMS4xODgtLjQ1Yy0uNDYzLDAtLjc5Mi4yMDgtLjc5Mi41LDAsLjM1Ni40ODMuNTEuOTEzLjZzMS43LjQsMS43LDEuNDYzYzAsLjgzMi0uNzkyLDEuNC0xLjgwNiwxLjRhMi45NTEsMi45NTEsMCwwLDEtMS45MjYtLjcyNSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTM0Mi4yNDUgLTU2LjQ1NykiIGZpbGw9IiM4YzRiZmUiLz4KICAgICAgPC9nPgogICAgICA8ZyBpZD0iR3JvdXBlXzI0Nzg3IiBkYXRhLW5hbWU9Ikdyb3VwZSAyNDc4NyIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCA0LjE5NCkiPgogICAgICAgIDxwYXRoIGlkPSJUcmFjw6lfMjY1MjQiIGRhdGEtbmFtZT0iVHJhY8OpIDI2NTI0IiBkPSJNMzYuMzMxLDI0LjEwOGExLjUyMywxLjUyMywwLDAsMS0xLjIxMi0uNmwtMy4wNjUtNGExLjUyNSwxLjUyNSwwLDEsMSwyLjQyMS0xLjg1NmwzLjA2NSw0YTEuNTI1LDEuNTI1LDAsMCwxLTEuMjA5LDIuNDUzIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMjIuMDU4IC0xNi4wNSkiIGZpbGw9IiNhMzZmZmUiLz4KICAgICAgICA8cGF0aCBpZD0iVHJhY8OpXzI2NTI1IiBkYXRhLW5hbWU9IlRyYWPDqSAyNjUyNSIgZD0iTTE2LjM4OCwxNS4zNTksMTQuNTQsMTcuNzhsLTIuNi0zLjQzQTEuNTI1LDEuNTI1LDAsMSwwLDkuNTExLDE2LjJsMy44MTQsNS4wMTlhMS41MjcsMS41MjcsMCwwLDAsMS4yMTIuNmgwYTEuNTI1LDEuNTI1LDAsMCwwLDEuMjEzLS42bDMuMDYxLTQuMDFhMS41MjUsMS41MjUsMCwwLDAtMi40MjUtMS44NTEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC02LjM5MyAtMTMuNzUpIiBmaWxsPSIjYTM2ZmZlIi8+CiAgICAgICAgPHBhdGggaWQ9IlRyYWPDqV8yNjUyNiIgZGF0YS1uYW1lPSJUcmFjw6kgMjY1MjYiIGQ9Ik0zNC40MjksMTcuNmwwLDAtLjA0MS0uMDQ1LS4wMTMtLjAxNS0uMDI5LS4wMjktLjAyOS0uMDI5LS4wMTUtLjAxMy0uMDQ2LS4wNDEsMCwwLS4wNTktLjA0OC0uMDYzLS4wNDZoMGwtLjA2Mi0uMDQtLjAwOS0uMDA2TDM0LDE3LjI1bC0uMDItLjAxMS0uMDQzLS4wMjItLjAzMi0uMDE1LS4wMzMtLjAxNS0uMDQyLS4wMTctLjAyMy0uMDA5LS4wNTEtLjAxOS0uMDE2LS4wMDUtLjA1OC0uMDE4LS4wMTEsMC0uMDYxLS4wMTYtLjAwOSwwLS4wNjEtLjAxMy0uMDExLDAtLjA1OS0uMDA5LS4wMTYsMC0uMDU0LS4wMDYtLjAyMiwwLS4wNDgsMGgtLjEzOGwtLjA0NywwLS4wMjIsMC0uMDU0LjAwNi0uMDE2LDBMMzMsMTcuMDg0bC0uMDExLDAtLjA2Mi4wMTMtLjAwOSwwLS4wNjEuMDE2LS4wMTIsMC0uMDU3LjAxOC0uMDE2LjAwNi0uMDUxLjAxOC0uMDIzLjAwOS0uMDQxLjAxNy0uMDMzLjAxNS0uMDMxLjAxNS0uMDQzLjAyMy0uMDIuMDExLS4wNTMuMDMxLS4wMDkuMDA2LS4wNjIuMDRoMGwtLjA2My4wNDYtLjA1OS4wNDgsMCwwLS4wNDYuMDQxLS4wMTQuMDEzLS4wMy4wMjktLjAyOS4wMjktLjAxMy4wMTVMMzIuMSwxNy42bDAsMC0uMDQ3LjA1OSwwLDBhMS41MjYsMS41MjYsMCwwLDAsMCwxLjg1MkwzMy4yNjgsMjEuMWwxLjIwOS0xLjU4NGExLjUyNiwxLjUyNiwwLDAsMCwwLTEuODUydjBaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMjIuMDU4IC0xNi4wNSkiIGZpbGw9IiM4YzRiZmUiLz4KICAgICAgICA8cGF0aCBpZD0iVHJhY8OpXzI2NTI3IiBkYXRhLW5hbWU9IlRyYWPDqSAyNjUyNyIgZD0iTTAsMzEuN2ExLjUzMSwxLjUzMSwwLDEsMCwxLjUzMS0xLjUzMUExLjUzMSwxLjUzMSwwLDAsMCwwLDMxLjciIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgLTI1LjE1OSkiIGZpbGw9IiNhMzZmZmUiLz4KICAgICAgICA8cGF0aCBpZD0iVHJhY8OpXzI2NTI4IiBkYXRhLW5hbWU9IlRyYWPDqSAyNjUyOCIgZD0iTTQzLjI3NywzMC4xNmExLjUzMiwxLjUzMiwwLDEsMCwxLjUzMiwxLjUzMiwxLjUzMiwxLjUzMiwwLDAsMC0xLjUzMi0xLjUzMiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTI5LjAxMSAtMjUuMTU0KSIgZmlsbD0iI2EzNmZmZSIvPgogICAgICA8L2c+CiAgICA8L2c+CiAgPC9nPgo8L3N2Zz4K'/>
      </div>
  </div>
</div>`;

class Carbonav extends HTMLElement {
  // one second frequency in ms
  private frequency: number = 1000;
  private timer: number | undefined;
  private transferSize: number = 0;
  private duration: number = 0;
  private readonly deviceKwhByMinute: number = 0;
  private readonly currentDevice: string;

  // Init stored variables
  private storedDeviceCo2: number = 0;
  private storedNetworkCo2: number = 0;
  private storedDCCo2: number = 0;
  private storedCountDOM: number = 0;
  private storedDuration: number = 0;
  private storedTransferSize: number = 0;

  // Equivalence Randomizer
  private randomizerEquivalence: number = Math.floor(Math.random() * 2);
  private currentLanguage = navigator.language === "fr-FR" ? "fr" : "en";

  // Constructor
  constructor() {
    super();
    this.currentDevice = getDeviceType();
    this.deviceKwhByMinute =
      this.currentDevice == "Mobile"
        ? DEVICE_MOBILE_KWH_BY_MINUTE
        : this.currentDevice == "Tablet"
        ? DEVICE_TABLET_KWH_BY_MINUTE
        : DEVICE_DESKTOP_KWH_BY_MINUTE;
    this.attachShadow({ mode: "open" }).appendChild(
      carbonavBox.content.cloneNode(true)
    );
  }

  // First DOM appearance
  connectedCallback() {
    this.storedDeviceCo2 = Number(sessionStorage.getItem("storedDeviceCo2"));
    this.storedNetworkCo2 = Number(sessionStorage.getItem("storedNetworkCo2"));
    this.storedDCCo2 = Number(sessionStorage.getItem("storedDCCo2"));
    this.storedTransferSize = Number(
      sessionStorage.getItem("storedTransferSize")
    );
    this.storedCountDOM = Number(sessionStorage.getItem("storedCountDOM"));
    this.storedDuration = Number(sessionStorage.getItem("storedDuration"));
    this.timer = setInterval(() => this.refreshScores(), this.frequency);
    this.refreshScores();
    this.refreshLabels();
  }

  disconnectedCallback() {
    clearInterval(this.timer);
  }

  // Replace Scores Flags on each frequency trigger
  // Generate Scores
  refreshScores() {
    // Cumulate Seconds
    this.duration += this.frequency;
    const transferSize =
      this.transferSize +
      (performance
        ? performance
            .getEntries()
            .reduce(
              (accumulator, currentSize) =>
                accumulator + ((currentSize as any).transferSize || 0),
              0
            )
        : 0);

    // Calcul Scores
    const deviceCo2 =
      this.storedDeviceCo2 +
      (this.deviceKwhByMinute / 60) * (this.duration / 1000) * timezoneCo2PerKw;
    const networkCo2 =
      this.storedNetworkCo2 +
      NETWORK_AVERAGE_KW_PER_BYTE * transferSize * timezoneCo2PerKw;
    const datacenterCo2 =
      this.storedDCCo2 +
      DATACENTER_AVERAGE_KW_PER_BYTE * transferSize * timezoneCo2PerKw;
    const globalCo2 = deviceCo2 + networkCo2 + datacenterCo2;
    const storedTransferSize = this.storedTransferSize + transferSize;
    const storedCountDOM = this.storedCountDOM + 1;
    const storedDuration = this.storedDuration + this.duration / 1000;

    // Equivalence I18
    const equivalencesI18n = {
      fr: {
        equivalenceLight: "Une ampoule de 50W allumée pendant ",
        equivalenceDiesel: " mètre(s) parcouru(s) en voiture diesel",
      },
      en: {
        equivalenceLight: "A 50W bulb lit hanging ",
        equivalenceDiesel: " meter(s) traveled by diesel car",
      },
    };

    // Equivalence Array
    const equivalenceValues: Array<any> = [
      equivalencesI18n[this.currentLanguage].equivalenceLight +
        formatTime(globalCo2 / CO2_TO_LIGHT_DURATION),
      (Math.round((globalCo2 / CO2_TO_GAZOILE_CAR_METER) * 10) / 10).toFixed(
        1
      ) + equivalencesI18n[this.currentLanguage].equivalenceDiesel,
    ];

    // Store Scores
    sessionStorage.setItem("storedDeviceCo2", String(deviceCo2));
    sessionStorage.setItem("storedNetworkCo2", String(networkCo2));
    sessionStorage.setItem("storedDCCo2", String(datacenterCo2));
    sessionStorage.setItem("storedTransferSize", String(storedTransferSize));
    sessionStorage.setItem("storedCountDOM", String(storedCountDOM));
    sessionStorage.setItem("storedDuration", String(storedDuration));

    // Replace Content
    this.shadowRoot.getElementById("dom-count")!.textContent = storedCountDOM;
    this.shadowRoot.getElementById("region")!.textContent = region;
    this.shadowRoot.getElementById("device")!.textContent =
      this.currentDevice == "Mobile"
        ? "Mobile"
        : this.currentDevice == "Tablet"
        ? "Tablet"
        : "Desktop";
    this.shadowRoot.getElementById("network")!.textContent = formatBytes(
      storedTransferSize,
      2
    );
    this.shadowRoot.getElementById("duration")!.textContent =
      formatTime(storedDuration);
    this.shadowRoot.getElementById("equivalence-duration")!.textContent =
      equivalenceValues[this.randomizerEquivalence];
    this.shadowRoot.getElementById(
      "carbon-score"
    )!.innerHTML = `${Intl.NumberFormat([], {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(globalCo2)}g CO&#x2082;e`;
    this.shadowRoot.getElementById(
      "impact-site"
    )!.innerHTML = `${Intl.NumberFormat([], {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(networkCo2 + datacenterCo2)}g`;
    this.shadowRoot.getElementById(
      "impact-device"
    )!.innerHTML = `${Intl.NumberFormat([], {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(deviceCo2)}g`;
  }

  refreshLabels() {
    const i18n = {
      fr: {
        introductionPhrase: "Votre navigation sur le site a émis environ",
        domCount: "Nombre de pages parcourues",
        device: "Appareil",
        duration: "Durée",
        network: "Transfert",
        region: "Région",
        headerTitle: "L’impact de votre visite en ligne",
        impactDeviceLabel: "Impact estimatif lié à",
        impactDeviceLabelType: "votre terminal",
        impactSiteLabel: "Impact estimatif lié",
        impactSiteLabelType: "au réseau et au site web",
      },
      en: {
        introductionPhrase: "Your navigation on the website has emitted about",
        domCount: "Number of pages browsed",
        device: "Device",
        duration: "Duration",
        network: "Network",
        region: "Zone",
        headerTitle: "Your online visit impact",
        impactDeviceLabel: "Impact related to",
        impactDeviceLabelType: "your device",
        impactSiteLabel: "Estimated impact related to",
        impactSiteLabelType: "network and website",
      },
    };
    this.shadowRoot.getElementById("header-title")!.textContent =
      i18n[this.currentLanguage].headerTitle;
    this.shadowRoot.getElementById("introduction-phrase")!.textContent =
      i18n[this.currentLanguage].introductionPhrase;
    this.shadowRoot.getElementById("impact-device-label")!.textContent =
      i18n[this.currentLanguage].impactDeviceLabel;
    this.shadowRoot.getElementById("impact-device-type-label")!.textContent =
      i18n[this.currentLanguage].impactDeviceLabelType;
    this.shadowRoot.getElementById("impact-site-label")!.textContent =
      i18n[this.currentLanguage].impactSiteLabel;
    this.shadowRoot.getElementById("impact-site-type-label")!.textContent =
      i18n[this.currentLanguage].impactSiteLabelType;
    this.shadowRoot.getElementById("dom-count-label")!.textContent =
      i18n[this.currentLanguage].domCount;
    this.shadowRoot.getElementById("device-label")!.textContent =
      i18n[this.currentLanguage].device;
    this.shadowRoot.getElementById("region-label")!.textContent =
      i18n[this.currentLanguage].region;
    this.shadowRoot.getElementById("network-label")!.textContent =
      i18n[this.currentLanguage].network;
    this.shadowRoot.getElementById("duration-label")!.textContent =
      i18n[this.currentLanguage].duration;
  }
}

let carbonavElement = document.createElement("carbo-nav");
document.body.appendChild(carbonavElement);
document.head.insertAdjacentHTML(
  "beforeend",
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins&display=swap" type="text/css"/>'
);
customElements.define("carbo-nav", Carbonav);
