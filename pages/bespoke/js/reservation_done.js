(function () {
  "use strict";
  var STORAGE_KEY = "tchaiBespokeReservation";

  function setText(id, value) {
    var element = document.getElementById(id);
    if (element) element.textContent = value || "—";
  }

  function init() {
    var data = null;
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) data = JSON.parse(raw);
    } catch (error) {
      data = null;
    }

    var request = document.getElementById("done_request");
    var visit = document.getElementById("done_visit");
    var phone = document.getElementById("done_phone");

    if (!data) {
      if (request) request.hidden = true;
      if (visit) visit.hidden = false;
      if (phone) phone.hidden = true;
      return;
    }

    if (request) request.hidden = false;
    setText("done_request_meeting", data.meeting);
    setText("done_request_date", data.dateLabel);
    setText("done_request_time", data.time);
    setText("done_request_silhouette", data.silhouette);
    setText("done_request_fabric", data.fabric);

    var isPhone = data.meetingValue === "phone";
    if (visit) visit.hidden = isPhone;
    if (phone) phone.hidden = !isPhone;
    if (isPhone && data.phone) setText("done_phone_number", data.phone);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
