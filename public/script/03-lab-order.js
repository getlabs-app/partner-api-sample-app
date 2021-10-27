const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsBinaryString(file);
  reader.onload = () => resolve(btoa(reader.result.toString())); // convert to Base64 before returning
  reader.onerror = error => reject(error);
});

/**
 * Files need to be uploaded before making the request to create the appointment.
 * The file ID returned by the API request is used with the appointment request.
 */
const onLabOrderFileSelected = (e) => {
  const file = e.target.files[0];
  fileToBase64(file).then((data) => {
    const payload = {
      name: file.name,
      purpose: 'lab-order',
      data: data
    }
    return glFetch(`/file`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((data) => document.getElementById('lab-order-file-id').value = data.id)
  });
}

const onLabOrderFormSubmit = (e) => {
  e.preventDefault();
  const data = formToObj(e.target);
  if ((bookingData.timeslot.priority && !data.labOrderFileId)) {
    return alert('Priority timeslots must have a lab order file');
  }
  if (!data.labOrderFileId && (!data.contactName || !data.contactPhone)) {
    return alert("Either a doctor's contact information or lab order file is required");
  }

  // Update the appointment creation object with the collected details
  bookingData.appointment.labOrderDetails = [{
    "contactName": data.contactName,
    "contactPhone": data.contactPhone,
    "labOrderFileIds": data.labOrderFileId ? [data.labOrderFileId] : [],
  }];
  step.next();
}

document.getElementById('lab-order-form').addEventListener('submit', onLabOrderFormSubmit);
document.getElementById('lab-order-file').addEventListener('change', onLabOrderFileSelected);