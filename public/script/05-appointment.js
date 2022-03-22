// Create the appointment using the data collected in the previous steps
const bookAppointment = () => {
  glFetch(`/appointment`, {
    method: 'POST',
    body: JSON.stringify(bookingData.appointment),
  }).then((appointment) => {
    // display the formatted json response from the API
    document.getElementById('appointment-result').innerHTML = `<pre>${JSON.stringify(appointment, null, 2)}</pre>`;
  });
};
