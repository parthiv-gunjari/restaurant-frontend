// src/pages/admin/pos/PaymentPageWithStripe.js
import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import PaymentPage from './PaymentPage';

const stripePromise = loadStripe('pk_test_51RbF2F01yFGmy84L80DwTLIfKq8xEDCFG95g8Fh5v6VXUFlEpfieY7sna1jmIdx5gwAV8Xf6LuVAX1VZ9sgRE0o100wa7inwJh'); 

const PaymentPageWithStripe = () => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentPage />
    </Elements>
  );
};

export default PaymentPageWithStripe;