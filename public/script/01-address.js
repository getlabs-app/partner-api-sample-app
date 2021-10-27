// Query the API for appointment availability at the requested address
const fetchAvailability = (address) => {
  const params = new URLSearchParams({
    ...address,
    days: 14,
    from: new Date().toISOString().split('T')[0]
  }).toString();

  return glFetch(`/availability?${params}`, {method: "GET"});
}

const onAddressFormSubmit = (e) => {
  e.preventDefault();
  const data = formToObj(e.target);
  fetchAvailability(data)
    .then((data) => {
      if (!data.serviceable) { // Getlabs does not yet service this zip code
        alert('Address is not serviceable');
      } else {
        bookingData.availability = data;
        step.next();
      }
    });
}

document.getElementById('address-form').addEventListener('submit', onAddressFormSubmit);
