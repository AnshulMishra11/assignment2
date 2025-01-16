import * as functions from 'firebase-functions';
import admin from 'firebase-admin';
import axios from 'axios';

admin.initializeApp();

export const onBookingStatusChange = functions.firestore
  .document('bookings/{bookingId}')
  .onUpdate(async (change, context) => {
    const status = change.after.data().status;

    if (status === 'finished') {
      const { name, totalBookingAmount } = change.after.data();

      const gstDetails = calculateGST(totalBookingAmount);

      const gstApiResponse = await fileGSTToAPI(name, totalBookingAmount, gstDetails);

      return gstApiResponse;
    }
    return null;
  });

const calculateGST = (amount) => {
  const GST_RATE = 18;
  const gstAmount = (amount * GST_RATE) / 100;
  const IGST = gstAmount / 2;
  const SGST_CGST = gstAmount / 2;

  return { gstAmount, IGST, SGST_CGST };
};

const fileGSTToAPI = async (name, totalBookingAmount, gstDetails) => {
  try {
    const gstApiUrl = 'https://mock-gst-api.com/file';

    const payload = {
      name,
      totalBookingAmount,
      gstAmount: gstDetails.gstAmount,
      IGST: gstDetails.IGST,
      SGST_CGST: gstDetails.SGST_CGST,
    };

    const response = await axios.post(gstApiUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('GST Filing Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in filing GST:', error);
    throw new Error('GST filing failed');
  }
};
