const initTimeslots = () => {
  populateDaySelectMenu();
  selectFirstDayWithAppointments();
}

const selectTimeslot = (timeslot) => {
  bookingData.timeslot = timeslot; // referenced in the lab order step to see if a priority timeslot was selected
  bookingData.appointment.key = timeslot.key; // update the appointment creation object with the selected key
  if (timeslot.priority) {
    alert('This is a priority timeslot, a lab order must be uploaded.');
  }
  step.next();
}

// Add options to the select menu to allow toggling between different days
const populateDaySelectMenu = () => {
  const availability = bookingData.availability;

  const daySelect = document.getElementById('timeslot-day-select');
  daySelect.innerHTML = '';

  // populate the select menu with each day to allow switching between them
  availability.data.forEach((day, index) => {
    const option = document.createElement('option');
    option.value = index;

    // disable the day if it has no timeslots or no available timeslots
    option.disabled = day.slots.length === 0 || !Boolean(day.slots.find((slot) => slot.available > 0));

    // format the displayed date to the appointment location's timezone, otherwise the browser will assume UTC
    option.innerText = luxon.DateTime.fromISO(day.date, { zone: availability.tz }).setLocale('en-US').toFormat('DDDD ZZZZ');
    daySelect.appendChild(option);
  });
}

const selectFirstDayWithAppointments = () => {
  const firstEnabledOption = document.getElementById('timeslot-day-select').querySelector('option:enabled');
  if (!firstEnabledOption) {
    return alert(`No appointments available in the next ${bookingData.availability.data.length} days`)
  }
  showTimeslotsForDay(bookingData.availability.data[firstEnabledOption.value]);
}

const createTimeslotElement = (timeslot) => {
  // formats the timeslots to the appointment location's timezone
  const formatTime = (dateString) => new Intl.DateTimeFormat('en-US', {
    timeStyle: 'short',
    timeZone: bookingData.availability.tz
  }).format(new Date(dateString));

  const column = document.createElement('div');
  column.className = 'col';

  const button = document.createElement('button');
  button.className = 'btn btn-dark w-100 text-nowrap';

  // add an icon to indicate if the timeslot is a priority slot
  button.innerHTML = `<b>${formatTime(timeslot.start)} - ${formatTime(timeslot.end)}</b>${timeslot.priority ? ' ⚡' : ''}<br> $${(timeslot.price / 100).toFixed(2)}`;
  button.addEventListener('click', () => selectTimeslot(timeslot));

  // if the timeslot has no available appointments disable it
  if (!timeslot.key) {
    button.disabled = true;
  }

  column.appendChild(button);
  return column;
}

// Show a grid of timeslots for a given day
const showTimeslotsForDay = (day) => {
  const timeslotContainer = document.getElementById('timeslot-container');
  timeslotContainer.innerHTML = '';
  day.slots.forEach((slot) => {
    timeslotContainer.appendChild(createTimeslotElement(slot));
  });
}

const onTimeslotDayChange = (data) => {
  showTimeslotsForDay(bookingData.availability.data[data.target.value]);
}

document.getElementById('timeslot-day-select').addEventListener('change', onTimeslotDayChange);