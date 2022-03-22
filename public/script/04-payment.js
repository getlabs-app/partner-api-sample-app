// Initialise Stripe with Getlabs' test publishable key
const stripe = Stripe('pk_test_W4NDy3ANRtIwxDo4AA9iMvso00ZcUgo7LR');

const stripeData = {
  card: undefined, // the reference to the Stripe card object
  setupIntent: undefined, // the setup intent data fetched from the Getlabs' API
};

const initStripe = () => {
  const elements = stripe.elements();
  const style = {
    // style the elements in the Stripe iframe
    base: {
      color: '#32325d',
      fontFamily: 'sofia-pro, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#6c757d',
      },
    },
    invalid: {
      fontFamily: 'sofia-pro, sans-serif',
      color: '#fa755a',
      iconColor: '#fa755a',
    },
  };
  stripeData.card = elements.create('card', { style: style });
  stripeData.card.mount('#card-element'); // Stripe injects an iframe into the DOM with the credit card form
};

/**
 * Pass the Stripe card object and the Getlabs' API setup intent client secret to Stripe in order to confirm the card.
 * If it is valid update the appointment creation object with the collected details and continue to the next step.
 */
const confirmCardSetup = function (card, clientSecret) {
  loading(true);
  stripe
    .confirmCardSetup(clientSecret, {
      payment_method: {
        card: card,
      },
    })
    .then(function (result) {
      loading(false);
      if (result.error) {
        alert(result.error.message);
      } else {
        bookingData.appointment.paymentMethod = result.setupIntent.payment_method;
        step.next();
      }
    });
};

const onPaymentFormSubmit = (e) => {
  e.preventDefault();
  confirmCardSetup(stripeData.card, stripeData.setupIntent.clientSecret);
};

// Get the Stripe setup intent from the Getlabs' API and initialise Stripe
const initPayment = () => {
  glFetch('/payment/setup', {
    method: 'POST',
  }).then((setupIntent) => (stripeData.setupIntent = setupIntent));
  initStripe();
};

document.getElementById('payment-form').addEventListener('submit', onPaymentFormSubmit);
