/**
 * Converts a form's values to a key/value pair object
 * @param formElement
 * @returns {{}}
 */
const formToObj = (formElement) => {
  const formData = new FormData(formElement);
  return Array.from(formData.entries()).reduce(
    (base, field) => ({
      ...base,
      [field[0]]: field[1],
    }),
    {},
  );
};

/**
 * Disables and adds a loading icon to all form buttons
 * @param isLoading
 */
const loading = (isLoading) => {
  document.querySelectorAll('form button').forEach((e) => {
    e.disabled = isLoading;
    if (isLoading) {
      const spinner = document.createElement('span');
      spinner.className = 'spinner-border spinner-border-sm d-inline-block ms-2';
      e.appendChild(spinner);
    } else {
      e.querySelector('span.spinner-border').remove();
    }
  });
};

/**
 * re-usable error handler for glFetch
 * @param response
 */
const glFetchErrorHandler = (response) => {
  if (response.status >= 400) {
    response.json().then((data) => {
      console.log(data);
      alert('API error response see console for more details');
    });
    throw `API error response: ${response.url}`;
  }
}

/**
 * A wrapper for fetch that triggers the loading indicator and basic error handling
 * @param input
 * @param init
 * @param returnRawResponse
 * @returns {Promise<Response>}
 */
const glFetch = (input, init, returnRawResponse = false) => {
  loading(true);
  return fetch(input, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...init,
  }).then((response) => {
    loading(false);
    // let the caller handle it
    if (returnRawResponse) return response;

    glFetchErrorHandler(response);

    return response.json();
  });
};
