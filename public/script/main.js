// Tracks the data throughout the booking flow
const bookingData = {
  availability: undefined, // list of available appointments by date
  timeslot: undefined, // the user selected timeslot

  appointment: {
    // the formatted appointment object that will be used in the request to create
    key: null, // provided by the timeslot selection
    labOrderDetails: [
      // provided by the lab order step
      {
        contactName: null,
        contactPhone: null,
        labOrderFileIds: [],
      },
    ],
    paymentMethod: null, // provided by the Stripe library during the payment step
    parkingInstruction: '', // provided by the additional info step. 
  },
};

// Switches between the views for the different steps and triggers initialisation functions
const step = {
  current: 1,
  stepSetup: {
    // runs when loading the step
    2: () => initTimeslots(),
    5: () => initPayment(),
    6: () => bookAppointment(),
  },
  goto: function (stepNum) {
    document.getElementById('step-' + this.current)?.classList.add('d-none');
    document.getElementById('step-' + stepNum)?.classList.remove('d-none');
    this.stepSetup?.[stepNum]?.();
    this.current = stepNum;
  },
  next: function () {
    step.goto(this.current + 1);
  },
};
