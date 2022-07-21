const onAdditionalInfoSubmit = (e) => {
  e.preventDefault();
  const data = formToObj(e.target);
  bookingData.appointment.parkingInstruction = data.parkingInstruction;
  step.next();
};

document.getElementById('additional-info-form').addEventListener('submit', onAdditionalInfoSubmit);

