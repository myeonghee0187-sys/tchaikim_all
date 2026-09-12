/* Reservation form interactions. */
(function () {
  "use strict";

  var DONE_URL = "reservation_done.html";
  var STORAGE_KEY = "tchaiBespokeReservation";
  var DATE_MESSAGE = "Please choose an available weekday.";
  var TIME_MESSAGE = "Please choose a meeting time.";
  var AGREE_MESSAGE = "Both agreements above are required.";

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function toISODate(date) {
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
  }

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function formatLongDate(iso) {
    if (!iso) return "";
    var parts = iso.split("-").map(Number);
    var date = new Date(parts[0], parts[1] - 1, parts[2]);
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    }).format(date);
  }

  function initStepTracking() {
    var stepList = document.getElementById("reservation_steps");
    if (!stepList) return;

    var items = Array.prototype.slice.call(stepList.querySelectorAll("[data-step_for]"));
    var sections = items.map(function (item) {
      return document.getElementById(item.getAttribute("data-step_for"));
    }).filter(Boolean);
    var nav = stepList.closest(".reservation_steps") || stepList;
    var ticking = false;

    function setActiveStep(sectionId) {
      items.forEach(function (item) {
        var active = item.getAttribute("data-step_for") === sectionId;
        item.classList.toggle("is_active", active);
        var link = item.querySelector(".reservation_steps_link");
        if (!link) return;
        if (active) link.setAttribute("aria-current", "step");
        else link.removeAttribute("aria-current");
      });
    }

    function activationLine() {
      var topValue = parseFloat(getComputedStyle(nav).top) || 0;
      return topValue + nav.getBoundingClientRect().height + 36;
    }

    function syncFromScroll() {
      ticking = false;
      var line = activationLine();
      var active = sections[0];

      sections.forEach(function (section) {
        if (section.getBoundingClientRect().top <= line) active = section;
      });

      if (active) setActiveStep(active.id);
    }

    function requestSync() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(syncFromScroll);
    }

    items.forEach(function (item) {
      var link = item.querySelector(".reservation_steps_link");
      if (!link) return;
      link.addEventListener("click", function () {
        setActiveStep(item.getAttribute("data-step_for"));
        window.setTimeout(requestSync, 120);
      });
    });

    window.addEventListener("scroll", requestSync, { passive: true });
    window.addEventListener("resize", requestSync);
    window.addEventListener("load", requestSync);
    requestSync();
  }

  function initCalendar() {
    var body = document.getElementById("reservation_calendar_body");
    var monthLabel = document.getElementById("reservation_calendar_month");
    var caption = document.getElementById("reservation_calendar_caption");
    var dateValue = document.getElementById("reservation_date_value");
    var navButtons = Array.prototype.slice.call(document.querySelectorAll("[data-calendar_step]"));
    var timeInputs = Array.prototype.slice.call(document.querySelectorAll('input[name="meeting_time"]'));
    var timetableDate = document.getElementById("reservation_timetable_date");
    if (!body || !monthLabel || !dateValue) return;

    var today = startOfDay(new Date());
    var currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    var viewMonth = new Date(currentMonth);

    function isSameMonth(a, b) {
      return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
    }

    function resetTime() {
      timeInputs.forEach(function (input) {
        input.checked = false;
      });
      var status = document.getElementById("schedule_status");
      if (status) status.textContent = "";
    }

    function syncTimeAvailability() {
      var hasDate = Boolean(dateValue.value);
      timeInputs.forEach(function (input) {
        input.disabled = !hasDate;
        if (!hasDate) input.checked = false;
      });
      if (timetableDate) {
        timetableDate.textContent = hasDate
          ? formatLongDate(dateValue.value)
          : "Select a date to view available times.";
      }
      document.dispatchEvent(new CustomEvent("reservation:statechange"));
    }

    function render() {
      var year = viewMonth.getFullYear();
      var month = viewMonth.getMonth();
      var firstDay = new Date(year, month, 1).getDay();
      var monthText = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(viewMonth);
      monthLabel.textContent = monthText;
      if (caption) caption.textContent = monthText;
      body.innerHTML = "";

      for (var rowIndex = 0; rowIndex < 6; rowIndex += 1) {
        var row = document.createElement("tr");
        for (var column = 0; column < 7; column += 1) {
          var cellIndex = rowIndex * 7 + column;
          var dayNumber = cellIndex - firstDay + 1;
          var date = new Date(year, month, dayNumber);
          var cell = document.createElement("td");

          if (date.getMonth() === month) {
            var button = document.createElement("button");
            var iso = toISODate(date);
            var weekend = date.getDay() === 0 || date.getDay() === 6;
            var past = startOfDay(date) < today;
            button.className = "reservation_day";
            button.type = "button";
            button.value = iso;
            button.textContent = String(date.getDate());
            button.disabled = weekend || past;

            if (weekend) button.setAttribute("aria-label", formatLongDate(iso) + ", unavailable weekend");
            if (past) button.setAttribute("aria-label", formatLongDate(iso) + ", unavailable past date");
            if (dateValue.value === iso && !button.disabled) {
              button.classList.add("is_selected");
              button.setAttribute("aria-pressed", "true");
            }
            cell.appendChild(button);
          }

          row.appendChild(cell);
        }
        body.appendChild(row);
      }

      navButtons.forEach(function (button) {
        if (Number(button.getAttribute("data-calendar_step")) < 0) {
          button.disabled = isSameMonth(viewMonth, currentMonth);
        }
      });
    }

    body.addEventListener("click", function (event) {
      var day = event.target.closest(".reservation_day");
      if (!day || day.disabled) return;
      dateValue.value = day.value;
      resetTime();
      render();
      syncTimeAvailability();
    });

    navButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        if (button.disabled) return;
        var step = Number(button.getAttribute("data-calendar_step"));
        var next = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + step, 1);
        if (next < currentMonth) next = new Date(currentMonth);
        viewMonth = next;
        render();
      });
    });

    dateValue.value = "";
    render();
    syncTimeAvailability();
  }

  function initMeetingMode() {
    var form = document.getElementById("reservation_form");
    var note = document.getElementById("reservation_mode_note");
    var title = document.getElementById("reservation_timetable_title");
    var schedule = document.getElementById("reservation_schedule");
    if (!form) return;

    function sync() {
      var selected = form.querySelector('input[name="meeting_mode"]:checked');
      var phone = Boolean(selected && selected.value === "phone");
      if (note) {
        note.textContent = phone
          ? "Choose a weekday for a 60-minute phone consultation. We’ll call the number you provide below."
          : "Choose a weekday for your visit to our Hannam-dong atelier.";
      }
      if (title) title.textContent = phone ? "Phone call times" : "Atelier appointment times";
      if (schedule) schedule.classList.toggle("is_phone_mode", phone);
    }

    form.addEventListener("change", function (event) {
      if (event.target.name === "meeting_mode") sync();
    });
    sync();
  }

  function initSubmit() {
    var form = document.getElementById("reservation_form");
    var status = document.getElementById("reservation_status");
    var scheduleStatus = document.getElementById("schedule_status");
    var submitButton = document.getElementById("reservation_submit_button");
    var dateValue = document.getElementById("reservation_date_value");
    var agreeAll = document.getElementById("agree_all");
    var agreePrivacy = document.getElementById("agree_privacy");
    var agreeProduction = document.getElementById("agree_production");
    if (!form || !status) return;

    var agreeBoxes = [agreePrivacy, agreeProduction].filter(Boolean);

    function getCheckedTime() {
      return form.querySelector('input[name="meeting_time"]:checked');
    }

    function isAgreed() {
      return Boolean(agreePrivacy && agreePrivacy.checked && agreeProduction && agreeProduction.checked);
    }

    function syncAgreeAll() {
      if (!agreeAll || !agreeBoxes.length) return;
      var count = agreeBoxes.filter(function (box) { return box.checked; }).length;
      agreeAll.checked = count === agreeBoxes.length;
      agreeAll.indeterminate = count > 0 && count < agreeBoxes.length;
    }

    function canSubmit() {
      return Boolean(dateValue && dateValue.value && getCheckedTime() && isAgreed());
    }

    function refreshSubmit() {
      if (submitButton) submitButton.disabled = !canSubmit();
    }

    function choiceLabel(name) {
      var input = form.querySelector('input[name="' + name + '"]:checked');
      if (!input) return "";
      var label = input.closest("label");
      var text = label && label.querySelector(".bespoke_choice_name, .bespoke_button, .reservation_time_face");
      return text ? text.textContent.trim() : input.value;
    }

    function saveRequest() {
      var mode = form.querySelector('input[name="meeting_mode"]:checked');
      var phoneField = document.getElementById("field_phone");
      var payload = {
        meetingValue: mode ? mode.value : "atelier",
        meeting: choiceLabel("meeting_mode"),
        date: dateValue ? dateValue.value : "",
        dateLabel: dateValue ? formatLongDate(dateValue.value) : "",
        time: choiceLabel("meeting_time"),
        silhouette: choiceLabel("silhouette"),
        fabric: choiceLabel("fabric"),
        phone: phoneField ? phoneField.value.trim() : ""
      };
      try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch (error) { /* no-op */ }
    }

    if (agreeAll) {
      agreeAll.addEventListener("change", function () {
        agreeBoxes.forEach(function (box) { box.checked = agreeAll.checked; });
        agreeAll.indeterminate = false;
        status.textContent = "";
        refreshSubmit();
      });
    }

    agreeBoxes.forEach(function (box) {
      box.addEventListener("change", function () {
        syncAgreeAll();
        status.textContent = "";
        refreshSubmit();
      });
    });

    form.addEventListener("change", function (event) {
      if (event.target.name === "meeting_time" && scheduleStatus) scheduleStatus.textContent = "";
      refreshSubmit();
    });
    document.addEventListener("reservation:statechange", refreshSubmit);

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      status.textContent = "";
      if (!dateValue || !dateValue.value) {
        if (scheduleStatus) scheduleStatus.textContent = DATE_MESSAGE;
        return;
      }
      if (!getCheckedTime()) {
        if (scheduleStatus) scheduleStatus.textContent = TIME_MESSAGE;
        return;
      }
      if (!isAgreed()) {
        status.textContent = AGREE_MESSAGE;
        return;
      }
      saveRequest();
      window.location.href = DONE_URL;
    });

    syncAgreeAll();
    status.textContent = "";
    refreshSubmit();
  }

  function initSteadySelection() {
    var form = document.getElementById("reservation_form");
    if (!form) return;
    form.addEventListener("mousedown", function (event) {
      var label = event.target.closest ? event.target.closest("label") : null;
      if (!label) return;
      var input = label.control || label.querySelector('input[type="radio"], input[type="checkbox"]') || (label.htmlFor ? document.getElementById(label.htmlFor) : null);
      if (!input || input.disabled || (input.type !== "radio" && input.type !== "checkbox")) return;
      event.preventDefault();
      input.focus({ preventScroll: true });
    });
  }

  function initStepsOffset() {
    var form = document.getElementById("reservation_form");
    var nav = document.querySelector(".reservation_steps");
    if (!form || !nav) return;
    var header = null;
    var sizeWatcher = null;
    var stateWatcher = null;

    function sync() {
      if (!header) return;
      var h = Math.round(header.getBoundingClientRect().height);
      form.style.setProperty("--steps_header_h", h + "px");
      form.style.setProperty("--steps_bar_h", Math.round(nav.getBoundingClientRect().height) + "px");
      form.style.setProperty("--steps_top", (header.classList.contains("is_hidden") ? 0 : h) + "px");
    }

    function attach() {
      header = document.querySelector(".header");
      if (!header) return false;
      sync();
      if (!sizeWatcher && typeof ResizeObserver === "function") {
        sizeWatcher = new ResizeObserver(sync);
        sizeWatcher.observe(header);
        sizeWatcher.observe(nav);
      }
      if (!stateWatcher && typeof MutationObserver === "function") {
        stateWatcher = new MutationObserver(sync);
        stateWatcher.observe(header, { attributes: true, attributeFilter: ["class"] });
      }
      return true;
    }

    window.addEventListener("resize", sync);
    window.addEventListener("load", attach);
    if (attach() || typeof MutationObserver !== "function") return;
    var slot = document.querySelector(".common_header_slot") || document.body;
    var watcher = new MutationObserver(function () {
      if (attach()) watcher.disconnect();
    });
    watcher.observe(slot, { childList: true, subtree: true });
  }

  function init() {
    initStepTracking();
    initCalendar();
    initMeetingMode();
    initSteadySelection();
    initStepsOffset();
    initSubmit();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
